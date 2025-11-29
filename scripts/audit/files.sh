#!/bin/bash
# =============================================================================
# PrintShop OS - Large File Detection Module
# =============================================================================
# Detects:
# - Files over 1MB
# - Potential node_modules or build artifacts committed
# - Binary files that might not belong
# =============================================================================

set -euo pipefail

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

# Configuration
LARGE_FILE_THRESHOLD="${LARGE_FILE_THRESHOLD:-1048576}"  # 1MB in bytes
VERY_LARGE_THRESHOLD=$((LARGE_FILE_THRESHOLD * 10))       # 10MB

# Problematic paths that shouldn't be in git
PROBLEMATIC_PATHS=(
    "node_modules"
    ".venv"
    "venv"
    "__pycache__"
    ".cache"
    ".npm"
    ".yarn"
    "dist"
    "build"
    ".next"
    "coverage"
    ".turbo"
)

# Binary file extensions that might be problematic
BINARY_EXTENSIONS=(
    "exe"
    "dll"
    "so"
    "dylib"
    "bin"
    "zip"
    "tar"
    "gz"
    "rar"
    "7z"
    "jar"
    "war"
    "ear"
    "class"
    "pyc"
    "pyo"
    "o"
    "a"
    "lib"
)

# Expected binary files (not problematic)
EXPECTED_BINARIES=(
    ".png"
    ".jpg"
    ".jpeg"
    ".gif"
    ".ico"
    ".svg"
    ".pdf"
    ".woff"
    ".woff2"
    ".ttf"
    ".eot"
)

# -----------------------------------------------------------------------------
# File Detection Functions
# -----------------------------------------------------------------------------

# Find large files in git or filesystem
find_large_files() {
    local threshold="$1"
    
    if is_git_repo; then
        # Use git ls-files for tracked files
        git ls-files -z 2>/dev/null | while IFS= read -r -d '' file; do
            if [[ -f "$file" ]]; then
                local size
                size=$(get_file_size "$file")
                if [[ "$size" -ge "$threshold" ]]; then
                    echo "$file|$size"
                fi
            fi
        done
    else
        # Fallback to find
        find . \
            -path '*/node_modules' -prune -o \
            -path '*/.git' -prune -o \
            -type f -size +"$((threshold / 1024))k" -print 2>/dev/null | while IFS= read -r file; do
            file="${file#./}"
            local size
            size=$(get_file_size "$file")
            echo "$file|$size"
        done
    fi
}

# Find problematic directories that shouldn't be tracked
find_problematic_paths() {
    if is_git_repo; then
        for path in "${PROBLEMATIC_PATHS[@]}"; do
            # Check if any files under this path are tracked
            local count
            count=$(git ls-files "$path" 2>/dev/null | head -100 | wc -l | tr -d ' ')
            if [[ "$count" -gt 0 ]]; then
                echo "$path|$count"
            fi
        done
    fi
}

# Find binary files
find_binary_files() {
    if is_git_repo; then
        git ls-files -z 2>/dev/null | while IFS= read -r -d '' file; do
            local ext="${file##*.}"
            ext="${ext,,}"  # lowercase
            
            # Check if it's a problematic binary
            for bin_ext in "${BINARY_EXTENSIONS[@]}"; do
                if [[ "$ext" == "$bin_ext" ]]; then
                    local size
                    size=$(get_file_size "$file")
                    echo "$file|$ext|$size"
                    break
                fi
            done
        done
    fi
}

# Check if file is expected binary
is_expected_binary() {
    local file="$1"
    
    for ext in "${EXPECTED_BINARIES[@]}"; do
        if [[ "$file" == *"$ext" ]]; then
            return 0
        fi
    done
    
    return 1
}

# Get total size of directory in git
get_git_dir_size() {
    local dir="$1"
    local total=0
    
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        local size
        size=$(get_file_size "$file")
        ((total += size)) || true
    done < <(git ls-files "$dir" 2>/dev/null)
    
    echo "$total"
}

# -----------------------------------------------------------------------------
# Output Functions
# -----------------------------------------------------------------------------

