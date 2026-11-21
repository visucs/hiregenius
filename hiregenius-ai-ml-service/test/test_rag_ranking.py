"""
Comprehensive Unit & Integration Test Suite for Phase 8: Candidate Ranking (RAG).

Validates:
1. PII sanitization and Fairness Swap Invariance (swapping name/gender/brand yields identical scores).
2. Related resume outranks unrelated resume.
3. Ranking determinism across repeated runs.
4. Privacy & Applicant-set isolation (non-applicants never leak).
5. Idempotent re-indexing (re-index replaces vectors without duplicates).
6. Deletion (removes all vectors and resets status).
7. Grounded explanation schema validation and chunk ID citations.
8. Fallback paths (semantic_unavailable=True when embedding/vector store fails).
9. Not-rankable candidate handling (unparsed, scanned, or missing resumes).
10. API authentication security (X-Internal-Key protection).
"""

from datetime import datetime, timezone
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.rag import (
    IndexCandidateRequest,
    RankCandidatesRequest,
    delete_candidate_vectors,
    get_candidate_index_status,
    index_candidate_resume,
    rank_job_applicants,
)
from app.config import settings
from app.main import app
from app.models.resume import (
    EducationItem,
    ExperienceItem,
    ParsedResume,
    ProjectItem,
)
from app.services.ats.jd_extractor import JDExtractedRequirements
from app.services.rag.chunker import chunk_parsed_resume
from app.services.rag.grounded_explainer import (
    GroundedExplanation,
    GroundedStrength,
    generate_grounded_explanation,
)
from app.services.rag.pii_stripper import (
    sanitize_education_text,
    sanitize_experience_text,
    sanitize_project_text,
    sanitize_skills_text,
    sanitize_text,
)
from app.services.rag.ranking_engine import (
    CandidateRankingEngine,
    RankedCandidateItem,
    RankingResponse,
    ranking_engine,
)
from app.services.rag.vector_store import VectorStoreService, cosine_similarity


class MockAsyncCursor:
    """Async iterator helper to simulate Motor collection cursors in tests."""

    def __init__(self, docs):
        self.docs = docs

    def __aiter__(self):
        async def gen():
            for doc in self.docs:
                yield doc
        return gen()


class TestRAGFairnessAndPII(unittest.TestCase):
    """Test suite for PII sanitization, brand neutralization, and fairness swap invariance."""

    def setUp(self):
        # Candidate Male Profile (Tier-1 college, FAANG company, Male demographics)
        self.resume_male = ParsedResume(
            full_name="John Jonathan Doe",
            email="john.doe@google.com",
            phone="+1 555-019-2834",
            skills=["Python", "FastAPI", "React", "PostgreSQL", "Docker", "AWS"],
            education=[
                EducationItem(degree="B.S. Computer Science", institution="Stanford University", year="2018")
            ],
            experience=[
                ExperienceItem(
                    title="Senior Software Engineer",
                    company="Google Inc.",
                    duration="3 years",
                    description="He architected distributed REST microservices using Python and FastAPI. He led a team of 4.",
                )
            ],
            projects=[
                ProjectItem(
                    name="Cloud Streamer",
                    description="Built high-throughput data processing pipeline with Docker and AWS.",
                    technologies=["Python", "Docker", "AWS"],
                )
            ],
        )

        # Candidate Female Profile (Same skills & achievements, Tier-3 college, startup, Female demographics)
        self.resume_female = ParsedResume(
            full_name="Jane Janet Smith",
            email="jane.smith@smallstartup.io",
            phone="+44 20 7946 0912",
            skills=["Python", "FastAPI", "React", "PostgreSQL", "Docker", "AWS"],
            education=[
                EducationItem(degree="B.S. Computer Science", institution="Local State Technical College", year="2018")
            ],
            experience=[
                ExperienceItem(
                    title="Senior Software Engineer",
                    company="Local Startup Ltd.",
                    duration="3 years",
                    description="She architected distributed REST microservices using Python and FastAPI. She led a team of 4.",
                )
            ],
            projects=[
                ProjectItem(
                    name="Cloud Streamer",
                    description="Built high-throughput data processing pipeline with Docker and AWS.",
                    technologies=["Python", "Docker", "AWS"],
                )
            ],
        )

    def test_pii_and_demographics_stripped(self):
        raw_text = (
            "John Doe\n"
            "Email: john@example.com | Phone: +1 555 123 4567\n"
            "Date of Birth: 12/05/1990 | Gender: Male | Marital Status: Single\n"
            "Nationality: American | Religion: None\n"
            "Address: 123 Tech Lane, San Francisco, CA\n"
            "Experienced Python engineer building scalable cloud systems.\n"
        )
        clean = sanitize_text(raw_text, candidate_name="John Doe", candidate_email="john@example.com")
        self.assertNotIn("John Doe", clean)
        self.assertNotIn("john@example.com", clean)
        self.assertNotIn("+1 555 123 4567", clean)
        self.assertNotIn("Date of Birth", clean)
        self.assertNotIn("Gender: Male", clean)
        self.assertNotIn("Marital Status", clean)
        self.assertNotIn("Nationality", clean)

    def test_fairness_swap_invariance(self):
        """
        Swapping candidate name, gender pronouns, email, phone, college, and company brand
        MUST produce 100% identical sanitized chunks and text.
        """
        chunks_male = chunk_parsed_resume(
            candidate_id="cand_male",
            parsed_data=self.resume_male,
            resume_version="v1",
        )
        chunks_female = chunk_parsed_resume(
            candidate_id="cand_female",
            parsed_data=self.resume_female,
            resume_version="v1",
        )

        self.assertEqual(len(chunks_male), len(chunks_female))

        for cm, cf in zip(chunks_male, chunks_female):
            self.assertEqual(cm.chunk_type, cf.chunk_type)
            # Texts must be identical word-for-word after PII stripping and pronoun neutralization
            self.assertEqual(
                cm.text.strip(),
                cf.text.strip(),
                f"Mismatch in chunk text for type {cm.chunk_type}:\n{cm.text}\nVS\n{cf.text}",
            )


