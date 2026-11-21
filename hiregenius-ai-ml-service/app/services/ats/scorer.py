"""
Core ATS Scoring Engine (v2) with Transparent Heuristic Calibration.

Supports:
- GENERAL Mode: Parsability (25), Sections (20), Contact (10), Skills (15), Content Quality (20), Length (10). Total = 100.
- JOB Mode: Keywords Match (45), Title/Seniority (10), Experience Fit (15), Education Fit (10), Parsability & Format (20). Total = 100.
- Unreadable / Encrypted handling: Returns HTTP 200 with overallScore capped at 10.0, parsability ~0, single critical issue.
- Personal-field invariance: Presence of DOB, marital status, father's name, gender, or photo does not alter the score.
- Fresher handling: Projects, internships, and education count in place of work experience with no penalty.
- Backward compatibility: Preserves legacy analyze() for existing endpoints.
"""

from dataclasses import dataclass
import re
from typing import Any, Dict, List, Optional, Tuple
from app.config import settings
from app.models.ats import (
    ATSScanResponse,
    CategoryScoreItem,
    IssueItem,
    MissingKeywords,
)
from app.models.resume import ParsedResume
from app.services.ats.category_matcher import get_missing_domain_skills, predict_category
from app.services.ats.format_checker import (
    compute_content_quality,
    compute_format_score,
    compute_length_analysis,
    compute_length_score,
    detect_format_signals,
)
from app.services.ats.jd_extractor import JDExtractedRequirements
from app.services.ats.keywords import DOMAIN_KEYWORDS, extract_jd_keywords, match_skill
from app.services.ats.parsability import analyze_parsability
from app.services.ats.sections import (
    compute_section_score,
    detect_personal_demographics,
    detect_sections,
    is_fresher_profile,
)
from app.services.ats.suggestions import generate_ats_suggestions

# Legacy result data class for backward compatibility
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


# Recognized Seniority Tokens
SENIORITY_TOKENS = {
    "intern": 0,
    "fresher": 0,
    "entry": 0,
    "graduate": 0,
    "junior": 1,
    "associate": 1,
    "mid": 2,
    "senior": 3,
    "sr": 3,
    "lead": 4,
    "principal": 5,
    "staff": 5,
    "architect": 5,
    "manager": 4,
    "director": 6,
    "head": 6,
}


def _strip_demographics_for_word_count(text: str) -> int:
    """Strip personal demographic lines so personal details do not perturb length score brackets."""
    lines = text.splitlines()
    clean_lines = []
    for line in lines:
        if detect_personal_demographics(line):
            continue
        clean_lines.append(line)
    return len(" ".join(clean_lines).split())


def _calculate_grade(score: float) -> str:
    if score >= 80.0:
        return "Excellent"
    if score >= 65.0:
        return "Good Match"
    if score >= 50.0:
        return "Moderate"
    return "Needs Work"


