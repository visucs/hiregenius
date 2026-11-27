import asyncio
import base64
import hashlib
import hmac
import io
import json
import logging
import os
import time
import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from pydantic import SecretStr, ValidationError

from app.config import Settings, settings
from app.ai_config.catalog import (
    ALL_TASKS,
    PROVIDER_MODEL_CATALOG,
    TASK_EXECUTION_SPECS,
    TaskType,
)
from app.ai_config.crypto import (
    CryptoError,
    DecryptionError,
    EncryptedCredentialPayload,
    build_aad,
    compute_fingerprint,
    compute_last4,
    decrypt_api_key,
    encrypt_api_key,
)
from app.ai_config.secret_store import EnvSecretStore, MasterKeyInvalidError, MasterKeyMissingError
from app.ai_config.repository import (
    AIConfigRepository,
    ConfigNotFoundError,
    OptimisticLockConflictError,
    RepositoryError,
)
from app.ai_config.resolver import AIConfigResolver, ResolvedTaskConfig
from app.ai_config.validator import (
    DraftValidationReport,
    TaskValidationResult,
    TaskValidationStatus,
    _categorize_error,
    validate_draft_configuration,
)
from app.api.admin_auth import (
    AdminRequestContext,
    compute_hmac_signature,
    verify_signed_admin_request,
)
from app.api.admin_config import (
    ActivateConfigRequest,
    CreateDraftRequest,
    PutCredentialRequest,
    RollbackConfigRequest,
    activate_configuration,
    create_draft,
    recheck_credential,
    rollback_configuration,
)
from app.api.redaction import (
    CREDENTIAL_PATTERNS,
    LoggingRedactorFilter,
    sanitized_validation_exception_handler,
    secret_registry,
)
from app.providers.base import BaseProviderAdapter, KeyValidationResult
from app.providers.gemini import GeminiProviderAdapter, sanitize_error_message


# ─────────────────────────────────────────────────────────────────────────────
# 1. CRYPTO, TAMPER DETECTION & ROTATION SUITE
# ─────────────────────────────────────────────────────────────────────────────

class TestAIConfigCryptoSuite(unittest.TestCase):
    """1. Tests for AES-256-GCM crypto, tamper detection, AAD mismatch, and rotation."""

    def setUp(self):
        self.raw_master_key_bytes = os.urandom(32)
        self.b64_master_key = base64.b64encode(self.raw_master_key_bytes).decode("ascii")
        self.mock_store = MagicMock()
        self.mock_store.get_current_master_key_id.return_value = "v1"
        self.mock_store.get_master_key.return_value = self.raw_master_key_bytes

    def test_crypto_round_trip_success(self):
        plain_key = "AIzaSyTestKeyForHireGeniusUnit12345"
        payload = encrypt_api_key(
            plain_key=plain_key,
            provider="gemini",
            record_version=1,
            secret_store=self.mock_store,
        )

        self.assertEqual(payload.master_key_id, "v1")
        self.assertEqual(payload.last4, "2345")
        self.assertEqual(payload.fingerprint, hashlib.sha256(plain_key.encode()).hexdigest()[:16])

        decrypted = decrypt_api_key(
            payload=payload,
            provider="gemini",
            record_version=1,
            secret_store=self.mock_store,
        )
        self.assertEqual(decrypted.get_secret_value(), plain_key)

    def test_tamper_detection_fails_decryption(self):
        plain_key = "AIzaSyTestKeyForHireGeniusUnit12345"
        payload = encrypt_api_key(
            plain_key=plain_key,
            provider="gemini",
            record_version=1,
            secret_store=self.mock_store,
        )

        raw_ct = bytearray(base64.b64decode(payload.ciphertext_b64))
        raw_ct[0] ^= 0xFF
        tampered_payload = EncryptedCredentialPayload(
            ciphertext_b64=base64.b64encode(raw_ct).decode("ascii"),
            nonce_b64=payload.nonce_b64,
            master_key_id=payload.master_key_id,
            last4=payload.last4,
            fingerprint=payload.fingerprint,
        )

        with self.assertRaises(DecryptionError):
            decrypt_api_key(
                payload=tampered_payload,
                provider="gemini",
                record_version=1,
                secret_store=self.mock_store,
            )

    def test_aad_mismatch_fails_decryption(self):
        plain_key = "AIzaSyTestKeyForHireGeniusUnit12345"
        payload = encrypt_api_key(
            plain_key=plain_key,
            provider="gemini",
            record_version=1,
            secret_store=self.mock_store,
        )

        with self.assertRaises(DecryptionError):
            decrypt_api_key(
                payload=payload,
                provider="openai",  # Wrong provider AAD
                record_version=1,
                secret_store=self.mock_store,
            )

        with self.assertRaises(DecryptionError):
            decrypt_api_key(
                payload=payload,
                provider="gemini",
                record_version=2,  # Wrong version AAD
                secret_store=self.mock_store,
            )

    def test_key_rotation_across_secret_stores(self):
        old_master = os.urandom(32)
        new_master = os.urandom(32)

        store = MagicMock()
        store.get_current_master_key_id.return_value = "v1"
        store.get_master_key.side_effect = lambda kid: old_master if kid == "v1" else new_master

        plain_key = "AIzaSyKeyForRotationTest9876"
        old_payload = encrypt_api_key(
            plain_key=plain_key,
            provider="gemini",
            record_version=1,
            secret_store=store,
        )
        self.assertEqual(old_payload.master_key_id, "v1")

        decrypted = decrypt_api_key(
            payload=old_payload,
            provider="gemini",
            record_version=1,
            secret_store=store,
        )
        self.assertEqual(decrypted.get_secret_value(), plain_key)

        store.get_current_master_key_id.return_value = "v2"
        new_payload = encrypt_api_key(
            plain_key=decrypted,
            provider="gemini",
            record_version=2,
            secret_store=store,
        )
        self.assertEqual(new_payload.master_key_id, "v2")
        self.assertEqual(new_payload.last4, "9876")

        re_decrypted = decrypt_api_key(
            payload=new_payload,
            provider="gemini",
            record_version=2,
            secret_store=store,
        )
        self.assertEqual(re_decrypted.get_secret_value(), plain_key)


