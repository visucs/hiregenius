"""
Document Parsability and ATS Scannability Diagnostic Engine.

Extracts layout metrics and detects potential parsing hazards for PDF and DOCX documents:
- Extractability check (image-only / scanned vs. text layer)
- Multi-column layout suspicion using text bounding coordinates
- Embedded graphics / decorative shapes / image density
- DOCX table complexity
- Word and text density per page
- Plain-language "possible issue" diagnostics
"""

import io
import logging
import re
from typing import Any, Dict, List, Optional
import docx
import pypdf

DATE_OR_LOC_REGEX = re.compile(
    r"^(?:\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{1,2}/\d{4}|present|current|[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}|[A-Z][a-zA-Z\s]+,\s*[a-zA-Z]+)(?:\s*[\-–—to]+\s*(?:\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{1,2}/\d{4}|present|current))?$",
    re.IGNORECASE,
)


def inspect_parsability(
    file_bytes: Optional[bytes],
    filename: Optional[str],
    text_length: int,
) -> Optional[Dict[str, Any]]:
    """
    Generate advisory parsability metrics and warnings for a resume document.
    Maintained for backward-compatibility with legacy endpoints.
    """
    analysis = analyze_parsability(file_bytes, filename, text_length)
    if analysis is None:
        return None

    return {
        "page_count": analysis.get("page_count"),
        "table_count": analysis.get("table_count"),
        "image_count": analysis.get("image_count", 0),
        "text_per_page": analysis.get("text_per_page"),
        "warnings": analysis.get("warnings", []),
    }


