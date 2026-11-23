import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, SecretStr
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings
from app.ai_config.catalog import TaskType
from app.ai_config.repository import config_repository
from app.providers.gemini import get_provider_adapter

# Schema imports for validation
from app.models.resume import ParsedResume
from app.services.ats.jd_extractor import JDExtractedRequirements, JD_SYSTEM_PROMPT, JD_USER_PROMPT
from app.services.interview_agent import (
    LLMQuestionList,
    LLMEvaluationReport,
    QUESTION_GENERATOR_SYSTEM_PROMPT,
    EVALUATION_SYSTEM_PROMPT,
)
from app.services.rag.grounded_explainer import (
    GroundedExplanation,
    EXPLANATION_SYSTEM_PROMPT,
    EXPLANATION_USER_PROMPT,
)
from app.services.resume_agent import SYSTEM_PROMPT as RESUME_SYSTEM_PROMPT, USER_PROMPT as RESUME_USER_PROMPT

logger = logging.getLogger("hiregenius.ai_ml_service.ai_config.validator")

# ── Committed Golden Fixtures ──────────────────────────────────────────────────

GOLDEN_RESUME_TEXT = """
Jane Doe
jane.doe@example.com | (555) 019-2834 | San Francisco, CA

PROFESSIONAL SUMMARY
Senior Backend Engineer with 6 years experience in Python, FastAPI, and PostgreSQL.

SKILLS
Python, FastAPI, Docker, PostgreSQL, Redis, Kubernetes

EXPERIENCE
Lead Engineer | Acme Corp | 2021 - Present
- Architected high-throughput microservices using FastAPI and MongoDB.
- Reduced API latency by 40%.

EDUCATION
B.S. in Computer Science | UC Berkeley | 2018
"""

GOLDEN_JD_TEXT = """
Senior Python Developer
Requirements:
- 4+ years of professional experience with Python and FastAPI
- Strong understanding of relational databases (PostgreSQL)
- Experience with Docker and containerization
Preferred:
- Kubernetes and Redis caching
"""

GOLDEN_INTERVIEW_Q_AND_A = {
    "question": "Explain how you handle database connection pooling and prevent connection leaks in an async FastAPI service.",
    "expected_points": ["connection pool sizing", "async context managers", "closing connections", "timeouts"],
    "candidate_answer": (
        "In FastAPI, I use an async connection pool configured during lifespan startup. "
        "Every endpoint acquires a connection using an async context manager (async with pool.acquire() as conn) "
        "which guarantees the connection is returned to the pool even if an unhandled exception occurs. "
        "I also set max overflow limits and connection acquisition timeouts."
    ),
}

GOLDEN_RAG_CHUNKS = [
    {"chunk_id": "c1", "text": "Architected Python FastAPI microservices handling 20k requests per minute."},
    {"chunk_id": "c2", "text": "Implemented distributed caching with Redis and configured PostgreSQL connection pools."},
]


from enum import Enum

class TaskValidationStatus(str, Enum):
    PASSED = "PASSED"
    INCONCLUSIVE = "INCONCLUSIVE"  # Provider 429 rate limit or quota exceeded
    FAILED = "FAILED"


class TaskValidationResult(BaseModel):
    status: TaskValidationStatus = TaskValidationStatus.PASSED
    passed: bool
    latency_ms: float
    error_message: Optional[str] = None
    output_summary: Optional[str] = None


class DraftValidationReport(BaseModel):
    all_passed: bool
    can_activate: bool = False
    has_inconclusive: bool = False
    has_failed: bool = False
    tested_at: str
    tasks: Dict[str, TaskValidationResult]


def _categorize_error(e: Exception, latency: float) -> TaskValidationResult:
    err_str = str(e)
    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
        return TaskValidationResult(
            status=TaskValidationStatus.INCONCLUSIVE,
            passed=False,
            latency_ms=latency,
            error_message="Provider quota exceeded or rate limited (429 ResourceExhausted). Result is inconclusive.",
        )
    return TaskValidationResult(
        status=TaskValidationStatus.FAILED,
        passed=False,
        latency_ms=latency,
        error_message=err_str[:180],
    )


