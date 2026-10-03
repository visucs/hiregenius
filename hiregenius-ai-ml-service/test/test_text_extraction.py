import asyncio
import io
import os
import unittest
from pathlib import Path

from fastapi import HTTPException, UploadFile
from app.api.resume import extract_resume_text
from app.services.text_extraction import (
    CorruptedFileError,
    EmptyFileError,
    UnsupportedFileTypeError,
    extract_text,
    extract_text_from_docx,
    extract_text_from_pdf,
)

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


class TestTextExtractionService(unittest.TestCase):
    """Unit tests for text extraction service layer."""

    @classmethod
    def setUpClass(cls):
        cls.pdf_path = FIXTURES_DIR / "sample_resume.pdf"
        cls.docx_path = FIXTURES_DIR / "sample_resume.docx"
        cls.corrupted_pdf_path = FIXTURES_DIR / "corrupted.pdf"

        with open(cls.pdf_path, "rb") as f:
            cls.pdf_bytes = f.read()

        with open(cls.docx_path, "rb") as f:
            cls.docx_bytes = f.read()

        with open(cls.corrupted_pdf_path, "rb") as f:
            cls.corrupted_pdf_bytes = f.read()

    def test_extract_text_from_pdf_success(self):
        """Confirm valid PDF extraction yields expected text."""
        extracted = extract_text_from_pdf(self.pdf_bytes)
        self.assertIsInstance(extracted, str)
        self.assertIn("John Doe", extracted)
        self.assertIn("Python", extracted)

    def test_extract_text_from_docx_success(self):
        """Confirm valid DOCX extraction yields expected text."""
        extracted = extract_text_from_docx(self.docx_bytes)
        self.assertIsInstance(extracted, str)
        self.assertIn("Jane Smith", extracted)
        self.assertIn("FastAPI", extracted)

    def test_dispatcher_pdf(self):
        """Confirm dispatcher selects PDF extractor based on filename."""
        extracted = extract_text(self.pdf_bytes, "candidate_cv.pdf")
        self.assertIn("John Doe", extracted)

    def test_dispatcher_docx(self):
        """Confirm dispatcher selects DOCX extractor based on filename."""
        extracted = extract_text(self.docx_bytes, "candidate_cv.docx")
        self.assertIn("Jane Smith", extracted)

    def test_unsupported_file_type_rejection(self):
        """Confirm unsupported extensions raise UnsupportedFileTypeError."""
        with self.assertRaises(UnsupportedFileTypeError) as ctx:
            extract_text(b"some plain text", "resume.txt")
        self.assertIn("Unsupported file type '.txt'", str(ctx.exception))

    def test_empty_file_rejection(self):
        """Confirm empty bytes raise EmptyFileError."""
        with self.assertRaises(EmptyFileError):
            extract_text(b"", "resume.pdf")

    def test_corrupted_pdf_handling(self):
        """Confirm corrupted PDF bytes raise CorruptedFileError."""
        with self.assertRaises(CorruptedFileError):
            extract_text(self.corrupted_pdf_bytes, "corrupted.pdf")

    def test_corrupted_docx_handling(self):
        """Confirm corrupted DOCX bytes raise CorruptedFileError."""
        with self.assertRaises(CorruptedFileError):
            extract_text(b"not a real docx zip archive", "broken.docx")


class TestResumeApiEndpoint(unittest.IsolatedAsyncioTestCase):
    """Integration tests for POST /api/resume/extract-text endpoint."""

    @classmethod
    def setUpClass(cls):
        cls.pdf_path = FIXTURES_DIR / "sample_resume.pdf"
        cls.docx_path = FIXTURES_DIR / "sample_resume.docx"
        cls.corrupted_pdf_path = FIXTURES_DIR / "corrupted.pdf"

        with open(cls.pdf_path, "rb") as f:
            cls.pdf_bytes = f.read()

        with open(cls.docx_path, "rb") as f:
            cls.docx_bytes = f.read()

        with open(cls.corrupted_pdf_path, "rb") as f:
            cls.corrupted_pdf_bytes = f.read()

    async def test_api_extract_pdf_success(self):
        """Confirm API returns 200 with extracted text and char count for valid PDF."""
        upload_file = UploadFile(
            filename="my_resume.pdf",
            file=io.BytesIO(self.pdf_bytes),
        )
        response = await extract_resume_text(upload_file)
        self.assertEqual(response.filename, "my_resume.pdf")
        self.assertIn("John Doe", response.extracted_text)
        self.assertGreater(response.character_count, 0)

    async def test_api_extract_docx_success(self):
        """Confirm API returns 200 with extracted text and char count for valid DOCX."""
        upload_file = UploadFile(
            filename="my_resume.docx",
            file=io.BytesIO(self.docx_bytes),
        )
        response = await extract_resume_text(upload_file)
        self.assertEqual(response.filename, "my_resume.docx")
        self.assertIn("Jane Smith", response.extracted_text)
        self.assertGreater(response.character_count, 0)

    async def test_api_rejects_unsupported_file_type(self):
        """Confirm API returns 400 for unsupported file types (.txt)."""
        upload_file = UploadFile(
            filename="resume.txt",
            file=io.BytesIO(b"Candidate plain text resume"),
        )
        with self.assertRaises(HTTPException) as ctx:
            await extract_resume_text(upload_file)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Only PDF (.pdf) and Word (.docx) resumes are supported", ctx.exception.detail)

    async def test_api_rejects_empty_file(self):
        """Confirm API returns 400 when uploaded file is empty (0 bytes)."""
        upload_file = UploadFile(
            filename="empty_resume.pdf",
            file=io.BytesIO(b""),
        )
        with self.assertRaises(HTTPException) as ctx:
            await extract_resume_text(upload_file)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("empty (0 bytes)", ctx.exception.detail)

    async def test_api_rejects_oversized_file(self):
        """Confirm API returns 400 when uploaded file exceeds 5MB."""
        # 5MB + 1KB dummy content
        oversized_bytes = b"0" * (5 * 1024 * 1024 + 1024)
        upload_file = UploadFile(
            filename="oversized_resume.pdf",
            file=io.BytesIO(oversized_bytes),
        )
        with self.assertRaises(HTTPException) as ctx:
            await extract_resume_text(upload_file)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("exceeds the maximum allowed size of 5MB", ctx.exception.detail)

    async def test_api_graceful_corrupted_file_handling(self):
        """Confirm API returns 422 (Unprocessable Entity) on corrupted documents."""
        upload_file = UploadFile(
            filename="corrupted.pdf",
            file=io.BytesIO(self.corrupted_pdf_bytes),
        )
        with self.assertRaises(HTTPException) as ctx:
            await extract_resume_text(upload_file)
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertIn("Cannot extract text from 'corrupted.pdf'", ctx.exception.detail)


if __name__ == "__main__":
    unittest.main()
