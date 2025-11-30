#!/bin/bash
# =============================================================================
# PrintShop OS - TODO/FIXME Scanner Module
# =============================================================================
# Scans codebase for:
# - TODO, FIXME, BUG, HACK, XXX comments
# - Groups by file and priority
# - Counts totals per category
# =============================================================================

set -euo pipefail

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

# Comment patterns to search for
PATTERNS=(
    "TODO"
    "FIXME"
    "BUG"
    "HACK"
    "XXX"
    "WARN"
    "NOTE"
)

# High priority patterns
HIGH_PRIORITY_PATTERNS=(
    "FIXME"
    "BUG"
    "HACK"
)

# File extensions to scan
SCAN_EXTENSIONS=(
    "ts"
    "tsx"
    "js"
    "jsx"
    "py"
    "go"
    "sh"
    "bash"
    "yml"
    "yaml"
    "json"
    "md"
    "sql"
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
    ".turbo"
)

# -----------------------------------------------------------------------------
# TODO Scanning Functions
# -----------------------------------------------------------------------------

# Build grep pattern for all markers
build_grep_pattern() {
    local pattern=""
    for p in "${PATTERNS[@]}"; do
        if [[ -z "$pattern" ]]; then
            pattern="$p"
        else
            pattern+="|$p"
        fi
    done
    echo "$pattern"
}

# Build find extension pattern
build_extension_pattern() {
    local pattern=""
    for ext in "${SCAN_EXTENSIONS[@]}"; do
        if [[ -z "$pattern" ]]; then
            pattern="-name '*.$ext'"
        else
            pattern+=" -o -name '*.$ext'"
        fi
    done
    echo "$pattern"
}

# Find all code files
find_code_files() {
    find . \
        -path '*/node_modules' -prune -o \
        -path '*/.git' -prune -o \
        -path '*/dist' -prune -o \
        -path '*/build' -prune -o \
        -path '*/.next' -prune -o \
        -path '*/coverage' -prune -o \
        -path '*/__pycache__' -prune -o \
        -path '*/.venv' -prune -o \
        -path '*/venv' -prune -o \
        -path '*/.turbo' -prune -o \
        \( \
            -name "*.ts" -o \
            -name "*.tsx" -o \
            -name "*.js" -o \
            -name "*.jsx" -o \
            -name "*.py" -o \
            -name "*.go" -o \
            -name "*.sh" -o \
            -name "*.bash" -o \
            -name "*.yml" -o \
            -name "*.yaml" -o \
            -name "*.json" -o \
            -name "*.sql" \
        \) -type f -print 2>/dev/null
}

# Get priority for a pattern
get_priority() {
    local pattern="$1"
    
    for p in "${HIGH_PRIORITY_PATTERNS[@]}"; do
        if [[ "$pattern" == "$p" ]]; then
            echo "high"
            return
        fi
    done
    
    echo "normal"
}

# Search for TODOs in a file
search_file_todos() {
    local file="$1"
    local pattern
    pattern=$(build_grep_pattern)
    
    grep -n -E "(${pattern})[: ]" "$file" 2>/dev/null || true
}

# Extract category from line
extract_category() {
    local line="$1"
    
    for p in "${PATTERNS[@]}"; do
        if echo "$line" | grep -qE "${p}[: ]"; then
            echo "$p"
            return
        fi
    done
    
    echo "OTHER"
}

# Clean up the TODO content for display
clean_todo_content() {
    local line="$1"
    
    # Remove line number prefix
    line="${line#*:}"
    
    # Remove common comment prefixes
    line=$(echo "$line" | sed -E 's/^[[:space:]]*(\/\/|#|\/\*|\*|--|<!--)[[:space:]]*//')
    
    # Trim whitespace
    line=$(echo "$line" | sed -E 's/^[[:space:]]+|[[:space:]]+$//')
    
    echo "$line"
}

# -----------------------------------------------------------------------------
# Output Functions
# -----------------------------------------------------------------------------

