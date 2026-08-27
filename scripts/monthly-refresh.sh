#!/bin/bash
# DwellGauge monthly Florida license data refresh
# Runs via cron on the 1st of each month at 03:00 UTC
#
# What it does:
#   1. Attempts to download the latest DBPR CONSTRUCTIONLICENSE_1.csv
#   2. Falls back to the existing local CSV if Cloudflare blocks the download
#   3. Re-parses the CSV to JSON via sync-licenses-fl.ts
#   4. Re-imports to PostgreSQL via import-florida-postgres.ts
#   5. Restarts the app so new data is served immediately
#   6. Logs everything to ~/dwellgauge-refresh.log

set -euo pipefail

APP_DIR="/var/www/dwellgauge"
LOG_FILE="/home/ubuntu/dwellgauge-refresh.log"
CSV_URL="https://www2.myfloridalicense.com/sto/file_download/extracts/CONSTRUCTIONLICENSE_1.csv"
CSV_LOCAL="$APP_DIR/Data files/CONSTRUCTIONLICENSE_1.csv"
CSV_TEMP="/tmp/CONSTRUCTIONLICENSE_1.csv"

export DATABASE_URL="postgres://dwellgauge:DwellGauge2024!@127.0.0.1:5432/dwellgauge"
export PGPASSWORD="DwellGauge2024!"
export FL_LICENSE_DATA_FILE="$CSV_LOCAL"

log() {
  echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $1" | tee -a "$LOG_FILE"
}

mkdir -p "$(dirname "$LOG_FILE")"

log "=== Starting monthly Florida license refresh ==="

cd "$APP_DIR"

# Step 1: Pull latest code from GitHub
log "Pulling latest code from GitHub..."
git pull origin master >> "$LOG_FILE" 2>&1 || log "WARNING: git pull failed, continuing with existing code"
npm install --no-audit --no-fund >> "$LOG_FILE" 2>&1 || log "WARNING: npm install had issues, continuing"

# Step 2: Attempt to download fresh CSV from DBPR
log "Attempting to download fresh DBPR CSV..."
HTTP_CODE=$(curl -s -o "$CSV_TEMP" -w "%{http_code}" -L \
  -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 DwellGauge-Refresh/1.0" \
  --max-time 120 \
  "$CSV_URL" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] && [ -s "$CSV_TEMP" ]; then
  log "Downloaded fresh CSV ($(du -h "$CSV_TEMP" | cut -f1)). Replacing local copy."
  mkdir -p "$APP_DIR/Data files"
  mv "$CSV_TEMP" "$CSV_LOCAL"
  export FL_LICENSE_DATA_FILE="$CSV_LOCAL"
else
  log "WARNING: DBPR download returned HTTP $HTTP_CODE (Cloudflare bot protection). Using existing local CSV."
  if [ ! -f "$CSV_LOCAL" ]; then
    log "ERROR: No local CSV found at $CSV_LOCAL. Aborting."
    exit 1
  fi
  log "Using local CSV ($(du -h "$CSV_LOCAL" | cut -f1)), last modified: $(stat -c %y "$CSV_LOCAL" 2>/dev/null || echo 'unknown')"
fi

# Step 3: Parse CSV to JSON
log "Parsing CSV to JSON..."
npx tsx scripts/sync-licenses-fl.ts >> "$LOG_FILE" 2>&1
RECORD_COUNT=$(node -e "console.log(require('./data/licenses/fl.json').meta.count)" 2>/dev/null || echo "0")
log "Parsed $RECORD_COUNT records from CSV."

if [ "$RECORD_COUNT" = "0" ]; then
  log "ERROR: No records parsed. Aborting before database update."
  exit 1
fi

# Step 4: Import to PostgreSQL
log "Importing $RECORD_COUNT records to PostgreSQL..."
npx tsx scripts/import-florida-postgres.ts >> "$LOG_FILE" 2>&1
log "Import complete."

# Step 5: Verify
TOTAL=$(psql -h 127.0.0.1 -U dwellgauge -d dwellgauge -t -c "SELECT count(*) FROM licenses;" 2>/dev/null | tr -d ' ')
ACTIVE=$(psql -h 127.0.0.1 -U dwellgauge -d dwellgauge -t -c "SELECT count(*) FROM licenses WHERE status='active';" 2>/dev/null | tr -d ' ')
log "Database now holds $TOTAL licenses ($ACTIVE active)."

# Step 6: Restart app
log "Restarting PM2 app..."
pm2 restart dwellgauge >> "$LOG_FILE" 2>&1
sleep 3

# Step 7: Health check
HEALTH=$(curl -s --max-time 5 http://localhost:3000/api/health 2>/dev/null || echo "failed")
log "Health check: $HEALTH"

log "=== Monthly refresh complete ==="
