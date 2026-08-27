#!/usr/bin/env bash
# Restore test: proves an encrypted backup can be decrypted and restored.
# Restores into a throwaway database on the same server; use a staging host
# when the production host is not safe to add scratch databases to.
#
# Usage:
#   BACKUP_FILE=/var/backups/dwellgauge/dwellgauge-....dump.enc \
#   BACKUP_PASSPHRASE=... \
#   RESTORE_DB_HOST=db.yourdomain.com \
#   bash scripts/db-restore-check.sh
set -euo pipefail

: "${BACKUP_FILE:?BACKUP_FILE is required}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required}"
: "${RESTORE_DB_HOST:?RESTORE_DB_HOST is required}"

command -v pg_restore >/dev/null || { echo "ERROR: pg_restore not found on PATH." >&2; exit 1; }

scratch="dwellgauge_restore_test_$(date -u +%Y%m%dT%H%M%SZ)"
plain="${scratch}.dump"
cleanup() {
  psql -h "$RESTORE_DB_HOST" -U postgres -c "drop database if exists ${scratch};" >/dev/null 2>&1 || true
  rm -f "$plain"
}
trap cleanup EXIT

echo "[restore-check] decrypting backup..."
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE -in "$BACKUP_FILE" -out "$plain"

echo "[restore-check] validating archive list (no restore yet)..."
pg_restore --list "$plain" >/dev/null

echo "[restore-check] creating scratch database ${scratch}..."
createdb -h "$RESTORE_DB_HOST" -U postgres "$scratch"

echo "[restore-check] restoring..."
pg_restore -h "$RESTORE_DB_HOST" -U postgres -d "$scratch" --no-owner --exit-on-error "$plain"

echo "[restore-check] counting records..."
psql -h "$RESTORE_DB_HOST" -U postgres -d "$scratch" -tAc \
  "select 'licenses=' || count(*) from licenses union all select 'leads=' || count(*) from leads;"

echo "[restore-check] PASS: backup decrypted and restored cleanly."
