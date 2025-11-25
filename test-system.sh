#!/bin/bash

# PrintShop OS System Test Script
# Tests merged Phase 2 features: Pricing Engine & Workflow Automation

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

echo "=========================================="
echo "PrintShop OS System Test"
echo "=========================================="
echo ""

# Test 1: Docker Services
echo "Test 1: Checking Docker Services..."
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Docker services are running"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Docker services not running"
    echo "  Run: docker compose up -d"
    ((FAILED++))
fi

# Test 2: PostgreSQL
echo ""
echo "Test 2: Checking PostgreSQL..."
if docker compose exec -T postgres pg_isready -U printshop > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL is ready"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} PostgreSQL not ready"
    ((FAILED++))
fi

# Test 3: Redis
echo ""
echo "Test 3: Checking Redis..."
if docker compose exec -T redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✓${NC} Redis is responding"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Redis not responding"
    ((FAILED++))
fi

# Test 4: MongoDB
echo ""
echo "Test 4: Checking MongoDB..."
if docker compose exec -T mongo mongosh --quiet --eval "db.adminCommand('ping').ok" | grep -q "1"; then
    echo -e "${GREEN}✓${NC} MongoDB is responding"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} MongoDB not responding"
    ((FAILED++))
fi

# Test 5: Strapi API
echo ""
echo "Test 5: Checking Strapi API..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:1337/_health | grep -q "200\|204"; then
    echo -e "${GREEN}✓${NC} Strapi API is healthy"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Strapi API not responding (may still be starting)"
    echo "  Check: docker compose logs strapi"
    ((FAILED++))
fi

# Test 6: Strapi Admin
echo ""
echo "Test 6: Checking Strapi Admin..."
if curl -s http://localhost:1337/admin | grep -q "<!DOCTYPE html>"; then
    echo -e "${GREEN}✓${NC} Strapi Admin accessible"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Strapi Admin not accessible"
    ((FAILED++))
fi

# Test 7: Pricing Engine Directory
echo ""
echo "Test 7: Checking Pricing Engine (PR #98)..."
if [ -d "services/job-estimator" ]; then
    echo -e "${GREEN}✓${NC} Pricing Engine directory exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Pricing Engine directory not found"
    ((FAILED++))
fi

# Test 8: Pricing Engine Dependencies
echo ""
echo "Test 8: Checking Pricing Engine Dependencies..."
if [ -d "services/job-estimator/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Pricing Engine dependencies installed"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Pricing Engine dependencies not installed"
    echo "  Run: cd services/job-estimator && npm install"
    # Don't count as failure - may not be needed in container mode
fi

# Test 9: Pricing Engine API (if running)
echo ""
echo "Test 9: Checking Pricing Engine API..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null | grep -q "200"; then
    echo -e "${GREEN}✓${NC} Pricing Engine API responding"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Pricing Engine API not running (optional)"
    echo "  To start: cd services/job-estimator && npm run api:dev"
    # Don't count as failure - API may not be running in dev mode
fi

# Test 10: Workflow Automation Files
echo ""
echo "Test 10: Checking Workflow Automation (PR #99)..."
WORKFLOW_FILES=(
    "printshop-strapi/src/services/workflow.ts"
    "printshop-strapi/src/services/queue.ts"
    "printshop-strapi/src/services/notification.ts"
    "printshop-strapi/src/services/audit.ts"
)

WORKFLOW_OK=true
for file in "${WORKFLOW_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗${NC} Missing: $file"
        WORKFLOW_OK=false
    fi
done

if [ "$WORKFLOW_OK" = true ]; then
    echo -e "${GREEN}✓${NC} Workflow Automation files present"
    ((PASSED++))
else
    ((FAILED++))
fi

# Test 11: Bull Queue Dependencies
echo ""
echo "Test 11: Checking Bull Queue Dependencies..."
if grep -q "bull" printshop-strapi/package.json && grep -q "ioredis" printshop-strapi/package.json; then
    echo -e "${GREEN}✓${NC} Bull Queue dependencies configured"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Bull Queue dependencies missing"
    ((FAILED++))
fi

# Test 12: Strapi Content Types
echo ""
echo "Test 12: Checking Strapi Content Types..."
CONTENT_TYPE_DIRS=(
    "printshop-strapi/src/api/quote"
    "printshop-strapi/src/api/order"
    "printshop-strapi/src/api/job"
)

CONTENT_OK=true
for dir in "${CONTENT_TYPE_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        CONTENT_OK=false
    fi
done

if [ "$CONTENT_OK" = true ]; then
    echo -e "${GREEN}✓${NC} Strapi Content Types configured"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Some Strapi Content Types may be missing"
    ((FAILED++))
fi

# Test 13: Docker Compose Configuration
echo ""
echo "Test 13: Checking Docker Compose Configuration..."
if docker compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker Compose configuration valid"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Docker Compose configuration has errors"
    ((FAILED++))
fi

# Test 14: Frontend Build
echo ""
echo "Test 14: Checking Frontend..."
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✓${NC} Frontend directory configured"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Frontend directory not found or not configured"
    ((FAILED++))
fi

# Test 15: Network Connectivity
echo ""
echo "Test 15: Checking Docker Network..."
if docker network inspect printshop_network > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker network 'printshop_network' exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Docker network 'printshop_network' not found"
    ((FAILED++))
fi

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All critical tests passed!${NC}"
    echo ""
    echo "Service URLs:"
    echo "  Strapi Admin: http://localhost:1337/admin"
    echo "  Strapi API:   http://localhost:1337/api"
    echo "  Appsmith:     http://localhost:8080"
    echo "  Frontend:     http://localhost:3000"
    echo "  Pricing API:  http://localhost:3001 (if running)"
    exit 0
else
    echo -e "${YELLOW}Some tests failed. Review errors above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Start services: docker compose up -d"
    echo "  - Check logs: docker compose logs [service]"
    echo "  - Rebuild: docker compose up -d --build"
    exit 1
fi
