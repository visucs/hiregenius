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
- Triggered on `push` and `pull_request` to `dev` and `main` branches (and `feature/**` for Core API), filtered by changes in their respective service folders.
- Runs Linting (`npm run lint`), Building (`npm run build`), and Testing.
- The `auth-service` and `core-api` CI workflows spin up a MySQL service container for integration tests.
- **Core API CI Environment**:
  - The CI workflow (`core-api-ci.yml`) supplies safe, non-production dummy environment variables for the test run (`NODE_ENV=test`, `PORT=4000`, `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USER=root`, `DB_PASSWORD=root`, `DB_NAME=testdb`, `DB_SSL=false`, `DB_POOL_MIN=1`, `DB_POOL_MAX=10`, `ENABLE_SWAGGER=true`, `USE_SQLITE=true`).
  - `JWT_SIGNING_KEY` uses a safe fallback placeholder (`${{ secrets.JWT_SIGNING_KEY || 'test-only-signing-key-not-for-production-use-min-32-chars' }}`) to allow clean PR validation without exposing or requiring production secret injection.
  - Local development (`.env`) and production hosting (Render/AWS) remain completely unaffected, using their own independent, secured configuration.

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

#### 3. GitHub Pages (Additional Deployment Target)
Integrated into `.github/workflows/frontend-ci.yml` as an isolated `deploy-github-pages` job:
- **Triggers**: ONLY on `push` to `main`, after `build-and-test` succeeds (`needs: build-and-test`).
- **Base Path**: Uses `VITE_BASE_PATH=/hiregenius/` during GitHub Pages build step so static assets load correctly from `https://visucs.github.io/hiregenius/`. Does not modify default root base path `'/'` for local dev or Vercel.
- **SPA Fallback**: Copies `dist/index.html` to `dist/404.html` so client-side React Router navigation works cleanly on page refresh.
- **Deployment**: Deploys via official `actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4`.

### Required GitHub Repo Settings & Secrets

#### For Vercel Deployment (Repository Secrets):
Navigate to GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** and add:
1. **`VERCEL_TOKEN`**: Generated from [Vercel Account Tokens](https://vercel.com/account/tokens).
2. **`VERCEL_ORG_ID`**: Account/Team ID from Vercel Dashboard Settings (or `.vercel/project.json` -> `orgId`).
3. **`VERCEL_PROJECT_ID`**: Project ID from Vercel Project Settings (or `.vercel/project.json` -> `projectId`).

#### For GitHub Pages Deployment (Repository Settings):
1. Navigate to GitHub Repository -> **Settings** -> **Pages**.
2. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
3. Workflow permissions for `pages: write` and `id-token: write` are explicitly declared in `frontend-ci.yml`.

## Docker Image Strategy
- **Frontend**: Nginx-served static files (`node:20-alpine` build stage -> `nginx:1.25.4-alpine` serve stage). No `node_modules` in runtime.
- **Auth Service**: Maven build -> Eclipse Temurin 21 JRE slim image.
- **Core API**: Node build -> Node alpine image (production dependencies only).
- **AI/ML Service**: Python 3.11 slim image -> Uvicorn server.
- **Security**: All runtime containers execute as non-root users and expose only their required application ports. Healthchecks are configured to ensure dependent services spin up in the correct order.

## Auth Service Deployment (Render)

The **hiregenius-auth-service** is deployed as a Docker Web Service on [Render](https://render.com).

### Step-by-Step Deployment Instructions

1. **Log in to Render Dashboard**: Navigate to [dashboard.render.com](https://dashboard.render.com).
2. **Create New Web Service**:
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository (`visucs/hiregenius`).
3. **Configure Service Settings**:
   - **Name**: `hiregenius-auth-service`
   - **Branch**: `main` (or `dev` for staging)
   - **Root Directory**: `hiregenius-auth-service`
   - **Runtime**: `Docker` (Render automatically detects `Dockerfile` inside `hiregenius-auth-service`)
   - **Instance Type**: `Free` (or `Starter`)
4. **Health Check**:
   - Under **Advanced Settings**, set **Health Check Path** to: `/health`
5. **Environment Variables**:
   Add the following environment variables in the Render dashboard:
   - `SPRING_DATASOURCE_URL`: Full JDBC URL for your managed MySQL database (e.g. `jdbc:mysql://<host>:<port>/<dbname>?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true`).
   - `SPRING_DATASOURCE_USERNAME`: Database username.
   - `SPRING_DATASOURCE_PASSWORD`: Database password.
   - `JWT_SIGNING_KEY`: Min 256-bit (32+ character) secret string (must match `JWT_SIGNING_KEY` on `hiregenius-core-api`).
   - `JWT_EXPIRATION_MS`: `86400000` (24 hours).
   - `FIREBASE_CREDENTIALS_JSON`: Entire raw JSON content of your Firebase Service Account credentials file (`serviceAccountKey.json`).
   - `CORS_ALLOWED_ORIGINS`: Comma-separated list including the deployed frontend URL (e.g. `https://hiregenius.vercel.app,http://localhost:5173`).
6. **Deploy**:
   - Click **Create Web Service**.
   - Render will build the multi-stage Docker image and start the container on its assigned `$PORT`.
   - Once healthy, Render will provide a public URL (e.g. `https://hiregenius-auth-service.onrender.com`).