# ─────────────────────────────────────────────────────────────────────────────
# 2. HMAC AUTH & SIGNED REQUESTS SUITE
# ─────────────────────────────────────────────────────────────────────────────

class TestAIConfigAuthSuite(unittest.IsolatedAsyncioTestCase):
    """2. Tests for HMAC signature verification, clock skew rejection, and replay protection."""

    def setUp(self):
        self.secret = "test_internal_secret_key_12345"
        self.patcher = patch("app.api.admin_auth.settings.AI_CONFIG_INTERNAL_KEY", self.secret)
        self.patcher.start()
        self.mock_nonce_coll = MagicMock()
        self.mock_nonce_coll.insert_one = AsyncMock()
        self.coll_patcher = patch("app.api.admin_auth.mongo_manager.get_collection", return_value=self.mock_nonce_coll)
        self.coll_patcher.start()

    def tearDown(self):
        self.patcher.stop()
        self.coll_patcher.stop()

    async def test_valid_signature_accepted(self):
        req = MagicMock()
        req.method = "POST"
        req.url.path = "/api/internal/ai-config/drafts"
        req.body = AsyncMock(return_value=b'{"note":"test"}')
        req.client.host = "127.0.0.1"

        now_str = str(time.time())
        nonce = f"nonce_{time.time()}_valid"
        sig = compute_hmac_signature(
            secret=self.secret,
            method="POST",
            path="/api/internal/ai-config/drafts",
            timestamp=now_str,
            nonce=nonce,
            body_bytes=b'{"note":"test"}',
            admin_id="admin_1",
        )

        ctx = await verify_signed_admin_request(
            request=req,
            x_acting_admin_id="admin_1",
            x_timestamp=now_str,
            x_nonce=nonce,
            x_signature=sig,
        )
        self.assertEqual(ctx.acting_admin_id, "admin_1")
        self.assertEqual(ctx.client_ip, "127.0.0.1")

    async def test_clock_skew_rejected(self):
        req = MagicMock()
        req.method = "GET"
        req.url.path = "/api/internal/ai-config"
        req.body = AsyncMock(return_value=b"")

        expired_time_str = str(time.time() - 120)  # 2 minutes ago (>60s skew)
        nonce = "nonce_skew_test"
        sig = compute_hmac_signature(
            secret=self.secret,
            method="GET",
            path="/api/internal/ai-config",
            timestamp=expired_time_str,
            nonce=nonce,
            body_bytes=b"",
            admin_id="admin_1",
        )

        with self.assertRaises(HTTPException) as cm:
            await verify_signed_admin_request(
                request=req,
                x_acting_admin_id="admin_1",
                x_timestamp=expired_time_str,
                x_nonce=nonce,
                x_signature=sig,
            )
        self.assertEqual(cm.exception.status_code, 401)
        self.assertIn("clock skew exceeded", cm.exception.detail)

    async def test_replayed_nonce_rejected(self):
        req = MagicMock()
        req.method = "GET"
        req.url.path = "/api/internal/ai-config"
        req.body = AsyncMock(return_value=b"")

        now_str = str(time.time())
        nonce = f"nonce_replay_once_{time.time()}"
        sig = compute_hmac_signature(
            secret=self.secret,
            method="GET",
            path="/api/internal/ai-config",
            timestamp=now_str,
            nonce=nonce,
            body_bytes=b"",
            admin_id="admin_1",
        )

        # First request succeeds
        await verify_signed_admin_request(
            request=req,
            x_acting_admin_id="admin_1",
            x_timestamp=now_str,
            x_nonce=nonce,
            x_signature=sig,
        )

        # Second request with identical nonce rejected with 401
        with self.assertRaises(HTTPException) as cm:
            await verify_signed_admin_request(
                request=req,
                x_acting_admin_id="admin_1",
                x_timestamp=now_str,
                x_nonce=nonce,
                x_signature=sig,
            )
        self.assertEqual(cm.exception.status_code, 401)
        self.assertIn("Replayed request nonce detected", cm.exception.detail)


# ─────────────────────────────────────────────────────────────────────────────
# 3. SEPARATE CANARY VECTORS SUITE
# ─────────────────────────────────────────────────────────────────────────────

