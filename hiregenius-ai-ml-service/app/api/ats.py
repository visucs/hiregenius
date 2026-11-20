"""
ATS Scoring API Router.

Provides endpoints for:
- POST /api/ats/check (general ATS readability and structure check)
- POST /api/ats/check-for-job (job-specific ATS keyword & skills matching)
- GET /api/ats/{candidate_id} (retrieval of stored ATS results)
- GET /api/ats/categories (list of 24 supported job categories)

All endpoints require the internal API key (X-Internal-API-Key).
All error responses return a unified shape:
{"detail": {"error_type": str, "message": str, "parsability": Optional[dict]}}
"""

from datetime import datetime, timezone
import logging
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status

from app.api.auth import verify_internal_key
from app.models.ats import (
    ATSCheckResponse,
    CategoriesResponse,
    CategoryMatchItem,
    FormatSignals,
    KeywordAnalysis,
    ParsabilityAdvisory,
    PredictedCategory,
    ScoreBreakdown,
)
from app.models.resume import ParsedResume
from app.services.ats import JOB_CATEGORIES, analyze, inspect_parsability
from app.services.ats_repository import (
    AtsRepositoryError,
    DatabaseNotConnectedError,
    get_ats_result,
    save_ats_result,
)
from app.services.resume_repository import get_parsed_resume_by_candidate_id
from app.services.text_extraction import (
    CorruptedFileError,
    EmptyFileError,
    EncryptedFileError,
    ScannedDocumentError,
    UnsupportedFileTypeError,
    extract_text,
)

logger = logging.getLogger("hiregenius.ai_ml_service.api.ats")

router = APIRouter(
    prefix="/api/ats",
    tags=["ATS Scoring"],
    dependencies=[Depends(verify_internal_key)],
)

# Alignment with Phase 3/6 file limits
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MIN_RESUME_TEXT_CHARS = 50
MIN_JD_CHARS = 30
MAX_JD_CHARS = 10000


def _raise_ats_error(
    status_code: int,
    error_type: str,
    message: str,
    parsability: Optional[dict] = None,
) -> None:
    """Raise HTTPException with unified error shape: {"detail": {"error_type", "message", "parsability"}}."""
    raise HTTPException(
        status_code=status_code,
        detail={
            "error_type": error_type,
            "message": message,
            "parsability": parsability,
        },
    )


async def _read_and_validate_file(file: UploadFile) -> tuple[bytes, str]:
    """Validate uploaded file format and size, returning (bytes, filename)."""
    filename = (file.filename or "unknown").strip()
    lower_filename = filename.lower()

    has_valid_extension = any(lower_filename.endswith(ext) for ext in ALLOWED_EXTENSIONS)
    if not has_valid_extension:
        _raise_ats_error(
            status.HTTP_400_BAD_REQUEST,
            "UnsupportedFileTypeError",
            f"Invalid file type for '{filename}'. Only PDF (.pdf) and Word (.docx) resumes are supported.",
        )

    try:
        content = await file.read()
    except Exception as e:
        logger.error(f"Failed to read file '{filename}': {e}")
        _raise_ats_error(
            status.HTTP_400_BAD_REQUEST,
            "FileReadError",
            "Failed to read uploaded file. Please verify the file and try again.",
        )

    if len(content) == 0:
        _raise_ats_error(
            status.HTTP_400_BAD_REQUEST,
            "EmptyFileError",
            f"Uploaded file '{filename}' is empty (0 bytes). Please upload a valid resume.",
        )

    if len(content) > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
        actual_mb = round(len(content) / (1024 * 1024), 2)
        _raise_ats_error(
            status.HTTP_400_BAD_REQUEST,
            "FileSizeLimitExceededError",
            f"File '{filename}' ({actual_mb}MB) exceeds the maximum allowed size of {max_mb}MB.",
        )

    return content, filename


def _extract_text_safe(content: bytes, filename: str) -> str:
    """Extract text from bytes with consistent exception mapping."""
    try:
        return extract_text(content, filename)
    except UnsupportedFileTypeError as e:
        _raise_ats_error(status.HTTP_400_BAD_REQUEST, "UnsupportedFileTypeError", str(e))
    except EmptyFileError as e:
        _raise_ats_error(status.HTTP_400_BAD_REQUEST, "EmptyFileError", str(e))
    except ScannedDocumentError as e:
        logger.warning(f"Scanned / no-text-layer document '{filename}': {e}")
        parsability_data = inspect_parsability(content, filename, 0)
        _raise_ats_error(
            422,
            "ScannedDocumentError",
            f"Cannot extract text from '{filename}': {str(e)}",
            parsability=parsability_data,
        )
    except EncryptedFileError as e:
        logger.warning(f"Encrypted document '{filename}': {e}")
        _raise_ats_error(
            422,
            "EncryptedFileError",
            f"Cannot extract text from '{filename}': {str(e)}",
        )
    except CorruptedFileError as e:
        logger.warning(f"Unprocessable document '{filename}': {e}")
        _raise_ats_error(
            422,
            "CorruptedFileError",
            f"Cannot extract text from '{filename}': {str(e)}",
        )
    except Exception as e:
        logger.error(f"Extraction error on '{filename}': {e}", exc_info=True)
        _raise_ats_error(
            422,
            "DocumentProcessingError",
            f"Failed to extract text from '{filename}': Document processing error.",
        )


