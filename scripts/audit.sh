#!/bin/bash
# =============================================================================
# PrintShop OS - Repository Audit Script
# =============================================================================
# Generates comprehensive repository health reports covering:
# - Branch status analysis
# - Test file inventory
# - Documentation checks
# - TODO/FIXME scanning
# - Dependency analysis
# - Large file detection
#
# Usage:
#   ./scripts/audit.sh                    # Full audit, markdown output
#   ./scripts/audit.sh --format json      # JSON output
#   ./scripts/audit.sh --format csv       # CSV output
#   ./scripts/audit.sh --check branches   # Run specific check only
#   ./scripts/audit.sh --output report.md # Output to file
#   ./scripts/audit.sh --verbose          # Verbose mode
#   ./scripts/audit.sh --no-color         # Disable colors
#   ./scripts/audit.sh --help             # Show help
#
# =============================================================================

set -euo pipefail

# Script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUDIT_DIR="$SCRIPT_DIR/audit"

# Default configuration
OUTPUT_FORMAT="markdown"
OUTPUT_FILE=""
VERBOSE="false"
NO_COLOR="false"
CHECKS_TO_RUN=()

# Available checks
ALL_CHECKS=(
    "branches"
    "tests"
    "docs"
    "todos"
    "deps"
    "files"
)

# -----------------------------------------------------------------------------
# Help and Usage
# -----------------------------------------------------------------------------

show_help() {
    cat << 'EOF'
PrintShop OS - Repository Audit Script

USAGE:
    ./scripts/audit.sh [OPTIONS]

OPTIONS:
    --format <format>   Output format: markdown (default), json, csv
    --check <check>     Run specific check only (can be used multiple times)
                        Available checks: branches, tests, docs, todos, deps, files
    --output <file>     Write output to file instead of stdout
    --verbose           Enable verbose output
    --no-color          Disable color output
    --help, -h          Show this help message

EXAMPLES:
    # Run full audit with markdown output
    ./scripts/audit.sh

    # Run with JSON output
    ./scripts/audit.sh --format json

    # Run only branch and test checks
    ./scripts/audit.sh --check branches --check tests

    # Save report to file
    ./scripts/audit.sh --output audit-report.md

    # Run in verbose mode without colors
    ./scripts/audit.sh --verbose --no-color

CHECKS:
    branches    Analyze git branches (stale, unmerged, ahead/behind)
    tests       Find test files and coverage by service
    docs        Check documentation completeness
    todos       Scan for TODO/FIXME/BUG comments
    deps        Analyze dependencies and lockfiles
    files       Detect large files and problematic commits

EOF
}

# -----------------------------------------------------------------------------
# Argument Parsing
# -----------------------------------------------------------------------------

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --format)
                if [[ -z "${2:-}" ]]; then
                    echo "Error: --format requires an argument" >&2
                    exit 1
                fi
                OUTPUT_FORMAT="$2"
                if [[ ! "$OUTPUT_FORMAT" =~ ^(markdown|json|csv)$ ]]; then
                    echo "Error: Invalid format '$OUTPUT_FORMAT'. Use: markdown, json, csv" >&2
                    exit 1
                fi
                shift 2
                ;;
            --check)
                if [[ -z "${2:-}" ]]; then
                    echo "Error: --check requires an argument" >&2
                    exit 1
                fi
                local check="$2"
                if [[ ! " ${ALL_CHECKS[*]} " =~ " ${check} " ]]; then
                    echo "Error: Invalid check '$check'. Available: ${ALL_CHECKS[*]}" >&2
                    exit 1
                fi
                CHECKS_TO_RUN+=("$check")
                shift 2
                ;;
            --output)
                if [[ -z "${2:-}" ]]; then
                    echo "Error: --output requires a filename" >&2
                    exit 1
                fi
                OUTPUT_FILE="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE="true"
                shift
                ;;
            --no-color)
                NO_COLOR="true"
                export NO_COLOR="true"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo "Error: Unknown option '$1'" >&2
                echo "Use --help for usage information" >&2
                exit 1
                ;;
        esac
    done

    # If no specific checks requested, run all
    if [[ ${#CHECKS_TO_RUN[@]} -eq 0 ]]; then
        CHECKS_TO_RUN=("${ALL_CHECKS[@]}")
    fi

    # Export for subshells
    export OUTPUT_FORMAT
    export VERBOSE
    export NO_COLOR
}

# -----------------------------------------------------------------------------
# Utility Functions
# -----------------------------------------------------------------------------

# Source utility functions
source_utils() {
    if [[ -f "$AUDIT_DIR/utils.sh" ]]; then
        source "$AUDIT_DIR/utils.sh"
    else
        echo "Error: Cannot find $AUDIT_DIR/utils.sh" >&2
        exit 1
    fi
}

# Get current timestamp
get_timestamp() {
    date -u '+%Y-%m-%d %H:%M:%S UTC'
}

# Get current commit
get_commit() {
    git rev-parse --short HEAD 2>/dev/null || echo "unknown"
}

# Run a specific audit check
run_check() {
    local check="$1"
    local format="$2"
    local script="$AUDIT_DIR/${check}.sh"

    if [[ ! -f "$script" ]]; then
        echo "Error: Check script not found: $script" >&2
        return 1
    fi

    if [[ ! -x "$script" ]]; then
        # Try to source and run if not executable
        source "$script"
        "run_${check}_audit" "$format"
    else
        "$script" "$format"
    fi
}

# -----------------------------------------------------------------------------
# Output Generation
# -----------------------------------------------------------------------------

# Generate markdown header
generate_markdown_header() {
    cat << EOF
# PrintShop OS - Repository Audit Report

**Generated:** $(get_timestamp)
**Commit:** $(get_commit)
**Branch:** $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

---

EOF
}

# Generate JSON header
generate_json_header() {
    cat << EOF
{
  "report": {
    "title": "PrintShop OS - Repository Audit Report",
    "generated": "$(get_timestamp)",
    "commit": "$(get_commit)",
    "branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
  },
  "checks": [
EOF
}

# Generate JSON footer
generate_json_footer() {
    cat << EOF
  ]
}
EOF
}

# Parse status lines from check output
parse_status_line() {
    local line="$1"
    # Format: __STATUS__:category:status:message
    if [[ "$line" =~ ^__STATUS__:([^:]+):([^:]+):(.+)$ ]]; then
        echo "${BASH_REMATCH[1]}|${BASH_REMATCH[2]}|${BASH_REMATCH[3]}"
    fi
}

# Generate summary table from collected statuses
generate_summary_table() {
    local -a statuses=("$@")
    
    echo "## Summary"
    echo ""
    echo "| Category | Status | Issues |"
    echo "|----------|--------|--------|"
    
    for status_line in "${statuses[@]}"; do
        IFS='|' read -r category status message <<< "$status_line"
        
        local icon
        case "$status" in
            good) icon="✅ Good" ;;
            warning) icon="⚠️ Warning" ;;
            critical) icon="🔴 Critical" ;;
            *) icon="ℹ️ Info" ;;
        esac
        
        # Capitalize category
        local cap_category
        cap_category="$(echo "${category:0:1}" | tr '[:lower:]' '[:upper:]')${category:1}"
        
        echo "| $cap_category | $icon | $message |"
    done
    
    echo ""
    echo "---"
    echo ""
}

