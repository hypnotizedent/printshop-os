#!/bin/bash
###############################################################################
# Authentication Endpoint Testing Script
#
# Tests the three-portal authentication system (Owner/Employee/Customer)
#
# Usage:
#   ./scripts/test-auth-endpoints.sh
#
# Prerequisites:
#   - Strapi must be running (http://localhost:1337 or set STRAPI_URL)
#   - Seed accounts created (run seed-auth.ts first)
###############################################################################

set -e

# Configuration
STRAPI_URL="${STRAPI_URL:-http://localhost:1337}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test credentials (from seed script)
OWNER_EMAIL="admin@mintprints.com"
OWNER_PASSWORD="AdminPass123!"
EMPLOYEE_PIN="1234"
CUSTOMER_EMAIL="customer@test.com"
CUSTOMER_PASSWORD="CustomerPass123!"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo ""
    echo "==========================================="
    echo "$1"
    echo "==========================================="
    echo ""
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4
    
    if [ -n "$auth_header" ]; then
        curl -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $auth_header" \
            -H "Content-Type: application/json" \
            ${data:+-d "$data"} \
            "$STRAPI_URL$endpoint"
    else
        curl -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Content-Type: application/json" \
            ${data:+-d "$data"} \
            "$STRAPI_URL$endpoint"
    fi
}

