#!/bin/bash
# =============================================================================
# PrintShop OS - Deploy to Homelab
# =============================================================================
# Run this from your Mac to deploy PrintShop OS to docker-host
# Usage: ./scripts/deploy-to-homelab.sh
# =============================================================================

set -e

REMOTE_HOST="docker-host"
REMOTE_DIR="/home/docker-host/stacks/printshop-os"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=========================================="
echo "PrintShop OS - Homelab Deployment"
echo "=========================================="
echo "Local:  $LOCAL_DIR"
echo "Remote: $REMOTE_HOST:$REMOTE_DIR"
echo ""

# Step 1: Create remote directory structure
echo "[1/5] Creating remote directories..."
ssh $REMOTE_HOST "mkdir -p $REMOTE_DIR/{printshop-strapi,services/job-estimator,frontend}"

# Step 2: Sync the project files (excluding node_modules, .git, etc)
echo "[2/5] Syncing project files..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.venv' \
  --exclude '*.pyc' \
  --exclude '__pycache__' \
  --exclude '.env' \
  --exclude 'dist' \
  --exclude 'build' \
  --exclude '.next' \
  "$LOCAL_DIR/printshop-strapi/" "$REMOTE_HOST:$REMOTE_DIR/printshop-strapi/"

rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  "$LOCAL_DIR/services/job-estimator/" "$REMOTE_HOST:$REMOTE_DIR/services/job-estimator/"

rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  "$LOCAL_DIR/frontend/" "$REMOTE_HOST:$REMOTE_DIR/frontend/"

# Step 3: Copy docker-compose and env files
echo "[3/5] Copying docker-compose files..."
scp "$LOCAL_DIR/scripts/docker-compose.prod.yml" "$REMOTE_HOST:$REMOTE_DIR/docker-compose.yml"
scp "$LOCAL_DIR/scripts/.env.prod" "$REMOTE_HOST:$REMOTE_DIR/.env"

# Step 4: Build and start containers
echo "[4/5] Building and starting containers..."
ssh $REMOTE_HOST "cd $REMOTE_DIR && docker-compose pull && docker-compose build && docker-compose up -d"

# Step 5: Show status
echo "[5/5] Checking container status..."
ssh $REMOTE_HOST "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E 'printshop|NAMES'"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - Strapi Admin: http://100.92.156.118:1337/admin"
echo "  - Strapi API:   http://100.92.156.118:1337/api"
echo ""
echo "Logs: ssh docker-host 'cd $REMOTE_DIR && docker-compose logs -f'"
echo ""
