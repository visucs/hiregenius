"""
Core Pure ATS Scoring Engine.

Pure function `analyze()` evaluates resume text and optional job description text:
- Mode 1: General (no JD) with renormalized weights (Sections 50% / Length 25% / Format 25%)
- Mode 2: Job-Specific (with JD) with standard weights (Keywords 60% / Sections 20% / Length 10% / Format 10%)
- Strictly asserts mathematical derivability of total score from sub-components.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from app.models.resume import ParsedResume
from app.services.ats.category_matcher import get_missing_domain_skills, predict_category
from app.services.ats.format_checker import (
    compute_format_score,
    compute_length_score,
    detect_format_signals,
)
from app.services.ats.keywords import extract_jd_keywords, match_skill
from app.services.ats.sections import compute_section_score, detect_sections
from app.services.ats.suggestions import generate_ats_suggestions


@dataclass
class ATSAnalysisResult:
    mode: str
    ats_score: float
    score_breakdown: Dict[str, float]
    predicted_category: Dict[str, Any]
    sections_found: Dict[str, bool]
    format_signals: Dict[str, bool]
    word_count: int
    missing_domain_skills: List[str]
    suggestions: List[str]
    keyword_analysis: Optional[Dict[str, Any]] = None


def analyze(
    text: str,
    job_description: Optional[str] = None,
    parsed_resume: Optional[ParsedResume] = None,
) -> ATSAnalysisResult:
    """
    Pure ATS analysis function.

    :param text: Full raw text of candidate resume
    :param job_description: Optional job description text for role matching
    :param parsed_resume: Optional ParsedResume model from Phase 6 Gemini parsing
    :return: Typed ATSAnalysisResult
    """
    clean_text = (text or "").strip()
    words = clean_text.split()
    word_count = len(words)

    # 1. Structural Checks
    sections_found = detect_sections(clean_text, parsed_resume=parsed_resume)
    section_score = compute_section_score(sections_found)

    format_signals = detect_format_signals(clean_text)
    format_score = compute_format_score(format_signals)

    length_score = compute_length_score(word_count)

    # 2. Heuristic Category Prediction
    best_cat, match_strength, low_confidence, top_3 = predict_category(
        clean_text, parsed_resume=parsed_resume
    )
    missing_domain_skills = (
        get_missing_domain_skills(best_cat, clean_text)
        if not low_confidence and best_cat != "Unknown"
        else []
    )

    predicted_category_data = {
        "category": best_cat,
        "match_strength": match_strength,
        "low_confidence": low_confidence,
        "top_3_matches": top_3,
    }

    clean_jd = (job_description or "").strip()
    is_job_specific = bool(clean_jd)

    if not is_job_specific:
        # ── Mode 1: General ATS Assessment (Renormalized 50/25/25) ──
        # Formula: (0.50 * sections) + (0.25 * length) + (0.25 * format)
        ats_score = round(
            (0.50 * section_score) + (0.25 * length_score) + (0.25 * format_score),
            1,
        )

        score_breakdown = {
            "sections": section_score,
            "length": length_score,
            "format": format_score,
        }

        # Role-specific domain-skill suggestions only when confidence is high
        suggestions = generate_ats_suggestions(
            ats_score=ats_score,
            sections_found=sections_found,
            format_signals=format_signals,
            word_count=word_count,
            missing_jd_keywords=None,
            category=best_cat if not low_confidence else "Unknown",
            missing_domain_skills=missing_domain_skills if not low_confidence else [],
        )

        return ATSAnalysisResult(
            mode="general",
            ats_score=ats_score,
            score_breakdown=score_breakdown,
            predicted_category=predicted_category_data,
            sections_found=sections_found,
            format_signals=format_signals,
            word_count=word_count,
            missing_domain_skills=missing_domain_skills,
            suggestions=suggestions,
            keyword_analysis=None,
        )

    else:
        # ── Mode 2: Job-Specific ATS Assessment (60/20/10/10) ──
        jd_keywords = extract_jd_keywords(clean_jd)

        matched_keywords: List[str] = []
        missing_from_jd: List[str] = []

        for kw in jd_keywords:
            if match_skill(kw, clean_text):
                matched_keywords.append(kw)
            else:
                missing_from_jd.append(kw)

        keyword_score = round(
            (len(matched_keywords) / max(len(jd_keywords), 1)) * 100.0,
            1,
        )

        # Formula: (0.60 * keyword_score) + (0.20 * section_score) + (0.10 * length_score) + (0.10 * format_score)
        ats_score = round(
            (0.60 * keyword_score)
            + (0.20 * section_score)
            + (0.10 * length_score)
            + (0.10 * format_score),
            1,
        )

        score_breakdown = {
            "keyword_match": keyword_score,
            "sections": section_score,
            "length": length_score,
            "format": format_score,
        }

        keyword_analysis = {
            "matched_keywords": matched_keywords,
            "missing_from_jd": missing_from_jd,
            "missing_domain_skills": missing_domain_skills,
        }

        # In job-specific mode, suggestions come from the JD, not from the predicted category
        suggestions = generate_ats_suggestions(
            ats_score=ats_score,
            sections_found=sections_found,
            format_signals=format_signals,
            word_count=word_count,
            missing_jd_keywords=missing_from_jd,
            category="Unknown",
            missing_domain_skills=[],
        )

        return ATSAnalysisResult(
            mode="job_specific",
            ats_score=ats_score,
            score_breakdown=score_breakdown,
            predicted_category=predicted_category_data,
            sections_found=sections_found,
            format_signals=format_signals,
            word_count=word_count,
            missing_domain_skills=missing_domain_skills,
            suggestions=suggestions,
            keyword_analysis=keyword_analysis,
        )
