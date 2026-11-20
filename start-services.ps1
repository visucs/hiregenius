# ==============================================================================
# HireGenius / Hirelens - Start All Services Script (Native Local Development)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         Launching All HireGenius AI Services             " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ROOT_DIR = $PSScriptRoot

# 1. AI/ML Service (FastAPI / Python on Port 8000)
Write-Host "[1/4] Starting AI/ML Service (port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\hiregenius-ai-ml-service'; .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# 2. Auth Service (Spring Boot Java 21 on Port 8080)
Write-Host "[2/4] Starting Auth Service (port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:JAVA_HOME='C:\Users\visuc\.tools\jdk-21.0.6+7'; `$env:SPRING_DATASOURCE_URL='jdbc:mysql://bypmcpyebenomi3pdtis-mysql.services.clever-cloud.com:3306/bypmcpyebenomi3pdtis?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true'; `$env:SPRING_DATASOURCE_USERNAME='ujh47p04xlqsiqbc'; `$env:SPRING_DATASOURCE_PASSWORD='KlztJEUdmkxx3A5yO62Q'; `$env:JWT_SIGNING_KEY='YxLwDO5k9msT158PxUDcIX+pOJXEkcsD2I8V3Hp/gSU='; cd '$ROOT_DIR\hiregenius-auth-service'; .\mvnw.cmd spring-boot:run"

# 3. Core API (Node.js / Express on Port 4000)
Write-Host "[3/4] Starting Core API Service (port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PORT='4000'; `$env:DB_HOST='bypmcpyebenomi3pdtis-mysql.services.clever-cloud.com'; `$env:DB_PORT='3306'; `$env:DB_USER='ujh47p04xlqsiqbc'; `$env:DB_PASSWORD='KlztJEUdmkxx3A5yO62Q'; `$env:DB_NAME='bypmcpyebenomi3pdtis'; `$env:DB_SSL='true'; `$env:AUTH_SERVICE_URL='http://localhost:8080'; `$env:JWT_SIGNING_KEY='YxLwDO5k9msT158PxUDcIX+pOJXEkcsD2I8V3Hp/gSU='; cd '$ROOT_DIR\hiregenius-core-api'; node src/server.js"

# 4. Frontend (Vite / React on Port 5173)
Write-Host "[4/4] Starting Frontend Dev Server (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\hiregenius-frontend'; npm run dev"

Write-Host "`nAll 4 services have been launched in separate terminal windows!" -ForegroundColor Green
Write-Host "Frontend:    http://localhost:5173" -ForegroundColor Cyan
Write-Host "Auth API:    http://localhost:8080/health" -ForegroundColor Cyan
Write-Host "Core API:    http://localhost:4000/health" -ForegroundColor Cyan
Write-Host "AI/ML API:   http://localhost:8000/health" -ForegroundColor Cyan
Write-Host "Swagger UI:  http://localhost:4000/swagger-ui/index.html" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
