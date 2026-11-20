"""
Document Parsability and ATS Scannability Advisory.

Extracts layout metrics from PDF and DOCX files without altering ATS scores:
- PDF page count and embedded images count.
- DOCX table count and embedded images count.
- Text-per-page density ratio.
- Plain-language ATS readability warnings.
"""

import io
import logging
from typing import Any, Dict, List, Optional
import docx
import pypdf

logger = logging.getLogger("hiregenius.ai_ml_service.services.ats.parsability")


def inspect_parsability(
    file_bytes: Optional[bytes],
    filename: Optional[str],
    text_length: int,
) -> Optional[Dict[str, Any]]:
    """
    Generate advisory parsability metrics and warnings for a resume document.
    Does not penalize scores; strictly provides recruiter-facing diagnostic context.
    """
    if not file_bytes or not filename:
        return None

    clean_name = filename.strip().lower()
    warnings: List[str] = []
    page_count: Optional[int] = None
    table_count: Optional[int] = None
    image_count: int = 0

    try:
        if clean_name.endswith(".pdf"):
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            page_count = len(reader.pages)
            for page in reader.pages:
                try:
                    image_count += len(page.images)
                except Exception:
                    pass

            text_per_page = round(text_length / max(page_count, 1))

            if page_count > 2:
                warnings.append(
                    f"Document has {page_count} pages. Standard resumes should typically not exceed 1-2 pages."
                )
            if image_count > 0:
                warnings.append(
                    f"Contains {image_count} embedded image(s). Most ATS systems cannot parse text contained in images or logos."
                )
            if text_per_page < 300:
                warnings.append(
                    f"Low average text density ({text_per_page} characters/page). Ensure layout does not rely on decorative graphics."
                )

            return {
                "page_count": page_count,
                "table_count": None,
                "image_count": image_count,
                "text_per_page": text_per_page,
                "warnings": warnings,
            }

        elif clean_name.endswith(".docx"):
            doc = docx.Document(io.BytesIO(file_bytes))
            table_count = len(doc.tables)

            try:
                for rel in doc.part.rels.values():
                    if "image" in getattr(rel, "target_ref", "").lower():
                        image_count += 1
            except Exception:
                pass

            if table_count > 0:
                warnings.append(
                    f"Document contains {table_count} table(s). Complex nested tables or column-based layouts can scramble reading order in legacy ATS parsers."
                )
            if image_count > 0:
                warnings.append(
                    f"Contains {image_count} embedded image(s). Visual graphics cannot be indexed for keyword matching."
                )

            return {
                "page_count": None,
                "table_count": table_count,
                "image_count": image_count,
                "text_per_page": None,
                "warnings": warnings,
            }

    except Exception as e:
        logger.debug(f"Could not inspect parsability for '{filename}': {e}")
        return None

    return None
