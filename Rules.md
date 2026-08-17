# Rules.md — HireGenius AI (AI Coding Assistant Guardrails)

These rules apply to any AI tool (Claude Code, Cursor, etc.) working on this codebase. Follow them strictly — do not deviate without asking first.

## 1. Architecture Boundaries
- React frontend **never** calls MySQL, MongoDB, the AI Service, or the ML Service directly. Every request goes through the Spring Boot API gateway.
- Spring Boot is the only service allowed to talk to MySQL, MongoDB, AI Service, and ML Service.
- AI Service (FastAPI) and ML Service (FastAPI) are independent microservices — no direct DB writes to MySQL from them; return JSON to Spring Boot, which persists it.
- Do not introduce a new microservice or database without updating `Architecture.md` first.

## 2. Tech Stack — Use / Avoid

**Use:**
- Frontend: React (Vite), Tailwind CSS, React Router, Redux Toolkit or Context API, React Hook Form + Zod, Axios, Recharts, React Hot Toast, Framer Motion
- Backend: Spring Boot, Spring Security, Spring Data JPA, JWT (jjwt or spring-security-oauth2-resource-server)
- AI/ML: FastAPI, LangChain, LangGraph, official Gemini/OpenAI SDKs
- DB: MySQL (relational), MongoDB (documents/agent memory)

**Avoid unless explicitly approved:**
- No new frontend state library beyond Redux Toolkit/Context (no Zustand/Recoil mixing in)
- No raw SQL strings in Spring Boot controllers — use JPA repositories / query methods
- No Spring AI — AI orchestration lives in the FastAPI AI Service, not in Java
- No storing plaintext passwords or API keys in code, `.env` files must be gitignored
- No calling LLM APIs directly from the frontend

## 3. Coding Conventions
- **React:** functional components + hooks only, no class components. One component per file. Co-locate styles via Tailwind utility classes.
- **Spring Boot:** layered structure (controller → service → repository), DTOs for all request/response bodies (never expose JPA entities directly), constructor injection only.
- **FastAPI:** Pydantic schemas for all request/response models, async endpoints for I/O-bound calls (LLM/DB).
- **Naming:** camelCase for JS/Java variables, snake_case for Python, PascalCase for React components and Java classes.
- All API routes documented (OpenAPI/Swagger for Spring Boot & FastAPI).

## 4. Error Handling
- Every API call (frontend Axios) must handle loading, success, and error states — show toast/alert on error, never fail silently.
- Spring Boot: use `@ControllerAdvice` + custom exceptions, return consistent error JSON shape `{ status, message, details }`.
- FastAPI: use `HTTPException` with clear status codes; wrap LLM calls in try/except with fallback/retry (max 2 retries) before surfacing an error.
- Never let a failed AI/ML call crash the whole request — degrade gracefully (e.g., show "AI scoring unavailable, try again").

## 5. Security Rules
- All protected routes require valid JWT; role checks enforced server-side (never trust frontend role checks alone).
- Validate and sanitize all file uploads (resume PDFs/DOCX) — restrict file type & size (e.g., max 5MB).
- Rate-limit AI Service endpoints to control LLM API cost.
- Never log full JWTs, passwords, or API keys.

## 6. AI/Agent Rules
- Every agent (Resume, JD, Interview, Ranking) has a single responsibility — do not merge agent logic.
- Log every agent call (prompt + response metadata) to MongoDB for traceability/debugging.
- Prefer structured JSON output from LLM calls (use function calling / JSON mode) over free-text parsing.
- Keep prompts in a dedicated `prompts/` directory, not hardcoded inline in business logic.

## 7. What the AI Assistant Should Do
- Always check `Phases.md` before building — only build what's in the current phase.
- Update `Memory.md` after completing meaningful work (what was built, what's left, any decisions made).
- Ask before adding a new dependency not listed in the approved stack.
- Ask before changing the database schema described in `Architecture.md`.

## 8. What the AI Assistant Should NOT Do
- Do not generate placeholder/fake data as if it were real AI output — actually call the service or clearly mark it as mock.
- Do not skip authentication "for now" in a way that's easy to forget to re-enable — implement it properly from Phase 1.
- Do not silently change the architecture (e.g., swapping MongoDB for MySQL) without flagging it.
- Do not write everything in one giant file — respect the folder structure in `Architecture.md`.

-