import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.config import settings
from app.db.mongodb import mongo_manager
from app.api.resume import router as resume_router
from app.api.ats import router as ats_router
from app.api.interview import router as interview_router
from app.api.rag import router as rag_router
from app.api.admin_config import router as admin_config_router
from app.api.redaction import LoggingRedactorFilter, sanitized_validation_exception_handler
from app.ai_config.repository import config_repository

# Attach global credential redaction filter to root logger
root_logger = logging.getLogger()
redactor = LoggingRedactorFilter()
root_logger.addFilter(redactor)
for handler in root_logger.handlers:
    handler.addFilter(redactor)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await mongo_manager.connect()
    # Seed active configuration baseline if MongoDB is available
    try:
        await config_repository.ensure_seeded_from_current_behavior()
    except Exception as e:
        logging.getLogger("hiregenius.main").warning(f"Could not auto-seed baseline configuration: {e}")
    yield
    # Shutdown: Close MongoDB connection cleanly
    await mongo_manager.close()


app = FastAPI(
    title="HireGenius AI/ML Service",
    description="AI and Machine Learning microservice for HireGenius platform.",
    version="1.0.0",
    lifespan=lifespan,
)

# Exception handlers for secret sanitization
app.add_exception_handler(RequestValidationError, sanitized_validation_exception_handler)

# Register route modules
app.include_router(resume_router)
app.include_router(ats_router)
app.include_router(interview_router)
app.include_router(rag_router)
app.include_router(admin_config_router)


@app.get("/health")
async def health():
    is_mongo_connected = await mongo_manager.ping()
    if is_mongo_connected:
        return {
            "service": "ai-ml-service",
            "status": "UP",
            "mongodb": "CONNECTED",
        }
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "service": "ai-ml-service",
                "status": "DOWN",
                "mongodb": "DISCONNECTED",
            },
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
