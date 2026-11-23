from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, SecretStr


class KeyValidationResult(BaseModel):
    is_valid: bool
    status_code: Optional[int] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    tested_model_count: Optional[int] = None


class BaseProviderAdapter(ABC):
    """
    Abstract Provider Adapter Interface.
    Enforces fixed hosts (no arbitrary base URLs) and clean separation of provider-specific SDKs.
    """

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique provider identifier (e.g. 'gemini', 'openai')."""
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable provider label."""
        pass

    @abstractmethod
    def validate_credential(self, api_key: SecretStr) -> KeyValidationResult:
        """
        Validate credentials with a zero-token or metadata call (e.g. list models).
        Never generates tokens or bills usage.
        """
        pass

    @abstractmethod
    def get_chat_llm(
        self,
        model_id: str,
        api_key: SecretStr,
        temperature: float = 0.0,
        timeout: int = 30,
        max_retries: int = 1,
    ) -> Any:
        """Instantiate and return a LangChain-compatible chat model for the given model & key."""
        pass
