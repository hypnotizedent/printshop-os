#!/bin/bash
# =============================================================================
# PrintShop OS - Test File Inventory Module
# =============================================================================
# Analyzes test files for:
# - Test file inventory (*.test.ts, *.spec.ts, *_test.py, etc.)
# - Coverage matrix by service/component
# - Services with no tests
# =============================================================================

set -euo pipefail

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

# Test file patterns
TEST_PATTERNS=(
    "*.test.ts"
    "*.spec.ts"
    "*.test.tsx"
    "*.spec.tsx"
    "*.test.js"
    "*.spec.js"
    "*_test.py"
    "*_test.go"
    "*.test.go"
    "test_*.py"
)

# Directories to scan for services
SERVICE_DIRS=(
    "services"
    "frontend/src"
    "printshop-strapi/src"
    "lib"
)

# Directories to exclude
EXCLUDE_DIRS=(
    "node_modules"
    ".git"
    "dist"
    "build"
    ".next"
    "coverage"
    "__pycache__"
    ".venv"
    "venv"
)

# -----------------------------------------------------------------------------
# Test Analysis Functions
# -----------------------------------------------------------------------------

# Build find exclusion args
build_exclude_args() {
    local args=""
    for dir in "${EXCLUDE_DIRS[@]}"; do
        args+=" -path '*/$dir' -prune -o"
    done
    echo "$args"
}

# Find all test files
find_test_files() {
    local search_path="${1:-.}"
    local -a results=()
    
    for pattern in "${TEST_PATTERNS[@]}"; do
        while IFS= read -r -d '' file; do
            results+=("$file")
        done < <(find "$search_path" \
            -path '*/node_modules' -prune -o \
            -path '*/.git' -prune -o \
            -path '*/dist' -prune -o \
            -path '*/build' -prune -o \
            -path '*/.next' -prune -o \
            -path '*/coverage' -prune -o \
            -path '*/__pycache__' -prune -o \
            -path '*/.venv' -prune -o \
            -path '*/venv' -prune -o \
            -name "$pattern" -type f -print0 2>/dev/null)
    done
    
    printf '%s\n' "${results[@]}" | sort -u
}

# Get service name from path
get_service_from_path() {
    local path="$1"
    
    # Extract service name based on common patterns
    if [[ "$path" =~ ^services/([^/]+)/ ]]; then
        echo "${BASH_REMATCH[1]}"
    elif [[ "$path" =~ ^frontend/ ]]; then
        echo "frontend"
    elif [[ "$path" =~ ^printshop-strapi/ ]]; then
        echo "strapi"
    elif [[ "$path" =~ ^lib/([^/]+)/ ]]; then
        echo "lib/${BASH_REMATCH[1]}"
    elif [[ "$path" =~ ^tests/ ]]; then
        echo "integration-tests"
    else
        echo "other"
    fi
}

# Get test type from filename
get_test_type() {
    local file="$1"
    
    if [[ "$file" == *".test."* ]] || [[ "$file" == *"_test."* ]] || [[ "$file" == *"test_"* ]]; then
        echo "unit"
    elif [[ "$file" == *".spec."* ]]; then
        echo "spec"
    elif [[ "$file" == *".e2e."* ]] || [[ "$file" == *".integration."* ]]; then
        echo "integration"
    else
        echo "unknown"
    fi
}

# Count test cases in file (rough estimate)
count_test_cases() {
    local file="$1"
    local count=0
    
    if [[ -f "$file" ]]; then
        # TypeScript/JavaScript: it(), test()
        local ts_count
        ts_count=$(grep -cE "^\s*(it|test)\s*\(" "$file" 2>/dev/null || echo "0")
        
        # Python: def test_
        local py_count
        py_count=$(grep -cE "^\s*def\s+test_" "$file" 2>/dev/null || echo "0")
        
        # Go: func Test
        local go_count
        go_count=$(grep -cE "^func\s+Test" "$file" 2>/dev/null || echo "0")
        
        count=$((ts_count + py_count + go_count))
    fi
    
    echo "$count"
}

# Get all services (directories that should have tests)
get_all_services() {
    local -a services=()
    
    # Services directory
    if [[ -d "services" ]]; then
        while IFS= read -r dir; do
            [[ -n "$dir" ]] && services+=("$dir")
        done < <(ls -1 services/ 2>/dev/null)
    fi
    
    # Frontend
    [[ -d "frontend/src" ]] && services+=("frontend")
    
    # Strapi
    [[ -d "printshop-strapi/src" ]] && services+=("strapi")
    
    printf '%s\n' "${services[@]}" | sort -u
}

# -----------------------------------------------------------------------------
# Output Functions
# -----------------------------------------------------------------------------

