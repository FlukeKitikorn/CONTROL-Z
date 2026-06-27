#!/usr/bin/env bash
# scripts/restore.sh — CONTROL-Z MySQL Restore from Backup
#
# Usage:
#   ./scripts/restore.sh <backup-file.sql.gz>
#   ./scripts/restore.sh storage/backup/mysql_20260627_020001.sql.gz
#
# Environment variables:
#   MYSQL_ROOT_PASSWORD  MySQL root password (required)
#   MYSQL_DATABASE       Target database name (default: control_z)

set -euo pipefail

BACKUP_FILE="${1:-}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:?Error: MYSQL_ROOT_PASSWORD is not set}"
MYSQL_DATABASE="${MYSQL_DATABASE:-control_z}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ── Validate input ────────────────────────────────────────────────────────────
if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lh "${BACKUP_DIR:-storage/backup}"/*.sql.gz 2>/dev/null || echo "  (none found)"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  log "ERROR: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

command -v docker >/dev/null 2>&1 || { log "ERROR: docker not found"; exit 1; }

# ── Safety confirmation ───────────────────────────────────────────────────────
log "WARNING: This will overwrite the '${MYSQL_DATABASE}' database."
log "Backup file: ${BACKUP_FILE}"
read -r -p "Type 'yes' to confirm: " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  log "Aborted."
  exit 0
fi

# ── Restore ───────────────────────────────────────────────────────────────────
log "Decompressing and restoring..."

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | docker compose exec -T mysql \
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}"
else
  docker compose exec -T mysql \
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < "${BACKUP_FILE}"
fi

log "Restore complete. Database '${MYSQL_DATABASE}' has been restored from:"
log "  ${BACKUP_FILE}"
