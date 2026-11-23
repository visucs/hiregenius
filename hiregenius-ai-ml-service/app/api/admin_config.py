import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, ConfigDict, Field, SecretStr

from app.ai_config.catalog import PROVIDER_MODEL_CATALOG, TaskType
from app.ai_config.crypto import encrypt_api_key
from app.ai_config.repository import (
    ConfigNotFoundError,
    OptimisticLockConflictError,
    RepositoryError,
    config_repository,
)
from app.ai_config.resolver import resolver
from app.ai_config.validator import validate_draft_configuration
from app.api.admin_auth import AdminRequestContext, verify_signed_admin_request
from app.providers.gemini import get_provider_adapter

logger = logging.getLogger("hiregenius.ai_ml_service.api.admin_config")

router = APIRouter(
    prefix="/api/internal/ai-config",
    tags=["AI Configuration Management"],
    dependencies=[Depends(verify_signed_admin_request)],
)

# ── Schemas ───────────────────────────────────────────────────────────────────

class PutCredentialRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    api_key: SecretStr = Field(..., description="Provider API key to encrypt and store")

    def __repr__(self) -> str:
        return "<PutCredentialRequest api_key=***REDACTED***>"

    def __str__(self) -> str:
        return self.__repr__()


class CreateDraftRequest(BaseModel):
    tasks: Dict[str, Dict[str, str]] = Field(
        ...,
        description="Task routing map: e.g. {'RESUME_PARSER': {'provider': 'gemini', 'model': 'gemini-3.5-flash'}}",
    )
    note: str = Field(default="", description="Description of the change")


class ActivateConfigRequest(BaseModel):
    version: int = Field(..., description="Target version number to activate")
    expected_active_version: int = Field(..., description="Current active version number for optimistic locking")
    note: str = Field(default="", description="Activation justification or release note")


class RollbackConfigRequest(BaseModel):
    target_version: int = Field(..., description="Older version number to rollback to")
    expected_active_version: int = Field(..., description="Current active version number for optimistic locking")
    reason: str = Field(default="", description="Reason for rollback")


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("", summary="Get global AI configuration, masked credentials, catalog and health")
async def get_configuration():
    """Returns active task routing, masked credentials, verified catalog, and fallback health."""
    active_config = await config_repository.get_active_config()
    if not active_config:
        active_config = await config_repository.ensure_seeded_from_current_behavior()

    credentials = await config_repository.get_all_credentials_masked()
    state = await config_repository.get_state()

    return {
        "status": "UP",
        "active_version": state.get("active_version") if state else 1,
        "active_config": active_config,
        "credentials": credentials,
        "catalog": PROVIDER_MODEL_CATALOG,
        "is_running_on_fallback": resolver.is_running_on_fallback,
    }


@router.put("/credentials/{provider}", summary="Validate, encrypt, and store a provider API key")
async def save_credential(
    body: PutCredentialRequest,
    provider: str = Path(..., description="Provider identifier (e.g. 'gemini')"),
    admin_ctx: AdminRequestContext = Depends(verify_signed_admin_request),
):
    """
    Validates the submitted key with a zero-token call. If valid, encrypts at-rest
    using AES-256-GCM and persists to MongoDB.
    """
    clean_provider = provider.lower().strip()
    try:
        adapter = get_provider_adapter(clean_provider)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # 1. Zero-token credential validation
    val_result = adapter.validate_credential(body.api_key)
    if not val_result.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Provider API key validation failed.",
                "error_code": val_result.error_code,
                "provider_error": val_result.error_message,
            },
        )

    # 2. Encrypt at rest with AES-256-GCM
    existing = await config_repository.get_credential(clean_provider)
    next_record_version = (existing.get("record_version", 0) + 1) if existing else 1

    try:
        encrypted_payload = encrypt_api_key(
            plain_key=body.api_key,
            provider=clean_provider,
            record_version=next_record_version,
        )
    except Exception as e:
        logger.error(f"Encryption error for provider {clean_provider}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to encrypt API key. Ensure AI_CONFIG_MASTER_KEY is valid.",
        )

    # 3. Store encrypted record
    await config_repository.upsert_credential(
        provider=clean_provider,
        encrypted_payload=encrypted_payload,
        record_version=next_record_version,
        admin_id=admin_ctx.acting_admin_id,
        status="HEALTHY",
    )

    # 4. Invalidate resolver runtime cache
    resolver.invalidate_cache()

    # 5. Record audit trail
    await config_repository.record_audit_event(
        event="CREDENTIAL_UPDATED",
        acting_admin_id=admin_ctx.acting_admin_id,
        client_ip=admin_ctx.client_ip,
        provider=clean_provider,
        note=f"Credential updated for {clean_provider} (last4: ***{encrypted_payload.last4})",
    )

    return {
        "status": "SUCCESS",
        "provider": clean_provider,
        "last4": encrypted_payload.last4,
        "fingerprint": encrypted_payload.fingerprint,
        "credential_status": "HEALTHY",
        "record_version": next_record_version,
    }


