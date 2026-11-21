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
    assert sec_item.score == 20.0
    assert res.overallScore >= 70.0

    # Certifications optional: without Certifications, still earns full 20.0 core section points
    fresher_no_certs = fresher_text.replace("Certifications\n    • Python for Everybody Specialization (Coursera).", "")
    res_no_certs = analyze_v2(text=fresher_no_certs, mode="GENERAL")
    sec_no_certs = next(c for c in res_no_certs.categoryScores if c.name == "Section Completeness")
    assert sec_no_certs.score == 20.0
    assert any("Certifications" in i.message and i.severity == "tip" for i in res_no_certs.issues)


# ── 3. Personal Field Invariance & Legitimate Content ──────────────────────────

def test_personal_field_invariance_and_legitimate_content():
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

    res_base = analyze_v2(text=base_resume, mode="GENERAL")

    # Field-by-field test
    fields = [
        "Date of Birth: 15/08/1995\n",
        "DOB: 12/04/1996\n",
        "Marital Status: Single\n",
        "Father's Name: Robert Doe\n",
        "Gender: Male\n",
        "Nationality: American\n",
        "Religion: None\n",
        "Personal Details:\nDOB: 15/08/1995\nMarital Status: Married\nFather Name: John Sr\nGender: Female\n",
    ]

    for field_line in fields:
        res_with_field = analyze_v2(text=field_line + base_resume, mode="GENERAL")
        # STRICT INVARIANCE: Personal fields must NOT change score across any category
        assert res_with_field.overallScore == res_base.overallScore
        assert len(res_with_field.categoryScores) == len(res_base.categoryScores)
        for c_base, c_field in zip(res_base.categoryScores, res_with_field.categoryScores):
            assert c_base.score == c_field.score

        # Must surface tip recommending removal
        assert any(i.category == "Personal Details" for i in res_with_field.issues)

    # Legitimate content preservation: "gender" or "date" inside project bullets
    legit_resume = base_resume + """
    • Built ML model analyzing customer churn by cohort signup date and gender distributions.
    • Optimized database queries on order date and delivery date fields.
    """
    res_legit = analyze_v2(text=legit_resume, mode="GENERAL")
    # Must NOT emit personal details tip for legitimate technical descriptions
    assert not any(i.category == "Personal Details" for i in res_legit.issues)


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
    enc_path = FIXTURES_DIR / "encrypted_password_resume.pdf"
    with open(enc_path, "rb") as f:
        resp = client.post(
            "/api/ats/scan",
            headers=AUTH_HEADERS,
            files={"file": (enc_path.name, f, "application/pdf")},
            data={"mode": "GENERAL"},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["overallScore"] <= settings.CAPPED_SCORE_UNREADABLE
    assert data["grade"] == "Needs Work"
    assert any(i["severity"] == "critical" and "password" in i["message"].lower() for i in data["issues"])


# ── 5. Layout Evaluation & Single-Column False Positive Shield ─────────────────

def test_synthetic_single_column_not_flagged_as_multi_column():
    single_col_fixtures = [
        "single_col_right_aligned_dates.pdf",
        "single_col_tab_separated.pdf",
        "single_col_two_col_skills.pdf",
    ]
    for fix_name in single_col_fixtures:
        fix_path = FIXTURES_DIR / fix_name
        with open(fix_path, "rb") as f:
            resp = client.post(
                "/api/ats/scan",
                headers=AUTH_HEADERS,
                files={"file": (fix_name, f, "application/pdf")},
                data={"mode": "GENERAL"},
            )
        assert resp.status_code == 200
        data = resp.json()
        pars_item = next(c for c in data["categoryScores"] if c["name"] == "Parsability & Format")
        # Must NOT flag as multi-column
        assert pars_item["details"].get("multi_column") is False
        assert pars_item["score"] == pars_item["max"]


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