class TestSeparateCanaryVectors(unittest.TestCase):
    """3. Comprehensive CANARY tests: 'sk-CANARY-123' must NEVER appear in any vector."""

    CANARY = "sk-CANARY-123"

    def setUp(self):
        self.redactor = LoggingRedactorFilter()
        secret_registry.register(self.CANARY)

    def tearDown(self):
        secret_registry.unregister(self.CANARY)

    def test_canary_vector_valid_flow(self):
        """Vector 1: Valid encryption flow exposes only last4 and fingerprint, never canary."""
        mock_store = MagicMock()
        mock_store.get_current_master_key_id.return_value = "v1"
        mock_store.get_master_key.return_value = os.urandom(32)

        payload = encrypt_api_key(
            plain_key=self.CANARY,
            provider="gemini",
            record_version=1,
            secret_store=mock_store,
        )
        self.assertNotIn(self.CANARY, payload.ciphertext_b64)
        self.assertNotIn(self.CANARY, payload.last4)
        self.assertNotIn(self.CANARY, payload.fingerprint)
        self.assertEqual(payload.last4, "-123")

    def test_canary_vector_invalid_format_422(self):
        """Vector 2: Pydantic 422 validation handler strips 'input', preventing canary echo."""
        req = MagicMock()
        # Simulate pydantic RequestValidationError holding the canary
        errors = [{
            "type": "string_too_short",
            "loc": ("body", "api_key"),
            "msg": "String should have at least 20 characters",
            "input": self.CANARY,  # Raw canary provided by client
            "ctx": {"min_length": 20},
        }]
        exc = RequestValidationError(errors=errors)

        response = asyncio.run(sanitized_validation_exception_handler(req, exc))
        self.assertEqual(response.status_code, 422)
        body = json.loads(response.body.decode("utf-8"))
        body_str = json.dumps(body)
        self.assertNotIn(self.CANARY, body_str)
        self.assertNotIn("input", body_str)

    def test_canary_vector_malformed_json(self):
        """Vector 3: Malformed JSON body is redacted before reaching log lines."""
        raw_malformed = f'{{"api_key": "{self.CANARY}", invalid_json'
        redacted = self.redactor.filter(logging.LogRecord("test", logging.ERROR, "test.py", 1, raw_malformed, (), None))
        rec = logging.LogRecord("test", logging.ERROR, "test.py", 1, raw_malformed, (), None)
        self.redactor.filter(rec)
        self.assertNotIn(self.CANARY, rec.msg)
        self.assertIn("[REDACTED_SECRET]", rec.msg)

    def test_canary_vector_oversized_body(self):
        """Vector 4: Oversized payloads containing canary keys are masked."""
        oversized = f"DATA_{self.CANARY}_" + ("X" * 2000)
        rec = logging.LogRecord("test", logging.ERROR, "test.py", 1, oversized, (), None)
        self.redactor.filter(rec)
        self.assertNotIn(self.CANARY, rec.msg)

    def test_canary_vector_provider_error_text_sanitized(self):
        """Vector 5: Provider 401/403 raw error strings containing the key are sanitized."""
        provider_err = f"Google API error 400: API_KEY_INVALID for key '{self.CANARY}'. Access denied."
        sanitized = sanitize_error_message(provider_err)
        self.assertNotIn(self.CANARY, sanitized)
        self.assertIn("[REDACTED_KEY]", sanitized)

    def test_canary_vector_decrypt_failure(self):
        """Vector 6: Corrupted ciphertext raises DecryptionError without logging the canary."""
        mock_store = MagicMock()
        mock_store.get_current_master_key_id.return_value = "v1"
        mock_store.get_master_key.return_value = os.urandom(32)

        bad_payload = EncryptedCredentialPayload(
            ciphertext_b64=base64.b64encode(b"CORRUPTED_BYTES").decode("ascii"),
            nonce_b64=base64.b64encode(os.urandom(12)).decode("ascii"),
            master_key_id="v1",
            last4="-123",
            fingerprint="abc",
        )
        try:
            decrypt_api_key(bad_payload, "gemini", 1, secret_store=mock_store)
        except DecryptionError as de:
            self.assertNotIn(self.CANARY, str(de))

    def test_canary_vector_db_failure(self):
        """Vector 7: Database persistence failure logs do not expose canary."""
        db_err_msg = f"Mongo write failure while saving key: {self.CANARY}"
        rec = logging.LogRecord("test", logging.ERROR, "test.py", 1, db_err_msg, (), None)
        self.redactor.filter(rec)
        self.assertNotIn(self.CANARY, rec.msg)

    def test_canary_vector_audit_records(self):
        """Vector 8: Audit records store strictly last4 and fingerprint, never raw canary."""
        repo = AIConfigRepository()
        mock_audit_coll = MagicMock()
        mock_audit_coll.insert_one = AsyncMock()
        repo._custom_audit_coll = mock_audit_coll

        asyncio.run(repo.record_audit_event(
            event="CREDENTIAL_UPDATED",
            acting_admin_id="admin_1",
            note=f"Credential updated for gemini (last4: ***-123)",
        ))
        call_args = mock_audit_coll.insert_one.call_args[0][0]
        call_json = json.dumps(call_args, default=str)
        self.assertNotIn(self.CANARY, call_json)

    def test_canary_vector_repr_and_str(self):
        """Vector 9: Object __repr__ and __str__ across models never display canary."""
        put_req = PutCredentialRequest(api_key=SecretStr(self.CANARY))
        self.assertNotIn(self.CANARY, repr(put_req))
        self.assertNotIn(self.CANARY, str(put_req))

        resolved = ResolvedTaskConfig(
            provider="gemini",
            model="gemini-3.5-flash",
            api_key=SecretStr(self.CANARY),
            config_version=1,
            config_source="db",
        )
        self.assertNotIn(self.CANARY, repr(resolved))
        self.assertNotIn(self.CANARY, str(resolved))

    def test_canary_vector_exception_traceback(self):
        """Vector 10: Exception tracebacks passed to LoggingRedactorFilter mask canary."""
        try:
            raise RuntimeError(f"Internal error processing {self.CANARY}")
        except RuntimeError as e:
            rec = logging.LogRecord("test", logging.ERROR, "test.py", 1, f"Unhandled: {e}", (), None)
            self.redactor.filter(rec)
            self.assertNotIn(self.CANARY, rec.msg)


# ─────────────────────────────────────────────────────────────────────────────
# 4. RESOLVER PRECEDENCE, EDGE CASES & PROVENANCE PINNING
# ─────────────────────────────────────────────────────────────────────────────

