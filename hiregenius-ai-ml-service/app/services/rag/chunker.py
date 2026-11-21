"""
Resume Chunking Module for RAG-based Candidate Retrieval and Ranking.

Splits parsed resume structured data (and raw text fallback) into typed chunks:
- summary
- experience (each experience entry as a distinct chunk)
- project (each project as a distinct chunk)
- skills
- education (each education entry as a distinct chunk)

Each chunk carries full metadata:
{
    chunk_id: str,
    candidate_id: str,
    resume_version: str,
    chunk_type: str,
    embedding_model: str,
    dimension: int,
    text: str,
    created_at: datetime
}
All chunks are run through pii_stripper to guarantee anonymity and brand neutralization.
"""

from datetime import datetime, timezone
import hashlib
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.config import settings
from app.models.resume import ParsedResume
from app.services.rag.pii_stripper import (
    sanitize_education_text,
    sanitize_experience_text,
    sanitize_project_text,
    sanitize_skills_text,
    sanitize_text,
)


class ResumeChunk(BaseModel):
    chunk_id: str = Field(..., description="Unique deterministic identifier for the chunk")
    candidate_id: str = Field(..., description="ID of the candidate")
    resume_version: str = Field("v1", description="Version of the candidate's resume")
    chunk_type: str = Field(..., description="Type of chunk: summary, experience, project, skills, education")
    embedding_model: str = Field(..., description="Model identifier used for embedding")
    dimension: int = Field(..., description="Vector embedding dimensionality")
    text: str = Field(..., description="Sanitized, fair, PII-stripped text content of the chunk")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional structured metadata")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def chunk_parsed_resume(
    candidate_id: str,
    parsed_data: ParsedResume,
    raw_text: Optional[str] = None,
    resume_version: str = "v1",
    embedding_model: Optional[str] = None,
    dimension: Optional[int] = None,
) -> List[ResumeChunk]:
    """
    Generate structured, sanitized chunks from a candidate's parsed resume.
    Ensures every chunk is PII-stripped, brand-neutralized, and assigned a deterministic chunk_id.
    """
    model_name = embedding_model or settings.GEMINI_EMBEDDING_MODEL
    dim = dimension or settings.GEMINI_EMBEDDING_DIMENSION
    candidate_name = parsed_data.full_name or None
    candidate_email = parsed_data.email or None
    candidate_phone = parsed_data.phone or None

    chunks: List[ResumeChunk] = []
    chunk_index = 0

    # 1. Summary Chunk (extracted from raw text beginning if present, or synthesis)
    summary_candidate_text = ""
    if raw_text:
        # Extract initial lines before experience/education sections as summary
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        summary_lines = []
        for line in lines[:10]:
            lower = line.lower()
            if any(sec in lower for sec in ["experience", "employment", "education", "skills", "projects", "certifications"]):
                break
            summary_lines.append(line)
        if summary_lines:
            summary_candidate_text = " ".join(summary_lines)

    if summary_candidate_text:
        clean_summary = sanitize_text(
            summary_candidate_text,
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            candidate_phone=candidate_phone,
        )
        if len(clean_summary.strip()) >= 30:
            cid = f"{candidate_id}_sum_{chunk_index}"
            chunk_index += 1
            chunks.append(
                ResumeChunk(
                    chunk_id=cid,
                    candidate_id=candidate_id,
                    resume_version=resume_version,
                    chunk_type="summary",
                    embedding_model=model_name,
                    dimension=dim,
                    text=f"Professional Summary:\n{clean_summary}",
                    metadata={"section": "summary"},
                )
            )

    # 2. Skills Chunk
    if parsed_data.skills:
        clean_skills_text = sanitize_skills_text(parsed_data.skills, candidate_name=candidate_name)
        if clean_skills_text.strip():
            cid = f"{candidate_id}_skl_{chunk_index}"
            chunk_index += 1
            chunks.append(
                ResumeChunk(
                    chunk_id=cid,
                    candidate_id=candidate_id,
                    resume_version=resume_version,
                    chunk_type="skills",
                    embedding_model=model_name,
                    dimension=dim,
                    text=clean_skills_text,
                    metadata={"skills": parsed_data.skills, "skill_count": len(parsed_data.skills)},
                )
            )

    # 3. Experience Chunks (one chunk per role entry)
    if parsed_data.experience:
        for idx, exp in enumerate(parsed_data.experience):
            clean_exp = sanitize_experience_text(
                title=exp.title,
                description=exp.description,
                duration=exp.duration,
                candidate_name=candidate_name,
            )
            if clean_exp.strip():
                cid = f"{candidate_id}_exp_{idx}"
                chunk_index += 1
                chunks.append(
                    ResumeChunk(
                        chunk_id=cid,
                        candidate_id=candidate_id,
                        resume_version=resume_version,
                        chunk_type="experience",
                        embedding_model=model_name,
                        dimension=dim,
                        text=clean_exp,
                        metadata={
                            "role_title": exp.title or "Unknown Role",
                            "duration": exp.duration or None,
                            "entry_index": idx,
                        },
                    )
                )

    # 4. Project Chunks (one chunk per project)
    if parsed_data.projects:
        for idx, proj in enumerate(parsed_data.projects):
            clean_proj = sanitize_project_text(
                name=proj.name,
                description=proj.description,
                technologies=proj.technologies,
                candidate_name=candidate_name,
            )
            if clean_proj.strip():
                cid = f"{candidate_id}_prj_{idx}"
                chunk_index += 1
                chunks.append(
                    ResumeChunk(
                        chunk_id=cid,
                        candidate_id=candidate_id,
                        resume_version=resume_version,
                        chunk_type="project",
                        embedding_model=model_name,
                        dimension=dim,
                        text=clean_proj,
                        metadata={
                            "project_name": proj.name or f"Project {idx + 1}",
                            "technologies": proj.technologies or [],
                            "entry_index": idx,
                        },
                    )
                )

    # 5. Education Chunks (one chunk per degree)
    if parsed_data.education:
        for idx, edu in enumerate(parsed_data.education):
            clean_edu = sanitize_education_text(
                degree=edu.degree,
                year=edu.year,
                candidate_name=candidate_name,
            )
            if clean_edu.strip():
                cid = f"{candidate_id}_edu_{idx}"
                chunk_index += 1
                chunks.append(
                    ResumeChunk(
                        chunk_id=cid,
                        candidate_id=candidate_id,
                        resume_version=resume_version,
                        chunk_type="education",
                        embedding_model=model_name,
                        dimension=dim,
                        text=clean_edu,
                        metadata={
                            "degree": edu.degree or "Degree",
                            "year": edu.year or None,
                            "entry_index": idx,
                        },
                    )
                )

    # 6. Fallback if structured data yielded no chunks but raw text exists
    if not chunks and raw_text and len(raw_text.strip()) >= 50:
        clean_raw = sanitize_text(
            raw_text,
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            candidate_phone=candidate_phone,
        )
        cid = f"{candidate_id}_raw_0"
        chunks.append(
            ResumeChunk(
                chunk_id=cid,
                candidate_id=candidate_id,
                resume_version=resume_version,
                chunk_type="summary",
                embedding_model=model_name,
                dimension=dim,
                text=clean_raw[:1500],
                metadata={"fallback": True},
            )
        )

    return chunks
