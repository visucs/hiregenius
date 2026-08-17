# Phases.md — HireGenius AI Build Plan

Build in order. Do not start a phase until the previous one is working end-to-end. Update `Memory.md` at the end of every phase.

## Phase 0 — Project Setup
- Init React (Vite) project, Tailwind, ESLint/Prettier, folder structure per `Architecture.md`
- Init Spring Boot project (Web, Security, JPA, MySQL driver, Validation), folder structure
- Init MySQL DB + connection
- Init GitHub repo, `.gitignore`, `.env.example` for all services
- **Done when:** React "Hello World" and Spring Boot "/health" both run locally

## Phase 1 — Authentication
- Backend: User entity, register/login/forgot-password endpoints, JWT issue + validation, Spring Security config, role-based guards (RECRUITER, ADMIN)
- Frontend: Login, Register, Forgot Password pages; auth context/redux slice; protected route wrapper; token storage + Axios interceptor for `Authorization` header
- **Done when:** Can register, log in, receive JWT, access a protected route, and get 401 when unauthenticated

## Phase 2 — Core Dashboard Shell
- Frontend: Sidebar, Navbar, Dashboard layout, Landing page
- Backend: dashboard summary endpoint (counts: jobs, candidates, pending interviews) — can return zeros/mock initially
- **Done when:** Authenticated user sees dashboard shell with real nav between pages

## Phase 3 — Job Management
- Backend: Job entity + CRUD endpoints + search/filter, ownership by recruiter
- Frontend: Jobs list, create/edit job form (React Hook Form + Zod), job detail/applicants view
- **Done when:** Recruiter can create, edit, delete, and list jobs; data persists in MySQL

## Phase 4 — Candidate Management
- Backend: Candidate + Application entities, resume file upload endpoint (store file, save path), list/search/filter candidates
- Frontend: Candidate list, candidate detail page, resume view/download, apply-to-job flow (or admin-added candidates for MVP)
- **Done when:** Resume files upload successfully and candidate records are queryable

## Phase 5 — AI Service Foundation
- Stand up FastAPI AI Service (skeleton), FastAPI ML Service (skeleton)
- Spring Boot `AIClient` / `MLClient` REST clients wired up
- MongoDB connected (Spring Boot + AI Service), `resume_json` collection
- **Done when:** Spring Boot can successfully call a "ping" endpoint on both FastAPI services

## Phase 6 — AI Resume Screening
- AI Service: Resume Parser Agent (extract skills/education/experience/projects/certs from PDF/DOCX text)
- ML Service: scoring model (skill match %, overall score, missing skills)
- Backend: orchestrate upload → parse → score → save summary to MySQL, full JSON to MongoDB
- Frontend: Resume Screening page — upload, loading state, results view (score, skills match, missing skills, recommendation)
- **Done when:** Uploading a real resume against a real job returns a genuine score + explanation

## Phase 7 — AI Interview
- AI Service: Interview Agent (generate questions from job + resume context), Evaluation Agent (score answers)
- Backend: endpoints to generate interview, submit answers, get results
- Frontend: AI Interview page — start interview, display questions, submit answers (text for MVP), results view (communication/confidence/technical/recommendation)
- **Done when:** Recruiter can generate an interview for a candidate and get an AI-scored result

## Phase 8 — Candidate Ranking (RAG)
- Set up vector store (ChromaDB/Qdrant/Pinecone) with resume embeddings
- AI Service: Ranking Agent using RAG over candidate pool for a given job
- Backend: "Rank candidates for this job" endpoint
- Frontend: ranked candidate list with reasoning, on Job or Candidates page
- **Done when:** Given a job, the system returns a ranked, explained candidate shortlist

## Phase 9 — Interview Scheduler & Notifications
- Backend: Interview scheduling entity/endpoints, notification triggers (resume uploaded, interview scheduled, candidate selected, AI analysis complete)
- Frontend: Scheduler UI (calendar, candidate select, date/time, meeting link), notification bell/list
- **Done when:** Scheduling an interview creates a record and triggers a notification

## Phase 10 — Analytics Dashboard
- Backend: analytics aggregation endpoints (hiring trend, candidates/job, resume score distribution, interview success, skill distribution, monthly hiring)
- Frontend: Analytics page with Recharts (line/bar/pie as appropriate)
- **Done when:** Charts render real data from MySQL/MongoDB, not mocks

## Phase 11 — Profile, Settings & Polish
- Profile page (photo, name, email, company, role, change password)
- Settings (theme dark/light, notifications, admin-only AI provider/API keys)
- Global search (jobs/candidates/interviews)
- Empty states, loaders, toasts, pagination polish across all pages
- Full responsive pass (desktop/tablet/mobile)

## Phase 12 — Testing, Dockerization, Deployment
- Backend unit/integration tests (Spring Boot), API tests for FastAPI services
- Dockerfile per service + `docker-compose.yml` (React, Spring Boot, MySQL, MongoDB, AI Service, ML Service)
- Deploy (e.g., frontend on Vercel, backend/services on Render/Railway/EC2, or full Docker Compose on a VM)
- Final QA pass against `PRD.md` feature list

-