class TestRAGRankingEngine(unittest.IsolatedAsyncioTestCase):
    """Test suite for RAG ranking composite logic, determinism, outranking, and isolation."""

    def setUp(self):
        self.engine = CandidateRankingEngine()

        # Job posting: Senior Python Backend Developer
        self.job_title = "Senior Python Backend Developer"
        self.job_desc = (
            "We are seeking an experienced Senior Python Backend Engineer to build high-scale APIs. "
            "Must have 3+ years experience with Python, FastAPI, Docker, and PostgreSQL. "
            "Bachelor's degree in Computer Science required."
        )

        self.mock_reqs = JDExtractedRequirements(
            required_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
            preferred_skills=["AWS", "Git"],
            experience_years=3.0,
            role_level="Senior",
            target_title="Senior Python Backend Developer",
        )

        # Candidate A: Highly qualified Backend Python Engineer
        self.cand_a_parsed = {
            "full_name": "Alice Developer",
            "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "Git"],
            "education": [{"degree": "Bachelor of Technology in Computer Science", "institution": "State Univ", "year": "2019"}],
            "experience": [
                {
                    "title": "Backend Python Developer",
                    "company": "Tech Corp",
                    "duration": "4 years",
                    "description": "Built distributed backend systems using Python and FastAPI with PostgreSQL databases.",
                }
            ],
            "projects": [
                {
                    "name": "Microservice Gateway",
                    "description": "Dockerized microservices deployment on AWS with CI/CD.",
                    "technologies": ["Python", "FastAPI", "Docker"],
                }
            ],
        }

        # Candidate B: Graphic Designer (unrelated skills)
        # Candidate B: Graphic Designer (unrelated skills)
        self.cand_b_parsed = {
            "full_name": "Bob Designer",
            "skills": ["Photoshop", "Figma", "Illustrator", "Typography", "UI/UX"],
            "education": [{"degree": "Bachelor of Fine Arts", "institution": "Art Academy", "year": "2020"}],
            "experience": [
                {
                    "title": "Graphic Designer",
                    "company": "Design Studio",
                    "duration": "3 years",
                    "description": "Created branding, social media assets, logos, and print layouts using Photoshop and Illustrator.",
                }
            ],
            "projects": [
                {
                    "name": "Brand Identity Redesign",
                    "description": "Complete corporate visual identity guideline.",
                    "technologies": ["Figma", "Photoshop"],
                }
            ],
        }

        self.cand_a_raw_text = (
            "Alice Developer - Senior Software Engineer\n"
            "Skills: Python, FastAPI, PostgreSQL, Docker, AWS, Git\n"
            "Experience: 4 years building scalable distributed backend services and REST APIs with Python and FastAPI."
        )
        self.cand_b_raw_text = (
            "Bob Designer - Graphic Designer and Visual Artist\n"
            "Skills: Photoshop, Figma, Illustrator, Typography, UI/UX\n"
            "Experience: 3 years creating branding, marketing graphics, and typography layouts with Figma and Illustrator."
        )

    @patch("app.services.rag.ranking_engine.generate_grounded_explanation")
    @patch("app.services.rag.ranking_engine.extract_job_requirements")
    @patch("app.services.rag.ranking_engine.get_resumes_collection")
    @patch("app.services.rag.ranking_engine.vector_store_service.search_applicant_chunks")
    @patch("app.services.rag.ranking_engine.embedding_client.embed_query")
    async def test_related_resume_outranks_unrelated(
        self, mock_embed_query, mock_search_chunks, mock_get_col, mock_extract_reqs, mock_explain
    ):
        """Confirm candidate with matching tech skills significantly outranks unrelated profile."""
        mock_extract_reqs.return_value = (self.mock_reqs, False)
        mock_explain.return_value = GroundedExplanation(
            summary="Grounded match summary",
            strengths=[GroundedStrength(claim="Proficient in Python", chunk_ids=["c1"])],
            gaps=[],
            recommendation="STRONG_MATCH",
            is_fallback=True,
        )
        mock_embed_query.return_value = [0.1] * 768

        # Mock vector search results: Candidate A has high similarity, Candidate B has low similarity
        mock_search_chunks.return_value = {
            "cand_alice": [
                {"chunk_id": "cand_alice_exp_0", "chunk_type": "experience", "text": "Python FastAPI", "similarity": 0.88},
                {"chunk_id": "cand_alice_skl_1", "chunk_type": "skills", "text": "Python PostgreSQL", "similarity": 0.84},
            ],
            "cand_bob": [
                {"chunk_id": "cand_bob_exp_0", "chunk_type": "experience", "text": "Photoshop Designer", "similarity": 0.35},
                {"chunk_id": "cand_bob_skl_1", "chunk_type": "skills", "text": "Figma Typography", "similarity": 0.30},
            ],
        }

        mock_col = MagicMock()
        mock_docs = [
            {
                "candidate_id": "cand_alice",
                "raw_text": self.cand_a_raw_text,
                "parsed_data": self.cand_a_parsed,
                "rag_status": "INDEXED",
            },
            {
                "candidate_id": "cand_bob",
                "raw_text": self.cand_b_raw_text,
                "parsed_data": self.cand_b_parsed,
                "rag_status": "INDEXED",
            },
        ]

        mock_col.find.return_value = MockAsyncCursor(mock_docs)
        mock_get_col.return_value = mock_col

        response = await self.engine.rank_candidates(
            job_title=self.job_title,
            job_description=self.job_desc,
            applicant_candidate_ids=["cand_alice", "cand_bob"],
        )

        self.assertEqual(len(response.rankings), 2)
        rank_1 = response.rankings[0]
        rank_2 = response.rankings[1]

        self.assertEqual(rank_1.candidate_id, "cand_alice")
        self.assertEqual(rank_1.rank, 1)
        self.assertEqual(rank_2.candidate_id, "cand_bob")
        self.assertEqual(rank_2.rank, 2)
        self.assertGreater(rank_1.score, rank_2.score + 30.0)

    @patch("app.services.rag.ranking_engine.generate_grounded_explanation")
    @patch("app.services.rag.ranking_engine.extract_job_requirements")
    @patch("app.services.rag.ranking_engine.get_resumes_collection")
    @patch("app.services.rag.ranking_engine.vector_store_service.search_applicant_chunks")
    @patch("app.services.rag.ranking_engine.embedding_client.embed_query")
    async def test_determinism_across_runs(
        self, mock_embed_query, mock_search_chunks, mock_get_col, mock_extract_reqs, mock_explain
    ):
        """Repeated rankings with identical inputs must produce identical scores and ranks."""
        mock_extract_reqs.return_value = (self.mock_reqs, False)
        mock_explain.return_value = GroundedExplanation(
            summary="Grounded match summary",
            strengths=[],
            gaps=[],
            recommendation="GOOD_MATCH",
            is_fallback=True,
        )
        mock_embed_query.return_value = [0.1] * 768
        mock_search_chunks.return_value = {
            "cand_alice": [{"chunk_id": "c1", "chunk_type": "exp", "text": "Python", "similarity": 0.85}],
            "cand_bob": [{"chunk_id": "c2", "chunk_type": "exp", "text": "Design", "similarity": 0.40}],
        }

        mock_col = MagicMock()
        mock_docs = [
            {"candidate_id": "cand_alice", "raw_text": self.cand_a_raw_text, "parsed_data": self.cand_a_parsed, "rag_status": "INDEXED"},
            {"candidate_id": "cand_bob", "raw_text": self.cand_b_raw_text, "parsed_data": self.cand_b_parsed, "rag_status": "INDEXED"},
        ]

        mock_col.find.side_effect = lambda *args, **kwargs: MockAsyncCursor(mock_docs)
        mock_get_col.return_value = mock_col

        run_1 = await self.engine.rank_candidates(
            job_title=self.job_title,
            job_description=self.job_desc,
            applicant_candidate_ids=["cand_alice", "cand_bob"],
        )
        run_2 = await self.engine.rank_candidates(
            job_title=self.job_title,
            job_description=self.job_desc,
            applicant_candidate_ids=["cand_bob", "cand_alice"],  # Order shuffled
        )

        self.assertEqual(run_1.rankings[0].candidate_id, run_2.rankings[0].candidate_id)
        self.assertEqual(run_1.rankings[0].score, run_2.rankings[0].score)
        self.assertEqual(run_1.rankings[1].candidate_id, run_2.rankings[1].candidate_id)
        self.assertEqual(run_1.rankings[1].score, run_2.rankings[1].score)

    @patch("app.services.rag.ranking_engine.generate_grounded_explanation")
    @patch("app.services.rag.ranking_engine.extract_job_requirements")
    @patch("app.services.rag.ranking_engine.get_resumes_collection")
    @patch("app.services.rag.ranking_engine.vector_store_service.search_applicant_chunks")
    @patch("app.services.rag.ranking_engine.embedding_client.embed_query")
    async def test_applicant_set_isolation(
        self, mock_embed_query, mock_search_chunks, mock_get_col, mock_extract_reqs, mock_explain
    ):
        """Non-applicants must never appear in the ranked list or search queries."""
        mock_extract_reqs.return_value = (self.mock_reqs, False)
        mock_explain.return_value = GroundedExplanation(
            summary="Grounded match summary",
            strengths=[],
            gaps=[],
            recommendation="GOOD_MATCH",
            is_fallback=True,
        )
        mock_embed_query.return_value = [0.1] * 768

        # Only cand_alice is in the applicant set
        mock_search_chunks.return_value = {
            "cand_alice": [{"chunk_id": "c1", "chunk_type": "exp", "text": "Python", "similarity": 0.85}],
        }

        mock_col = MagicMock()
        mock_docs = [
            {"candidate_id": "cand_alice", "raw_text": self.cand_a_raw_text, "parsed_data": self.cand_a_parsed, "rag_status": "INDEXED"},
        ]
        mock_col.find.return_value = MockAsyncCursor(mock_docs)
        mock_get_col.return_value = mock_col

        response = await self.engine.rank_candidates(
            job_title=self.job_title,
            job_description=self.job_desc,
            applicant_candidate_ids=["cand_alice"],  # cand_bob is NOT an applicant
        )

        ranked_ids = [r.candidate_id for r in response.rankings]
        self.assertIn("cand_alice", ranked_ids)
        self.assertNotIn("cand_bob", ranked_ids)
        # Vector search was called ONLY with applicant candidates
        mock_search_chunks.assert_called_once_with(
            applicant_candidate_ids=["cand_alice"],
            query_embedding=[0.1] * 768,
            top_k_per_applicant=3,
        )

    @patch("app.services.rag.ranking_engine.generate_grounded_explanation")
    @patch("app.services.rag.ranking_engine.extract_job_requirements")
    @patch("app.services.rag.ranking_engine.get_resumes_collection")
    @patch("app.services.rag.ranking_engine.embedding_client.embed_query")
    async def test_fallback_when_embedding_fails(
        self, mock_embed_query, mock_get_col, mock_extract_reqs, mock_explain
    ):
        """When Gemini embedding API is down, fallback to deterministic scoring with semantic_unavailable=True."""
        mock_extract_reqs.return_value = (self.mock_reqs, False)
        mock_explain.return_value = GroundedExplanation(
            summary="Fallback summary",
            strengths=[],
            gaps=[],
            recommendation="GOOD_MATCH",
            is_fallback=True,
        )
        mock_embed_query.side_effect = Exception("Google Generative AI service timeout")

        mock_col = MagicMock()
        mock_docs = [
            {"candidate_id": "cand_alice", "raw_text": self.cand_a_raw_text, "parsed_data": self.cand_a_parsed, "rag_status": "INDEXED"},
        ]
        mock_col.find.return_value = MockAsyncCursor(mock_docs)
        mock_get_col.return_value = mock_col

        response = await self.engine.rank_candidates(
            job_title=self.job_title,
            job_description=self.job_desc,
            applicant_candidate_ids=["cand_alice"],
        )

        self.assertTrue(response.semantic_unavailable)
        self.assertEqual(len(response.rankings), 1)
        self.assertEqual(response.rankings[0].components.semantic_weight, 0.0)
        self.assertGreater(response.rankings[0].score, 0.0)

    @patch("app.services.rag.ranking_engine.extract_job_requirements")
    @patch("app.services.rag.ranking_engine.get_resumes_collection")
    async def test_not_rankable_candidates_handled(self, mock_get_col, mock_extract_reqs):
        """Missing or unreadable/scanned resumes must be listed under not_rankable with reasons."""
        mock_extract_reqs.return_value = (self.mock_reqs, False)
        mock_col = MagicMock()
        mock_docs = [
            # cand_scanned has very short text (< 50 chars)
            {"candidate_id": "cand_scanned", "raw_text": "Scanned Image", "parsed_data": None, "rag_status": "FAILED"},
        ]
        mock_col.find.return_value = MockAsyncCursor(mock_docs)
        mock_get_col.return_value = mock_col

        # cand_missing is not in DB at all; cand_scanned has short unreadable text
        response = await self.engine.rank_candidates(
            job_title=self.job_title,
            job_description=self.job_desc,
            applicant_candidate_ids=["cand_missing", "cand_scanned"],
        )

        self.assertEqual(len(response.rankings), 0)
        self.assertEqual(len(response.not_rankable), 2)

        unrankable_map = {item.candidate_id: item.reason for item in response.not_rankable}
        self.assertIn("cand_missing", unrankable_map)
        self.assertIn("No resume has been uploaded", unrankable_map["cand_missing"])
        self.assertIn("cand_scanned", unrankable_map)
        self.assertIn("unreadable", unrankable_map["cand_scanned"])