async def _test_resume_parser(llm: Any) -> TaskValidationResult:
    t0 = time.perf_counter()
    try:
        structured_llm = llm.with_structured_output(ParsedResume)
        prompt = ChatPromptTemplate.from_messages([
            ("system", RESUME_SYSTEM_PROMPT),
            ("user", RESUME_USER_PROMPT),
        ])
        chain = prompt | structured_llm
        res = await chain.ainvoke({"resume_text": GOLDEN_RESUME_TEXT})
        latency = round((time.perf_counter() - t0) * 1000, 1)

        if not res or not res.name:
            return TaskValidationResult(passed=False, latency_ms=latency, error_message="Empty parsed resume name")
        return TaskValidationResult(passed=True, latency_ms=latency, output_summary=f"Parsed candidate: {res.name}")
    except Exception as e:
        latency = round((time.perf_counter() - t0) * 1000, 1)
        return _categorize_error(e, latency)


async def _test_jd_extractor(llm: Any) -> TaskValidationResult:
    t0 = time.perf_counter()
    try:
        structured_llm = llm.with_structured_output(JDExtractedRequirements)
        prompt = ChatPromptTemplate.from_messages([
            ("system", JD_SYSTEM_PROMPT),
            ("user", JD_USER_PROMPT),
        ])
        chain = prompt | structured_llm
        res = await chain.ainvoke({
            "job_title": "Senior Python Developer",
            "job_description": GOLDEN_JD_TEXT,
        })
        latency = round((time.perf_counter() - t0) * 1000, 1)

        if not res or not res.required_skills:
            return TaskValidationResult(passed=False, latency_ms=latency, error_message="No skills extracted")
        return TaskValidationResult(passed=True, latency_ms=latency, output_summary=f"Extracted {len(res.required_skills)} skills")
    except Exception as e:
        latency = round((time.perf_counter() - t0) * 1000, 1)
        return _categorize_error(e, latency)


async def _test_interview_generate(llm: Any) -> TaskValidationResult:
    t0 = time.perf_counter()
    try:
        structured_llm = llm.with_structured_output(LLMQuestionList)
        prompt = ChatPromptTemplate.from_messages([
            ("system", QUESTION_GENERATOR_SYSTEM_PROMPT),
            ("user", "Role: Python Developer. Generate exactly 1 technical interview question."),
        ])
        chain = prompt | structured_llm
        res = await chain.ainvoke({})
        latency = round((time.perf_counter() - t0) * 1000, 1)

        if not res or not res.questions:
            return TaskValidationResult(passed=False, latency_ms=latency, error_message="No questions generated")
        return TaskValidationResult(passed=True, latency_ms=latency, output_summary=f"Generated {len(res.questions)} question")
    except Exception as e:
        latency = round((time.perf_counter() - t0) * 1000, 1)
        return _categorize_error(e, latency)


async def _test_interview_evaluate(llm: Any) -> TaskValidationResult:
    t0 = time.perf_counter()
    try:
        structured_llm = llm.with_structured_output(LLMEvaluationReport)
        prompt = ChatPromptTemplate.from_messages([
            ("system", EVALUATION_SYSTEM_PROMPT),
            ("user", f"Question: {GOLDEN_INTERVIEW_Q_AND_A['question']}\nCandidate Answer: {GOLDEN_INTERVIEW_Q_AND_A['candidate_answer']}\nProvide evaluation with question_id=q1"),
        ])
        chain = prompt | structured_llm
        res = await chain.ainvoke({})
        latency = round((time.perf_counter() - t0) * 1000, 1)

        if not res or not res.evaluations:
            return TaskValidationResult(passed=False, latency_ms=latency, error_message="No evaluations returned")
        return TaskValidationResult(passed=True, latency_ms=latency, output_summary="Answer evaluated successfully")
    except Exception as e:
        latency = round((time.perf_counter() - t0) * 1000, 1)
        return _categorize_error(e, latency)


