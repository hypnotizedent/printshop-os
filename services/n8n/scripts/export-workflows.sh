#!/bin/bash
# =============================================================================
# Export n8n Workflows
# =============================================================================
# Exports all workflows from a running n8n instance to JSON files
# Usage: ./export-workflows.sh [output-dir] [n8n-url]
# =============================================================================

set -e

# Configuration
N8N_URL="${2:-http://localhost:5678}"
OUTPUT_DIR="${1:-./workflows/exported}"
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

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check n8n connectivity
echo -e "${YELLOW}Checking n8n connectivity at $N8N_URL...${NC}"
WORKFLOWS_RESPONSE=$(curl -s "$N8N_URL/api/v1/workflows" -H "X-N8N-API-KEY: $N8N_API_KEY")
if echo "$WORKFLOWS_RESPONSE" | grep -q '"error"'; then
    echo -e "${RED}Error: Cannot connect to n8n at $N8N_URL${NC}"
    echo "Response: $WORKFLOWS_RESPONSE"
    exit 1
fi
echo -e "${GREEN}Connected to n8n successfully${NC}"

# Get workflow list
WORKFLOW_IDS=$(echo "$WORKFLOWS_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
WORKFLOW_COUNT=$(echo "$WORKFLOW_IDS" | wc -l)

if [ -z "$WORKFLOW_IDS" ] || [ "$WORKFLOW_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}No workflows found in n8n instance${NC}"
    exit 0
fi

echo -e "${YELLOW}Found $WORKFLOW_COUNT workflow(s) to export${NC}"
echo ""

# Export each workflow
EXPORTED=0
FAILED=0

for WORKFLOW_ID in $WORKFLOW_IDS; do
    if [ -z "$WORKFLOW_ID" ]; then
        continue
    fi
    
    # Get workflow details
    WORKFLOW_DATA=$(curl -s "$N8N_URL/api/v1/workflows/$WORKFLOW_ID" -H "X-N8N-API-KEY: $N8N_API_KEY")
    
    # Extract workflow name
    WORKFLOW_NAME=$(echo "$WORKFLOW_DATA" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$WORKFLOW_NAME" ]; then
        echo -e "${RED}Failed to get workflow name for ID: $WORKFLOW_ID${NC}"
        ((FAILED++))
        continue
    fi
    
    # Create safe filename (replace spaces and special chars)
    SAFE_NAME=$(echo "$WORKFLOW_NAME" | tr ' ' '-' | tr -cd '[:alnum:]-_' | tr '[:upper:]' '[:lower:]')
    OUTPUT_FILE="$OUTPUT_DIR/${SAFE_NAME}.json"
    
    echo -n "Exporting: $WORKFLOW_NAME..."
    
    # Save workflow to file
    echo "$WORKFLOW_DATA" | python3 -m json.tool > "$OUTPUT_FILE" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e " ${GREEN}✓${NC} ($OUTPUT_FILE)"
        ((EXPORTED++))
    else
        # Fallback if python json.tool fails
        echo "$WORKFLOW_DATA" > "$OUTPUT_FILE"
        echo -e " ${GREEN}✓${NC} ($OUTPUT_FILE, unformatted)"
        ((EXPORTED++))
    fi
done

echo ""
echo "============================================="
echo -e "Export complete: ${GREEN}$EXPORTED exported${NC}, ${RED}$FAILED failed${NC}"
echo "Output directory: $OUTPUT_DIR"
echo "============================================="

# List exported files
echo ""
echo "Exported files:"
ls -la "$OUTPUT_DIR"/*.json 2>/dev/null || echo "No files exported"

# Exit with error if any exports failed
if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
