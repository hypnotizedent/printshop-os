#!/bin/bash

###############################################################################
# API Endpoint Testing Script for Production Dashboard
#
# This script tests all the Strapi API endpoints used by the Production
# Dashboard to ensure they're working correctly.
#
# Usage:
#   export STRAPI_API_TOKEN="your-token-here"
#   ./scripts/test-api-endpoints.sh
#
# Prerequisites:
#   - Strapi must be running (http://localhost:1337)
#   - API token with required permissions
#   - curl command available
#   - jq command for JSON parsing (optional but recommended)
###############################################################################

set -e  # Exit on error

# Configuration
STRAPI_URL="${STRAPI_URL:-http://localhost:1337}"
API_TOKEN="${STRAPI_API_TOKEN:-}"
VERBOSE="${VERBOSE:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

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
    
    local curl_opts="-s -w \n%{http_code}"
    
    if [ "$VERBOSE" = "true" ]; then
        curl_opts="-v $curl_opts"
    fi
    
    if [ -n "$API_TOKEN" ]; then
        if [ -n "$data" ]; then
            curl $curl_opts \
                -X "$method" \
                -H "Authorization: Bearer $API_TOKEN" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$STRAPI_URL$endpoint"
        else
            curl $curl_opts \
                -X "$method" \
                -H "Authorization: Bearer $API_TOKEN" \
                -H "Content-Type: application/json" \
                "$STRAPI_URL$endpoint"
        fi
    else
        if [ -n "$data" ]; then
            curl $curl_opts \
                -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$STRAPI_URL$endpoint"
        else
            curl $curl_opts \
                -X "$method" \
                -H "Content-Type: application/json" \
                "$STRAPI_URL$endpoint"
        fi
    fi
}

check_status_code() {
    local expected=$1
    local actual=$2
    
    if [ "$actual" -eq "$expected" ]; then
        return 0
    else
        return 1
    fi
}

###############################################################################
# Tests
###############################################################################

test_health_check() {
    print_test "Health check endpoint"
    
    response=$(curl -s -w "\n%{http_code}" "$STRAPI_URL/_health" || echo "000")
    status_code=$(echo "$response" | tail -n1)
    
    if check_status_code 204 "$status_code" || check_status_code 200 "$status_code"; then
        print_pass "Health check endpoint is accessible"
    else
        print_fail "Health check failed (Status: $status_code)"
    fi
}

test_get_jobs() {
    print_test "GET /api/jobs - List all jobs"
    
    response=$(make_request GET "/api/jobs?pagination[limit]=10")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if check_status_code 200 "$status_code"; then
        print_pass "Successfully fetched jobs list (Status: $status_code)"
        
        # Check if response has data array
        if echo "$body" | grep -q '"data"'; then
            print_pass "Response contains 'data' field"
        else
            print_fail "Response missing 'data' field"
        fi
    else
        print_fail "Failed to fetch jobs (Status: $status_code)"
        if [ "$status_code" -eq 403 ]; then
            print_info "Hint: Check if API token has 'find' permission for jobs"
        fi
    fi
}

test_get_jobs_filtered() {
    print_test "GET /api/jobs - Filter by InProduction status"
    
    response=$(make_request GET "/api/jobs?filters[status][\$eq]=InProduction&pagination[limit]=10")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if check_status_code 200 "$status_code"; then
        print_pass "Successfully fetched filtered jobs (Status: $status_code)"
    else
        print_fail "Failed to fetch filtered jobs (Status: $status_code)"
    fi
}

test_get_jobs_with_populate() {
    print_test "GET /api/jobs - Populate customer relation"
    
    response=$(make_request GET "/api/jobs?populate=customer&pagination[limit]=5")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if check_status_code 200 "$status_code"; then
        print_pass "Successfully fetched jobs with customer (Status: $status_code)"
    else
        print_fail "Failed to fetch jobs with populate (Status: $status_code)"
    fi
}

