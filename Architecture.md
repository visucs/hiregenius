# Architecture.md — HireGenius AI

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite) + Tailwind CSS + React Router + Redux Toolkit/Context + React Hook Form + Zod + Recharts + Framer Motion + Axios |
| API Gateway / Orchestrator | Spring Boot + Spring Security + JWT |
| Relational DB | MySQL (JPA/Hibernate) — users, jobs, candidates, applications, interviews, analytics |
| Document DB | MongoDB — resume JSON, parsed data, chat/agent memory, interview transcripts, AI reports |
| AI Service | FastAPI + LangChain + LangGraph + Gemini/OpenAI/Claude |
| ML Service | FastAPI + Python (scikit-learn / PyTorch / Transformers) — resume scoring, skill matching, ranking |
| RAG / Vector Store | ChromaDB / Qdrant / Pinecone (optional but recommended) |
| Deployment | Docker + Docker Compose |
| Version Control | GitHub |

**Golden rule:** React, MySQL, MongoDB, AI Service and ML Service NEVER talk to each other directly. Everything flows through Spring Boot, the central orchestrator.

## 2. High-Level Architecture

```
                              React + Tailwind
                                     |
                          Axios + JWT Authentication
                                     |
                                     v
                   Spring Boot (Central Orchestrator)
           Spring Security - Business Logic - REST APIs
                                     |
      +--------------+--------------+--------------+--------------+
      v              v              v              v
    MySQL         MongoDB      AI Service      ML Service
(Relational)   (Documents)    (FastAPI)       (FastAPI)
      |              |              |              |
 Users         Resume JSON      Gemini API     Resume ML
 Jobs          Chat History     LangChain      Skill Match
 Interviews    Vector Metadata  LangGraph      Ranking
 Analytics     Agent Memory     RAG            Prediction
```

## 3. Agentic AI Layer

```
                    Supervisor Agent
                           |
      +----------+----------+-----------+----------+
      v          v          v           v
 Resume Agent  JD Agent  Interview   Ranking Agent
                         Agent
      |          |          |           |
      +----------+----------+-----------+
                   Shared Memory
                     MongoDB
```

- **Resume Agent** — parses resume, extracts skills/education/experience/projects/certs
- **JD Agent** — generates/refines job descriptions
- **Interview Agent** — generates role-specific questions, evaluates answers
- **Ranking Agent** — RAG over candidate pool, returns top-N with reasoning
- All agents share memory/context via MongoDB (agent logs, conversation state)

## 4. Frontend Folder Structure

```
hiregenius-frontend/
├── public/
├── src/
│   ├── assets/{images,icons,logo}/
│   ├── components/{Navbar,Sidebar,Footer,Button,Cards,Loader,Modal,SearchBar,Pagination,Toast,Charts}/
│   ├── pages/{Landing,Login,Register,ForgotPassword,Dashboard,Jobs,Candidates,ResumeScreening,AIInterview,InterviewSchedule,Analytics,Profile,Settings,NotFound}/
│   ├── services/       # axios API clients
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   ├── routes/
│   └── App.jsx
```

## 5. Backend Folder Structure (Spring Boot)

```
hiregenius-backend/
├── config/
├── security/            # JWT filters, Spring Security config
├── controller/
├── service/
├── repository/          # JPA repos (MySQL) + Mongo repos
├── entity/
├── dto/
├── mapper/
├── exception/
├── util/
├── client/
│   ├── AIClient.java     # calls AI Service (FastAPI)
│   └── MLClient.java     # calls ML Service (FastAPI)
├── ai/
├── interview/
├── resume/
├── analytics/
├── auth/
└── application.yml
```

## 6. AI/ML Service Structure (FastAPI)

```
hiregenius-ai-service/
├── main.py
├── agents/
│   ├── resume_agent.py
│   ├── jd_agent.py
│   ├── interview_agent.py
│   └── ranking_agent.py
├── graphs/               # LangGraph orchestration
├── memory/                # MongoDB-backed agent memory
├── rag/                   # vector store + retrieval
├── prompts/
└── schemas/

hiregenius-ml-service/
├── main.py
├── models/                # trained resume-scoring / ranking models
├── preprocessing/
└── schemas/
```

## 7. Database Schema (MySQL — core tables)

```
Users(user_id, name, email, password, role)
Jobs(job_id, title, description, skills, salary, location, status)
Candidates(candidate_id, user_id, resume_path, score)
Applications(application_id, job_id, candidate_id, status)
Interviews(interview_id, application_id, schedule, result)
AI_Reports(report_id, application_id, recommendation)
Notifications(...)
Analytics(...)
Audit_Logs(...)
```

MongoDB collections: `resume_json`, `chat_history`, `agent_memory`, `interview_transcripts`, `ai_evaluation_reports`, `prompt_history`.

## 8. Key End-to-End Flows

### Resume Screening
`React → Spring Boot (store file) → AI Service (Resume Parser Agent) → extract fields → MongoDB (store JSON) → ML Service (score/rank) → Spring Boot (save summary → MySQL) → React Dashboard`

### AI Interview
`Recruiter → React → Spring Boot → AI Service (Interview Agent) → Gemini → questions → Spring Boot → React → candidate answers → AI Evaluation Agent → score/feedback → Spring Boot → MySQL + MongoDB`

### Candidate Ranking
`Job Description → Spring Boot → AI Service → retrieve candidates (MongoDB+MySQL) → RAG → Ranking Agent → top candidates → Spring Boot → React`

## 9. Authentication Flow
`React → Login → Spring Security validates → JWT issued → React stores token → every request sends "Authorization: Bearer <token>" → Spring Security validates on each call`

## 10. Recommended Build Order
1. React frontend (UI, routing, forms — can use mock data first)
2. Spring Boot backend (REST APIs, JWT, validation)
3. MySQL schema (entities, JPA, relationships)
4. Connect React ↔ Spring Boot
5. FastAPI AI Service (LangChain/LangGraph + Gemini)
6. FastAPI ML Service (resume scoring/ranking)
7. Connect Spring Boot ↔ AI Service ↔ ML Service
8. MongoDB integration for AI/document data
9. RAG/vector store for ranking
10. Testing, Dockerization, deployment

-