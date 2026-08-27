#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# DwellGauge App Deployment
# Run AFTER provision-vps.sh on the same VPS
# Usage: bash deploy-app.sh
# ─────────────────────────────────────────────────────────────

APP_DIR="/var/www/dwellgauge"
REPO="https://github.com/thesaveddev/dwellgauge-home-services.git"
BRANCH="master"

echo "╔══════════════════════════════════════════╗"
echo "║  DwellGauge Deployment                   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Load database credentials ────────────────────────────
CRED_FILE="/var/www/dwellgauge/.db-credentials"
if [[ ! -f "$CRED_FILE" ]]; then
  echo "ERROR: Database credentials not found at $CRED_FILE"
  echo "Run provision-vps.sh first."
  exit 1
fi
source "$CRED_FILE"
echo "→ Database: $DB_NAME @ localhost"

# ── 2. Clone or pull the repo ───────────────────────────────
echo "→ Getting latest code..."
if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR"
  git fetch origin
  git reset --hard "origin/$BRANCH"
else
  cd /
  rm -rf "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi
echo "   Branch: $BRANCH | Commit: $(git log --oneline -1)"

# ── 3. Install dependencies ─────────────────────────────────
echo "→ Installing dependencies..."
npm ci --no-audit --no-fund

# ── 4. Create .env.local ────────────────────────────────────
echo "→ Writing environment config..."
cat > "$APP_DIR/.env.local" <<EOF
# ── DwellGauge Production Environment ──
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=false

# Database
DATABASE_URL=$DATABASE_URL

# Admin
ADMIN_PASSWORD=changeme-$(openssl rand -hex 16)
AUTH_SECRET=$(openssl rand -hex 32)

# Analytics (configure when ready)
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_ADSENSE_CLIENT=
NEXT_PUBLIC_CLARITY_ID=

# Search Console (configure when ready)
GSC_SITE_URL=
GSC_SERVICE_ACCOUNT_JSON=

# Stripe (configure when ready)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EOF
chmod 600 "$APP_DIR/.env.local"

echo "   .env.local created — change ADMIN_PASSWORD before sharing!"

