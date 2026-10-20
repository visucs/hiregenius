import logging
from typing import Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings
from app.models.resume import ParsedResume

logger = logging.getLogger("hiregenius.ai_ml_service.resume_agent")


class ResumeParsingException(Exception):
    """Base exception for resume parsing errors."""

    pass


class ResumeParsingConfigError(ResumeParsingException):
    """Raised when GEMINI_API_KEY is missing or invalid."""

    pass


class ResumeParsingError(ResumeParsingException):
    """Raised when Gemini LLM invocation fails or returns malformed data."""

    pass


SYSTEM_PROMPT = """You are an expert, meticulous AI resume parser for the HireGenius recruitment platform.
Your objective is to extract the candidate's factual details from the raw resume text into the requested structured schema.

STRICT ACCURACY AND ANTI-HALLUCINATION RULES:
1. ONLY extract information that is explicitly stated in the provided resume text.
2. DO NOT assume, extrapolate, invent, or hallucinate skills, experiences, degrees, or certifications.
3. For skills: Only list skills explicitly named in the text (e.g. do NOT add "Kubernetes" unless the text explicitly mentions "Kubernetes" or "k8s"). Do not infer skills from job titles or company names.
4. For contact information: If the full name, email, or phone is not explicitly stated in the resume, leave that field as null.
5. For experience, education, and projects: If specific attributes (e.g. year, duration, technologies) are not mentioned, set those individual fields to null or empty lists.
6. Preserve the candidate's exact wording for company names, institutions, and job titles where possible.
"""

USER_PROMPT = """Resume Text:
---
{resume_text}
---

Extract all verifiable candidate information strictly following the schema."""


def get_gemini_llm() -> ChatGoogleGenerativeAI:
    """Instantiate and return the configured ChatGoogleGenerativeAI model."""
    if not settings.GEMINI_API_KEY:
        raise ResumeParsingConfigError(
            "GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your environment or .env file."
        )

    try:
        return ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.0,
            max_retries=2,
        )
    except Exception as e:
        logger.error(f"Failed to initialize ChatGoogleGenerativeAI: {e}")
        raise ResumeParsingConfigError(f"Failed to initialize Gemini LLM client: {e}")


async def parse_resume_text(
    raw_text: str, custom_llm: Optional[object] = None
) -> ParsedResume:
    """Parse raw resume text into structured ParsedResume using Gemini and LangChain."""
    if not raw_text or not raw_text.strip():
        raise ResumeParsingError("Cannot parse empty resume text.")

    try:
        llm = custom_llm if custom_llm is not None else get_gemini_llm()
        structured_llm = llm.with_structured_output(ParsedResume)

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", SYSTEM_PROMPT),
                ("user", USER_PROMPT),
            ]
        )

        chain = prompt | structured_llm
        result = await chain.ainvoke({"resume_text": raw_text})

        if isinstance(result, ParsedResume):
            return result
        elif isinstance(result, dict):
            return ParsedResume(**result)
        else:
            raise ResumeParsingError(
                f"Unexpected parser output type: {type(result).__name__}"
            )

    except ResumeParsingConfigError:
        raise
    except Exception as e:
        logger.error(f"Gemini resume parsing error: {e}", exc_info=True)
        raise ResumeParsingError(f"AI resume parsing failed: {str(e)}")
