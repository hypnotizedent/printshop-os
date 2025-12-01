#!/bin/bash
# =============================================================================
# PrintShop OS - Start with Cloudflare Tunnel Connectivity
# =============================================================================
# Starts PrintShop OS and ensures connectivity to the centralized Cloudflare
# Tunnel managed by homelab-infrastructure/stacks/tunnel-stack/
#
# Prerequisites:
# 1. homelab-infrastructure/stacks/tunnel-stack must be running
# 2. tunnel_network must exist
#
# Usage:
#   ./scripts/start-with-tunnel.sh
#
# For more information, see docs/CLOUDFLARE_TUNNEL_SETUP.md
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}═══════════════════════════════════════════════════${NC}"
echo -e " PrintShop OS - Starting with Tunnel Connectivity"
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}\n"

# =============================================================================
# Step 1: Check if tunnel_network exists
# =============================================================================
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! docker network inspect tunnel_network >/dev/null 2>&1; then
    echo -e "${RED}❌ ERROR: tunnel_network not found${NC}"
    echo -e ""
    echo -e "The Cloudflare Tunnel stack must be running before starting PrintShop OS."
    echo -e ""
    echo -e "${YELLOW}Please start the tunnel stack first:${NC}"
    echo -e "  cd ~/stacks/infrastructure/tunnel-stack"
    echo -e "  docker compose up -d"
    echo -e ""
    echo -e "Then run this script again."
    exit 1
fi

echo -e "  ${GREEN}✓${NC} tunnel_network found"

# Check if cloudflared is running on tunnel_network
CLOUDFLARED_RUNNING=$(docker ps --filter "network=tunnel_network" --filter "name=cloudflared" --format "{{.Names}}" 2>/dev/null || true)
if [[ -n "$CLOUDFLARED_RUNNING" ]]; then
    echo -e "  ${GREEN}✓${NC} cloudflared container running on tunnel_network"
else
    echo -e "  ${YELLOW}⚠${NC} cloudflared container not detected on tunnel_network"
    echo -e "     Services will start but may not be publicly accessible"
fi

echo ""

# =============================================================================
# Step 2: Start the stack
# =============================================================================
echo -e "${YELLOW}Starting PrintShop OS stack...${NC}"

docker compose up -d

echo -e "  ${GREEN}✓${NC} Docker Compose started"
echo ""

# =============================================================================
# Step 3: Wait for services to become healthy
# =============================================================================
echo -e "${YELLOW}Waiting for services to become healthy (this may take a few minutes)...${NC}"

# Wait a bit for containers to start
sleep 10

# Check key services
SERVICES_TO_CHECK=(
    "printshop-strapi"
    "printshop-frontend"
    "printshop-api"
)

MAX_WAIT=180  # 3 minutes
WAIT_INTERVAL=10

for service in "${SERVICES_TO_CHECK[@]}"; do
    echo -n "  Waiting for $service..."
    elapsed=0
    while [ $elapsed -lt $MAX_WAIT ]; do
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "unknown")
        if [ "$STATUS" = "healthy" ]; then
            echo -e " ${GREEN}✓${NC}"
            break
        elif [ "$STATUS" = "unhealthy" ]; then
            echo -e " ${RED}✗ (unhealthy)${NC}"
            break
        fi
        sleep $WAIT_INTERVAL
        elapsed=$((elapsed + WAIT_INTERVAL))
        echo -n "."
    done
    if [ $elapsed -ge $MAX_WAIT ]; then
        echo -e " ${YELLOW}⚠ (timeout)${NC}"
    fi
done

echo ""

# =============================================================================
# Step 4: Verify tunnel connectivity
# =============================================================================
echo -e "${YELLOW}Verifying tunnel connectivity...${NC}"

# Test from inside a container
if docker exec printshop-api wget -qO- --spider --timeout=5 http://printshop-frontend:3000 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Frontend reachable internally"
else
    echo -e "  ${RED}✗${NC} Frontend NOT reachable internally"
fi

if docker exec printshop-api wget -qO- --spider --timeout=5 http://printshop-strapi:1337 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Strapi reachable internally"
else
    echo -e "  ${RED}✗${NC} Strapi NOT reachable internally"
fi

echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo -e " ${GREEN}PrintShop OS started successfully!${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Local URLs:${NC}"
echo -e "  Frontend:  http://localhost:5173"
echo -e "  Strapi:    http://localhost:1337"
echo -e "  API:       http://localhost:3001"
echo -e "  Appsmith:  http://localhost:8080"
echo ""
echo -e "${YELLOW}Public URLs (via Cloudflare Tunnel):${NC}"
echo -e "  Frontend:  https://printshop-app.ronny.works"
echo -e "  Strapi:    https://printshop.ronny.works"
echo -e "  API:       https://api.ronny.works"
echo ""
echo -e "${YELLOW}Quick verification:${NC}"
echo -e "  curl -sI https://printshop.ronny.works | head -3"
echo -e "  curl -sI https://printshop-app.ronny.works | head -3"
echo -e "  curl -sI https://api.ronny.works/health | head -3"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo -e "  docker compose logs -f"
echo ""
