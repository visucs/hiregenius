# HireGenius AI/ML Service (`hiregenius-ai-ml-service`)

Microservice responsible for Generative AI agents, resume parsing, candidate scoring, and machine learning workflows for the HireGenius recruitment platform.

---

## 1. Tech Stack (Approved in Architecture.md & Rules.md)

- **Framework**: FastAPI (Python 3.11+)
- **Server**: Uvicorn ASGI
- **Database Driver**: `motor` (async MongoDB driver) & `pymongo`
- **Validation & Settings**: Pydantic v2, Python-dotenv
- **Containerization**: Docker (multi-stage, non-root user `appuser`)
- **Future Additions (Parts C–D)**:
  - LangChain / LangGraph for multi-agent orchestration
  - Google Gemini API (`google-generativeai`) for LLM parsing & evaluation

---

## 2. Project Structure

```
hiregenius-ai-ml-service/
├── app/
│   ├── __init__.py              # Application package marker
│   ├── main.py                  # FastAPI app entrypoint with async lifespan & /health
│   ├── config.py                # Centralized env var loading & validation (mirrors Core API's env.js)
│   ├── api/
│   │   └── __init__.py          # API route modules (for subsequent parts)
│   ├── db/
│   │   ├── __init__.py          # Database package marker
│   │   └── mongodb.py           # Async Motor client, lifespan hooks & resumes collection
│   ├── services/
│   │   └── __init__.py          # Business logic services (for subsequent parts)
│   └── models/
│       └── __init__.py          # Pydantic schemas (for subsequent parts)
├── requirements.txt             # fastapi, uvicorn, python-dotenv, pydantic, pymongo, motor
├── .env.example                 # Example environment variables (PORT, MONGODB_URI, MONGODB_DB_NAME)
├── .gitignore                   # Ignores venvs, cache, and secrets
├── Dockerfile                   # Multi-stage production container
└── README.md                    # Setup and development documentation
```

---

## 3. Local Development Setup

### 3.1. Prerequisites

- Python 3.11+ installed (`python --version`)
- `pip` package manager installed
- MongoDB instance (MongoDB Atlas cluster or local MongoDB)

### 3.2. Virtual Environment Convention

Always use an isolated Python virtual environment for local development. **Do not commit the virtual environment directory** (covered in `.gitignore`).

#### **Create Virtual Environment**:
```bash
# Navigate to the service folder
cd hiregenius-ai-ml-service

# Create virtual environment named 'venv'
python -m venv venv
```

#### **Activate Virtual Environment**:

- **Windows (PowerShell)**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```

- **Windows (Command Prompt)**:
  ```cmd
  venv\Scripts\activate.bat
  ```

- **macOS / Linux**:
  ```bash
  source venv/bin/activate
  ```

*(To deactivate the environment when finished, simply run `deactivate`)*

### 3.3. Install Dependencies

With the virtual environment activated:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.4. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your configuration values:
```env
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=hiregenius_ai
```

---

## 4. Running the Service

### 4.1. Local Uvicorn Server

Start the development server with live reload:

```bash
uvicorn app.main:app --reload --port 8000
```

Or run directly using python:
```bash
python -m app.main
```

### 4.2. Verify Health Check

Query the database-aware health endpoint:

```bash
curl http://localhost:8000/health
```

- **When MongoDB is connected (HTTP 200 OK)**:
```json
{
  "service": "ai-ml-service",
  "status": "UP",
  "mongodb": "CONNECTED"
}
```

- **When MongoDB is unreachable / disconnected (HTTP 503 Service Unavailable)**:
```json
{
  "service": "ai-ml-service",
  "status": "DOWN",
  "mongodb": "DISCONNECTED"
}
```

Interactive OpenAPI documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 5. Docker Deployment

### 5.1. Build the Docker Image

The Dockerfile uses a multi-stage build on `python:3.11-slim` with a dedicated non-root user (`appuser`):

```bash
docker build -t hiregenius-ai-ml-service:latest .
```

### 5.2. Run the Docker Container

```bash
docker run -d --name hiregenius-ai-ml-service -p 8000:8000 \
  -e MONGODB_URI="<your_mongodb_uri>" \
  -e MONGODB_DB_NAME="hiregenius_ai" \
  hiregenius-ai-ml-service:latest
```

Check health status:
```bash
docker ps
# Status will indicate "(healthy)" once the HEALTHCHECK passes against /health
```

---

## 6. Phase Status & Roadmap

- [x] **Phase 6 Part A**: Project setup & skeleton (`FastAPI`, `PORT=8000`, `GET /health`, multi-stage Dockerfile, CI workflow).
- [x] **Phase 6 Part B (Current)**: MongoDB connection & repository setup (`motor` async driver, lifespan startup/shutdown, `resumes` collection reference, DB-aware `/health` with 503 fallback).
- [ ] **Phase 6 Part C (Pending)**: Resume text extraction (PDF / DOCX processing).
- [ ] **Phase 6 Part D (Pending)**: Resume Parsing Agent (Google Gemini structured extraction).
- [ ] **Future / Tentative**: Core API integration & scoring workflows.
