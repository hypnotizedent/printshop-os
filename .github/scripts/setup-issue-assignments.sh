#!/bin/bash

# PrintShop OS - Setup Issue Assignments
# Assigns existing issues to sector milestones and adds labels
# Usage: ./setup-issue-assignments.sh
# Requires: GitHub CLI (gh) and authentication

set -e

REPO="hypnotizedent/printshop-os"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PrintShop OS - Issue Assignment Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Verify gh CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    exit 1
fi

if ! gh auth status > /dev/null 2>&1; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    exit 1
fi

echo -e "${YELLOW}Assigning issues to milestones and labels...${NC}\n"

# Issue assignments format: issue_number|milestone|labels
declare -a ASSIGNMENTS=(
    "1|Sales & Quoting|enhancement priority:high sector:sales"
    "2|Production & Operations|enhancement priority:high sector:production"
    "3|CRM & Client Management|enhancement priority:high sector:crm"
    "4|Finance & Invoicing|enhancement priority:high sector:finance"
    "5|Automation & Integration|enhancement priority:high sector:automation"
    "6|Customer Portal & Mobile|enhancement priority:high sector:portal"
    "7|Sales & Quoting|enhancement sector:sales"
    "8|Production & Operations|enhancement sector:production"
    "9|CRM & Client Management|enhancement sector:crm"
    "10|Finance & Invoicing|enhancement sector:finance"
    "11|Automation & Integration|enhancement sector:automation"
    "12|Customer Portal & Mobile|enhancement sector:portal"
    "13|Sales & Quoting|enhancement priority:medium sector:sales"
)

# Assign each issue
for assignment in "${ASSIGNMENTS[@]}"; do
    IFS='|' read -r issue_num milestone labels <<< "$assignment"
    
    echo -n "  Issue #${issue_num}: "
    
    # Add milestone
    if gh issue edit "$issue_num" \
        --repo "$REPO" \
        --milestone "$milestone" \
        2>/dev/null; then
        echo -n -e "${GREEN}milestone${NC} "
    else
        echo -n -e "${YELLOW}⚠ milestone${NC} "
    fi
    
    # Add labels
    if gh issue edit "$issue_num" \
        --repo "$REPO" \
        --add-label "$labels" \
        2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}✓${NC}"
    fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Issue assignments complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo "  1. Run: ./setup-project-board.sh"
echo "  2. View on GitHub: https://github.com/$REPO/issues"
echo ""