@router.post(
    "/check",
    response_model=ATSCheckResponse,
    summary="General ATS Resume Assessment",
    description="Evaluates a resume's general ATS readiness, structure, formatting, length, and predicted role category.",
)
async def check_general_ats(
    candidate_id: str = Form(..., description="Numeric candidate ID from Core API"),
    file: UploadFile = File(..., description="Resume file (.pdf or .docx, max 5MB)"),
):
    clean_candidate_id = candidate_id.strip()
    if not clean_candidate_id:
        _raise_ats_error(
            status.HTTP_400_BAD_REQUEST,
            "ValidationError",
            "candidate_id cannot be empty.",
        )

    content, filename = await _read_and_validate_file(file)
    extracted_text = _extract_text_safe(content, filename)

    if len(extracted_text.strip()) < MIN_RESUME_TEXT_CHARS:
        parsability_data = inspect_parsability(content, filename, len(extracted_text.strip()))
        _raise_ats_error(
            422,
            "ScannedDocumentError",
            (
                f"Extracted text from '{filename}' is too short ({len(extracted_text.strip())} chars). "
                "The document appears to be a scanned or image-based resume with no extractable text layer."
            ),
            parsability=parsability_data,
        )

    # Check if a structured ParsedResume already exists in DB to assist section detection
    parsed_resume_obj: Optional[ParsedResume] = None
    try:
        existing_doc = await get_parsed_resume_by_candidate_id(clean_candidate_id)
        if existing_doc and "parsed_data" in existing_doc:
            parsed_resume_obj = ParsedResume(**existing_doc["parsed_data"])
    except Exception as e:
        logger.debug(f"Could not load existing parsed resume for candidate '{clean_candidate_id}': {e}")

    # Inspect document parsability advisory
    parsability_data = inspect_parsability(content, filename, len(extracted_text))

    # Run pure analysis (Mode: General)
    result = analyze(
        text=extracted_text,
        job_description=None,
        parsed_resume=parsed_resume_obj,
    )

    now_utc = datetime.now(timezone.utc)

    # Persist ATS result to MongoDB
    doc_id: Optional[str] = None
    try:
        doc_id = await save_ats_result(
            candidate_id=clean_candidate_id,
            job_id=None,
            result_data={
                "original_filename": filename,
                "mode": result.mode,
                "ats_score": result.ats_score,
                "score_breakdown": result.score_breakdown,
                "predicted_category": result.predicted_category,
                "keyword_analysis": None,
                "sections_found": result.sections_found,
                "format_signals": result.format_signals,
                "word_count": result.word_count,
                "suggestions": result.suggestions,
                "parsability": parsability_data,
            },
        )
    except DatabaseNotConnectedError as e:
        logger.error(f"Cannot save ATS check for '{clean_candidate_id}': MongoDB not connected: {e}")
        _raise_ats_error(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "DatabaseNotConnectedError",
            "Database service unavailable. ATS result could not be persisted.",
        )
    except AtsRepositoryError as e:
        logger.error(f"Failed to persist ATS check for '{clean_candidate_id}': {e}", exc_info=True)
        _raise_ats_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "DatabaseError",
            "Failed to persist ATS result to database.",
        )

    return ATSCheckResponse(
        id=doc_id,
        candidate_id=clean_candidate_id,
        job_id=None,
        original_filename=filename,
        mode="general",
        ats_score=result.ats_score,
        score_breakdown=ScoreBreakdown(**result.score_breakdown),
        predicted_category=PredictedCategory(
            category=result.predicted_category["category"],
            match_strength=result.predicted_category["match_strength"],
            low_confidence=result.predicted_category.get("low_confidence", False),
            top_3_matches=[
                CategoryMatchItem(**item)
                for item in result.predicted_category.get("top_3_matches", [])
            ],
        ),
        keyword_analysis=None,
        sections_found=result.sections_found,
        format_signals=FormatSignals(**result.format_signals),
        word_count=result.word_count,
        suggestions=result.suggestions,
        parsability=ParsabilityAdvisory(**parsability_data) if parsability_data else None,
        checked_at=now_utc,
    )


