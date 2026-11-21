"""
Resume Formatting Signals, Content Quality, and Length Scoring.

Evaluates formatting best practices:
- Bullet points and bullet phrasing
- Dates for timeline verification
- Quantified metrics and impact (percentages, counts, scale)
- Strong action verbs
- First-person pronoun avoidance (ATS best practice)
- Word count and optimal length scoring
"""

import re
from typing import Any, Dict, List, Tuple

ACTION_VERBS = [
    "developed", "designed", "implemented", "led", "managed", "created",
    "built", "improved", "increased", "reduced", "delivered", "achieved",
    "optimized", "architected", "spearheaded", "engineered", "automated",
    "orchestrated", "executed", "collaborated", "mentored", "maintained",
    "refactored", "analyzed", "deployed", "scaled", "streamlined",
]

ACTION_VERBS_REGEX = re.compile(
    rf"\b({'|'.join(ACTION_VERBS)})\b",
    re.IGNORECASE,
)

BULLET_REGEX = re.compile(
    r"(?:^|\n)\s*[•·▪▸\-\*]\s+([^\n]+)",
    re.MULTILINE,
)

DATE_REGEX = re.compile(
    r"\b(20\d{2}|19\d{2})\b",
)

QUANTIFIED_METRIC_REGEX = re.compile(
    r"\b\d+%\b|\b\d+\+?\s*(?:years?|projects?|clients?|users?|engineers?|team members?|million|billion|k|x|cr|lakhs?)\b",
    re.IGNORECASE,
)

