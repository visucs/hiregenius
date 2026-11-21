"""
Pydantic Schemas for ATS Scoring API and MongoDB Persistence.
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class ScoreBreakdown(BaseModel):
    sections: float = Field(..., description="Section completeness score (0-100)")
    length: float = Field(..., description="Length and word count score (0-100)")
    format: float = Field(..., description="Formatting signals score (0-100)")
    keyword_match: Optional[float] = Field(
        None,
        description="Keyword match against job description (0-100). Present only in job_specific mode.",
    )


class CategoryMatchItem(BaseModel):
    category: str = Field(..., description="Job role category title")
    score: float = Field(..., description="Heuristic match score percentage")


class PredictedCategory(BaseModel):
    category: str = Field(..., description="Top matching job category or 'Unknown'")
    match_strength: float = Field(
        ...,
        description="Heuristic match strength percentage based on domain keywords overlap",
    )
    low_confidence: bool = Field(
        False,
        description="True if category is ambiguous, tied, or below confidence threshold",
    )
    top_3_matches: List[CategoryMatchItem] = Field(
        default_factory=list,
        description="Top 3 matching job categories with heuristic match strengths (empty if low_confidence is True)",
    )


class FormatSignals(BaseModel):
    has_bullets: bool = Field(..., description="Whether bullet points were detected")
    has_dates: bool = Field(..., description="Whether employment/graduation dates were detected")
    quantified_impact: bool = Field(..., description="Whether numerical impact or metrics were detected")
    action_verbs: bool = Field(..., description="Whether strong action verbs were detected")


class KeywordAnalysis(BaseModel):
    matched_keywords: List[str] = Field(default_factory=list, description="Target skills found in resume")
    missing_from_jd: List[str] = Field(default_factory=list, description="Target skills missing from resume")
    missing_domain_skills: List[str] = Field(
        default_factory=list,
        description="Key domain competencies from category taxonomy not found in resume",
    )


class ParsabilityAdvisory(BaseModel):
    page_count: Optional[int] = Field(None, description="Total document pages (PDF)")
    table_count: Optional[int] = Field(None, description="Total tables detected (DOCX)")
    image_count: Optional[int] = Field(None, description="Embedded images count")
    text_per_page: Optional[int] = Field(None, description="Average character density per page")
    warnings: List[str] = Field(default_factory=list, description="Plain-language ATS parsing warnings")


class ATSCheckResponse(BaseModel):
    id: Optional[str] = Field(None, description="MongoDB record ID")
    candidate_id: str = Field(..., description="Numeric candidate ID string (matches Core API)")
    job_id: Optional[str] = Field(None, description="Job ID if job-specific check, or null for general")
    original_filename: Optional[str] = Field(None, description="Original resume filename")
    mode: Literal["general", "job_specific"] = Field(..., description="Evaluation mode")
    ats_score: float = Field(..., description="Overall calculated ATS score (0-100)")
    score_breakdown: ScoreBreakdown = Field(..., description="Component sub-scores")
    predicted_category: PredictedCategory = Field(..., description="Heuristic role classification")
    keyword_analysis: Optional[KeywordAnalysis] = Field(None, description="Job keyword matching results")
    sections_found: Dict[str, bool] = Field(..., description="Detection status for 7 standard sections")
    format_signals: FormatSignals = Field(..., description="4 formatting indicators")
    word_count: int = Field(..., description="Total word count of extracted text")
    suggestions: List[str] = Field(default_factory=list, description="Prioritized recommendations")
    parsability: Optional[ParsabilityAdvisory] = Field(None, description="Advisory layout metrics")
    checked_at: datetime = Field(..., description="Timestamp of ATS analysis")


class CategoriesResponse(BaseModel):
    categories: List[str] = Field(..., description="List of 24 supported job categories")


# ── V2 Unified ATS Scan Models ──────────────────────────────────────────────────

class CategoryScoreItem(BaseModel):
    name: str = Field(..., description="Name of category (e.g. Parsability & Format, Keywords Match)")
    score: float = Field(..., description="Earned points for this category")
    max: float = Field(..., description="Maximum possible points for this category")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Detailed diagnostic breakdown")
    not_assessable: bool = Field(False, description="True if text could not be extracted (e.g. scanned/encrypted)")


class IssueItem(BaseModel):
    severity: Literal["critical", "warning", "tip"] = Field(..., description="Urgency: critical, warning, or tip")
    category: str = Field(..., description="Related evaluation category")
    message: str = Field(..., description="Concise diagnostic message")
    how_to_fix: str = Field(..., description="Actionable recommendation on how to address the issue")


class MissingKeywords(BaseModel):
    required: List[str] = Field(default_factory=list, description="Mandatory job skills missing from resume")
    preferred: List[str] = Field(default_factory=list, description="Nice-to-have or preferred skills missing from resume")


class ATSScanResponse(BaseModel):
    overallScore: float = Field(..., description="Calculated ATS heuristic score (0-100)")
    grade: str = Field(..., description="Grade descriptor: Excellent, Good Match, Moderate, Needs Work")
    mode: Literal["GENERAL", "JOB"] = Field(..., description="Evaluation mode: GENERAL or JOB")
    categoryScores: List[CategoryScoreItem] = Field(..., description="Category points breakdown")
    issues: List[IssueItem] = Field(default_factory=list, description="Prioritized actionable issues")
    matchedKeywords: List[str] = Field(default_factory=list, description="Target keywords identified in resume")
    missingKeywords: MissingKeywords = Field(default_factory=MissingKeywords, description="Missing keywords breakdown")
    extractedTextPreview: str = Field(..., description="First 500 characters of extracted text as seen by parser")
    disclaimer: str = Field(..., description="Transparency notice that score is an untuned heuristic estimate")
    scoringVersion: str = Field(..., description="Version of the scoring engine (e.g. ats-v2-untuned)")
    ai_suggestions_unavailable: bool = Field(False, description="True if LLM JD extraction fell back to rule-based")
    candidateId: Optional[str] = Field(None, description="Candidate ID if profile resume was used")
    jobId: Optional[str] = Field(None, description="Job ID if job-specific match was run")
    source: Literal["PROFILE", "UPLOAD"] = Field(..., description="Resume source: PROFILE or UPLOAD")
