import logging
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from app.services.text_extraction import (
    CorruptedFileError,
    EmptyFileError,
    EncryptedFileError,
    UnsupportedFileTypeError,
    extract_text,
)

logger = logging.getLogger("hiregenius.ai_ml_service.api.resume")

router = APIRouter(prefix="/api/resume", tags=["Resume Processing"])

# 5MB file size limit (matching Core API resume upload standard from Phase 3)
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


class ExtractedTextResponse(BaseModel):
    filename: str = Field(..., description="Original name of the uploaded resume file")
    extracted_text: str = Field(..., description="Raw text extracted from the document")
    character_count: int = Field(..., description="Total number of characters extracted")


@router.post(
    "/extract-text",
    response_model=ExtractedTextResponse,
    summary="Extract raw text from PDF or DOCX resume",
    description="Accepts a multipart/form-data resume file (.pdf or .docx up to 5MB) and extracts its textual content.",
)
async def extract_resume_text(
    file: UploadFile = File(..., description="Resume file in .pdf or .docx format (max 5MB)")
):
    filename = file.filename or "unknown"
    lower_filename = filename.lower()

    # 1. Validate file extension
    has_valid_extension = any(lower_filename.endswith(ext) for ext in ALLOWED_EXTENSIONS)
    if not has_valid_extension:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type for '{filename}'. Only PDF (.pdf) and Word (.docx) resumes are supported.",
        )

    # 2. Read file content in chunks to monitor file size
    try:
        content = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read uploaded file. Please verify the file and try again.",
        )

    # 3. Sanity check: Empty file check (0 bytes)
    file_size = len(content)
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded file '{filename}' is empty (0 bytes). Please upload a valid resume.",
        )

    # 4. Enforce 5MB file size limit
    if file_size > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
        actual_mb = round(file_size / (1024 * 1024), 2)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{filename}' ({actual_mb}MB) exceeds the maximum allowed size of {max_mb}MB.",
        )

    # 5. Extract text via service dispatcher
    try:
        extracted_text = extract_text(content, filename)
    except UnsupportedFileTypeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except EmptyFileError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except (EncryptedFileError, CorruptedFileError) as e:
        logger.warning(f"Unprocessable resume document '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot extract text from '{filename}': {str(e)}",
        )
    except Exception as e:
        logger.error(f"Unexpected extraction failure on '{filename}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract text from '{filename}': Document processing error.",
        )

    return ExtractedTextResponse(
        filename=filename,
        extracted_text=extracted_text,
        character_count=len(extracted_text),
    )
