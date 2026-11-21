"""
Unit and Integration Tests for ATS v2 Scoring Engine and /api/ats/scan Endpoint.
"""

from pathlib import Path
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.models.resume import ParsedResume
from app.services.ats.jd_extractor import JDExtractedRequirements
from app.services.ats.parsability import analyze_parsability
from app.services.ats.scorer import analyze, analyze_v2

FIXTURES_DIR = Path(__file__).parent / "fixtures"

client = TestClient(app)
AUTH_HEADERS = {"X-Internal-Key": settings.AI_ML_SERVICE_INTERNAL_KEY}


# ── 1. Category Scorers & Formula Verification ─────────────────────────────────

def test_general_category_scores_and_weights():
    text = """
    Jane Doe
    Email: jane.doe@example.com | Phone: +1-555-0199 | LinkedIn: linkedin.com/in/janedoe

    Professional Summary
    Senior Software Engineer with extensive experience in cloud architecture and backend APIs.

    Work Experience
    Senior Developer at CloudTech | 2021 - Present
    • Developed resilient microservices with Python and FastAPI, increasing throughput by 45%.
    • Led a team of 6 engineers and automated CI/CD deployment pipelines.
    • Architected scalable database solutions with PostgreSQL, reducing latency by 30%.
    • Deployed Docker containers to Kubernetes clusters serving 100k daily users.

    Education
    B.S. in Computer Science, Tech University, 2020.

    Skills
    Python, FastAPI, Docker, Kubernetes, PostgreSQL, Redis, CI/CD, Git, AWS, Microservices.

    Projects
    • Analytics Dashboard: Built real-time monitoring engine handling 2M events daily.
    """
    res = analyze_v2(text=text, mode="GENERAL")
    assert res.mode == "GENERAL"
    assert res.scoringVersion == settings.SCORING_VERSION
    assert res.overallScore >= 75.0
    assert res.grade in ["Good Match", "Excellent"]
    assert len(res.categoryScores) == 6

    # Verify max weights sum to 100
    total_max = sum(c.max for c in res.categoryScores)
    assert total_max == 100.0

    # Verify overall score matches sum of category scores
    sum_scores = round(sum(c.score for c in res.categoryScores), 1)
    assert res.overallScore == sum_scores


def test_job_category_scores_and_weights():
    text = """
    Alex Smith
    alex@example.com | +1 555-0123

    Summary
    Backend Python Engineer with 4 years building APIs.

    Experience
    Software Engineer at DataCorp | 2020 - 2024
    • Built REST APIs with Python and FastAPI.
    • Deployed services with Docker and managed PostgreSQL databases.

    Education
    B.Tech in Computer Engineering, 2020.

    Skills
    Python, FastAPI, Docker, PostgreSQL, Redis.
    """
    reqs = JDExtractedRequirements(
        required_skills=["Python", "FastAPI", "Docker", "PostgreSQL"],
        preferred_skills=["Kubernetes", "AWS"],
        experience_years=3.0,
        role_level="Mid",
        target_title="Backend Python Engineer",
    )
    res = analyze_v2(text=text, mode="JOB", job_requirements=reqs)
    assert res.mode == "JOB"
    assert len(res.categoryScores) == 5

    total_max = sum(c.max for c in res.categoryScores)
    assert total_max == 100.0

    sum_scores = round(sum(c.score for c in res.categoryScores), 1)
    assert res.overallScore == sum_scores
    assert "Python" in res.matchedKeywords
    assert "Kubernetes" in res.missingKeywords.preferred


# ── 2. Fresher Handling & India-Style Formats ──────────────────────────────────

def test_fresher_handling_no_experience_penalty():
    fresher_text = """
    Rahul Sharma
    Email: rahul.sharma@example.com | Phone: +91 9876543210 | GitHub: github.com/rahulsharma

    Career Objective
    Enthusiastic B.Tech Computer Science fresher seeking an entry-level software engineering role.

    Education
    B.Tech in Information Technology, Delhi Technological University | 2020 - 2024
    CGPA: 8.8 / 10

    Technical Skills
    Python, Django, FastAPI, SQL, HTML, CSS, JavaScript, Git.

    Projects
    • Campus Placement Portal: Built end-to-end recruitment portal with Django and PostgreSQL.
    • Expense Tracker API: Implemented authenticated REST API with FastAPI and JWT tokens.
    • Automated Scraping Tool: Automated price comparison across 5 ecommerce sites.

    Certifications
    • Python for Everybody Specialization (Coursera).
    """
    res = analyze_v2(text=fresher_text, mode="GENERAL")
    sec_item = next(c for c in res.categoryScores if c.name == "Section Completeness")
    # Freshers with projects + education + skills should not be penalized for lacking professional experience
    assert sec_item.score >= 17.0
    assert res.overallScore >= 70.0


# ── 3. Personal Field Invariance ───────────────────────────────────────────────

def test_personal_field_invariance():
    base_resume = """
    John Doe
    Email: john.doe@example.com
    Phone: +1-555-0199
    LinkedIn: linkedin.com/in/johndoe

    Professional Summary
    Senior Developer with 5 years building scalable web services.

    Work Experience
    Senior Developer at TechStudio | 2020 - Present
    • Developed backend APIs in Python and FastAPI.
    • Improved query performance by 40% using PostgreSQL indexing.

    Education
    B.S. in Computer Science, 2019.

    Skills
    Python, FastAPI, Docker, PostgreSQL, Git.

    Projects
    • Web Analytics Platform: Real-time event ingestion engine.
    """

    resume_with_demographics = f"""{base_resume}
    Personal Details:
    DOB: 15/08/1995
    Marital Status: Single
    Father's Name: Robert Doe
    Gender: Male
    Photo Attached: Yes
    """

    res_base = analyze_v2(text=base_resume, mode="GENERAL")
    res_demo = analyze_v2(text=resume_with_demographics, mode="GENERAL")

    # STRICT INVARIANCE: Personal fields must NOT change the score
    assert res_base.overallScore == res_demo.overallScore

    # But resume with demographics must surface a tip recommending removal
    tip_categories = [i.category for i in res_demo.issues]
    assert "Contact Completeness" in tip_categories
    assert any("demographics" in i.message.lower() or "personal" in i.message.lower() for i in res_demo.issues)


