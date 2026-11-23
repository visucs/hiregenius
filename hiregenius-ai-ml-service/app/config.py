import logging
import os
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger("hiregenius.ai_ml_service.config")

# Base directory for the AI/ML service root
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from service .env, fallback to repository root .env
service_env_path = BASE_DIR / ".env"
root_env_path = BASE_DIR.parent / ".env"

if service_env_path.is_file():
    load_dotenv(dotenv_path=service_env_path)
elif root_env_path.is_file():
    load_dotenv(dotenv_path=root_env_path)
else:
    load_dotenv()


class Settings:
    """Centralized environment variable configuration for HireGenius AI/ML Service.

    Mirrors the disciplined configuration loading and validation pattern of Core API's env.js.
    """

    ENV: str = os.getenv("ENV", os.getenv("NODE_ENV", "development"))
    PORT: int = int(os.getenv("PORT", "8000"))

    # MongoDB Configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "hiregenius_ai")

    # Google Gemini Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    # Internal Service-to-Service Authentication
    AI_ML_SERVICE_INTERNAL_KEY: str = os.getenv(
        "AI_ML_SERVICE_INTERNAL_KEY", "hg_internal_dev_secret_key_2026"
    )

    # Dedicated Internal Secret for Admin AI Configuration Management
    AI_CONFIG_INTERNAL_KEY: str = os.getenv(
        "AI_CONFIG_INTERNAL_KEY", "hg_ai_config_dev_secret_2026"
    )

    # Master Key for At-Rest AES-256-GCM Credential Encryption (32 bytes base64-encoded)
    AI_CONFIG_MASTER_KEY: str = os.getenv("AI_CONFIG_MASTER_KEY", "")

    # Config Cache TTL and Signature Tolerance
    AI_CONFIG_CACHE_TTL_SECONDS: int = int(os.getenv("AI_CONFIG_CACHE_TTL_SECONDS", "30"))
    AI_CONFIG_SIGNATURE_MAX_SKEW_SECONDS: int = int(
        os.getenv("AI_CONFIG_SIGNATURE_MAX_SKEW_SECONDS", "60")
    )

    # ── ATS Scoring Configuration (v2 Heuristic Engine) ──────────────────────────
    # NOTE: There is no universal ATS algorithm. These weights are UNTUNED heuristic
    # estimates designed for diagnostic feedback, not a supervised machine learning model.
    SCORING_VERSION: str = "ats-v2-untuned"
    CAPPED_SCORE_UNREADABLE: float = 10.0
    ATS_DISCLAIMER: str = (
        "This score is a transparent heuristic estimate based on structural formatting and "
        "keyword alignment. Real applicant tracking systems vary widely, and scores should be "
        "used as guidance rather than an absolute evaluation."
    )

    # General Mode Weights (Total: 100 points) - UNTUNED
    ATS_WEIGHTS_GENERAL: dict = {
        "parsability": 25.0,
        "sections": 20.0,
        "contact": 10.0,
        "skills": 15.0,
        "content": 20.0,
        "length": 10.0,
    }

    # Job-Specific Mode Weights (Total: 100 points) - UNTUNED
    ATS_WEIGHTS_JOB: dict = {
        "keywords": 45.0,
        "title": 10.0,
        "experience": 15.0,
        "education": 10.0,
        "parsability": 20.0,
    }

    # ── AI Interview Module Configuration (Phase 7) ─────────────────────────────
    # NOTE: AI output is strictly advisory. Weights and thresholds are UNTUNED heuristic
    # estimates designed for recruiter diagnostic assistance, not autonomous hiring.
    INTERVIEW_RUBRIC_VERSION: str = "rubric-v1-untuned"
    INTERVIEW_WEIGHTS: dict = {
        "technical": 0.65,
        "communication": 0.35,
    }
    INTERVIEW_THRESHOLDS: dict = {
        "proceed": 75.0,
        "consider": 50.0,
    }
    INTERVIEW_MIN_ANSWER_CHARS: int = 15
    INTERVIEW_DISCLAIMER: str = (
        "AI output is advisory; the recruiter makes the final decision. "
        "Confidence is indicative and derived solely from textual signals."
    )

    # ── Candidate Ranking (RAG) Configuration (Phase 8) ─────────────────────────
    # NOTE: There is no ground-truth candidate ranking algorithm. Weights are UNTUNED
    # heuristic estimates. Ranking is strictly advisory and NEVER auto-rejects candidates.
    GEMINI_EMBEDDING_MODEL: str = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
    GEMINI_EMBEDDING_DIMENSION: int = int(os.getenv("GEMINI_EMBEDDING_DIMENSION", "768"))
    RAG_SCORING_VERSION: str = "rag-ranking-v1-untuned"
    RAG_WEIGHTS: dict = {
        "semantic": 0.40,
        "skills": 0.35,
        "experience": 0.15,
        "education": 0.10,
    }
    RAG_FALLBACK_WEIGHTS: dict = {
        "skills": 0.60,
        "experience": 0.25,
        "education": 0.15,
    }
    RAG_TOP_N_EXPLANATIONS: int = int(os.getenv("RAG_TOP_N_EXPLANATIONS", "10"))
    RAG_DISCLAIMER: str = (
        "Candidate ranking is an AI-assisted heuristic evaluation designed for advisory guidance. "
        "No ground-truth ranking exists; weights are untuned estimates. This system never auto-rejects candidates."
    )

    KNOWN_INSECURE_INTERNAL_KEYS = {
        "hg_internal_dev_secret_key_2026",
        "dev_secret_key",
        "secret",
        "changeme",
        "123456",
    }
    KNOWN_INSECURE_CONFIG_KEYS = {
        "hg_ai_config_dev_secret_2026",
        "dev_config_secret",
        "secret",
        "changeme",
    }

    def validate(self) -> None:
        """Validate critical configuration variables based on active environment (Fail-Closed)."""
        is_explicit_non_prod = (self.ENV or "").strip().lower() in {
            "development",
            "test",
            "testing",
            "dev",
        }
        if not is_explicit_non_prod:
            missing = []
            if not self.MONGODB_URI:
                missing.append("MONGODB_URI")
            if not self.MONGODB_DB_NAME:
                missing.append("MONGODB_DB_NAME")
            if not self.GEMINI_API_KEY:
                missing.append("GEMINI_API_KEY")
            if not self.AI_ML_SERVICE_INTERNAL_KEY:
                missing.append("AI_ML_SERVICE_INTERNAL_KEY")
            if missing:
                raise RuntimeError(
                    f"FATAL: Missing required environment variables in production: {', '.join(missing)}"
                )

            # Security Hardening: Reject any known development default internal key in production
            if self.AI_ML_SERVICE_INTERNAL_KEY.strip() in self.KNOWN_INSECURE_INTERNAL_KEYS:
                raise RuntimeError(
                    "FATAL: In production, AI_ML_SERVICE_INTERNAL_KEY cannot use any known dev default. "
                    "A secure, randomly generated internal key must be provided."
                )

            if self.AI_CONFIG_INTERNAL_KEY.strip() in self.KNOWN_INSECURE_CONFIG_KEYS:
                raise RuntimeError(
                    "FATAL: In production, AI_CONFIG_INTERNAL_KEY cannot use any known dev default. "
                    "A dedicated secure random key must be provided."
                )

        else:
            if not self.MONGODB_URI:
                logger.warning(
                    "[Config] WARNING: MONGODB_URI is not set. MongoDB connectivity will be unavailable "
                    "or run in disconnected mode. Set MONGODB_URI in your .env file or environment."
                )
            if not self.GEMINI_API_KEY:
                logger.warning(
                    "[Config] WARNING: GEMINI_API_KEY is not set. Resume AI parsing will be unavailable "
                    "unless mocked. Set GEMINI_API_KEY in your .env file or environment."
                )


settings = Settings()
settings.validate()
