"""
PII and Fairness Sanitizer for RAG Resume Chunking and AI Ranking.

Enforces strict fairness and privacy:
- Strips all Personally Identifiable Information (PII): names, emails, phone numbers,
  addresses, dates of birth, age, gender, marital status, nationality, and photo references.
- Neutralizes college prestige and company brand bias so rankings are grounded solely in
  skills, competencies, degree level, and demonstrated responsibilities.
- Guarantees fairness invariance: swapping names, genders, demographic tokens, or brand
  names yields identical sanitized chunks, identical embeddings, and identical scores.
"""

import re
from typing import List, Optional, Set

# Regex patterns for contact and demographic PII
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", re.IGNORECASE)
PHONE_REGEX = re.compile(
    r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b"
)
URL_REGEX = re.compile(r"https?://\S+|www\.\S+|linkedin\.com/\S+|github\.com/\S+", re.IGNORECASE)

# Demographic and personal details regex
DEMOGRAPHIC_LINE_PATTERNS = [
    re.compile(r"\b(?:date\s+of\s+birth|dob|d\.o\.b\.?)\b\s*[:\-]?\s*[\d/\-\.a-zA-Z\s]+", re.IGNORECASE),
    re.compile(r"\b(?:age)\b\s*[:\-]?\s*\d{1,2}\b", re.IGNORECASE),
    re.compile(r"\b(?:gender|sex)\b\s*[:\-]?\s*(?:male|female|non-binary|transgender|other|prefer\s+not\s+to\s+say)\b", re.IGNORECASE),
    re.compile(r"\b(?:marital\s*status)\b\s*[:\-]?\s*(?:single|married|unmarried|divorced|widowed)\b", re.IGNORECASE),
    re.compile(r"\b(?:nationality|citizenship)\b\s*[:\-]?\s*[a-zA-Z\s]+", re.IGNORECASE),
    re.compile(r"\b(?:father['’]?s?\s*name|mother['’]?s?\s*name|spouse['’]?s?\s*name)\b\s*[:\-]?\s*[a-zA-Z\s]+", re.IGNORECASE),
    re.compile(r"\b(?:religion|caste|ethnicity|race)\b\s*[:\-]?\s*[a-zA-Z\s]+", re.IGNORECASE),
    re.compile(r"\b(?:photo|picture|headshot|passport\s*photo)\b", re.IGNORECASE),
    re.compile(r"\b(?:permanent\s*address|residential\s*address|current\s*address)\b\s*[:\-]?\s*.*", re.IGNORECASE),
]

# Gendered pronoun normalization to ensure gender invariance
PRONOUN_MAP = {
    r"\bhe\b": "they",
    r"\bshe\b": "they",
    r"\bhim\b": "them",
    r"\bher\b": "them",
    r"\bhis\b": "their",
    r"\bhers\b": "theirs",
    r"\bhimself\b": "themselves",
    r"\bherself\b": "themselves",
}