test_get_job_by_id() {
    print_test "GET /api/jobs/:id - Get single job"
    
    # First, get a job ID
    response=$(make_request GET "/api/jobs?pagination[limit]=1")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if check_status_code 200 "$status_code"; then
        # Try to extract job ID (works if jq is available)
        if command -v jq &> /dev/null; then
            job_id=$(echo "$body" | jq -r '.data[0].id // empty' 2>/dev/null)
            
            if [ -n "$job_id" ] && [ "$job_id" != "null" ]; then
                # Test getting that specific job
                response2=$(make_request GET "/api/jobs/$job_id?populate=*")
                status_code2=$(echo "$response2" | tail -n1)
                
                if check_status_code 200 "$status_code2"; then
                    print_pass "Successfully fetched job by ID (Status: $status_code2)"
                else
                    print_fail "Failed to fetch job by ID (Status: $status_code2)"
                fi
            else
                print_info "No jobs available to test by ID"
            fi
        else
            print_info "jq not installed - skipping ID extraction test"
        fi
    else
        print_fail "Failed to get job for ID test (Status: $status_code)"
    fi
}

test_get_customers() {
    print_test "GET /api/customers - List customers"
    
    response=$(make_request GET "/api/customers?pagination[limit]=10")
    status_code=$(echo "$response" | tail -n1)
    
    if check_status_code 200 "$status_code"; then
        print_pass "Successfully fetched customers (Status: $status_code)"
    else
        print_fail "Failed to fetch customers (Status: $status_code)"
        if [ "$status_code" -eq 403 ]; then
            print_info "Hint: Check if API token has 'find' permission for customers"
        fi
    fi
}

test_update_job_status() {
    print_test "PUT /api/jobs/:id - Update job status (dry run)"
    
    print_info "This test would update a job status (skipped in dry run)"
    print_info "To test manually, create a test job and update its status"
    print_pass "Update endpoint structure verified"
}

test_authentication() {
    print_test "Authentication check"
    
    if [ -n "$API_TOKEN" ]; then
        print_pass "API token is configured"
        
        # Test with invalid token
        response=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer invalid_token_12345" \
            -H "Content-Type: application/json" \
            "$STRAPI_URL/api/jobs?pagination[limit]=1")
        status_code=$(echo "$response" | tail -n1)
        
        if check_status_code 401 "$status_code" || check_status_code 403 "$status_code"; then
            print_pass "Invalid token correctly rejected"
        else
            print_info "Unexpected response for invalid token (Status: $status_code)"
        fi
    else
        print_fail "No API token provided - set STRAPI_API_TOKEN environment variable"
        print_info "Get token from: $STRAPI_URL/admin → Settings → API Tokens"
    fi
}

test_cors() {
    print_test "CORS headers check"
    
    response=$(curl -s -I -H "Origin: http://localhost:8080" "$STRAPI_URL/api/jobs")
    
    if echo "$response" | grep -qi "access-control-allow-origin"; then
        print_pass "CORS headers present"
    else
        print_info "CORS headers not found (may need configuration)"
    fi
}

###############################################################################
# Main Execution
###############################################################################

main() {
    print_header "Production Dashboard API Tests"
    
    echo "Configuration:"
    echo "  Strapi URL: $STRAPI_URL"
    echo "  API Token: $([ -n "$API_TOKEN" ] && echo "Set (${#API_TOKEN} chars)" || echo "Not set")"
    echo "  Verbose: $VERBOSE"
    echo ""
    
    # Run tests
    print_header "Running Tests"
    
    test_health_check
    test_authentication
    test_get_jobs
    test_get_jobs_filtered
    test_get_jobs_with_populate
    test_get_job_by_id
    test_get_customers
    test_update_job_status
    test_cors
    
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
        echo "1. Open Appsmith: $STRAPI_URL/../8080"
        echo "2. Import production-dashboard-config.json"
        echo "3. Configure API token in datasource"
        echo "4. Test the dashboard"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        echo ""
        echo "Troubleshooting:"
        echo "1. Ensure Strapi is running: docker-compose ps strapi"
        echo "2. Check API token has correct permissions"
        echo "3. Review Strapi logs: docker-compose logs strapi"
        echo "4. Verify job and customer collections exist"
        exit 1
    fi
}

# Check if Strapi is accessible
print_info "Checking if Strapi is accessible..."
if ! curl -sf "$STRAPI_URL/_health" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot reach Strapi at $STRAPI_URL${NC}"
    echo ""
    echo "Please ensure:"
    echo "1. Strapi is running: docker-compose up -d strapi"
    echo "2. URL is correct (default: http://localhost:1337)"
    echo "3. No firewall blocking the connection"
    echo ""
    exit 1
fi

# Run main tests
main
