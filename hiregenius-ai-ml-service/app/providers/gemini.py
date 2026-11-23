import logging
import re
from typing import Any
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import SecretStr

from app.providers.base import BaseProviderAdapter, KeyValidationResult

logger = logging.getLogger("hiregenius.ai_ml_service.providers.gemini")

# Sanitization regex to catch any accidental key in exceptions
API_KEY_REGEX = re.compile(r"(AIza[0-9A-Za-z-_]{35}|AQ\.[0-9A-Za-z-_]{40,}|sk-[0-9A-Za-z-_]{20,})")


def sanitize_error_message(msg: str) -> str:
    """Mask any credential-like string in an error message."""
    if not msg:
        return ""
    return API_KEY_REGEX.sub("[REDACTED_API_KEY]", msg)


class GeminiProviderAdapter(BaseProviderAdapter):
    """Production provider adapter for Google Gemini."""

    @property
    def provider_id(self) -> str:
        return "gemini"

    @property
    def display_name(self) -> str:
        return "Google Gemini"

    def validate_credential(self, api_key: SecretStr) -> KeyValidationResult:
        """Zero-token validation via genai.list_models()."""
        raw_key = api_key.get_secret_value()
        if not raw_key or not raw_key.strip():
            return KeyValidationResult(
                is_valid=False,
                error_code="EMPTY_KEY",
                error_message="API key cannot be empty.",
            )

        try:
            genai.configure(api_key=raw_key)
            # Fetch at least one model from generator to verify auth
            models_iter = genai.list_models()
            first_model = next(iter(models_iter), None)
            return KeyValidationResult(
                is_valid=True,
                status_code=200,
                tested_model_count=1 if first_model else 0,
            )
        except Exception as e:
            raw_err = str(e)
            sanitized = sanitize_error_message(raw_err)
            err_code = "UNKNOWN_ERROR"
            status_code = 500

            if "API_KEY_INVALID" in raw_err or "400" in raw_err or "API key not valid" in raw_err:
                err_code = "INVALID_API_KEY"
                status_code = 400
            elif "401" in raw_err or "UNAUTHENTICATED" in raw_err:
                err_code = "UNAUTHENTICATED"
                status_code = 401
            elif "403" in raw_err or "PERMISSION_DENIED" in raw_err:
                err_code = "PERMISSION_DENIED"
                status_code = 403
            elif "429" in raw_err or "RESOURCE_EXHAUSTED" in raw_err or "quota" in raw_err.lower():
                err_code = "QUOTA_EXCEEDED"
                status_code = 429

            logger.warning(f"[GeminiAdapter] Key validation failed with {err_code}: {sanitized}")
            return KeyValidationResult(
                is_valid=False,
                status_code=status_code,
                error_code=err_code,
                error_message=f"Gemini API verification failed: {err_code}",
            )

    def get_chat_llm(
        self,
        model_id: str,
        api_key: SecretStr,
        temperature: float = 0.0,
        timeout: int = 30,
        max_retries: int = 1,
    ) -> Any:
        """Instantiate ChatGoogleGenerativeAI with explicit fixed Google hosts."""
        clean_model = model_id.strip()
        if clean_model.startswith("models/"):
            clean_model = clean_model.replace("models/", "", 1)

        return ChatGoogleGenerativeAI(
            model=clean_model,
            google_api_key=api_key.get_secret_value(),
            temperature=temperature,
            timeout=timeout,
            max_retries=max_retries,
        )


gemini_adapter = GeminiProviderAdapter()

# Adapter registry
PROVIDER_ADAPTERS = {
    "gemini": gemini_adapter,
}


def get_provider_adapter(provider: str) -> BaseProviderAdapter:
    """Return adapter for provider or raise ValueError."""
    clean = provider.lower().strip()
    if clean not in PROVIDER_ADAPTERS:
        raise ValueError(f"Unsupported AI provider: '{provider}'. Available: {list(PROVIDER_ADAPTERS.keys())}")
    return PROVIDER_ADAPTERS[clean]