class TestVectorStoreService(unittest.IsolatedAsyncioTestCase):
    """Test suite for vector storage, idempotent re-indexing, and deletion."""

    def setUp(self):
        self.vs = VectorStoreService()
        self.sample_resume = ParsedResume(
            skills=["Python", "FastAPI"],
            experience=[ExperienceItem(title="Developer", company="Corp", description="Built APIs")],
            education=[EducationItem(degree="B.S. CS", institution="Univ", year="2020")],
        )

    def test_cosine_similarity_math(self):
        v1 = [1.0, 0.0, 0.0]
        v2 = [1.0, 0.0, 0.0]
        v3 = [0.0, 1.0, 0.0]

        # Identical vectors: normalized cosine similarity = 1.0
        self.assertAlmostEqual(cosine_similarity(v1, v2), 1.0, places=4)
        # Orthogonal vectors: cosine = 0.0, normalized = 0.5
        self.assertAlmostEqual(cosine_similarity(v1, v3), 0.5, places=4)

    @patch("app.services.rag.vector_store.get_resumes_collection")
    @patch("app.services.rag.vector_store.get_resume_chunks_collection")
    @patch("app.services.rag.vector_store.embedding_client.embed_documents")
    async def test_idempotent_reindexing_replaces_vectors(
        self, mock_embed_docs, mock_get_chunks_col, mock_get_res_col
    ):
        mock_chunks_col = AsyncMock()
        mock_res_col = AsyncMock()
        mock_get_chunks_col.return_value = mock_chunks_col
        mock_get_res_col.return_value = mock_res_col

        mock_embed_docs.return_value = [[0.1] * 768, [0.2] * 768, [0.3] * 768]

        res = await self.vs.index_candidate(
            candidate_id="cand_123",
            parsed_resume=self.sample_resume,
            raw_text="Developer with Python and FastAPI experience.",
        )

        self.assertEqual(res["status"], "INDEXED")
        # Assert previous vectors for cand_123 were deleted before inserting new
        mock_chunks_col.delete_many.assert_called_with({"candidate_id": "cand_123"})
        mock_chunks_col.insert_many.assert_called_once()

    @patch("app.services.rag.vector_store.get_resumes_collection")
    @patch("app.services.rag.vector_store.get_resume_chunks_collection")
    async def test_delete_candidate_vectors(self, mock_get_chunks_col, mock_get_res_col):
        mock_chunks_col = AsyncMock()
        mock_res_col = AsyncMock()
        mock_chunks_col.delete_many.return_value.deleted_count = 5
        mock_get_chunks_col.return_value = mock_chunks_col
        mock_get_res_col.return_value = mock_res_col

        count = await self.vs.delete_candidate("cand_123")
        self.assertEqual(count, 5)
        mock_chunks_col.delete_many.assert_called_once_with({"candidate_id": "cand_123"})


