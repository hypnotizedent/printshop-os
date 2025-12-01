#!/bin/bash
# =============================================================================
# PrintShop OS - Network Connectivity Verification
# =============================================================================
# Verifies that all PrintShop containers can reach each other on the
# printshop_network. Useful for diagnosing 502 Bad Gateway errors.
#
# Usage:
#   ./scripts/verify-network.sh           # Full verification
#   ./scripts/verify-network.sh --quick   # Quick DNS-only check
#
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NETWORK_NAME="printshop_network"
QUICK_CHECK=false

# Parse arguments
if [[ "${1:-}" == "--quick" ]]; then
    QUICK_CHECK=true
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e " PrintShop OS - Network Connectivity Verification"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}\n"

# Check if network exists
if ! docker network inspect "$NETWORK_NAME" &>/dev/null; then
    echo -e "${RED}✗${NC} Network '$NETWORK_NAME' does not exist"
    echo -e "  Run 'docker compose up -d' to create the network"
    exit 1
fi

echo -e "${GREEN}✓${NC} Network '$NETWORK_NAME' exists\n"

# Get network details
SUBNET=$(docker network inspect "$NETWORK_NAME" --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}')
echo -e "${YELLOW}Network Configuration:${NC}"
echo -e "  Subnet: $SUBNET"
echo ""

# List containers on the network
echo -e "${YELLOW}Containers on $NETWORK_NAME:${NC}"
CONTAINERS=$(docker network inspect "$NETWORK_NAME" --format '{{range $k, $v := .Containers}}{{$v.Name}} {{end}}')

if [[ -z "$CONTAINERS" ]]; then
    echo -e "  ${RED}No containers found on network${NC}"
    exit 1
fi

for container in $CONTAINERS; do
    IP=$(docker inspect "$container" --format "{{range .NetworkSettings.Networks}}{{if eq .NetworkID \"$(docker network inspect $NETWORK_NAME --format '{{.Id}}')\"}}{{.IPAddress}}{{end}}{{end}}" 2>/dev/null || echo "N/A")
    echo -e "  - $container (${IP:-N/A})"
done
echo ""

# Define critical services to test
declare -A SERVICES
SERVICES["printshop-frontend"]="3000"
SERVICES["printshop-strapi"]="1337"
SERVICES["printshop-api"]="3001"
SERVICES["printshop-cloudflared"]=""

# Check if cloudflared container exists
if ! docker inspect printshop-cloudflared &>/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} printshop-cloudflared container not found"
    echo -e "  Using printshop-api as test container instead\n"
    TEST_CONTAINER="printshop-api"
else
    TEST_CONTAINER="printshop-cloudflared"
fi

echo -e "${YELLOW}Testing DNS Resolution from $TEST_CONTAINER:${NC}"
ERRORS=0

for service in "${!SERVICES[@]}"; do
    if [[ "$service" == "$TEST_CONTAINER" ]]; then
        continue
    fi
    
    # Try to resolve the hostname
    if docker exec "$TEST_CONTAINER" getent hosts "$service" &>/dev/null 2>&1; then
        IP=$(docker exec "$TEST_CONTAINER" getent hosts "$service" 2>/dev/null | awk '{print $1}')
        echo -e "  ${GREEN}✓${NC} $service resolves to $IP"
    else
        # Try nslookup as fallback
        if docker exec "$TEST_CONTAINER" nslookup "$service" &>/dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $service - DNS resolves"
        else
            echo -e "  ${RED}✗${NC} $service - DNS resolution FAILED"
            ((ERRORS++))
        fi
    fi
done
echo ""

# Quick check stops here
if [[ "$QUICK_CHECK" == "true" ]]; then
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    if [[ $ERRORS -gt 0 ]]; then
        echo -e " ${RED}Quick check failed with $ERRORS DNS errors${NC}"
        exit 1
    else
        echo -e " ${GREEN}Quick check passed - all DNS resolutions successful${NC}"
    fi
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}\n"
    exit 0
fi

echo -e "${YELLOW}Testing HTTP Connectivity from $TEST_CONTAINER:${NC}"

for service in "${!SERVICES[@]}"; do
    port="${SERVICES[$service]}"
    
    if [[ -z "$port" ]] || [[ "$service" == "$TEST_CONTAINER" ]]; then
        continue
    fi
    
    URL="http://${service}:${port}"
    
    # Try wget first (available in Alpine-based images)
    if docker exec "$TEST_CONTAINER" wget -q --spider --timeout=5 "$URL" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $URL - reachable"
    elif docker exec "$TEST_CONTAINER" curl -sf --max-time 5 "$URL" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} $URL - reachable"
    else
        echo -e "  ${RED}✗${NC} $URL - NOT reachable"
        ((ERRORS++))
    fi
done
echo ""

# Test from cloudflared specifically if it exists
if [[ "$TEST_CONTAINER" == "printshop-cloudflared" ]]; then
    echo -e "${YELLOW}Cloudflared-Specific Tests:${NC}"
    
    # Check if cloudflared is healthy
    HEALTH=$(docker inspect printshop-cloudflared --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    if [[ "$HEALTH" == "healthy" ]]; then
        echo -e "  ${GREEN}✓${NC} Cloudflared health status: $HEALTH"
    else
        echo -e "  ${YELLOW}⚠${NC} Cloudflared health status: $HEALTH"
    fi
    
    # Check tunnel connection
    if docker logs printshop-cloudflared --tail 20 2>&1 | grep -q "Registered tunnel connection"; then
        echo -e "  ${GREEN}✓${NC} Tunnel connection registered"
    else
        echo -e "  ${YELLOW}⚠${NC} Tunnel connection status unknown (check logs)"
    fi
    echo ""
fi

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
if [[ $ERRORS -gt 0 ]]; then
    echo -e " ${RED}Verification FAILED with $ERRORS errors${NC}"
    echo -e ""
    echo -e " ${YELLOW}Troubleshooting tips:${NC}"
    echo -e "   1. Ensure all containers are running: docker compose ps"
    echo -e "   2. Check container logs: docker compose logs [service]"
    echo -e "   3. Verify services are healthy: docker ps --filter name=printshop"
    echo -e "   4. Try restarting the stack: docker compose down && docker compose up -d"
    exit 1
else
    echo -e " ${GREEN}Verification PASSED - all services reachable${NC}"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}\n"