@router.post(
    "/check-for-job",
    response_model=ATSCheckResponse,
    summary="Job-Specific ATS Resume Match",
    description="Evaluates a resume against a specific job description (60% keyword match, 20% sections, 10% length, 10% format). File is optional if candidate has a saved resume.",
)
async def check_ats_for_job(
    candidate_id: str = Form(..., description="Numeric candidate ID from Core API"),
    job_description: str = Form(..., description="Target job description text (30-10,000 chars)"),
    job_id: Optional[str] = Form(None, description="Optional Job ID for tracking/correlation"),
    file: Optional[UploadFile] = File(None, description="Optional resume file (.pdf/.docx up to 5MB)"),
):
    clean_candidate_id = candidate_id.strip()
    if not clean_candidate_id:
        _raise_ats_error(
            status.HTTP_400_BAD_REQUEST,
            "ValidationError",
            "candidate_id cannot be empty.",
        )

    clean_jd = (job_description or "").strip()
    if len(clean_jd) < MIN_JD_CHARS:
        _raise_ats_error(
            status.HTTP_400_BAD_REQUEST,
            "ValidationError",
            f"job_description is too short ({len(clean_jd)} chars). Minimum {MIN_JD_CHARS} characters required.",
        )
    if len(clean_jd) > MAX_JD_CHARS:
        _raise_ats_error(
            status.HTTP_400_BAD_REQUEST,
            "ValidationError",
            f"job_description exceeds maximum limit of {MAX_JD_CHARS} characters ({len(clean_jd)} chars).",
        )

    clean_job_id = job_id.strip() if job_id and job_id.strip() else None

    extracted_text: str = ""
    filename: Optional[str] = None
    parsability_data: Optional[dict] = None
    parsed_resume_obj: Optional[ParsedResume] = None

    if file is not None and file.filename:
        # File provided: read, validate, extract
        content, filename = await _read_and_validate_file(file)
        extracted_text = _extract_text_safe(content, filename)

        if len(extracted_text.strip()) < MIN_RESUME_TEXT_CHARS:
            parsability_data = inspect_parsability(content, filename, len(extracted_text.strip()))
            _raise_ats_error(
                422,
                "ScannedDocumentError",
                (
                    f"Extracted text from '{filename}' is too short ({len(extracted_text.strip())} chars). "
                    "The document appears to be a scanned or image-based resume with no extractable text layer."
                ),
                parsability=parsability_data,
            )

        parsability_data = inspect_parsability(content, filename, len(extracted_text))

        # Check existing parsed resume to assist section detection
        try:
            existing_doc = await get_parsed_resume_by_candidate_id(clean_candidate_id)
            if existing_doc and "parsed_data" in existing_doc:
                parsed_resume_obj = ParsedResume(**existing_doc["parsed_data"])
        except Exception:
            pass

    else:
        # File absent: retrieve stored resume from Phase 6 resumes collection
        try:
            existing_doc = await get_parsed_resume_by_candidate_id(clean_candidate_id)
        except DatabaseNotConnectedError as e:
            logger.error(f"Cannot fetch saved resume for '{clean_candidate_id}': MongoDB not connected: {e}")
            _raise_ats_error(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "DatabaseNotConnectedError",
                "Database service unavailable. Cannot retrieve stored resume.",
            )
        except Exception as e:
            logger.error(f"Error querying resume for '{clean_candidate_id}': {e}", exc_info=True)
            _raise_ats_error(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "DatabaseError",
                "Database error while retrieving stored resume.",
            )

        if not existing_doc or not existing_doc.get("raw_text"):
            _raise_ats_error(
                status.HTTP_404_NOT_FOUND,
                "ResumeNotFoundError",
                f"No saved resume found for candidate_id '{clean_candidate_id}'. Please upload a resume file or parse the resume first.",
            )

        extracted_text = existing_doc["raw_text"]
        filename = existing_doc.get("original_filename")
        if "parsed_data" in existing_doc and existing_doc["parsed_data"]:
            parsed_resume_obj = ParsedResume(**existing_doc["parsed_data"])

    # Run pure analysis (Mode: Job-Specific)
    result = analyze(
        text=extracted_text,
        job_description=clean_jd,
        parsed_resume=parsed_resume_obj,
    )

    now_utc = datetime.now(timezone.utc)

    # Persist ATS result to MongoDB with composite key (candidate_id, job_id)
    doc_id: Optional[str] = None
    try:
        doc_id = await save_ats_result(
            candidate_id=clean_candidate_id,
            job_id=clean_job_id,
            result_data={
                "original_filename": filename,
                "mode": result.mode,
                "ats_score": result.ats_score,
                "score_breakdown": result.score_breakdown,
                "predicted_category": result.predicted_category,
                "keyword_analysis": result.keyword_analysis,
                "sections_found": result.sections_found,
                "format_signals": result.format_signals,
                "word_count": result.word_count,
                "suggestions": result.suggestions,
                "parsability": parsability_data,
            },
        )
    except DatabaseNotConnectedError as e:
        logger.error(f"Cannot save job-specific ATS check for '{clean_candidate_id}': MongoDB not connected: {e}")
        _raise_ats_error(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "DatabaseNotConnectedError",
            "Database service unavailable. ATS result could not be persisted.",
        )
    except AtsRepositoryError as e:
        logger.error(f"Failed to persist job-specific ATS check for '{clean_candidate_id}': {e}", exc_info=True)
        _raise_ats_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "DatabaseError",
            "Failed to persist ATS result to database.",
        )

    return ATSCheckResponse(
        id=doc_id,
        candidate_id=clean_candidate_id,
        job_id=clean_job_id,
        original_filename=filename,
        mode="job_specific",
        ats_score=result.ats_score,
        score_breakdown=ScoreBreakdown(**result.score_breakdown),
        predicted_category=PredictedCategory(
            category=result.predicted_category["category"],
            match_strength=result.predicted_category["match_strength"],
            low_confidence=result.predicted_category.get("low_confidence", False),
            top_3_matches=[
                CategoryMatchItem(**item)
                for item in result.predicted_category.get("top_3_matches", [])
            ],
        ),
        keyword_analysis=KeywordAnalysis(**result.keyword_analysis) if result.keyword_analysis else None,
        sections_found=result.sections_found,
        format_signals=FormatSignals(**result.format_signals),
        word_count=result.word_count,
        suggestions=result.suggestions,
        parsability=ParsabilityAdvisory(**parsability_data) if parsability_data else None,
        checked_at=now_utc,
    )


