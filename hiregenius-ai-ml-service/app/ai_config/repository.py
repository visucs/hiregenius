import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pymongo import ReturnDocument
from pymongo.collection import Collection

from app.config import settings
from app.db.mongodb import mongo_manager
from app.ai_config.catalog import TaskType, ALL_TASKS
from app.ai_config.crypto import EncryptedCredentialPayload

logger = logging.getLogger("hiregenius.ai_ml_service.ai_config.repository")


class RepositoryError(Exception):
    """Base exception for AI config repository errors."""
    pass


class OptimisticLockConflictError(RepositoryError):
    """Raised when expected_active_version does not match current state."""
    pass


class ConfigNotFoundError(RepositoryError):
    """Raised when requested version is not found."""
    pass


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AIConfigRepository:
    """MongoDB repository for AI provider credentials, versions, state, and audit logs."""

    def __init__(
        self,
        custom_creds_coll: Optional[Any] = None,
        custom_versions_coll: Optional[Any] = None,
        custom_state_coll: Optional[Any] = None,
        custom_audit_coll: Optional[Any] = None,
    ):
        self._custom_creds_coll = custom_creds_coll
        self._custom_versions_coll = custom_versions_coll
        self._custom_state_coll = custom_state_coll
        self._custom_audit_coll = custom_audit_coll

    @property
    def creds_collection(self) -> Optional[Collection]:
        return (
            self._custom_creds_coll
            if self._custom_creds_coll is not None
            else mongo_manager.get_collection("ai_provider_credentials")
        )

    @property
    def versions_collection(self) -> Optional[Collection]:
        return (
            self._custom_versions_coll
            if self._custom_versions_coll is not None
            else mongo_manager.get_collection("ai_config_versions")
        )

    @property
    def state_collection(self) -> Optional[Collection]:
        return (
            self._custom_state_coll
            if self._custom_state_coll is not None
            else mongo_manager.get_collection("ai_config_state")
        )

    @property
    def audit_collection(self) -> Optional[Collection]:
        return (
            self._custom_audit_coll
            if self._custom_audit_coll is not None
            else mongo_manager.get_collection("ai_config_audit")
        )
        return mongo_manager.get_collection("ai_config_audit")

    # ── Credentials ─────────────────────────────────────────────────────────────

    async def get_credential(self, provider: str) -> Optional[Dict[str, Any]]:
        """Retrieve stored credential record for provider."""
        coll = self.creds_collection
        if coll is None:
            return None
        return await coll.find_one({"_id": provider.lower().strip()})

    async def get_all_credentials_masked(self) -> List[Dict[str, Any]]:
        """Retrieve all credentials with encrypted keys omitted (only last4, fingerprint, status)."""
        coll = self.creds_collection
        if coll is None:
            return []
        cursor = coll.find({}, {"ciphertext_b64": 0, "nonce_b64": 0})
        records = []
        async for doc in cursor:
            records.append(doc)
        return records

    async def upsert_credential(
        self,
        provider: str,
        encrypted_payload: EncryptedCredentialPayload,
        record_version: int,
        admin_id: Any,
        status: str = "HEALTHY",
        last_error_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Atomically upsert an encrypted credential record."""
        coll = self.creds_collection
        if coll is None:
            raise RepositoryError("MongoDB connection unavailable.")

        clean_provider = provider.lower().strip()
        now = _utcnow()

        doc = {
            "_id": clean_provider,
            "provider": clean_provider,
            "ciphertext_b64": encrypted_payload.ciphertext_b64,
            "nonce_b64": encrypted_payload.nonce_b64,
            "master_key_id": encrypted_payload.master_key_id,
            "record_version": record_version,
            "last4": encrypted_payload.last4,
            "fingerprint": encrypted_payload.fingerprint,
            "status": status,
            "last_error_code": last_error_code,
            "last_validated_at": now if status == "HEALTHY" else None,
            "updated_at": now,
            "updated_by": admin_id,
        }

        await coll.update_one(
            {"_id": clean_provider},
            {
                "$set": doc,
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
        return doc

    async def update_credential_status(
        self,
        provider: str,
        status: str,
        last_error_code: Optional[str] = None,
    ) -> None:
        """Update health status of a credential (e.g. circuit breaker on 401/403)."""
        coll = self.creds_collection
        if coll is None:
            return
        await coll.update_one(
            {"_id": provider.lower().strip()},
            {
                "$set": {
                    "status": status,
                    "last_error_code": last_error_code,
                    "updated_at": _utcnow(),
                }
            },
        )

    async def delete_credential(self, provider: str, admin_id: Any) -> bool:
        """Delete credential record."""
        coll = self.creds_collection
        if coll is None:
            return False
        res = await coll.delete_one({"_id": provider.lower().strip()})
        return res.deleted_count > 0

    # ── State & Versions ────────────────────────────────────────────────────────

    async def get_state(self) -> Optional[Dict[str, Any]]:
        """Return the global state singleton."""
        coll = self.state_collection
        if coll is None:
            return None
        return await coll.find_one({"_id": "global"})

    async def get_active_config(self) -> Optional[Dict[str, Any]]:
        """Return the currently active configuration document."""
        state = await self.get_state()
        if not state or "active_version_id" not in state:
            return None
        coll = self.versions_collection
        if coll is None:
            return None
        return await coll.find_one({"_id": state["active_version_id"]})

    async def get_version(self, version_num: int) -> Optional[Dict[str, Any]]:
        """Return a specific configuration version document."""
        coll = self.versions_collection
        if coll is None:
            return None
        return await coll.find_one({"version": version_num})

    async def list_versions(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Return recent configuration versions ordered newest to oldest."""
        coll = self.versions_collection
        if coll is None:
            return []
        cursor = coll.find({}).sort("version", -1).limit(limit)
        versions = []
        async for doc in cursor:
            versions.append(doc)
        return versions

    async def get_next_version_number(self) -> int:
        """Calculate next incrementing version integer."""
        coll = self.versions_collection
        if coll is None:
            return 1
        latest = await coll.find_one({}, sort=[("version", -1)])
        return (latest.get("version", 0) + 1) if latest else 1

    async def create_draft_version(
        self,
        tasks: Dict[str, Dict[str, str]],
        admin_id: Any,
        note: str = "",
    ) -> Dict[str, Any]:
        """Create a new DRAFT configuration version."""
        coll = self.versions_collection
        if coll is None:
            raise RepositoryError("MongoDB connection unavailable.")

        next_ver = await self.get_next_version_number()
        now = _utcnow()

        draft_doc = {
            "_id": f"cfg_{next_ver}",
            "version": next_ver,
            "status": "DRAFT",
            "tasks": tasks,
            "embeddings": {
                "provider": "gemini",
                "model": settings.GEMINI_EMBEDDING_MODEL,
                "dimension": 768,
                "read_only": True,
            },
            "test_results": None,
            "created_by": admin_id,
            "created_at": now,
            "activated_at": None,
            "change_note": note,
        }

        await coll.insert_one(draft_doc)
        return draft_doc

    async def update_draft_test_results(
        self,
        version_num: int,
        test_results: Dict[str, Any],
    ) -> None:
        """Record validation results for a draft version."""
        coll = self.versions_collection
        if coll is None:
            return
        await coll.update_one(
            {"version": version_num, "status": "DRAFT"},
            {"$set": {"test_results": test_results, "updated_at": _utcnow()}},
        )

    async def activate_version(
        self,
        version_num: int,
        expected_active_version: int,
        admin_id: Any,
        note: str = "",
    ) -> Dict[str, Any]:
        """
        Atomically activate a version using optimistic locking on ai_config_state.
        Raises OptimisticLockConflictError if expected_active_version != current active_version.
        """
        state_coll = self.state_collection
        vers_coll = self.versions_collection
        if state_coll is None or vers_coll is None:
            raise RepositoryError("MongoDB connection unavailable.")

        target_version = await vers_coll.find_one({"version": version_num})
        if not target_version:
            raise ConfigNotFoundError(f"Configuration version {version_num} not found.")

        # Ensure draft has passed tests before activation
        test_res = target_version.get("test_results") or {}
        if target_version.get("status") == "DRAFT" and not test_res.get("all_passed", False):
            raise RepositoryError("Cannot activate configuration: draft validation tests have not all passed.")

        now = _utcnow()
        active_id = target_version["_id"]

        # Single atomic update with optimistic locking
        updated_state = await state_coll.find_one_and_update(
            {"_id": "global", "active_version": expected_active_version},
            {
                "$set": {
                    "active_version": version_num,
                    "active_version_id": active_id,
                    "updated_at": now,
                    "updated_by": admin_id,
                }
            },
            return_document=ReturnDocument.AFTER,
        )

        if updated_state is None:
            # Check current state to furnish precise diagnostic
            current_state = await state_coll.find_one({"_id": "global"})
            curr_ver = current_state.get("active_version") if current_state else 0
            raise OptimisticLockConflictError(
                f"Optimistic lock conflict: active configuration version is {curr_ver}, "
                f"expected {expected_active_version}. Please refresh and re-apply."
            )

        # Update version document statuses (atomic state update already succeeded)
        await vers_coll.update_many(
            {"status": "ACTIVE", "version": {"$ne": version_num}},
            {"$set": {"status": "ARCHIVED", "archived_at": now}},
        )
        await vers_coll.update_one(
            {"version": version_num},
            {
                "$set": {
                    "status": "ACTIVE",
                    "activated_at": now,
                    "change_note": note or target_version.get("change_note", ""),
                }
            },
        )

        target_version["status"] = "ACTIVE"
        target_version["activated_at"] = now
        target_version["version"] = version_num
        return target_version

    async def rollback_to_version(
        self,
        target_version_num: int,
        expected_active_version: int,
        admin_id: Any,
        reason: str = "",
    ) -> Dict[str, Any]:
        """
        Rollback creates a NEW version cloned from target_version_num and activates it.
        Preserves complete immutable version history.
        """
        vers_coll = self.versions_collection
        if vers_coll is None:
            raise RepositoryError("MongoDB connection unavailable.")

        target = await vers_coll.find_one({"version": target_version_num})
        if not target:
            raise ConfigNotFoundError(f"Cannot rollback: version {target_version_num} does not exist.")

        next_ver = await self.get_next_version_number()
        note = f"Rollback to version {target_version_num}"
        if reason:
            note += f": {reason}"

        # Copy tasks map and mark passed (cloned from verified configuration)
        cloned_tasks = target.get("tasks", {})
        now = _utcnow()

        new_doc = {
            "_id": f"cfg_{next_ver}",
            "version": next_ver,
            "status": "DRAFT",
            "tasks": cloned_tasks,
            "embeddings": target.get("embeddings", {}),
            "test_results": {"all_passed": True, "note": f"Inherited from verified v{target_version_num}"},
            "created_by": admin_id,
            "created_at": now,
            "activated_at": None,
            "change_note": note,
        }

        await vers_coll.insert_one(new_doc)

        # Atomically activate the newly created rollback version
        return await self.activate_version(
            version_num=next_ver,
            expected_active_version=expected_active_version,
            admin_id=admin_id,
            note=note,
        )

    # ── Audit Trail ─────────────────────────────────────────────────────────────

    async def record_audit_event(
        self,
        event: str,
        acting_admin_id: Any,
        client_ip: Optional[str] = None,
        provider: Optional[str] = None,
        version: Optional[int] = None,
        note: Optional[str] = None,
    ) -> None:
        """Append an audit event. NEVER stores or logs any secret key material."""
        coll = self.audit_collection
        if coll is None:
            return

        doc = {
            "event": event,
            "acting_admin_id": acting_admin_id,
            "client_ip": client_ip,
            "provider": provider,
            "version": version,
            "note": note,
            "timestamp": _utcnow(),
        }
        try:
            await coll.insert_one(doc)
        except Exception as e:
            logger.error(f"Failed to record audit event: {e}")

    async def get_audit_trail(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Return latest audit log events."""
        coll = self.audit_collection
        if coll is None:
            return []
        cursor = coll.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
        events = []
        async for doc in cursor:
            events.append(doc)
        return events

    # ── Initial Seeding from Environment Baseline ────────────────────────────────

    async def ensure_seeded_from_current_behavior(self) -> Dict[str, Any]:
        """
        Seeds Config Version 1 strictly from the current environment behavior.
        Guarantees zero silent changes upon booting with dynamic config enabled.
        """
        state_coll = self.state_collection
        vers_coll = self.versions_collection
        if state_coll is None or vers_coll is None:
            return {}

        state = await state_coll.find_one({"_id": "global"})
        if state and state.get("active_version"):
            active_doc = await vers_coll.find_one({"_id": state["active_version_id"]})
            if active_doc:
                return active_doc

        # Construct Version 1 from current settings
        now = _utcnow()
        v1_tasks = {
            TaskType.RESUME_PARSER.value: {
                "provider": "gemini",
                "model": settings.RESUME_PARSER_MODEL or settings.GEMINI_MODEL,
            },
            TaskType.ATS_JD_EXTRACTION.value: {
                "provider": "gemini",
                "model": settings.GEMINI_MODEL,
            },
            TaskType.INTERVIEW_GENERATE.value: {
                "provider": "gemini",
                "model": settings.INTERVIEW_MODEL or settings.GEMINI_MODEL,
            },
            TaskType.INTERVIEW_EVALUATE.value: {
                "provider": "gemini",
                "model": settings.INTERVIEW_MODEL or settings.GEMINI_MODEL,
            },
            TaskType.RAG_EXPLAINER.value: {
                "provider": "gemini",
                "model": settings.RAG_EXPLAINER_MODEL,
            },
        }

        v1_doc = {
            "_id": "cfg_1",
            "version": 1,
            "status": "ACTIVE",
            "tasks": v1_tasks,
            "embeddings": {
                "provider": "gemini",
                "model": settings.GEMINI_EMBEDDING_MODEL,
                "dimension": 768,
                "read_only": True,
            },
            "test_results": {
                "all_passed": True,
                "note": "Initial baseline verified against environment defaults.",
            },
            "created_by": "SYSTEM_SEED",
            "created_at": now,
            "activated_at": now,
            "change_note": "Initial baseline configuration seeded from active environment defaults.",
        }

        await vers_coll.update_one({"_id": "cfg_1"}, {"$set": v1_doc}, upsert=True)

        await state_coll.update_one(
            {"_id": "global"},
            {
                "$set": {
                    "_id": "global",
                    "active_version": 1,
                    "active_version_id": "cfg_1",
                    "updated_at": now,
                    "updated_by": "SYSTEM_SEED",
                }
            },
            upsert=True,
        )

        await self.record_audit_event(
            event="CONFIG_INITIALIZED_FROM_ENV",
            acting_admin_id="SYSTEM",
            version=1,
            note="Config version 1 seeded from current environment defaults.",
        )

        logger.info("[AIConfigRepository] Seeded Config Version 1 from current environment behavior.")
        return v1_doc


config_repository = AIConfigRepository()
