#!/usr/bin/env bash
set -euo pipefail

# Configuration
APP_NAME="hiregenius-auth-service"
CONTAINER_NAME="hiregenius-auth"
IMAGE_NAME="hiregenius-auth"
PORT_HOST="${HOST_PORT:-80}"
ENV_FILE="${ENV_FILE:-.env}"
LOG_FILE="deploy-log.txt"

echo "=========================================="
echo "Starting deployment for ${APP_NAME}"
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="

# Ensure script operates from its parent directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

# Step 1: Git Pull
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[1/5] Fetching and pulling latest changes from origin main..."
  git fetch origin main || true
  git checkout main || true
  git pull origin main || true
  COMMIT_HASH="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
else
  echo "[1/5] Not inside a git repository; skipping git pull."
  COMMIT_HASH="N/A"
fi

# Step 2: Build Docker Image
echo "[2/5] Building Docker image '${IMAGE_NAME}'..."
docker build -t "${IMAGE_NAME}" .

# Step 3: Gracefully Stop & Remove Existing Container (Idempotent)
echo "[3/5] Cleaning up existing container '${CONTAINER_NAME}'..."
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Stopping container '${CONTAINER_NAME}' gracefully..."
  docker stop -t 15 "${CONTAINER_NAME}" || true
  echo "Removing container '${CONTAINER_NAME}'..."
  docker rm "${CONTAINER_NAME}" || true
else
  echo "No existing container named '${CONTAINER_NAME}' found."
fi

# Step 4: Environment File Check
ENV_ARGS=""
if [ -f "${ENV_FILE}" ]; then
  echo "[4/5] Loading environment variables from '${ENV_FILE}'..."
  ENV_ARGS="--env-file ${ENV_FILE}"
else
  echo "[4/5] WARNING: Environment file '${ENV_FILE}' not found! Container will run with internal defaults."
fi

# Step 5: Start New Container
echo "[5/5] Launching container '${CONTAINER_NAME}'..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart always \
  -p "${PORT_HOST}:8080" \
  ${ENV_ARGS} \
  "${IMAGE_NAME}"

# Post-start verification check: Verify container is running and host port is mapped
sleep 2
MAPPED_PORTS="$(docker ps --filter "name=^${CONTAINER_NAME}$" --format '{{.Ports}}')"

if ! echo "${MAPPED_PORTS}" | grep -q "${PORT_HOST}:8080"; then
  echo "ERROR: Container '${CONTAINER_NAME}' is not running or host port ${PORT_HOST} is not mapped!"
  echo "Current container status:"
  docker ps --filter "name=^${CONTAINER_NAME}$"
  exit 1
fi

# Cleanup unused images to manage disk space on EC2
docker image prune -f || true

# Audit Logging
LOG_TIME="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
LOG_MESSAGE="[${LOG_TIME}] Commit: ${COMMIT_HASH} | Container: ${CONTAINER_NAME} | Status: DEPLOYED SUCCESS"
echo "${LOG_MESSAGE}" >> "${LOG_FILE}"

echo "=========================================="
echo "Deployment Complete!"
echo "Audit Log: ${LOG_MESSAGE}"
echo "Container Port Mapping: ${MAPPED_PORTS}"
echo "Container Status:"
docker ps --filter "name=^${CONTAINER_NAME}$"
echo "=========================================="
