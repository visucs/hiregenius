"""
Heuristic Category and Domain Skill Matcher.

Predicts the most relevant job role category from 24 supported domains
using exact token matching against domain taxonomies, headline/title signals,
and domain hierarchy rules, and identifies missing domain-specific skills.

Rules and Ambiguity Guards:
- Resume headline / first lines / ParsedResume experience titles provide strong
  role signals (e.g. Backend / Python Engineer boosts Python Developer).
- Generic "skill-type" categories (e.g. 'Database', 'Testing') must not outrank
  a language/role category when the resume contains language/role keywords,
  unless the candidate's explicit job title is a DBA/Database specialist.
- Relative margin rule: top score must be >= 1.25x #2 OR have an absolute
  gap of >= 5.0 points, and top score >= 12.0%. Otherwise returns 'Unknown'
  with low_confidence=True and empty top_3.
- Never presents tied or near-tied scores as a definitive role prediction.
"""

import re
from typing import Any, Dict, List, Optional, Tuple
from app.models.resume import ParsedResume
from app.services.ats.keywords import DOMAIN_KEYWORDS, JOB_CATEGORIES, match_skill

MIN_KEYWORD_MATCHES_THRESHOLD = 2
MIN_CONFIDENCE_THRESHOLD = 12.0
RELATIVE_MARGIN_RATIO = 1.25
ABSOLUTE_MARGIN_POINTS = 5.0

GENERIC_SKILL_CATEGORIES = {"Database", "Testing"}

ROLE_CATEGORIES = {
    "Python Developer",
    "Java Developer",
    "DotNet Developer",
    "DevOps Engineer",
    "Data Science",
    "Web Designing",
    "Automation Testing",
    "Blockchain",
    "ETL Developer",
    "Network Security Engineer",
    "SAP Developer",
    "Business Analyst",
    "Operations Manager",
    "PMO",
    "HR",
    "Sales",
    "Civil Engineer",
    "Mechanical Engineer",
    "Electrical Engineering",
    "Advocate",
    "Arts",
    "Hadoop",
}


def _extract_headline_text(
    text: str,
    parsed_resume: Optional[ParsedResume] = None,
) -> str:
    """Extract candidate headline, target title, and top summary lines."""
    headline_parts: List[str] = []

    if parsed_resume is not None:
        if parsed_resume.experience:
            for exp in parsed_resume.experience[:2]:
                if exp.title:
                    headline_parts.append(exp.title)
        summary_val = getattr(parsed_resume, "summary", None)
        if summary_val:
            headline_parts.append(str(summary_val)[:200])

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    header_lines = lines[:5]
    headline_parts.extend(header_lines)

    return " ".join(headline_parts).lower()


def _get_headline_boosts(headline_lower: str, text_lower: str) -> Dict[str, float]:
    """Calculate role score boosts based on candidate headline and title signals."""
    boosts: Dict[str, float] = {cat: 0.0 for cat in JOB_CATEGORIES}

    # Python Developer signals
    if any(term in headline_lower for term in ["python developer", "python engineer", "python", "fastapi", "django", "flask"]):
        boosts["Python Developer"] += 0.45
    elif "backend" in headline_lower and ("python" in text_lower or "fastapi" in text_lower):
        boosts["Python Developer"] += 0.25

    # Java Developer signals
    if any(term in headline_lower for term in ["java developer", "java engineer", "java", "spring boot", "spring"]):
        boosts["Java Developer"] += 0.45
    elif "backend" in headline_lower and ("java" in text_lower or "spring" in text_lower):
        boosts["Java Developer"] += 0.25

    # DotNet Developer signals
    if any(term in headline_lower for term in ["dotnet", ".net", "c#", "csharp", "asp.net"]):
        boosts["DotNet Developer"] += 0.45

    # DevOps signals
    if any(term in headline_lower for term in ["devops", "site reliability", "sre", "cloud engineer", "infrastructure engineer"]):
        boosts["DevOps Engineer"] += 0.45

    # Data Science signals
    if any(term in headline_lower for term in ["data scientist", "machine learning", "ml engineer", "ai engineer", "data science"]):
        boosts["Data Science"] += 0.45

    # Automation Testing / QA signals
    if any(term in headline_lower for term in ["automation engineer", "qa engineer", "sdet", "test automation", "qa lead"]):
        boosts["Automation Testing"] += 0.45

    # Web Designing / Frontend signals
    if any(term in headline_lower for term in ["frontend", "ui/ux", "web designer", "web developer"]):
        boosts["Web Designing"] += 0.45

    # Database specialist signals (only boost Database if explicitly a DBA/DB engineer)
    if any(term in headline_lower for term in ["dba", "database administrator", "database engineer", "database architect"]):
        boosts["Database"] += 0.50

    return boosts