def analyze_parsability(
    file_bytes: Optional[bytes],
    filename: Optional[str],
    text_length: int,
    is_unreadable: bool = False,
    unreadable_reason: str = "",
) -> Dict[str, Any]:
    """
    Deep diagnostic layout analysis.
    Returns score (0.0 to 100.0), detected metrics, and structured issues.
    """
    # Default clean state
    result: Dict[str, Any] = {
        "score": 100.0,
        "page_count": None,
        "table_count": None,
        "image_count": 0,
        "text_per_page": None,
        "multi_column_detected": False,
        "is_unreadable": is_unreadable,
        "issues": [],
        "warnings": [],
    }

    if is_unreadable:
        result["score"] = 0.0
        reason_msg = (
            unreadable_reason
            or "ATS cannot read text from this file. The document appears to be scanned or image-based."
        )
        result["issues"].append(
            {
                "severity": "critical",
                "category": "Parsability & Format",
                "message": reason_msg,
                "how_to_fix": "Export your resume directly from your word processor (Google Docs, MS Word) as a searchable text PDF or DOCX file.",
            }
        )
        result["warnings"].append(reason_msg)
        return result

    if not file_bytes or not filename:
        return result

    clean_name = filename.strip().lower()
    score = 100.0
    issues = []
    warnings = []
    page_count: Optional[int] = None
    table_count: Optional[int] = None
    image_count = 0
    multi_column = False
    text_per_page = None

    try:
        if clean_name.endswith(".pdf"):
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            page_count = len(reader.pages)

            # Analyze pages for multi-column layout and embedded images
            # True multi-column layout requires sustained parallel text blocks of significant width
            # and substance over many lines, NOT a few isolated right-aligned dates or a brief 2-column skills list.
            right_substantive_y_levels = set()
            left_substantive_y_levels = set()

            for page in reader.pages:
                try:
                    image_count += len(page.images)
                except Exception:
                    pass

                def visitor_coords(text, cm, tm, font_dict, font_size):
                    clean_str = text.strip()
                    if len(clean_str) >= 4 and not DATE_OR_LOC_REGEX.match(clean_str):
                        x = tm[4]
                        y = tm[5]
                        y_bucket = round(y / 10) * 10
                        if x < 180:
                            left_substantive_y_levels.add(y_bucket)
                        elif x >= 220:
                            right_substantive_y_levels.add(y_bucket)

                try:
                    page.extract_text(visitor_text=visitor_coords)
                except Exception:
                    pass

            if len(right_substantive_y_levels) >= 4 and len(left_substantive_y_levels) >= 4:
                right_span = max(right_substantive_y_levels) - min(right_substantive_y_levels)
                # Sustained vertical span of secondary column (at least 70pt, > 4 lines)
                if right_span >= 70:
                    multi_column = True

            text_per_page = round(text_length / max(page_count, 1))

            # Page count evaluation
            if page_count > 3:
                score -= 30.0
                issues.append(
                    {
                        "severity": "warning",
                        "category": "Parsability & Format",
                        "message": f"Resume is {page_count} pages long. Possible issue: standard resumes should not exceed 1-2 pages.",
                        "how_to_fix": "Condense older experience and focus on high-impact achievements to keep your resume to 1-2 pages.",
                    }
                )
                warnings.append(f"Document has {page_count} pages.")
            elif page_count == 3:
                score -= 10.0
                issues.append(
                    {
                        "severity": "tip",
                        "category": "Parsability & Format",
                        "message": "Resume is 3 pages long. 1-2 pages is generally preferred by recruiters.",
                        "how_to_fix": "Review bullet points and trim verbose phrasing to reach a compact 2-page format.",
                    }
                )

            # Multi-column layout penalty
            if multi_column:
                score -= 25.0
                issues.append(
                    {
                        "severity": "warning",
                        "category": "Parsability & Format",
                        "message": "Possible multi-column or sidebar layout detected. Legacy ATS parsers can scramble multi-column reading order.",
                        "how_to_fix": "Use a single-column, top-to-bottom layout to guarantee clean, linear reading across all applicant tracking systems.",
                    }
                )
                warnings.append("Possible multi-column layout detected.")

            # Embedded decorative graphics/images penalty
            if image_count > 1:
                score -= 15.0
                issues.append(
                    {
                        "severity": "warning",
                        "category": "Parsability & Format",
                        "message": f"Contains {image_count} embedded image(s) or graphic elements. Possible issue: ATS parsers cannot read text in images.",
                        "how_to_fix": "Replace icons, logos, and graphics with plain text labels to ensure full keyword indexing.",
                    }
                )
                warnings.append(f"Contains {image_count} embedded image(s).")

            # Low text density
            if text_per_page < 250:
                score -= 15.0
                issues.append(
                    {
                        "severity": "warning",
                        "category": "Parsability & Format",
                        "message": f"Low text density detected ({text_per_page} characters/page). Possible issue: document may rely heavily on decorative whitespace or graphics.",
                        "how_to_fix": "Ensure resume content is written in standard text paragraphs and bullet points rather than graphic containers.",
                    }
                )
                warnings.append(f"Low average text density ({text_per_page} characters/page).")

        elif clean_name.endswith(".docx"):
            doc = docx.Document(io.BytesIO(file_bytes))
            table_count = len(doc.tables)

            try:
                for rel in doc.part.rels.values():
                    if "image" in getattr(rel, "target_ref", "").lower():
                        image_count += 1
            except Exception:
                pass

            if table_count > 1:
                score -= 20.0
                issues.append(
                    {
                        "severity": "warning",
                        "category": "Parsability & Format",
                        "message": f"Document contains {table_count} tables. Possible issue: complex nested tables can scramble reading order in ATS parsers.",
                        "how_to_fix": "Convert table-based structures into standard tabbed bullet points and headings.",
                    }
                )
                warnings.append(f"Document contains {table_count} table(s).")

            if image_count > 1:
                score -= 15.0
                issues.append(
                    {
                        "severity": "warning",
                        "category": "Parsability & Format",
                        "message": f"Document contains {image_count} embedded image(s).",
                        "how_to_fix": "Remove logos and decorative images from Word document.",
                    }
                )
                warnings.append(f"Contains {image_count} embedded image(s).")

    except Exception as e:
        logger.debug(f"Parsability analysis error on '{filename}': {e}")

    result["score"] = max(0.0, min(100.0, round(score, 1)))
    result["page_count"] = page_count
    result["table_count"] = table_count
    result["image_count"] = image_count
    result["text_per_page"] = text_per_page
    result["multi_column_detected"] = multi_column
    result["issues"] = issues
    result["warnings"] = warnings

    return result
