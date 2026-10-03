import unittest
from unittest.mock import patch
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.auth import verify_internal_key
from app.main import app


class TestInternalAuth(unittest.IsolatedAsyncioTestCase):
    """Unit and integration tests for service-to-service internal authentication."""

    async def test_valid_internal_key_succeeds(self):
        """Confirm valid X-Internal-Key header passes verification."""
        with patch("app.api.auth.settings.AI_ML_SERVICE_INTERNAL_KEY", "test_secret_key_123"):
            result = await verify_internal_key(x_internal_key="test_secret_key_123")
            self.assertEqual(result, "test_secret_key_123")

    async def test_missing_internal_key_raises_401(self):
        """Confirm missing X-Internal-Key header raises HTTP 401 Unauthorized."""
        with patch("app.api.auth.settings.AI_ML_SERVICE_INTERNAL_KEY", "test_secret_key_123"):
            with self.assertRaises(HTTPException) as ctx:
                await verify_internal_key(x_internal_key=None)
            self.assertEqual(ctx.exception.status_code, 401)
            self.assertIn("Missing or invalid X-Internal-Key", ctx.exception.detail)

    async def test_invalid_internal_key_raises_401(self):
        """Confirm mismatched X-Internal-Key header raises HTTP 401 Unauthorized."""
        with patch("app.api.auth.settings.AI_ML_SERVICE_INTERNAL_KEY", "test_secret_key_123"):
            with self.assertRaises(HTTPException) as ctx:
                await verify_internal_key(x_internal_key="wrong_hacker_key")
            self.assertEqual(ctx.exception.status_code, 401)
            self.assertIn("Missing or invalid X-Internal-Key", ctx.exception.detail)

    async def test_unconfigured_internal_key_raises_500(self):
        """Confirm missing server key configuration raises HTTP 500."""
        with patch("app.api.auth.settings.AI_ML_SERVICE_INTERNAL_KEY", ""):
            with self.assertRaises(HTTPException) as ctx:
                await verify_internal_key(x_internal_key="some_key")
            self.assertEqual(ctx.exception.status_code, 500)

    def test_http_endpoint_rejects_unauthenticated_request(self):
        """Integration test: request to /api/resume/{id} without X-Internal-Key returns 401."""
        client = TestClient(app)
        response = client.get("/api/resume/cand_test_auth")
        self.assertEqual(response.status_code, 401)
        self.assertIn("Missing or invalid X-Internal-Key", response.json().get("detail", ""))

    def test_health_check_remains_public_without_auth(self):
        """Integration test: /health endpoint remains publicly accessible without X-Internal-Key (does not return 401)."""
        client = TestClient(app)
        response = client.get("/health")
        # In unit tests without running live MongoDB, /health returns 503 (or 200 when live), but never 401
        self.assertNotEqual(response.status_code, 401)
        self.assertEqual(response.json().get("service"), "ai-ml-service")



if __name__ == "__main__":
    unittest.main()
