import io
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException, UploadFile
from app.api.resume import parse_resume
from app.models.resume import (
    EducationItem,
    ExperienceItem,
    ParsedResume,
    ProjectItem,
)
from app.services.resume_agent import (
    ResumeParsingConfigError,
    ResumeParsingError,
    parse_resume_text,
)

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


class TestResumeAgentUnit(unittest.IsolatedAsyncioTestCase):
    """Unit tests for resume_agent service with mocked Gemini LLM."""

    @classmethod
    def setUpClass(cls):
        cls.sample_pdf_path = FIXTURES_DIR / "sample_resume.pdf"
        with open(cls.sample_pdf_path, "rb") as f:
            cls.sample_pdf_bytes = f.read()

        cls.mock_parsed_data = ParsedResume(
            full_name="Alex Smith",
            email="alex.smith@example.com",
            phone="+1-555-0199",
            skills=["Python", "FastAPI", "MongoDB", "React", "Docker"],
            education=[
                EducationItem(
                    degree="B.S. in Computer Science",
                    institution="University of California, Berkeley",
                    year="2018",
                )
            ],
            experience=[
                ExperienceItem(
                    title="Senior Software Engineer",
                    company="FinTech Labs",
                    duration="2021 - Present",
                    description="Architected payment microservices.",
                )
            ],
            certifications=["AWS Certified Solutions Architect"],
            projects=[
                ProjectItem(
                    name="HireGenius AI",
                    description="AI-powered recruitment SaaS.",
                    technologies=["FastAPI", "React", "MongoDB"],
                )
            ],
        )

    async def test_parse_resume_text_success_with_mock_llm(self):
        """Confirm parse_resume_text maps chain output to ParsedResume."""
        mock_chain = AsyncMock()
        mock_chain.ainvoke.return_value = self.mock_parsed_data

        mock_llm = MagicMock()
        mock_structured = MagicMock()
        mock_llm.with_structured_output.return_value = mock_structured

        with patch("app.services.resume_agent.ChatPromptTemplate") as mock_prompt_cls:
            mock_prompt = MagicMock()
            mock_prompt_cls.from_messages.return_value = mock_prompt
            mock_prompt.__or__.return_value = mock_chain

            result = await parse_resume_text(
                "Alex Smith is a Senior Software Engineer with Python and FastAPI skills.",
                custom_llm=mock_llm,
            )

        self.assertIsInstance(result, ParsedResume)
        self.assertEqual(result.full_name, "Alex Smith")
        self.assertIn("Python", result.skills)
        self.assertEqual(len(result.education), 1)
        self.assertEqual(result.education[0].institution, "University of California, Berkeley")

    async def test_parse_resume_text_from_dict_output(self):
        """Confirm parser handles dictionary output from with_structured_output."""
        mock_chain = AsyncMock()
        mock_chain.ainvoke.return_value = self.mock_parsed_data.model_dump()

        mock_llm = MagicMock()
        mock_llm.with_structured_output.return_value = MagicMock()

        with patch("app.services.resume_agent.ChatPromptTemplate") as mock_prompt_cls:
            mock_prompt = MagicMock()
            mock_prompt_cls.from_messages.return_value = mock_prompt
            mock_prompt.__or__.return_value = mock_chain

            result = await parse_resume_text(
                "Raw resume text with skills...", custom_llm=mock_llm
            )

        self.assertIsInstance(result, ParsedResume)
        self.assertEqual(result.email, "alex.smith@example.com")

    async def test_parse_empty_text_raises_error(self):
        """Confirm empty or whitespace text immediately raises ResumeParsingError."""
        with self.assertRaises(ResumeParsingError) as ctx:
            await parse_resume_text("")
        self.assertIn("Cannot parse empty resume text", str(ctx.exception))

        with self.assertRaises(ResumeParsingError):
            await parse_resume_text("   \n\t  ")

    async def test_missing_api_key_raises_config_error(self):
        """Confirm missing GEMINI_API_KEY raises ResumeParsingConfigError."""
        with patch("app.services.resume_agent.settings.GEMINI_API_KEY", ""):
            with self.assertRaises(ResumeParsingConfigError) as ctx:
                await parse_resume_text("Valid resume text")
            self.assertIn("GEMINI_API_KEY is not configured", str(ctx.exception))

    async def test_llm_invocation_failure_wrapped_cleanly(self):
        """Confirm raw LLM exceptions are caught and wrapped in ResumeParsingError."""
        mock_chain = AsyncMock()
        mock_chain.ainvoke.side_effect = RuntimeError("Google Gemini API Quota Exceeded (ResourceExhausted)")

        mock_llm = MagicMock()
        mock_llm.with_structured_output.return_value = MagicMock()

        with patch("app.services.resume_agent.ChatPromptTemplate") as mock_prompt_cls:
            mock_prompt = MagicMock()
            mock_prompt_cls.from_messages.return_value = mock_prompt
            mock_prompt.__or__.return_value = mock_chain

            with self.assertRaises(ResumeParsingError) as ctx:
                await parse_resume_text("Valid resume text", custom_llm=mock_llm)
            self.assertIn("AI resume parsing failed", str(ctx.exception))


