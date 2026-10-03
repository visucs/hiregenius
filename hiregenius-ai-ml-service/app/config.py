import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for the AI/ML service root
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env if present
env_file_path = BASE_DIR / ".env"
if env_file_path.is_file():
    load_dotenv(dotenv_path=env_file_path)
else:
    load_dotenv()


class Settings:
    """Centralized environment variable configuration for HireGenius AI/ML Service.

    Mirrors the disciplined configuration loading pattern of Core API's env.js.
    """

    ENV: str = os.getenv("ENV", os.getenv("NODE_ENV", "development"))
    PORT: int = int(os.getenv("PORT", "8000"))

    # Future integration placeholders (will be added in Parts B-F):
    # MONGODB_URI: str (Part B: MongoDB Connection)
    # GEMINI_API_KEY: str (Part D: Gemini Resume Agent)


settings = Settings()
