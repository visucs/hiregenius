import logging
import re
from typing import Any
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# Regex to catch API keys, tokens, and authorization headers
CREDENTIAL_PATTERNS = [
    re.compile(r"AIza[0-9A-Za-z-_]{20,}"),
    re.compile(r"AQ\.[0-9A-Za-z-_]{20,}"),
    re.compile(r"sk-[0-9A-Za-z-_]{6,}"),
    re.compile(r"Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_=]*"),
]


class SecretRegistry:
    """Runtime registry of exact sensitive strings (master keys, internal keys, stored API keys) to mask."""

    def __init__(self):
        self._exact_secrets = set()

    def register(self, secret: Any) -> None:
        if not secret:
            return
        if hasattr(secret, "get_secret_value"):
            s = secret.get_secret_value()
        else:
            s = str(secret)
        s_clean = s.strip()
        if len(s_clean) >= 4:
            self._exact_secrets.add(s_clean)

    def unregister(self, secret: Any) -> None:
        if not secret:
            return
        if hasattr(secret, "get_secret_value"):
            s = secret.get_secret_value()
        else:
            s = str(secret)
        self._exact_secrets.discard(s.strip())

    def redact(self, text: str) -> str:
        if not isinstance(text, str):
            return text
        # 1. Mask exact registered secrets
        for s in list(self._exact_secrets):
            if s and s in text:
                text = text.replace(s, "[REDACTED_SECRET]")
        # 2. Mask pattern matches
        for pattern in CREDENTIAL_PATTERNS:
            text = pattern.sub("[REDACTED_SECRET]", text)
        return text


# Global secret registry singleton
secret_registry = SecretRegistry()


class LoggingRedactorFilter(logging.Filter):
    """
    Logging filter that intercepts log records and redacts any potential API keys,
    secrets, or bearer tokens before they reach stdout or log files.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = secret_registry.redact(record.msg)

        if record.args:
            if isinstance(record.args, tuple):
                new_args = []
                for a in record.args:
                    if isinstance(a, str):
                        a = secret_registry.redact(a)
                    new_args.append(a)
                record.args = tuple(new_args)
            elif isinstance(record.args, dict):
                new_dict = {}
                for k, v in record.args.items():
                    if isinstance(v, str):
                        v = secret_registry.redact(v)
                    new_dict[k] = v
                record.args = new_dict

        return True


async def sanitized_validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Custom 422 validation exception handler that STRICTLY strips the 'input' field
    from all validation errors. This prevents unvalidated or malformed API keys
    from ever echoing back in error responses.
    """
    sanitized_errors = []
    for err in exc.errors():
        # Only retain loc, msg, type; deliberately omit 'input' and 'ctx'
        sanitized_errors.append(
            {
                "loc": err.get("loc"),
                "msg": err.get("msg"),
                "type": err.get("type"),
            }
        )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": sanitized_errors},
    )