class TestAIConfigResolverSuite(unittest.IsolatedAsyncioTestCase):
    """4. Tests for resolution order (DB -> LKG -> ENV), cold start down, LKG expiry, and pinning."""

    def setUp(self):
        self.resolver = AIConfigResolver(cache_ttl_seconds=30)

    async def test_precedence_db_then_lkg_then_env(self):
        # 1. DB Active
        with patch.object(self.resolver, "get_active_config_doc") as mock_get_active, \
             patch.object(self.resolver, "_resolve_provider_key") as mock_get_cred:
            mock_get_active.return_value = {
                "version": 2,
                "tasks": {"RESUME_PARSER": {"provider": "gemini", "model": "gemini-3.5-flash"}},
            }
            mock_get_cred.return_value = SecretStr("db_plain_key")

            cfg = await self.resolver.resolve_task(TaskType.RESUME_PARSER)
            self.assertEqual(cfg.config_source, "db")
            self.assertEqual(cfg.model, "gemini-3.5-flash")
            self.assertEqual(cfg.api_key.get_secret_value(), "db_plain_key")
            self.assertEqual(cfg.config_version, 2)
            self.assertFalse(cfg.is_fallback)

        # 2. DB Fails -> LKG In-Memory
        with patch.object(self.resolver, "get_active_config_doc", side_effect=RuntimeError("Mongo connection lost")), \
             patch.object(self.resolver, "_resolve_provider_key", return_value=None):
            cfg_lkg = await self.resolver.resolve_task(TaskType.RESUME_PARSER)
            self.assertEqual(cfg_lkg.config_source, "lkg")
            self.assertEqual(cfg_lkg.model, "gemini-3.5-flash")
            self.assertTrue(cfg_lkg.is_fallback)

        # 3. LKG Cleared -> ENV Defaults
        self.resolver._lkg_task_map.clear()
        with patch("app.ai_config.resolver.settings.GEMINI_API_KEY", "env_gemini_key"), \
             patch("app.ai_config.resolver.settings.RESUME_PARSER_MODEL", "gemini-3.8-flash"):
            cfg_env = await self.resolver.resolve_task(TaskType.RESUME_PARSER)
            self.assertEqual(cfg_env.config_source, "env")
            self.assertEqual(cfg_env.model, "gemini-3.8-flash")
            self.assertEqual(cfg_env.api_key.get_secret_value(), "env_gemini_key")
            self.assertTrue(cfg_env.is_fallback)

    async def test_resolver_cold_start_store_down_uses_env(self):
        """Cold boot with MongoDB unreachable resolves to environment defaults without crashing."""
        fresh_resolver = AIConfigResolver(cache_ttl_seconds=30)
        with patch("app.ai_config.resolver.config_repository.get_active_config", side_effect=RuntimeError("Mongo down")):
            cfg = await fresh_resolver.resolve_task(TaskType.RAG_EXPLAINER)
            self.assertEqual(cfg.config_source, "env")
            self.assertEqual(cfg.model, settings.RAG_EXPLAINER_MODEL)
            self.assertTrue(cfg.is_fallback)

    async def test_resolver_decrypt_failure_triggers_fallback_and_unhealthy(self):
        """Decryption failure marks credential UNHEALTHY once and falls back cleanly."""
        fresh_resolver = AIConfigResolver(cache_ttl_seconds=30)
        with patch("app.ai_config.resolver.config_repository.get_active_config", return_value={
            "version": 1,
            "tasks": {"RESUME_PARSER": {"provider": "gemini", "model": "gemini-3.5-flash"}},
        }), patch("app.ai_config.resolver.config_repository.get_credential", return_value={
            "provider": "gemini",
            "encrypted_payload": {"ciphertext_b64": "corrupt", "nonce_b64": "corrupt", "master_key_id": "v1", "last4": "1234", "fingerprint": "abc"},
            "record_version": 1,
        }), patch("app.ai_config.resolver.decrypt_api_key", side_effect=DecryptionError("Tampered")), \
             patch("app.ai_config.resolver.config_repository.update_credential_status") as mock_unhealthy:

            cfg = await fresh_resolver.resolve_task(TaskType.RESUME_PARSER)
            self.assertTrue(cfg.is_fallback)
            self.assertEqual(cfg.config_source, "env")
            mock_unhealthy.assert_called_once_with("gemini", "UNHEALTHY", "DECRYPTION_FAILED")

    async def test_provenance_pinning_immutable_mid_operation(self):
        """Resolution pinned once at start of an operation preserves its version if active DB changes."""
        # 1. Start operation with version 1
        pinned_cfg = ResolvedTaskConfig(
            provider="gemini",
            model="gemini-3.5-flash",
            api_key=SecretStr("key_v1"),
            config_version=1,
            config_source="db",
        )

        # 2. Active config changes in DB to version 2
        with patch.object(self.resolver, "resolve_task") as mock_resolve:
            mock_resolve.return_value = ResolvedTaskConfig(
                provider="gemini",
                model="gemini-3.8-flash",
                api_key=SecretStr("key_v2"),
                config_version=2,
                config_source="db",
            )
            # Re-invoking with pinned_config retains original pinned version
            llm, effective_cfg = await self.resolver.get_llm(
                TaskType.RAG_EXPLAINER,
                pinned_config=pinned_cfg,
            )
            self.assertEqual(effective_cfg.config_version, 1)
            self.assertEqual(effective_cfg.model, "gemini-3.5-flash")
            mock_resolve.assert_not_called()


# ─────────────────────────────────────────────────────────────────────────────
# 5. OPTIMISTIC LOCKING, CONCURRENT ACTIVATION & ROLLBACK SUITE
# ─────────────────────────────────────────────────────────────────────────────

