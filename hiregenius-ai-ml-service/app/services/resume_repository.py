import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.config import settings
from app.db.mongodb import get_resumes_collection
from app.models.resume import ParsedResume

logger = logging.getLogger("hiregenius.ai_ml_service.services.resume_repository")


class ResumeRepositoryError(Exception):
    """Base exception for resume repository errors."""
    pass


class DatabaseNotConnectedError(ResumeRepositoryError):
    """Raised when MongoDB connection is not available."""
    pass


async def save_parsed_resume(
    candidate_id: str,
    filename: str,
    raw_text: str,
    parsed_data: ParsedResume,
    custom_collection: Optional[Any] = None,
    model_version: Optional[str] = None,
) -> str:
    """
    Persist structured parsed resume data to MongoDB.
    Performs an upsert based on candidate_id (replaces previous parse for this candidate,
    matching Core API Phase 3's one-resume-per-candidate architecture).

    :param candidate_id: Unique candidate identifier from Core API
    :param filename: Original filename of the resume
    :param raw_text: Full raw text extracted from the document
    :param parsed_data: Validated ParsedResume domain object
    :param custom_collection: Optional collection override for testing/mocking
    :param model_version: Optional model identifier override
    :return: String representation of MongoDB document _id
    """
    collection = custom_collection if custom_collection is not None else get_resumes_collection()
    if collection is None:
        logger.error("Attempted to save parsed resume, but MongoDB collection is unavailable.")
        raise DatabaseNotConnectedError(
            "MongoDB resumes collection is not available. Please check database connectivity."
        )

    clean_candidate_id = candidate_id.strip()
    if not clean_candidate_id:
        raise ValueError("candidate_id cannot be empty.")

    active_model = model_version or settings.GEMINI_MODEL
    now_utc = datetime.now(timezone.utc)

    doc_data = {
        "candidate_id": clean_candidate_id,
        "original_filename": filename,
        "raw_text": raw_text,
        "parsed_data": parsed_data.model_dump(),
        "parsed_at": now_utc,
        "model_version": active_model,
    }

    try:
        # Atomic upsert: updates existing document if candidate_id exists, or inserts new
        result = await collection.update_one(
            {"candidate_id": clean_candidate_id},
            {"$set": doc_data},
            upsert=True,
        )

        if result.upserted_id is not None:
            doc_id = str(result.upserted_id)
            logger.info(
                f"Inserted new parsed resume document {doc_id} for candidate_id '{clean_candidate_id}'"
            )
            return doc_id

        # Document existed and was replaced/updated: query for the document ID
        existing = await collection.find_one(
            {"candidate_id": clean_candidate_id},
            {"_id": 1},
        )
        if existing and "_id" in existing:
            doc_id = str(existing["_id"])
            logger.info(
                f"Updated existing parsed resume document {doc_id} for candidate_id '{clean_candidate_id}'"
            )
            return doc_id

        raise ResumeRepositoryError(
            f"Failed to resolve MongoDB document ID for candidate '{clean_candidate_id}' after upsert."
        )
    except Exception as e:
        if isinstance(e, ResumeRepositoryError):
            raise
        logger.error(f"MongoDB persistence error for candidate '{clean_candidate_id}': {e}", exc_info=True)
        raise ResumeRepositoryError(f"Database error while saving parsed resume: {e}") from e


async def get_parsed_resume_by_candidate_id(
    candidate_id: str,
    custom_collection: Optional[Any] = None,
) -> Optional[Dict[str, Any]]:
    """
    Retrieve stored parsed resume document by candidate_id.

    :param candidate_id: Unique candidate identifier
    :param custom_collection: Optional collection override for testing/mocking
    :return: Dictionary document or None if not found
    """
    collection = custom_collection if custom_collection is not None else get_resumes_collection()
    if collection is None:
        logger.error("Attempted to fetch parsed resume, but MongoDB collection is unavailable.")
        raise DatabaseNotConnectedError(
            "MongoDB resumes collection is not available. Please check database connectivity."
        )

    clean_candidate_id = candidate_id.strip()
    if not clean_candidate_id:
        return None

    try:
        doc = await collection.find_one({"candidate_id": clean_candidate_id})
        if not doc:
            return None

        # Format document ID to string for serialization
        if "_id" in doc:
            doc["id"] = str(doc["_id"])
            doc["_id"] = str(doc["_id"])

        return doc
    except Exception as e:
        if isinstance(e, ResumeRepositoryError):
            raise
        logger.error(f"MongoDB query error for candidate '{clean_candidate_id}': {e}", exc_info=True)
        raise ResumeRepositoryError(f"Database error while retrieving parsed resume: {e}") from e
