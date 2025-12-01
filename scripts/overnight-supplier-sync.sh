#!/usr/bin/env bash
# Overnight Supplier Data Sync
# 
# Two-Tier Product Sync:
# 1. Top Products (Strapi) - ~500 most-used SKUs for quick quoting
# 2. Full Catalog (JSONL) - 500K+ products for AI agent queries
#
# What this does:
# 1. Analyzes order history to identify top products
# 2. Syncs top products to Strapi with full details
# 3. Downloads SanMar EPDD.csv (494MB) via SFTP
# 4. Transforms to unified product format
# 5. Saves to local JSONL files for API queries
#
# Run with: nohup ./scripts/overnight-supplier-sync.sh > overnight.log 2>&1 &
# Monitor with: tail -f overnight.log
# 
# Cron: 0 2 * * * /path/to/scripts/overnight-supplier-sync.sh
#
# Estimated time: 1-2 hours (mostly download time)
# Estimated disk: ~600MB (raw CSV + transformed JSONL)

set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

LOG_FILE="$PROJECT_ROOT/overnight.log"
SUPPLIER_SYNC="$PROJECT_ROOT/services/supplier-sync"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}✓ $1${NC}"
}

log_warn() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}⚠ $1${NC}"
}

log_error() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}✗ $1${NC}"
}

# Create data directories
mkdir -p "$SUPPLIER_SYNC/data/sanmar"
mkdir -p "$SUPPLIER_SYNC/data/ss-activewear"

# ============================================================
# TASK 0: Analyze Order History for Top Products
# ============================================================
log "============================================================"
log "TASK 0: Analyzing Order History for Top 500 Products"
log "============================================================"

if [ -f "$PROJECT_ROOT/scripts/supplier-sync.py" ]; then
    log "Running product analyzer..."
    cd "$PROJECT_ROOT"
    
    if python3 scripts/supplier-sync.py analyze --limit 500 2>&1; then
        log_success "Product analysis complete!"
    else
        log_warn "Product analysis failed (non-critical)"
    fi
else
    log_warn "supplier-sync.py not found, skipping analysis"
fi

# ============================================================
# TASK 1: Sync Top Products to Strapi
# ============================================================
log ""
log "============================================================"
log "TASK 1: Syncing Top Products to Strapi"
log "============================================================"

if [ -n "$STRAPI_API_TOKEN" ] && [ -f "$PROJECT_ROOT/scripts/supplier-sync.py" ]; then
    log "Syncing top 500 products to Strapi..."
    cd "$PROJECT_ROOT"
    
    if python3 scripts/supplier-sync.py sync-top-products --limit 500 2>&1; then
        log_success "Top products sync complete!"
    else
        log_warn "Top products sync failed (check STRAPI_API_TOKEN)"
    fi
else
    log_warn "Skipping Strapi sync (STRAPI_API_TOKEN not set or script missing)"
fi

# ============================================================
# TASK 2: SanMar SFTP Download + Transform
# ============================================================
log "============================================================"
log "TASK 2: SanMar EPDD Download (494MB expected)"
log "============================================================"

cd "$SUPPLIER_SYNC"

# Check for .env
if [ ! -f ".env" ]; then
    log_error ".env file not found in services/supplier-sync/"
    exit 1
fi

# Set environment for JSONL output location
export ASCOLOUR_DATA_DIR="$SUPPLIER_SYNC/data/sanmar"

log "Starting SanMar SFTP download and transform..."
log "Output will be saved to: $SUPPLIER_SYNC/data/sanmar/products.jsonl"

# Run the sync (non-dry-run to persist)
if npx ts-node src/cli/sync-sanmar.ts 2>&1; then
    log_success "SanMar sync completed!"
    
    # Check output file
    if [ -f "$SUPPLIER_SYNC/data/sanmar/products.jsonl" ]; then
        SANMAR_PRODUCTS=$(wc -l < "$SUPPLIER_SYNC/data/sanmar/products.jsonl")
        SANMAR_SIZE=$(du -h "$SUPPLIER_SYNC/data/sanmar/products.jsonl" | cut -f1)
        log_success "SanMar: $SANMAR_PRODUCTS products saved ($SANMAR_SIZE)"
    fi
else
    log_error "SanMar sync failed"
fi

# ============================================================
# TASK 3: S&S Activewear API Fetch (211K+ products)
# ============================================================
log ""
log "============================================================"
log "TASK 3: S&S Activewear API Fetch (211K+ products)"
log "============================================================"

# Set output location
export ASCOLOUR_DATA_DIR="$SUPPLIER_SYNC/data/ss-activewear"

log "Starting S&S Activewear API sync..."
log "Output will be saved to: $SUPPLIER_SYNC/data/ss-activewear/products.jsonl"
log "Note: This may take 1-2 hours for full catalog"

# First test with dry-run
log "Testing connection with dry-run..."
if npx ts-node src/cli/sync-ss-activewear.ts --dry-run --brand 65 2>&1; then
    log_success "API connection verified"
    
    # Full sync (will take a while)
    # Commented out for safety - uncomment to enable full sync
    # log "Starting full catalog sync..."
    # npx ts-node src/cli/sync-ss-activewear.ts 2>&1
    
    log_warn "Full S&S sync disabled (would take hours)"
    log_warn "To enable, edit scripts/overnight-supplier-sync.sh and uncomment lines 94-95"
else
    log_error "S&S Activewear API connection failed"
fi

# ============================================================
# SUMMARY
# ============================================================
log ""
log "============================================================"
log "OVERNIGHT SYNC SUMMARY"
log "============================================================"

echo ""
echo "Files created:"
ls -lh "$SUPPLIER_SYNC/data/"*/products.jsonl 2>/dev/null || echo "  No JSONL files found"

echo ""
echo "Top Products synced to Strapi: Check via API"
echo "  curl -s ${STRAPI_URL:-http://localhost:1337}/api/products?filters[isTopProduct]=true | jq '.meta.pagination.total'"

echo ""
echo "Overnight sync schedule:"
echo "  Daily (2 AM):  Inventory updates + Top products refresh"
echo "  Weekly (Sun):  Full catalog refresh"
echo ""

log_success "Overnight sync completed at $(date)"