# Generate markdown output
output_files_markdown() {
    log_info "Scanning for large files..."
    
    local -a large_files=()
    local -a very_large_files=()
    local -a problematic=()
    local -a binaries=()
    
    local total_large_size=0
    
    # Find large files
    while IFS='|' read -r file size; do
        [[ -z "$file" ]] && continue
        
        ((total_large_size += size)) || true
        
        if [[ "$size" -ge "$VERY_LARGE_THRESHOLD" ]]; then
            very_large_files+=("$file|$size")
        else
            large_files+=("$file|$size")
        fi
    done < <(find_large_files "$LARGE_FILE_THRESHOLD")
    
    # Find problematic paths
    while IFS='|' read -r path count; do
        [[ -z "$path" ]] && continue
        problematic+=("$path|$count")
    done < <(find_problematic_paths)
    
    # Find binaries
    while IFS='|' read -r file ext size; do
        [[ -z "$file" ]] && continue
        binaries+=("$file|$ext|$size")
    done < <(find_binary_files)
    
    # Determine status
    local total_large=$((${#large_files[@]} + ${#very_large_files[@]}))
    local status
    if [[ ${#problematic[@]} -gt 0 ]] || [[ ${#very_large_files[@]} -gt 0 ]]; then
        status="critical"
    elif [[ $total_large -gt 10 ]] || [[ ${#binaries[@]} -gt 20 ]]; then
        status="warning"
    else
        status="good"
    fi
    
    local status_icon
    status_icon=$(get_status_icon "$status")
    
    # Output
    md_header 2 "Large File Detection"
    
    echo "**Files > 1MB:** $total_large"
    echo "**Files > 10MB:** ${#very_large_files[@]}"
    echo "**Problematic Paths:** ${#problematic[@]}"
    echo "**Binary Files:** ${#binaries[@]}"
    echo "**Total Large File Size:** $(bytes_to_human "$total_large_size")"
    echo "**Status:** $status_icon $(get_status_text "$status")"
    echo ""
    
    # Very large files (critical)
    if [[ ${#very_large_files[@]} -gt 0 ]]; then
        md_header 3 "Very Large Files (>10MB) - CRITICAL"
        
        md_table_header "File" "Size"
        for item in "${very_large_files[@]}"; do
            IFS='|' read -r file size <<< "$item"
            md_table_row "$file" "$(bytes_to_human "$size")"
        done
        echo ""
    fi
    
    # Problematic paths
    if [[ ${#problematic[@]} -gt 0 ]]; then
        md_header 3 "Problematic Committed Paths - CRITICAL"
        
        echo "**These directories should NOT be committed to git:**"
        echo ""
        
        md_table_header "Path" "Files Tracked"
        for item in "${problematic[@]}"; do
            IFS='|' read -r path count <<< "$item"
            md_table_row "\`$path\`" "$count"
        done
        echo ""
        
        echo "**Recommended Fix:**"
        echo "\`\`\`bash"
        for item in "${problematic[@]}"; do
            IFS='|' read -r path count <<< "$item"
            echo "echo '$path/' >> .gitignore"
            echo "git rm -r --cached $path/"
        done
        echo "\`\`\`"
        echo ""
    fi
    
    # Large files (warning)
    if [[ ${#large_files[@]} -gt 0 ]]; then
        md_header 3 "Large Files (1-10MB)"
        
        md_table_header "File" "Size"
        for item in "${large_files[@]}"; do
            IFS='|' read -r file size <<< "$item"
            md_table_row "$file" "$(bytes_to_human "$size")"
        done
        echo ""
    fi
    
    # Binary files (if there are problematic ones)
    local problematic_binaries=()
    for item in "${binaries[@]}"; do
        IFS='|' read -r file ext size <<< "$item"
        if ! is_expected_binary "$file"; then
            problematic_binaries+=("$item")
        fi
    done
    
    if [[ ${#problematic_binaries[@]} -gt 0 ]]; then
        md_header 3 "Potentially Problematic Binary Files"
        
        md_table_header "File" "Extension" "Size"
        for item in "${problematic_binaries[@]}"; do
            IFS='|' read -r file ext size <<< "$item"
            md_table_row "$file" "$ext" "$(bytes_to_human "$size")"
        done
        echo ""
    fi
    
    # Return status for summary
    echo "__STATUS__:files:$status:$total_large large files"
}

# Generate JSON output
output_files_json() {
    log_info "Scanning for large files..."
    
    local -a large_files=()
    local -a problematic=()
    local -a binaries=()
    local total_large_size=0
    
    while IFS='|' read -r file size; do
        [[ -z "$file" ]] && continue
        ((total_large_size += size)) || true
        large_files+=("$file|$size")
    done < <(find_large_files "$LARGE_FILE_THRESHOLD")
    
    while IFS='|' read -r path count; do
        [[ -z "$path" ]] && continue
        problematic+=("$path|$count")
    done < <(find_problematic_paths)
    
    while IFS='|' read -r file ext size; do
        [[ -z "$file" ]] && continue
        binaries+=("$file|$ext|$size")
    done < <(find_binary_files)
    
    local status
    if [[ ${#problematic[@]} -gt 0 ]]; then
        status="critical"
    elif [[ ${#large_files[@]} -gt 10 ]]; then
        status="warning"
    else
        status="good"
    fi
    
    echo "{"
    echo "  \"category\": \"files\","
    echo "  \"summary\": {"
    echo "    \"large_files\": ${#large_files[@]},"
    echo "    \"problematic_paths\": ${#problematic[@]},"
    echo "    \"binary_files\": ${#binaries[@]},"
    echo "    \"total_large_size\": $total_large_size"
    echo "  },"
    echo "  \"status\": \"$status\","
    
    # Large files
    echo "  \"large_files\": ["
    local first=true
    for item in "${large_files[@]}"; do
        IFS='|' read -r file size <<< "$item"
        
        [[ "$first" != "true" ]] && echo ","
        first=false
        
        echo "    {"
        echo "      \"file\": \"$(json_escape "$file")\","
        echo "      \"size\": $size,"
        echo "      \"size_human\": \"$(bytes_to_human "$size")\""
        echo -n "    }"
    done
    echo ""
    echo "  ],"
    
    # Problematic paths
    echo "  \"problematic_paths\": ["
    first=true
    for item in "${problematic[@]}"; do
        IFS='|' read -r path count <<< "$item"
        
        [[ "$first" != "true" ]] && echo ","
        first=false
        
        echo "    {"
        echo "      \"path\": \"$(json_escape "$path")\","
        echo "      \"files_tracked\": $count"
        echo -n "    }"
    done
    echo ""
    echo "  ],"
    
    # Binary files
    echo "  \"binary_files\": ["
    first=true
    for item in "${binaries[@]}"; do
        IFS='|' read -r file ext size <<< "$item"
        
        [[ "$first" != "true" ]] && echo ","
        first=false
        
        echo "    {"
        echo "      \"file\": \"$(json_escape "$file")\","
        echo "      \"extension\": \"$ext\","
        echo "      \"size\": $size"
        echo -n "    }"
    done
    echo ""
    echo "  ]"
    echo "}"
}

# Generate CSV output
output_files_csv() {
    csv_header "Type" "File" "Extension" "Size" "Size Human" "Issue"
    
    # Large files
    while IFS='|' read -r file size; do
        [[ -z "$file" ]] && continue
        local ext="${file##*.}"
        local issue="large"
        [[ "$size" -ge "$VERY_LARGE_THRESHOLD" ]] && issue="very_large"
        
        csv_row "large_file" "$file" "$ext" "$size" "$(bytes_to_human "$size")" "$issue"
    done < <(find_large_files "$LARGE_FILE_THRESHOLD")
    
    # Problematic paths
    while IFS='|' read -r path count; do
        [[ -z "$path" ]] && continue
        csv_row "problematic_path" "$path" "N/A" "$count" "N/A" "should_not_be_tracked"
    done < <(find_problematic_paths)
    
    # Binary files
    while IFS='|' read -r file ext size; do
        [[ -z "$file" ]] && continue
        local issue="binary"
        is_expected_binary "$file" && issue="expected_binary"
        
        csv_row "binary" "$file" "$ext" "$size" "$(bytes_to_human "$size")" "$issue"
    done < <(find_binary_files)
}

# -----------------------------------------------------------------------------
# Main Entry Point
# -----------------------------------------------------------------------------

run_files_audit() {
    local format="${1:-markdown}"
    
    case "$format" in
        markdown) output_files_markdown ;;
        json) output_files_json ;;
        csv) output_files_csv ;;
        *) 
            log_error "Unknown format: $format"
            return 1
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_files_audit "${1:-markdown}"
fi
