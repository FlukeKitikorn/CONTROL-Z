#!/usr/bin/env bash
# scripts/backup.sh — CONTROL-Z MySQL Backup + Off-site Sync
#
# Usage:
#   ./scripts/backup.sh
#
# Cron (runs at 02:00 every day):
#   0 2 * * * /opt/controlz/scripts/backup.sh >> /var/log/controlz-backup.log 2>&1
#
# Required environment variables (set in shell or sourced from .env):
#   MYSQL_ROOT_PASSWORD  — MySQL root password
#   BACKUP_DIR           — local backup directory (default: /opt/controlz/storage/backup)
#   RCLONE_REMOTE        — rclone remote destination (default: remote:controlz-backup)

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
DATE=$(date +%Y%m%d_%H%M%S)

MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:?Error: MYSQL_ROOT_PASSWORD is not set}"
BACKUP_DIR="${BACKUP_DIR:-/opt/controlz/storage/backup}"
RCLONE_REMOTE="${RCLONE_REMOTE:-remote:controlz-backup}"

DUMP_FILE="${BACKUP_DIR}/mysql_${DATE}.sql"
DUMP_GZ="${DUMP_FILE}.gz"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ── Validate tools ───────────────────────────────────────────────────────────
command -v docker  >/dev/null 2>&1 || { log "ERROR: docker not found"; exit 1; }
command -v rclone  >/dev/null 2>&1 || { log "ERROR: rclone not found"; exit 1; }
command -v gzip    >/dev/null 2>&1 || { log "ERROR: gzip not found";   exit 1; }

# ── Create backup directory if it doesn't exist ──────────────────────────────
mkdir -p "${BACKUP_DIR}"

log "Starting backup (DATE=${DATE})"
log "Backup dir  : ${BACKUP_DIR}"
log "Rclone dest : ${RCLONE_REMOTE}"

# ── MySQL dump — all databases ───────────────────────────────────────────────
log "Dumping MySQL databases..."
docker compose exec -T mysql mysqldump \
  -u root -p"${MYSQL_ROOT_PASSWORD}" \
  --all-databases \
  --single-transaction \
  --routines \
  --triggers \
  --add-drop-database \
  > "${DUMP_FILE}"

log "Dump complete: ${DUMP_FILE} ($(du -sh "${DUMP_FILE}" | cut -f1))"

# ── Compress ─────────────────────────────────────────────────────────────────
log "Compressing..."
gzip "${DUMP_FILE}"
log "Compressed : ${DUMP_GZ} ($(du -sh "${DUMP_GZ}" | cut -f1))"

# ── Sync to off-site storage ─────────────────────────────────────────────────
log "Syncing to ${RCLONE_REMOTE}..."
rclone sync "${BACKUP_DIR}" "${RCLONE_REMOTE}" \
  --transfers 4 \
  --quiet

log "Sync complete."

# ── Purge old local backups (older than 7 days) ───────────────────────────────
log "Removing local backups older than 7 days..."
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +7 -delete
REMAINING=$(find "${BACKUP_DIR}" -name "*.sql.gz" | wc -l)
log "Retained ${REMAINING} local backup(s)."

log "Backup finished successfully."