def predict_category(
    text: str,
    parsed_resume: Optional[ParsedResume] = None,
) -> Tuple[str, float, bool, List[Dict[str, Any]]]:
    """
    Heuristically predicts candidate's primary job category by measuring
    density of domain-specific keywords found in resume text, factoring in
    headline/title signals and domain hierarchy rules.

    Returns:
    - primary_category (str: predicted role title, or 'Unknown')
    - match_strength (float, 0.0 - 100.0)
    - low_confidence (bool: True if ambiguous/tied/below threshold)
    - top_3_matches (list of dicts, empty if low_confidence is True)
    """
    if not text:
        return "Unknown", 0.0, True, []

    text_lower = text.lower()
    raw_match_counts: Dict[str, int] = {}
    coverage_scores: Dict[str, float] = {}

    for cat in JOB_CATEGORIES:
        kws = DOMAIN_KEYWORDS.get(cat, [])
        if not kws:
            raw_match_counts[cat] = 0
            coverage_scores[cat] = 0.0
            continue

        matches = sum(1 for kw in kws if match_skill(kw, text_lower))
        raw_match_counts[cat] = matches
        coverage_scores[cat] = matches / len(kws)

    max_raw_matches = max(raw_match_counts.values()) if raw_match_counts else 0

    # Guard 1: Zero domain keywords or fewer than 2 distinct matches
    if max_raw_matches < MIN_KEYWORD_MATCHES_THRESHOLD:
        return "Unknown", 0.0, True, []

    # Apply headline/title boost
    headline_lower = _extract_headline_text(text, parsed_resume=parsed_resume)
    boosts = _get_headline_boosts(headline_lower, text_lower)

    for cat, boost in boosts.items():
        if coverage_scores[cat] > 0.0:
            coverage_scores[cat] += boost

    # Guard: Demote generic "skill-type" categories (Database, Testing)
    # when primary role categories have qualifying language/role matches
    # and the candidate is not an explicit DBA.
    is_explicit_dba = any(term in headline_lower for term in ["dba", "database administrator", "database architect"])
    if not is_explicit_dba:
        has_primary_role_signals = any(
            coverage_scores[role_cat] > 0.15 for role_cat in ROLE_CATEGORIES
        )
        if has_primary_role_signals:
            max_role_score = max(coverage_scores[role_cat] for role_cat in ROLE_CATEGORIES)
            for skill_cat in GENERIC_SKILL_CATEGORIES:
                if coverage_scores[skill_cat] >= max_role_score:
                    # Skill-type category cannot outrank a language/role category
                    coverage_scores[skill_cat] = max(0.0, max_role_score * 0.85)

    total_coverage = sum(coverage_scores.values())
    if total_coverage <= 0.0:
        return "Unknown", 0.0, True, []

    normalized = {cat: (val / total_coverage) * 100.0 for cat, val in coverage_scores.items()}
    sorted_matches = sorted(normalized.items(), key=lambda item: item[1], reverse=True)

    top1_cat, top1_score = sorted_matches[0]
    top2_cat, top2_score = sorted_matches[1]

    # Guard 2: Relative margin rule and confidence threshold
    score_gap = top1_score - top2_score
    is_confident = (
        top1_score >= MIN_CONFIDENCE_THRESHOLD
        and (
            (top2_score > 0 and (top1_score / top2_score) >= RELATIVE_MARGIN_RATIO)
            or score_gap >= ABSOLUTE_MARGIN_POINTS
        )
    )

    if not is_confident:
        return "Unknown", round(top1_score, 1), True, []

    top_3 = [
        {"category": cat, "score": round(score, 1)}
        for cat, score in sorted_matches[:3]
    ]

    return top1_cat, round(top1_score, 1), False, top_3


def get_missing_domain_skills(
    category: str,
    text: str,
    max_missing: int = 15,
) -> List[str]:
    """Return key skills from the target domain taxonomy that are missing from resume."""
    if not category or category == "Unknown":
        return []

    kws = DOMAIN_KEYWORDS.get(category, [])
    if not kws:
        return []

    text_lower = text.lower()
    missing = [kw for kw in kws if not match_skill(kw, text_lower)]
    return missing[:max_missing]
