#!/bin/bash
# =============================================================================
# PrintShop OS Health Check & Auto-Recovery
# =============================================================================
# Features:
# - Checks Strapi, API, Frontend, PostgreSQL, Redis, MinIO
# - Auto-restarts unhealthy containers
# - Sends ntfy notifications on failures
# - Can run as cron job or systemd timer
#
# Usage:
#   ./scripts/health-check.sh           # Run once
#   ./scripts/health-check.sh --watch   # Continuous monitoring (10s interval)
#   ./scripts/health-check.sh --quiet   # Only output on failure
#
# Cron example (every 5 minutes):
#   */5 * * * * /path/to/printshop-os/scripts/health-check.sh --quiet
#
# =============================================================================

set -euo pipefail

# Configuration
STRAPI_URL="${STRAPI_URL:-http://100.92.156.118:1337}"
API_URL="${API_URL:-http://100.92.156.118:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://100.92.156.118:5173}"
NTFY_URL="${NTFY_URL:-http://100.92.156.118:8088}"
NTFY_TOPIC="${NTFY_TOPIC:-printshop-os}"
DOCKER_HOST="${DOCKER_HOST:-docker-host}"

# Parse arguments
WATCH=false
QUIET=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --watch) WATCH=true; shift ;;
        --quiet) QUIET=true; shift ;;
        *) shift ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# State tracking
declare -A LAST_STATE

log() {
    if [[ "$QUIET" == "false" ]]; then
        echo -e "$1"
    fi
}

notify() {
    local title="$1"
    local message="$2"
    local priority="${3:-default}"
    
    curl -s -o /dev/null \
        -H "Title: $title" \
        -H "Priority: $priority" \
        -H "Tags: printshop" \
        -d "$message" \
        "$NTFY_URL/$NTFY_TOPIC" 2>/dev/null || true
}

check_http() {
    local name="$1"
    local url="$2"
    local timeout="${3:-5}"
    
    if curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" | grep -q "200\|301\|302"; then
        log "${GREEN}✓${NC} $name"
        return 0
    else
        log "${RED}✗${NC} $name - $url not responding"
        return 1
    fi
}

check_container() {
    local name="$1"
    
    local status=$(ssh "$DOCKER_HOST" "docker inspect -f '{{.State.Health.Status}}' $name 2>/dev/null || docker inspect -f '{{.State.Status}}' $name 2>/dev/null" 2>/dev/null || echo "not_found")
    
    if [[ "$status" == "healthy" ]] || [[ "$status" == "running" ]]; then
        log "${GREEN}✓${NC} Container: $name ($status)"
        return 0
    else
        log "${RED}✗${NC} Container: $name ($status)"
        return 1
    fi
}

restart_container() {
    local name="$1"
    log "${YELLOW}🔄${NC} Restarting $name..."
    ssh "$DOCKER_HOST" "docker restart $name" 2>/dev/null
    notify "Container Restarted" "$name was unhealthy and has been restarted" "default"
}

run_health_check() {
    local failures=0
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    log "\n${YELLOW}═══════════════════════════════════════════════════${NC}"
    log " PrintShop OS Health Check - $timestamp"
    log "${YELLOW}═══════════════════════════════════════════════════${NC}\n"
    
    # Check HTTP endpoints
    log "${YELLOW}HTTP Endpoints:${NC}"
    check_http "Strapi API" "$STRAPI_URL/admin" || ((failures++))
    check_http "API Service" "$API_URL/health" 3 || true  # API might not have /health
    check_http "Frontend" "$FRONTEND_URL" || true  # Frontend might not be running
    
    # Check containers via SSH
    log "\n${YELLOW}Docker Containers:${NC}"
    for container in printshop-strapi printshop-postgres printshop-redis printshop-minio; do
        if ! check_container "$container"; then
            ((failures++))
            
            # Auto-restart unhealthy containers
            if [[ "$container" != "printshop-postgres" ]]; then
                restart_container "$container"
                sleep 10
                check_container "$container" || ((failures++))
            fi
        fi
    done
    
    # Check disk space
    log "\n${YELLOW}Disk Space:${NC}"
    local disk_usage=$(ssh "$DOCKER_HOST" "df -h / | tail -1 | awk '{print \$5}' | tr -d '%'" 2>/dev/null || echo "0")
    if [[ "$disk_usage" -gt 90 ]]; then
        log "${RED}✗${NC} Disk usage critical: ${disk_usage}%"
        notify "Disk Space Critical" "Docker host at ${disk_usage}% disk usage" "urgent"
        ((failures++))
    elif [[ "$disk_usage" -gt 80 ]]; then
        log "${YELLOW}⚠${NC} Disk usage warning: ${disk_usage}%"
    else
        log "${GREEN}✓${NC} Disk usage: ${disk_usage}%"
    fi
    
    # Summary
    log "\n${YELLOW}═══════════════════════════════════════════════════${NC}"
    if [[ $failures -eq 0 ]]; then
        log " ${GREEN}All systems operational${NC}"
    else
        log " ${RED}$failures issue(s) detected${NC}"
        if [[ "$QUIET" == "true" ]]; then
            # In quiet mode, output failures
            echo "[$timestamp] $failures health check failure(s)"
        fi
        notify "Health Check Failed" "$failures issue(s) detected" "high"
    fi
    log "${YELLOW}═══════════════════════════════════════════════════${NC}\n"
    
    return $failures
}

# Main
if [[ "$WATCH" == "true" ]]; then
    log "Starting continuous monitoring (Ctrl+C to stop)..."
    while true; do
        run_health_check || true
        sleep 10
    done
else
    run_health_check
fi
