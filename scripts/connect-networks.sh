#!/bin/bash
# =============================================================================
# PrintShop OS - Connect External Networks
# =============================================================================
# Connects PrintShop OS services to external Docker networks for cross-stack
# communication (Cloudflare Tunnel, Grafana, n8n, etc.)
#
# This script is useful when:
# - External networks weren't available during docker compose up
# - You need to reconnect after network changes
# - The tunnel_network was created after PrintShop OS was started
#
# Usage:
#   ./scripts/connect-networks.sh           # Connect to all external networks
#   ./scripts/connect-networks.sh --check   # Only check connection status
#
# See also: ./scripts/verify-network.sh for internal network diagnostics
# =============================================================================

set -euo pipefail

# Configuration
TUNNEL_CONTAINERS=(
    "printshop-strapi"
    "printshop-frontend"
    "printshop-api"
    "printshop-appsmith"
    "printshop-botpress"
)

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

# =============================================================================
# Connect to tunnel_network (for Cloudflare Tunnel access)
# =============================================================================
echo -e "${YELLOW}Cloudflare Tunnel Network (tunnel_network):${NC}"

if docker network inspect tunnel_network >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} tunnel_network exists"
    
    for container in "${TUNNEL_CONTAINERS[@]}"; do
        # Check if container exists
        if ! docker inspect "$container" &>/dev/null; then
            echo -e "  ${YELLOW}⚠${NC} $container - container not running (skipping)"
            continue
        fi
        
        # Check if already connected
        CONNECTED=$(docker inspect "$container" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}')
        if echo "$CONNECTED" | grep -q "tunnel_network"; then
            echo -e "  ${GREEN}✓${NC} $container - already connected"
        else
            if [[ "$CHECK_ONLY" == "true" ]]; then
                echo -e "  ${RED}✗${NC} $container - not connected"
            else
                echo -e "  ${YELLOW}→${NC} $container - connecting..."
                if docker network connect tunnel_network "$container" 2>/dev/null; then
                    echo -e "  ${GREEN}✓${NC} $container - connected successfully"
                else
                    echo -e "  ${RED}✗${NC} $container - failed to connect"
                fi
            fi
        fi
    done
else
    echo -e "  ${RED}✗${NC} tunnel_network not found"
    echo -e ""
    echo -e "  ${YELLOW}⚠️  Start the tunnel stack first:${NC}"
    echo -e "     cd ~/stacks/infrastructure/tunnel-stack"
    echo -e "     docker compose up -d"
    echo -e ""
fi

echo ""

# =============================================================================
# Connect to other external networks (optional, for cross-stack services)
# =============================================================================
echo -e "${YELLOW}Other External Networks (optional):${NC}"

for network in "${EXTERNAL_NETWORKS[@]}"; do
    # Check if network exists
    if ! docker network inspect "$network" &>/dev/null 2>&1; then
        echo -e "  ${YELLOW}⚠${NC} $network - network does not exist (skipping)"
        continue
    fi
    
    # For other networks, we still connect printshop-api (if it needs to reach services on those networks)
    if docker inspect printshop-api &>/dev/null; then
        CONNECTED=$(docker inspect printshop-api --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}')
        if echo "$CONNECTED" | grep -q "$network"; then
            echo -e "  ${GREEN}✓${NC} $network - printshop-api already connected"
        else
            if [[ "$CHECK_ONLY" == "true" ]]; then
                echo -e "  ${RED}✗${NC} $network - printshop-api not connected"
            else
                echo -e "  ${YELLOW}→${NC} $network - connecting printshop-api..."
                if docker network connect "$network" printshop-api 2>/dev/null; then
                    echo -e "  ${GREEN}✓${NC} $network - printshop-api connected"
                else
                    echo -e "  ${RED}✗${NC} $network - failed to connect printshop-api"
                fi
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
    
    # Test internal services
    if docker exec printshop-api wget -q --spider --timeout=3 http://printshop-frontend:3000 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} Frontend - reachable from API"
    else
        echo -e "  ${YELLOW}⚠${NC} Frontend - not reachable from API"
    fi
    
    if docker exec printshop-api wget -q --spider --timeout=3 http://printshop-strapi:1337 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} Strapi - reachable from API"
    else
        echo -e "  ${YELLOW}⚠${NC} Strapi - not reachable from API"
    fi
    
    # Test Grafana (if observability network connected)
    if docker exec printshop-api wget -q --spider --timeout=3 http://grafana:3000 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} Grafana - reachable"
    else
        echo -e "  ${YELLOW}⚠${NC} Grafana - not reachable (may be offline or on different network)"
    fi
    
    # Test n8n (if automation network connected)
    if docker exec printshop-api wget -q --spider --timeout=3 http://n8n:5678 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} n8n - reachable"
    else
        echo -e "  ${YELLOW}⚠${NC} n8n - not reachable (may be offline or on different network)"
    fi
    
    echo ""
fi
