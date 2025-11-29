#!/bin/bash
# =============================================================================
# PrintShop OS - Documentation Audit Module
# =============================================================================
# Analyzes documentation for:
# - README.md files per directory
# - docs/ subdirectories
# - Orphaned documentation
# - SERVICE_DIRECTORY.md completeness
# =============================================================================

set -euo pipefail

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

# Documentation file patterns
DOC_PATTERNS=(
    "README.md"
    "readme.md"
    "README.MD"
    "CHANGELOG.md"
    "CONTRIBUTING.md"
)

# Key documentation files that should exist
REQUIRED_ROOT_DOCS=(
    "README.md"
    "ARCHITECTURE.md"
    "SERVICE_DIRECTORY.md"
)

# Directories that should have READMEs
SHOULD_HAVE_README=(
    "services/*"
    "frontend"
    "printshop-strapi"
    "docs"
    "scripts"
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
# Documentation Analysis Functions
# -----------------------------------------------------------------------------

# Find all README files
find_readme_files() {
    find . \
        -path '*/node_modules' -prune -o \
        -path '*/.git' -prune -o \
        -path '*/dist' -prune -o \
        -path '*/build' -prune -o \
        -name "README.md" -type f -print 2>/dev/null | sort
}

# Find all markdown files
find_all_markdown() {
    find . \
        -path '*/node_modules' -prune -o \
        -path '*/.git' -prune -o \
        -path '*/dist' -prune -o \
        -path '*/build' -prune -o \
        -name "*.md" -type f -print 2>/dev/null | sort
}

# Find docs directories
find_docs_directories() {
    find . \
        -path '*/node_modules' -prune -o \
        -path '*/.git' -prune -o \
        -type d -name "docs" -print 2>/dev/null | sort
}

# Get directories that should have README
get_directories_needing_readme() {
    local -a dirs=()
    
    # Check services
    if [[ -d "services" ]]; then
        for dir in services/*/; do
            [[ -d "$dir" ]] && dirs+=("${dir%/}")
        done
    fi
    
    # Check other key directories
    for dir in "frontend" "printshop-strapi" "docs" "scripts" "lib"; do
        [[ -d "$dir" ]] && dirs+=("$dir")
    done
    
    printf '%s\n' "${dirs[@]}"
}

# Check if directory has README
has_readme() {
    local dir="$1"
    [[ -f "$dir/README.md" ]] || [[ -f "$dir/readme.md" ]] || [[ -f "$dir/README.MD" ]]
}

# Check SERVICE_DIRECTORY.md for service references
check_service_directory_completeness() {
    local service_dir_file="SERVICE_DIRECTORY.md"
    
    if [[ ! -f "$service_dir_file" ]]; then
        echo "missing"
        return
    fi
    
    local -a missing_services=()
    
    # Check each service
    if [[ -d "services" ]]; then
        for dir in services/*/; do
            local service_name
            service_name=$(basename "$dir")
            if ! grep -q "$service_name" "$service_dir_file" 2>/dev/null; then
                missing_services+=("$service_name")
            fi
        done
    fi
    
    if [[ ${#missing_services[@]} -eq 0 ]]; then
        echo "complete"
    else
        printf '%s\n' "${missing_services[@]}"
    fi
}

# Find files not referenced in root docs
find_orphaned_docs() {
    local -a orphaned=()
    local -a root_docs=()
    
    # Get content of root markdown files
    local all_root_content=""
    for doc in *.md; do
        [[ -f "$doc" ]] && all_root_content+=$(cat "$doc" 2>/dev/null)$'\n'
    done
    
    # Check each markdown file in docs/
    if [[ -d "docs" ]]; then
        while IFS= read -r file; do
            [[ -z "$file" ]] && continue
            
            local basename
            basename=$(basename "$file")
            
            # Check if referenced in root docs
            if ! echo "$all_root_content" | grep -q "$basename" 2>/dev/null; then
                orphaned+=("$file")
            fi
        done < <(find docs -maxdepth 2 -name "*.md" -type f 2>/dev/null)
    fi
    
    printf '%s\n' "${orphaned[@]}"
}

# Count lines in markdown file
count_doc_lines() {
    local file="$1"
    if [[ -f "$file" ]]; then
        wc -l < "$file" | tr -d ' '
    else
        echo "0"
    fi
}

# -----------------------------------------------------------------------------
# Output Functions
# -----------------------------------------------------------------------------

# Generate markdown output
output_docs_markdown() {
    log_info "Scanning for documentation..."
    
    # Collect README files
    local -a readme_files=()
    while IFS= read -r file; do
        [[ -n "$file" ]] && readme_files+=("$file")
    done < <(find_readme_files)
    
    # Find directories missing READMEs
    local -a missing_readme=()
    while IFS= read -r dir; do
        [[ -z "$dir" ]] && continue
        if ! has_readme "$dir"; then
            missing_readme+=("$dir")
        fi
    done < <(get_directories_needing_readme)
    
    # Find orphaned docs
    local -a orphaned=()
    while IFS= read -r file; do
        [[ -n "$file" ]] && orphaned+=("$file")
    done < <(find_orphaned_docs)
    
    # Check SERVICE_DIRECTORY.md
    local service_dir_status
    service_dir_status=$(check_service_directory_completeness)
    
    # Count total markdown files
    local total_md_count
    total_md_count=$(find_all_markdown | wc -l | tr -d ' ')
    
    # Find docs directories
    local -a docs_dirs=()
    while IFS= read -r dir; do
        [[ -n "$dir" ]] && docs_dirs+=("$dir")
    done < <(find_docs_directories)
    
    # Determine status
    local status
    if [[ ${#missing_readme[@]} -gt 5 ]] || [[ "$service_dir_status" == "missing" ]]; then
        status="critical"
    elif [[ ${#missing_readme[@]} -gt 0 ]] || [[ ${#orphaned[@]} -gt 10 ]]; then
        status="warning"
    else
        status="good"
    fi
    
    local status_icon
    status_icon=$(get_status_icon "$status")
    
    # Output
    md_header 2 "Documentation Index Check"
    
    echo "**Total Markdown Files:** $total_md_count"
    echo "**README Files Found:** ${#readme_files[@]}"
    echo "**docs/ Directories:** ${#docs_dirs[@]}"
    echo "**Directories Missing README:** ${#missing_readme[@]}"
    echo "**Orphaned Docs:** ${#orphaned[@]}"
    echo "**Status:** $status_icon $(get_status_text "$status")"
    echo ""
    
    # Root documentation check
    md_header 3 "Required Root Documentation"
    
    md_table_header "File" "Status" "Lines"
    for doc in "${REQUIRED_ROOT_DOCS[@]}"; do
        if [[ -f "$doc" ]]; then
            local lines
            lines=$(count_doc_lines "$doc")
            md_table_row "$doc" "$ICON_GOOD Present" "$lines"
        else
            md_table_row "$doc" "$ICON_CRITICAL Missing" "0"
        fi
    done
    echo ""
    
    # SERVICE_DIRECTORY.md status
    md_header 3 "SERVICE_DIRECTORY.md Completeness"
    
    if [[ "$service_dir_status" == "complete" ]]; then
        echo "$ICON_GOOD All services documented"
    elif [[ "$service_dir_status" == "missing" ]]; then
        echo "$ICON_CRITICAL SERVICE_DIRECTORY.md not found"
    else
        echo "$ICON_WARN Services not documented:"
        echo "$service_dir_status" | while IFS= read -r service; do
            [[ -n "$service" ]] && md_list_item "$service"
        done
    fi
    echo ""
    
    # Missing READMEs
    if [[ ${#missing_readme[@]} -gt 0 ]]; then
        md_header 3 "Directories Missing README (${#missing_readme[@]})"
        
        for dir in "${missing_readme[@]}"; do
            md_list_item "\`$dir\`"
        done
        echo ""
    fi
    
    # Orphaned docs
    if [[ ${#orphaned[@]} -gt 0 ]]; then
        md_header 3 "Potentially Orphaned Documentation (${#orphaned[@]})"
        
        echo "*Files in docs/ not referenced in root documentation:*"
        echo ""
        for file in "${orphaned[@]}"; do
            md_list_item "\`$file\`"
        done
        echo ""
    fi
    
    # Return status for summary
    echo "__STATUS__:docs:$status:${#orphaned[@]} orphaned"
}

# Generate JSON output
output_docs_json() {
    log_info "Scanning for documentation..."
    
    local -a readme_files=()
    while IFS= read -r file; do
        [[ -n "$file" ]] && readme_files+=("$file")
    done < <(find_readme_files)
    
    local -a missing_readme=()
    while IFS= read -r dir; do
        [[ -z "$dir" ]] && continue
        if ! has_readme "$dir"; then
            missing_readme+=("$dir")
        fi
    done < <(get_directories_needing_readme)
    
    local -a orphaned=()
    while IFS= read -r file; do
        [[ -n "$file" ]] && orphaned+=("$file")
    done < <(find_orphaned_docs)
    
    local total_md_count
    total_md_count=$(find_all_markdown | wc -l | tr -d ' ')
    
    local status
    if [[ ${#missing_readme[@]} -gt 5 ]]; then
        status="critical"
    elif [[ ${#missing_readme[@]} -gt 0 ]] || [[ ${#orphaned[@]} -gt 10 ]]; then
        status="warning"
    else
        status="good"
    fi
    
    echo "{"
    echo "  \"category\": \"docs\","
    echo "  \"summary\": {"
    echo "    \"total_markdown_files\": $total_md_count,"
    echo "    \"readme_count\": ${#readme_files[@]},"
    echo "    \"missing_readme_count\": ${#missing_readme[@]},"
    echo "    \"orphaned_count\": ${#orphaned[@]}"
    echo "  },"
    echo "  \"status\": \"$status\","
    
    # Root docs check
    echo "  \"root_docs\": ["
    local first=true
    for doc in "${REQUIRED_ROOT_DOCS[@]}"; do
        [[ "$first" != "true" ]] && echo ","
        first=false
        
        local exists="false"
        local lines=0
        if [[ -f "$doc" ]]; then
            exists="true"
            lines=$(count_doc_lines "$doc")
        fi
        
        echo "    {"
        echo "      \"file\": \"$doc\","
        echo "      \"exists\": $exists,"
        echo "      \"lines\": $lines"
        echo -n "    }"
    done
    echo ""
    echo "  ],"
    
    # Missing READMEs
    echo "  \"missing_readme\": ["
    first=true
    for dir in "${missing_readme[@]}"; do
        [[ "$first" != "true" ]] && echo ","
        first=false
        echo -n "    \"$(json_escape "$dir")\""
    done
    echo ""
    echo "  ],"
    
    # Orphaned docs
    echo "  \"orphaned\": ["
    first=true
    for file in "${orphaned[@]}"; do
        [[ "$first" != "true" ]] && echo ","
        first=false
        echo -n "    \"$(json_escape "$file")\""
    done
    echo ""
    echo "  ]"
    echo "}"
}

# Generate CSV output
output_docs_csv() {
    csv_header "File" "Type" "Directory" "Lines" "Status"
    
    # Root docs
    for doc in *.md; do
        [[ -f "$doc" ]] || continue
        local lines
        lines=$(count_doc_lines "$doc")
        csv_row "$doc" "root" "." "$lines" "present"
    done
    
    # All other markdown files
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        [[ "$file" == "./"* ]] && file="${file:2}"
        [[ "$file" == *.md ]] || continue
        [[ "$file" != *"/"* ]] && continue  # Skip root files already processed
        
        local dir
        dir=$(dirname "$file")
        local lines
        lines=$(count_doc_lines "$file")
        local type="subdirectory"
        [[ "$dir" == "docs"* ]] && type="docs"
        
        csv_row "$file" "$type" "$dir" "$lines" "present"
    done < <(find_all_markdown)
}

# -----------------------------------------------------------------------------
# Main Entry Point
# -----------------------------------------------------------------------------

run_docs_audit() {
    local format="${1:-markdown}"
    
    case "$format" in
        markdown) output_docs_markdown ;;
        json) output_docs_json ;;
        csv) output_docs_csv ;;
        *) 
            log_error "Unknown format: $format"
            return 1
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_docs_audit "${1:-markdown}"
fi
