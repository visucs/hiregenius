"""
Integration and API Endpoint Tests for ATS Scoring (/api/ats/*).
"""

import copy
import io
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, patch
from bson import ObjectId
from fastapi import HTTPException, UploadFile

from app.api.ats import check_ats_for_job, check_general_ats, get_candidate_ats_result, get_job_categories
from app.services.ats_repository import get_ats_result, save_ats_result

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


class InMemoryAtsCollection:
    """Mock async collection for ats_results tests."""

    def __init__(self):
        self.docs = {}

    async def update_one(self, filter_dict, update_dict, upsert=False):
        key = (filter_dict.get("candidate_id"), filter_dict.get("job_id"))
        set_data = update_dict.get("$set", {})

        class UpdateResult:
            def __init__(self, upserted_id=None, modified_count=0):
                self.upserted_id = upserted_id
                self.modified_count = modified_count

        if key in self.docs:
            self.docs[key].update(copy.deepcopy(set_data))
            return UpdateResult(upserted_id=None, modified_count=1)
        elif upsert:
            new_id = ObjectId()
            new_doc = copy.deepcopy(set_data)
            new_doc["_id"] = new_id
            self.docs[key] = new_doc
            return UpdateResult(upserted_id=new_id, modified_count=0)
        return UpdateResult(upserted_id=None, modified_count=0)

    async def find_one(self, filter_dict, projection=None):
        key = (filter_dict.get("candidate_id"), filter_dict.get("job_id"))
        doc = self.docs.get(key)
        if not doc:
            return None
        return copy.deepcopy(doc)

    def find(self, filter_dict):
        cand_id = filter_dict.get("candidate_id")
        matches = [copy.deepcopy(doc) for (c_id, _), doc in self.docs.items() if c_id == cand_id]

        class Cursor:
            def __init__(self, items):
                self.items = items

            def sort(self, field, direction):
                self.items.sort(key=lambda d: d.get(field, datetime.min), reverse=(direction == -1))
                return self

            def limit(self, n):
                self.items = self.items[:n]
                return self

            async def to_list(self, length=None):
                return self.items[:length] if length else self.items

        return Cursor(matches)


