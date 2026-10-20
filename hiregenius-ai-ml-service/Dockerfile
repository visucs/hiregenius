# ==============================================================================
# Stage 1: Build dependencies
# ==============================================================================
FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ==============================================================================
# Stage 2: Production Runtime
# ==============================================================================
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/home/appuser/.local/bin:$PATH \
    PORT=8000

# Create dedicated non-root user
RUN useradd -m -u 1000 -s /bin/bash appuser

# Copy installed python dependencies from builder
COPY --from=builder /root/.local /home/appuser/.local

# Copy application source code
COPY app ./app

# Ensure correct file permissions for non-root user
RUN chown -R appuser:appuser /home/appuser/.local /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:' + str(__import__('os').environ.get('PORT', 8000)) + '/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
