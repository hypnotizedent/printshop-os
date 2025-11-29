#!/bin/bash
# PrintShop OS - Repository Audit Script
# Generates a comprehensive health report for the repository
#
# Usage: ./scripts/audit.sh [--output-file report.md]
#
# This script checks:
#   1. Unmerged branches with unique commits
#   2. Test coverage per service
#   3. Documentation health (duplicates, outdated)
#   4. Service inventory status
#   5. Git repository health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
OUTPUT_FILE=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --output-file)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Redirect output if file specified
if [ -n "$OUTPUT_FILE" ]; then
    exec > "$OUTPUT_FILE"
fi

echo "# PrintShop OS - Repository Audit Report"
echo ""
echo "**Generated:** $(date '+%Y-%m-%d %H:%M:%S')"
echo "**Branch:** $(git branch --show-current)"
echo ""
echo "---"
echo ""

# ============================================================================
# Section 1: Branch Analysis
# ============================================================================
echo "## 🌿 1. Branch Analysis"
echo ""

# Count branches
TOTAL_BRANCHES=$(git branch -r 2>/dev/null | grep -v HEAD | wc -l | tr -d ' ')
echo "**Total Remote Branches:** $TOTAL_BRANCHES"
echo ""

# List branches with unique commits (those ahead of main/master)
echo "### Branches with Unique Commits"
echo ""
echo "| Branch | Commits Ahead | Status |"
echo "|--------|---------------|--------|"

# Try main first, then master
BASE_BRANCH="main"
if ! git rev-parse --verify origin/main &>/dev/null; then
    if git rev-parse --verify origin/master &>/dev/null; then
        BASE_BRANCH="master"
    else
        BASE_BRANCH=""
    fi
fi

if [ -n "$BASE_BRANCH" ]; then
    for branch in $(git branch -r | grep -v HEAD | grep -v "$BASE_BRANCH$"); do
        branch_name=$(echo "$branch" | sed 's/origin\///' | tr -d ' ')
        if [ -n "$branch_name" ] && [ "$branch_name" != "$BASE_BRANCH" ]; then
            # Count commits ahead of base
            AHEAD=$(git rev-list --count origin/"$BASE_BRANCH"..origin/"$branch_name" 2>/dev/null || echo "0")
            if [ "$AHEAD" -gt 0 ]; then
                STATUS="⚠️ Review needed"
            else
                STATUS="✅ Can delete"
            fi
            echo "| $branch_name | $AHEAD | $STATUS |"
        fi
    done
else
    echo "| (No main/master branch found) | - | - |"
fi
echo ""

# ============================================================================
# Section 2: Test Coverage
# ============================================================================
echo "## 🧪 2. Test Coverage Analysis"
echo ""
echo "| Service | Test Files | Source Files | Coverage Estimate |"
echo "|---------|------------|--------------|-------------------|"