# ── 5. Run database migrations ──────────────────────────────
echo "→ Running database migrations..."
for migration in db/migrations/*.sql; do
  if [[ -f "$migration" ]]; then
    echo "   Applying: $(basename $migration)"
    PGPASSWORD="$DB_PASS" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -f "$migration" 2>&1 | grep -v "^$" || true
  fi
done

# ── 6. Seed Florida license data from JSON ──────────────────
echo "→ Seeding license data from JSON..."
SEED_SQL=$(cat <<'SEED'
DO $$
DECLARE
  rec JSONB;
  cnt INTEGER := 0;
BEGIN
  IF (SELECT count(*) FROM licenses) > 0 THEN
    RAISE NOTICE 'Licenses table already has data, skipping seed.';
    RETURN;
  END IF;

  FOR rec IN SELECT jsonb_array_elements(
    COALESCE(
      (SELECT data FROM data_files WHERE filename = 'sample-seed.json'),
      '[]'::jsonb
    )
  )
  LOOP
    INSERT INTO licenses (
      id, state_code, license_number, business_name, trade,
      classification, status, issued_at, expires_at,
      city, county, zip_code, source_url, sample
    ) VALUES (
      rec->>'id',
      rec->>'stateCode',
      rec->>'licenseNumber',
      rec->>'businessName',
      rec->>'trade',
      rec->>'classification',
      rec->>'status',
      NULLIF(rec->>'issuedAt', ''),
      NULLIF(rec->>'expiresAt', ''),
      rec->>'city',
      rec->>'county',
      rec->>'zipCode',
      rec->>'sourceUrl',
      COALESCE((rec->>'sample')::boolean, true)
    )
    ON CONFLICT (id) DO NOTHING;

    cnt := cnt + 1;
  END LOOP;

  RAISE NOTICE 'Seeded % license records.', cnt;
END $$;
SEED
)

# Try direct seeding from the JSON file using psql
SEED_FILE="data/licenses/sample-seed.json"
if [[ -f "$SEED_FILE" ]]; then
  # Use node to import the JSON into postgres
  node -e "
    const { Pool } = require('pg');
    const fs = require('fs');
    const path = require('path');

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const data = JSON.parse(fs.readFileSync(path.resolve('$SEED_FILE'), 'utf8'));
    const records = data.records || data;

    async function seed() {
      const client = await pool.connect();
      try {
        const count = await client.query('SELECT count(*) FROM licenses');
        if (parseInt(count.rows[0].count) > 0) {
          console.log('   Licenses table already has', count.rows[0].count, 'records — skipping seed.');
          return;
        }

        let inserted = 0;
        for (const rec of records) {
          await client.query(\`
            INSERT INTO licenses (id, state_code, license_number, business_name, trade, classification, status, issued_at, expires_at, city, county, zip_code, source_url, sample)
            VALUES (\$1,\$2,\$3,\$4,\$5,\$6,\$7,\$8,\$9,\$10,\$11,\$12,\$13,\$14)
            ON CONFLICT (id) DO NOTHING
          \`, [
            rec.id, rec.stateCode, rec.licenseNumber, rec.businessName,
            rec.trade, rec.classification, rec.status,
            rec.issuedAt || null, rec.expiresAt || null,
            rec.city, rec.county, rec.zipCode,
            rec.sourceUrl, rec.sample || false
          ]);
          inserted++;
        }
        console.log('   Seeded', inserted, 'license records.');
      } finally {
        client.release();
        await pool.end();
      }
    }
    seed().catch(e => { console.error(e); process.exit(1); });
  "
else
  echo "   WARNING: $SEED_FILE not found, skipping seed."
fi

# ── 7. Also import the large FL CSV if present ──────────────
FL_CSV="data files/FLILB_CONSTRUCTION.csv"
if [[ -f "$FL_CSV" ]]; then
  echo "→ Importing FL license CSV ($(wc -l < "$FL_CSV") lines)..."
  node -e "
    const { Pool } = require('pg');
    const fs = require('fs');
    const readline = require('readline');

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const stream = fs.createReadStream('$FL_CSV');
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    const TRADES = ['hvac','roofing','plumbing','electrical','general','painting','pool','solar','pest','fire','elevator','mechanical'];
    const TRADE_MAP = {
      'air conditioning': 'hvac', 'heating': 'hvac', 'hvac': 'hvac',
      'roofing': 'roofing', 'roof': 'roofing',
      'plumbing': 'plumbing', 'plumber': 'plumbing',
      'electrical': 'electrical', 'electrician': 'electrical',
      'general contractor': 'general', 'building': 'general',
      'painting': 'painting', 'painter': 'painting',
      'pool': 'pool', 'swimming': 'pool',
      'solar': 'solar', 'photovoltaic': 'solar',
      'pest': 'pest', 'exterminator': 'pest',
    };

    function classifyTrade(tradeStr) {
      if (!tradeStr) return null;
      const lower = tradeStr.toLowerCase();
      for (const [key, val] of Object.entries(TRADE_MAP)) {
        if (lower.includes(key)) return val;
      }
      return null;
    }

    async function importCSV() {
      const client = await pool.connect();
      let header = null;
      let inserted = 0;
      let skipped = 0;

      try {
        for await (const line of rl) {
          if (!header) { header = line.split(',').map(h => h.trim().replace(/\"/g,'')); continue; }
          const cols = line.split(',').map(c => c.trim().replace(/\"/g,''));
          const row = {};
          header.forEach((h, i) => row[h] = cols[i] || '');

          const trade = classifyTrade(row['TRADE'] || row['CLASSIFICATION'] || row['BUSINESS TYPE']);
          if (!trade) { skipped++; continue; }

          const id = 'fl-' + (row['LICENSE NUMBER'] || row['LICENSE_NO'] || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
          if (!id || id === 'fl-') { skipped++; continue; }

          const status = (row['STATUS'] || '').toLowerCase().includes('active') ? 'active' : 'inactive';

          await client.query(\`
            INSERT INTO licenses (id, state_code, license_number, business_name, trade, classification, status, city, county, zip_code, sample)
            VALUES (\$1,'FL',\$2,\$3,\$4,\$5,\$6,\$7,\$8,\$9,false)
            ON CONFLICT (id) DO NOTHING
          \`, [
            id,
            row['LICENSE NUMBER'] || row['LICENSE_NO'] || '',
            row['BUSINESS NAME'] || row['NAME'] || '',
            trade,
            row['TRADE'] || row['CLASSIFICATION'] || '',
            status,
            row['CITY'] || '',
            row['COUNTY'] || '',
            row['ZIP'] || row['ZIP CODE'] || ''
          ]);
          inserted++;
          if (inserted % 1000 === 0) console.log('   ...inserted', inserted);
        }
        console.log('   Imported', inserted, 'FL licenses. Skipped', skipped, 'non-matching.');
      } finally {
        client.release();
        await pool.end();
      }
    }
    importCSV().catch(e => { console.error(e); process.exit(1); });
  "
fi

# ── 8. Run compute pipeline ─────────────────────────────────
echo "→ Running cost estimate pipeline..."
npm run pipeline:compute 2>/dev/null || echo "   Pipeline compute skipped (non-critical)"

# ── 9. Build production ─────────────────────────────────────
echo "→ Building production..."
NODE_ENV=production npm run build

# ── 10. Start with PM2 ──────────────────────────────────────
echo "→ Starting app with PM2..."
cd "$APP_DIR"
pm2 delete dwellgauge 2>/dev/null || true
pm2 start npm --name "dwellgauge" -- start -- -p 3000
pm2 save

# ── 11. Verify ──────────────────────────────────────────────
echo ""
sleep 3
HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo '{"ok":false}')
if echo "$HEALTH" | grep -q '"ok":true'; then
  echo "✅ App is running and healthy!"
  echo "$HEALTH" | node -e "
    const d=require('fs').readFileSync(0,'utf8');
    const j=JSON.parse(d);
    console.log('   Records:', j.licenseCount);
    console.log('   Storage:', j.storage);
    console.log('   Services:', j.serviceCount);
    console.log('   Metros:', j.metroCount);
  " 2>/dev/null || true
else
  echo "⚠️  App started but health check returned: $HEALTH"
  echo "   Check PM2 logs: pm2 logs dwellgauge"
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Deployment complete!                    ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "App running at: http://localhost:3000"
echo "Admin dashboard: http://localhost:3000/admin"
echo ""
echo "Useful commands:"
echo "  pm2 logs dwellgauge      # view logs"
echo "  pm2 restart dwellgauge   # restart app"
echo "  pm2 monit                # live monitoring"
echo ""