@router.delete("/credentials/{provider}", summary="Delete a stored provider API key")
async def delete_credential(
    provider: str = Path(...),
    admin_ctx: AdminRequestContext = Depends(verify_signed_admin_request),
):
    """Deletes stored credential record."""
    clean_provider = provider.lower().strip()
    deleted = await config_repository.delete_credential(clean_provider, admin_ctx.acting_admin_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found.")

    resolver.invalidate_cache()
    await config_repository.record_audit_event(
        event="CREDENTIAL_DELETED",
        acting_admin_id=admin_ctx.acting_admin_id,
        client_ip=admin_ctx.client_ip,
        provider=clean_provider,
        note=f"Credential deleted for {clean_provider}",
    )
    return {"status": "SUCCESS", "message": f"Credential for {clean_provider} deleted."}


@router.post("/drafts", summary="Create a new draft configuration version")
async def create_draft(
    body: CreateDraftRequest,
    admin_ctx: AdminRequestContext = Depends(verify_signed_admin_request),
):
    """Creates a new DRAFT configuration version."""
    draft_doc = await config_repository.create_draft_version(
        tasks=body.tasks,
        admin_id=admin_ctx.acting_admin_id,
        note=body.note,
    )
    await config_repository.record_audit_event(
        event="DRAFT_CREATED",
        acting_admin_id=admin_ctx.acting_admin_id,
        client_ip=admin_ctx.client_ip,
        version=draft_doc["version"],
        note=body.note,
    )
    return draft_doc


@router.post("/drafts/{version}/test", summary="Run golden test fixtures on candidate draft")
async def test_draft(
    version: int = Path(...),
    admin_ctx: AdminRequestContext = Depends(verify_signed_admin_request),
):
    """Runs golden test fixtures on candidate draft before activation."""
    target_version = await config_repository.get_version(version)
    if not target_version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Version {version} not found.")

    tasks = target_version.get("tasks", {})
    report = await validate_draft_configuration(tasks=tasks)

    await config_repository.update_draft_test_results(version, report.model_dump())
    await config_repository.record_audit_event(
        event="DRAFT_TESTED",
        acting_admin_id=admin_ctx.acting_admin_id,
        client_ip=admin_ctx.client_ip,
        version=version,
        note=f"Draft v{version} testing: all_passed={report.all_passed}",
    )

    return report.model_dump()


@router.post("/activate", summary="Atomically activate a configuration version (optimistic lock)")
async def activate_configuration(
    body: ActivateConfigRequest,
    admin_ctx: AdminRequestContext = Depends(verify_signed_admin_request),
):
    """
    Atomically activates a configuration version. Fails with 409 Conflict if expected_active_version
    does not match current active_version.
    """
    try:
        activated = await config_repository.activate_version(
            version_num=body.version,
            expected_active_version=body.expected_active_version,
            admin_id=admin_ctx.acting_admin_id,
            note=body.note,
        )
        resolver.invalidate_cache()
        await config_repository.record_audit_event(
            event="CONFIG_ACTIVATED",
            acting_admin_id=admin_ctx.acting_admin_id,
            client_ip=admin_ctx.client_ip,
            version=body.version,
            note=body.note,
        )
        return {
            "status": "SUCCESS",
            "active_version": body.version,
            "activated_config": activated,
        }
    except OptimisticLockConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ConfigNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except RepositoryError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/rollback", summary="Rollback to an older configuration (creates and activates new version)")
async def rollback_configuration(
    body: RollbackConfigRequest,
    admin_ctx: AdminRequestContext = Depends(verify_signed_admin_request),
):
    """
    Rolls back by cloning the target version into a new version and activating it.
    """
    try:
        new_active = await config_repository.rollback_to_version(
            target_version_num=body.target_version,
            expected_active_version=body.expected_active_version,
            admin_id=admin_ctx.acting_admin_id,
            reason=body.reason,
        )
        resolver.invalidate_cache()
        await config_repository.record_audit_event(
            event="CONFIG_ROLLED_BACK",
            acting_admin_id=admin_ctx.acting_admin_id,
            client_ip=admin_ctx.client_ip,
            version=new_active["version"],
            note=f"Rolled back to v{body.target_version}. Reason: {body.reason}",
        )
        return {
            "status": "SUCCESS",
            "active_version": new_active["version"],
            "config": new_active,
        }
    except OptimisticLockConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ConfigNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except RepositoryError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/history", summary="List configuration versions")
async def get_history(limit: int = Query(50, ge=1, le=100)):
    """Returns recent configuration versions."""
    return await config_repository.list_versions(limit=limit)


@router.get("/audit", summary="Get configuration audit trail (strictly zero secrets)")
async def get_audit_trail(limit: int = Query(100, ge=1, le=500)):
    """Returns recent audit trail events."""
    return await config_repository.get_audit_trail(limit=limit)
