#!/bin/bash
# =============================================================================
# PrintShop OS - Branch Analysis Module
# =============================================================================
# Analyzes git branches for:
# - Local and remote branches
# - Merged vs unmerged branches
# - Commits ahead/behind main
# - Stale branches (no commits in 30+ days)
# =============================================================================

set -euo pipefail

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

# Configuration
STALE_THRESHOLD_DAYS="${STALE_THRESHOLD_DAYS:-30}"
MAIN_BRANCH="${MAIN_BRANCH:-main}"

# -----------------------------------------------------------------------------
# Branch Analysis Functions
# -----------------------------------------------------------------------------

# Get list of all branches (local and remote)
get_all_branches() {
    git branch -a --format='%(refname:short)' 2>/dev/null | sort -u
}

# Get remote branches only
get_remote_branches() {
    git branch -r --format='%(refname:short)' 2>/dev/null | grep -v HEAD | sort -u
}

# Get local branches only
get_local_branches() {
    git branch --format='%(refname:short)' 2>/dev/null | sort -u
}

# Check if branch is merged into main
is_merged() {
    local branch="$1"
    git branch --merged "$MAIN_BRANCH" 2>/dev/null | grep -q "$branch"
}

# Get last commit date for a branch
get_last_commit_date() {
    local branch="$1"
    git log -1 --format="%ci" "$branch" 2>/dev/null | cut -d' ' -f1 || echo "unknown"
}

# Get last commit author for a branch
get_last_commit_author() {
    local branch="$1"
    git log -1 --format="%an" "$branch" 2>/dev/null || echo "unknown"
}

# Get commits ahead of main
get_commits_ahead() {
    local branch="$1"
    git rev-list --count "origin/$MAIN_BRANCH..$branch" 2>/dev/null || echo "0"
}

# Get commits behind main
get_commits_behind() {
    local branch="$1"
    git rev-list --count "$branch..origin/$MAIN_BRANCH" 2>/dev/null || echo "0"
}

# Check if branch is stale
is_stale() {
    local branch="$1"
    local days
    days=$(days_since_commit "$branch" 2>/dev/null) || return 1
    [[ "$days" -ge "$STALE_THRESHOLD_DAYS" ]]
}

# -----------------------------------------------------------------------------
# Output Functions
# -----------------------------------------------------------------------------

