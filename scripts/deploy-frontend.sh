#!/bin/bash
# Deploy frontend with progress indicator

set -e

DIST_DIR="/Users/ronnyworks/Projects/printshop-os/frontend/dist"
REMOTE_HOST="docker-host"
REMOTE_PATH="/mnt/printshop/printshop-os/frontend/dist"

echo "🚀 Deploying frontend to $REMOTE_HOST..."
echo "📦 Source: $DIST_DIR"
echo "📍 Destination: $REMOTE_PATH"
echo ""

rsync -avz --progress --delete "$DIST_DIR/" "$REMOTE_HOST:$REMOTE_PATH/"

echo ""
echo "✅ Deploy complete!"
echo "🌐 Check: https://app.printshop.ronny.works"
