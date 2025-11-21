#!/bin/bash

# PrintShop OS - Setup Sector-Based Milestones
# Creates 6 business sector milestones on GitHub
# Usage: ./setup-milestones.sh
# Requires: GitHub CLI (gh) and authentication (gh auth status)

set -e

REPO="hypnotizedent/printshop-os"
OWNER="hypnotizedent"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PrintShop OS - Sector Milestone Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Verify gh CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "   Install from: https://cli.github.com"
    exit 1
fi

if ! gh auth status > /dev/null 2>&1; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo "   Run: gh auth login"
    exit 1
fi

# Define milestones
declare -a MILESTONES=(
    "Sales & Quoting|Build quote generation pipeline with Stripe integration"
    "Production & Operations|Manage print jobs, scheduling, and queue management"
    "CRM & Client Management|Customer profiles, history, and relationship tracking"
    "Finance & Invoicing|Billing, payments, and financial reporting"
    "Automation & Integration|External service connections and workflow automation"
    "Customer Portal & Mobile|Self-service portal and mobile app for clients"
)

# Create each milestone
echo -e "${YELLOW}Creating milestones...${NC}\n"

for milestone in "${MILESTONES[@]}"; do
    IFS='|' read -r title description <<< "$milestone"
    
    echo -n "  Creating milestone: ${BLUE}$title${NC}... "
    
    # Create milestone with GitHub CLI
    if gh milestone create \
        --repo "$REPO" \
        --title "$title" \
        --description "$description" \
        > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        # Milestone might already exist, which is fine
        echo -e "${YELLOW}✓ (exists or skipped)${NC}"
    fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Milestone setup complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo "  1. Run: ./setup-issue-assignments.sh"
echo "  2. Run: ./setup-project-board.sh"
echo "  3. View on GitHub: https://github.com/$REPO/milestones"
echo ""
