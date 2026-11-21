import logging
from fastapi import APIRouter, Depends, status

from app.api.auth import verify_internal_key
from app.models.interview import (
    EvaluateInterviewRequest,
    EvaluateInterviewResponse,
    GenerateInterviewRequest,
    GenerateInterviewResponse,
)
from app.services.interview_agent import (
    evaluate_interview_answers,
    generate_interview_questions,
)

logger = logging.getLogger("hiregenius.ai_ml_service.api.interview")

router = APIRouter(
    prefix="/api/interview",
    tags=["AI Interview"],
)


@router.post(
    "/generate",
    response_model=GenerateInterviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate tailored, fair, and seniority-adapted interview questions",
)
async def generate_questions(
    request: GenerateInterviewRequest,
    _internal_key: str = Depends(verify_internal_key),
) -> GenerateInterviewResponse:
    """
    Generates structured interview questions for a candidate and job.
    - Strips all PII from the candidate resume before processing.
    - Covers required technical skills, resume probes, and behavioral/scenario prompts.
    - Adapts question difficulty and complexity to candidate seniority.
    - Strictly filters out protected/forbidden personal bias topics.
    - Authenticated via internal service key (`X-Internal-Key`).
    """
    logger.info(
        f"[InterviewAPI] Generating questions for job: '{request.job.title}' (seniority: {request.job.seniority})"
    )
    return await generate_interview_questions(request)


@router.post(
    "/evaluate",
    response_model=EvaluateInterviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate candidate interview answers with structured rubric",
)
async def evaluate_answers(
    request: EvaluateInterviewRequest,
    _internal_key: str = Depends(verify_internal_key),
) -> EvaluateInterviewResponse:
    """
    Evaluates candidate interview answers against questions and expected criteria.
    - Applies deterministic gate for empty or too-short answers (<15 characters).
    - Defends against prompt injection by isolating answers as untrusted data.
    - Honors language neutrality: evaluates Hindi/Hinglish on content with zero communication penalty.
    - Returns structured per-answer metrics, evidence quotes, and an advisory aggregate score.
    - Caches evaluations idempotently via SHA-256 hash in MongoDB.
    - Authenticated via internal service key (`X-Internal-Key`).
    """
    logger.info(
        f"[InterviewAPI] Evaluating {len(request.answers)} answers for job: '{request.job.title}'"
    )
    return await evaluate_interview_answers(request)
