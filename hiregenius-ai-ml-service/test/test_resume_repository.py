import copy
import io
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, patch
from bson import ObjectId
from fastapi import HTTPException, UploadFile

from app.api.resume import get_candidate_resume, parse_resume
from app.models.resume import (
    EducationItem,
    ExperienceItem,
    ParsedResume,
    ParsedResumeResponse,
    ProjectItem,
    SavedResumeResponse,
)
from app.services.resume_repository import (
    DatabaseNotConnectedError,
    ResumeRepositoryError,
    get_parsed_resume_by_candidate_id,
    save_parsed_resume,
)

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


class InMemoryAsyncCollection:
    """In-memory async Motor collection simulation for fast, deterministic unit testing."""

    def __init__(self):
        self.docs = {}

    async def update_one(self, filter_dict, update_dict, upsert=False):
        cand_id = filter_dict.get("candidate_id")
        set_data = update_dict.get("$set", {})

        class UpdateResult:
            def __init__(self, upserted_id=None, modified_count=0):
                self.upserted_id = upserted_id
                self.modified_count = modified_count

        if cand_id in self.docs:
            self.docs[cand_id].update(copy.deepcopy(set_data))
            return UpdateResult(upserted_id=None, modified_count=1)
        elif upsert:
            new_id = ObjectId()
            new_doc = copy.deepcopy(set_data)
            new_doc["_id"] = new_id
            new_doc["candidate_id"] = cand_id
            self.docs[cand_id] = new_doc
            return UpdateResult(upserted_id=new_id, modified_count=0)
        return UpdateResult(upserted_id=None, modified_count=0)

    async def find_one(self, filter_dict, projection=None):
        cand_id = filter_dict.get("candidate_id")
        doc = self.docs.get(cand_id)
        if not doc:
            return None
        doc_copy = copy.deepcopy(doc)
        if projection and projection.get("_id") == 1 and len(projection) == 1:
            return {"_id": doc_copy["_id"]}
        return doc_copy

    async def count_documents(self, filter_dict=None):
        if not filter_dict:
            return len(self.docs)
        cand_id = filter_dict.get("candidate_id")
        return 1 if cand_id in self.docs else 0

    async def create_index(self, keys, unique=False):
        return "candidate_id_1"


class TestResumeRepositoryService(unittest.IsolatedAsyncioTestCase):
    """Unit tests for resume_repository service logic."""

    def setUp(self):
        self.mock_collection = InMemoryAsyncCollection()
        self.sample_parsed = ParsedResume(
            full_name="Jane Doe",
            email="jane.doe@example.com",
            phone="+1 555 123 4567",
            skills=["Python", "FastAPI", "MongoDB", "Docker"],
            education=[
                EducationItem(
                    degree="M.S. in Computer Science",
                    institution="Stanford University",
                    year="2020",
                )
            ],
            experience=[
                ExperienceItem(
                    title="Staff Engineer",
                    company="CloudWorks",
                    duration="2020 - Present",
                    description="Led platform engineering teams.",
                )
            ],
            certifications=["AWS Certified DevOps Engineer"],
            projects=[
                ProjectItem(
                    name="HireGenius AI",
                    description="AI recruitment platform.",
                    technologies=["FastAPI", "MongoDB"],
                )
            ],
        )

    async def test_save_then_retrieve_returns_same_data(self):
        """Confirm saving a parsed resume and retrieving it returns identical structured data."""
        doc_id = await save_parsed_resume(
            candidate_id="cand_test_001",
            filename="jane_resume.pdf",
            raw_text="Jane Doe Staff Engineer Python FastAPI",
            parsed_data=self.sample_parsed,
            custom_collection=self.mock_collection,
            model_version="gemini-3.8-flash",
        )

        self.assertIsNotNone(doc_id)
        self.assertTrue(len(doc_id) > 0)

        retrieved = await get_parsed_resume_by_candidate_id(
            candidate_id="cand_test_001",
            custom_collection=self.mock_collection,
        )

        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["candidate_id"], "cand_test_001")
        self.assertEqual(retrieved["original_filename"], "jane_resume.pdf")
        self.assertEqual(retrieved["parsed_data"]["full_name"], "Jane Doe")
        self.assertEqual(retrieved["parsed_data"]["skills"], ["Python", "FastAPI", "MongoDB", "Docker"])
        self.assertEqual(retrieved["model_version"], "gemini-3.8-flash")
        self.assertIn("id", retrieved)
        self.assertEqual(retrieved["id"], doc_id)

    async def test_saving_twice_for_same_candidate_id_upserts_and_prevents_duplicates(self):
        """Confirm saving twice for the same candidate_id replaces data (upsert) without duplicates."""
        # First save
        first_id = await save_parsed_resume(
            candidate_id="cand_dup_check",
            filename="initial_v1.pdf",
            raw_text="Initial raw text v1",
            parsed_data=self.sample_parsed,
            custom_collection=self.mock_collection,
        )

        initial_count = await self.mock_collection.count_documents()
        self.assertEqual(initial_count, 1)

        # Second save with updated resume data
        updated_parsed = copy.deepcopy(self.sample_parsed)
        updated_parsed.skills.append("Kubernetes")
        updated_parsed.full_name = "Jane Doe Updated"

        second_id = await save_parsed_resume(
            candidate_id="cand_dup_check",
            filename="updated_v2.docx",
            raw_text="Updated raw text v2 with Kubernetes",
            parsed_data=updated_parsed,
            custom_collection=self.mock_collection,
        )

        # Document ID should remain stable or point to the same candidate's unique record
        self.assertEqual(first_id, second_id)

        # Total document count must remain strictly 1 (no duplicate records created)
        total_count = await self.mock_collection.count_documents()
        self.assertEqual(total_count, 1)

        # Content must reflect the replacement (upserted values)
        doc = await get_parsed_resume_by_candidate_id(
            candidate_id="cand_dup_check",
            custom_collection=self.mock_collection,
        )
        self.assertEqual(doc["original_filename"], "updated_v2.docx")
        self.assertEqual(doc["parsed_data"]["full_name"], "Jane Doe Updated")
        self.assertIn("Kubernetes", doc["parsed_data"]["skills"])

    async def test_get_nonexistent_candidate_returns_none(self):
        """Confirm querying a non-existent candidate_id returns None without error."""
        result = await get_parsed_resume_by_candidate_id(
            candidate_id="non_existent_candidate_999",
            custom_collection=self.mock_collection,
        )
        self.assertIsNone(result)

    async def test_empty_candidate_id_validation(self):
        """Confirm empty candidate_id raises ValueError on save and returns None on get."""
        with self.assertRaises(ValueError):
            await save_parsed_resume(
                candidate_id="   ",
                filename="doc.pdf",
                raw_text="Sample text",
                parsed_data=self.sample_parsed,
                custom_collection=self.mock_collection,
            )

        empty_get = await get_parsed_resume_by_candidate_id(
            candidate_id="  ",
            custom_collection=self.mock_collection,
        )
        self.assertIsNone(empty_get)

    async def test_disconnected_database_raises_clean_exception(self):
        """Confirm operations raise DatabaseNotConnectedError when get_resumes_collection is None."""
        with patch("app.services.resume_repository.get_resumes_collection", return_value=None):
            with self.assertRaises(DatabaseNotConnectedError):
                await save_parsed_resume(
                    candidate_id="cand_any",
                    filename="doc.pdf",
                    raw_text="Sample",
                    parsed_data=self.sample_parsed,
                )

            with self.assertRaises(DatabaseNotConnectedError):
                await get_parsed_resume_by_candidate_id("cand_any")


