#!/bin/bash
# Architecture Documentation Validation Script
# Purpose: Check consistency across architecture documentation and code
# Usage: ./scripts/validate-docs.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🔍 PrintShop OS - Architecture Documentation Validation"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Check 1: Port Assignments
echo "📍 CHECK 1: Port Assignment Consistency"
echo "----------------------------------------"

echo ""
echo "docker-compose.yml ports:"
DOCKER_PORTS=$(grep -A 1 "ports:" docker-compose.yml 2>/dev/null | grep -o "[0-9]*:[0-9]*" | cut -d':' -f1 | sort -u || echo "")
echo "$DOCKER_PORTS"

echo ""
echo "ARCHITECTURE_OVERVIEW.md ports:"
OVERVIEW_PORTS=$(grep "Port [0-9]*" docs/ARCHITECTURE_OVERVIEW.md 2>/dev/null | grep -o "Port [0-9]*" | sed 's/Port //' | sort -u || echo "")
echo "$OVERVIEW_PORTS"

echo ""
echo "ARCHITECTURE.md ports:"
ARCH_PORTS=$(grep "Port [0-9]*" ARCHITECTURE.md 2>/dev/null | grep -o "Port [0-9]*" | sed 's/Port //' | sort -u || echo "")
echo "$ARCH_PORTS"

# Compare for discrepancies
if [ "$DOCKER_PORTS" != "$OVERVIEW_PORTS" ] || [ "$DOCKER_PORTS" != "$ARCH_PORTS" ]; then
    echo -e "${RED}❌ Port discrepancies found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ All ports consistent${NC}"
fi

echo ""
echo "---"
echo ""

# Check 2: Service List
echo "🔧 CHECK 2: Service Inventory"
echo "----------------------------------------"

echo ""
echo "Actual services in services/:"
ACTUAL_SERVICES=$(ls -1 services/ 2>/dev/null | sort || echo "")
echo "$ACTUAL_SERVICES"

echo ""
echo "Documented in ARCHITECTURE_OVERVIEW.md:"
DOCUMENTED_SERVICES=$(grep "services/" docs/ARCHITECTURE_OVERVIEW.md 2>/dev/null | grep -o "services/[a-z-]*" | cut -d'/' -f2 | sort -u || echo "")
echo "$DOCUMENTED_SERVICES"

echo ""
echo "Missing from documentation:"
MISSING_SERVICES=$(comm -23 <(echo "$ACTUAL_SERVICES") <(echo "$DOCUMENTED_SERVICES") || echo "")
if [ -z "$MISSING_SERVICES" ]; then
    echo -e "${GREEN}✅ All services documented${NC}"
else
    echo -e "${RED}$MISSING_SERVICES${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""
echo "---"
echo ""

# Check 3: Content Types
echo "📦 CHECK 3: Strapi Content Types"
echo "----------------------------------------"

echo ""
echo "Actual Strapi content types:"
ACTUAL_TYPES=$(ls -1 printshop-strapi/src/api/ 2>/dev/null | sort || echo "")
echo "$ACTUAL_TYPES"

echo ""
echo "Documented in ARCHITECTURE_OVERVIEW.md:"
DOCUMENTED_TYPES=$(grep -A 20 "## Data Model" docs/ARCHITECTURE_OVERVIEW.md 2>/dev/null | grep "^[a-z-]*:" | sed 's/://' | sort || echo "")
echo "$DOCUMENTED_TYPES"

echo ""
# Note: This check is informational since content types might be in external services
if [ "$ACTUAL_TYPES" != "$DOCUMENTED_TYPES" ]; then
    echo -e "${YELLOW}⚠️  Content type locations may differ (check if some are in external services)${NC}"
else
    echo -e "${GREEN}✅ Content types match${NC}"
fi

echo ""
echo "---"
echo ""

# Check 4: Cross-References
echo "🔗 CHECK 4: Documentation Cross-References"
echo "----------------------------------------"

if grep -q "ARCHITECTURE_OVERVIEW.md" ARCHITECTURE.md 2>/dev/null; then
    echo -e "${GREEN}✅ ARCHITECTURE.md references ARCHITECTURE_OVERVIEW.md${NC}"
else
    echo -e "${RED}❌ ARCHITECTURE.md missing reference to ARCHITECTURE_OVERVIEW.md${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if grep -q "docs/diagrams" docs/ARCHITECTURE_OVERVIEW.md 2>/dev/null; then
    echo -e "${GREEN}✅ ARCHITECTURE_OVERVIEW.md references diagrams${NC}"
else
    echo -e "${YELLOW}⚠️  ARCHITECTURE_OVERVIEW.md should reference standalone diagrams${NC}"
fi

echo ""
echo "---"
echo ""

# Check 5: Diagram Files
echo "📊 CHECK 5: Mermaid Diagram Files"
echo "----------------------------------------"

DIAGRAM_COUNT=$(ls -1 docs/diagrams/*.mmd 2>/dev/null | wc -l | tr -d ' ')
echo "Found $DIAGRAM_COUNT Mermaid diagram files"

if [ "$DIAGRAM_COUNT" -ge 7 ]; then
    echo -e "${GREEN}✅ All expected diagram files present${NC}"
else
    echo -e "${RED}❌ Expected at least 7 diagram files${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Validate Mermaid syntax
echo ""
echo "Checking Mermaid syntax..."
for file in docs/diagrams/*.mmd; do
    if [ -f "$file" ]; then
        FIRST_LINE=$(head -1 "$file")
        if [[ "$FIRST_LINE" =~ (graph|sequenceDiagram|flowchart|classDiagram) ]]; then
            echo -e "  ${GREEN}✅ $(basename "$file")${NC}"
        else
            echo -e "  ${RED}❌ $(basename "$file") - invalid syntax${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    fi
done

echo ""
echo "---"
echo ""

# Summary
echo "📋 SUMMARY"
echo "========================================="
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Documentation is synchronized.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Continue development"
    echo "  2. Run this script weekly to maintain sync"
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES_FOUND issue(s) requiring attention${NC}"
    echo ""
    echo "Action items:"
    echo "  1. Review ARCHITECTURE_SYNC_CHECKLIST.md"
    echo "  2. Fix critical issues (ports, missing services)"
    echo "  3. Run this script again to verify fixes"
    echo ""
    echo "Quick fix commands:"
    echo "  - Port conflicts: Edit docker-compose.yml and update docs"
    echo "  - Missing services: Add to docs/ARCHITECTURE_OVERVIEW.md"
    echo "  - Cross-refs: Add links to ARCHITECTURE.md"
    exit 1
fi