# Generate markdown output
output_tests_markdown() {
    log_info "Scanning for test files..."
    
    # Collect all test files
    declare -A service_tests
    declare -A service_test_count
    local total_files=0
    local total_tests=0
    
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        
        local service
        service=$(get_service_from_path "$file")
        local test_count
        test_count=$(count_test_cases "$file")
        
        # Initialize arrays if needed
        if [[ -z "${service_tests[$service]:-}" ]]; then
            service_tests[$service]=""
            service_test_count[$service]=0
        fi
        
        service_tests[$service]+="$file"$'\n'
        service_test_count[$service]=$((${service_test_count[$service]} + test_count))
        ((total_files++)) || true
        ((total_tests += test_count)) || true
    done < <(find_test_files ".")
    
    # Get all services and find those without tests
    local -a services_without_tests=()
    while IFS= read -r service; do
        [[ -z "$service" ]] && continue
        if [[ -z "${service_tests[$service]:-}" ]]; then
            services_without_tests+=("$service")
        fi
    done < <(get_all_services)
    
    # Determine status
    local status
    if [[ ${#services_without_tests[@]} -gt 3 ]]; then
        status="critical"
    elif [[ ${#services_without_tests[@]} -gt 0 ]]; then
        status="warning"
    else
        status="good"
    fi
    
    local status_icon
    status_icon=$(get_status_icon "$status")
    
    # Output
    md_header 2 "Test File Inventory"
    
    echo "**Total Test Files:** $total_files"
    echo "**Estimated Test Cases:** $total_tests"
    echo "**Services Without Tests:** ${#services_without_tests[@]}"
    echo "**Status:** $status_icon $(get_status_text "$status")"
    echo ""
    
    # Coverage matrix
    md_header 3 "Coverage Matrix by Service"
    
    md_table_header "Service" "Test Files" "Test Cases"
    
    for service in "${!service_tests[@]}"; do
        local file_count
        file_count=$(echo -n "${service_tests[$service]}" | grep -c "^" || echo "0")
        md_table_row "$service" "$file_count" "${service_test_count[$service]}"
    done
    echo ""
    
    # Services without tests
    if [[ ${#services_without_tests[@]} -gt 0 ]]; then
        md_header 3 "Services Without Tests (${#services_without_tests[@]})"
        
        for service in "${services_without_tests[@]}"; do
            md_list_item "$service"
        done
        echo ""
    fi
    
    # Test file listing (if verbose)
    if [[ "$VERBOSE" == "true" ]]; then
        md_header 3 "All Test Files"
        
        for service in "${!service_tests[@]}"; do
            echo "**$service:**"
            echo "${service_tests[$service]}" | while IFS= read -r file; do
                [[ -n "$file" ]] && md_list_item "\`$file\`"
            done
            echo ""
        done
    fi
    
    # Return status for summary
    echo "__STATUS__:tests:$status:${#services_without_tests[@]} services missing"
}

# Generate JSON output
output_tests_json() {
    log_info "Scanning for test files..."
    
    declare -A service_tests
    declare -A service_test_count
    local total_files=0
    local total_tests=0
    
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        
        local service
        service=$(get_service_from_path "$file")
        local test_count
        test_count=$(count_test_cases "$file")
        
        if [[ -z "${service_tests[$service]:-}" ]]; then
            service_tests[$service]=""
            service_test_count[$service]=0
        fi
        
        service_tests[$service]+="$file"$'\n'
        service_test_count[$service]=$((${service_test_count[$service]} + test_count))
        ((total_files++)) || true
        ((total_tests += test_count)) || true
    done < <(find_test_files ".")
    
    # Get services without tests
    local -a services_without_tests=()
    while IFS= read -r service; do
        [[ -z "$service" ]] && continue
        if [[ -z "${service_tests[$service]:-}" ]]; then
            services_without_tests+=("$service")
        fi
    done < <(get_all_services)
    
    # Determine status
    local status
    if [[ ${#services_without_tests[@]} -gt 3 ]]; then
        status="critical"
    elif [[ ${#services_without_tests[@]} -gt 0 ]]; then
        status="warning"
    else
        status="good"
    fi
    
    echo "{"
    echo "  \"category\": \"tests\","
    echo "  \"summary\": {"
    echo "    \"total_files\": $total_files,"
    echo "    \"total_tests\": $total_tests,"
    echo "    \"services_without_tests\": ${#services_without_tests[@]}"
    echo "  },"
    echo "  \"status\": \"$status\","
    
    # Services coverage
    echo "  \"coverage\": ["
    
    local first=true
    for service in "${!service_tests[@]}"; do
        local file_count
        file_count=$(echo -n "${service_tests[$service]}" | grep -c "^" || echo "0")
        
        [[ "$first" != "true" ]] && echo ","
        first=false
        
        echo "    {"
        echo "      \"service\": \"$(json_escape "$service")\","
        echo "      \"test_files\": $file_count,"
        echo "      \"test_cases\": ${service_test_count[$service]}"
        echo -n "    }"
    done
    
    echo ""
    echo "  ],"
    
    # Services without tests
    echo "  \"missing_tests\": ["
    first=true
    for service in "${services_without_tests[@]}"; do
        [[ "$first" != "true" ]] && echo ","
        first=false
        echo -n "    \"$(json_escape "$service")\""
    done
    echo ""
    echo "  ]"
    echo "}"
}

# Generate CSV output
output_tests_csv() {
    csv_header "File" "Service" "Test Type" "Test Cases"
    
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        
        local service
        service=$(get_service_from_path "$file")
        local test_type
        test_type=$(get_test_type "$file")
        local test_count
        test_count=$(count_test_cases "$file")
        
        csv_row "$file" "$service" "$test_type" "$test_count"
    done < <(find_test_files ".")
}

# -----------------------------------------------------------------------------
# Main Entry Point
# -----------------------------------------------------------------------------

run_tests_audit() {
    local format="${1:-markdown}"
    
    case "$format" in
        markdown) output_tests_markdown ;;
        json) output_tests_json ;;
        csv) output_tests_csv ;;
        *) 
            log_error "Unknown format: $format"
            return 1
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_tests_audit "${1:-markdown}"
fi
