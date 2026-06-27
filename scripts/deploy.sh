#!/usr/bin/env bash
# scripts/deploy.sh - CONTROL-Z Production Deploy Script
#
# Usage:
#   ./scripts/deploy.sh v1.2.0
#   IMAGE_TAG=v1.2.0 ./scripts/deploy.sh
#
# Environment variables:
#   IMAGE_TAG    Version tag to deploy (e.g. v1.2.0) - required
#   GHCR_ORG     GitHub org owning the GHCR packages (default: your-org)
#   COMPOSE_DIR  Project directory (default: parent of this script)

set -euo pipefail

IMAGE_TAG="${1:-${IMAGE_TAG:-}}"
GHCR_ORG="${GHCR_ORG:-your-org}"
COMPOSE_DIR="${COMPOSE_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

if [ -z "${IMAGE_TAG}" ]; then
  echo "Usage: $0 <version-tag>  (e.g. $0 v1.2.0)"
  exit 1
fi

command -v docker >/dev/null 2>&1 || { log "ERROR: docker not found"; exit 1; }

log "Deploying CONTROL-Z ${IMAGE_TAG}"
log "  GHCR org   : ${GHCR_ORG}"
log "  Project dir: ${COMPOSE_DIR}"

cd "${COMPOSE_DIR}"

export IMAGE_TAG GHCR_ORG

# Pull new images from registry
log "Pulling images..."
docker compose -f compose.yaml -f compose.prod.yaml pull

# Rolling update
log "Starting update..."
docker compose -f compose.yaml -f compose.prod.yaml up -d --remove-orphans

# Wait for backend health
log "Checking backend health..."
TRIES=0
until docker compose -f compose.yaml -f compose.prod.yaml exec -T backend \
    wget --no-verbose --tries=1 --spider http://localhost:8000/ 2>/dev/null; do
  TRIES=$((TRIES + 1))
  if [ "${TRIES}" -gt 20 ]; then
    log "ERROR: Backend unhealthy after 60s. Check: docker compose -f compose.yaml -f compose.prod.yaml logs backend"
    exit 1
  fi
  sleep 3
done

log "Backend healthy."

# Remove dangling images
docker image prune -f

log "Deploy of ${IMAGE_TAG} complete."
