"""
Resume Section Detection and Structure Analysis.

Implements heading-style section detection (short standalone lines at line start),
inspects structured ParsedResume fields when provided, and provides regex
fallbacks so ATS checks remain 100% functional without an LLM or parsed resume.

Includes:
- Fresher detection: Projects/Internships/Education substitute for Experience with zero penalty.
- Support for Indian academic and career formats (B.Tech, B.E., BCA, MCA, Diploma, 'Objective').
- Personal-field detection for modern bias-free ATS recommendations (DOB, marital status, father's name, gender, photo).
"""

import re
from typing import Dict, List, Optional, Tuple
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

CORE_SECTION_NAMES = [
    "Contact Info",
    "Summary/Objective",
    "Experience",
    "Education",
    "Skills",
    "Projects",
]

HEADING_PATTERNS: Dict[str, str] = {
    "Contact Info": (
        r"^(?:contact(?:\s+info(?:rmation)?)?|personal\s+details|reach\s+me)$"
    ),
    "Summary/Objective": (
        r"^(?:summary|professional\s+summary|executive\s+summary|objective|career\s+objective|about\s+me|profile)$"
    ),
    "Experience": (
        r"^(?:experience|work\s+experience|professional\s+experience|employment(?:\s+history)?|work\s+history|internships?)$"
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
    "Experience": r"(?:^|\n)\s*(?:#+\s*)?(?:work\s+experience|professional\s+experience|employment\s+history|experience|internships?)\b",
    "Education": r"(?:^|\n)\s*(?:#+\s*)?(?:education|academic\s+background|academics|b\.?tech|b\.?e\.?|bca|mca|diploma)\b",
    "Skills": r"(?:^|\n)\s*(?:#+\s*)?(?:technical\s+skills|core\s+competencies|skills)\b",
    "Projects": r"(?:^|\n)\s*(?:#+\s*)?(?:key\s+projects|personal\s+projects|academic\s+projects|projects)\s*(?::|\n|$)",
    "Certifications": r"(?:^|\n)\s*(?:#+\s*)?(?:certifications?|licenses?|credentials?)\b",
}

PERSONAL_DEMOGRAPHICS_REGEX = re.compile(
    r"\b(?:d\.?o\.?b\.?|date\s+of\s+birth|marital\s+status|father'?s?\s+name|father\s+name|gender\s*:\s*(?:male|female|other)|marital\s*:\s*(?:single|married))\b",
    re.IGNORECASE,
)

DEMOGRAPHIC_LINE_PATTERNS = [
    (re.compile(r"^\s*(?:d\.?o\.?b\.?|date\s+of\s+birth)\s*[:\-–]\s*.*$", re.IGNORECASE), "Date of Birth"),
    (re.compile(r"^\s*marital\s+status\s*[:\-–]\s*.*$", re.IGNORECASE), "Marital Status"),
    (re.compile(r"^\s*father'?s?\s+name\s*[:\-–]\s*.*$", re.IGNORECASE), "Father's Name"),
    (re.compile(r"^\s*(?:gender|sex)\s*[:\-–]\s*(?:male|female|other|transgender|non-binary|prefer\s+not\s+to\s+say).*$", re.IGNORECASE), "Gender"),
    (re.compile(r"^\s*nationality\s*[:\-–]\s*.*$", re.IGNORECASE), "Nationality"),
    (re.compile(r"^\s*religion\s*[:\-–]\s*.*$", re.IGNORECASE), "Religion"),
    (re.compile(r"^\s*(?:photo|photograph)\s*[:\-–]?\s*.*$", re.IGNORECASE), "Photo"),
]

PERSONAL_DETAILS_HEADER_REGEX = re.compile(
    r"^\s*(?:#+\s*)?(?:personal\s+details|personal\s+information|personal\s+profile)\s*[:\-–]?\s*$",
    re.IGNORECASE,
)

FRESHER_KEYWORDS_REGEX = re.compile(
    r"\b(?:fresher|entry\s*level|internship|intern|recent\s*graduate|seeking\s+(?:an?\s+)?entry[- ]level|career\s*objective|0\s*years?|6\s*months?|1\.5\s*yrs?)\b",
    re.IGNORECASE,
)


def detect_personal_demographics(text: str) -> bool:
    """Detect presence of personal fields (DOB, marital status, father's name, gender, photo mention)."""
    if not text:
        return False
    return bool(PERSONAL_DEMOGRAPHICS_REGEX.search(text))


def strip_personal_demographics(text: str) -> Tuple[str, List[str]]:
    """
    Strips personal demographic lines and personal details sections so demographic attributes
    cannot alter ANY downstream scoring category (contact, sections, skills, content quality, length).
    Preserves legitimate sentences in project/experience descriptions that mention words like 'date' or 'gender'.
    Returns (cleaned_text, list_of_detected_fields).
    """
    if not text:
        return "", []

    detected_fields = set()
    cleaned_lines = []
    in_personal_details_block = False

    for line in text.splitlines():
        # Check if line is a "Personal Details" section heading
        if PERSONAL_DETAILS_HEADER_REGEX.match(line):
            in_personal_details_block = True
            detected_fields.add("Personal Details Section")
            continue

        # If inside a Personal Details block, check if we reached an empty line or another major section heading
        if in_personal_details_block:
            clean_l = line.strip()
            if not clean_l:
                in_personal_details_block = False
                continue
            is_another_section = any(
                re.match(pattern, re.sub(r"^[\s#\*\-_•]+|[\s:\-_|]+$", "", clean_l).strip(), re.IGNORECASE)
                for sec, pattern in HEADING_PATTERNS.items()
                if sec != "Contact Info"
            )
            if is_another_section:
                in_personal_details_block = False
                cleaned_lines.append(line)
                continue
            # Check for demographic fields within personal details block
            for pattern, field_name in DEMOGRAPHIC_LINE_PATTERNS:
                if pattern.match(line):
                    detected_fields.add(field_name)
                    break
            else:
                # Standalone short items in personal details like "Single", "Indian", "Male"
                if len(clean_l.split()) <= 4:
                    continue
                else:
                    cleaned_lines.append(line)
            continue

        # Outside personal details block: check individual line patterns (must start with Key: Value)
        matched_demographic = False
        for pattern, field_name in DEMOGRAPHIC_LINE_PATTERNS:
            if pattern.match(line):
                detected_fields.add(field_name)
                matched_demographic = True
                break

        if not matched_demographic:
            cleaned_lines.append(line)

    return "\n".join(cleaned_lines), sorted(list(detected_fields))


def is_fresher_profile(
    text: str,
    parsed_resume: Optional[ParsedResume] = None,
) -> bool:
    """
    Detect if the candidate is early-career / fresher.
    """
    if parsed_resume is not None:
        if not parsed_resume.experience or len(parsed_resume.experience) == 0:
            return True
        total_months = 0
        for exp in parsed_resume.experience:
            if getattr(exp, "duration_months", None):
                total_months += exp.duration_months
        if total_months > 0 and total_months <= 12:
            return True

    if not text:
        return False

    return bool(FRESHER_KEYWORDS_REGEX.search(text))


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


def compute_section_score(
    sections: Dict[str, bool],
    is_fresher: bool = False,
) -> float:
    """
    Return section completeness percentage (0.0 to 100.0).
    Core sections: Contact Info, Summary/Objective, Experience, Education, Skills, Projects.
    Certifications is optional (no point penalty if missing, actionable tip emitted).
    If candidate is a fresher, having Projects waives any Experience section penalty.
    """
    if not sections:
        return 0.0

    eval_sections = dict(sections)
    if is_fresher and not eval_sections.get("Experience") and eval_sections.get("Projects"):
        # Projects count in place of Experience for freshers with no penalty
        eval_sections["Experience"] = True

    core_found = sum(1 for s in CORE_SECTION_NAMES if eval_sections.get(s, False))
    return round((core_found / len(CORE_SECTION_NAMES)) * 100.0, 1)
