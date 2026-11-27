import base64
import logging
from abc import ABC, abstractmethod
from typing import Optional
from app.config import settings

logger = logging.getLogger("hiregenius.ai_ml_service.ai_config.secret_store")


class SecretStoreError(Exception):
    """Base exception for secret store failures."""
    pass


class MasterKeyMissingError(SecretStoreError):
    """Raised when master key is requested but not configured."""
    pass


class MasterKeyInvalidError(SecretStoreError):
    """Raised when master key format or byte length is invalid."""
    pass


class SecretStore(ABC):
    """Abstract interface for master key management (pluggable with AWS KMS/Secrets Manager later)."""

    @abstractmethod
    def get_current_master_key_id(self) -> str:
        """Return the current active master key identifier."""
        pass

    @abstractmethod
    def get_master_key(self, master_key_id: Optional[str] = None) -> bytes:
        """
        Return the 32-byte AES-256 key for the given master_key_id.
        If master_key_id is None, return the current active master key.
        """
        pass


class EnvSecretStore(SecretStore):
    """
    Default SecretStore implementation reading AI_CONFIG_MASTER_KEY from environment.
    Supports a single master key (id: 'v1').
    """

    DEFAULT_KEY_ID = "v1"

    def __init__(self, key_id: str = DEFAULT_KEY_ID):
        self._key_id = key_id

    def get_current_master_key_id(self) -> str:
        return self._key_id

    def get_master_key(self, master_key_id: Optional[str] = None) -> bytes:
        target_id = master_key_id or self._key_id
        if target_id != self._key_id:
            raise MasterKeyInvalidError(f"Unknown master_key_id: {target_id}")

        raw_b64 = settings.AI_CONFIG_MASTER_KEY.strip() if settings.AI_CONFIG_MASTER_KEY else ""
        if not raw_b64:
            raise MasterKeyMissingError(
                "AI_CONFIG_MASTER_KEY is not configured in environment. "
                "At-rest credential encryption is unavailable. Please set a 32-byte base64 key."
            )

        try:
            decoded = base64.b64decode(raw_b64)
            if len(decoded) != 32:
                raise MasterKeyInvalidError(
                    f"AI_CONFIG_MASTER_KEY must decode to exactly 32 bytes (got {len(decoded)} bytes)."
                )
            return decoded
        except Exception as e:
            if isinstance(e, SecretStoreError):
                raise
            raise MasterKeyInvalidError(f"Failed to decode AI_CONFIG_MASTER_KEY base64: {e}") from e


# Singleton instance
default_secret_store = EnvSecretStore()
