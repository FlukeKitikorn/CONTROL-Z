#!/usr/bin/env bash
# scripts/rclone-sync.sh - Standalone Rclone Off-site Sync
#
# Syncs the local backup directory to a remote object storage destination.
# Can be called independently of backup.sh for manual re-sync.
#
# Usage:
#   ./scripts/rclone-sync.sh              # full sync
#   ./scripts/rclone-sync.sh --dry-run   # preview without transferring
#   ./scripts/rclone-sync.sh --verbose   # show file-level progress
#
# Supported rclone remotes (configure via: rclone config):
#   AWS S3        s3:your-bucket/controlz-backup
#   Backblaze B2  b2:your-bucket/controlz-backup
#   Google Drive  gdrive:controlz-backup
#
# Environment variables:
#   BACKUP_DIR     local directory to sync   (default: /opt/controlz/storage/backup)
#   RCLONE_REMOTE  rclone remote:path target (default: remote:controlz-backup)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/controlz/storage/backup}"
RCLONE_REMOTE="${RCLONE_REMOTE:-remote:controlz-backup}"

DRY_RUN=false
VERBOSE=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --verbose) VERBOSE=true ;;
  esac
done

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

command -v rclone >/dev/null 2>&1 || { log "ERROR: rclone not found. Install: https://rclone.org"; exit 1; }

if [ ! -d "${BACKUP_DIR}" ]; then
  log "ERROR: BACKUP_DIR '${BACKUP_DIR}' does not exist."
  exit 1
fi

RCLONE_FLAGS="--transfers 4 --checksum"
if $DRY_RUN;  then RCLONE_FLAGS="${RCLONE_FLAGS} --dry-run"; fi
if $VERBOSE;  then RCLONE_FLAGS="${RCLONE_FLAGS} --progress"; else RCLONE_FLAGS="${RCLONE_FLAGS} --quiet"; fi

log "Rclone sync"
log "  Source : ${BACKUP_DIR}"
log "  Target : ${RCLONE_REMOTE}"
if $DRY_RUN; then log "  Mode   : DRY RUN - no files will be transferred"; fi

rclone sync "${BACKUP_DIR}" "${RCLONE_REMOTE}" ${RCLONE_FLAGS}

log "Sync complete."