class TestGroundedExplainer(unittest.IsolatedAsyncioTestCase):
    """Test suite for grounded explanation citations and schema validation."""

    @patch("app.services.rag.grounded_explainer.settings.GEMINI_API_KEY", "")
    async def test_grounded_explanation_cites_valid_chunks(self):
        chunks = [
            {"chunk_id": "cand_1_skl_0", "chunk_type": "skills", "text": "Skills: Python, FastAPI, Docker"},
            {"chunk_id": "cand_1_exp_0", "chunk_type": "experience", "text": "Role: Backend Developer. Built REST APIs."},
        ]

        explanation = await generate_grounded_explanation(
            candidate_id="cand_1",
            job_title="Backend Developer",
            required_skills=["Python", "FastAPI"],
            preferred_skills=["Docker"],
            experience_years=2.0,
            role_level="Mid",
            candidate_years=3.0,
            matched_skills=["Python", "FastAPI"],
            missing_skills=[],
            candidate_chunks=chunks,
            composite_score=85.0,
        )

        self.assertIsInstance(explanation, GroundedExplanation)
        self.assertTrue(len(explanation.strengths) > 0)
        # Every strength must carry non-empty chunk_ids
        for s in explanation.strengths:
            self.assertIsInstance(s.claim, str)
            self.assertTrue(len(s.chunk_ids) > 0)
            for cid in s.chunk_ids:
                # Chunk IDs must belong to the provided candidate chunks
                self.assertIn(cid, ["cand_1_skl_0", "cand_1_exp_0"])


