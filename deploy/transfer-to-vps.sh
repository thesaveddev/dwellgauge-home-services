#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Transfer DwellGauge to VPS
# Run from the project root on your LOCAL machine
# Usage: bash deploy/transfer-to-vps.sh
# ─────────────────────────────────────────────────────────────

VPS_HOST="158.69.221.87"
VPS_USER="ubuntu"
REMOTE_DIR="/home/ubuntu/dwellgauge"

echo "╔══════════════════════════════════════════╗"
echo "║  Transferring DwellGauge to VPS          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Target: $VPS_USER@$VPS_HOST:$REMOTE_DIR"
echo ""

# Create remote directory
ssh "$VPS_USER@$VPS_HOST" "mkdir -p $REMOTE_DIR"

# Sync project files (excluding node_modules, .next, and other build artifacts)
echo "→ Syncing project files..."
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='data files/' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='dist' \
  ./ "$VPS_USER@$VPS_HOST:$REMOTE_DIR/"

# Transfer the large FL CSV if present
if [[ -d "data files" ]]; then
  echo "→ Transferring FL license data..."
  scp -r "data files/" "$VPS_USER@$VPS_HOST:$REMOTE_DIR/"
fi

# Transfer deploy scripts
echo "→ Transferring deploy scripts..."
scp -r deploy/ "$VPS_USER@$VPS_HOST:$REMOTE_DIR/"

echo ""
echo "✅ Transfer complete!"
echo ""
echo "Next: SSH into the VPS and run:"
echo "  ssh $VPS_USER@$VPS_HOST"
echo "  sudo bash $REMOTE_DIR/deploy/provision-vps.sh"
echo "  bash $REMOTE_DIR/deploy/deploy-app.sh"
echo ""
