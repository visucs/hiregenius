# HireGenius AI/ML Service (`hiregenius-ai-ml-service`)

Microservice responsible for Generative AI agents, resume parsing, candidate scoring, and machine learning workflows for the HireGenius recruitment platform.

---

## 1. Tech Stack (Approved in Architecture.md & Rules.md)

- **Framework**: FastAPI (Python 3.11+)
- **Server**: Uvicorn ASGI
- **Validation & Settings**: Pydantic v2, Python-dotenv
- **Containerization**: Docker (multi-stage, non-root user `appuser`)
- **Future Additions (Parts B–F)**:
  - MongoDB (`motor` / `pymongo`) for agent logs, JSON resume storage, and memory
  - LangChain / LangGraph for multi-agent orchestration
  - Google Gemini API (`google-generativeai`) for LLM parsing & evaluation

---

## 2. Project Structure

```
hiregenius-ai-ml-service/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app entrypoint (/health endpoint)
│   ├── config.py                # Centralized env var loading (mirrors Core API's env.js)
│   ├── api/
│   │   └── __init__.py          # API route modules (added in subsequent parts)
│   ├── services/
│   │   └── __init__.py          # Business logic services (added in subsequent parts)
│   └── models/
│       └── __init__.py          # Pydantic schemas (added in subsequent parts)
├── requirements.txt             # Core dependencies (fastapi, uvicorn, python-dotenv, pydantic)
├── .env.example                 # Example environment variables
├── .gitignore                   # Ignores venvs, cache, and secrets
├── Dockerfile                   # Multi-stage production container
└── README.md                    # Setup and development documentation
```

---

## 3. Local Development Setup

### 3.1. Prerequisites

- Python 3.11+ installed (`python --version`)
- `pip` package manager installed
- Docker (optional, for containerized execution)

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

With the virtual environment activated, install the minimal Phase 6 Part A dependencies:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.4. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default configuration:
```env
PORT=8000
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

Query the health endpoint:

```bash
curl http://localhost:8000/health
```

Expected JSON response:
```json
{
  "service": "ai-ml-service",
  "status": "UP"
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
docker run -d --name hiregenius-ai-ml-service -p 8000:8000 hiregenius-ai-ml-service:latest
```

Check health status:
```bash
docker ps
# Status will indicate "(healthy)" once the HEALTHCHECK passes
```

---

## 6. Phase Status & Roadmap

- [x] **Phase 6 Part A (Current)**: Project setup & skeleton only (`FastAPI`, `PORT=8000`, `GET /health`, multi-stage Dockerfile, CI workflow).
- [ ] **Phase 6 Part B (Pending)**: MongoDB connection & configuration (`MONGODB_URI`, `resume_json` collection).
- [ ] **Phase 6 Part C (Pending)**: Resume text extraction (PDF / DOCX processing).
- [ ] **Phase 6 Part D (Pending)**: Resume Parsing Agent (Google Gemini structured extraction).
- [ ] **Phase 6 Part E (Pending)**: ML Resume Scoring & skill matching logic.
- [ ] **Phase 6 Part F (Pending)**: Core API & Spring Boot orchestration integration.