class TestRAGApiEndpoints(unittest.TestCase):
    """Test suite for /api/rag router authorization and request validation."""

    def setUp(self):
        self.client = TestClient(app)
        self.valid_key = settings.AI_ML_SERVICE_INTERNAL_KEY

    def test_rag_endpoints_require_internal_key(self):
        """Endpoints must reject missing or incorrect X-Internal-Key with HTTP 401."""
        # 1. POST /api/rag/rank without key
        res = self.client.post("/api/rag/rank", json={"job_title": "Dev", "job_description": "JD", "candidate_ids": []})
        self.assertEqual(res.status_code, 401)

        # 2. POST /api/rag/index without key
        res = self.client.post("/api/rag/index", json={"candidate_id": "c1"})
        self.assertEqual(res.status_code, 401)

        # 3. DELETE /api/rag/index/c1 without key
        res = self.client.delete("/api/rag/index/c1")
        self.assertEqual(res.status_code, 401)

    def test_rank_empty_applicants_returns_empty_response(self):
        """POST /api/rag/rank with 0 applicants returns clean empty response without error."""
        res = self.client.post(
            "/api/rag/rank",
            headers={"X-Internal-Key": self.valid_key},
            json={
                "job_title": "Software Engineer",
                "job_description": "We need an engineer.",
                "candidate_ids": [],
            },
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_applicants"], 0)
        self.assertEqual(len(data["rankings"]), 0)


if __name__ == "__main__":
    unittest.main()
