#!/bin/bash
# =============================================================================
# PrintShop OS - Dependency Analysis Module
# =============================================================================
# Analyzes dependencies for:
# - requirements.txt parsing
# - package.json parsing
# - Outdated or missing lockfiles
# - Packages without version pins
# =============================================================================

set -euo pipefail

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

# Dependency file patterns
PYTHON_FILES=(
    "requirements.txt"
    "requirements-dev.txt"
    "requirements-test.txt"
    "dev-requirements.txt"
    "test-requirements.txt"
)

NODE_FILES=(
    "package.json"
)

NODE_LOCKFILES=(
    "package-lock.json"
    "yarn.lock"
    "pnpm-lock.yaml"
    "bun.lockb"
)

# -----------------------------------------------------------------------------
# Dependency Analysis Functions
# -----------------------------------------------------------------------------

# Find all requirements.txt files
find_requirements_files() {
    find . \
        -path '*/node_modules' -prune -o \
        -path '*/.git' -prune -o \
        -path '*/dist' -prune -o \
        -path '*/build' -prune -o \
        -path '*/.venv' -prune -o \
        -path '*/venv' -prune -o \
        \( \
            -name "requirements.txt" -o \
            -name "requirements-*.txt" -o \
            -name "*-requirements.txt" \
        \) -type f -print 2>/dev/null
}

# Find all package.json files
find_package_json_files() {
    find . \
        -path '*/node_modules' -prune -o \
        -path '*/.git' -prune -o \
        -path '*/dist' -prune -o \
        -path '*/build' -prune -o \
        -name "package.json" -type f -print 2>/dev/null
}

# Check if lockfile exists for package.json
has_lockfile() {
    local dir="$1"
    
    for lockfile in "${NODE_LOCKFILES[@]}"; do
        if [[ -f "$dir/$lockfile" ]]; then
            echo "$lockfile"
            return 0
        fi
    done
    
    return 1
}

# Parse requirements.txt for unpinned packages
find_unpinned_requirements() {
    local file="$1"
    local -a unpinned=()
    
    while IFS= read -r line; do
        # Skip empty lines and comments
        [[ -z "$line" ]] && continue
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ "$line" =~ ^[[:space:]]*-r ]] && continue  # Skip -r includes
        [[ "$line" =~ ^[[:space:]]*-e ]] && continue  # Skip -e editable
        
        # Check if version is pinned
        if ! echo "$line" | grep -qE '[=><!]'; then
            unpinned+=("$line")
        fi
    done < "$file"
    
    printf '%s\n' "${unpinned[@]}"
}

# Count dependencies in requirements.txt
count_requirements() {
    local file="$1"
    grep -cE '^[a-zA-Z]' "$file" 2>/dev/null || echo "0"
}

# Get Node.js dependencies count
count_node_deps() {
    local file="$1"
    local deps=0
    local dev_deps=0
    
    if [[ -f "$file" ]] && command -v jq &>/dev/null; then
        deps=$(jq -r '.dependencies | keys | length' "$file" 2>/dev/null || echo "0")
        dev_deps=$(jq -r '.devDependencies | keys | length' "$file" 2>/dev/null || echo "0")
    elif [[ -f "$file" ]]; then
        # Fallback: grep-based counting
        deps=$(grep -c '"dependencies"' "$file" 2>/dev/null || echo "0")
    fi
    
    echo "$deps:$dev_deps"
}

# Find unpinned packages in package.json
find_unpinned_node_deps() {
    local file="$1"
    local -a unpinned=()
    
    if [[ ! -f "$file" ]]; then
        return
    fi
    
    if command -v jq &>/dev/null; then
        # Use jq for accurate parsing
        local deps
        deps=$(jq -r '.dependencies // {} | to_entries[] | select(.value | test("^[^0-9]") | not) | .key' "$file" 2>/dev/null || true)
        local dev_deps
        dev_deps=$(jq -r '.devDependencies // {} | to_entries[] | select(.value | test("^[^0-9]") | not) | .key' "$file" 2>/dev/null || true)
        
        # Also check for "*" versions
        local star_deps
        star_deps=$(jq -r '(.dependencies // {}) + (.devDependencies // {}) | to_entries[] | select(.value == "*" or .value == "latest") | .key' "$file" 2>/dev/null || true)
        
        for dep in $star_deps; do
            [[ -n "$dep" ]] && unpinned+=("$dep")
        done
    else
        # Fallback: grep for common unpinned patterns
        while IFS= read -r line; do
            if echo "$line" | grep -qE ':\s*"\*"'; then
                local pkg
                pkg=$(echo "$line" | grep -oE '"[^"]+":' | tr -d '":')
                [[ -n "$pkg" ]] && unpinned+=("$pkg")
            fi
        done < "$file"
    fi
    
    printf '%s\n' "${unpinned[@]}"
}