# Generate markdown output
output_branches_markdown() {
    local -a local_branches=()
    local -a remote_branches=()
    local -a merged_branches=()
    local -a unmerged_branches=()
    local -a stale_branches=()
    
    log_info "Analyzing branches..."
    
    # Collect local branches
    while IFS= read -r branch; do
        [[ -n "$branch" ]] && local_branches+=("$branch")
    done < <(get_local_branches)
    
    # Collect remote branches
    while IFS= read -r branch; do
        [[ -n "$branch" ]] && remote_branches+=("$branch")
    done < <(get_remote_branches)
    
    # Analyze each branch
    local all_branches=()
    while IFS= read -r branch; do
        [[ -n "$branch" ]] && all_branches+=("$branch")
    done < <(get_remote_branches)
    
    for branch in "${all_branches[@]}"; do
        # Skip main branch
        [[ "$branch" == "origin/$MAIN_BRANCH" ]] && continue
        [[ "$branch" == "origin/HEAD" ]] && continue
        
        if is_merged "$branch" 2>/dev/null; then
            merged_branches+=("$branch")
        else
            unmerged_branches+=("$branch")
        fi
        
        if is_stale "$branch" 2>/dev/null; then
            stale_branches+=("$branch")
        fi
    done
    
    # Determine status
    local status
    if [[ ${#stale_branches[@]} -gt 10 ]]; then
        status="critical"
    elif [[ ${#stale_branches[@]} -gt 0 ]] || [[ ${#unmerged_branches[@]} -gt 10 ]]; then
        status="warning"
    else
        status="good"
    fi
    
    local status_icon
    status_icon=$(get_status_icon "$status")
    
    # Output summary
    md_header 2 "Branch Status Analysis"
    
    md_table_header "Category" "Count"
    md_table_row "Local branches" "${#local_branches[@]}"
    md_table_row "Remote branches" "${#remote_branches[@]}"
    md_table_row "Merged branches" "${#merged_branches[@]}"
    md_table_row "Unmerged branches" "${#unmerged_branches[@]}"
    md_table_row "Stale branches (30+ days)" "${#stale_branches[@]}"
    echo ""
    
    # Status
    echo "**Status:** $status_icon $(get_status_text "$status")"
    echo ""
    
    # Stale branches details
    if [[ ${#stale_branches[@]} -gt 0 ]]; then
        md_header 3 "Stale Branches (${#stale_branches[@]})"
        
        md_table_header "Branch" "Last Commit" "Days Stale" "Ahead of Main"
        
        for branch in "${stale_branches[@]}"; do
            local last_date
            last_date=$(get_last_commit_date "$branch")
            local days_stale
            days_stale=$(days_since_commit "$branch" 2>/dev/null) || days_stale="?"
            local ahead
            ahead=$(get_commits_ahead "$branch" 2>/dev/null) || ahead="?"
            
            local short_branch="${branch#origin/}"
            md_table_row "$short_branch" "$last_date" "$days_stale" "$ahead"
        done
        echo ""
    fi
    
    # Unmerged branches details
    if [[ ${#unmerged_branches[@]} -gt 0 ]]; then
        md_header 3 "Unmerged Branches (${#unmerged_branches[@]})"
        
        md_table_header "Branch" "Last Commit" "Ahead" "Behind"
        
        for branch in "${unmerged_branches[@]}"; do
            local last_date
            last_date=$(get_last_commit_date "$branch")
            local ahead
            ahead=$(get_commits_ahead "$branch" 2>/dev/null) || ahead="?"
            local behind
            behind=$(get_commits_behind "$branch" 2>/dev/null) || behind="?"
            
            local short_branch="${branch#origin/}"
            md_table_row "$short_branch" "$last_date" "$ahead" "$behind"
        done
        echo ""
    fi
    
    # Return status for summary
    echo "__STATUS__:branches:$status:${#unmerged_branches[@]} unmerged, ${#stale_branches[@]} stale"
}

# Generate JSON output
output_branches_json() {
    local -a local_branches=()
    local -a remote_branches=()
    local -a stale_branches=()
    local -a unmerged_branches=()
    
    log_info "Analyzing branches..."
    
    # Collect branches
    while IFS= read -r branch; do
        [[ -n "$branch" ]] && local_branches+=("$branch")
    done < <(get_local_branches)
    
    while IFS= read -r branch; do
        [[ -n "$branch" ]] && remote_branches+=("$branch")
    done < <(get_remote_branches)
    
    echo "{"
    echo "  \"category\": \"branches\","
    echo "  \"summary\": {"
    echo "    \"local_count\": ${#local_branches[@]},"
    echo "    \"remote_count\": ${#remote_branches[@]},"
    
    # Analyze remote branches
    local stale_count=0
    local unmerged_count=0
    local merged_count=0
    
    for branch in "${remote_branches[@]}"; do
        [[ "$branch" == "origin/$MAIN_BRANCH" ]] && continue
        [[ "$branch" == "origin/HEAD" ]] && continue
        
        if is_merged "$branch" 2>/dev/null; then
            ((merged_count++)) || true
        else
            ((unmerged_count++)) || true
        fi
        
        if is_stale "$branch" 2>/dev/null; then
            ((stale_count++)) || true
        fi
    done
    
    echo "    \"merged_count\": $merged_count,"
    echo "    \"unmerged_count\": $unmerged_count,"
    echo "    \"stale_count\": $stale_count"
    echo "  },"
    
    # Determine status
    local status
    if [[ $stale_count -gt 10 ]]; then
        status="critical"
    elif [[ $stale_count -gt 0 ]] || [[ $unmerged_count -gt 10 ]]; then
        status="warning"
    else
        status="good"
    fi
    
    echo "  \"status\": \"$status\","
    
    # List branches with details
    echo "  \"branches\": ["
    
    local first=true
    for branch in "${remote_branches[@]}"; do
        [[ "$branch" == "origin/$MAIN_BRANCH" ]] && continue
        [[ "$branch" == "origin/HEAD" ]] && continue
        
        local last_date
        last_date=$(get_last_commit_date "$branch")
        local ahead
        ahead=$(get_commits_ahead "$branch" 2>/dev/null) || ahead="0"
        local behind
        behind=$(get_commits_behind "$branch" 2>/dev/null) || behind="0"
        local days_stale
        days_stale=$(days_since_commit "$branch" 2>/dev/null) || days_stale="0"
        local is_merged_bool="false"
        is_merged "$branch" 2>/dev/null && is_merged_bool="true"
        local is_stale_bool="false"
        is_stale "$branch" 2>/dev/null && is_stale_bool="true"
        
        local short_branch="${branch#origin/}"
        
        [[ "$first" != "true" ]] && echo ","
        first=false
        
        echo "    {"
        echo "      \"name\": \"$(json_escape "$short_branch")\","
        echo "      \"last_commit\": \"$last_date\","
        echo "      \"days_since_commit\": $days_stale,"
        echo "      \"commits_ahead\": $ahead,"
        echo "      \"commits_behind\": $behind,"
        echo "      \"is_merged\": $is_merged_bool,"
        echo "      \"is_stale\": $is_stale_bool"
        echo -n "    }"
    done
    
    echo ""
    echo "  ]"
    echo "}"
}

# Generate CSV output
output_branches_csv() {
    csv_header "Branch" "Last Commit" "Days Stale" "Ahead" "Behind" "Merged" "Stale"
    
    while IFS= read -r branch; do
        [[ "$branch" == "origin/$MAIN_BRANCH" ]] && continue
        [[ "$branch" == "origin/HEAD" ]] && continue
        [[ -z "$branch" ]] && continue
        
        local last_date
        last_date=$(get_last_commit_date "$branch")
        local ahead
        ahead=$(get_commits_ahead "$branch" 2>/dev/null) || ahead="0"
        local behind
        behind=$(get_commits_behind "$branch" 2>/dev/null) || behind="0"
        local days_stale
        days_stale=$(days_since_commit "$branch" 2>/dev/null) || days_stale="0"
        
        local is_merged_str="false"
        is_merged "$branch" 2>/dev/null && is_merged_str="true"
        local is_stale_str="false"
        is_stale "$branch" 2>/dev/null && is_stale_str="true"
        
        local short_branch="${branch#origin/}"
        
        csv_row "$short_branch" "$last_date" "$days_stale" "$ahead" "$behind" "$is_merged_str" "$is_stale_str"
    done < <(get_remote_branches)
}

# -----------------------------------------------------------------------------
# Main Entry Point
# -----------------------------------------------------------------------------

run_branches_audit() {
    local format="${1:-markdown}"
    
    if ! is_git_repo; then
        log_error "Not a git repository"
        return 1
    fi
    
    # Fetch latest from remote
    log_info "Fetching latest from remote..."
    git fetch --prune --quiet 2>/dev/null || true
    
    case "$format" in
        markdown) output_branches_markdown ;;
        json) output_branches_json ;;
        csv) output_branches_csv ;;
        *) 
            log_error "Unknown format: $format"
            return 1
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_branches_audit "${1:-markdown}"
fi