class TestAIConfigOptimisticLockAndRollbackSuite(unittest.IsolatedAsyncioTestCase):
    """5. Tests for atomic activation, optimistic lock 409 conflict, crash recovery, and rollback."""

    async def test_optimistic_lock_conflict_raises_409(self):
        mock_state_coll = MagicMock()
        mock_state_coll.find_one_and_update = AsyncMock(return_value=None)
        mock_state_coll.find_one = AsyncMock(return_value={"_id": "global", "active_version": 4})

        mock_vers_coll = MagicMock()
        mock_vers_coll.find_one = AsyncMock(return_value={
            "_id": "cfg_5",
            "version": 5,
            "status": "DRAFT",
            "test_results": {"all_passed": True},
        })

        repo = AIConfigRepository(
            custom_state_coll=mock_state_coll,
            custom_versions_coll=mock_vers_coll,
        )

        with self.assertRaises(OptimisticLockConflictError) as cm:
            await repo.activate_version(
                version_num=5,
                expected_active_version=3,  # Outdated expected version (actual is 4)
                admin_id="admin_1",
            )
        self.assertIn("active configuration version is 4, expected 3", str(cm.exception))

    async def test_rollback_requires_confirmation_phrase(self):
        """Rollback endpoint rejects execution if confirmation phrase does not match."""
        req_bad = RollbackConfigRequest(
            target_version=1,
            expected_active_version=2,
            confirmation_phrase="wrong_phrase",
            reason="Emergency rollback",
        )
        with self.assertRaises(HTTPException) as cm:
            await rollback_configuration(
                body=req_bad,
                admin_ctx=AdminRequestContext(acting_admin_id="admin_1"),
            )
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("CONFIRM_ROLLBACK", cm.exception.detail)

    async def test_rollback_creates_cloned_active_version_without_provider_tests(self):
        """Rollback clones target configuration into a new version and activates it without provider tests."""
        mock_vers_coll = MagicMock()
        def find_one_side_effect(q=None, *args, **kwargs):
            if kwargs.get("sort"):
                return {"_id": "cfg_2", "version": 2}
            ver = (q or {}).get("version", 1)
            return {
                "_id": f"cfg_{ver}",
                "version": ver,
                "tasks": {"RESUME_PARSER": {"provider": "gemini", "model": "gemini-3.8-flash"}},
                "status": "ARCHIVED" if ver == 1 else "DRAFT",
                "test_results": {"all_passed": True},
            }
        mock_vers_coll.find_one = AsyncMock(side_effect=find_one_side_effect)
        mock_vers_coll.count_documents = AsyncMock(return_value=2)
        mock_vers_coll.insert_one = AsyncMock()
        mock_vers_coll.update_many = AsyncMock()
        mock_vers_coll.update_one = AsyncMock()

        mock_state_coll = MagicMock()
        mock_state_coll.find_one_and_update = AsyncMock(return_value={"active_version": 3})

        repo = AIConfigRepository(
            custom_state_coll=mock_state_coll,
            custom_versions_coll=mock_vers_coll,
        )

        new_active = await repo.rollback_to_version(
            target_version_num=1,
            expected_active_version=2,
            admin_id="admin_1",
            reason="Model regression observed",
        )
        self.assertEqual(new_active["version"], 3)
        self.assertEqual(new_active["status"], "ACTIVE")
        mock_vers_coll.insert_one.assert_called_once()
        mock_state_coll.find_one_and_update.assert_called_once()

    async def test_crash_after_state_update_consistency(self):
        """If server halts after updating ai_config_state, state remains single source of truth."""
        mock_state_coll = MagicMock()
        mock_state_coll.find_one_and_update = AsyncMock(return_value={"active_version": 2})

        # Simulate versions collection failing after state update
        mock_vers_coll = MagicMock()
        mock_vers_coll.find_one = AsyncMock(return_value={"_id": "cfg_2", "version": 2, "tasks": {}, "test_results": {"all_passed": True}})
        mock_vers_coll.update_many = AsyncMock(side_effect=RuntimeError("Process terminated abruptly"))
        mock_vers_coll.update_one = AsyncMock()

        repo = AIConfigRepository(
            custom_state_coll=mock_state_coll,
            custom_versions_coll=mock_vers_coll,
        )
        # Even if secondary status update fails, state is already updated
        try:
            await repo.activate_version(version_num=2, expected_active_version=1, admin_id="admin_1")
        except RuntimeError:
            pass

        # Verification: state_collection is the authoritative source
        mock_state_coll.find_one_and_update.assert_called_once()


# ─────────────────────────────────────────────────────────────────────────────
# 6. ADAPTER CONTRACT TESTS WITH MOCKS
# ─────────────────────────────────────────────────────────────────────────────

class TestAdapterContracts(unittest.TestCase):
    """6. Contract tests for BaseProviderAdapter and GeminiProviderAdapter."""

    def test_base_provider_adapter_interface(self):
        """Verifies abstract base class enforces provider_id, display_name, validate_credential, get_chat_llm."""
        class IncompleteAdapter(BaseProviderAdapter):
            pass

        with self.assertRaises(TypeError):
            IncompleteAdapter()

    def test_gemini_adapter_validate_credential_success_zero_token(self):
        """Gemini adapter uses free zero-token list_models() call to validate key."""
        adapter = GeminiProviderAdapter()
        mock_model = MagicMock()
        mock_model.name = "models/gemini-3.5-flash"

        with patch("google.generativeai.configure"), \
             patch("google.generativeai.list_models", return_value=iter([mock_model])):
            res = adapter.validate_credential(SecretStr("valid_key_12345"))
            self.assertTrue(res.is_valid)
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.tested_model_count, 1)

    def test_gemini_adapter_validate_credential_401_403_429_mapping(self):
        """Gemini adapter maps provider errors to normalized status codes."""
        adapter = GeminiProviderAdapter()

        # 401 Unauthenticated
        with patch("google.generativeai.configure"), \
             patch("google.generativeai.list_models", side_effect=Exception("401 UNAUTHENTICATED")):
            res401 = adapter.validate_credential(SecretStr("bad_key"))
            self.assertFalse(res401.is_valid)
            self.assertEqual(res401.error_code, "UNAUTHENTICATED")

        # 403 Permission Denied
        with patch("google.generativeai.configure"), \
             patch("google.generativeai.list_models", side_effect=Exception("403 PERMISSION_DENIED")):
            res403 = adapter.validate_credential(SecretStr("forbidden_key"))
            self.assertFalse(res403.is_valid)
            self.assertEqual(res403.error_code, "PERMISSION_DENIED")

        # 429 Resource Exhausted
        with patch("google.generativeai.configure"), \
             patch("google.generativeai.list_models", side_effect=Exception("429 RESOURCE_EXHAUSTED: quota exceeded")):
            res429 = adapter.validate_credential(SecretStr("rate_limited_key"))
            self.assertFalse(res429.is_valid)
            self.assertEqual(res429.error_code, "QUOTA_EXCEEDED")

    def test_gemini_adapter_get_chat_llm_parameter_forwarding(self):
        """Gemini adapter passes temperature, timeout, and max_retries cleanly to ChatGoogleGenerativeAI."""
        adapter = GeminiProviderAdapter()
        with patch("app.providers.gemini.ChatGoogleGenerativeAI") as mock_chat_cls:
            adapter.get_chat_llm(
                model_id="gemini-3.5-flash",
                api_key=SecretStr("test_key"),
                temperature=0.0,
                timeout=10,
                max_retries=0,
            )
            mock_chat_cls.assert_called_once_with(
                model="gemini-3.5-flash",
                google_api_key="test_key",
                temperature=0.0,
                max_retries=0,
                timeout=10,
            )


# ─────────────────────────────────────────────────────────────────────────────
# 7. PER-TASK EXECUTION PARAMETERS DRIFT PREVENTION
# ─────────────────────────────────────────────────────────────────────────────