FIRST_PERSON_PRONOUNS_REGEX = re.compile(
    r"\b(I|me|my|myself|we|our|ourselves)\b",
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


def compute_content_quality(text: str) -> Tuple[float, List[Dict[str, str]], Dict[str, Any]]:
    """
    Evaluate content quality on 4 criteria (each 25% of content category):
    1. Action verbs count (>= 4 verbs = 25 pts)
    2. Quantified impact (metrics, stats, scales = 25 pts)
    3. Bullet length & structure (bullet lines 8-35 words = 25 pts)
    4. First-person pronoun avoidance (no 'I', 'my', 'we' = 25 pts)

    Returns: (score_0_to_100, issues_list, details_dict)
    """
    if not text:
        return 0.0, [], {}

    issues: List[Dict[str, str]] = []
    points = 0.0

    # 1. Action verbs
    verbs_found = set(m.lower() for m in ACTION_VERBS_REGEX.findall(text))
    if len(verbs_found) >= 4:
        verb_pts = 25.0
    elif len(verbs_found) >= 2:
        verb_pts = 15.0
        issues.append({
            "severity": "tip",
            "category": "Content Quality",
            "message": f"Detected only {len(verbs_found)} distinct action verbs. Leading bullet points with dynamic action verbs increases recruiter impact.",
            "how_to_fix": "Begin experience bullets with strong past-tense action verbs like 'Engineered', 'Orchestrated', 'Optimized', or 'Spearheaded'.",
        })
    elif len(verbs_found) == 1:
        verb_pts = 8.0
        issues.append({
            "severity": "warning",
            "category": "Content Quality",
            "message": "Very few action verbs detected in your descriptions.",
            "how_to_fix": "Replace passive phrases ('Responsible for', 'Worked on') with definitive action verbs.",
        })
    else:
        verb_pts = 0.0
        issues.append({
            "severity": "warning",
            "category": "Content Quality",
            "message": "No strong action verbs detected in experience statements.",
            "how_to_fix": "Start each responsibility bullet with verbs like 'Developed', 'Built', 'Led', 'Automated'.",
        })
    points += verb_pts

    # 2. Quantified impact
    metrics_matches = QUANTIFIED_METRIC_REGEX.findall(text)
    if len(metrics_matches) >= 3:
        metric_pts = 25.0
    elif len(metrics_matches) >= 1:
        metric_pts = 15.0
        issues.append({
            "severity": "tip",
            "category": "Content Quality",
            "message": "Good start on metrics, but adding more quantified results strengthens proof of competence.",
            "how_to_fix": "Include measurable outcomes (e.g. 'reduced latency by 35%', 'managed 5 microservices', 'scaled to 50k users').",
        })
    else:
        metric_pts = 0.0
        issues.append({
            "severity": "warning",
            "category": "Content Quality",
            "message": "No quantified impact or numerical metrics detected in your accomplishments.",
            "how_to_fix": "Add numbers, percentages, team sizes, or scale metrics to demonstrate the tangible impact of your work.",
        })
    points += metric_pts

    # 3. Bullet structure & length
    bullet_matches = BULLET_REGEX.findall(text)
    if bullet_matches:
        lengths = [len(b.split()) for b in bullet_matches]
        avg_len = sum(lengths) / len(lengths)
        good_length_bullets = sum(1 for l in lengths if 6 <= l <= 40)
        ratio = good_length_bullets / len(bullet_matches)
        if ratio >= 0.7:
            bullet_pts = 25.0
        else:
            bullet_pts = 12.0
            issues.append({
                "severity": "tip",
                "category": "Content Quality",
                "message": "Some bullet points appear too brief (<6 words) or too long (>40 words).",
                "how_to_fix": "Keep bullet points between 1-2 lines (10-25 words) focusing on context, action, and result.",
            })
    else:
        bullet_pts = 5.0
        issues.append({
            "severity": "warning",
            "category": "Content Quality",
            "message": "Few or no standard bullet points detected.",
            "how_to_fix": "Use bullet points rather than dense paragraphs to format your responsibilities.",
        })
    points += bullet_pts

    # 4. First-person pronoun avoidance
    pronoun_matches = FIRST_PERSON_PRONOUNS_REGEX.findall(text)
    if not pronoun_matches:
        pronoun_pts = 25.0
    else:
        pronoun_pts = 5.0
        issues.append({
            "severity": "tip",
            "category": "Content Quality",
            "message": f"First-person pronouns detected ({len(pronoun_matches)} instances of I/me/my/we). Standard resume style uses implied first-person.",
            "how_to_fix": "Remove personal pronouns (e.g. replace 'I developed the API' with 'Developed the API').",
        })
    points += pronoun_pts

    details = {
        "action_verbs_count": len(verbs_found),
        "quantified_metrics_count": len(metrics_matches),
        "bullet_count": len(bullet_matches),
        "first_person_pronouns_detected": len(pronoun_matches) > 0,
    }

    return round(points, 1), issues, details


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


def compute_length_analysis(word_count: int) -> Tuple[float, List[Dict[str, str]]]:
    """
    V2 length scoring returning (score_0_to_100, issues_list).
    """
    issues = []
    if word_count < 150:
        score = 25.0
        issues.append({
            "severity": "critical",
            "category": "Length & Readability",
            "message": f"Resume is severely brief ({word_count} words). ATS systems require sufficient content to index your skills.",
            "how_to_fix": "Expand your experience, projects, technical skills, and educational qualifications.",
        })
    elif word_count < 300:
        score = 50.0
        issues.append({
            "severity": "warning",
            "category": "Length & Readability",
            "message": f"Resume is brief ({word_count} words).",
            "how_to_fix": "Elaborate on your project contributions, tools used, and technical responsibilities.",
        })
    elif word_count < 400:
        score = 80.0
    elif word_count <= 1000:
        score = 100.0
    elif word_count <= 1300:
        score = 80.0
    elif word_count <= 1600:
        score = 50.0
        issues.append({
            "severity": "warning",
            "category": "Length & Readability",
            "message": f"Resume is quite long ({word_count} words). Recruiter scan time averages 6-10 seconds.",
            "how_to_fix": "Trim non-essential details, older positions, and repetitive points to tighten document length.",
        })
    else:
        score = 25.0
        issues.append({
            "severity": "warning",
            "category": "Length & Readability",
            "message": f"Resume exceeds recommended length ({word_count} words).",
            "how_to_fix": "Condense your resume into 1-2 focused pages with high-impact bullets.",
        })

    return score, issues