for service_dir in services/*/; do
    if [ -d "$service_dir" ]; then
        service_name=$(basename "$service_dir")
        
        # Count test files
        test_count=$(find "$service_dir" -name "*.test.ts" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.js" 2>/dev/null | wc -l | tr -d ' ')
        
        # Count source files (excluding test files)
        source_count=$(find "$service_dir" -name "*.ts" -o -name "*.js" 2>/dev/null | grep -v ".test." | grep -v ".spec." | grep -v "node_modules" | wc -l | tr -d ' ')
        
        # Estimate coverage (rough - test files / source files ratio)
        if [ "$source_count" -gt 0 ]; then
            ratio=$((test_count * 100 / source_count))
            if [ "$ratio" -ge 50 ]; then
                coverage="✅ Good ($ratio%)"
            elif [ "$ratio" -ge 20 ]; then
                coverage="⚠️ Fair ($ratio%)"
            else
                coverage="🔴 Low ($ratio%)"
            fi
        else
            coverage="N/A"
        fi
        
        echo "| $service_name | $test_count | $source_count | $coverage |"
    fi
done

# Also check other testable directories
for dir in frontend printshop-strapi; do
    if [ -d "$dir" ]; then
        test_count=$(find "$dir" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.js" 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
        source_count=$(find "$dir" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | grep -v ".test." | grep -v ".spec." | grep -v "node_modules" | wc -l | tr -d ' ')
        
        if [ "$source_count" -gt 0 ]; then
            ratio=$((test_count * 100 / source_count))
            if [ "$ratio" -ge 50 ]; then
                coverage="✅ Good ($ratio%)"
            elif [ "$ratio" -ge 20 ]; then
                coverage="⚠️ Fair ($ratio%)"
            else
                coverage="🔴 Low ($ratio%)"
            fi
        else
            coverage="N/A"
        fi
        
        echo "| $dir | $test_count | $source_count | $coverage |"
    fi
done
echo ""

# ============================================================================
# Section 3: Documentation Health
# ============================================================================
echo "## 📚 3. Documentation Health"
echo ""

# Count docs
ROOT_DOCS=$(ls -1 *.md 2>/dev/null | wc -l | tr -d ' ')
DOCS_FOLDER=$(find docs -maxdepth 1 -name "*.md" 2>/dev/null | wc -l | tr -d ' ')

# Count archived docs more safely
ARCHIVE_COUNT=0
for archive_dir in docs/ARCHIVE_* docs/archive; do
    if [ -d "$archive_dir" ]; then
        count=$(find "$archive_dir" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
        ARCHIVE_COUNT=$((ARCHIVE_COUNT + count))
    fi
done

echo "### File Counts"
echo ""
echo "| Location | Count | Status |"
echo "|----------|-------|--------|"

# Root docs (target: exactly 10)
if [ "$ROOT_DOCS" -eq 10 ]; then
    status="✅ Compliant (10 max)"
elif [ "$ROOT_DOCS" -lt 10 ]; then
    status="✅ Under limit ($ROOT_DOCS/10)"
else
    status="⚠️ Over limit ($ROOT_DOCS/10)"
fi
echo "| Root level (*.md) | $ROOT_DOCS | $status |"

# docs/ folder
if [ "$DOCS_FOLDER" -le 15 ]; then
    status="✅ Manageable"
else
    status="⚠️ Consider archiving"
fi
echo "| docs/ folder | $DOCS_FOLDER | $status |"

# Archives
if [ "$ARCHIVE_COUNT" -gt 30 ]; then
    status="⚠️ Consider cleanup"
else
    status="✅ OK"
fi
echo "| Archived docs | $ARCHIVE_COUNT | $status |"
echo ""

# Check for potential duplicates
echo "### Potential Duplicates"
echo ""
echo "| File 1 | File 2 | Action |"
echo "|--------|--------|--------|"

# Check ARCHITECTURE duplicates
if [ -f "ARCHITECTURE.md" ] && [ -f "docs/ARCHITECTURE_OVERVIEW.md" ]; then
    echo "| ARCHITECTURE.md | docs/ARCHITECTURE_OVERVIEW.md | 🔄 Consolidate |"
fi

# Check for other potential duplicates by similar names
for pattern in "README" "SETUP" "INSTALL" "GUIDE"; do
    count=$(find . -maxdepth 2 -name "*${pattern}*.md" 2>/dev/null | grep -v node_modules | grep -v ARCHIVE | wc -l | tr -d ' ')
    if [ "$count" -gt 1 ]; then
        files=$(find . -maxdepth 2 -name "*${pattern}*.md" 2>/dev/null | grep -v node_modules | grep -v ARCHIVE | head -2 | tr '\n' ' ')
        echo "| Multiple ${pattern} files | ($count found) | 🔍 Review: $files |"
    fi
done
echo ""

# ============================================================================
# Section 4: Service Inventory
# ============================================================================
echo "## 🏭 4. Service Inventory"
echo ""
echo "| Service | Has package.json | Has README | Has Tests | Status |"
echo "|---------|-----------------|------------|-----------|--------|"

for service_dir in services/*/; do
    if [ -d "$service_dir" ]; then
        service_name=$(basename "$service_dir")
        
        # Check for key files
        has_pkg=$([ -f "${service_dir}package.json" ] && echo "✅" || echo "❌")
        has_readme=$([ -f "${service_dir}README.md" ] && echo "✅" || echo "❌")
        
        # Check for tests - either a tests directory or test files
        has_tests="❌"
        if [ -d "${service_dir}tests" ]; then
            has_tests="✅"
        elif find "$service_dir" -name "*.test.ts" -o -name "*.test.js" 2>/dev/null | grep -q .; then
            has_tests="✅"
        fi
        
        # Overall status
        if [ "$has_pkg" = "✅" ] && [ "$has_readme" = "✅" ] && [ "$has_tests" = "✅" ]; then
            status="🟢 Healthy"
        elif [ "$has_pkg" = "✅" ] && [ "$has_tests" = "✅" ]; then
            status="🟡 Missing docs"
        else
            status="🔴 Needs attention"
        fi
        
        echo "| $service_name | $has_pkg | $has_readme | $has_tests | $status |"
    fi
done
echo ""

# ============================================================================
# Section 5: Automation Status
# ============================================================================
echo "## ⚙️ 5. Automation & CI/CD Status"
echo ""

# Check for GitHub Actions
echo "### GitHub Actions Workflows"
echo ""
if [ -d ".github/workflows" ]; then
    echo "| Workflow | Status |"
    echo "|----------|--------|"
    for workflow in .github/workflows/*.yml .github/workflows/*.yaml; do
        if [ -f "$workflow" ]; then
            name=$(basename "$workflow")
            echo "| $name | ✅ Present |"
        fi
    done
else
    echo "⚠️ No .github/workflows directory found"
fi
echo ""

# Check for automation scripts
echo "### Automation Scripts"
echo ""
echo "| Script | Purpose |"
echo "|--------|---------|"
for script in scripts/*.sh scripts/*.py scripts/*.js; do
    if [ -f "$script" ]; then
        name=$(basename "$script")
        # Try to get purpose from comment lines (skip shebang, look for real comments)
        purpose=$(head -10 "$script" 2>/dev/null | grep -m1 '^#[[:space:]]*[A-Za-z]' | sed 's/^#[[:space:]]*//' | head -c 50)
        if [ -z "$purpose" ]; then
            purpose="(No description)"
        fi
        echo "| $name | $purpose |"
    fi
done
echo ""

# ============================================================================
# Section 6: Action Items Summary
# ============================================================================
echo "## 📋 6. Action Items Summary"
echo ""
echo "### Priority Actions"
echo ""

# Generate action items based on findings
echo "- [ ] **Branches:** Review branches with unique commits for merge/archive"
echo "- [ ] **Tests:** Add tests to services with low coverage"
echo "- [ ] **Docs:** Consolidate duplicate architecture documentation"
echo "- [ ] **Archives:** Consider cleaning up archived docs (if over 30)"
echo "- [ ] **CI/CD:** Ensure all services have automated testing"
echo ""

echo "---"
echo ""
echo "*Report generated by scripts/audit.sh*"