@router.get(
    "/categories",
    response_model=CategoriesResponse,
    summary="List Supported Job Categories",
    description="Returns the 24 predefined job role categories evaluated by the ATS system.",
)
async def get_job_categories():
    return CategoriesResponse(categories=JOB_CATEGORIES)


@router.get(
    "/{candidate_id}",
    response_model=ATSCheckResponse,
    summary="Retrieve ATS Results for Candidate",
    description="Retrieves the latest stored ATS assessment for a candidate, or for a specific job_id if provided.",
)
async def get_candidate_ats_result(
    candidate_id: str,
    job_id: Optional[str] = Query(default=None, description="Optional job ID to retrieve specific evaluation"),
):
    clean_candidate_id = candidate_id.strip()
    if not clean_candidate_id:
        _raise_ats_error(
            status.HTTP_400_BAD_REQUEST,
            "ValidationError",
            "candidate_id cannot be empty.",
        )

    clean_job_id = job_id.strip() if isinstance(job_id, str) and job_id.strip() else None

    try:
        doc = await get_ats_result(clean_candidate_id, job_id=clean_job_id)
    except DatabaseNotConnectedError as e:
        logger.error(f"Cannot fetch ATS result for '{clean_candidate_id}': MongoDB not connected: {e}")
        _raise_ats_error(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "DatabaseNotConnectedError",
            "Database service unavailable. Cannot retrieve ATS result.",
        )
    except AtsRepositoryError as e:
        logger.error(f"Error querying ATS result for '{clean_candidate_id}': {e}", exc_info=True)
        _raise_ats_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "DatabaseError",
            "Database error while retrieving ATS result.",
        )

    if not doc:
        filter_desc = f" for job_id '{job_id}'" if job_id else ""
        _raise_ats_error(
            status.HTTP_404_NOT_FOUND,
            "AtsResultNotFoundError",
            f"No ATS evaluation found for candidate_id '{clean_candidate_id}'{filter_desc}.",
        )

    return ATSCheckResponse(
        id=doc.get("id"),
        candidate_id=doc["candidate_id"],
        job_id=doc.get("job_id") if doc.get("job_id") != "general" else None,
        original_filename=doc.get("original_filename"),
        mode=doc.get("mode", "general"),
        ats_score=doc["ats_score"],
        score_breakdown=ScoreBreakdown(**doc["score_breakdown"]),
        predicted_category=PredictedCategory(
            category=doc["predicted_category"]["category"],
            match_strength=doc["predicted_category"]["match_strength"],
            low_confidence=doc["predicted_category"].get("low_confidence", False),
            top_3_matches=[
                CategoryMatchItem(**item)
                for item in doc["predicted_category"].get("top_3_matches", [])
            ],
        ),
        keyword_analysis=KeywordAnalysis(**doc["keyword_analysis"]) if doc.get("keyword_analysis") else None,
        sections_found=doc["sections_found"],
        format_signals=FormatSignals(**doc["format_signals"]),
        word_count=doc["word_count"],
        suggestions=doc.get("suggestions", []),
        parsability=ParsabilityAdvisory(**doc["parsability"]) if doc.get("parsability") else None,
        checked_at=doc.get("created_at") or doc.get("updated_at") or datetime.now(timezone.utc),
    )