def _evaluate_title_seniority(
    text: str,
    target_title: Optional[str],
    role_level: Optional[str],
    parsed_resume: Optional[ParsedResume] = None,
) -> Tuple[float, List[IssueItem], Dict[str, Any]]:
    """
    Evaluate title & seniority alignment without embeddings.
    Uses token overlap and seniority level distance.
    Max points: 10.0
    """
    if not target_title:
        return 7.0, [], {"info": "No explicit target title provided; neutral heuristic score applied."}

    text_lower = text.lower()
    title_clean = target_title.lower()
    title_tokens = [w for w in re.findall(r"\b[a-zA-Z]{3,}\b", title_clean) if w not in {"the", "and", "for", "with"}]

    # Headline / recent titles from resume
    resume_titles = []
    if parsed_resume and parsed_resume.experience:
        for exp in parsed_resume.experience[:2]:
            if exp.title:
                resume_titles.append(exp.title.lower())
    first_lines = " ".join([l.lower() for l in text.splitlines()[:5] if l.strip()])
    resume_titles.append(first_lines)
    combined_resume_headline = " ".join(resume_titles)

    # 1. Title Keyword Overlap (max 6.0 pts)
    matched_title_tokens = [t for t in title_tokens if t in text_lower]
    headline_overlap = [t for t in title_tokens if t in combined_resume_headline]

    if headline_overlap:
        title_score = 6.0
    elif len(matched_title_tokens) >= max(1, len(title_tokens) // 2):
        title_score = 4.5
    elif len(matched_title_tokens) > 0:
        title_score = 3.0
    else:
        title_score = 1.0

    # 2. Seniority Alignment (max 4.0 pts)
    jd_seniority = None
    if role_level and role_level.lower() in SENIORITY_TOKENS:
        jd_seniority = SENIORITY_TOKENS[role_level.lower()]
    else:
        for token, val in SENIORITY_TOKENS.items():
            if re.search(rf"\b{token}\b", title_clean):
                jd_seniority = val
                break

    resume_seniority = None
    for token, val in SENIORITY_TOKENS.items():
        if re.search(rf"\b{token}\b", combined_resume_headline):
            resume_seniority = val
            break

    seniority_score = 4.0
    issues = []
    if jd_seniority is not None and resume_seniority is not None:
        diff = abs(jd_seniority - resume_seniority)
        if diff == 0:
            seniority_score = 4.0
        elif diff == 1:
            seniority_score = 3.0
        else:
            seniority_score = 1.5
            issues.append(
                IssueItem(
                    severity="tip",
                    category="Title/Seniority Alignment",
                    message="Target role seniority differs noticeably from your current resume headline.",
                    how_to_fix=f"Align your professional summary and headline closer to '{target_title}'.",
                )
            )

    total_pts = round(min(10.0, title_score + seniority_score), 1)
    details = {
        "target_title": target_title,
        "matched_title_tokens": matched_title_tokens,
        "headline_overlap": headline_overlap,
        "seniority_alignment": f"JD level: {role_level or 'Unspecified'}, Resume level: {resume_seniority if resume_seniority is not None else 'Unspecified'}",
    }
    return total_pts, issues, details


def _evaluate_experience_fit(
    text: str,
    jd_requirements: Optional[JDExtractedRequirements],
    parsed_resume: Optional[ParsedResume] = None,
    is_fresher: bool = False,
) -> Tuple[float, List[IssueItem], Dict[str, Any]]:
    """
    Evaluate experience fit against JD requirements. Max points: 15.0
    """
    issues = []
    req_years = jd_requirements.experience_years if jd_requirements else None

    # Calculate candidate years of experience
    cand_years = 0.0
    if parsed_resume and parsed_resume.experience:
        months = sum(getattr(exp, "duration_months", 0) or 0 for exp in parsed_resume.experience)
        cand_years = round(months / 12.0, 1)
    else:
        # Heuristic from date mentions
        dates = [int(m) for m in re.findall(r"\b(20\d{2}|19\d{2})\b", text)]
        if len(dates) >= 2:
            cand_years = min(20.0, max(0.0, float(max(dates) - min(dates))))

    # If Fresher role or fresher candidate
    if is_fresher:
        if req_years is None or req_years <= 1.0:
            score = 15.0
        else:
            score = 8.0
            issues.append(
                IssueItem(
                    severity="warning",
                    category="Experience Fit",
                    message=f"Job requires ~{req_years} years experience, while your profile is entry-level/fresher.",
                    how_to_fix="Highlight relevant internships, academic projects, and open-source contributions prominently.",
                )
            )
        return score, issues, {"candidate_years": cand_years, "required_years": req_years, "is_fresher": True}

    if req_years is None:
        score = 12.0
    elif cand_years >= req_years:
        score = 15.0
    elif cand_years >= (req_years - 1.0):
        score = 11.0
        issues.append(
            IssueItem(
                severity="tip",
                category="Experience Fit",
                message=f"Experience level ({cand_years} yrs) is slightly below stated preference ({req_years} yrs).",
                how_to_fix="Emphasize direct technical responsibilities to demonstrate senior-equivalent depth.",
            )
        )
    else:
        score = 6.0
        issues.append(
            IssueItem(
                severity="warning",
                category="Experience Fit",
                message=f"Noticeable gap between your experience ({cand_years} yrs) and stated requirement ({req_years} yrs).",
                how_to_fix="Ensure all relevant contract work, freelance projects, and leadership roles are included.",
            )
        )

    return score, issues, {"candidate_years": cand_years, "required_years": req_years, "is_fresher": False}


def _evaluate_education_fit(
    text: str,
    parsed_resume: Optional[ParsedResume] = None,
) -> Tuple[float, List[IssueItem], Dict[str, Any]]:
    """
    Evaluate education fit. Max points: 10.0
    """
    text_lower = text.lower()
    has_degree = bool(
        re.search(
            r"\b(b\.?tech|b\.?e\.?|bca|mca|b\.?s\.?|m\.?s\.?|m\.?tech|bachelor|master|degree|diploma|ph\.?d)\b",
            text_lower,
        )
    )
    has_edu_section = bool(re.search(r"\b(education|academic|academics|university|college|institute)\b", text_lower))

    if parsed_resume and parsed_resume.education and len(parsed_resume.education) > 0:
        score = 10.0
        return score, [], {"degree_found": True, "source": "parsed_resume"}

    if has_degree:
        score = 10.0
        return score, [], {"degree_found": True, "source": "regex"}
    elif has_edu_section:
        score = 7.0
        return score, [], {"degree_found": False, "education_section": True}
    else:
        return 4.0, [
            IssueItem(
                severity="tip",
                category="Education Fit",
                message="No degree or formal education credentials clearly detected.",
                how_to_fix="Include an Education section listing your degrees, university, and graduation year.",
            )
        ], {"degree_found": False}


def analyze_v2(
    text: str,
    file_bytes: Optional[bytes] = None,
    filename: Optional[str] = None,
    job_requirements: Optional[JDExtractedRequirements] = None,
    mode: str = "GENERAL",
    is_unreadable: bool = False,
    unreadable_reason: str = "",
    parsed_resume: Optional[ParsedResume] = None,
    candidate_id: Optional[str] = None,
    job_id: Optional[str] = None,
    source: str = "PROFILE",
    ai_suggestions_unavailable: bool = False,
) -> ATSScanResponse:
    """
    Pure ATS v2 Scoring Engine.
    Executes GENERAL or JOB scoring based on documented untuned weights.
    Returns typed ATSScanResponse.
    """
    clean_text = (text or "").strip()
    preview = clean_text[:500] if clean_text else "No text extractable from document."

    # ── 1. UNREADABLE / ENCRYPTED HANDLING (HTTP 200 with capped score) ───────────
    if is_unreadable:
        parsability_res = analyze_parsability(
            file_bytes=file_bytes,
            filename=filename,
            text_length=0,
            is_unreadable=True,
            unreadable_reason=unreadable_reason,
        )

        critical_issue = IssueItem(
            severity="critical",
            category="Parsability & Format",
            message=unreadable_reason or "ATS cannot read text from this file. The document appears to be scanned or image-based.",
            how_to_fix="Export your resume directly from your word processor as a searchable text PDF or DOCX file.",
        )

        if mode == "JOB":
            cat_scores = [
                CategoryScoreItem(name="Required & Preferred Skills", score=0.0, max=45.0, not_assessable=True),
                CategoryScoreItem(name="Title & Seniority Alignment", score=0.0, max=10.0, not_assessable=True),
                CategoryScoreItem(name="Experience Fit", score=0.0, max=15.0, not_assessable=True),
                CategoryScoreItem(name="Education Fit", score=0.0, max=10.0, not_assessable=True),
                CategoryScoreItem(name="Parsability & Format", score=0.0, max=20.0, details={"error": unreadable_reason}),
            ]
        else:
            cat_scores = [
                CategoryScoreItem(name="Parsability & Format", score=0.0, max=25.0, details={"error": unreadable_reason}),
                CategoryScoreItem(name="Section Completeness", score=0.0, max=20.0, not_assessable=True),
                CategoryScoreItem(name="Contact Completeness", score=0.0, max=10.0, not_assessable=True),
                CategoryScoreItem(name="Skills & Keywords Quality", score=0.0, max=15.0, not_assessable=True),
                CategoryScoreItem(name="Content Quality", score=0.0, max=20.0, not_assessable=True),
                CategoryScoreItem(name="Length & Readability", score=0.0, max=10.0, not_assessable=True),
            ]

        capped_score = float(settings.CAPPED_SCORE_UNREADABLE)
        return ATSScanResponse(
            overallScore=capped_score,
            grade=_calculate_grade(capped_score),
            mode=mode.upper(),
            categoryScores=cat_scores,
            issues=[critical_issue],
            matchedKeywords=[],
            missingKeywords=MissingKeywords(),
            extractedTextPreview=preview,
            disclaimer=settings.ATS_DISCLAIMER,
            scoringVersion=settings.SCORING_VERSION,
            ai_suggestions_unavailable=ai_suggestions_unavailable,
            candidateId=candidate_id,
            jobId=job_id,
            source=source,
        )

    # ── 2. REAL EXTRACTED TEXT SCORING ──────────────────────────────────────────
    word_count = _strip_demographics_for_word_count(clean_text)
    is_fresher = is_fresher_profile(clean_text, parsed_resume=parsed_resume)
    sections_found = detect_sections(clean_text, parsed_resume=parsed_resume)
    has_demographics = detect_personal_demographics(clean_text)

    # Parsability analysis
    parsability_info = analyze_parsability(file_bytes, filename, len(clean_text))
    parsability_raw = parsability_info.get("score", 100.0)

    issues: List[IssueItem] = []
    for iss in parsability_info.get("issues", []):
        issues.append(IssueItem(**iss))

    # Personal field suggestion (invariance: 0 point penalty!)
    if has_demographics:
        issues.append(
            IssueItem(
                severity="tip",
                category="Contact Completeness",
                message="Personal demographics (e.g. date of birth, marital status, father's name, or gender) detected.",
                how_to_fix="Standard ATS practice recommends omitting personal demographics to prevent unconscious bias and preserve space for technical skills.",
            )
        )

    if mode == "JOB" and job_requirements is not None:
        # ── JOB SPECIFIC EVALUATION (Total: 100) ──────────────────────────────────
        # 1. Keywords Match (45 pts max)
        req_skills = job_requirements.required_skills or []
        pref_skills = job_requirements.preferred_skills or []

        matched_req = [s for s in req_skills if match_skill(s, clean_text)]
        missing_req = [s for s in req_skills if not match_skill(s, clean_text)]
        matched_pref = [s for s in pref_skills if match_skill(s, clean_text)]
        missing_pref = [s for s in pref_skills if not match_skill(s, clean_text)]

        all_matched = matched_req + matched_pref

        # Skill evidence in experience/projects
        experience_text = ""
        if parsed_resume and parsed_resume.experience:
            experience_text += " ".join(exp.description or "" for exp in parsed_resume.experience)
        if parsed_resume and parsed_resume.projects:
            experience_text += " ".join(proj.description or "" for proj in parsed_resume.projects)

        if experience_text:
            for s in all_matched[:5]:
                if not match_skill(s, experience_text):
                    issues.append(
                        IssueItem(
                            severity="tip",
                            category="Required & Preferred Skills",
                            message=f"Skill '{s}' is listed in your profile but lacks context in your project or experience descriptions.",
                            how_to_fix=f"Describe how you applied '{s}' in an accomplishment bullet point.",
                        )
                    )

        req_ratio = len(matched_req) / max(len(req_skills), 1) if req_skills else 1.0
        pref_ratio = len(matched_pref) / max(len(pref_skills), 1) if pref_skills else 1.0
        kw_pts = round((req_ratio * 35.0) + (pref_ratio * 10.0), 1)

        if missing_req:
            issues.append(
                IssueItem(
                    severity="critical" if len(missing_req) >= 3 else "warning",
                    category="Required & Preferred Skills",
                    message=f"Missing {len(missing_req)} required job skills: {', '.join(missing_req[:4])}.",
                    how_to_fix="Incorporate missing required skills that match your experience into your skills and project bullets.",
                )
            )

        # 2. Title / Seniority Alignment (10 pts max)
        title_pts, title_issues, title_details = _evaluate_title_seniority(
            clean_text, job_requirements.target_title, job_requirements.role_level, parsed_resume
        )
        issues.extend(title_issues)

        # 3. Experience Fit (15 pts max)
        exp_pts, exp_issues, exp_details = _evaluate_experience_fit(
            clean_text, job_requirements, parsed_resume, is_fresher
        )
        issues.extend(exp_issues)

        # 4. Education Fit (10 pts max)
        edu_pts, edu_issues, edu_details = _evaluate_education_fit(clean_text, parsed_resume)
        issues.extend(edu_issues)

        # 5. Parsability & Format (20 pts max)
        parsability_pts = round((parsability_raw / 100.0) * 20.0, 1)

        category_scores = [
            CategoryScoreItem(
                name="Required & Preferred Skills",
                score=kw_pts,
                max=45.0,
                details={"matched": all_matched, "missing_required": missing_req, "missing_preferred": missing_pref},
            ),
            CategoryScoreItem(name="Title & Seniority Alignment", score=title_pts, max=10.0, details=title_details),
            CategoryScoreItem(name="Experience Fit", score=exp_pts, max=15.0, details=exp_details),
            CategoryScoreItem(name="Education Fit", score=edu_pts, max=10.0, details=edu_details),
            CategoryScoreItem(
                name="Parsability & Format",
                score=parsability_pts,
                max=20.0,
                details={"multi_column": parsability_info.get("multi_column_detected"), "pages": parsability_info.get("page_count")},
            ),
        ]

        total_score = round(min(100.0, max(0.0, kw_pts + title_pts + exp_pts + edu_pts + parsability_pts)), 1)
        missing_keywords_obj = MissingKeywords(required=missing_req, preferred=missing_pref)

    else:
        # ── GENERAL BENCHMARK EVALUATION (Total: 100) ─────────────────────────────
        # 1. Parsability & Format (25 pts max)
        parsability_pts = round((parsability_raw / 100.0) * 25.0, 1)

        # 2. Section Completeness (20 pts max)
        section_pct = compute_section_score(sections_found, is_fresher=is_fresher)
        section_pts = round((section_pct / 100.0) * 20.0, 1)
        missing_sections = [s for s, found in sections_found.items() if not found and not (is_fresher and s == "Experience")]
        if missing_sections:
            issues.append(
                IssueItem(
                    severity="warning",
                    category="Section Completeness",
                    message=f"Missing standard section headings: {', '.join(missing_sections[:3])}.",
                    how_to_fix="Add clear standalone section headings (e.g. 'Skills', 'Projects', 'Education').",
                )
            )

        # 3. Contact Completeness (10 pts max)
        has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", clean_text))
        has_phone = bool(re.search(r"\+?\d[\d\s\-\(\)]{8,}\d", clean_text))
        has_links = bool(re.search(r"(?:linkedin\.com|github\.com|portfolio)", clean_text, re.IGNORECASE))

        contact_pts = 0.0
        if has_email:
            contact_pts += 4.0
        else:
            issues.append(
                IssueItem(
                    severity="critical",
                    category="Contact Completeness",
                    message="No email address clearly detected.",
                    how_to_fix="Add your professional email address prominently at the top of your resume.",
                )
            )

        if has_phone:
            contact_pts += 3.0
        else:
            issues.append(
                IssueItem(
                    severity="warning",
                    category="Contact Completeness",
                    message="No telephone number detected.",
                    how_to_fix="Add your direct contact phone number with country code.",
                )
            )

        if has_links:
            contact_pts += 3.0
        else:
            issues.append(
                IssueItem(
                    severity="tip",
                    category="Contact Completeness",
                    message="No professional profile link (LinkedIn or GitHub) detected.",
                    how_to_fix="Include a clickable LinkedIn or GitHub link in your contact header.",
                )
            )

        # 4. Skills & Keywords Quality (15 pts max)
        best_cat, match_str, low_conf, top_3 = predict_category(clean_text, parsed_resume=parsed_resume)
        cat_kws = DOMAIN_KEYWORDS.get(best_cat, []) if best_cat != "Unknown" else []
        matched_domain = [k for k in cat_kws if match_skill(k, clean_text)]
        missing_domain = [k for k in cat_kws if not match_skill(k, clean_text)]

        num_skills = len(matched_domain)
        if num_skills >= 8:
            skills_pts = 15.0
        elif num_skills >= 5:
            skills_pts = 11.0
        elif num_skills >= 3:
            skills_pts = 7.0
        else:
            skills_pts = 4.0
            issues.append(
                IssueItem(
                    severity="warning",
                    category="Skills & Keywords Quality",
                    message="Relatively few recognized technical keywords detected in your resume.",
                    how_to_fix="Expand your technical skills list with specific tools, frameworks, and programming languages.",
                )
            )

        # 5. Content Quality (20 pts max)
        content_score_raw, content_issues, content_details = compute_content_quality(clean_text)
        content_pts = round((content_score_raw / 100.0) * 20.0, 1)
        issues.extend(IssueItem(**ci) for ci in content_issues)

        # 6. Length & Readability (10 pts max)
        length_score_raw, length_issues = compute_length_analysis(word_count)
        length_pts = round((length_score_raw / 100.0) * 10.0, 1)
        issues.extend(IssueItem(**li) for li in length_issues)

        category_scores = [
            CategoryScoreItem(
                name="Parsability & Format",
                score=parsability_pts,
                max=25.0,
                details={"multi_column": parsability_info.get("multi_column_detected"), "pages": parsability_info.get("page_count")},
            ),
            CategoryScoreItem(
                name="Section Completeness",
                score=section_pts,
                max=20.0,
                details={"sections_found": sections_found, "is_fresher": is_fresher},
            ),
            CategoryScoreItem(
                name="Contact Completeness",
                score=contact_pts,
                max=10.0,
                details={"email": has_email, "phone": has_phone, "links": has_links},
            ),
            CategoryScoreItem(
                name="Skills & Keywords Quality",
                score=skills_pts,
                max=15.0,
                details={"predicted_category": best_cat, "skills_detected_count": num_skills},
            ),
            CategoryScoreItem(
                name="Content Quality",
                score=content_pts,
                max=20.0,
                details=content_details,
            ),
            CategoryScoreItem(
                name="Length & Readability",
                score=length_pts,
                max=10.0,
                details={"word_count": word_count},
            ),
        ]

        total_score = round(min(100.0, max(0.0, parsability_pts + section_pts + contact_pts + skills_pts + content_pts + length_pts)), 1)
        all_matched = matched_domain
        missing_keywords_obj = MissingKeywords(required=missing_domain[:10], preferred=[])

    return ATSScanResponse(
        overallScore=total_score,
        grade=_calculate_grade(total_score),
        mode=mode.upper(),
        categoryScores=category_scores,
        issues=issues,
        matchedKeywords=all_matched,
        missingKeywords=missing_keywords_obj,
        extractedTextPreview=preview,
        disclaimer=settings.ATS_DISCLAIMER,
        scoringVersion=settings.SCORING_VERSION,
        ai_suggestions_unavailable=ai_suggestions_unavailable,
        candidateId=candidate_id,
        jobId=job_id,
        source=source,
    )


# ── Legacy Adapter Function for Existing Callers ────────────────────────────────
def analyze(
    text: str,
    job_description: Optional[str] = None,
    parsed_resume: Optional[ParsedResume] = None,
) -> ATSAnalysisResult:
    """
    Backward-compatibility adapter for legacy endpoints and tests.
    Computes legacy 50/25/25 general and 60/20/10/10 job scores.
    """
    clean_text = (text or "").strip()
    words = clean_text.split()
    word_count = len(words)

    sections_found = detect_sections(clean_text, parsed_resume=parsed_resume)
    section_score = compute_section_score(sections_found)

    format_signals = detect_format_signals(clean_text)
    format_score = compute_format_score(format_signals)

    length_score = compute_length_score(word_count)

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
        ats_score = round(
            (0.50 * section_score) + (0.25 * length_score) + (0.25 * format_score),
            1,
        )

        score_breakdown = {
            "sections": section_score,
            "length": length_score,
            "format": format_score,
        }

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
