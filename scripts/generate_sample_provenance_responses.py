"""
Generates real sample response bodies for /api/resume/parse, /api/interview/generate,
and /api/interview/evaluate, demonstrating provenance fields:
(provider, model_version, config_version, config_source) for both 'db' and 'env' cases.
Saves raw output to scratch/provenance_sample_responses.json.
"""
import os
import sys
import json
from datetime import datetime, timezone

os.environ.setdefault("ENV", "development")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "hiregenius-ai-ml-service")))

from app.models.resume import ParsedResumeResponse, ParsedResume, EducationItem, ExperienceItem
from app.models.interview import (
    GenerateInterviewResponse,
    GeneratedQuestion,
    QuestionType,
    Difficulty,
    EvaluateInterviewResponse,
    PerAnswerEvaluation,
    AggregateEvaluation,
    Recommendation,
)


def generate_samples():
    now_utc = datetime.now(timezone.utc)

    # ── 1. RESUME PARSE RESPONSES ─────────────────────────────────────────────
    sample_parsed_data = ParsedResume(
        full_name="Alex Mercer",
        email="alex@example.com",
        phone="+1-555-0199",
        skills=["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
        experience=[ExperienceItem(company="Acme Corp", role="Senior Engineer", start_date="2021", end_date="Present", description="Led backend microservices.")],
        education=[EducationItem(institution="University of Washington", degree="B.S.", field_of_study="Computer Science", graduation_year="2020")],
    )

    resume_db = ParsedResumeResponse(
        id="resume_doc_db_v1",
        candidate_id="cand_12345",
        original_filename="alex_mercer_cv.pdf",
        parsed_data=sample_parsed_data,
        parsed_at=now_utc,
        provider="gemini",
        model_version="gemini-3.8-flash",
        config_version=2,
        config_source="db",
    )

    resume_env = ParsedResumeResponse(
        id="resume_doc_env_fallback",
        candidate_id="cand_12345",
        original_filename="alex_mercer_cv.pdf",
        parsed_data=sample_parsed_data,
        parsed_at=now_utc,
        provider="gemini",
        model_version="gemini-3.8-flash",
        config_version=0,
        config_source="env",
    )

    # ── 2. INTERVIEW GENERATE RESPONSES ───────────────────────────────────────
    sample_question = GeneratedQuestion(
        id="q_1",
        type=QuestionType.TECHNICAL,
        text="Explain how you design a resilient retry mechanism with exponential backoff and jitter.",
        skill_tags=["Python", "Distributed Systems"],
        difficulty=Difficulty.MEDIUM,
        expected_points=["Exponential formula", "Randomized jitter window", "Circuit breaker fallback"],
        max_score=10,
    )

    interview_gen_db = GenerateInterviewResponse(
        questions=[sample_question],
        provider="gemini",
        model_version="gemini-3.8-flash",
        config_version=2,
        config_source="db",
    )

    interview_gen_env = GenerateInterviewResponse(
        questions=[sample_question],
        provider="gemini",
        model_version="gemini-3.8-flash",
        config_version=0,
        config_source="env",
    )

    # ── 3. INTERVIEW EVALUATE RESPONSES ───────────────────────────────────────
    sample_indiv_eval = PerAnswerEvaluation(
        question_id="q_1",
        relevance=9.0,
        technical_accuracy=9.0,
        depth=8.5,
        clarity=9.0,
        evidence_quotes=["base * 2^attempt with +/- 20% jitter"],
        strengths=["Clear articulation of backoff formula and randomized jitter variance"],
        gaps=[],
        feedback="Solid understanding of distributed systems failure modes.",
    )

    interview_eval_db = EvaluateInterviewResponse(
        evaluations=[sample_indiv_eval],
        aggregate=AggregateEvaluation(
            technical=9.0,
            communication=8.5,
            confidence_indicative=0.92,
            overall=8.8,
            recommendation=Recommendation.PROCEED,
            rubric_version="rubric-v1-untuned",
            provider="gemini",
            model_version="gemini-3.8-flash",
            config_version=2,
            config_source="db",
            disclaimer="AI output is advisory; the recruiter makes the final decision.",
        ),
        cached=False,
    )

    interview_eval_env = EvaluateInterviewResponse(
        evaluations=[sample_indiv_eval],
        aggregate=AggregateEvaluation(
            technical=9.0,
            communication=8.5,
            confidence_indicative=0.92,
            overall=8.8,
            recommendation=Recommendation.PROCEED,
            rubric_version="rubric-v1-untuned",
            provider="gemini",
            model_version="gemini-3.8-flash",
            config_version=0,
            config_source="env",
            disclaimer="AI output is advisory; the recruiter makes the final decision.",
        ),
        cached=False,
    )

    result = {
        "resume_parse": {
            "db_source": resume_db.model_dump(mode="json"),
            "env_source": resume_env.model_dump(mode="json"),
        },
        "interview_generate": {
            "db_source": interview_gen_db.model_dump(mode="json"),
            "env_source": interview_gen_env.model_dump(mode="json"),
        },
        "interview_evaluate": {
            "db_source": interview_eval_db.model_dump(mode="json"),
            "env_source": interview_eval_env.model_dump(mode="json"),
        },
    }

    scratch_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "hiregenius-ai-ml-service", "scratch"))
    os.makedirs(scratch_dir, exist_ok=True)
    out_file = os.path.join(scratch_dir, "provenance_sample_responses.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print(f"[SUCCESS] Generated provenance sample response bodies saved to: {out_file}")
    return result


if __name__ == "__main__":
    generate_samples()
