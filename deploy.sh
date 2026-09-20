#!/usr/bin/env bash
set -euo pipefail

# Root wrapper deployment script for hiregenius-auth-service on AWS EC2
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "${SCRIPT_DIR}/hiregenius-auth-service" ]; then
  cd "${SCRIPT_DIR}/hiregenius-auth-service"
  chmod +x deploy.sh
  ./deploy.sh "$@"
else
  echo "Executing deployment directly in $(pwd)..."
  chmod +x deploy.sh 2>/dev/null || true
  exec ./deploy.sh "$@"
fi
