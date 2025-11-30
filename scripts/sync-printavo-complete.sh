#!/bin/bash
#
# PrintShop OS - Complete Printavo Data Sync
# Runs ALL sync tasks in parallel with logging and checkpoints
# 
# Usage: ./scripts/sync-printavo-complete.sh [--dry-run]
#

set -e
cd "$(dirname "$0")/.."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
LOG_DIR="data/sync-logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MASTER_LOG="$LOG_DIR/master-sync-$TIMESTAMP.log"

# Strapi connection
STRAPI_URL="${STRAPI_URL:-http://100.92.156.118:1337}"
STRAPI_TOKEN="${STRAPI_TOKEN:-dc23c1734c2dea6fbbf0d57a96a06c91b72a868ffae261400be8b9dbe70b960fed09c0d53b6930b02f9315b1cce53b57d6155baf3019e366b419c687427306cf685421fd945f1b2ebb3cabd46fda2d209256a95ffedc3769bd9eeda29216925145b735e7ea6699792a47c15914d1548d8412284bd076cdf2f15250dd5090951e}"

mkdir -p "$LOG_DIR"

log() {
    echo -e "[$(date '+%H:%M:%S')] $1" | tee -a "$MASTER_LOG"
}

check_connection() {
    log "${BLUE}Checking Strapi connection...${NC}"
    if curl -s -o /dev/null -w "%{http_code}" "$STRAPI_URL/api/customers?pagination[pageSize]=1" \
        -H "Authorization: Bearer $STRAPI_TOKEN" | grep -q "200"; then
        log "${GREEN}✓ Strapi connected${NC}"
        return 0
    else
        log "${RED}✗ Cannot connect to Strapi at $STRAPI_URL${NC}"
        return 1
    fi
}

show_current_status() {
    log "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    log "${CYAN}  PRINTAVO → PRINTSHOP OS COMPLETE DATA SYNC${NC}"
    log "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    
    # Get current counts from Strapi
    CUSTOMERS=$(curl -s "$STRAPI_URL/api/customers?pagination[pageSize]=1&pagination[withCount]=true" \
        -H "Authorization: Bearer $STRAPI_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('meta',{}).get('pagination',{}).get('total',0))" 2>/dev/null || echo "?")
    ORDERS=$(curl -s "$STRAPI_URL/api/orders?pagination[pageSize]=1&pagination[withCount]=true" \
        -H "Authorization: Bearer $STRAPI_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('meta',{}).get('pagination',{}).get('total',0))" 2>/dev/null || echo "?")
    LINE_ITEMS=$(curl -s "$STRAPI_URL/api/line-items?pagination[pageSize]=1&pagination[withCount]=true" \
        -H "Authorization: Bearer $STRAPI_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('meta',{}).get('pagination',{}).get('total',0))" 2>/dev/null || echo "?")
    PRODUCTS=$(curl -s "$STRAPI_URL/api/products?pagination[pageSize]=1&pagination[withCount]=true" \
        -H "Authorization: Bearer $STRAPI_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('meta',{}).get('pagination',{}).get('total',0))" 2>/dev/null || echo "?")

    log ""
    log "  ${BLUE}Current Strapi Data:${NC}"
    log "  ├── Customers:  $CUSTOMERS / 3,358"
    log "  ├── Orders:     $ORDERS / 12,867"
    log "  ├── Line Items: $LINE_ITEMS / 44,158"
    log "  └── Products:   $PRODUCTS / 105"
    log ""
}

# Activate virtual environment
activate_venv() {
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
        log "${GREEN}✓ Virtual environment activated${NC}"
    else
        log "${YELLOW}⚠ No virtual environment found, using system Python${NC}"
    fi
}

