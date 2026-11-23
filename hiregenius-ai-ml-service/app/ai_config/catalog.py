"""
Server-side Model Catalog for HireGenius AI Configuration.

All catalog entries and capability flags are verified against real provider endpoints.
The catalog provides options only: it NEVER dictates task defaults.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TaskType(str, Enum):
    RESUME_PARSER = "RESUME_PARSER"
    ATS_JD_EXTRACTION = "ATS_JD_EXTRACTION"
    INTERVIEW_GENERATE = "INTERVIEW_GENERATE"
    INTERVIEW_EVALUATE = "INTERVIEW_EVALUATE"
    RAG_EXPLAINER = "RAG_EXPLAINER"
    EMBEDDINGS = "EMBEDDINGS"


ALL_TASKS: List[TaskType] = [
    TaskType.RESUME_PARSER,
    TaskType.ATS_JD_EXTRACTION,
    TaskType.INTERVIEW_GENERATE,
    TaskType.INTERVIEW_EVALUATE,
    TaskType.RAG_EXPLAINER,
]

# Non-editable execution parameters codified per task to preserve runtime contracts
TASK_EXECUTION_SPECS: Dict[TaskType, Dict[str, Any]] = {
    TaskType.RESUME_PARSER: {
        "temperature": 0.0,
        "timeout": 30,
        "max_retries": 2,
        "method": "with_structured_output",
        "schema_name": "ParsedResume",
    },
    TaskType.ATS_JD_EXTRACTION: {
        "temperature": 0.0,
        "timeout": 30,
        "max_retries": 2,
        "method": "with_structured_output",
        "schema_name": "JDExtractedRequirements",
    },
    TaskType.INTERVIEW_GENERATE: {
        "temperature": 0.0,
        "timeout": 30,
        "max_retries": 2,
        "method": "with_structured_output",
        "schema_name": "LLMQuestionList",
    },
    TaskType.INTERVIEW_EVALUATE: {
        "temperature": 0.0,
        "timeout": 30,
        "max_retries": 2,
        "method": "with_structured_output",
        "schema_name": "LLMEvaluationReport",
    },
    TaskType.RAG_EXPLAINER: {
        "temperature": 0.0,
        "timeout": 10,
        "max_retries": 0,
        "method": "with_structured_output",
        "schema_name": "GroundedExplanation",
    },
}


class ModelCatalogItem(BaseModel):
    model_id: str = Field(..., description="Canonical provider model identifier")
    display_name: str = Field(..., description="Human-readable model name")
    provider: str = Field(..., description="Provider identifier (e.g. 'gemini')")
    capabilities: List[str] = Field(default_factory=list, description="Supported features: chat, structured_output, embeddings")
    verified_on: str = Field(..., description="UTC timestamp of committed live verification script run")
    verification_status: str = Field(..., description="VERIFIED (selectable), UNVERIFIED (429/quota), or UNAVAILABLE (404)")
    dimension: Optional[int] = Field(None, description="Vector embedding dimension if applicable")
    is_selectable: bool = Field(default=False, description="Whether this model can be newly selected in drafts")
    in_use_warning: Optional[str] = Field(None, description="Warning if model is currently active but unverified")
    notes: Optional[str] = Field(None, description="Diagnostic notes or provider constraints")


# Raw empirical verification data from scratch/verified_catalog_raw.json (Run on 2026-11-23 07:46:31 UTC)
PROVIDER_MODEL_CATALOG: Dict[str, List[ModelCatalogItem]] = {
    "gemini": [
        ModelCatalogItem(
            model_id="gemini-3.5-flash",
            display_name="Gemini 3.5 Flash",
            provider="gemini",
            capabilities=["chat", "structured_output"],
            verified_on="2026-11-23 07:46:31 UTC",
            verification_status="VERIFIED",
            is_selectable=True,
            notes="Passed live structured output benchmark in 18.5s.",
        ),
        ModelCatalogItem(
            model_id="gemini-3.8-flash",
            display_name="Gemini 3.8 Flash (Active Baseline)",
            provider="gemini",
            capabilities=["chat", "structured_output"],
            verified_on="2026-11-23 07:46:31 UTC",
            verification_status="UNVERIFIED",
            is_selectable=False,
            in_use_warning="In use, unverified: currently powers active baseline tasks. Cannot be newly selected for other tasks until live verification passes.",
            notes="Current environment baseline model. Live verification encountered free-tier 20 req/day quota limit.",
        ),
        ModelCatalogItem(
            model_id="gemini-3.7-flash",
            display_name="Gemini 3.7 Flash",
            provider="gemini",
            capabilities=["chat", "structured_output"],
            verified_on="2026-11-23 07:46:31 UTC",
            verification_status="UNVERIFIED",
            is_selectable=False,
            notes="Available in list_models(); rate-limited during verification benchmark (429).",
        ),
        ModelCatalogItem(
            model_id="gemini-embedding-001",
            display_name="Gemini Text Embeddings (001)",
            provider="gemini",
            capabilities=["embeddings"],
            verified_on="2026-11-23 07:46:31 UTC",
            verification_status="VERIFIED",
            dimension=768,
            is_selectable=False,  # Embeddings are read-only in v1
            notes="Passed live embedding test in 486ms (768 dimensions). Read-only in v1.",
        ),
        ModelCatalogItem(
            model_id="gemini-embedding-2",
            display_name="Gemini Embeddings 2",
            provider="gemini",
            capabilities=["embeddings"],
            verified_on="2026-11-23 07:46:31 UTC",
            verification_status="VERIFIED",
            dimension=3072,
            is_selectable=False,  # Embeddings are read-only in v1
            notes="Passed live embedding test in 628ms (3072 dimensions). For future re-indexing workflow.",
        ),
    ]
}


def get_available_models(provider: str) -> List[ModelCatalogItem]:
    """Return catalog models for a given provider."""
    return PROVIDER_MODEL_CATALOG.get(provider.lower().strip(), [])


def get_model_capabilities(provider: str, model_id: str) -> List[str]:
    """Lookup capabilities for a specific model."""
    for item in get_available_models(provider):
        if item.model_id == model_id:
            return item.capabilities
    return []
