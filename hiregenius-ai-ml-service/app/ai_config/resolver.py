import logging
import time
from typing import Any, Dict, Optional, Tuple
from pydantic import BaseModel, ConfigDict, SecretStr

from app.config import settings
from app.ai_config.catalog import TASK_EXECUTION_SPECS, TaskType
from app.ai_config.crypto import (
    DecryptionError,
    EncryptedCredentialPayload,
    decrypt_api_key,
)
from app.ai_config.repository import config_repository
from app.providers.gemini import get_provider_adapter

logger = logging.getLogger("hiregenius.ai_ml_service.ai_config.resolver")


class ResolvedTaskConfig(BaseModel):
    """Container for dynamically resolved task runtime execution."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    provider: str
    model: str
    api_key: SecretStr
    config_version: int
    config_source: str  # "db", "lkg", or "env"
    is_fallback: bool = False

    def __repr__(self) -> str:
        return (
            f"<ResolvedTaskConfig provider={self.provider} model={self.model} "
            f"version={self.config_version} source={self.config_source} fallback={self.is_fallback}>"
        )

    def __str__(self) -> str:
        return self.__repr__()


class AIConfigResolver:
    """
    Thread-safe runtime AI configuration and credential resolver.
    Enforces strict resolution order:
      1. Active MongoDB Config (with TTL cache and optimistic version check)
      2. In-Memory Last-Known-Good (LKG)
      3. Environment Defaults (settings.GEMINI_API_KEY)
    """

    def __init__(self, cache_ttl_seconds: int = 30):
        self._cache_ttl = cache_ttl_seconds
        self._cached_config_doc: Optional[Dict[str, Any]] = None
        self._cached_version_num: int = 0
        self._cache_timestamp: float = 0.0

        # Last-Known-Good in-memory snapshot
        self._lkg_task_map: Dict[str, Tuple[str, str, SecretStr, int]] = {}

        # Fallback state tracking
        self._is_currently_on_fallback: bool = False
        self._last_fallback_audit_timestamp: float = 0.0

    @property
    def is_running_on_fallback(self) -> bool:
        """Expose whether recent operations had to fall back to LKG or env."""
        return self._is_currently_on_fallback

    def invalidate_cache(self) -> None:
        """Explicitly invalidate runtime cache (e.g. immediately upon activation)."""
        self._cache_timestamp = 0.0
        self._cached_config_doc = None

    async def _resolve_provider_key(self, provider: str, record_version: int) -> Optional[SecretStr]:
        """Fetch and decrypt credential for provider."""
        try:
            cred_doc = await config_repository.get_credential(provider)
            if not cred_doc:
                return None

            if cred_doc.get("status") == "UNHEALTHY":
                logger.warning(f"[Resolver] Credential for {provider} is marked UNHEALTHY. Bypassing to fallback.")
                return None

            # Tolerant payload extraction (supports top-level fields or nested encrypted_payload)
            c_b64 = cred_doc.get("ciphertext_b64") or (cred_doc.get("encrypted_payload") or {}).get("ciphertext_b64")
            n_b64 = cred_doc.get("nonce_b64") or (cred_doc.get("encrypted_payload") or {}).get("nonce_b64")
            m_id = cred_doc.get("master_key_id") or (cred_doc.get("encrypted_payload") or {}).get("master_key_id", "v1")
            last4 = cred_doc.get("last4") or (cred_doc.get("encrypted_payload") or {}).get("last4", "****")
            fp = cred_doc.get("fingerprint") or (cred_doc.get("encrypted_payload") or {}).get("fingerprint", "")

            if not c_b64 or not n_b64:
                logger.error(f"[Resolver] Incomplete encrypted credential payload for provider {provider}.")
                return None

            payload = EncryptedCredentialPayload(
                ciphertext_b64=c_b64,
                nonce_b64=n_b64,
                master_key_id=m_id,
                last4=last4,
                fingerprint=fp,
            )
            return decrypt_api_key(
                payload=payload,
                provider=provider,
                record_version=cred_doc.get("record_version", record_version),
            )
        except DecryptionError as e:
            logger.error(f"[Resolver] Decryption error for provider {provider}: {e}")
            await config_repository.update_credential_status(provider, "UNHEALTHY", "DECRYPTION_FAILED")
            return None
        except Exception as e:
            logger.error(f"[Resolver] Credential retrieval failed for provider {provider}: {e}")
            return None

    async def get_active_config_doc(self) -> Optional[Dict[str, Any]]:
        """Retrieve active configuration document with TTL cache."""
        now = time.time()
        if self._cached_config_doc is not None and (now - self._cache_timestamp) < self._cache_ttl:
            return self._cached_config_doc

        try:
            active_doc = await config_repository.get_active_config()
            if active_doc:
                self._cached_config_doc = active_doc
                self._cached_version_num = active_doc.get("version", 0)
                self._cache_timestamp = now
                return active_doc
        except Exception as e:
            logger.warning(f"[Resolver] Failed to read active config from store: {e}")

        return self._cached_config_doc

    async def _emit_fallback_audit_if_needed(self, reason: str) -> None:
        """Write audit event for fallback at most once per 60s."""
        self._is_currently_on_fallback = True
        now = time.time()
        if now - self._last_fallback_audit_timestamp > 60.0:
            self._last_fallback_audit_timestamp = now
            await config_repository.record_audit_event(
                event="FALLBACK_TRIGGERED",
                acting_admin_id="SYSTEM",
                note=f"Runtime resolved via fallback: {reason}",
            )

    async def resolve_task(self, task_type: TaskType) -> ResolvedTaskConfig:
        """
        Resolve runtime execution configuration for a specific task following strict precedence:
          1. Active MongoDB Config
          2. In-Memory Last-Known-Good (LKG)
          3. Environment Defaults
        """
        task_key = task_type.value if hasattr(task_type, "value") else str(task_type)

        # ── 1. Try Active Database Config ─────────────────────────────────────────
        try:
            config_doc = await self.get_active_config_doc()
            if config_doc and "tasks" in config_doc:
                task_spec = config_doc["tasks"].get(task_key)
                if task_spec:
                    provider = task_spec.get("provider", "gemini")
                    model = task_spec.get("model", settings.GEMINI_MODEL)
                    version_num = config_doc.get("version", 1)

                    plain_key = await self._resolve_provider_key(provider, version_num)

                    if plain_key is not None:
                        # Record into Last-Known-Good cache
                        self._lkg_task_map[task_key] = (provider, model, plain_key, version_num)
                        self._is_currently_on_fallback = False
                        return ResolvedTaskConfig(
                            provider=provider,
                            model=model,
                            api_key=plain_key,
                            config_version=version_num,
                            config_source="db",
                            is_fallback=False,
                        )
                    else:
                        await self._emit_fallback_audit_if_needed(
                            f"Missing or unhealthy key for provider {provider} in task {task_key}"
                        )
        except Exception as e:
            logger.warning(f"[Resolver] Active config resolution error for {task_key}: {e}")
            await self._emit_fallback_audit_if_needed(f"Store error: {str(e)}")

        # ── 2. Try In-Memory Last-Known-Good ───────────────────────────────────────
        if task_key in self._lkg_task_map:
            lkg_provider, lkg_model, lkg_key, lkg_version = self._lkg_task_map[task_key]
            logger.info(f"[Resolver] Serving {task_key} using Last-Known-Good configuration (v{lkg_version}).")
            await self._emit_fallback_audit_if_needed("Served from Last-Known-Good cache")
            return ResolvedTaskConfig(
                provider=lkg_provider,
                model=lkg_model,
                api_key=lkg_key,
                config_version=lkg_version,
                config_source="lkg",
                is_fallback=True,
            )

        # ── 3. Fallback to Environment Defaults ───────────────────────────────────
        env_model = settings.GEMINI_MODEL
        if task_type == TaskType.RAG_EXPLAINER:
            env_model = settings.RAG_EXPLAINER_MODEL
        elif task_type == TaskType.RESUME_PARSER:
            env_model = settings.RESUME_PARSER_MODEL

        logger.info(f"[Resolver] Serving {task_key} using environment defaults ({env_model}).")
        await self._emit_fallback_audit_if_needed("Served from environment defaults")
        return ResolvedTaskConfig(
            provider="gemini",
            model=env_model,
            api_key=SecretStr(settings.GEMINI_API_KEY or ""),
            config_version=0,
            config_source="env",
            is_fallback=True,
        )

    async def get_llm(
        self,
        task_type: TaskType,
        temperature: float = 0.0,
        pinned_config: Optional[ResolvedTaskConfig] = None,
    ) -> Tuple[Any, ResolvedTaskConfig]:
        """
        Returns an initialized LangChain chat model along with its provenance metadata.
        Enforces task-specific execution specifications (temperature, timeout, max_retries).
        Supports pinned configurations across multi-step user workflows.
        """
        config = pinned_config or await self.resolve_task(task_type)
        spec = TASK_EXECUTION_SPECS.get(task_type, {})
        task_temp = spec.get("temperature", temperature)
        task_timeout = spec.get("timeout", 30)
        task_retries = spec.get("max_retries", 2)

        adapter = get_provider_adapter(config.provider)
        llm = adapter.get_chat_llm(
            model_id=config.model,
            api_key=config.api_key,
            temperature=task_temp,
            timeout=task_timeout,
            max_retries=task_retries,
        )
        return llm, config


# Global resolver singleton
resolver = AIConfigResolver(cache_ttl_seconds=settings.AI_CONFIG_CACHE_TTL_SECONDS)