# Trap for cleanup
PIDS=()
cleanup() {
    log "\n${YELLOW}Stopping sync processes...${NC}"
    for pid in "${PIDS[@]}"; do
        kill $pid 2>/dev/null || true
    done
    log "${GREEN}Sync stopped. Checkpoints saved. Run again to resume.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Main sync functions
sync_line_items() {
    log "${BLUE}▶ Starting Line Items sync...${NC}"
    python scripts/sync-line-items.py > "$LOG_DIR/line-items-$TIMESTAMP.log" 2>&1 &
    PIDS+=($!)
    log "  PID: $! | Log: $LOG_DIR/line-items-$TIMESTAMP.log"
}

sync_artwork() {
    log "${BLUE}▶ Starting Artwork sync to MinIO...${NC}"
    python scripts/sync-artwork-minio.py > "$LOG_DIR/artwork-$TIMESTAMP.log" 2>&1 &
    PIDS+=($!)
    log "  PID: $! | Log: $LOG_DIR/artwork-$TIMESTAMP.log"
}

sync_products() {
    log "${BLUE}▶ Starting Products sync...${NC}"
    python scripts/sync-products.py > "$LOG_DIR/products-$TIMESTAMP.log" 2>&1 &
    PIDS+=($!)
    log "  PID: $! | Log: $LOG_DIR/products-$TIMESTAMP.log"
}

sync_tasks() {
    log "${BLUE}▶ Starting Tasks sync...${NC}"
    python scripts/sync-tasks.py > "$LOG_DIR/tasks-$TIMESTAMP.log" 2>&1 &
    PIDS+=($!)
    log "  PID: $! | Log: $LOG_DIR/tasks-$TIMESTAMP.log"
}

# Monitor progress
monitor_progress() {
    while true; do
        sleep 30
        
        # Check if any processes are still running
        RUNNING=0
        for pid in "${PIDS[@]}"; do
            if kill -0 $pid 2>/dev/null; then
                RUNNING=$((RUNNING + 1))
            fi
        done
        
        if [ $RUNNING -eq 0 ]; then
            log "\n${GREEN}════════════════════════════════════════════${NC}"
            log "${GREEN}  ✅ ALL SYNC TASKS COMPLETED${NC}"
            log "${GREEN}════════════════════════════════════════════${NC}"
            show_current_status
            break
        fi
        
        # Show progress from checkpoints
        log "\n${BLUE}─── Progress Update ───${NC}"
        
        if [ -f "data/line-item-import-checkpoint.json" ]; then
            LI_PROGRESS=$(python3 -c "import json; c=json.load(open('data/line-item-import-checkpoint.json')); print(f\"{c.get('last_index',0):,} / 44,158\")" 2>/dev/null || echo "?")
            log "  Line Items: $LI_PROGRESS"
        fi
        
        if [ -f "data/artwork-upload-checkpoint.json" ]; then
            ART_PROGRESS=$(python3 -c "import json; c=json.load(open('data/artwork-upload-checkpoint.json')); print(f\"{len(c.get('uploaded_orders',[])):,} orders\")" 2>/dev/null || echo "?")
            log "  Artwork: $ART_PROGRESS"
        fi
        
        log "  Running processes: $RUNNING"
    done
}

# Main
main() {
    log ""
    log "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    log "${CYAN}║  PRINTSHOP OS - COMPLETE PRINTAVO DATA SYNC              ║${NC}"
    log "${CYAN}║  Started: $(date '+%Y-%m-%d %H:%M:%S')                         ║${NC}"
    log "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    log ""
    
    # Check if dry run
    if [ "$1" = "--dry-run" ]; then
        log "${YELLOW}DRY RUN MODE - No changes will be made${NC}"
        show_current_status
        exit 0
    fi
    
    activate_venv
    
    if ! check_connection; then
        log "${RED}Cannot proceed without Strapi connection${NC}"
        exit 1
    fi
    
    show_current_status
    
    log "${BLUE}Starting parallel sync tasks...${NC}"
    log ""
    
    # Start all syncs in parallel
    sync_line_items
    sync_artwork
    
    # These scripts need to be created if they don't exist
    if [ -f "scripts/sync-products.py" ]; then
        sync_products
    else
        log "${YELLOW}⚠ scripts/sync-products.py not found, skipping${NC}"
    fi
    
    if [ -f "scripts/sync-tasks.py" ]; then
        sync_tasks
    else
        log "${YELLOW}⚠ scripts/sync-tasks.py not found, skipping${NC}"
    fi
    
    log ""
    log "${GREEN}All sync tasks started. Monitoring progress...${NC}"
    log "${YELLOW}Press Ctrl+C to stop (checkpoints will be saved)${NC}"
    log ""
    
    # Monitor until complete
    monitor_progress
}

main "$@"
