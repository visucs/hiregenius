import base64
import hashlib
import logging
import os
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from pydantic import BaseModel, ConfigDict, Field, SecretStr

from app.ai_config.secret_store import SecretStore, default_secret_store

logger = logging.getLogger("hiregenius.ai_ml_service.ai_config.crypto")


class CryptoError(Exception):
    """Base exception for cryptographic operations."""
    pass


class DecryptionError(CryptoError):
    """Raised when AES-256-GCM decryption fails (tampering, corrupt ciphertext, wrong key/AAD)."""
    pass


class EncryptedCredentialPayload(BaseModel):
    """
    Structured container for encrypted credential components.
    Overrides __repr__ and __str__ to never leak ciphertext details.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    ciphertext_b64: str = Field(..., description="Base64-encoded AES-256-GCM ciphertext + auth tag")
    nonce_b64: str = Field(..., description="Base64-encoded 96-bit (12-byte) initialization vector")
    master_key_id: str = Field(..., description="Identifier of the master key used to encrypt")
    last4: str = Field(..., description="Exact last 4 characters of the plain key")
    fingerprint: str = Field(..., description="First 16 chars of SHA-256 hex digest of plain key")

    def __repr__(self) -> str:
        return f"<EncryptedCredentialPayload master_key_id={self.master_key_id} last4=***{self.last4} fp={self.fingerprint}>"

    def __str__(self) -> str:
        return self.__repr__()


def compute_last4(raw_key: str) -> str:
    """Return exactly 4 characters representing the tail of the key."""
    clean = raw_key.strip()
    if len(clean) >= 4:
        return clean[-4:]
    return clean.rjust(4, "*")


def compute_fingerprint(raw_key: str) -> str:
    """Return first 16 characters of SHA-256 hex digest of the raw key."""
    clean = raw_key.strip()
    return hashlib.sha256(clean.encode("utf-8")).hexdigest()[:16]


def build_aad(provider: str, master_key_id: str, record_version: int) -> bytes:
    """Construct deterministic Additional Authenticated Data (AAD) for AES-256-GCM."""
    return f"{provider.lower().strip()}:{master_key_id}:{record_version}".encode("utf-8")


def encrypt_api_key(
    plain_key: SecretStr | str,
    provider: str,
    record_version: int,
    secret_store: Optional[SecretStore] = None,
) -> EncryptedCredentialPayload:
    """
    Encrypts a plain API key using AES-256-GCM with a random 96-bit nonce and AAD.
    Returns EncryptedCredentialPayload containing base64 components.
    """
    store = secret_store or default_secret_store
    master_key_id = store.get_current_master_key_id()
    master_key_bytes = store.get_master_key(master_key_id)

    raw_text = plain_key.get_secret_value() if isinstance(plain_key, SecretStr) else str(plain_key)
    raw_text = raw_text.strip()
    if not raw_text:
        raise CryptoError("Cannot encrypt empty API key.")

    nonce = os.urandom(12)  # 96 bits recommended for AES-GCM
    aad = build_aad(provider, master_key_id, record_version)

    try:
        aesgcm = AESGCM(master_key_bytes)
        # AESGCM.encrypt appends 16-byte authentication tag to ciphertext
        ciphertext_and_tag = aesgcm.encrypt(nonce, raw_text.encode("utf-8"), aad)
    except Exception as e:
        logger.error(f"Failed to encrypt credential for provider {provider}: {e}")
        raise CryptoError(f"Encryption failed: {e}") from e

    return EncryptedCredentialPayload(
        ciphertext_b64=base64.b64encode(ciphertext_and_tag).decode("ascii"),
        nonce_b64=base64.b64encode(nonce).decode("ascii"),
        master_key_id=master_key_id,
        last4=compute_last4(raw_text),
        fingerprint=compute_fingerprint(raw_text),
    )


def decrypt_api_key(
    payload: EncryptedCredentialPayload,
    provider: str,
    record_version: int,
    secret_store: Optional[SecretStore] = None,
) -> SecretStr:
    """
    Decrypts an EncryptedCredentialPayload using AES-256-GCM, verifying AAD and auth tag.
    Returns the plain key wrapped in SecretStr.
    Raises DecryptionError on tampering, corruption, or AAD mismatch.
    """
    store = secret_store or default_secret_store

    try:
        master_key_bytes = store.get_master_key(payload.master_key_id)
    except Exception as e:
        logger.error(f"Cannot decrypt credential: master key lookup failed ({payload.master_key_id}): {e}")
        raise DecryptionError(f"Master key unavailable: {e}") from e

    try:
        ciphertext_and_tag = base64.b64decode(payload.ciphertext_b64)
        nonce = base64.b64decode(payload.nonce_b64)
    except Exception as e:
        raise DecryptionError(f"Corrupt base64 in encrypted credential payload: {e}") from e

    if len(nonce) != 12:
        raise DecryptionError(f"Invalid nonce length: expected 12 bytes, got {len(nonce)}")

    aad = build_aad(provider, payload.master_key_id, record_version)

    try:
        aesgcm = AESGCM(master_key_bytes)
        plain_bytes = aesgcm.decrypt(nonce, ciphertext_and_tag, aad)
        decrypted_str = plain_bytes.decode("utf-8")
        return SecretStr(decrypted_str)
    except Exception as e:
        # Never log raw data or ciphertext
        logger.error(f"AES-GCM decryption failed for provider {provider} (version {record_version}): tag mismatch or corrupt payload.")
        raise DecryptionError("Decryption failed: cryptographic integrity check failed (tampered data or wrong key).") from e
