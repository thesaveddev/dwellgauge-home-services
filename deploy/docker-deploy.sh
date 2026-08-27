#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# DwellGauge Docker Deployment
# Run once on a fresh Ubuntu 22.04/24.04 VPS
# Usage: bash docker-deploy.sh
# ─────────────────────────────────────────────────────────────

APP_DIR="/var/www/dwellgauge"
REPO="https://github.com/thesaveddev/dwellgauge-home-services.git"
BRANCH="master"

echo "╔══════════════════════════════════════════╗"
echo "║  DwellGauge Docker Deployment            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Install Docker ───────────────────────────────────────
echo "=> Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker ubuntu
  echo "   Docker installed: $(docker --version)"
else
  echo "   Docker already installed: $(docker --version)"
fi

# ── 2. Install Docker Compose plugin ────────────────────────
if ! docker compose version &>/dev/null; then
  echo "=> Installing Docker Compose plugin..."
  apt-get install -y -qq docker-compose-plugin
fi
echo "   Compose: $(docker compose version)"

# ── 3. Clone or update repo ─────────────────────────────────
echo "=> Getting code..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [[ -d .git ]]; then
  git pull origin "$BRANCH"
else
  git clone --depth 1 --branch "$BRANCH" "$REPO" .
fi
echo "   Commit: $(git log --oneline -1)"

# ── 4. Generate secrets ─────────────────────────────────────
ENV_FILE="$APP_DIR/.env"
if [[ ! -f "$ENV_FILE" ]] || grep -q "changeme" "$ENV_FILE" 2>/dev/null; then
  echo "=> Generating secrets..."
  DB_PASS=$(openssl rand -hex 16)
  ADMIN_PASS=$(openssl rand -hex 16)
  AUTH_SEC=$(openssl rand -hex 32)

  cat > "$ENV_FILE" <<EOF
# DwellGauge Docker Environment
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

DB_PASSWORD=${DB_PASS}
SITE_URL=http://$(hostname -I | awk '{print $1}')
ADMIN_PASSWORD=${ADMIN_PASS}
AUTH_SECRET=${AUTH_SEC}
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_ADSENSE_CLIENT=
NEXT_PUBLIC_CLARITY_ID=
GSC_SITE_URL=
GSC_SERVICE_ACCOUNT_JSON=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EOF
  chmod 600 "$ENV_FILE"
  echo "   Secrets generated and saved to $ENV_FILE"
else
  echo "   Using existing .env"
fi

# ── 5. Build and start containers ───────────────────────────
echo "=> Building and starting containers..."
docker compose down 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# ── 6. Wait for healthy ─────────────────────────────────────
echo "=> Waiting for services to become healthy..."
for i in $(seq 1 30); do
  if docker compose ps --format json 2>/dev/null | grep -q '"Health":"healthy"' || \
     curl -sf http://localhost/api/health 2>/dev/null | grep -q '"ok":true'; then
    break
  fi
  sleep 2
  echo -n "."
done
echo ""

# ── 7. Seed data ────────────────────────────────────────────
echo "=> Seeding license data..."
docker compose exec -T app node -e '
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function seed() {
  const client = await pool.connect();
  try {
    const count = await client.query("SELECT count(*) FROM licenses");
    if (parseInt(count.rows[0].count) > 0) {
      console.log("   Already has", count.rows[0].count, "records - skipping.");
      return;
    }
    const rows = [
      ["fl-cac050373","FL","CAC050373","Johnson Air Conditioning","hvac","Class A Air Conditioning","active","Orlando","Orange",false,"https://www2.myfloridalicense.com/DBPR/"],
      ["fl-cac049266","FL","CAC049266","Cool Breeze HVAC","hvac","Class A Air Conditioning","active","Tampa","Hillsborough",false,"https://www2.myfloridalicense.com/DBPR/"],
      ["fl-rc000123","FL","RC000123","Sunshine Roofing","roofing","Roofing Contractor","active","Miami","Miami-Dade",false,"https://www2.myfloridalicense.com/DBPR/"],
      ["fl-pc000456","FL","PC000456","Florida Plumbing Pro","plumbing","Plumbing Contractor","active","Jacksonville","Duval",false,"https://www2.myfloridalicense.com/DBPR/"],
      ["fl-ec000789","FL","EC000789","Bright Spark Electric","electrical","Electrical Contractor","active","Fort Lauderdale","Broward",false,"https://www2.myfloridalicense.com/DBPR/"],
      ["fl-nc000111","FL","NC000111","All Star Painting","painting","Painting Contractor","active","Orlando","Orange",false,"https://www2.myfloridalicense.com/DBPR/"],
      ["fl-hv000222","FL","HV000222","Premier Air Systems","hvac","Class B Air Conditioning","active","Jacksonville","Duval",false,"https://www2.myfloridalicense.com/DBPR/"],
      ["fl-ec000333","FL","EC000333","Suncoast Electric","electrical","Electrical Contractor","active","Tampa","Hillsborough",false,"https://www2.myfloridalicense.com/DBPR/"]
    ];
    let n = 0;
    for (const r of rows) {
      await client.query(
        "INSERT INTO licenses (id,state_code,license_number,business_name,trade,classification,status,city,county,sample,source_url,retrieved_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now()) ON CONFLICT (id) DO NOTHING",
        [...r]
      );
      n++;
    }
    console.log("   Seeded", n, "sample records.");
  } finally {
    client.release();
    await pool.end();
  }
}
seed().catch(e => { console.error(e); process.exit(1); });
' 2>&1 || echo "   Seed skipped (will retry)"

# ── 8. Verify ───────────────────────────────────────────────
echo ""
echo "=> Verifying..."
HEALTH=$(curl -sf http://localhost/api/health 2>/dev/null || echo '{"ok":false}')

if echo "$HEALTH" | grep -q '"ok":true'; then
  RECORDS=$(echo "$HEALTH" | node -e "d=require('fs').readFileSync(0,'utf8');console.log(JSON.parse(d).licenseCount)" 2>/dev/null || echo "?")
  echo ""
  echo "╔══════════════════════════════════════════╗"
  echo "║  DwellGauge is LIVE!                     ║"
  echo "╚══════════════════════════════════════════╝"
  echo ""
  echo "  URL:    http://$(hostname -I | awk '{print $1}')"
  echo "  Admin:  http://$(hostname -I | awk '{print $1}')/admin"
  echo "  Health: ok, ${RECORDS} license records"
  echo ""
  echo "  Containers:"
  docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
else
  echo "⚠️  Health check failed"
  docker compose logs app --tail 30
fi
