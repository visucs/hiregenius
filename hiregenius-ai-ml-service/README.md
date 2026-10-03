# HireGenius AI/ML Service (`hiregenius-ai-ml-service`)

Microservice responsible for Generative AI agents, resume parsing, candidate scoring, and machine learning workflows for the HireGenius recruitment platform.

---

## 1. Tech Stack (Approved in Architecture.md & Rules.md)

- **Framework**: FastAPI (Python 3.11+)
- **Server**: Uvicorn ASGI
- **AI / LLM Integration**: LangChain (`langchain`, `langchain-google-genai`) & Google Gemini API (`google-generativeai`)
- **Document Extractors**: `pypdf` (PDF text extraction), `python-docx` (Word DOCX extraction), `python-multipart`
- **Database Driver**: `motor` (async MongoDB driver) & `pymongo`
- **Validation & Settings**: Pydantic v2, Python-dotenv
- **Containerization**: Docker (multi-stage, non-root user `appuser`)

---

## 2. Project Structure

```
hiregenius-ai-ml-service/
├── app/
│   ├── __init__.py              # Application package marker
│   ├── main.py                  # FastAPI app entrypoint with async lifespan & /health
│   ├── config.py                # Centralized env var loading & validation (mirrors Core API's env.js)
│   ├── api/
│   │   ├── __init__.py          # API route modules
│   │   └── resume.py            # POST /extract-text and POST /parse endpoints
│   ├── db/
│   │   ├── __init__.py          # Database package marker
│   │   └── mongodb.py           # Async Motor client, lifespan hooks & resumes collection
│   ├── services/
│   │   ├── __init__.py          # Business logic services
│   │   ├── text_extraction.py   # PDF and DOCX parsing & extraction dispatcher
│   │   ├── resume_agent.py      # LangChain + Gemini structured resume parsing agent
│   │   └── resume_repository.py # MongoDB persistence & upsert operations for candidate resumes
│   └── models/
│       ├── __init__.py          # Pydantic schemas
│       └── resume.py            # ParsedResume, ParsedResumeResponse, SavedResumeResponse
├── test/
│   ├── __init__.py              # Test suite package
│   ├── test_text_extraction.py  # 14 unit and endpoint integration tests
│   ├── test_resume_agent.py     # 9 unit and mock LLM integration tests
│   ├── test_resume_repository.py# 9 unit and repository persistence tests
│   └── fixtures/                # Sample resumes (.pdf, .docx, corrupted, etc.)
├── requirements.txt             # Core dependencies including langchain & gemini
├── .env.example                 # Example environment variables (PORT, MONGODB_URI, GEMINI_API_KEY)
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
- Google Gemini API Key (obtain from [Google AI Studio](https://aistudio.google.com/))

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
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.p0wadbv.mongodb.net
MONGODB_DB_NAME=hiregenius_ai
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

---

## 4. Running the Service & Testing

### 4.1. Local Uvicorn Server

Start the development server with live reload:

```bash
uvicorn app.main:app --reload --port 8000
```

### 4.2. Verify Health Check

Query the database-aware health endpoint:

```bash
curl http://localhost:8000/health
```

Expected response (when MongoDB is connected):
```json
{
  "service": "ai-ml-service",
  "status": "UP",
  "mongodb": "CONNECTED"
}
```

### 4.3. Resume Text Extraction (`POST /api/resume/extract-text`)

Upload a PDF or DOCX file (up to 5MB):

```bash
curl -X POST "http://localhost:8000/api/resume/extract-text" \
  -F "file=@/path/to/resume.pdf"
```

Expected response (HTTP 200 OK):
```json
{
  "filename": "resume.pdf",
  "extracted_text": "Candidate text content...",
  "character_count": 1245
}
```

### 4.4. AI Resume Parsing & Persistence (`POST /api/resume/parse`)

Extracts text, applies LangChain + Google Gemini to return structured candidate data, and upserts the record into MongoDB (`resumes` collection):

```bash
curl -X POST "http://localhost:8000/api/resume/parse" \
  -F "candidate_id=cand_test_001" \
  -F "file=@/path/to/resume.pdf"
