#!/bin/bash
# Sync artwork archive to MinIO on docker-host
# Usage: ./sync-artwork-to-minio.sh [--watch]

set -e

ARTWORK_DIR="/Users/ronnyworks/Projects/printshop-os/data/artwork"
MINIO_HOST="docker-host"
MINIO_BUCKET="artwork-archive"
MINIO_PORT="9000"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Artwork Archive Sync${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if artwork directory exists
if [ ! -d "$ARTWORK_DIR" ]; then
    echo -e "${YELLOW}⚠️  No artwork directory found at $ARTWORK_DIR${NC}"
    exit 1
fi

# Count files to sync
FILE_COUNT=$(find "$ARTWORK_DIR" -type f ! -name "*.log" ! -name "checkpoint.json" | wc -l | tr -d ' ')
DIR_SIZE=$(du -sh "$ARTWORK_DIR" 2>/dev/null | cut -f1)

echo -e "📁 Source: $ARTWORK_DIR"
echo -e "🎯 Target: minio://$MINIO_HOST:$MINIO_PORT/$MINIO_BUCKET"
echo -e "📊 Files: $FILE_COUNT | Size: $DIR_SIZE"
echo ""

# MinIO data path on docker-host
MINIO_DATA="/home/docker-host/stacks/infrastructure/minio-data"

# Create bucket directory if needed
echo -e "${BLUE}🔄 Syncing to docker-host...${NC}"
ssh "$MINIO_HOST" "mkdir -p $MINIO_DATA/$MINIO_BUCKET/by_customer $MINIO_DATA/$MINIO_BUCKET/by_order"

# Sync by_customer folder (actual files)
rsync -avz --progress \
    --exclude='*.log' \
    --exclude='checkpoint.json' \
    "$ARTWORK_DIR/by_customer/" \
    "$MINIO_HOST:$MINIO_DATA/$MINIO_BUCKET/by_customer/"

# Sync by_order folder (symlinks converted to referential structure)
echo -e "${BLUE}🔗 Syncing order index...${NC}"
rsync -avzL --progress \
    "$ARTWORK_DIR/by_order/" \
    "$MINIO_HOST:$MINIO_DATA/$MINIO_BUCKET/by_order/"

# Sync index.json
if [ -f "$ARTWORK_DIR/index.json" ]; then
    echo -e "${BLUE}📋 Syncing index...${NC}"
    rsync -avz --progress \
        "$ARTWORK_DIR/index.json" \
        "$MINIO_HOST:$MINIO_DATA/$MINIO_BUCKET/"
fi

echo ""
echo -e "${GREEN}✅ Sync complete!${NC}"
echo ""
echo -e "📱 Access artwork at:"
echo -e "   Web Console: http://docker-host:9001"
echo -e "   API: http://docker-host:9000/$MINIO_BUCKET"
echo ""

# Watch mode
if [ "$1" == "--watch" ]; then
    echo -e "${YELLOW}👀 Watch mode enabled - syncing every 5 minutes${NC}"
    while true; do
        sleep 300
        echo -e "\n${BLUE}[$(date '+%H:%M:%S')] Running sync...${NC}"
        rsync -avz --quiet \
            --exclude='*.log' \
            --exclude='checkpoint.json' \
            "$ARTWORK_DIR/by_customer/" \
            "$MINIO_HOST:$MINIO_DATA/$MINIO_BUCKET/by_customer/"
        
        if [ -f "$ARTWORK_DIR/index.json" ]; then
            rsync -avz --quiet \
                "$ARTWORK_DIR/index.json" \
                "$MINIO_HOST:$MINIO_DATA/$MINIO_BUCKET/"
        fi
        echo -e "${GREEN}✓ Synced${NC}"
    done
fi
