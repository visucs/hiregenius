"""
ATS Scoring Service Package.
"""

from app.services.ats.scorer import ATSAnalysisResult, analyze, analyze_v2
from app.services.ats.keywords import JOB_CATEGORIES, DOMAIN_KEYWORDS, extract_jd_keywords
from app.services.ats.parsability import inspect_parsability

__all__ = [
    "analyze",
    "analyze_v2",
    "ATSAnalysisResult",
    "JOB_CATEGORIES",
    "DOMAIN_KEYWORDS",
    "extract_jd_keywords",
    "inspect_parsability",
]