class TestResumeParseEndpoint(unittest.IsolatedAsyncioTestCase):
    """Integration tests for POST /api/resume/parse with mocked AI agent."""

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

    async def test_api_parse_resume_success(self):
        """Confirm /api/resume/parse extracts text and returns ParsedResume JSON."""
        upload_file = UploadFile(
            filename="david_resume.pdf",
            file=io.BytesIO(self.sample_pdf_bytes),
        )

        with patch(
            "app.api.resume.parse_resume_text", new_callable=AsyncMock
        ) as mock_agent:
            mock_agent.return_value = self.mock_parsed
            res = await parse_resume(upload_file)

        self.assertIsInstance(res, ParsedResume)
        self.assertEqual(res.full_name, "David Kumar")
        self.assertIn("FastAPI", res.skills)

    async def test_api_parse_resume_rejects_too_short_text_as_ocr_required(self):
        """Confirm resumes with <50 chars of extracted text return 422 OCR required error."""
        # Short PDF with only 10 chars
        short_raw_pdf = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 25 >> stream
BT /F1 12 Tf 50 700 Td (Hello) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000320 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
397
%%EOF
"""
        upload_file = UploadFile(
            filename="scanned_resume.pdf",
            file=io.BytesIO(short_raw_pdf),
        )

        with self.assertRaises(HTTPException) as ctx:
            await parse_resume(upload_file)

        self.assertEqual(ctx.exception.status_code, 422)
        self.assertIn("Optical Character Recognition (OCR) is required", ctx.exception.detail)

    async def test_api_parse_resume_llm_failure_returns_422(self):
        """Confirm AI parsing failure returns HTTP 422 without raw stack trace."""
        upload_file = UploadFile(
            filename="david_resume.pdf",
            file=io.BytesIO(self.sample_pdf_bytes),
        )

        with patch(
            "app.api.resume.parse_resume_text", new_callable=AsyncMock
        ) as mock_agent:
            mock_agent.side_effect = ResumeParsingError("Failed to parse resume: Invalid LLM JSON")
            with self.assertRaises(HTTPException) as ctx:
                await parse_resume(upload_file)

        self.assertEqual(ctx.exception.status_code, 422)
        self.assertIn("Invalid LLM JSON", ctx.exception.detail)

    async def test_api_parse_resume_missing_key_returns_503(self):
        """Confirm missing GEMINI_API_KEY returns HTTP 503 Service Unavailable."""
        upload_file = UploadFile(
            filename="david_resume.pdf",
            file=io.BytesIO(self.sample_pdf_bytes),
        )

        with patch(
            "app.api.resume.parse_resume_text", new_callable=AsyncMock
        ) as mock_agent:
            mock_agent.side_effect = ResumeParsingConfigError("GEMINI_API_KEY is not configured.")
            with self.assertRaises(HTTPException) as ctx:
                await parse_resume(upload_file)

        self.assertEqual(ctx.exception.status_code, 503)
        self.assertIn("GEMINI_API_KEY is not configured", ctx.exception.detail)


if __name__ == "__main__":
    unittest.main()