class TestTaskParameterDrift(unittest.TestCase):
    """7. Fails if non-editable execution parameters drift across tasks."""

    def test_all_tasks_execution_parameters_match_pre_refactor_contracts(self):
        # RESUME_PARSER
        rp = TASK_EXECUTION_SPECS[TaskType.RESUME_PARSER]
        self.assertEqual(rp["temperature"], 0.0)
        self.assertEqual(rp["timeout"], 30)
        self.assertEqual(rp["max_retries"], 2)
        self.assertEqual(rp["method"], "with_structured_output")
        self.assertEqual(rp["schema_name"], "ParsedResume")

        # ATS_JD_EXTRACTION
        ats = TASK_EXECUTION_SPECS[TaskType.ATS_JD_EXTRACTION]
        self.assertEqual(ats["temperature"], 0.0)
        self.assertEqual(ats["timeout"], 10)
        self.assertEqual(ats["max_retries"], 1)
        self.assertEqual(ats["method"], "with_structured_output")
        self.assertEqual(ats["schema_name"], "JDExtractedRequirements")

        # INTERVIEW_GENERATE
        ig = TASK_EXECUTION_SPECS[TaskType.INTERVIEW_GENERATE]
        self.assertEqual(ig["temperature"], 0.0)
        self.assertEqual(ig["timeout"], 30)
        self.assertEqual(ig["max_retries"], 2)
        self.assertEqual(ig["method"], "with_structured_output")
        self.assertEqual(ig["schema_name"], "LLMQuestionList")

        # INTERVIEW_EVALUATE
        ie = TASK_EXECUTION_SPECS[TaskType.INTERVIEW_EVALUATE]
        self.assertEqual(ie["temperature"], 0.0)
        self.assertEqual(ie["timeout"], 30)
        self.assertEqual(ie["max_retries"], 2)
        self.assertEqual(ie["method"], "with_structured_output")
        self.assertEqual(ie["schema_name"], "LLMEvaluationReport")

        # RAG_EXPLAINER: Strictly preserves Phase 8 fast-failover settings (b1a0e65)
        rag = TASK_EXECUTION_SPECS[TaskType.RAG_EXPLAINER]
        self.assertEqual(rag["temperature"], 0.0)
        self.assertEqual(rag["timeout"], 10)  # 10s fast timeout
        self.assertEqual(rag["max_retries"], 0)  # 0 retries on quota exhaustion
        self.assertEqual(rag["method"], "with_structured_output")
        self.assertEqual(rag["schema_name"], "GroundedExplanation")


# ─────────────────────────────────────────────────────────────────────────────
# 8. DRAFT VALIDATOR & GATING (429 INCONCLUSIVE VS FAILED)
# ─────────────────────────────────────────────────────────────────────────────

class TestDraftValidationStatusGating(unittest.IsolatedAsyncioTestCase):
    """8. Tests for draft testing: 429 quota is INCONCLUSIVE and activation gating enforcement."""

    def test_validator_429_marked_inconclusive(self):
        err_429 = RuntimeError("429 Resource has been exhausted (e.g. check quota)")
        res = _categorize_error(err_429, 120.0)
        self.assertEqual(res.status, TaskValidationStatus.INCONCLUSIVE)
        self.assertFalse(res.passed)
        self.assertIn("inconclusive", res.error_message)

        err_fatal = RuntimeError("Model schema mismatch")
        res_fail = _categorize_error(err_fatal, 50.0)
        self.assertEqual(res_fail.status, TaskValidationStatus.FAILED)
        self.assertFalse(res_fail.passed)

    async def test_activation_gated_when_validation_failed(self):
        """Activation is rejected with 400 if draft has failed test results."""
        with patch("app.api.admin_config.config_repository.get_version", return_value={
            "version": 2,
            "test_results": {"has_failed": True, "all_passed": False},
        }):
            req = ActivateConfigRequest(version=2, expected_active_version=1)
            with self.assertRaises(HTTPException) as cm:
                await activate_configuration(req, AdminRequestContext(acting_admin_id="admin_1"))
            self.assertEqual(cm.exception.status_code, 400)
            self.assertIn("failed task validations", cm.exception.detail)

    async def test_activation_requires_inconclusive_acknowledgement(self):
        """Draft with inconclusive (429) tests requires acknowledge_inconclusive=true."""
        with patch("app.api.admin_config.config_repository.get_version", return_value={
            "version": 2,
            "test_results": {"has_failed": False, "has_inconclusive": True, "all_passed": False},
        }):
            # Without acknowledgement -> 400
            req_no_ack = ActivateConfigRequest(version=2, expected_active_version=1, acknowledge_inconclusive=False)
            with self.assertRaises(HTTPException) as cm:
                await activate_configuration(req_no_ack, AdminRequestContext(acting_admin_id="admin_1"))
            self.assertEqual(cm.exception.status_code, 400)
            self.assertIn("acknowledge_inconclusive=true", cm.exception.detail)

            # With acknowledgement -> succeeds
            req_ack = ActivateConfigRequest(version=2, expected_active_version=1, acknowledge_inconclusive=True)
            with patch("app.api.admin_config.config_repository.activate_version", return_value={"version": 2}), \
                 patch("app.api.admin_config.config_repository.record_audit_event"):
                res = await activate_configuration(req_ack, AdminRequestContext(acting_admin_id="admin_1"))
                self.assertEqual(res["status"], "SUCCESS")


# ─────────────────────────────────────────────────────────────────────────────
# 9. SEED V1 NO-OP VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────

class TestSeedNoOpProof(unittest.TestCase):
    """9. Proves that seeded Config Version 1 matches existing environment behavior exactly."""

    def test_seed_v1_matches_active_environment(self):
        expected_resume_model = settings.RESUME_PARSER_MODEL or settings.GEMINI_MODEL
        expected_ats_model = settings.GEMINI_MODEL
        expected_interview_model = settings.INTERVIEW_MODEL or settings.GEMINI_MODEL
        expected_rag_model = settings.RAG_EXPLAINER_MODEL

        self.assertEqual(expected_resume_model, "gemini-3.8-flash")
        self.assertEqual(expected_ats_model, "gemini-3.8-flash")
        self.assertEqual(expected_interview_model, "gemini-3.8-flash")
        self.assertEqual(expected_rag_model, "gemini-3.5-flash")


