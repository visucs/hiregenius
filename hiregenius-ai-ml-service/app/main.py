from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from app.config import settings
from app.db.mongodb import mongo_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await mongo_manager.connect()
    yield
    # Shutdown: Close MongoDB connection cleanly
    await mongo_manager.close()


app = FastAPI(
    title="HireGenius AI/ML Service",
    description="AI and Machine Learning microservice for HireGenius platform.",
    version="1.0.0",
    lifespan=lifespan,
)


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
