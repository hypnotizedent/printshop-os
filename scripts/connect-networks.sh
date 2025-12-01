#!/bin/bash
# =============================================================================
# PrintShop OS - Connect External Networks (Optional)
# =============================================================================
# Manually connects the printshop-cloudflared container to external Docker
# networks for cross-stack communication (Grafana, n8n, etc.)
#
# NOTE: External networks are OPTIONAL. PrintShop OS core services
# (frontend, strapi, api) work without them. This script is only needed
# if you want cloudflared to also proxy external homelab services like
# Grafana or n8n.
#
# This script is useful when:
# - You want cross-stack communication to homelab services
# - External networks weren't available during docker compose up
# - You need to reconnect after network changes
# - The networks were created after PrintShop OS was started
#
# Usage:
#   ./scripts/connect-networks.sh           # Connect to all external networks
#   ./scripts/connect-networks.sh --check   # Only check connection status
#
# See also: ./scripts/verify-network.sh for internal network diagnostics
# =============================================================================

set -euo pipefail

# Configuration
CONTAINER_NAME="printshop-cloudflared"
EXTERNAL_NETWORKS=(
    "observability-stack_monitoring"
    "automation-stack_n8n"
    "homelab-network"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse arguments
CHECK_ONLY=false
if [[ "${1:-}" == "--check" ]]; then
    CHECK_ONLY=true
fi

echo -e "\n${YELLOW}═══════════════════════════════════════════════════${NC}"
echo -e " PrintShop OS - External Network Connector"
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}\n"

# Check if container exists
if ! docker inspect "$CONTAINER_NAME" &>/dev/null; then
    echo -e "${RED}✗${NC} Container '$CONTAINER_NAME' not found"
    echo -e "  Run 'docker compose up -d cloudflared' first"
    exit 1
fi

echo -e "${GREEN}✓${NC} Container '$CONTAINER_NAME' exists\n"

# Get currently connected networks
CONNECTED_NETWORKS=$(docker inspect "$CONTAINER_NAME" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}')

echo -e "${YELLOW}Currently connected networks:${NC}"
for net in $CONNECTED_NETWORKS; do
    echo -e "  - $net"
done
echo ""

# Check/connect to each external network
echo -e "${YELLOW}External networks:${NC}"
for network in "${EXTERNAL_NETWORKS[@]}"; do
    # Check if network exists
    if ! docker network inspect "$network" &>/dev/null 2>&1; then
        echo -e "  ${YELLOW}⚠${NC} $network - network does not exist (skipping)"
        continue
    fi
    
    # Check if already connected
    if echo "$CONNECTED_NETWORKS" | grep -q "$network"; then
        echo -e "  ${GREEN}✓${NC} $network - already connected"
    else
        if [[ "$CHECK_ONLY" == "true" ]]; then
            echo -e "  ${RED}✗${NC} $network - not connected"
        else
            echo -e "  ${YELLOW}→${NC} $network - connecting..."
            if docker network connect "$network" "$CONTAINER_NAME" 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} $network - connected successfully"
            else
                echo -e "  ${RED}✗${NC} $network - failed to connect"
            fi
        fi
    fi
done

echo -e "\n${YELLOW}═══════════════════════════════════════════════════${NC}"
if [[ "$CHECK_ONLY" == "true" ]]; then
    echo -e " Check complete"
else
    echo -e " Network connection complete"
fi
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}\n"

# Test connectivity if not check-only
if [[ "$CHECK_ONLY" == "false" ]]; then
    echo -e "${YELLOW}Testing connectivity:${NC}"
    
    # Test Grafana (if observability network connected)
    if docker exec "$CONTAINER_NAME" wget -q --spider --timeout=3 http://grafana:3000 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} Grafana - reachable"
    else
        echo -e "  ${YELLOW}⚠${NC} Grafana - not reachable (may be offline or on different network)"
    fi
    
    # Test n8n (if automation network connected)
    if docker exec "$CONTAINER_NAME" wget -q --spider --timeout=3 http://n8n:5678 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} n8n - reachable"
    else
        echo -e "  ${YELLOW}⚠${NC} n8n - not reachable (may be offline or on different network)"
    fi
    
    echo ""
fi