class TestResumeEndpointsPartE(unittest.IsolatedAsyncioTestCase):
    """Integration tests for POST /api/resume/parse and GET /api/resume/{candidate_id}."""

    @classmethod
    def setUpClass(cls):
        cls.sample_pdf_path = FIXTURES_DIR / "sample_resume.pdf"
        with open(cls.sample_pdf_path, "rb") as f:
            cls.sample_pdf_bytes = f.read()

        cls.mock_parsed = ParsedResume(
            full_name="David Kumar",
            email="david.kumar@hiregenius.ai",
            phone="+1 415 555 2671",
            skills=["Python", "FastAPI", "MongoDB"],
        )

    async def test_post_parse_saves_to_repository_and_returns_id(self):
        """Confirm POST /api/resume/parse triggers save_parsed_resume and includes document ID."""
        upload_file = UploadFile(
            filename="david_resume.pdf",
            file=io.BytesIO(self.sample_pdf_bytes),
        )

        with patch("app.api.resume.parse_resume_text", new_callable=AsyncMock) as mock_agent, \
             patch("app.api.resume.save_parsed_resume", new_callable=AsyncMock) as mock_save:
            mock_agent.return_value = self.mock_parsed
            mock_save.return_value = "66f123456789abcdef012345"

            res = await parse_resume(
                file=upload_file,
                candidate_id="cand_test_456",
            )

        self.assertIsInstance(res, ParsedResumeResponse)
        self.assertEqual(res.id, "66f123456789abcdef012345")
        self.assertEqual(res.mongo_id, "66f123456789abcdef012345")
        self.assertEqual(res.candidate_id, "cand_test_456")
        self.assertEqual(res.parsed_data.full_name, "David Kumar")
        self.assertIn("FastAPI", res.parsed_data.skills)
        mock_save.assert_called_once()

    async def test_post_parse_rejects_empty_candidate_id(self):
        """Confirm POST /api/resume/parse returns HTTP 400 when candidate_id is empty or whitespace."""
        upload_file = UploadFile(
            filename="david_resume.pdf",
            file=io.BytesIO(self.sample_pdf_bytes),
        )

        with self.assertRaises(HTTPException) as ctx:
            await parse_resume(file=upload_file, candidate_id="   ")

        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("candidate_id cannot be empty", ctx.exception.detail)

    async def test_get_candidate_resume_success(self):
        """Confirm GET /api/resume/{candidate_id} returns 200 with SavedResumeResponse."""
        fake_doc = {
            "id": "66f123456789abcdef012345",
            "_id": "66f123456789abcdef012345",
            "candidate_id": "cand_exists_100",
            "original_filename": "david_resume.pdf",
            "raw_text": "David Kumar Senior Backend Engineer",
            "parsed_data": self.mock_parsed.model_dump(),
            "parsed_at": datetime.now(timezone.utc),
            "model_version": "gemini-3.8-flash",
        }

        with patch(
            "app.api.resume.get_parsed_resume_by_candidate_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = fake_doc
            res = await get_candidate_resume("cand_exists_100")

        self.assertEqual(res["candidate_id"], "cand_exists_100")
        self.assertEqual(res["id"], "66f123456789abcdef012345")

    async def test_get_candidate_resume_not_found_returns_404(self):
        """Confirm GET /api/resume/{candidate_id} returns 404 when resume does not exist."""
        with patch(
            "app.api.resume.get_parsed_resume_by_candidate_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = None
            with self.assertRaises(HTTPException) as ctx:
                await get_candidate_resume("cand_missing_404")

        self.assertEqual(ctx.exception.status_code, 404)
        self.assertIn("No parsed resume found", ctx.exception.detail)
