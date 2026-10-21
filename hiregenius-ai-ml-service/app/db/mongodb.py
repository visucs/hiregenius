import logging
from typing import Optional
from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorCollection,
    AsyncIOMotorDatabase,
)
from app.config import settings

logger = logging.getLogger("hiregenius.ai_ml_service.db")


class MongoDBManager:
    """Manages the lifecycle of asynchronous MongoDB connection via Motor."""

    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self.resumes_collection: Optional[AsyncIOMotorCollection] = None
        self.ats_collection: Optional[AsyncIOMotorCollection] = None

    async def connect(self) -> None:
        """Establish asynchronous connection to MongoDB cluster."""
        if not settings.MONGODB_URI:
            logger.warning(
                "[MongoDB] MONGODB_URI is not configured. Skipping MongoDB connection."
            )
            return

        try:
            logger.info("[MongoDB] Connecting to MongoDB cluster...")
            # Set connection and server selection timeouts to fail gracefully if unreachable
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
            )
            self.db = self.client[settings.MONGODB_DB_NAME]
            # Collection reference for candidate resumes (Phase 6 resume parsing storage)
            self.resumes_collection = self.db["resumes"]
            # Collection reference for ATS evaluation results
            self.ats_collection = self.db["ats_results"]

            # Verify connectivity immediately on startup with a lightweight ping
            await self.client.admin.command("ping")
            logger.info(
                f"[MongoDB] Successfully connected to MongoDB database: '{settings.MONGODB_DB_NAME}'"
            )

            # Ensure unique index on resumes.candidate_id to support 1-resume-per-candidate upserts
            try:
                await self.resumes_collection.create_index("candidate_id", unique=True)
                logger.info("[MongoDB] Ensured unique index on 'resumes.candidate_id'.")
            except Exception as idx_err:
                logger.warning(f"[MongoDB] Notice: Could not create unique index on resumes.candidate_id: {idx_err}")

            # Ensure compound unique index on ats_results (candidate_id, job_id)
            try:
                await self.ats_collection.create_index(
                    [("candidate_id", 1), ("job_id", 1)],
                    unique=True,
                )
                logger.info("[MongoDB] Ensured unique compound index on 'ats_results.(candidate_id, job_id)'.")
            except Exception as idx_err:
                logger.warning(f"[MongoDB] Notice: Could not create unique index on ats_results: {idx_err}")

        except Exception as e:
            logger.error(f"[MongoDB] Failed to connect to MongoDB: {e}")
            if settings.ENV == "production":
                raise

    async def close(self) -> None:
        """Gracefully close the active MongoDB connection."""
        if self.client:
            logger.info("[MongoDB] Closing MongoDB connection...")
            self.client.close()
            self.client = None
            self.db = None
            self.resumes_collection = None
            self.ats_collection = None
            logger.info("[MongoDB] MongoDB connection closed cleanly.")

    async def ping(self) -> bool:
        """Perform a lightweight ping to verify database liveness."""
        if not self.client:
            return False
        try:
            await self.client.admin.command("ping")
            return True
        except Exception as e:
            logger.warning(f"[MongoDB] Ping failed: {e}")
            return False


mongo_manager = MongoDBManager()


def get_database() -> Optional[AsyncIOMotorDatabase]:
    """Retrieve active MongoDB database reference."""
    return mongo_manager.db


def get_resumes_collection() -> Optional[AsyncIOMotorCollection]:
    """Retrieve reference to the resumes collection."""
    return mongo_manager.resumes_collection


def get_ats_collection() -> Optional[AsyncIOMotorCollection]:
    """Retrieve reference to the ats_results collection."""
    return mongo_manager.ats_collection