extract_token() {
    local response=$1
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

check_status() {
    local expected=$1
    local actual=$2
    [ "$actual" -eq "$expected" ]
}

###############################################################################
# Tests
###############################################################################

test_owner_login() {
    print_test "Owner login with email/password"
    
    local data="{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASSWORD\"}"
    local response=$(make_request POST "/api/auth/owner/login" "$data")
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if check_status 200 "$status"; then
        if echo "$body" | grep -q '"success":true'; then
            OWNER_TOKEN=$(extract_token "$body")
            print_pass "Owner login successful (Status: $status)"
            print_info "Token: ${OWNER_TOKEN:0:20}..."
        else
            print_fail "Owner login returned 200 but no success field"
        fi
    else
        print_fail "Owner login failed (Status: $status)"
        echo "$body"
    fi
}

test_owner_login_invalid() {
    print_test "Owner login with invalid password"
    
    local data="{\"email\":\"$OWNER_EMAIL\",\"password\":\"wrongpassword\"}"
    local response=$(make_request POST "/api/auth/owner/login" "$data")
    local status=$(echo "$response" | tail -n1)
    
    if check_status 401 "$status"; then
        print_pass "Invalid password correctly rejected (Status: $status)"
    else
        print_fail "Expected 401 for invalid password, got $status"
    fi
}

test_employee_pin() {
    print_test "Employee login with PIN"
    
    local data="{\"pin\":\"$EMPLOYEE_PIN\"}"
    local response=$(make_request POST "/api/auth/employee/validate-pin" "$data")
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if check_status 200 "$status"; then
        if echo "$body" | grep -q '"success":true'; then
            EMPLOYEE_TOKEN=$(extract_token "$body")
            print_pass "Employee PIN validation successful (Status: $status)"
            print_info "Token: ${EMPLOYEE_TOKEN:0:20}..."
        else
            print_fail "Employee PIN returned 200 but no success field"
        fi
    else
        print_fail "Employee PIN validation failed (Status: $status)"
        echo "$body"
    fi
}

test_employee_pin_invalid() {
    print_test "Employee login with invalid PIN"
    
    local data="{\"pin\":\"9999\"}"
    local response=$(make_request POST "/api/auth/employee/validate-pin" "$data")
    local status=$(echo "$response" | tail -n1)
    
    if check_status 401 "$status"; then
        print_pass "Invalid PIN correctly rejected (Status: $status)"
    else
        print_fail "Expected 401 for invalid PIN, got $status"
    fi
}

test_customer_login() {
    print_test "Customer login with email/password"
    
    local data="{\"email\":\"$CUSTOMER_EMAIL\",\"password\":\"$CUSTOMER_PASSWORD\"}"
    local response=$(make_request POST "/api/auth/customer/login" "$data")
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if check_status 200 "$status"; then
        if echo "$body" | grep -q '"success":true'; then
            CUSTOMER_TOKEN=$(extract_token "$body")
            print_pass "Customer login successful (Status: $status)"
            print_info "Token: ${CUSTOMER_TOKEN:0:20}..."
        else
            print_fail "Customer login returned 200 but no success field"
        fi
    else
        print_fail "Customer login failed (Status: $status)"
        echo "$body"
    fi
}

test_customer_login_invalid() {
    print_test "Customer login with invalid credentials"
    
    local data="{\"email\":\"$CUSTOMER_EMAIL\",\"password\":\"wrongpassword\"}"
    local response=$(make_request POST "/api/auth/customer/login" "$data")
    local status=$(echo "$response" | tail -n1)
    
    if check_status 401 "$status"; then
        print_pass "Invalid credentials correctly rejected (Status: $status)"
    else
        print_fail "Expected 401 for invalid credentials, got $status"
    fi
}

test_verify_owner_token() {
    print_test "Verify owner token"
    
    if [ -z "$OWNER_TOKEN" ]; then
        print_fail "No owner token available (owner login may have failed)"
        return
    fi
    
    local response=$(make_request GET "/api/auth/verify" "" "$OWNER_TOKEN")
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if check_status 200 "$status"; then
        if echo "$body" | grep -q '"type":"owner"'; then
            print_pass "Owner token verified (Status: $status)"
        else
            print_fail "Token verified but type is not 'owner'"
        fi
    else
        print_fail "Owner token verification failed (Status: $status)"
        echo "$body"
    fi
}

test_verify_employee_token() {
    print_test "Verify employee token"
    
    if [ -z "$EMPLOYEE_TOKEN" ]; then
        print_fail "No employee token available (employee login may have failed)"
        return
    fi
    
    local response=$(make_request GET "/api/auth/verify" "" "$EMPLOYEE_TOKEN")
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if check_status 200 "$status"; then
        if echo "$body" | grep -q '"type":"employee"'; then
            print_pass "Employee token verified (Status: $status)"
        else
            print_fail "Token verified but type is not 'employee'"
        fi
    else
        print_fail "Employee token verification failed (Status: $status)"
        echo "$body"
    fi
}

test_verify_customer_token() {
    print_test "Verify customer token"
    
    if [ -z "$CUSTOMER_TOKEN" ]; then
        print_fail "No customer token available (customer login may have failed)"
        return
    fi
    
    local response=$(make_request GET "/api/auth/verify" "" "$CUSTOMER_TOKEN")
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if check_status 200 "$status"; then
        if echo "$body" | grep -q '"type":"customer"'; then
            print_pass "Customer token verified (Status: $status)"
        else
            print_fail "Token verified but type is not 'customer'"
        fi
    else
        print_fail "Customer token verification failed (Status: $status)"
        echo "$body"
    fi
}

test_verify_invalid_token() {
    print_test "Verify invalid token"
    
    local response=$(make_request GET "/api/auth/verify" "" "invalid_token_12345")
    local status=$(echo "$response" | tail -n1)
    
    if check_status 401 "$status"; then
        print_pass "Invalid token correctly rejected (Status: $status)"
    else
        print_fail "Expected 401 for invalid token, got $status"
    fi
}

###############################################################################
# Main Execution
###############################################################################

main() {
    print_header "Three-Portal Authentication Tests"
    
    echo "Configuration:"
    echo "  Strapi URL: $STRAPI_URL"
    echo "  Owner Email: $OWNER_EMAIL"
    echo "  Employee PIN: $EMPLOYEE_PIN"
    echo "  Customer Email: $CUSTOMER_EMAIL"
    echo ""
    
    print_info "Checking if Strapi is accessible..."
    # Try to access the admin panel or API - more reliable than _health endpoint
    if ! curl -sf -o /dev/null "$STRAPI_URL/admin" && ! curl -sf -o /dev/null "$STRAPI_URL/api"; then
        echo -e "${RED}Error: Cannot reach Strapi at $STRAPI_URL${NC}"
        echo ""
        echo "Please ensure Strapi is running:"
        echo "  cd printshop-strapi && npm run dev"
        exit 1
    fi
    print_pass "Strapi is accessible"
    
    # Run tests
    print_header "Running Authentication Tests"
    
    # Owner tests
    test_owner_login
    test_owner_login_invalid
    test_verify_owner_token
    
    # Employee tests
    test_employee_pin
    test_employee_pin_invalid
    test_verify_employee_token
    
    # Customer tests
    test_customer_login
    test_customer_login_invalid
    test_verify_customer_token
    
    # Token verification tests
    test_verify_invalid_token
    
    # Summary
    print_header "Test Summary"
    
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Test frontend integration at:"
        echo "   - Owner: http://localhost:5173/login/admin"
        echo "   - Employee: http://localhost:5173/login/employee"
        echo "   - Customer: http://localhost:5173/login/customer"
        echo ""
        echo "2. View account setup docs:"
        echo "   cat docs/ACCOUNT_SETUP.md"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        echo ""
        echo "Troubleshooting:"
        echo "1. Ensure seed script was run:"
        echo "   cd printshop-strapi && npm run dev -- --run-script scripts/seed-auth.ts"
        echo ""
        echo "2. Check Strapi logs for errors"
        echo ""
        echo "3. Verify accounts exist in Strapi Admin:"
        echo "   http://localhost:1337/admin"
        exit 1
    fi
}

# Run tests
main
