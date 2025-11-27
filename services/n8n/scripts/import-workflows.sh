#!/bin/bash
# =============================================================================
# Import n8n Workflows
# =============================================================================
# Imports workflow JSON files into a running n8n instance
# Usage: ./import-workflows.sh [workflow-dir] [n8n-url]
# =============================================================================

set -e

# Configuration
N8N_URL="${2:-http://localhost:5678}"
WORKFLOW_DIR="${1:-./workflows/printshop}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for API key
if [ -z "$N8N_API_KEY" ]; then
    echo -e "${RED}Error: N8N_API_KEY environment variable is not set${NC}"
    echo "Please set your n8n API key:"
    echo "  export N8N_API_KEY=your-api-key-here"
    exit 1
fi

# Check if workflow directory exists
if [ ! -d "$WORKFLOW_DIR" ]; then
    echo -e "${RED}Error: Workflow directory not found: $WORKFLOW_DIR${NC}"
    exit 1
fi

# Check n8n connectivity
echo -e "${YELLOW}Checking n8n connectivity at $N8N_URL...${NC}"
if ! curl -s -o /dev/null -w "%{http_code}" "$N8N_URL/api/v1/workflows" -H "X-N8N-API-KEY: $N8N_API_KEY" | grep -q "200"; then
    echo -e "${RED}Error: Cannot connect to n8n at $N8N_URL${NC}"
    echo "Make sure n8n is running and the API key is correct."
    exit 1
fi
echo -e "${GREEN}Connected to n8n successfully${NC}"

# Count workflows
WORKFLOW_COUNT=$(find "$WORKFLOW_DIR" -name "*.json" 2>/dev/null | wc -l)
if [ "$WORKFLOW_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}No workflow files found in $WORKFLOW_DIR${NC}"
    exit 0
fi

echo -e "${YELLOW}Found $WORKFLOW_COUNT workflow(s) to import${NC}"
echo ""

# Import each workflow
IMPORTED=0
FAILED=0

for workflow in "$WORKFLOW_DIR"/*.json; do
    if [ ! -f "$workflow" ]; then
        continue
    fi
    
    WORKFLOW_NAME=$(basename "$workflow" .json)
    echo -n "Importing: $WORKFLOW_NAME..."
    
    # Import the workflow
    RESPONSE=$(curl -s -X POST "$N8N_URL/api/v1/workflows" \
        -H "Content-Type: application/json" \
        -H "X-N8N-API-KEY: $N8N_API_KEY" \
        -d @"$workflow" 2>&1)
    
    # Check if import was successful
    if echo "$RESPONSE" | grep -q '"id"'; then
        WORKFLOW_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo -e " ${GREEN}✓${NC} (ID: $WORKFLOW_ID)"
        ((IMPORTED++))
    else
        ERROR_MSG=$(echo "$RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$ERROR_MSG" ]; then
            echo -e " ${RED}✗ $ERROR_MSG${NC}"
        else
            echo -e " ${RED}✗ Unknown error${NC}"
        fi
        ((FAILED++))
    fi
done

echo ""
echo "============================================="
echo -e "Import complete: ${GREEN}$IMPORTED imported${NC}, ${RED}$FAILED failed${NC}"
echo "============================================="

# Exit with error if any imports failed
if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