# -----------------------------------------------------------------------------
# Main Execution
# -----------------------------------------------------------------------------

main() {
    # Parse command line arguments
    parse_args "$@"

    # Source utilities
    source_utils

    # Change to repository root
    local repo_root
    repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || {
        echo "Error: Not a git repository" >&2
        exit 1
    }
    cd "$repo_root"

    # Prepare output
    local output=""
    local -a status_lines=()

    # Generate output based on format
    case "$OUTPUT_FORMAT" in
        markdown)
            output+=$(generate_markdown_header)
            
            # Run each check and collect output
            local check_outputs=""
            for check in "${CHECKS_TO_RUN[@]}"; do
                log_info "Running check: $check"
                
                local check_output
                check_output=$(run_check "$check" "markdown" 2>&1) || true
                
                # Extract status line
                while IFS= read -r line; do
                    if [[ "$line" =~ ^__STATUS__ ]]; then
                        local parsed
                        parsed=$(parse_status_line "$line")
                        [[ -n "$parsed" ]] && status_lines+=("$parsed")
                    fi
                done <<< "$check_output"
                
                # Remove status lines from output
                check_output=$(echo "$check_output" | grep -v "^__STATUS__" || true)
                check_outputs+="$check_output"$'\n'
            done
            
            # Generate summary if we have status lines
            if [[ ${#status_lines[@]} -gt 0 ]]; then
                output+=$(generate_summary_table "${status_lines[@]}")
            fi
            
            output+="$check_outputs"
            ;;
            
        json)
            output+=$(generate_json_header)
            
            local first=true
            for check in "${CHECKS_TO_RUN[@]}"; do
                log_info "Running check: $check"
                
                [[ "$first" != "true" ]] && output+=","
                first=false
                
                local check_output
                check_output=$(run_check "$check" "json" 2>&1) || true
                output+=$'\n'"    $check_output"
            done
            
            output+=$'\n'$(generate_json_footer)
            ;;
            
        csv)
            # For CSV, just concatenate outputs with a header comment
            output+="# PrintShop OS - Repository Audit Report"$'\n'
            output+="# Generated: $(get_timestamp)"$'\n'
            output+="# Commit: $(get_commit)"$'\n'
            output+="#"$'\n'
            
            for check in "${CHECKS_TO_RUN[@]}"; do
                log_info "Running check: $check"
                
                output+="# --- $check ---"$'\n'
                local check_output
                check_output=$(run_check "$check" "csv" 2>&1) || true
                output+="$check_output"$'\n'
            done
            ;;
    esac

    # Output results
    if [[ -n "$OUTPUT_FILE" ]]; then
        echo "$output" > "$OUTPUT_FILE"
        echo "Report written to: $OUTPUT_FILE" >&2
    else
        echo "$output"
    fi
}

# Run main function
main "$@"