# Generate markdown output
output_todos_markdown() {
    log_info "Scanning for TODO comments..."
    
    declare -A category_counts
    declare -A category_items
    local total_count=0
    local high_priority_count=0
    
    # Initialize counters
    for p in "${PATTERNS[@]}"; do
        category_counts[$p]=0
        category_items[$p]=""
    done
    
    # Scan all files
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        [[ ! -f "$file" ]] && continue
        
        # Clean up path
        file="${file#./}"
        
        while IFS= read -r line; do
            [[ -z "$line" ]] && continue
            
            local category
            category=$(extract_category "$line")
            local priority
            priority=$(get_priority "$category")
            
            # Extract line number
            local line_num="${line%%:*}"
            local content
            content=$(clean_todo_content "$line")
            
            # Update counters
            if [[ -n "${category_counts[$category]:-}" ]]; then
                category_counts[$category]=$((${category_counts[$category]} + 1))
            fi
            
            ((total_count++)) || true
            
            if [[ "$priority" == "high" ]]; then
                ((high_priority_count++)) || true
            fi
            
            # Store item for later display
            if [[ -n "${category_items[$category]:-}" ]]; then
                category_items[$category]+=$'\n'"$file:$line_num: $content"
            else
                category_items[$category]="$file:$line_num: $content"
            fi
        done < <(search_file_todos "$file")
    done < <(find_code_files)
    
    # Determine status
    local status
    if [[ $high_priority_count -gt 10 ]]; then
        status="critical"
    elif [[ $total_count -gt 30 ]]; then
        status="warning"
    else
        status="good"
    fi
    
    local status_icon
    status_icon=$(get_status_icon "$status")
    
    # Output
    md_header 2 "TODO/FIXME/BUG Scanning"
    
    echo "**Total Items:** $total_count"
    echo "**High Priority (FIXME/BUG/HACK):** $high_priority_count"
    echo "**Status:** $status_icon $(get_status_text "$status")"
    echo ""
    
    # Summary table
    md_header 3 "Summary by Category"
    
    md_table_header "Category" "Count" "Priority"
    for p in "${PATTERNS[@]}"; do
        local count="${category_counts[$p]:-0}"
        if [[ $count -gt 0 ]]; then
            local priority
            priority=$(get_priority "$p")
            md_table_row "$p" "$count" "$priority"
        fi
    done
    echo ""
    
    # High priority items detail
    if [[ $high_priority_count -gt 0 ]]; then
        md_header 3 "High Priority Items"
        
        for p in "${HIGH_PRIORITY_PATTERNS[@]}"; do
            local items="${category_items[$p]:-}"
            if [[ -n "$items" ]]; then
                echo "**$p:**"
                echo ""
                echo "$items" | while IFS= read -r item; do
                    [[ -n "$item" ]] && md_list_item "\`$item\`"
                done
                echo ""
            fi
        done
    fi
    
    # All items by category (if verbose)
    if [[ "$VERBOSE" == "true" ]]; then
        md_header 3 "All Items by Category"
        
        for p in "${PATTERNS[@]}"; do
            local items="${category_items[$p]:-}"
            if [[ -n "$items" ]]; then
                echo "**$p (${category_counts[$p]}):**"
                echo ""
                echo "$items" | while IFS= read -r item; do
                    [[ -n "$item" ]] && md_list_item "\`$item\`"
                done
                echo ""
            fi
        done
    fi
    
    # Return status for summary
    echo "__STATUS__:todos:$status:$total_count items"
}

# Generate JSON output
output_todos_json() {
    log_info "Scanning for TODO comments..."
    
    declare -A category_counts
    local -a all_items=()
    local total_count=0
    local high_priority_count=0
    
    for p in "${PATTERNS[@]}"; do
        category_counts[$p]=0
    done
    
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        [[ ! -f "$file" ]] && continue
        
        file="${file#./}"
        
        while IFS= read -r line; do
            [[ -z "$line" ]] && continue
            
            local category
            category=$(extract_category "$line")
            local priority
            priority=$(get_priority "$category")
            local line_num="${line%%:*}"
            local content
            content=$(clean_todo_content "$line")
            
            if [[ -n "${category_counts[$category]:-}" ]]; then
                category_counts[$category]=$((${category_counts[$category]} + 1))
            fi
            
            ((total_count++)) || true
            
            if [[ "$priority" == "high" ]]; then
                ((high_priority_count++)) || true
            fi
            
            all_items+=("$category|$file|$line_num|$content|$priority")
        done < <(search_file_todos "$file")
    done < <(find_code_files)
    
    local status
    if [[ $high_priority_count -gt 10 ]]; then
        status="critical"
    elif [[ $total_count -gt 30 ]]; then
        status="warning"
    else
        status="good"
    fi
    
    echo "{"
    echo "  \"category\": \"todos\","
    echo "  \"summary\": {"
    echo "    \"total\": $total_count,"
    echo "    \"high_priority\": $high_priority_count"
    echo "  },"
    echo "  \"status\": \"$status\","
    
    # Category counts
    echo "  \"by_category\": {"
    local first=true
    for p in "${PATTERNS[@]}"; do
        local count="${category_counts[$p]:-0}"
        [[ "$first" != "true" ]] && echo ","
        first=false
        echo -n "    \"$p\": $count"
    done
    echo ""
    echo "  },"
    
    # All items
    echo "  \"items\": ["
    first=true
    for item in "${all_items[@]}"; do
        IFS='|' read -r cat file line_num content priority <<< "$item"
        
        [[ "$first" != "true" ]] && echo ","
        first=false
        
        echo "    {"
        echo "      \"category\": \"$cat\","
        echo "      \"file\": \"$(json_escape "$file")\","
        echo "      \"line\": $line_num,"
        echo "      \"content\": \"$(json_escape "$content")\","
        echo "      \"priority\": \"$priority\""
        echo -n "    }"
    done
    echo ""
    echo "  ]"
    echo "}"
}

# Generate CSV output
output_todos_csv() {
    csv_header "Category" "File" "Line" "Content" "Priority"
    
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        [[ ! -f "$file" ]] && continue
        
        file="${file#./}"
        
        while IFS= read -r line; do
            [[ -z "$line" ]] && continue
            
            local category
            category=$(extract_category "$line")
            local priority
            priority=$(get_priority "$category")
            local line_num="${line%%:*}"
            local content
            content=$(clean_todo_content "$line")
            
            csv_row "$category" "$file" "$line_num" "$content" "$priority"
        done < <(search_file_todos "$file")
    done < <(find_code_files)
}

# -----------------------------------------------------------------------------
# Main Entry Point
# -----------------------------------------------------------------------------

run_todos_audit() {
    local format="${1:-markdown}"
    
    case "$format" in
        markdown) output_todos_markdown ;;
        json) output_todos_json ;;
        csv) output_todos_csv ;;
        *) 
            log_error "Unknown format: $format"
            return 1
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_todos_audit "${1:-markdown}"
fi
