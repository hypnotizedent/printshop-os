#!/bin/bash
# =============================================================================
# PrintShop OS - Audit Utilities
# =============================================================================
# Shared utilities for the audit script system
# Provides: colors, formatting, output helpers, JSON/CSV generation
# =============================================================================

# POSIX-compliant color codes
if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    BOLD='\033[1m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    CYAN=''
    BOLD=''
    NC=''
fi

# Status icons
ICON_GOOD="✅"
ICON_WARN="⚠️"
ICON_CRITICAL="🔴"
ICON_INFO="ℹ️"

# Global variables (set by main script)
OUTPUT_FORMAT="${OUTPUT_FORMAT:-markdown}"
VERBOSE="${VERBOSE:-false}"

# -----------------------------------------------------------------------------
# Logging Functions
# -----------------------------------------------------------------------------

log_info() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[INFO]${NC} $1" >&2
    fi
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${CYAN}[DEBUG]${NC} $1" >&2
    fi
}

# -----------------------------------------------------------------------------
# Markdown Output Helpers
# -----------------------------------------------------------------------------

md_header() {
    local level="$1"
    local text="$2"
    local hashes=""
    for ((i=0; i<level; i++)); do
        hashes+="#"
    done
    echo "$hashes $text"
    echo ""
}

md_table_header() {
    local cols=("$@")
    local header=""
    local separator=""
    
    for col in "${cols[@]}"; do
        header+="| $col "
        separator+="|--------"
    done
    header+="|"
    separator+="|"
    
    echo "$header"
    echo "$separator"
}

md_table_row() {
    local cols=("$@")
    local row=""
    
    for col in "${cols[@]}"; do
        row+="| $col "
    done
    row+="|"
    
    echo "$row"
}

md_list_item() {
    local item="$1"
    echo "- $item"
}

md_code_block() {
    local lang="${1:-}"
    local content="$2"
    echo "\`\`\`$lang"
    echo "$content"
    echo "\`\`\`"
    echo ""
}

# -----------------------------------------------------------------------------
# JSON Output Helpers
# -----------------------------------------------------------------------------

json_start_object() {
    echo "{"
}

json_end_object() {
    echo "}"
}

json_start_array() {
    echo "["
}

json_end_array() {
    echo "]"
}

json_key_value() {
    local key="$1"
    local value="$2"
    local is_last="${3:-false}"
    local comma=","
    
    if [[ "$is_last" == "true" ]]; then
        comma=""
    fi
    
    # Escape special characters in value
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    value="${value//$'\n'/\\n}"
    value="${value//$'\t'/\\t}"
    
    echo "  \"$key\": \"$value\"$comma"
}

json_key_number() {
    local key="$1"
    local value="$2"
    local is_last="${3:-false}"
    local comma=","
    
    if [[ "$is_last" == "true" ]]; then
        comma=""
    fi
    
    echo "  \"$key\": $value$comma"
}

json_key_bool() {
    local key="$1"
    local value="$2"
    local is_last="${3:-false}"
    local comma=","
    
    if [[ "$is_last" == "true" ]]; then
        comma=""
    fi
    
    echo "  \"$key\": $value$comma"
}

json_key_array() {
    local key="$1"
    local is_last="${2:-false}"
    local comma=","
    
    if [[ "$is_last" == "true" ]]; then
        comma=""
    fi
    
    echo "  \"$key\": ["
}

json_end_key_array() {
    local is_last="${1:-false}"
    local comma=","
    
    if [[ "$is_last" == "true" ]]; then
        comma=""
    fi
    
    echo "  ]$comma"
}

# Escape string for JSON
json_escape() {
    local str="$1"
    str="${str//\\/\\\\}"
    str="${str//\"/\\\"}"
    str="${str//$'\n'/\\n}"
    str="${str//$'\t'/\\t}"
    str="${str//$'\r'/}"
    echo "$str"
}

# -----------------------------------------------------------------------------
# CSV Output Helpers
# -----------------------------------------------------------------------------

csv_header() {
    local cols=("$@")
    local header=""
    local first=true
    
    for col in "${cols[@]}"; do
        if [[ "$first" == "true" ]]; then
            header="$col"
            first=false
        else
            header+=",$col"
        fi
    done
    
    echo "$header"
}

