# PRD.md — HireGenius AI

## 1. Project Overview
**HireGenius AI** is an AI-powered recruitment SaaS platform that helps recruiters post jobs, screen resumes automatically using ML, generate AI-driven interview questions, evaluate candidate answers, and rank candidates — all through a multi-agent Generative AI system.

This is a final-year / portfolio project intended to demonstrate full-stack engineering + enterprise backend design + GenAI/Agentic AI + ML integration.

## 2. Problem Statement
Recruiters manually screen hundreds of resumes per job posting, which is slow, inconsistent, and prone to bias. HireGenius AI automates resume screening, candidate ranking, and first-round interviews using AI agents, drastically reducing manual effort while keeping a human-in-the-loop for final decisions.

## 3. Target Users
- **Recruiters / HR teams** at small-to-mid size companies — primary users, post jobs, screen & rank candidates, schedule interviews.
- **Hiring Managers** — review AI-shortlisted candidates and analytics.
- **Candidates** — upload resumes, take AI-generated interviews (optional scope).
- **Admin** — manages API keys, users, and platform settings.

## 4. Core Features (MVP)

### 4.1 Authentication
- Register/Login (email + password), JWT-based auth
- Role-based access: Recruiter, Admin, (Candidate optional)
- Forgot password flow

### 4.2 Job Management
- Create / edit / delete job postings
- Fields: title, company, skills, salary, experience, location, description
- Job status (Open/Closed), view applicants per job

### 4.3 Candidate Management
- Candidate list with search & filter
- View/download resume, candidate details, application status

### 4.4 AI Resume Screening (core differentiator)
- Upload resume (PDF/DOCX) → parsed by AI/ML agent
- Output: resume score (%), skills match (%), missing skills, recommendation (Highly Recommended / Consider / Not a Fit)
- Extracted: experience, education, projects, certifications

### 4.5 AI Interview (core differentiator)
- Recruiter triggers "Generate Interview" for a candidate
- AI generates role-specific interview questions
- Candidate answers (text or recorded audio, MVP: text)
- AI evaluation agent scores: communication, confidence, technical score, final recommendation

### 4.6 Candidate Ranking
- Given a job description, AI ranks all applicants using RAG over resume data
- Returns top-N candidates with reasoning

### 4.7 Interview Scheduler
- Calendar-based scheduling, candidate selection, date/time, meeting link

### 4.8 Analytics Dashboard
- Hiring trend, candidates per job, resume score distribution, interview success rate, skill distribution, monthly hiring chart

### 4.9 Notifications
- Resume uploaded, interview scheduled, candidate selected, AI analysis complete

### 4.10 Profile & Settings
- Profile info, change password, theme (dark/light), notification prefs, admin-only API key management

## 5. Out of Scope (for MVP)
- Payment/billing system
- Native mobile app
- Video-based AI interview analysis (audio/video sentiment) — future phase
- Multi-tenant white-labeling

## 6. Success Criteria
- End-to-end flow works: post job → candidate applies → resume auto-scored → recruiter shortlists → AI interview → ranking → hire decision
- Resume screening returns a score + explanation in under ~10s per resume
- Clean, demo-able UI suitable for placement interviews / portfolio

## 7. Non-Functional Requirements
- Secure JWT auth, hashed passwords, role-based route guards
- Responsive UI (desktop, tablet, mobile)
- API responses < 2s for CRUD, async/streamed for AI calls where possible
- Dockerized services for easy local + cloud deployment

-