# Check if lockfile is newer than package.json
is_lockfile_stale() {
    local package_file="$1"
    local lock_file="$2"
    
    if [[ ! -f "$lock_file" ]]; then
        return 1
    fi
    
    # Compare modification times
    if [[ "$package_file" -nt "$lock_file" ]]; then
        return 0  # Lockfile is stale
    fi
    
    return 1
}

# -----------------------------------------------------------------------------
# Output Functions
# -----------------------------------------------------------------------------

# Generate markdown output
output_deps_markdown() {
    log_info "Scanning for dependencies..."
    
    local total_python_files=0
    local total_node_files=0
    local total_unpinned=0
    local total_missing_lockfiles=0
    local total_stale_lockfiles=0
    
    local -a python_details=()
    local -a node_details=()
    local -a unpinned_list=()
    local -a missing_lockfile_list=()
    
    # Scan Python requirements
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        [[ ! -f "$file" ]] && continue
        
        file="${file#./}"
        ((total_python_files++)) || true
        
        local count
        count=$(count_requirements "$file")
        
        local unpinned=""
        while IFS= read -r pkg; do
            [[ -n "$pkg" ]] && unpinned+="$pkg, "
        done < <(find_unpinned_requirements "$file")
        
        if [[ -n "$unpinned" ]]; then
            unpinned="${unpinned%, }"
            ((total_unpinned++)) || true
            unpinned_list+=("$file: $unpinned")
        fi
        
        python_details+=("$file|$count|$unpinned")
    done < <(find_requirements_files)
    
    # Scan Node.js packages
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        [[ ! -f "$file" ]] && continue
        
        file="${file#./}"
        local dir
        dir=$(dirname "$file")
        ((total_node_files++)) || true
        
        local counts
        counts=$(count_node_deps "$file")
        local deps="${counts%%:*}"
        local dev_deps="${counts##*:}"
        
        # Check for lockfile
        local lockfile=""
        if lockfile=$(has_lockfile "$dir"); then
            # Check if stale
            if is_lockfile_stale "$file" "$dir/$lockfile"; then
                ((total_stale_lockfiles++)) || true
            fi
        else
            ((total_missing_lockfiles++)) || true
            missing_lockfile_list+=("$file")
        fi
        
        # Check for unpinned
        local unpinned=""
        while IFS= read -r pkg; do
            [[ -n "$pkg" ]] && unpinned+="$pkg, "
        done < <(find_unpinned_node_deps "$file")
        
        if [[ -n "$unpinned" ]]; then
            unpinned="${unpinned%, }"
            ((total_unpinned++)) || true
            unpinned_list+=("$file: $unpinned")
        fi
        
        node_details+=("$file|$deps|$dev_deps|$lockfile|$unpinned")
    done < <(find_package_json_files)
    
    # Determine status
    local status
    if [[ $total_missing_lockfiles -gt 3 ]] || [[ $total_unpinned -gt 5 ]]; then
        status="critical"
    elif [[ $total_missing_lockfiles -gt 0 ]] || [[ $total_unpinned -gt 0 ]]; then
        status="warning"
    else
        status="good"
    fi
    
    local status_icon
    status_icon=$(get_status_icon "$status")
    
    # Output
    md_header 2 "Dependency Freshness Check"
    
    echo "**Python Requirement Files:** $total_python_files"
    echo "**Node.js Package Files:** $total_node_files"
    echo "**Missing Lockfiles:** $total_missing_lockfiles"
    echo "**Files with Unpinned Deps:** $total_unpinned"
    echo "**Status:** $status_icon $(get_status_text "$status")"
    echo ""
    
    # Python details
    if [[ ${#python_details[@]} -gt 0 ]]; then
        md_header 3 "Python Requirements"
        
        md_table_header "File" "Dependencies" "Unpinned"
        for detail in "${python_details[@]}"; do
            IFS='|' read -r file count unpinned <<< "$detail"
            local unpinned_display="${unpinned:-✅ None}"
            md_table_row "$file" "$count" "$unpinned_display"
        done
        echo ""
    fi
    
    # Node details
    if [[ ${#node_details[@]} -gt 0 ]]; then
        md_header 3 "Node.js Packages"
        
        md_table_header "File" "Deps" "DevDeps" "Lockfile"
        for detail in "${node_details[@]}"; do
            IFS='|' read -r file deps dev_deps lockfile unpinned <<< "$detail"
            local lockfile_display="${lockfile:-❌ Missing}"
            [[ -n "$lockfile" ]] && lockfile_display="✅ $lockfile"
            md_table_row "$file" "$deps" "$dev_deps" "$lockfile_display"
        done
        echo ""
    fi
    
    # Missing lockfiles
    if [[ ${#missing_lockfile_list[@]} -gt 0 ]]; then
        md_header 3 "Missing Lockfiles (${#missing_lockfile_list[@]})"
        
        for file in "${missing_lockfile_list[@]}"; do
            md_list_item "\`$file\`"
        done
        echo ""
    fi
    
    # Unpinned dependencies
    if [[ ${#unpinned_list[@]} -gt 0 ]]; then
        md_header 3 "Unpinned Dependencies"
        
        for item in "${unpinned_list[@]}"; do
            md_list_item "$item"
        done
        echo ""
    fi
    
    # Return status for summary
    echo "__STATUS__:deps:$status:$total_missing_lockfiles missing lockfiles"
}

# Generate JSON output
output_deps_json() {
    log_info "Scanning for dependencies..."
    
    local total_python_files=0
    local total_node_files=0
    local total_unpinned=0
    local total_missing_lockfiles=0
    
    echo "{"
    echo "  \"category\": \"dependencies\","
    
    # Collect data
    echo "  \"python\": ["
    local first=true
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        [[ ! -f "$file" ]] && continue
        
        file="${file#./}"
        ((total_python_files++)) || true
        
        local count
        count=$(count_requirements "$file")
        
        [[ "$first" != "true" ]] && echo ","
        first=false
        
        echo "    {"
        echo "      \"file\": \"$(json_escape "$file")\","
        echo "      \"count\": $count"
        echo -n "    }"
    done < <(find_requirements_files)
    echo ""
    echo "  ],"
    
    echo "  \"nodejs\": ["
    first=true
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        [[ ! -f "$file" ]] && continue
        
        file="${file#./}"
        local dir
        dir=$(dirname "$file")
        ((total_node_files++)) || true
        
        local counts
        counts=$(count_node_deps "$file")
        local deps="${counts%%:*}"
        local dev_deps="${counts##*:}"
        
        local lockfile=""
        local has_lock="false"
        if lockfile=$(has_lockfile "$dir"); then
            has_lock="true"
        else
            ((total_missing_lockfiles++)) || true
        fi
        
        [[ "$first" != "true" ]] && echo ","
        first=false
        
        echo "    {"
        echo "      \"file\": \"$(json_escape "$file")\","
        echo "      \"dependencies\": $deps,"
        echo "      \"devDependencies\": $dev_deps,"
        echo "      \"hasLockfile\": $has_lock,"
        echo "      \"lockfile\": \"$lockfile\""
        echo -n "    }"
    done < <(find_package_json_files)
    echo ""
    echo "  ],"
    
    local status
    if [[ $total_missing_lockfiles -gt 3 ]]; then
        status="critical"
    elif [[ $total_missing_lockfiles -gt 0 ]]; then
        status="warning"
    else
        status="good"
    fi
    
    echo "  \"summary\": {"
    echo "    \"python_files\": $total_python_files,"
    echo "    \"node_files\": $total_node_files,"
    echo "    \"missing_lockfiles\": $total_missing_lockfiles"
    echo "  },"
    echo "  \"status\": \"$status\""
    echo "}"
}

# Generate CSV output
output_deps_csv() {
    csv_header "Type" "File" "Dependencies" "DevDependencies" "Lockfile" "Status"
    
    # Python
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        [[ ! -f "$file" ]] && continue
        
        file="${file#./}"
        local count
        count=$(count_requirements "$file")
        
        csv_row "python" "$file" "$count" "N/A" "N/A" "present"
    done < <(find_requirements_files)
    
    # Node
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        [[ ! -f "$file" ]] && continue
        
        file="${file#./}"
        local dir
        dir=$(dirname "$file")
        
        local counts
        counts=$(count_node_deps "$file")
        local deps="${counts%%:*}"
        local dev_deps="${counts##*:}"
        
        local lockfile=""
        local status="missing_lockfile"
        if lockfile=$(has_lockfile "$dir"); then
            status="ok"
        fi
        
        csv_row "nodejs" "$file" "$deps" "$dev_deps" "$lockfile" "$status"
    done < <(find_package_json_files)
}

# -----------------------------------------------------------------------------
# Main Entry Point
# -----------------------------------------------------------------------------

run_deps_audit() {
    local format="${1:-markdown}"
    
    case "$format" in
        markdown) output_deps_markdown ;;
        json) output_deps_json ;;
        csv) output_deps_csv ;;
        *) 
            log_error "Unknown format: $format"
            return 1
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_deps_audit "${1:-markdown}"
fi
