import hashlib
import hmac
import logging
import time
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional
from fastapi import Header, HTTPException, Request, status
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError

from app.config import settings
from app.db.mongodb import mongo_manager

logger = logging.getLogger("hiregenius.ai_ml_service.api.admin_auth")

# In-memory fast cache for active nonces within the single instance
_NONCE_STORE: Dict[str, float] = {}


def canonicalize_query_string(query_string: str) -> str:
    """Normalize and sort query parameters alphabetically for canonical request signing."""
    if not query_string:
        return ""
    q = query_string.lstrip("?")
    if not q:
        return ""
    pairs = urllib.parse.parse_qsl(q, keep_blank_values=True)
    sorted_pairs = sorted(pairs, key=lambda kv: (kv[0], kv[1]))
    return "?" + urllib.parse.urlencode(sorted_pairs)


def _cleanup_expired_nonces(now: float) -> None:
    """Evict expired nonces to maintain bounded memory."""
    expired = [k for k, exp in _NONCE_STORE.items() if exp < now]
    for k in expired:
        _NONCE_STORE.pop(k, None)


class AdminRequestContext(BaseModel):
    acting_admin_id: str
    client_ip: Optional[str] = None


def compute_hmac_signature(
    secret: str,
    method: str,
    path: str,
    timestamp: str,
    nonce: str,
    body_bytes: bytes,
    admin_id: str,
    query_string: str = "",
) -> str:
    """
    Construct canonical payload and compute HMAC-SHA256 signature:
    canonical = method + path + canonical_query + timestamp + nonce + sha256(body) + admin_id
    """
    body_sha256 = hashlib.sha256(body_bytes).hexdigest()
    canonical_query = canonicalize_query_string(query_string)
    canonical = f"{method.upper()}{path}{canonical_query}{timestamp}{nonce}{body_sha256}{admin_id}"
    return hmac.new(
        secret.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


async def verify_signed_admin_request(
    request: Request,
    x_acting_admin_id: Optional[str] = Header(None, alias="X-Acting-Admin-Id"),
    x_timestamp: Optional[str] = Header(None, alias="X-Timestamp"),
    x_nonce: Optional[str] = Header(None, alias="X-Nonce"),
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
) -> AdminRequestContext:
    """
    FastAPI dependency that enforces cryptographically signed admin requests.
    Validates:
      1. Mandatory headers present
      2. Max clock skew <= 60 seconds
      3. Replay attack prevention (fail-closed distributed MongoDB nonces; returns 503 if store down)
      4. Constant-time HMAC-SHA256 signature verification over request method, path, query, body, and admin ID
    """
    secret = settings.AI_CONFIG_INTERNAL_KEY
    if not secret:
        logger.error("AI_CONFIG_INTERNAL_KEY is not configured on server.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin configuration authentication is not configured on server.",
        )

    if not x_acting_admin_id or not x_timestamp or not x_nonce or not x_signature:
        logger.warning("[AdminAuth] Missing required signature headers.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Missing signed request headers (X-Acting-Admin-Id, X-Timestamp, X-Nonce, X-Signature).",
        )

    now = time.time()
    _cleanup_expired_nonces(now)

    # 1. Clock skew validation
    try:
        req_time = float(x_timestamp)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: X-Timestamp must be a numeric epoch timestamp.",
        )

    max_skew = float(settings.AI_CONFIG_SIGNATURE_MAX_SKEW_SECONDS)
    if abs(now - req_time) > max_skew:
        logger.warning(f"[AdminAuth] Clock skew exceeded: abs({now} - {req_time}) > {max_skew}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unauthorized: Request timestamp expired or clock skew exceeded (> {int(max_skew)}s).",
        )

    # 2. Distributed Replay Attack Check (Strict Fail-Closed: returns 503 if store down)
    if x_nonce in _NONCE_STORE:
        logger.warning(f"[AdminAuth] Replay attack detected for nonce {x_nonce[:8]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Replayed request nonce detected.",
        )

    mongo_coll = mongo_manager.get_collection("ai_config_nonces")
    if mongo_coll is None:
        logger.error("[AdminAuth] Distributed nonce store unavailable: MongoDB collection is None.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service Unavailable: Nonce store unavailable. Admin operations require active distributed persistence.",
        )

    try:
        exp_dt = datetime.now(timezone.utc) + timedelta(seconds=max_skew * 2)
        await mongo_coll.insert_one({"nonce": x_nonce, "expires_at": exp_dt})
    except DuplicateKeyError:
        logger.warning(f"[AdminAuth] MongoDB distributed replay attack detected for nonce {x_nonce[:8]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Replayed request nonce detected.",
        )
    except Exception as e:
        logger.error(f"[AdminAuth] Nonce store failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service Unavailable: Nonce store persistence failure.",
        )

    # Record in L1 cache with TTL
    _NONCE_STORE[x_nonce] = now + (max_skew * 2)

    # 3. Read body bytes
    body_bytes = await request.body()

    # 4. Canonical signature verification (method + path + query + timestamp + nonce + body_hash + admin_id)
    raw_query = str(request.url.query) if hasattr(request.url, "query") and isinstance(request.url.query, str) else ""
    expected_sig = compute_hmac_signature(
        secret=secret,
        method=request.method,
        path=request.url.path,
        timestamp=x_timestamp,
        nonce=x_nonce,
        body_bytes=body_bytes,
        admin_id=x_acting_admin_id,
        query_string=raw_query,
    )

    if not hmac.compare_digest(expected_sig.lower(), x_signature.strip().lower()):
        logger.warning("[AdminAuth] HMAC-SHA256 signature verification failed.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid request signature.",
        )

    client_ip = None
    if request.client and isinstance(getattr(request.client, "host", None), str):
        client_ip = request.client.host
    return AdminRequestContext(acting_admin_id=x_acting_admin_id, client_ip=client_ip)