# ── 4. Scanned & Encrypted Documents -> HTTP 200 with Capped Score ─────────────

def test_scanned_pdf_returns_200_with_capped_score():
    scanned_path = FIXTURES_DIR / "scanned_image_resume.pdf"
    with open(scanned_path, "rb") as f:
        resp = client.post(
            "/api/ats/scan",
            headers=AUTH_HEADERS,
            files={"file": (scanned_path.name, f, "application/pdf")},
            data={"mode": "GENERAL"},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["overallScore"] <= settings.CAPPED_SCORE_UNREADABLE
    assert data["grade"] == "Needs Work"
    assert len(data["issues"]) >= 1

    # Single critical issue
    crit_issues = [i for i in data["issues"] if i["severity"] == "critical"]
    assert len(crit_issues) == 1
    assert "cannot read text" in crit_issues[0]["message"].lower()

    # Text categories marked not_assessable
    unassessable = [c for c in data["categoryScores"] if c.get("not_assessable")]
    assert len(unassessable) >= 4


def test_encrypted_pdf_handling():
    # Calling analyze_v2 with is_unreadable=True and password protected reason
    res = analyze_v2(
        text="",
        file_bytes=b"%PDF-encrypted",
        filename="protected.pdf",
        is_unreadable=True,
        unreadable_reason="File is password protected. ATS cannot decrypt or read the document.",
        mode="GENERAL",
    )
    assert res.overallScore <= settings.CAPPED_SCORE_UNREADABLE
    assert any(i.severity == "critical" and "password" in i.message.lower() for i in res.issues)


# ── 5. Canva-Style Multi-Column Synthetic Fixture ──────────────────────────────

def test_canva_like_synthetic_fixture_layout_penalty():
    canva_path = FIXTURES_DIR / "canva_like_synthetic.pdf"
    with open(canva_path, "rb") as f:
        resp = client.post(
            "/api/ats/scan",
            headers=AUTH_HEADERS,
            files={"file": (canva_path.name, f, "application/pdf")},
            data={"mode": "GENERAL"},
        )

    assert resp.status_code == 200
    data = resp.json()
    pars_item = next(c for c in data["categoryScores"] if c["name"] == "Parsability & Format")

    # Multi-column layout should be detected and penalized
    assert pars_item["details"].get("multi_column") is True
    assert pars_item["score"] < pars_item["max"]
    assert any("multi-column" in i["message"].lower() for i in data["issues"])


# ── 6. Gemini Failure Fallback ─────────────────────────────────────────────────

@pytest.mark.anyio
async def test_gemini_failure_fallback():
    jd_text = """
    Software Engineer needed with Python, FastAPI, and Docker experience.
    3+ years required.
    """
    # Mocking Gemini failure inside jd_extractor
    with patch("app.services.ats.jd_extractor.ChatGoogleGenerativeAI", side_effect=RuntimeError("Gemini API connection timeout")):
        from app.services.ats.jd_extractor import extract_job_requirements
        reqs, is_fallback = await extract_job_requirements(jd_text, "Software Engineer")

        assert is_fallback is True
        assert "python" in [s.lower() for s in reqs.required_skills]

    # Verify endpoint handles LLM fallback seamlessly
    with patch("app.api.ats.extract_job_requirements", return_value=(reqs, True)):
        with open(FIXTURES_DIR / "real_resume_alex_smith.docx", "rb") as f:
            resp = client.post(
                "/api/ats/scan",
                headers=AUTH_HEADERS,
                data={
                    "mode": "JOB",
                    "job_title": "Software Engineer",
                    "job_description": jd_text,
                },
                files={"file": ("alex.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("ai_suggestions_unavailable") is True or data.get("aiSuggestionsUnavailable") is True
        assert data["overallScore"] > 0


# ── 7. Output Schema, Determinism & Bounds ─────────────────────────────────────

def test_score_bounded_and_deterministic():
    sample_text = """
    Developer with skills in Python, Git, and Docker.
    Education: B.S. in CS.
    """
    res1 = analyze_v2(text=sample_text, mode="GENERAL")
    res2 = analyze_v2(text=sample_text, mode="GENERAL")

    # Strict determinism
    assert res1.overallScore == res2.overallScore
    assert len(res1.issues) == len(res2.issues)
    assert res1.grade == res2.grade

    # Strictly bounded 0 to 100
    assert 0.0 <= res1.overallScore <= 100.0


# ── 8. Old Endpoints Still Work Through Adapter ─────────────────────────────────

def test_legacy_check_endpoint():
    with open(FIXTURES_DIR / "real_resume_alex_smith.docx", "rb") as f:
        resp = client.post(
            "/api/ats/check",
            headers=AUTH_HEADERS,
            data={"candidate_id": "legacy-test-1"},
            files={"file": ("alex.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
    # Returns 200 (or 503 if mongo not connected for persistence), but schema validation passes
    assert resp.status_code in [200, 503]
    if resp.status_code == 200:
        data = resp.json()
        assert "ats_score" in data
        assert "score_breakdown" in data
