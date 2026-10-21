"""
Resume Formatting Signals and Length Scoring.

Evaluates formatting best practices:
- Bullet points
- Dates for timeline verification
- Quantified metrics and impact (percentages, counts, scale)
- Strong action verbs
- Word count and optimal length scoring
"""

import re
from typing import Dict

ACTION_VERBS = [
    "developed", "designed", "implemented", "led", "managed", "created",
    "built", "improved", "increased", "reduced", "delivered", "achieved",
    "optimized", "architected", "spearheaded", "engineered", "automated",
    "orchestrated", "executed", "collaborated", "mentored", "maintained",
]

ACTION_VERBS_REGEX = re.compile(
    rf"\b({'|'.join(ACTION_VERBS)})\b",
    re.IGNORECASE,
)

BULLET_REGEX = re.compile(
    r"(?:^|\n)\s*[•·▪▸\-\*]\s+",
    re.MULTILINE,
)

DATE_REGEX = re.compile(
    r"\b(20\d{2}|19\d{2})\b",
)

QUANTIFIED_METRIC_REGEX = re.compile(
    r"\b\d+%\b|\b\d+\+?\s*(?:years?|projects?|clients?|users?|engineers?|team members?|million|billion|k)\b",
    re.IGNORECASE,
)


def detect_format_signals(text: str) -> Dict[str, bool]:
    """Detect presence of key structural and readability signals in resume text."""
    if not text:
        return {
            "has_bullets": False,
            "has_dates": False,
            "quantified_impact": False,
            "action_verbs": False,
        }

    return {
        "has_bullets": bool(BULLET_REGEX.search(text)),
        "has_dates": bool(DATE_REGEX.search(text)),
        "quantified_impact": bool(QUANTIFIED_METRIC_REGEX.search(text)),
        "action_verbs": bool(ACTION_VERBS_REGEX.search(text)),
    }


def compute_format_score(signals: Dict[str, bool]) -> float:
    """Compute formatting score (0.0 to 100.0) based on 4 binary signals."""
    if not signals:
        return 0.0
    return round((sum(signals.values()) / len(signals)) * 100.0, 1)


def compute_length_score(word_count: int) -> float:
    """
    Score resume length based on professional recruiter standards:
    - < 100 words: 30.0 (severely incomplete)
    - 100-299 words: 60.0 (too brief)
    - 300-799 words: 90.0 (good, concise single-page)
    - 800-1200 words: 100.0 (optimal 1-2 pages detailed resume)
    - > 1200 words: 80.0 (too lengthy, risks getting skimmed)
    """
    if word_count < 100:
        return 30.0
    elif word_count < 300:
        return 60.0
    elif word_count < 800:
        return 90.0
    elif word_count <= 1200:
        return 100.0
    else:
        return 80.0
