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

    # Future integration placeholders (will be added in subsequent parts):
    # GEMINI_API_KEY: str (Part D: Gemini Resume Agent)

    def validate(self) -> None:
        """Validate critical configuration variables based on active environment."""
        if self.ENV == "production":
            missing = []
            if not self.MONGODB_URI:
                missing.append("MONGODB_URI")
            if not self.MONGODB_DB_NAME:
                missing.append("MONGODB_DB_NAME")
            if missing:
                raise RuntimeError(
                    f"FATAL: Missing required MongoDB environment variables in production: {', '.join(missing)}"
                )
        else:
            if not self.MONGODB_URI:
                logger.warning(
                    "[Config] WARNING: MONGODB_URI is not set. MongoDB connectivity will be unavailable "
                    "or run in disconnected mode. Set MONGODB_URI in your .env file or environment."
                )


settings = Settings()
settings.validate()