csv_row() {
    local cols=("$@")
    local row=""
    local first=true
    
    for col in "${cols[@]}"; do
        # Escape quotes and wrap in quotes if contains comma or newline
        local escaped="${col//\"/\"\"}"
        if [[ "$escaped" == *,* ]] || [[ "$escaped" == *$'\n'* ]] || [[ "$escaped" == *\"* ]]; then
            escaped="\"$escaped\""
        fi
        
        if [[ "$first" == "true" ]]; then
            row="$escaped"
            first=false
        else
            row+=",$escaped"
        fi
    done
    
    echo "$row"
}

# -----------------------------------------------------------------------------
# Git Helpers
# -----------------------------------------------------------------------------

get_current_commit() {
    git rev-parse --short HEAD 2>/dev/null || echo "unknown"
}

get_current_branch() {
    git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"
}

get_repo_root() {
    git rev-parse --show-toplevel 2>/dev/null || pwd
}

is_git_repo() {
    git rev-parse --git-dir &>/dev/null
}

# Get days since last commit on a branch
days_since_commit() {
    local branch="$1"
    local last_commit_date
    last_commit_date=$(git log -1 --format="%at" "$branch" 2>/dev/null) || return 1
    
    local now
    now=$(date +%s)
    
    local diff=$((now - last_commit_date))
    local days=$((diff / 86400))
    
    echo "$days"
}

# Count commits ahead of main
commits_ahead_of_main() {
    local branch="$1"
    local main_branch="${2:-origin/main}"
    
    local count
    count=$(git rev-list --count "$main_branch..$branch" 2>/dev/null) || echo "0"
    echo "$count"
}

# -----------------------------------------------------------------------------
# File System Helpers
# -----------------------------------------------------------------------------

# Get file size in bytes (POSIX-compatible)
get_file_size() {
    local file="$1"
    if [[ -f "$file" ]]; then
        if stat --version &>/dev/null 2>&1; then
            # GNU stat
            stat -c %s "$file" 2>/dev/null || echo "0"
        else
            # BSD stat (macOS)
            stat -f %z "$file" 2>/dev/null || echo "0"
        fi
    else
        echo "0"
    fi
}

# Convert bytes to human readable
bytes_to_human() {
    local bytes="$1"
    
    if [[ "$bytes" -ge 1073741824 ]]; then
        echo "$(echo "scale=2; $bytes / 1073741824" | bc)GB"
    elif [[ "$bytes" -ge 1048576 ]]; then
        echo "$(echo "scale=2; $bytes / 1048576" | bc)MB"
    elif [[ "$bytes" -ge 1024 ]]; then
        echo "$(echo "scale=2; $bytes / 1024" | bc)KB"
    else
        echo "${bytes}B"
    fi
}

# -----------------------------------------------------------------------------
# Status Helpers
# -----------------------------------------------------------------------------

# Determine status level: good, warning, critical
get_status() {
    local count="$1"
    local warn_threshold="${2:-5}"
    local critical_threshold="${3:-10}"
    
    if [[ "$count" -eq 0 ]]; then
        echo "good"
    elif [[ "$count" -lt "$critical_threshold" ]]; then
        echo "warning"
    else
        echo "critical"
    fi
}

# Get status icon based on level
get_status_icon() {
    local status="$1"
    
    case "$status" in
        good) echo "$ICON_GOOD" ;;
        warning) echo "$ICON_WARN" ;;
        critical) echo "$ICON_CRITICAL" ;;
        *) echo "$ICON_INFO" ;;
    esac
}

# Get status text for display
get_status_text() {
    local status="$1"
    
    case "$status" in
        good) echo "Good" ;;
        warning) echo "Warning" ;;
        critical) echo "Critical" ;;
        *) echo "Unknown" ;;
    esac
}

# -----------------------------------------------------------------------------
# Timestamp Helpers
# -----------------------------------------------------------------------------

get_timestamp() {
    date -u '+%Y-%m-%d %H:%M:%S UTC'
}

get_date() {
    date '+%Y-%m-%d'
}

# -----------------------------------------------------------------------------
# Array/Counter Helpers
# -----------------------------------------------------------------------------

# Initialize a counter
init_counter() {
    echo "0"
}

# Increment a counter
increment_counter() {
    local count="$1"
    echo $((count + 1))
}

# -----------------------------------------------------------------------------
# Export functions for subshells
# -----------------------------------------------------------------------------

export -f log_info log_warn log_error log_debug 2>/dev/null || true
export -f md_header md_table_header md_table_row md_list_item md_code_block 2>/dev/null || true
export -f json_escape json_key_value json_key_number json_key_bool 2>/dev/null || true
export -f csv_header csv_row 2>/dev/null || true
export -f get_current_commit get_current_branch get_repo_root is_git_repo 2>/dev/null || true
export -f days_since_commit commits_ahead_of_main 2>/dev/null || true
export -f get_file_size bytes_to_human 2>/dev/null || true
export -f get_status get_status_icon get_status_text 2>/dev/null || true
export -f get_timestamp get_date 2>/dev/null || true
