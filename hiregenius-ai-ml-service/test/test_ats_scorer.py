"""
Unit Tests for Pure ATS Scoring Engine, Section Detection, and Format Signals.
"""

from pathlib import Path
import unittest
from app.models.resume import EducationItem, ExperienceItem, ParsedResume, ProjectItem
from app.services.ats.category_matcher import predict_category
from app.services.ats.format_checker import (
    compute_format_score,
    compute_length_score,
    detect_format_signals,
)
from app.services.ats.keywords import extract_jd_keywords
from app.services.ats.scorer import analyze
from app.services.ats.sections import compute_section_score, detect_sections
from app.services.text_extraction import extract_text

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


class TestAtsScorer(unittest.TestCase):
    """Test suite for ATS scoring formulas, section detection, and format evaluation."""

    def test_general_mode_scoring_derivable(self):
        """
        CRITICAL REQUIREMENT:
        General mode must use explicit renormalized weights (sections 50 / length 25 / format 25).
        Assert that the returned ats_score is strictly derivable from returned sub-scores.
        """
        resume_text = """
        John Doe
        Email: john.doe@example.com | Phone: +1-555-0199
        
        Professional Summary
        Senior Software Engineer with 6+ years of experience in distributed systems.

        Work Experience
        • Developed resilient microservices with Python and FastAPI, increasing throughput by 45%.
        • Led a team of 5 backend engineers and automated deployment pipelines in 2023.

        Education
        B.S. in Computer Science, University of Technology, 2018.

        Skills
        Python, FastAPI, Docker, PostgreSQL, Redis, Git, CI/CD.

        Projects
        • Built real-time analytics engine handling 50,000+ daily events.

        Certifications
        • AWS Certified Solutions Architect (2022).
        """

        result = analyze(text=resume_text, job_description=None)

        self.assertEqual(result.mode, "general")
        sec_score = result.score_breakdown["sections"]
        len_score = result.score_breakdown["length"]
        fmt_score = result.score_breakdown["format"]

        # Verify mathematical derivation: 50% sections + 25% length + 25% format
        expected_score = round(0.50 * sec_score + 0.25 * len_score + 0.25 * fmt_score, 1)
        self.assertEqual(result.ats_score, expected_score)

        # Check that predicted category is present with match_strength
        self.assertIn("category", result.predicted_category)
        self.assertIn("match_strength", result.predicted_category)
        self.assertIn("low_confidence", result.predicted_category)

    def test_job_specific_mode_scoring_derivable(self):
        """
        CRITICAL REQUIREMENT:
        Job-specific mode keeps 60/20/10/10 weights.
        Assert that ats_score is strictly derivable from returned sub-scores.
        """
        resume_text = """
        Jane Smith
        Email: jane.smith@example.com
        
        Summary
        Passionate Python Developer specialized in web microservices.

        Experience
        • Implemented high-performance REST APIs using FastAPI and PostgreSQL in 2024.
        • Architected Docker container deployments, reducing startup time by 30%.

        Education
        B.S. in Software Engineering, 2020.

        Skills
        Python, FastAPI, Docker, PostgreSQL, Git.
        """

        job_description = """
        We are seeking a Backend Python Developer to build modern cloud services.
        Requirements:
        - Strong proficiency in Python, FastAPI, and PostgreSQL.
        - Experience with Docker, Kubernetes, and Redis.
        - Familiarity with Celery for background workers.
        """

        result = analyze(text=resume_text, job_description=job_description)

        self.assertEqual(result.mode, "job_specific")
        self.assertIsNotNone(result.keyword_analysis)

        kw_score = result.score_breakdown["keyword_match"]
        sec_score = result.score_breakdown["sections"]
        len_score = result.score_breakdown["length"]
        fmt_score = result.score_breakdown["format"]

        # Verify mathematical derivation: 60% keywords + 20% sections + 10% length + 10% format
        expected_score = round(
            0.60 * kw_score + 0.20 * sec_score + 0.10 * len_score + 0.10 * fmt_score,
            1,
        )
        self.assertEqual(result.ats_score, expected_score)

        # Verify matched vs missing keyword tracking
        matched = result.keyword_analysis["matched_keywords"]
        missing = result.keyword_analysis["missing_from_jd"]
        self.assertIn("python", matched)
        self.assertIn("fastapi", matched)
        self.assertIn("postgresql", matched)
        self.assertIn("docker", matched)
        self.assertIn("kubernetes", missing)
        self.assertIn("redis", missing)
        self.assertIn("celery", missing)

    def test_keyword_matching_invariant_matched_plus_missing_equals_jd(self):
        """
        CRITICAL REQUIREMENT:
        matched + missing must strictly equal the extracted JD keyword list.
        """
        resume_docx = (FIXTURES_DIR / "real_resume_alex_smith.docx").read_bytes()
        resume_text = extract_text(resume_docx, "alex_smith.docx")

        jd = """
        Senior Full Stack & Python Engineer
        Requirements:
        - Strong experience in Python, FastAPI, Django, and REST APIs.
        - Frontend proficiency in React, TypeScript, and modern JavaScript.
        - Experience with PostgreSQL, Docker, Git, and automated testing with pytest.
        """

        extracted_jd = extract_jd_keywords(jd)
        result = analyze(resume_text, job_description=jd)

        matched = result.keyword_analysis["matched_keywords"]
        missing = result.keyword_analysis["missing_from_jd"]

        # 1. Total count invariant
        self.assertEqual(len(matched) + len(missing), len(extracted_jd))

        # 2. Union equals extracted set
        self.assertEqual(set(matched) | set(missing), set(extracted_jd))

        # 3. Disjoint set invariant
        self.assertEqual(len(set(matched) & set(missing)), 0)

        # 4. Confirm 'rest api' and 'test automation' are in matched
        self.assertIn("rest api", matched)
        self.assertIn("test automation", matched)
        self.assertNotIn("testing", extracted_jd)  # Replaced by longer phrase

    def test_category_predictor_guards_and_unknown_on_bob(self):
        """
        CRITICAL REQUIREMENT:
        The 'Bob' resume with zero keywords must return 'Unknown' with low_confidence=True
        and MUST NOT return 'Advocate' or present tied scores.
        """
        bob_resume = """
        Bob
        I want a coding job. I am good at computer stuff.
        Call me at 12345.
        """
        cat, strength, low_conf, top_3 = predict_category(bob_resume)

        self.assertEqual(cat, "Unknown")
        self.assertTrue(low_conf)
        self.assertEqual(len(top_3), 0)
        self.assertNotEqual(cat, "Advocate")

    def test_category_predictor_tied_or_narrow_gap_returns_unknown(self):
        """Verify resumes with tied or ambiguous skills return Unknown."""
        # Ambiguous resume with 1 Python skill and 1 Java skill
        ambiguous_text = "I have some basic knowledge of Python and Java."
        cat, strength, low_conf, top_3 = predict_category(ambiguous_text)

        self.assertEqual(cat, "Unknown")
        self.assertTrue(low_conf)
        self.assertEqual(len(top_3), 0)

    def test_category_predictor_clear_winner(self):
        """Verify resume with high domain density returns clear category."""
        python_text = """
        Python Developer specializing in FastAPI, Django, Celery, Redis, SQLAlchemy,
        PostgreSQL, AsyncIO, Pytest, Docker, and CI/CD.
        """
        cat, strength, low_conf, top_3 = predict_category(python_text)

        self.assertEqual(cat, "Python Developer")
        self.assertFalse(low_conf)
        self.assertEqual(len(top_3), 3)
        self.assertEqual(top_3[0]["category"], "Python Developer")

    def test_category_predictor_david_kumar_never_returns_database(self):
        """
        Verify David Kumar's resume returns Python Developer or Unknown, never Database.
        Generic skill-type categories like Database must not outrank language/role categories.
        """
        david_text = """
        David Kumar - Senior Backend Engineer
        Email: david.kumar@hiregenius.ai | Phone: +1 415 555 2671 | San Francisco, CA
        SUMMARY
        Experienced Backend Developer specializing in Python, FastAPI, and distributed systems.
        TECHNICAL SKILLS
        Languages: Python, Go, Java, TypeScript, SQL
        Backend: FastAPI, Spring Boot, Celery, Docker, Kubernetes, Nginx
        Databases: MongoDB Atlas, MySQL, Redis, PostgreSQL
        EXPERIENCE
        Lead Backend Engineer - TechCorp AI (2022 - Present)
        - Designed distributed AI orchestration pipelines with FastAPI and Celery.
        - Optimized PostgreSQL and Redis cache performance, reducing p99 latency by 35%.
        """
        cat, strength, low_conf, top_3 = predict_category(david_text)

        self.assertIn(cat, ["Python Developer", "Unknown"])
        self.assertNotEqual(cat, "Database")
        if not low_conf:
            self.assertEqual(cat, "Python Developer")

    def test_category_predictor_alex_smith_automation_testing(self):
        """Verify Alex Smith QA resume reliably identifies Automation Testing."""
        alex_text = """
        Alex Smith - Senior QA Automation Engineer
        Email: alex.smith@example.com | San Jose, CA
        PROFESSIONAL SUMMARY
        SDET with 6+ years specializing in Selenium, Cypress, Pytest, and CI/CD pipelines.
        SKILLS
        Selenium, Cypress, Pytest, JUnit, Cucumber, Postman, Jenkins, Git, Test Automation
        """
        cat, strength, low_conf, top_3 = predict_category(alex_text)

        self.assertEqual(cat, "Automation Testing")
        self.assertFalse(low_conf)
        self.assertNotEqual(cat, "Unknown")

    def test_generic_skill_category_demoted_below_role(self):
        """Verify generic database tools do not outrank a developer role when role keywords exist."""
        dev_with_db = """
        Software Engineer - Python Developer
        Skills: Python, FastAPI, Django, Pytest, SQL, MySQL, PostgreSQL, MongoDB, Redis.
        """
        cat, strength, low_conf, top_3 = predict_category(dev_with_db)

        self.assertNotEqual(cat, "Database")
        self.assertEqual(cat, "Python Developer")

    def test_section_detection_with_parsed_resume(self):
        """Verify that structured ParsedResume confirms sections accurately."""
        parsed = ParsedResume(
            full_name="Alice Candidate",
            email="alice@example.com",
            phone="+1234567890",
            skills=["Python", "FastAPI"],
            education=[EducationItem(degree="B.S. CS", institution="MIT", year="2020")],
            experience=[ExperienceItem(title="Developer", company="TechCorp", duration="2020-2023")],
            projects=[ProjectItem(name="Personal Blog", description="Built with Python")],
            certifications=["AWS Cloud Practitioner"],
        )

        sections = detect_sections(text="", parsed_resume=parsed)

        self.assertTrue(sections["Contact Info"])
        self.assertTrue(sections["Experience"])
        self.assertTrue(sections["Education"])
        self.assertTrue(sections["Skills"])
        self.assertTrue(sections["Projects"])
        self.assertTrue(sections["Certifications"])

    def test_section_detection_heading_style(self):
        """Verify heading-style line detection works without parsed resume."""
        raw_text = """
        Alex Johnson
        alex@example.com

        SUMMARY
        Senior database engineer.

        EXPERIENCE
        Worked at Global Corp.

        EDUCATION
        Stanford University.

        SKILLS
        SQL, Oracle, Redis.

        PROJECTS
        Migration to cloud database.

        CERTIFICATIONS
        Oracle Certified Professional.
        """

        sections = detect_sections(text=raw_text, parsed_resume=None)

        self.assertTrue(sections["Contact Info"])
        self.assertTrue(sections["Summary/Objective"])
        self.assertTrue(sections["Experience"])
        self.assertTrue(sections["Education"])
        self.assertTrue(sections["Skills"])
        self.assertTrue(sections["Projects"])
        self.assertTrue(sections["Certifications"])

    def test_format_signals_detection(self):
        """Test detection of bullets, dates, metrics, and action verbs."""
        formatted_text = """
        • Implemented scalable message bus using Kafka, reducing latency by 35% across 10,000 users.
        • Architected cloud infrastructure in 2022 with Terraform.
        """
        signals = detect_format_signals(formatted_text)
        self.assertTrue(signals["has_bullets"])
        self.assertTrue(signals["has_dates"])
        self.assertTrue(signals["quantified_impact"])
        self.assertTrue(signals["action_verbs"])
        self.assertEqual(compute_format_score(signals), 100.0)

        unformatted_text = "I am a programmer looking for work in tech. I know how to code."
        bad_signals = detect_format_signals(unformatted_text)
        self.assertFalse(bad_signals["has_bullets"])
        self.assertFalse(bad_signals["has_dates"])
        self.assertFalse(bad_signals["quantified_impact"])
        self.assertFalse(bad_signals["action_verbs"])
        self.assertEqual(compute_format_score(bad_signals), 0.0)

    def test_length_score_thresholds(self):
        """Verify discrete word count brackets."""
        self.assertEqual(compute_length_score(50), 30.0)
        self.assertEqual(compute_length_score(200), 60.0)
        self.assertEqual(compute_length_score(500), 90.0)
        self.assertEqual(compute_length_score(1000), 100.0)
        self.assertEqual(compute_length_score(1500), 80.0)
