"""
MongoDB Persistence Layer for ATS Results.

Enforces:
- Unique composite key: (candidate_id, job_id or "general").
- Atomic upsert per (candidate_id, job_id).
- Strict PII protection: NO raw resume text or snippet is persisted.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional
from app.db.mongodb import get_ats_collection

logger = logging.getLogger("hiregenius.ai_ml_service.services.ats_repository")


class AtsRepositoryError(Exception):
    """Base exception for ATS persistence errors."""
    pass


class DatabaseNotConnectedError(AtsRepositoryError):
    """Raised when MongoDB connection is unavailable."""
    pass


async def save_ats_result(
    candidate_id: str,
    job_id: Optional[str],
    result_data: Dict[str, Any],
    custom_collection: Optional[Any] = None,
) -> str:
    """
    Persist ATS evaluation result to MongoDB.

    Performs an atomic upsert on the composite key (candidate_id, job_id).
    Strictly avoids storing raw resume text or text snippets to comply with PII rules.

    :param candidate_id: Numeric candidate ID string from Core API (e.g. "102")
    :param job_id: Optional job ID string; defaults to "general" if omitted
    :param result_data: Dictionary of ATS analysis output
    :param custom_collection: Optional collection override for testing
    :return: String representation of MongoDB document _id
    """
    collection = custom_collection if custom_collection is not None else get_ats_collection()
    if collection is None:
        logger.error("Attempted to save ATS result, but MongoDB collection is unavailable.")
        raise DatabaseNotConnectedError("MongoDB ats_results collection is not available.")

    clean_candidate_id = candidate_id.strip()
    if not clean_candidate_id:
        raise ValueError("candidate_id cannot be empty.")

    job_key = job_id.strip() if job_id and job_id.strip() else "general"
    now_utc = datetime.now(timezone.utc)

    # Document explicitly excludes raw resume text, snippets, and filenames (PII protection)
    doc_data = {
        "candidate_id": clean_candidate_id,
        "job_id": job_key,
        "mode": result_data.get("mode", "general"),
        "ats_score": result_data.get("ats_score", 0.0),
        "score_breakdown": result_data.get("score_breakdown", {}),
        "predicted_category": result_data.get("predicted_category", {}),
        "keyword_analysis": result_data.get("keyword_analysis"),
        "sections_found": result_data.get("sections_found", {}),
        "format_signals": result_data.get("format_signals", {}),
        "word_count": result_data.get("word_count", 0),
        "suggestions": result_data.get("suggestions", []),
        "parsability": result_data.get("parsability"),
        "checked_at": now_utc,
    }

    try:
        filter_query = {"candidate_id": clean_candidate_id, "job_id": job_key}
        result = await collection.update_one(
            filter_query,
            {"$set": doc_data},
            upsert=True,
        )

        if result.upserted_id is not None:
            doc_id = str(result.upserted_id)
            logger.info(
                f"Inserted new ATS record {doc_id} for candidate_id '{clean_candidate_id}', job_id '{job_key}'"
            )
            return doc_id

        existing = await collection.find_one(filter_query, {"_id": 1})
        if existing and "_id" in existing:
            doc_id = str(existing["_id"])
            logger.info(
                f"Updated existing ATS record {doc_id} for candidate_id '{clean_candidate_id}', job_id '{job_key}'"
            )
            return doc_id

        raise AtsRepositoryError(
            f"Failed to resolve MongoDB document ID for candidate '{clean_candidate_id}' after upsert."
        )

    except Exception as e:
        if isinstance(e, AtsRepositoryError):
            raise
        logger.error(
            f"MongoDB error saving ATS result for candidate '{clean_candidate_id}': {e}",
            exc_info=True,
        )
        raise AtsRepositoryError(f"Database error while saving ATS result: {e}") from e


async def get_ats_result(
    candidate_id: str,
    job_id: Optional[str] = None,
    custom_collection: Optional[Any] = None,
) -> Optional[Dict[str, Any]]:
    """
    Retrieve stored ATS result document by candidate_id and optional job_id.

    If job_id is provided, queries for that specific evaluation.
    If job_id is omitted, returns the candidate's most recent ATS check.

    :param candidate_id: Numeric candidate ID string
    :param job_id: Optional job ID string
    :param custom_collection: Optional collection override for testing
    :return: Document dictionary or None if not found
    """
    collection = custom_collection if custom_collection is not None else get_ats_collection()
    if collection is None:
        logger.error("Attempted to fetch ATS result, but MongoDB collection is unavailable.")
        raise DatabaseNotConnectedError("MongoDB ats_results collection is not available.")

    clean_candidate_id = candidate_id.strip()
    if not clean_candidate_id:
        return None

    try:
        clean_job_id = job_id.strip() if isinstance(job_id, str) and job_id.strip() else None
        if clean_job_id:
            doc = await collection.find_one(
                {"candidate_id": clean_candidate_id, "job_id": clean_job_id}
            )
        else:
            # Most recent ATS evaluation for this candidate
            cursor = collection.find({"candidate_id": clean_candidate_id}).sort("checked_at", -1).limit(1)
            results = await cursor.to_list(length=1)
            doc = results[0] if results else None

        if not doc:
            return None

        if "_id" in doc:
            doc["id"] = str(doc["_id"])

        return doc

    except Exception as e:
        if isinstance(e, AtsRepositoryError):
            raise
        logger.error(
            f"MongoDB error retrieving ATS result for candidate '{clean_candidate_id}': {e}",
            exc_info=True,
        )
        raise AtsRepositoryError(f"Database error while retrieving ATS result: {e}") from e
