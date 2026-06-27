FROM python:3.12-slim

# Install minimal system dependencies
# - gcc: needed to compile any C-extension Python packages
# - wget: used by the Docker healthcheck
# Note: PyMySQL is pure Python; no libmysqlclient-dev required.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser

WORKDIR /app

# Install Python dependencies before copying source (layer cache optimisation)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create upload directory structure (host bind mount will overlay this at runtime)
RUN mkdir -p /app/storage/uploads/{users,products,documents,temp}

# Transfer ownership to non-root user
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/ || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