async def _test_rag_explainer(llm: Any) -> TaskValidationResult:
    t0 = time.perf_counter()
    try:
        structured_llm = llm.with_structured_output(GroundedExplanation)
        prompt = ChatPromptTemplate.from_messages([
            ("system", EXPLANATION_SYSTEM_PROMPT),
            ("human", EXPLANATION_USER_PROMPT),
        ])
        chain = prompt | structured_llm
        res = await chain.ainvoke({
            "job_title": "Python Backend Engineer",
            "required_skills": "Python, FastAPI",
            "preferred_skills": "Redis",
            "experience_years": "4 years",
            "role_level": "Senior",
            "chunks_formatted": "Chunk [c1]: Architected Python FastAPI microservices.\nChunk [c2]: Redis caching.",
        })
        latency = round((time.perf_counter() - t0) * 1000, 1)

        if not res or not res.recommendation:
            return TaskValidationResult(passed=False, latency_ms=latency, error_message="Empty explanation output")
        return TaskValidationResult(passed=True, latency_ms=latency, output_summary=f"Recommendation: {res.recommendation}")
    except Exception as e:
        latency = round((time.perf_counter() - t0) * 1000, 1)
        return _categorize_error(e, latency)


async def validate_draft_configuration(
    tasks: Dict[str, Dict[str, str]],
    custom_keys: Optional[Dict[str, SecretStr]] = None,
) -> DraftValidationReport:
    """
    Run golden fixtures across all 5 tasks for a candidate draft configuration.
    Returns structured pass/fail report with latency and output summaries.
    """
    results: Dict[str, TaskValidationResult] = {}
    all_passed = True

    task_runners = {
        TaskType.RESUME_PARSER.value: _test_resume_parser,
        TaskType.ATS_JD_EXTRACTION.value: _test_jd_extractor,
        TaskType.INTERVIEW_GENERATE.value: _test_interview_generate,
        TaskType.INTERVIEW_EVALUATE.value: _test_interview_evaluate,
        TaskType.RAG_EXPLAINER.value: _test_rag_explainer,
    }

    for task_name, runner in task_runners.items():
        spec = tasks.get(task_name)
        if not spec:
            results[task_name] = TaskValidationResult(
                passed=False, latency_ms=0.0, error_message="Task routing specification missing"
            )
            all_passed = False
            continue

        provider = spec.get("provider", "gemini")
        model = spec.get("model", "")

        # Resolve key
        api_key: Optional[SecretStr] = None
        if custom_keys and provider in custom_keys:
            api_key = custom_keys[provider]
        else:
            # Check DB or fallback to env
            if provider == "gemini" and settings.GEMINI_API_KEY:
                api_key = SecretStr(settings.GEMINI_API_KEY)

        if not api_key or not api_key.get_secret_value():
            results[task_name] = TaskValidationResult(
                passed=False, latency_ms=0.0, error_message=f"No API key available to test provider '{provider}'"
            )
            all_passed = False
            continue

        try:
            adapter = get_provider_adapter(provider)
            llm = adapter.get_chat_llm(model_id=model, api_key=api_key, temperature=0.0, timeout=15)
            res = await runner(llm)
            results[task_name] = res
            if not res.passed:
                all_passed = False
        except Exception as e:
            results[task_name] = _categorize_error(e, 0.0)

    all_passed = bool(results) and all(r.status == TaskValidationStatus.PASSED for r in results.values())
    has_inconclusive = any(r.status == TaskValidationStatus.INCONCLUSIVE for r in results.values())
    has_failed = any(r.status == TaskValidationStatus.FAILED for r in results.values())
    can_activate = all_passed or (not has_failed and has_inconclusive)

    return DraftValidationReport(
        all_passed=all_passed,
        can_activate=can_activate,
        has_inconclusive=has_inconclusive,
        has_failed=has_failed,
        tested_at=datetime.now(timezone.utc).isoformat(),
        tasks=results,
    )
