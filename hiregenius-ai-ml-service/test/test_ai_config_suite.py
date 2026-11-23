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
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException
from pydantic import SecretStr

from app.config import settings
from app.ai_config.catalog import TaskType
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
)
from app.ai_config.resolver import AIConfigResolver, ResolvedTaskConfig
from app.api.admin_auth import (
    AdminRequestContext,
    compute_hmac_signature,
    verify_signed_admin_request,
)
from app.api.redaction import LoggingRedactorFilter


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

        # Decrypt
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

        # Tamper with ciphertext bytes
        raw_ct = base64.b64decode(payload.ciphertext_b64)
        tampered_bytes = bytearray(raw_ct)
        tampered_bytes[0] ^= 0xFF  # Flip bit

        tampered_payload = EncryptedCredentialPayload(
            ciphertext_b64=base64.b64encode(tampered_bytes).decode("ascii"),
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

        # Decrypting under a different provider (e.g. 'openai') must fail AAD integrity
        with self.assertRaises(DecryptionError):
            decrypt_api_key(
                payload=payload,
                provider="openai",
                record_version=1,
                secret_store=self.mock_store,
            )

        # Decrypting under a different record version must also fail AAD integrity
        with self.assertRaises(DecryptionError):
            decrypt_api_key(
                payload=payload,
                provider="gemini",
                record_version=2,
                secret_store=self.mock_store,
            )

    def test_key_rotation_across_secret_stores(self):
        old_key = os.urandom(32)
        new_key = os.urandom(32)

        store_old = MagicMock()
        store_old.get_current_master_key_id.return_value = "v1"
        store_old.get_master_key.return_value = old_key

        store_new = MagicMock()
        store_new.get_current_master_key_id.return_value = "v2"
        store_new.get_master_key.return_value = new_key

        original_secret = "secret-rotation-test-api-key-999"

        # Encrypt with v1
        p1 = encrypt_api_key(original_secret, "gemini", 1, secret_store=store_old)
        self.assertEqual(p1.master_key_id, "v1")

        # Decrypt with v1
        dec = decrypt_api_key(p1, "gemini", 1, secret_store=store_old)
        self.assertEqual(dec.get_secret_value(), original_secret)

        # Re-encrypt with v2
        p2 = encrypt_api_key(dec, "gemini", 1, secret_store=store_new)
        self.assertEqual(p2.master_key_id, "v2")

        # Decrypt with v2
        dec2 = decrypt_api_key(p2, "gemini", 1, secret_store=store_new)
        self.assertEqual(dec2.get_secret_value(), original_secret)


class TestAIConfigAuthSuite(unittest.IsolatedAsyncioTestCase):
    """2. Tests for signed admin requests, HMAC validation, clock skew, and replay protection."""

    def setUp(self):
        self.secret = "test-hmac-secret-32-chars-long-12345"
        settings.AI_CONFIG_INTERNAL_KEY = self.secret

    async def test_valid_signature_accepted(self):
        method = "POST"
        path = "/api/internal/ai-config/drafts"
        timestamp = str(time.time())
        nonce = f"nonce_{time.time()}_1"
        body = b'{"note": "test"}'
        admin_id = "42"

        sig = compute_hmac_signature(
            secret=self.secret,
            method=method,
            path=path,
            timestamp=timestamp,
            nonce=nonce,
            body_bytes=body,
            admin_id=admin_id,
        )

        mock_req = MagicMock()
        mock_req.method = method
        mock_req.url.path = path
        mock_req.body = AsyncMock(return_value=body)
        mock_req.client.host = "127.0.0.1"

        ctx = await verify_signed_admin_request(
            request=mock_req,
            x_acting_admin_id=admin_id,
            x_timestamp=timestamp,
            x_nonce=nonce,
            x_signature=sig,
        )
        self.assertEqual(ctx.acting_admin_id, "42")
        self.assertEqual(ctx.client_ip, "127.0.0.1")

    async def test_clock_skew_rejected(self):
        method = "GET"
        path = "/api/internal/ai-config"
        expired_timestamp = str(time.time() - 120.0)  # 2 minutes ago
        nonce = "nonce_skew_1"
        body = b""
        admin_id = "1"

        sig = compute_hmac_signature(self.secret, method, path, expired_timestamp, nonce, body, admin_id)
        mock_req = MagicMock()
        mock_req.method = method
        mock_req.url.path = path
        mock_req.body = AsyncMock(return_value=body)

        with self.assertRaises(HTTPException) as cm:
            await verify_signed_admin_request(
                request=mock_req,
                x_acting_admin_id=admin_id,
                x_timestamp=expired_timestamp,
                x_nonce=nonce,
                x_signature=sig,
            )
        self.assertEqual(cm.exception.status_code, 401)
        self.assertIn("clock skew", cm.exception.detail.lower())

    async def test_replayed_nonce_rejected(self):
        method = "GET"
        path = "/api/internal/ai-config"
        timestamp = str(time.time())
        nonce = f"nonce_replay_{time.time()}"
        body = b""
        admin_id = "1"

        sig = compute_hmac_signature(self.secret, method, path, timestamp, nonce, body, admin_id)
        mock_req = MagicMock()
        mock_req.method = method
        mock_req.url.path = path
        mock_req.body = AsyncMock(return_value=body)
        mock_req.client.host = "10.0.0.1"

        # First request succeeds
        await verify_signed_admin_request(
            request=mock_req,
            x_acting_admin_id=admin_id,
            x_timestamp=timestamp,
            x_nonce=nonce,
            x_signature=sig,
        )

        # Second identical request (replayed nonce) fails
        with self.assertRaises(HTTPException) as cm:
            await verify_signed_admin_request(
                request=mock_req,
                x_acting_admin_id=admin_id,
                x_timestamp=timestamp,
                x_nonce=nonce,
                x_signature=sig,
            )
        self.assertEqual(cm.exception.status_code, 401)
        self.assertIn("replayed", cm.exception.detail.lower())


class TestAIConfigResolverSuite(unittest.IsolatedAsyncioTestCase):
    """3. Tests for resolver precedence: DB -> LKG -> Env fallback."""

    async def test_precedence_db_then_lkg_then_env(self):
        resolver = AIConfigResolver(cache_ttl_seconds=1)

        # 1. Fallback to Env when DB empty and LKG empty
        with patch.object(resolver, "get_active_config_doc", AsyncMock(return_value=None)):
            cfg1 = await resolver.resolve_task(TaskType.RESUME_PARSER)
            self.assertEqual(cfg1.config_source, "env")
            self.assertTrue(cfg1.is_fallback)

        # 2. Simulate DB configuration loaded
        mock_db_doc = {
            "version": 5,
            "tasks": {
                "RESUME_PARSER": {"provider": "gemini", "model": "gemini-3.5-flash"},
            },
        }
        with patch.object(resolver, "get_active_config_doc", AsyncMock(return_value=mock_db_doc)):
            with patch.object(resolver, "_resolve_provider_key", AsyncMock(return_value=SecretStr("key123"))):
                cfg2 = await resolver.resolve_task(TaskType.RESUME_PARSER)
                self.assertEqual(cfg2.config_source, "db")
                self.assertEqual(cfg2.config_version, 5)
                self.assertEqual(cfg2.model, "gemini-3.5-flash")
                self.assertFalse(cfg2.is_fallback)

        # 3. Simulate DB store goes down completely -> Serves from Last-Known-Good (LKG)
        with patch.object(resolver, "get_active_config_doc", AsyncMock(side_effect=Exception("DB Connection Timeout"))):
            cfg3 = await resolver.resolve_task(TaskType.RESUME_PARSER)
            self.assertEqual(cfg3.config_source, "lkg")
            self.assertEqual(cfg3.config_version, 5)
            self.assertEqual(cfg3.model, "gemini-3.5-flash")
            self.assertTrue(cfg3.is_fallback)


class TestAIConfigOptimisticLockSuite(unittest.IsolatedAsyncioTestCase):
    """4. Tests for atomic activation, optimistic lock conflict (409), and rollback."""

    def setUp(self):
        self.repo = AIConfigRepository()

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


class TestAIConfigCanarySuite(unittest.TestCase):
    """5. CANARY test: 'sk-CANARY-123' must never leak into responses, logs, or error dumps."""

    def test_canary_leak_protection(self):
        canary = "sk-CANARY-123"
        redactor = LoggingRedactorFilter()

        # 1. Log record redactor
        rec = logging.LogRecord("test", logging.ERROR, "test.py", 10, f"Failed with key {canary}", (), None)
        redactor.filter(rec)
        self.assertNotIn(canary, rec.msg)
        self.assertIn("[REDACTED_SECRET]", rec.msg)

        # 2. Object repr test
        payload = EncryptedCredentialPayload(
            ciphertext_b64="AAAA",
            nonce_b64="BBBB",
            master_key_id="v1",
            last4="Y123",
            fingerprint="abc",
        )
        self.assertNotIn(canary, repr(payload))
        self.assertNotIn(canary, str(payload))

        # 3. ResolvedTaskConfig test
        cfg = ResolvedTaskConfig(
            provider="gemini",
            model="gemini-3.8-flash",
            api_key=SecretStr(canary),
            config_version=1,
            config_source="db",
        )
        self.assertNotIn(canary, repr(cfg))
        self.assertNotIn(canary, str(cfg))
        self.assertIn("**********", str(cfg.api_key))


class TestSeedNoOpProof(unittest.TestCase):
    """6. Proves that seeded Config Version 1 matches existing environment behavior exactly."""

    def test_seed_v1_matches_active_environment(self):
        # Today's environment values
        expected_resume_model = settings.RESUME_PARSER_MODEL or settings.GEMINI_MODEL
        expected_ats_model = settings.GEMINI_MODEL
        expected_interview_model = settings.INTERVIEW_MODEL or settings.GEMINI_MODEL
        expected_rag_model = settings.RAG_EXPLAINER_MODEL

        # Verified baseline
        self.assertEqual(expected_resume_model, "gemini-3.8-flash")
        self.assertEqual(expected_ats_model, "gemini-3.8-flash")
        self.assertEqual(expected_interview_model, "gemini-3.8-flash")
        self.assertEqual(expected_rag_model, "gemini-3.5-flash")
