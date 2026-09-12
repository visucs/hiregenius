# DevOps.md — HireGenius AI CI/CD & Deployment

## Architecture Overview (Updated)

The HireGenius AI monorepo now follows a 4-piece microservice architecture:
1. **hiregenius-frontend** (React + Vite)
2. **hiregenius-auth-service** (Spring Boot — Auth only)
3. **hiregenius-core-api** (Node.js/Express — Jobs, Candidates, Interviews, Dashboard)
4. **hiregenius-ai-ml-service** (FastAPI — AI + ML combined)

All services communicate through the local Docker network in development and are orchestrated by the root `docker-compose.yml`.

## Local Development
- Copy `.env.example` to `.env` and fill in secrets (e.g. `MYSQL_ROOT_PASSWORD`, `GEMINI_API_KEY_TEST`).
- Run `docker compose up --build` from the root directory to spin up all 4 services plus MySQL and MongoDB.
- **Frontend** is exposed on `http://localhost:80`.
- **Auth Service** is on `http://localhost:8080`.
- **Core API** is on `http://localhost:3000`.
- **AI/ML Service** is on `http://localhost:8000`.
- **MySQL** is on `3306` and **MongoDB** is on `27017`.

## CI/CD Pipeline
We use **GitHub Actions** for CI/CD. There are 4 separate workflow files in `.github/workflows/`:
- `frontend-ci.yml`
- `auth-service-ci.yml`
- `core-api-ci.yml`
- `ai-ml-service-ci.yml`

### CI (Continuous Integration)
- Triggered on `push` and `pull_request` to `dev` and `main` branches, filtered by changes in their respective service folders.
- Runs Linting (`npm run lint`), Building (`npm run build`), and Testing.
- The `auth-service` and `core-api` CI workflows spin up a MySQL service container for integration tests.

### CD (Continuous Deployment)

#### 1. Container Registry (GHCR)
- Triggered *only* on a `push` to the `main` branch.
- Each service's Docker image is built using the multi-stage Dockerfile in its folder.
- The image is tagged with `latest` and the short git SHA.
- The image is pushed to GitHub Container Registry (`ghcr.io`) using the built-in `GITHUB_TOKEN`.

#### 2. Vercel Frontend Deployment
Frontend deployments are integrated into `.github/workflows/frontend-ci.yml` using Vercel CLI (`amondnet/vercel-action@v35`):
- **Preview Deployment (`deploy-preview`)**:
  - Triggers on every `pull_request` targeting `dev` or `main`.
  - Runs after `build-and-test` succeeds.
  - Generates a unique Vercel preview URL and posts it directly as a comment on the Pull Request.
- **Production Deployment (`deploy-production`)**:
  - Triggers ONLY on a `push` to `main`.
  - Runs after `build-and-test` succeeds.
  - Deploys live to Vercel production (`--prod`).

### Required GitHub Repo Secrets for Vercel

To enable Vercel deployment, navigate to GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** and add:

1. **`VERCEL_TOKEN`**:
   - Go to [Vercel Account Tokens](https://vercel.com/account/tokens).
   - Click **Create Token**, give it a name (e.g. `GitHub Actions CI`), select scope, and copy the generated token.
2. **`VERCEL_ORG_ID`**:
   - If using a personal Vercel account, go to **Account Settings -> General**, copy your User ID.
   - If using a Team, go to **Team Settings -> General**, copy Team ID.
   - Alternatively, run `npx vercel link` inside `hiregenius-frontend/` locally and inspect `.vercel/project.json` -> `orgId`.
3. **`VERCEL_PROJECT_ID`**:
   - Create a project on Vercel or link an existing project.
   - Go to Vercel Dashboard -> Your Project -> **Settings -> General**, copy **Project ID**.
   - Alternatively, check `.vercel/project.json` -> `projectId`.

## Docker Image Strategy
- **Frontend**: Nginx-served static files (`node:20-alpine` build stage -> `nginx:1.25.4-alpine` serve stage). No `node_modules` in runtime.
- **Auth Service**: Maven build -> Eclipse Temurin 21 JRE slim image.
- **Core API**: Node build -> Node alpine image (production dependencies only).
- **AI/ML Service**: Python 3.11 slim image -> Uvicorn server.
- **Security**: All runtime containers execute as non-root users and expose only their required application ports. Healthchecks are configured to ensure dependent services spin up in the correct order.
