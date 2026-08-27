#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# DwellGauge VPS Provisioner
# Run once on a fresh Ubuntu 22.04/24.04 VPS as root
# Usage: sudo bash provision-vps.sh
# ─────────────────────────────────────────────────────────────

echo "╔══════════════════════════════════════════╗"
echo "║  DwellGauge VPS Provisioner              ║"
echo "║  Ubuntu 22.04/24.04 · 4 GB RAM          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. System update ─────────────────────────────────────────
echo "→ Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# ── 2. Essential packages ────────────────────────────────────
echo "→ Installing essentials..."
apt-get install -y -qq curl wget git build-essential ufw fail2ban nginx certbot python3-certbot-nginx

# ── 3. Node.js 22 (via NodeSource) ──────────────────────────
echo "→ Installing Node.js 22..."
if ! command -v node &>/dev/null || [[ "$(node -v)" != v22.* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
echo "   Node $(node -v) | npm $(npm -v)"

# ── 4. PostgreSQL 16 ────────────────────────────────────────
echo "→ Installing PostgreSQL 16..."
if ! command -v psql &>/dev/null; then
  apt-get install -y -qq postgresql postgresql-contrib
fi

# Start and enable PostgreSQL
systemctl enable postgresql
systemctl start postgresql

# ── 5. Create database and user ─────────────────────────────
echo "→ Configuring PostgreSQL..."
DB_USER="dwellgauge"
DB_PASS=$(openssl rand -hex 16)
DB_NAME="dwellgauge"

# Create user and database
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

# ── 6. Tune PostgreSQL for 4 GB RAM ─────────────────────────
echo "→ Tuning PostgreSQL for 4 GB RAM..."
PG_CONF="/etc/postgresql/16/main/postgresql.conf"
if [[ ! -f "$PG_CONF" ]]; then
  # Try version 15 or whatever is installed
  PG_VER=$(ls /etc/postgresql/ | head -1)
  PG_CONF="/etc/postgresql/$PG_VER/main/postgresql.conf"
fi

# Backup original
cp "$PG_CONF" "${PG_CONF}.bak"

# Apply tuning (idempotent via sed replacement)
declare -A PG_SETTINGS=(
  ["shared_buffers"]="1GB"
  ["effective_cache_size"]="3GB"
  ["work_mem"]="16MB"
  ["maintenance_work_mem"]="256MB"
  ["max_connections"]="50"
  ["random_page_cost"]="1.1"
  ["effective_io_concurrency"]="200"
  ["wal_buffers"]="16MB"
  ["checkpoint_completion_target"]="0.9"
  ["min_wal_size"]="1GB"
  ["max_wal_size"]="4GB"
)

for key in "${!PG_SETTINGS[@]}"; do
  val="${PG_SETTINGS[$key]}"
  if grep -q "^#*\s*${key}" "$PG_CONF"; then
    sed -i "s/^#*\s*${key}.*/${key} = '${val}'/" "$PG_CONF"
  else
    echo "${key} = '${val}'" >> "$PG_CONF"
  fi
done

systemctl restart postgresql
echo "   PostgreSQL configured: shared_buffers=1GB, max_connections=50"

# ── 7. Firewall ─────────────────────────────────────────────
echo "→ Configuring firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Direct Next.js (temporary, before Nginx)
echo "   UFW: 22, 80, 443, 3000 open"

# ── 8. Fail2ban ─────────────────────────────────────────────
echo "→ Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# ── 9. Nginx ────────────────────────────────────────────────
echo "→ Installing and configuring Nginx..."
systemctl enable nginx
systemctl start nginx

# ── 10. Create deploy user and app directory ────────────────
echo "→ Setting up app directory..."
mkdir -p /var/www/dwellgauge
chown -R ubuntu:ubuntu /var/www/dwellgauge

# ── 11. Install PM2 globally ────────────────────────────────
echo "→ Installing PM2..."
npm install -g pm2

# Configure PM2 to start on boot
env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# ── 12. Save credentials to file ────────────────────────────
CRED_FILE="/var/www/dwellgauge/.db-credentials"
cat > "$CRED_FILE" <<EOF
# DwellGauge Database Credentials
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# KEEP THIS FILE SECURE

DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_NAME=$DB_NAME
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
EOF
chmod 600 "$CRED_FILE"
chown ubuntu:ubuntu "$CRED_FILE"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Provisioning complete!                  ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Database credentials saved to: $CRED_FILE"
echo ""
echo "Next steps:"
echo "  1. cat $CRED_FILE    # copy DATABASE_URL to your .env"
echo "  2. Upload the deploy script and run it"
echo "  3. Point your domain DNS to this server"
echo ""
echo "Installed:"
echo "  Node.js $(node -v)"
echo "  npm $(npm -v)"
echo "  PostgreSQL $(psql --version | awk '{print $3}')"
echo "  Nginx $(nginx -v 2>&1 | awk -F/ '{print $2}')"
echo "  PM2 $(pm2 -v)"
echo ""
