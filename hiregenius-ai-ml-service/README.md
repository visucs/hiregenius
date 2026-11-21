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
- [x] **Phase 6 Part E**: Save Parsed Resume to MongoDB (`save_parsed_resume`, `get_parsed_resume_by_candidate_id`, upsert-by-candidate_id).
- [x] **Phase 6 Part F**: Core API integration & Frontend rewiring (candidate dashboard, applicant detail modal, resume score display).
- [x] **Phase 7 - AI Interview Module**:
  - **Part 1 (AI Service)**: Structured question generator & answer evaluation with PII scrubbing, forbidden topic filtering, prompt injection boundary (`<candidate_answer_data>`), and evaluation caching.
  - **Part 2 (Core API)**: Session lifecycle, Knex migrations (`ai_interviews`, `ai_interview_questions`, `ai_interview_answers`, `ai_interview_evaluations`), server-authoritative countdown timer, autosave character limits, 180-day retention cleanup job (`AI_INTERVIEW_RETENTION_DAYS`), and feedback release controls.
  - **Part 3 (Frontend)**: Candidate AI Interview Room with mandatory Consent Notice modal (Addendum 1), real-time autosave indicator, Addendum 3 language guidance, and Recruiter Assessment Hub with question editor and evaluation scorecard drawer.
- [x] **Phase 8 - Candidate Ranking (RAG)**:
  - **Part 1 (AI Service)**:
    - PII & Demographic Stripping: Strict regex and normalizers removing names, emails, phones, URLs, DOB, gender, pronouns, marital status, and neutralizing university/company prestige. Tested for 100% fairness swap invariance.
    - Chunking: Semantic typed chunking of parsed resumes (`summary`, `experience`, `project`, `skills`, `education`) with deterministic chunk IDs.
    - Vector Indexing & Embeddings: Hosted Gemini embedding API (`gemini-embedding-001`, 768 dimensions), batched document embedding, query embedding cache keyed by `hash(query + model + dim)`. Endpoints: `POST /api/rag/index`, `DELETE /api/rag/index/{candidate_id}`, `GET /api/rag/index/status/{candidate_id}`, `POST /api/rag/index/backfill`.
    - Privacy-Isolated Vector Search: Scopes all vector queries strictly to `$in: applicant_candidate_ids` of the recruiter's specific job. Non-applicants never appear.
    - Multi-Factor Composite Ranking: Combines semantic score (40%), skills coverage (35%), experience fit (15%), and education fit (10%) with deterministic tie-breaking. Marked `UNTUNED` advisory.
    - Grounded Explainer: Top N candidates receive schema-validated Gemini explanations with mandatory chunk citations (`[chunk_id]`). Unsupported claims omitted. Fallback mode activates if vector store or Gemini is unavailable (`semantic_unavailable=true`).
  - **Part 2 (Core API)**:
    - Knex migrations creating `job_rankings` and `job_ranking_items` tables with cascade deletion and indexing.
    - Atomic transaction snapshot generation; no partial rankings ever stored.
    - Recruiter ownership enforcement (403 for other recruiters), Candidate 403 block.
    - In-memory sliding window rate limiter (`rankingRateLimiter`, 10 runs/10 min).
    - Staleness detection: flags snapshot as stale if new applications or resume updates arrived since creation.
    - Endpoints: `POST /api/jobs/:jobId/ranking`, `GET /api/jobs/:jobId/ranking`, `GET /api/jobs/:jobId/ranking/history`.
  - **Part 3 (Frontend)**:
    - Recruiter Candidate Ranking page (`/recruiter/ranking`): interactive job selector, stack-ranked cards (#1 Gold, #2 Silver, #3 Bronze), multi-factor breakdown dials, matched/missing skill chips, grounded AI reasoning accordion with chunk citations.
    - Shortlist/Reject quick action buttons with live status mutation.
    - Staleness banner with one-click re-rank button.
    - Dedicated "Not Rankable Applicants" accordion with diagnostic failure reasons.
    - Mandatory uncalibrated advisory banner and semantic-unavailable notices.
- [ ] **Phase 9**: Live Video / Proctoring (Future).

---

## 7. Phase 8: Candidate Ranking (RAG) Details & Policies

### 7.1. Honesty & Fairness Rules
1. **Advisory Only**: No ground-truth ranking exists; ranking weights (semantic 0.40, skills 0.35, experience 0.15, education 0.10) are configuration and marked `UNTUNED`. Ranking is advisory and never auto-rejects candidates.
2. **Grounded Explanations**: Explanations cite only provided resume chunks with chunk IDs. Unsupported claims are omitted.
3. **PII & Prestige Invariance**: Names, contact info, pronouns, and university/company prestige are stripped prior to embedding or evaluation. Swapping names or gender-coded terms produces 100% identical chunk texts and ranking scores.
4. **Recruiter Privacy & Applicant Set Isolation**: Recruiters rank ONLY the applicants of their own jobs. Vector search strictly scopes to the applicant candidate ID set. Candidate-to-candidate global searches are prohibited.
5. **Fallback Resilience**: If Gemini or the vector store is unavailable, the engine gracefully falls back to deterministic ATS keyword scoring with `semantic_unavailable=true`. Applicants with unparseable or scanned resumes are returned in a dedicated "Not Rankable" list with explicit reasons.

---

## 7. Phase 7: AI Interview Module Details & Policies

### 7.1. Addendums Implemented
1. **Consent Notice Gate (Addendum 1)**: Candidates must explicitly acknowledge the AI evaluation consent modal before the session opens; `acknowledged_at` timestamp is persisted to the database.
2. **Data Retention & Purge (Addendum 2)**: Configurable retention period via `AI_INTERVIEW_RETENTION_DAYS` (default: 180 days). Answers and evaluations older than the retention window are automatically purged via a 24-hour background cleanup job and cascaded upon candidate account deletion.
3. **Language Neutrality (Addendum 3)**: Answers submitted in English, Hindi, or Hinglish are evaluated purely on technical substance and clarity without penalizing communication scores.

### 7.2. Core Honesty & Governance Rules
- AI evaluations are strictly **advisory**; recruiters make final hiring and status decisions.
- Candidate "Confidence" is derived solely from textual indicators (hedging, specificity, completeness) and labeled as **indicative**.
- "Communication" represents clarity and structure rather than grammatical perfection.

