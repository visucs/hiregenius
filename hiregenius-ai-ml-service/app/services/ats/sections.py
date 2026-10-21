"""
Resume Section Detection.

Implements heading-style section detection (short standalone lines at line start),
inspects structured ParsedResume fields when provided, and provides regex
fallbacks so ATS checks remain 100% functional without an LLM or parsed resume.
"""

import re
from typing import Dict, Optional
from app.models.resume import ParsedResume

SECTION_NAMES = [
    "Contact Info",
    "Summary/Objective",
    "Experience",
    "Education",
    "Skills",
    "Projects",
    "Certifications",
]

HEADING_PATTERNS: Dict[str, str] = {
    "Contact Info": (
        r"^(?:contact(?:\s+info(?:rmation)?)?|personal\s+details|reach\s+me)$"
    ),
    "Summary/Objective": (
        r"^(?:summary|professional\s+summary|executive\s+summary|objective|career\s+objective|about\s+me|profile)$"
    ),
    "Experience": (
        r"^(?:experience|work\s+experience|professional\s+experience|employment(?:\s+history)?|work\s+history)$"
    ),
    "Education": (
        r"^(?:education|academic\s+background|academics|qualifications|academic\s+history)$"
    ),
    "Skills": (
        r"^(?:skills|technical\s+skills|core\s+competencies|technologies|tools\s+(&|and)\s+technologies|areas\s+of\s+expertise)$"
    ),
    "Projects": (
        r"^(?:projects|key\s+projects|personal\s+projects|academic\s+projects|technical\s+projects)$"
    ),
    "Certifications": (
        r"^(?:certifications?|certificates?|licenses?|credentials?|awards?(?:\s+(&|and)\s+honors?)?)$"
    ),
}

FALLBACK_PATTERNS: Dict[str, str] = {
    "Summary/Objective": r"(?:^|\n)\s*(?:#+\s*)?(?:summary|objective|career\s+objective|professional\s+summary|about\s+me)\b",
    "Experience": r"(?:^|\n)\s*(?:#+\s*)?(?:work\s+experience|professional\s+experience|employment\s+history|experience)\b",
    "Education": r"(?:^|\n)\s*(?:#+\s*)?(?:education|academic\s+background|academics)\b",
    "Skills": r"(?:^|\n)\s*(?:#+\s*)?(?:technical\s+skills|core\s+competencies|skills)\b",
    "Projects": r"(?:^|\n)\s*(?:#+\s*)?(?:key\s+projects|personal\s+projects|academic\s+projects|projects)\s*(?::|\n|$)",
    "Certifications": r"(?:^|\n)\s*(?:#+\s*)?(?:certifications?|licenses?|credentials?)\b",
}


def detect_sections(
    text: str,
    parsed_resume: Optional[ParsedResume] = None,
) -> Dict[str, bool]:
    """
    Detect the presence of 7 standard resume sections.

    Evaluation precedence:
    1. Structured ParsedResume (if provided).
    2. Heading-style detection on short standalone lines (<= 50 chars).
    3. Pattern-based regex fallback over raw document text.
    """
    results: Dict[str, bool] = {name: False for name in SECTION_NAMES}

    # Step 1: Inspect structured ParsedResume if available
    if parsed_resume is not None:
        if bool(parsed_resume.email or parsed_resume.phone):
            results["Contact Info"] = True
        if bool(parsed_resume.experience and len(parsed_resume.experience) > 0):
            results["Experience"] = True
        if bool(parsed_resume.education and len(parsed_resume.education) > 0):
            results["Education"] = True
        if bool(parsed_resume.skills and len(parsed_resume.skills) > 0):
            results["Skills"] = True
        if bool(parsed_resume.projects and len(parsed_resume.projects) > 0):
            results["Projects"] = True
        if bool(parsed_resume.certifications and len(parsed_resume.certifications) > 0):
            results["Certifications"] = True

    # If all sections found from structured data, return early
    if all(results.values()):
        return results

    if not text:
        return results

    # Step 2: Line-based heading detection
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines:
        if len(line) <= 50:
            clean_line = re.sub(r"^[\s#\*\-_•]+|[\s:\-_|]+$", "", line).strip()
            for sec_name, pattern in HEADING_PATTERNS.items():
                if not results[sec_name] and re.match(pattern, clean_line, re.IGNORECASE):
                    results[sec_name] = True

    # Step 3: Regex fallbacks for remaining unconfirmed sections
    if not results["Contact Info"]:
        has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text))
        has_phone = bool(re.search(r"\+?\d[\d\s\-\(\)]{8,}\d", text))
        has_profile = bool(re.search(r"(?:linkedin\.com/in/|github\.com/)", text, re.IGNORECASE))
        if has_email or has_phone or has_profile:
            results["Contact Info"] = True

    for sec_name, pattern in FALLBACK_PATTERNS.items():
        if not results[sec_name] and re.search(pattern, text, re.IGNORECASE):
            results[sec_name] = True

    return results


def compute_section_score(sections: Dict[str, bool]) -> float:
    """Return section completeness percentage (0.0 to 100.0)."""
    if not sections:
        return 0.0
    return round((sum(sections.values()) / len(sections)) * 100.0, 1)