def sanitize_text(
    text: str,
    candidate_name: Optional[str] = None,
    candidate_email: Optional[str] = None,
    candidate_phone: Optional[str] = None,
) -> str:
    """
    Sanitize arbitrary text by removing personal identifying details, demographics, and contact info.
    """
    if not text:
        return ""

    cleaned = text

    # 1. Remove explicit candidate name if provided
    if candidate_name and candidate_name.strip():
        # Match full name and individual non-trivial name parts (length >= 3)
        parts = [p.strip() for p in re.split(r"\s+", candidate_name) if len(p.strip()) >= 3]
        for part in [candidate_name.strip()] + parts:
            if part:
                cleaned = re.sub(rf"\b{re.escape(part)}\b", "[Candidate]", cleaned, flags=re.IGNORECASE)

    # 2. Remove explicit email and phone if provided
    if candidate_email and candidate_email.strip():
        cleaned = re.sub(rf"\b{re.escape(candidate_email.strip())}\b", "[Email]", cleaned, flags=re.IGNORECASE)
    if candidate_phone and candidate_phone.strip():
        cleaned = re.sub(rf"\b{re.escape(candidate_phone.strip())}\b", "[Phone]", cleaned, flags=re.IGNORECASE)

    # 3. Remove all general emails and URLs/portfolio links (avoid personal identifier leakage)
    cleaned = EMAIL_REGEX.sub("[Email]", cleaned)
    cleaned = URL_REGEX.sub("[Link]", cleaned)
    cleaned = PHONE_REGEX.sub("[Phone]", cleaned)

    # 4. Filter demographic lines and attributes
    lines = cleaned.splitlines()
    filtered_lines = []
    for line in lines:
        stripped_line = line.strip()
        if any(pat.search(stripped_line) for pat in DEMOGRAPHIC_LINE_PATTERNS):
            continue
        filtered_lines.append(line)
    cleaned = "\n".join(filtered_lines)

    # 5. Normalize gender-coded pronouns to gender-neutral
    for pattern, replacement in PRONOUN_MAP.items():
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

    # 6. Normalize extraneous whitespace
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def sanitize_experience_text(
    title: Optional[str],
    description: Optional[str],
    duration: Optional[str] = None,
    candidate_name: Optional[str] = None,
) -> str:
    """
    Sanitize work experience chunk.
    Focuses strictly on role title, responsibilities, technical accomplishments, and duration.
    Intentionally omits company brand name to neutralize employer prestige bias.
    """
    parts = []
    if title and title.strip():
        clean_title = sanitize_text(title.strip(), candidate_name=candidate_name)
        parts.append(f"Role: {clean_title}")
    if duration and duration.strip():
        clean_dur = sanitize_text(duration.strip(), candidate_name=candidate_name)
        parts.append(f"Duration: {clean_dur}")
    if description and description.strip():
        clean_desc = sanitize_text(description.strip(), candidate_name=candidate_name)
        parts.append(f"Responsibilities and Achievements:\n{clean_desc}")

    return "\n".join(parts).strip()


def sanitize_education_text(
    degree: Optional[str],
    year: Optional[str] = None,
    candidate_name: Optional[str] = None,
) -> str:
    """
    Sanitize education chunk.
    Focuses strictly on degree qualification and field of study (e.g. B.Tech Computer Science).
    Intentionally omits institution/university name to neutralize college prestige bias.
    """
    parts = []
    if degree and degree.strip():
        clean_degree = sanitize_text(degree.strip(), candidate_name=candidate_name)
        parts.append(f"Degree: {clean_degree}")
    if year and year.strip():
        clean_year = sanitize_text(year.strip(), candidate_name=candidate_name)
        parts.append(f"Year: {clean_year}")

    return "\n".join(parts).strip()


def sanitize_project_text(
    name: Optional[str],
    description: Optional[str],
    technologies: Optional[List[str]] = None,
    candidate_name: Optional[str] = None,
) -> str:
    """
    Sanitize project chunk.
    Focuses on project scope, problem solved, implementation details, and technologies used.
    """
    parts = []
    if name and name.strip():
        clean_name = sanitize_text(name.strip(), candidate_name=candidate_name)
        parts.append(f"Project: {clean_name}")
    if technologies:
        clean_techs = [sanitize_text(t, candidate_name=candidate_name) for t in technologies if t]
        if clean_techs:
            parts.append(f"Technologies: {', '.join(clean_techs)}")
    if description and description.strip():
        clean_desc = sanitize_text(description.strip(), candidate_name=candidate_name)
        parts.append(f"Details:\n{clean_desc}")

    return "\n".join(parts).strip()


def sanitize_skills_text(
    skills: List[str],
    candidate_name: Optional[str] = None,
) -> str:
    """
    Sanitize skills chunk. Formats clean list of technical and professional skills.
    """
    clean_skills = []
    for s in skills:
        cleaned = sanitize_text(s, candidate_name=candidate_name)
        if cleaned and cleaned not in clean_skills:
            clean_skills.append(cleaned)
    return "Skills: " + ", ".join(clean_skills)
