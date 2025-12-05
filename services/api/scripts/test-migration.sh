#!/bin/bash
################################################################################
# Migration System Test Script
#
# This script validates the migration system without running a full migration.
# It checks:
# - Script syntax
# - Required dependencies
# - Environment variable configuration
# - File structure
#
# Usage:
#   ./test-migration.sh
################################################################################

# Note: Not using 'set -e' so all tests run even if one fails

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

PASSED=0
FAILED=0

test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

test_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Migration System Tests${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Test 1: Check script files exist
echo "Testing script files..."
if [ -f "printavo-extract.js" ]; then
    test_pass "printavo-extract.js exists"
else
    test_fail "printavo-extract.js not found"
fi

if [ -f "strapi-import.js" ]; then
    test_pass "strapi-import.js exists"
else
    test_fail "strapi-import.js not found"
fi

if [ -f "migrate-printavo.sh" ]; then
    test_pass "migrate-printavo.sh exists"
else
    test_fail "migrate-printavo.sh not found"
fi

if [ -f "../PRINTAVO_MIGRATION.md" ]; then
    test_pass "PRINTAVO_MIGRATION.md exists"
else
    test_fail "PRINTAVO_MIGRATION.md not found"
fi

if [ -f "lib/printavo-queries.js" ]; then
    test_pass "lib/printavo-queries.js exists"
else
    test_fail "lib/printavo-queries.js not found"
fi

# Test 2: Check script syntax
echo ""
echo "Testing script syntax..."
if node -c printavo-extract.js 2>/dev/null; then
    test_pass "printavo-extract.js syntax valid"
else
    test_fail "printavo-extract.js has syntax errors"
fi

if node -c strapi-import.js 2>/dev/null; then
    test_pass "strapi-import.js syntax valid"
else
    test_fail "strapi-import.js has syntax errors"
fi

if bash -n migrate-printavo.sh 2>/dev/null; then
    test_pass "migrate-printavo.sh syntax valid"
else
    test_fail "migrate-printavo.sh has syntax errors"
fi

if node -c lib/printavo-queries.js 2>/dev/null; then
    test_pass "lib/printavo-queries.js syntax valid"
else
    test_fail "lib/printavo-queries.js has syntax errors"
fi

# Test 3: Check file permissions
echo ""
echo "Testing file permissions..."
if [ -x "migrate-printavo.sh" ]; then
    test_pass "migrate-printavo.sh is executable"
else
    test_fail "migrate-printavo.sh is not executable"
fi

# Test 4: Check required Node.js modules
echo ""
echo "Testing required dependencies..."
cd ..
if [ -d "node_modules/axios" ]; then
    test_pass "axios is installed"
else
    test_fail "axios is not installed"
fi

if [ -d "node_modules/dotenv" ]; then
    test_pass "dotenv is installed"
else
    test_fail "dotenv is not installed"
fi

cd "$SCRIPT_DIR"

# Test 5: Check environment variables
echo ""
echo "Testing environment configuration..."
if [ -f "../.env" ]; then
    test_pass ".env file exists"
    
    # Source the .env file for checking
    export $(cat ../.env | grep -v '^#' | xargs) 2>/dev/null || true
    
    if [ -n "$PRINTAVO_EMAIL" ]; then
        test_pass "PRINTAVO_EMAIL is set"
    else
        test_warn "PRINTAVO_EMAIL is not set (required for extraction)"
    fi
    
    if [ -n "$PRINTAVO_TOKEN" ]; then
        test_pass "PRINTAVO_TOKEN is set"
    else
        test_warn "PRINTAVO_TOKEN is not set (required for extraction)"
    fi
    
    if [ -n "$STRAPI_URL" ]; then
        test_pass "STRAPI_URL is set"
    else
        test_warn "STRAPI_URL is not set (required for import)"
    fi
    
    if [ -n "$STRAPI_API_TOKEN" ]; then
        test_pass "STRAPI_API_TOKEN is set"
    else
        test_warn "STRAPI_API_TOKEN is not set (required for import)"
    fi
else
    test_warn ".env file not found (create from .env.example)"
fi

# Test 6: Check required system commands
echo ""
echo "Testing system dependencies..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    test_pass "node is installed ($NODE_VERSION)"
else
    test_fail "node is not installed"
fi

if command -v jq &> /dev/null; then
    test_pass "jq is installed"
else
    test_warn "jq is not installed (recommended for shell script)"
fi

if command -v curl &> /dev/null; then
    test_pass "curl is installed"
else
    test_warn "curl is not installed (required for shell script)"
fi

# Test 7: Test data directories
echo ""
echo "Testing data directories..."
if [ -d "/app/data" ]; then
    test_pass "/app/data directory exists"
    
    if [ -w "/app/data" ]; then
        test_pass "/app/data is writable"
    else
        test_fail "/app/data is not writable"
    fi
else
    test_warn "/app/data directory not found (will be created on first run)"
fi

# Test 8: Validate GraphQL queries
echo ""
echo "Testing GraphQL queries..."
if grep -q "query GetOrders" lib/printavo-queries.js; then
    test_pass "ORDER_QUERY is defined"
else
    test_fail "ORDER_QUERY not found"
fi

if grep -q "query GetCustomers" lib/printavo-queries.js; then
    test_pass "CUSTOMER_QUERY is defined"
else
    test_fail "CUSTOMER_QUERY not found"
fi

if grep -q "query GetOrdersSince" lib/printavo-queries.js; then
    test_pass "INCREMENTAL_ORDER_QUERY is defined"
else
    test_fail "INCREMENTAL_ORDER_QUERY not found"
fi

# Summary
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "The migration system is ready to use."
    echo ""
    echo "Next steps:"
    echo "  1. Set up environment variables in .env file"
    echo "  2. Ensure Strapi is running"
    echo "  3. Run: ./migrate-printavo.sh"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Please fix the issues above before running the migration."
    echo ""
    exit 1
fi
