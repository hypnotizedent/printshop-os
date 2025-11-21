#!/bin/bash

# PrintShop OS - Setup Project Board Instructions
# Displays instructions for manually setting up GitHub Projects board
# Usage: ./setup-project-board.sh
# Note: GitHub Projects v2 automation setup requires web UI (for now)

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PrintShop OS - Project Board Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}GitHub Projects v2 Board Setup Instructions${NC}\n"

echo -e "${BLUE}Step 1: Create Project Board${NC}"
echo "  • Go to: https://github.com/hypnotizedent/printshop-os/projects"
echo "  • Click 'New project'"
echo "  • Name: 'PrintShop OS Development'"
echo "  • Template: 'Table' (for comprehensive view)"
echo "  • Create project\n"

echo -e "${BLUE}Step 2: Configure Board Columns${NC}"
echo "  The board will auto-populate with issues. Set up the following custom fields:"
echo "  • Status: Backlog | Planned | Ready | In Progress | Review | Done"
echo "  • Priority: Critical | High | Medium | Low"
echo "  • Sector: Sales | Production | CRM | Finance | Automation | Portal"
echo "  • Effort: XS | Small | Medium | Large | XL\n"

echo -e "${BLUE}Step 3: Set Automation Rules${NC}"
echo "  • Issues assigned to 'Sales & Quoting' milestone → Sector = Sales"
echo "  • Issues assigned to 'Production & Operations' → Sector = Production"
echo "  • Issues assigned to 'CRM & Client Management' → Sector = CRM"
echo "  • Issues assigned to 'Finance & Invoicing' → Sector = Finance"
echo "  • Issues assigned to 'Automation & Integration' → Sector = Automation"
echo "  • Issues assigned to 'Customer Portal & Mobile' → Sector = Portal"
echo "  • Label 'status:done' → Status = Done\n"

echo -e "${BLUE}Step 4: Add Team Members${NC}"
echo "  • Settings → Collaborators"
echo "  • Invite team members to project\n"

echo -e "${BLUE}Step 5: Organize Issues${NC}"
echo "  • Filter by sector/milestone to group related work"
echo "  • Drag issues through pipeline: Backlog → Planned → Ready → In Progress → Review → Done"
echo "  • Use priority field to highlight critical items\n"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Board setup instructions displayed${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Documentation:${NC}"
echo "  • Full guide: ../.github/SETUP_INSTRUCTIONS.md"
echo "  • Quick reference: ../.github/ISSUE_QUICK_START.md"
echo "  • Complete workflow: ../.github/ISSUE_INTAKE_PROCESS.md"
echo ""
