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
