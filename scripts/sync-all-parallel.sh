#!/bin/bash
#
# PrintShop OS - Parallel Data Sync
# Runs line item import and artwork upload in parallel
# with live status monitoring
#

set -e

cd "$(dirname "$0")/.."
source .venv/bin/activate

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          PrintShop OS - Parallel Data Sync                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Create log files
LOG_DIR="data/sync-logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LINE_ITEMS_LOG="$LOG_DIR/line-items-$TIMESTAMP.log"
ARTWORK_LOG="$LOG_DIR/artwork-$TIMESTAMP.log"

# Trap for cleanup
cleanup() {
    echo -e "\n${YELLOW}Stopping sync processes...${NC}"
    kill $LINE_ITEMS_PID 2>/dev/null || true
    kill $ARTWORK_PID 2>/dev/null || true
    echo -e "${GREEN}Cleanup complete. Check logs in $LOG_DIR${NC}"
}
trap cleanup EXIT

# Start line items sync in background
echo -e "${GREEN}▶ Starting Line Items Import...${NC}"
python scripts/sync-line-items.py > "$LINE_ITEMS_LOG" 2>&1 &
LINE_ITEMS_PID=$!

# Start artwork sync in background
echo -e "${GREEN}▶ Starting Artwork Upload to MinIO...${NC}"
python scripts/sync-artwork-minio.py > "$ARTWORK_LOG" 2>&1 &
ARTWORK_PID=$!

echo ""
echo -e "${BLUE}Monitoring sync progress (Ctrl+C to stop)...${NC}"
echo ""

# Status monitoring loop
while true; do
    sleep 5
    
    # Check if processes are still running
    LINE_RUNNING=false
    ARTWORK_RUNNING=false
    
    if kill -0 $LINE_ITEMS_PID 2>/dev/null; then
        LINE_RUNNING=true
    fi
    
    if kill -0 $ARTWORK_PID 2>/dev/null; then
        ARTWORK_RUNNING=true
    fi
    
    # Get stats from checkpoints
    if [ -f "data/line-item-import-checkpoint.json" ]; then
        LINE_PROGRESS=$(python3 -c "
import json
with open('data/line-item-import-checkpoint.json') as f:
    c = json.load(f)
print(f\"{c.get('last_index', 0):,} items\")
" 2>/dev/null || echo "unknown")
    else
        LINE_PROGRESS="starting..."
    fi
    
    if [ -f "data/artwork-upload-checkpoint.json" ]; then
        ART_PROGRESS=$(python3 -c "
import json
with open('data/artwork-upload-checkpoint.json') as f:
    c = json.load(f)
print(f\"{len(c.get('uploaded_orders', [])):,} orders\")
" 2>/dev/null || echo "unknown")
    else
        ART_PROGRESS="starting..."
    fi
    
    # Display status
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗"
    echo -e "║          PrintShop OS - Sync Status                        ║"
    echo -e "╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    if $LINE_RUNNING; then
        echo -e "  📦 Line Items: ${GREEN}RUNNING${NC} - $LINE_PROGRESS"
    else
        echo -e "  📦 Line Items: ${YELLOW}STOPPED${NC} - $LINE_PROGRESS"
    fi
    
    if $ARTWORK_RUNNING; then
        echo -e "  🎨 Artwork:    ${GREEN}RUNNING${NC} - $ART_PROGRESS"
    else
        echo -e "  🎨 Artwork:    ${YELLOW}STOPPED${NC} - $ART_PROGRESS"
    fi
    
    echo ""
    echo -e "  ${BLUE}Logs:${NC}"
    echo -e "    Line Items: $LINE_ITEMS_LOG"
    echo -e "    Artwork:    $ARTWORK_LOG"
    echo ""
    echo -e "  ${YELLOW}Press Ctrl+C to stop${NC}"
    
    # Check if both finished
    if ! $LINE_RUNNING && ! $ARTWORK_RUNNING; then
        echo ""
        echo -e "${GREEN}✅ Both syncs completed!${NC}"
        break
    fi
done