class TestAtsApi(unittest.IsolatedAsyncioTestCase):
    """Async API endpoint tests for ATS checker."""

    def setUp(self):
        self.ats_collection = InMemoryAtsCollection()

    async def test_general_check_endpoint_pdf(self):
        """Test POST /api/ats/check with a valid PDF resume."""
        pdf_path = FIXTURES_DIR / "real_resume_david_kumar.pdf"
        content = pdf_path.read_bytes()
        upload = UploadFile(filename="david_kumar.pdf", file=io.BytesIO(content))

        with patch("app.services.ats_repository.get_ats_collection", return_value=self.ats_collection):
            res = await check_general_ats(candidate_id="101", file=upload)

        self.assertEqual(res.candidate_id, "101")
        self.assertEqual(res.mode, "general")
        self.assertGreater(res.ats_score, 0.0)
        self.assertGreater(res.score_breakdown.sections, 0.0)
        self.assertGreater(res.score_breakdown.format, 0.0)
        self.assertGreater(res.score_breakdown.length, 0.0)
        self.assertIsNone(res.score_breakdown.keyword_match)  # None in general mode
        self.assertGreater(len(res.suggestions), 0)

    async def test_check_for_job_with_file(self):
        """Test POST /api/ats/check-for-job with uploaded file and job description."""
        docx_path = FIXTURES_DIR / "real_resume_alex_smith.docx"
        content = docx_path.read_bytes()
        upload = UploadFile(filename="alex_smith.docx", file=io.BytesIO(content))

        jd = """
        Looking for a Senior Python and DevOps Engineer with strong Kubernetes,
        Docker, and PostgreSQL experience. Familiarity with CI/CD and AWS is required.
        """

        with patch("app.services.ats_repository.get_ats_collection", return_value=self.ats_collection):
            res = await check_ats_for_job(
                candidate_id="102",
                job_description=jd,
                job_id="job_789",
                file=upload,
            )

        self.assertEqual(res.candidate_id, "102")
        self.assertEqual(res.job_id, "job_789")
        self.assertEqual(res.mode, "job_specific")
        self.assertIsNotNone(res.score_breakdown.keyword_match)
        self.assertIsNotNone(res.keyword_analysis)
        self.assertGreater(len(res.keyword_analysis.matched_keywords), 0)

    async def test_check_for_job_without_file_uses_stored_resume(self):
        """Test POST /api/ats/check-for-job when file is omitted: uses stored resume from DB."""
        mock_stored = {
            "candidate_id": "103",
            "original_filename": "stored_resume.pdf",
            "raw_text": """
            Alice Williams
            Email: alice@example.com
            Experience: 5 years in Python, Django, PostgreSQL, Docker, Git.
            Education: B.S. in Computer Science.
            Skills: Python, Django, PostgreSQL, Docker.
            """,
            "parsed_data": {
                "full_name": "Alice Williams",
                "email": "alice@example.com",
                "skills": ["Python", "Django", "PostgreSQL", "Docker"],
                "education": [{"degree": "B.S. CS"}],
                "experience": [{"title": "Software Engineer"}],
            },
        }

        jd = "Seeking a Backend Python Developer experienced with Django and PostgreSQL databases."

        with patch("app.api.ats.get_parsed_resume_by_candidate_id", new_callable=AsyncMock) as mock_get_res:
            mock_get_res.return_value = mock_stored
            with patch("app.services.ats_repository.get_ats_collection", return_value=self.ats_collection):
                res = await check_ats_for_job(
                    candidate_id="103",
                    job_description=jd,
                    job_id="job_444",
                    file=None,
                )

        self.assertEqual(res.candidate_id, "103")
        self.assertEqual(res.job_id, "job_444")
        self.assertEqual(res.mode, "job_specific")
        self.assertIn("python", res.keyword_analysis.matched_keywords)
        self.assertIn("postgresql", res.keyword_analysis.matched_keywords)

    async def test_check_for_job_without_file_404_if_no_resume(self):
        """Verify 404 when resume file is absent and no saved resume exists in DB."""
        with patch("app.api.ats.get_parsed_resume_by_candidate_id", new_callable=AsyncMock) as mock_get_res:
            mock_get_res.return_value = None
            with self.assertRaises(HTTPException) as ctx:
                await check_ats_for_job(
                    candidate_id="999",
                    job_description="Looking for an engineer with at least 30 characters of JD text.",
                    job_id="job_999",
                    file=None,
                )
            self.assertEqual(ctx.exception.status_code, 404)
            self.assertIn("No saved resume found for candidate_id '999'", ctx.exception.detail)

    async def test_job_description_length_validation(self):
        """Verify 400 on JD < 30 chars or > 10,000 chars."""
        with self.assertRaises(HTTPException) as ctx_too_short:
            await check_ats_for_job(
                candidate_id="101",
                job_description="Too short",
                file=None,
            )
        self.assertEqual(ctx_too_short.exception.status_code, 400)
        self.assertIn("too short", ctx_too_short.exception.detail)

        with self.assertRaises(HTTPException) as ctx_too_long:
            await check_ats_for_job(
                candidate_id="101",
                job_description="Python " * 2000,  # ~14,000 chars
                file=None,
            )
        self.assertEqual(ctx_too_long.exception.status_code, 400)
        self.assertIn("exceeds maximum limit", ctx_too_long.exception.detail)

    async def test_scanned_ocr_guard_rejection(self):
        """Verify 422 error on image-only / short extracted text (<50 chars) using real scanned image PDF."""
        ocr_file = FIXTURES_DIR / "scanned_image_resume.pdf"
        content = ocr_file.read_bytes()
        upload = UploadFile(filename="scanned_image.pdf", file=io.BytesIO(content))

        with self.assertRaises(HTTPException) as ctx:
            await check_general_ats(candidate_id="105", file=upload)

        self.assertEqual(ctx.exception.status_code, 422)
        detail = ctx.exception.detail
        if isinstance(detail, dict):
            self.assertEqual(detail.get("error_type"), "ScannedDocumentError")
            self.assertIsNotNone(detail.get("parsability"))
            self.assertTrue(
                "scanned" in detail.get("message", "").lower() or "ocr" in detail.get("message", "").lower()
            )
        else:
            self.assertTrue(
                "scanned" in str(detail).lower() or "ocr" in str(detail).lower()
            )

    async def test_table_layout_docx_parsability_warnings(self):
        """Verify table-based DOCX returns layout parsability warnings without score crashing."""
        docx_file = FIXTURES_DIR / "table_layout_bad_resume.docx"
        content = docx_file.read_bytes()
        upload = UploadFile(filename="table_resume.docx", file=io.BytesIO(content))

        with patch("app.services.ats_repository.get_ats_collection", return_value=self.ats_collection):
            res = await check_general_ats(candidate_id="107", file=upload)

        self.assertEqual(res.candidate_id, "107")
        self.assertIsNotNone(res.parsability)
        self.assertEqual(res.parsability.table_count, 2)
        self.assertTrue(any("table(s)" in w for w in res.parsability.warnings))

    async def test_categories_endpoint(self):
        """Verify GET /api/ats/categories returns all 24 categories."""
        res = await get_job_categories()
        self.assertEqual(len(res.categories), 24)
        self.assertIn("Python Developer", res.categories)
        self.assertIn("Data Science", res.categories)
        self.assertIn("DevOps Engineer", res.categories)

    async def test_get_ats_result_retrieval(self):
        """Test GET /api/ats/{candidate_id} with and without job_id."""
        await save_ats_result(
            candidate_id="106",
            job_id=None,
            result_data={
                "mode": "general",
                "ats_score": 75.0,
                "score_breakdown": {"sections": 80.0, "length": 90.0, "format": 50.0},
                "predicted_category": {"category": "Python Developer", "match_strength": 60.0},
                "sections_found": {"Skills": True},
                "format_signals": {"has_bullets": True, "has_dates": True, "quantified_impact": False, "action_verbs": False},
                "word_count": 400,
                "suggestions": ["Test tip"],
            },
            custom_collection=self.ats_collection,
        )

        with patch("app.services.ats_repository.get_ats_collection", return_value=self.ats_collection):
            res = await get_candidate_ats_result(candidate_id="106")
            self.assertEqual(res.candidate_id, "106")
            self.assertEqual(res.ats_score, 75.0)

            # Non-existent candidate
            with self.assertRaises(HTTPException) as ctx_not_found:
                await get_candidate_ats_result(candidate_id="999")
            self.assertEqual(ctx_not_found.exception.status_code, 404)
