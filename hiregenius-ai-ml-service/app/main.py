from fastapi import FastAPI
from app.config import settings

app = FastAPI(
    title="HireGenius AI/ML Service",
    description="AI and Machine Learning microservice for HireGenius platform.",
    version="1.0.0",
)


@app.get("/health")
def health():
    return {
        "service": "ai-ml-service",
        "status": "UP",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
