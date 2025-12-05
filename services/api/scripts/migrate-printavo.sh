#!/bin/bash
################################################################################
# Printavo to Strapi Migration Script
#
# This script orchestrates the complete migration process:
# 1. Extract data from Printavo
# 2. Validate extracted data
# 3. Import into Strapi
# 4. Generate migration report
#
# Usage:
#   ./migrate-printavo.sh                          # Full migration
#   ./migrate-printavo.sh --incremental            # Incremental sync
#   ./migrate-printavo.sh --incremental --since="2025-12-04"
#
# Environment Variables Required:
#   PRINTAVO_EMAIL - Printavo account email
#   PRINTAVO_TOKEN - Printavo API token
#   STRAPI_URL - Strapi base URL
#   STRAPI_API_TOKEN - Strapi API token
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}"
    echo ""
}

check_env_vars() {
    local missing_vars=()
    
    if [ -z "$PRINTAVO_EMAIL" ]; then
        missing_vars+=("PRINTAVO_EMAIL")
    fi
    
    if [ -z "$PRINTAVO_TOKEN" ]; then
        missing_vars+=("PRINTAVO_TOKEN")
    fi
    
    if [ -z "$STRAPI_URL" ]; then
        missing_vars+=("STRAPI_URL")
    fi
    
    if [ -z "$STRAPI_API_TOKEN" ]; then
        missing_vars+=("STRAPI_API_TOKEN")
    fi
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
}

validate_extraction() {
    local extraction_dir=$1
    
    log_info "Validating extracted data..."
    
    if [ ! -d "$extraction_dir" ]; then
        log_error "Extraction directory not found: $extraction_dir"
        return 1
    fi
    
    local orders_file="$extraction_dir/orders.json"
    local summary_file="$extraction_dir/summary.json"
    
    if [ ! -f "$orders_file" ]; then
        log_error "orders.json not found in extraction directory"
        return 1
    fi
    
    if [ ! -f "$summary_file" ]; then
        log_warning "summary.json not found, but continuing..."
    fi
    
    # Check if orders.json is valid JSON
    if ! jq empty "$orders_file" 2>/dev/null; then
        log_error "orders.json is not valid JSON"
        return 1
    fi
    
    local order_count=$(jq '. | length' "$orders_file")
    log_info "Found $order_count orders in extracted data"
    
    if [ "$order_count" -eq 0 ]; then
        log_warning "No orders found in extraction"
    fi
    
    log_success "Validation passed"
    return 0
}

check_strapi_connection() {
    log_info "Checking Strapi connection..."
    
    # Use header file to avoid exposing token in process list
    local header_file=$(mktemp)
    echo "Authorization: Bearer $STRAPI_API_TOKEN" > "$header_file"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H @"$header_file" \
        "$STRAPI_URL/api/customers?pagination[limit]=1")
    
    rm -f "$header_file"
    
    if [ "$response" -eq 200 ] || [ "$response" -eq 404 ]; then
        log_success "Strapi is accessible"
        return 0
    else
        log_error "Cannot connect to Strapi (HTTP $response)"
        log_error "URL: $STRAPI_URL"
        return 1
    fi
}

################################################################################
# Main Migration Steps
################################################################################

run_extraction() {
    local args=$1
    
    print_header "Step 1: Extract Data from Printavo"
    
    log_info "Starting extraction..."
    log_info "Arguments: $args"
    
    if node printavo-extract.js $args; then
        log_success "Extraction completed successfully"
        
        # Find the most recent extraction directory
        local base_dir="/app/data/printavo-final"
        if [ -d "$base_dir" ]; then
            EXTRACTION_DIR=$(ls -dt "$base_dir"/*/ 2>/dev/null | head -1)
            EXTRACTION_DIR=${EXTRACTION_DIR%/}  # Remove trailing slash
            log_info "Extraction directory: $EXTRACTION_DIR"
        else
            log_error "Base directory not found: $base_dir"
            return 1
        fi
        
        return 0
    else
        log_error "Extraction failed"
        return 1
    fi
}

run_import() {
    local extraction_dir=$1
    
    print_header "Step 2: Import Data into Strapi"
    
    log_info "Starting import from: $extraction_dir"
    
    if node strapi-import.js "$extraction_dir"; then
        log_success "Import completed successfully"
        return 0
    else
        log_error "Import failed"
        return 1
    fi
}

generate_report() {
    local extraction_dir=$1
    
    print_header "Migration Report"
    
    local summary_file="$extraction_dir/summary.json"
    local import_summary_file="$extraction_dir/import-summary.json"
    
    if [ -f "$summary_file" ]; then
        log_info "Extraction Summary:"
        echo ""
        jq . "$summary_file" 2>/dev/null || cat "$summary_file"
        echo ""
    fi
    
    if [ -f "$import_summary_file" ]; then
        log_info "Import Summary:"
        echo ""
        jq . "$import_summary_file" 2>/dev/null || cat "$import_summary_file"
        echo ""
    fi
    
    log_success "Migration report generated"
    log_info "Full details available in: $extraction_dir"
}

################################################################################
# Main Script
################################################################################

main() {
    local start_time=$(date +%s)
    
    # Parse arguments
    local extraction_args=""
    local is_incremental=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --incremental)
                is_incremental=true
                shift
                ;;
            --since=*)
                extraction_args="$extraction_args $1"
                shift
                ;;
            *)
                log_error "Unknown argument: $1"
                echo "Usage: $0 [--incremental] [--since=YYYY-MM-DD]"
                exit 1
                ;;
        esac
    done
    
    print_header "Printavo to Strapi Migration"
    
    if [ "$is_incremental" = true ]; then
        log_info "Mode: Incremental Sync"
    else
        log_info "Mode: Full Migration"
    fi
    
    # Pre-flight checks
    log_info "Running pre-flight checks..."
    check_env_vars
    check_strapi_connection
    
    # Step 1: Extract
    if ! run_extraction "$extraction_args"; then
        log_error "Migration failed at extraction step"
        exit 1
    fi
    
    # Step 2: Validate
    if ! validate_extraction "$EXTRACTION_DIR"; then
        log_error "Migration failed at validation step"
        exit 1
    fi
    
    # Step 3: Import
    if ! run_import "$EXTRACTION_DIR"; then
        log_error "Migration failed at import step"
        exit 1
    fi
    
    # Step 4: Report
    generate_report "$EXTRACTION_DIR"
    
    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local duration_mins=$((duration / 60))
    local duration_secs=$((duration % 60))
    
    print_header "✅ Migration Complete!"
    log_success "Total duration: ${duration_mins}m ${duration_secs}s"
    log_info "Data location: $EXTRACTION_DIR"
    
    echo ""
    log_info "Next steps:"
    echo "  1. Review the migration report above"
    echo "  2. Check Strapi admin panel: $STRAPI_URL/admin"
    echo "  3. Verify customer and order data"
    echo ""
    
    if [ "$is_incremental" = false ]; then
        echo -e "${YELLOW}💡 For incremental syncs during transition period, run:${NC}"
        echo "   $0 --incremental --since=\"\$(date -I)\""
        echo ""
    fi
}

# Run main function
main "$@"
