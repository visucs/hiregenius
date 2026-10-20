import logging
from typing import Optional
from fastapi import Header, HTTPException, status
from app.config import settings

logger = logging.getLogger("hiregenius.ai_ml_service.api.auth")


async def verify_internal_key(
    x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key"),
) -> str:
    """
    FastAPI dependency that enforces internal shared-secret authentication.
    Requests between Core API and AI/ML Service must supply a matching
    X-Internal-Key header.
    """
    configured_key = settings.AI_ML_SERVICE_INTERNAL_KEY

    if not configured_key:
        logger.error("AI_ML_SERVICE_INTERNAL_KEY is not configured on AI service.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal service authentication is not configured on server.",
        )

    if not x_internal_key or x_internal_key != configured_key:
        logger.warning("Rejected unauthenticated or invalid internal request to AI service.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Missing or invalid X-Internal-Key header.",
        )

    return x_internal_key