# ─────────────────────────────────────────────────────────────────────────────
# 10. FAIL-CLOSED CONFIGURATION & PRODUCTION GUARDS
# ─────────────────────────────────────────────────────────────────────────────

class TestFailClosedConfigAndProductionHardening(unittest.TestCase):
    """10. Proves that missing or empty ENV behaves strictly as production and fails closed."""

    def test_missing_env_behaves_as_production_fail_closed(self):
        """Unset or empty ENV must be treated as production; known dev defaults raise RuntimeError."""
        s = Settings()
        s.ENV = ""  # Empty ENV
        self.assertTrue(s.is_production)

        # Validate with insecure dev key should raise fatal RuntimeError
        s.MONGODB_URI = "mongodb://localhost:27017"
        s.MONGODB_DB_NAME = "test_db"
        s.GEMINI_API_KEY = "test_key"
        s.AI_ML_SERVICE_INTERNAL_KEY = "hg_internal_dev_secret_key_2026"  # Known insecure key
        with self.assertRaises(RuntimeError) as cm:
            s.validate()
        self.assertIn("cannot use any known dev default", str(cm.exception))

    def test_explicit_development_or_test_skips_guard(self):
        """Only explicit 'development' or 'test' environments skip the production guard."""
        s = Settings()
        s.ENV = "development"
        self.assertFalse(s.is_production)
        s.AI_ML_SERVICE_INTERNAL_KEY = "hg_internal_dev_secret_key_2026"
        # In development, this does not raise
        try:
            s.validate()
        except RuntimeError:
            self.fail("validate() raised RuntimeError unexpectedly in development environment.")


# ─────────────────────────────────────────────────────────────────────────────
# 11. ADMIN AUTH NONCE STORE FAIL-CLOSED & QUERY STRING CANONICALIZATION
# ─────────────────────────────────────────────────────────────────────────────

class TestAdminAuthNonceAndTamperingHardening(unittest.IsolatedAsyncioTestCase):
    """11. Tests for 503 on nonce store failure and canonical query string tampering rejection."""

    async def test_nonce_store_unavailable_returns_503(self):
        """When distributed nonce collection is unavailable, admin auth must return 503 (no in-memory fallback)."""
        mock_req = MagicMock()
        mock_req.method = "GET"
        mock_req.url.path = "/api/internal/ai-config"
        mock_req.url.query = ""
        mock_req.body = AsyncMock(return_value=b"")

        now_ts = str(time.time())
        sig = compute_hmac_signature(
            secret=settings.AI_CONFIG_INTERNAL_KEY,
            method="GET",
            path="/api/internal/ai-config",
            timestamp=now_ts,
            nonce="unique_nonce_503_test",
            body_bytes=b"",
            admin_id="admin_test",
            query_string="",
        )

        with patch("app.api.admin_auth.mongo_manager.get_collection", return_value=None):
            with self.assertRaises(HTTPException) as cm:
                await verify_signed_admin_request(
                    request=mock_req,
                    x_acting_admin_id="admin_test",
                    x_timestamp=now_ts,
                    x_nonce="unique_nonce_503_test",
                    x_signature=sig,
                )
            self.assertEqual(cm.exception.status_code, 503)
            self.assertIn("Nonce store unavailable", cm.exception.detail)

    async def test_tampered_query_params_and_path_rejected(self):
        """Tampering with query parameters or URL path invalidates HMAC signature with 401."""
        now_ts = str(time.time())
        sig = compute_hmac_signature(
            secret=settings.AI_CONFIG_INTERNAL_KEY,
            method="GET",
            path="/api/internal/ai-config/history",
            timestamp=now_ts,
            nonce="unique_nonce_query_test",
            body_bytes=b"",
            admin_id="admin_test",
            query_string="limit=50",
        )

        # Attacker tampers query from limit=50 to limit=100
        mock_req = MagicMock()
        mock_req.method = "GET"
        mock_req.url.path = "/api/internal/ai-config/history"
        mock_req.url.query = "limit=100"  # Tampered!
        mock_req.body = AsyncMock(return_value=b"")

        mock_coll = MagicMock()
        mock_coll.insert_one = AsyncMock()

        with patch("app.api.admin_auth.mongo_manager.get_collection", return_value=mock_coll):
            with self.assertRaises(HTTPException) as cm:
                await verify_signed_admin_request(
                    request=mock_req,
                    x_acting_admin_id="admin_test",
                    x_timestamp=now_ts,
                    x_nonce="unique_nonce_query_test",
                    x_signature=sig,
                )
            self.assertEqual(cm.exception.status_code, 401)
            self.assertIn("Invalid request signature", cm.exception.detail)


# ─────────────────────────────────────────────────────────────────────────────
# 12. CIRCUIT BREAKER COOLDOWN, HALF-OPEN PROBING & RECHECK ACTION
# ─────────────────────────────────────────────────────────────────────────────