```

Expected response (HTTP 200 OK):
```json
{
  "id": "6ac09ca8e0ddafc19265a7d1",
  "_id": "6ac09ca8e0ddafc19265a7d1",
  "candidate_id": "cand_test_001",
  "original_filename": "resume.pdf",
  "parsed_data": {
    "full_name": "David Kumar",
    "email": "david.kumar@hiregenius.ai",
    "phone": "+1 415 555 2671",
    "skills": ["Python", "Go", "FastAPI", "MongoDB Atlas", "Docker"],
    "education": [],
    "experience": [
      {
        "title": "Lead Backend Engineer",
        "company": "TechCorp AI",
        "duration": "2022 - Present",
        "description": "Designed distributed AI orchestration pipelines with Python and FastAPI."
      }
    ],
    "certifications": [],
    "projects": []
  },
  "parsed_at": "2026-10-03T06:11:51.960297Z",
  "model_version": "gemini-3.8-flash"
}
```

Validation & Error Handling:
- **Scanned/Image-only PDF (<50 chars text)**: Returns **HTTP 422 Unprocessable Content** explaining that OCR is required.
- **Missing or empty candidate_id**: Returns **HTTP 400 Bad Request**.
- **Unsupported extension**: Returns **HTTP 400 Bad Request**.
- **Oversized file (>5MB)**: Returns **HTTP 400 Bad Request**.
- **Corrupted file**: Returns **HTTP 422 Unprocessable Content**.

### 4.5. Retrieve Parsed Resume (`GET /api/resume/{candidate_id}`)

Retrieves previously persisted resume data for a specific candidate:

```bash
curl http://localhost:8000/api/resume/cand_test_001
```

Expected response (HTTP 200 OK):
```json
{
  "id": "6ac09ca8e0ddafc19265a7d1",
  "_id": "6ac09ca8e0ddafc19265a7d1",
  "candidate_id": "cand_test_001",
  "original_filename": "resume.pdf",
  "raw_text": "David Kumar - Senior Backend Engineer...",
  "parsed_data": { ... },
  "parsed_at": "2026-10-03T06:11:51.960000",
  "model_version": "gemini-3.8-flash"
}
```

If candidate has no parsed resume, returns **HTTP 404 Not Found**.

### 4.6. Running Automated Tests

Run the test suite via `unittest` (all MongoDB and LLM calls are mocked):

```bash
python -m unittest discover -s test -p "test_*.py" -v
```

---

## 5. Docker Deployment

### 5.1. Build the Docker Image

```bash
docker build -t hiregenius-ai-ml-service:latest .
```

### 5.2. Run the Docker Container

```bash
docker run -d --name hiregenius-ai-ml-service -p 8000:8000 \
  -e MONGODB_URI="<your_mongodb_uri>" \
  -e MONGODB_DB_NAME="hiregenius_ai" \
  -e GEMINI_API_KEY="<your_gemini_api_key>" \
  hiregenius-ai-ml-service:latest
```

---

## 6. Phase Status & Roadmap

- [x] **Phase 6 Part A**: Project setup & skeleton (`FastAPI`, `PORT=8000`, `GET /health`, multi-stage Dockerfile, CI workflow).
- [x] **Phase 6 Part B**: MongoDB connection & repository setup (`motor` async driver, lifespan startup/shutdown, `resumes` collection reference, live Atlas connectivity).
- [x] **Phase 6 Part C**: Resume text extraction (PDF / DOCX processing via `pypdf` & `python-docx`, 5MB limit, 400/422 validation, automated test suite).
- [x] **Phase 6 Part D**: Resume Parsing Agent (LangChain + Google Gemini structured output, anti-hallucination prompt, OCR quality gate, mocked test suite).
- [x] **Phase 6 Part E (Current)**: Save Parsed Resume to MongoDB (`save_parsed_resume`, `get_parsed_resume_by_candidate_id`, upsert-by-candidate_id, 32 automated tests).
- [ ] **Phase 6 Part F (Next)**: Core API integration (wiring Core API resume upload to call AI-ML service).

