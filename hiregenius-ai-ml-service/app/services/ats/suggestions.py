"""
Actionable ATS Feedback and Suggestion Generator.

Produces prioritized, plain-text recommendations for improving resume
scannability, ATS compatibility, section completeness, and keyword relevance.
"""

from typing import Dict, List, Optional


def generate_ats_suggestions(
    ats_score: float,
    sections_found: Dict[str, bool],
    format_signals: Dict[str, bool],
    word_count: int,
    missing_jd_keywords: Optional[List[str]] = None,
    category: Optional[str] = None,
    missing_domain_skills: Optional[List[str]] = None,
) -> List[str]:
    """Generate prioritized actionable suggestions for candidate resume improvement."""
    tips: List[str] = []

    # 1. Overall Score Evaluation
    if ats_score < 40:
        tips.append("[!] Critical score — resume needs a major structural and content overhaul before applying.")
    elif ats_score < 60:
        tips.append("[!] Needs significant improvement. Add more relevant keywords, expand bullet points, and complete missing sections.")
    elif ats_score < 75:
        tips.append("[~] Good start — targeted tweaks to formatting and keywords will push you past competitive ATS filters.")
    else:
        tips.append("[+] Strong score! Fine-tune the specific details below to maximize recruiter engagement.")

    # 2. Missing JD Keywords (if in job-specific mode)
    if missing_jd_keywords and len(missing_jd_keywords) > 0:
        sample_missing = missing_jd_keywords[:8]
        tips.append(
            f"[kw] Add these target job description keywords naturally into your experience or skills: "
            f"{', '.join(sample_missing)}."
        )

    # 3. Missing Domain Skills or Role Identification (General Mode only)
    if missing_jd_keywords is None:
        if category and category != "Unknown" and missing_domain_skills and len(missing_domain_skills) > 0:
            sample_domain = missing_domain_skills[:8]
            tips.append(
                f"[skill] For a {category} role, highlight these domain competencies if applicable: "
                f"{', '.join(sample_domain)}."
            )
        elif category == "Unknown":
            tips.append("[skill] Primary role category could not be determined with confidence. Add clear industry/role keywords.")

    # 4. Missing Sections
    missing_sections = [sec for sec, present in sections_found.items() if not present]
    if missing_sections:
        tips.append(f"[section] Add standard resume section headings for: {', '.join(missing_sections)}.")

    # 5. Formatting Signals
    if not format_signals.get("has_bullets", False):
        tips.append("Use bullet points for work experience and responsibilities — ATS parsers prioritize clean, scannable lists.")
    if not format_signals.get("quantified_impact", False):
        tips.append("Quantify your achievements with numbers, percentages, or scale (e.g. 'Reduced latency by 40%', 'Supported 10,000+ users').")
    if not format_signals.get("action_verbs", False):
        tips.append("Start bullet points with strong action verbs (e.g. Developed, Led, Architected, Automated).")
    if not format_signals.get("has_dates", False):
        tips.append("Include employment and education dates (e.g. 2021 - 2024) to establish a clear career timeline.")

    # 6. Word Count
    if word_count < 300:
        tips.append(f"[len] Resume is too brief ({word_count} words). Aim for at least 400-800 words across 1-2 pages.")
    elif word_count > 1200:
        tips.append(f"[len] Resume is lengthy ({word_count} words). Trim word count to 1-2 pages to ensure high readability.")

    return tips