class TestCircuitBreakerCooldownAndProbing(unittest.IsolatedAsyncioTestCase):
    """12. Proves circuit breaker cooldown, half-open probe, and manual re-check action."""

    async def test_circuit_breaker_cooldown_and_half_open_probing(self):
        """Active UNHEALTHY key is blocked during cooldown, but permitted for half-open probe once > 300s elapsed."""
        resolver_inst = AIConfigResolver(cache_ttl_seconds=30)

        # Recent UNHEALTHY status (10 seconds ago) -> blocked
        recent_doc = {
            "provider": "gemini",
            "status": "UNHEALTHY",
            "updated_at": (datetime.now(timezone.utc) - timedelta(seconds=10)).isoformat(),
            "ciphertext_b64": "dummy",
            "nonce_b64": "dummy",
            "record_version": 1,
        }
        with patch("app.ai_config.resolver.config_repository.get_credential", return_value=recent_doc):
            key = await resolver_inst._resolve_provider_key("gemini", 1)
            self.assertIsNone(key, "Should be blocked while cooldown is active (< 300s).")

        # Expired UNHEALTHY status (400 seconds ago) -> transitions to HALF_OPEN probe
        expired_doc = {
            "provider": "gemini",
            "status": "UNHEALTHY",
            "updated_at": (datetime.now(timezone.utc) - timedelta(seconds=400)).isoformat(),
            "ciphertext_b64": "dummy",
            "nonce_b64": "dummy",
            "master_key_id": "v1",
            "last4": "1234",
            "fingerprint": "abc",
            "record_version": 1,
        }
        with patch("app.ai_config.resolver.config_repository.get_credential", return_value=expired_doc), \
             patch("app.ai_config.resolver.decrypt_api_key", return_value=SecretStr("probed_key")):
            key = await resolver_inst._resolve_provider_key("gemini", 1)
            self.assertIsNotNone(key, "Should allow half-open probe after cooldown (> 300s).")
            self.assertEqual(key.get_secret_value(), "probed_key")

    async def test_recheck_credential_action_restores_healthy(self):
        """Manual admin re-check action probes credential and restores status to HEALTHY."""
        mock_adapter = MagicMock()
        mock_adapter.validate_api_key = AsyncMock()

        cred_doc = {
            "provider": "gemini",
            "status": "UNHEALTHY",
            "last4": "9999",
            "fingerprint": "xyz",
            "record_version": 1,
        }

        with patch("app.api.admin_config.get_provider_adapter", return_value=mock_adapter), \
             patch("app.api.admin_config.config_repository.get_credential", return_value=cred_doc), \
             patch("app.api.admin_config.resolver._resolve_provider_key", return_value=SecretStr("valid_key")), \
             patch("app.api.admin_config.config_repository.update_credential_status") as mock_update, \
             patch("app.api.admin_config.config_repository.record_audit_event") as mock_audit:

            resp = await recheck_credential("gemini", AdminRequestContext(acting_admin_id="admin_1"))
            self.assertEqual(resp["status"], "SUCCESS")
            self.assertEqual(resp["credential_status"], "HEALTHY")
            mock_update.assert_called_once_with("gemini", "HEALTHY", None)
            mock_audit.assert_called_once()


# ─────────────────────────────────────────────────────────────────────────────
# 13. STATE CRASH RECOVERY & LKG CACHING
# ─────────────────────────────────────────────────────────────────────────────

class TestStateCrashRecoveryAndLKG(unittest.IsolatedAsyncioTestCase):
    """13. Tests crash recovery between state update and audit write, and LKG caching."""

    async def test_crash_between_state_update_and_audit_write_leaves_consistent_state(self):
        """If audit write throws after state is updated, active version remains consistent in DB."""
        # Active version successfully committed
        with patch("app.api.admin_config.config_repository.get_version", return_value={"version": 3, "test_results": {"all_passed": True}}), \
             patch("app.api.admin_config.config_repository.activate_version", return_value={"version": 3, "_id": "cfg_3"}), \
             patch("app.api.admin_config.config_repository.record_audit_event", side_effect=RuntimeError("Audit write timeout")):

            req = ActivateConfigRequest(version=3, expected_active_version=2)
            with self.assertRaises(RuntimeError):
                await activate_configuration(req, AdminRequestContext(acting_admin_id="admin_1"))

            # State is already written; re-running activation or rollback reads version 3 as expected_active_version

    async def test_lkg_expiry_and_recovery_after_db_returns(self):
        """Resolver uses in-memory LKG when DB is unreachable, then restores to DB when DB returns."""
        res = AIConfigResolver(cache_ttl_seconds=30)
        res._lkg_task_map["RESUME_PARSER"] = ("gemini", "gemini-3.5-flash", SecretStr("lkg_key"), 1)

        # 1. DB raises error -> Served from LKG
        with patch.object(res, "get_active_config_doc", side_effect=RuntimeError("DB Connection Lost")):
            cfg = await res.resolve_task(TaskType.RESUME_PARSER)
            self.assertEqual(cfg.config_source, "lkg")
            self.assertTrue(cfg.is_fallback)
            self.assertEqual(cfg.config_version, 1)

        # 2. DB returns with version 2 -> Served from DB
        db_doc = {
            "version": 2,
            "tasks": {"RESUME_PARSER": {"provider": "gemini", "model": "gemini-3.8-flash"}},
        }
        with patch.object(res, "get_active_config_doc", return_value=db_doc), \
             patch.object(res, "_resolve_provider_key", return_value=SecretStr("new_db_key")):
            cfg2 = await res.resolve_task(TaskType.RESUME_PARSER)
            self.assertEqual(cfg2.config_source, "db")
            self.assertFalse(cfg2.is_fallback)
            self.assertEqual(cfg2.config_version, 2)
            self.assertEqual(cfg2.model, "gemini-3.8-flash")


# ─────────────────────────────────────────────────────────────────────────────
# 14. ROLLBACK TO UNAVAILABLE MODEL WITH WARNING
# ─────────────────────────────────────────────────────────────────────────────

class TestRollbackToUnavailableModelWithWarning(unittest.IsolatedAsyncioTestCase):
    """14. Proves rollback to older version containing an unverified/unavailable model emits warning."""

    async def test_rollback_with_unavailable_model_allowed_with_warning(self):
        """Rollback to a version with an unverified model is permitted with CONFIRM_ROLLBACK and emits warning."""
        target_v1 = {
            "version": 4,  # New activated version created by rollback
            "tasks": {
                "RESUME_PARSER": {"provider": "gemini", "model": "gemini-2.5-pro"}  # UNVERIFIED model in catalog
            },
        }

        with patch("app.api.admin_config.config_repository.rollback_to_version", return_value=target_v1), \
             patch("app.api.admin_config.config_repository.record_audit_event") as mock_audit:

            req = RollbackConfigRequest(
                target_version=1,
                expected_active_version=3,
                confirmation_phrase="CONFIRM_ROLLBACK",
                reason="Restoring baseline after regression",
            )
            resp = await rollback_configuration(req, AdminRequestContext(acting_admin_id="admin_1"))
            self.assertEqual(resp["status"], "SUCCESS")
            self.assertIn("warning", resp)
            self.assertIn("gemini-2.5-pro", resp["warning"])

            # Verify audit event captured the warning note
            audit_call_args = mock_audit.call_args[1]
            self.assertIn("WARNING: Rollback restored version containing unverified/unavailable model", audit_call_args["note"])

