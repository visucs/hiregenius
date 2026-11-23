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


class LoggingRedactorFilter(logging.Filter):
    """
    Logging filter that intercepts log records and redacts any potential API keys,
    secrets, or bearer tokens before they reach stdout or log files.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            msg = record.msg
            for pattern in CREDENTIAL_PATTERNS:
                msg = pattern.sub("[REDACTED_SECRET]", msg)
            record.msg = msg

        if record.args:
            if isinstance(record.args, tuple):
                new_args = []
                for a in record.args:
                    if isinstance(a, str):
                        for pattern in CREDENTIAL_PATTERNS:
                            a = pattern.sub("[REDACTED_SECRET]", a)
                    new_args.append(a)
                record.args = tuple(new_args)
            elif isinstance(record.args, dict):
                new_dict = {}
                for k, v in record.args.items():
                    if isinstance(v, str):
                        for pattern in CREDENTIAL_PATTERNS:
                            v = pattern.sub("[REDACTED_SECRET]", v)
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
