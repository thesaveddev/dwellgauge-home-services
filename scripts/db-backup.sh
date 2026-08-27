#!/usr/bin/env bash
# Encrypted PostgreSQL logical backup with retention.
#
# Requirements: pg_dump (matching the server major version), openssl.
# Usage:
#   BACKUP_DIR=/var/backups/dwellgauge \
#   BACKUP_PASSPHRASE="$(openssl rand -base64 32)" \
#   BACKUP_RETENTION_DAYS=30 \
#   DATABASE_URL=postgresql://...?sslmode=require \
#   bash scripts/db-backup.sh
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required (must use sslmode=require or stronger)}"
: "${BACKUP_DIR:?BACKUP_DIR is required}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required (store it in the secret manager; losing it makes backups unreadable)}"
: "${BACKUP_RETENTION_DAYS:=30}"

if [[ "$DATABASE_URL" != *sslmode=* ]]; then
  echo "ERROR: DATABASE_URL must include sslmode=require, verify-ca, or verify-full." >&2
  exit 1
fi

command -v pg_dump >/dev/null || { echo "ERROR: pg_dump not found on PATH." >&2; exit 1; }
command -v openssl >/dev/null || { echo "ERROR: openssl not found on PATH." >&2; exit 1; }

mkdir -p "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive="${BACKUP_DIR}/dwellgauge-${stamp}.dump.enc"
sha="${archive}.sha256"

echo "[backup] dumping database..."
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges |
  openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE -out "$archive"

echo "[backup] writing integrity hash..."
(cd "$BACKUP_DIR" && sha256sum "$(basename "$archive")" > "$(basename "$sha")")

echo "[backup] pruning backups older than ${BACKUP_RETENTION_DAYS} days..."
find "$BACKUP_DIR" -type f \( -name '*.dump.enc' -o -name '*.sha256' \) -mtime "+${BACKUP_RETENTION_DAYS}" -delete

echo "[backup] done: $archive ($(du -h "$archive" | cut -f1))"
echo "[backup] keep the passphrase and hashes in a different location from the archive."
