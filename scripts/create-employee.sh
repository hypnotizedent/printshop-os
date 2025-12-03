#!/bin/bash
# Create Employee Account via API
# Usage: ./scripts/create-employee.sh [firstName] [lastName] [pin] [email]

set -e

# Default values
FIRST_NAME="${1:-John}"
LAST_NAME="${2:-Doe}"
PIN="${3:-1234}"
EMAIL="${4:-employee@mintprints.com}"
API_URL="${STRAPI_URL:-http://localhost:1337}"

echo "👷 Creating employee account..."
echo "   Name: $FIRST_NAME $LAST_NAME"
echo "   Email: $EMAIL"
echo "   PIN: $PIN"
echo "   API: $API_URL"
echo ""

# Create employee via direct API call
curl -X POST "$API_URL/api/employees" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"firstName\": \"$FIRST_NAME\",
      \"lastName\": \"$LAST_NAME\",
      \"email\": \"$EMAIL\",
      \"pin\": \"placeholder_will_be_hashed_by_seed_script\",
      \"role\": \"operator\",
      \"department\": \"screen_printing\",
      \"isActive\": true,
      \"hourlyRate\": 20.00
    }
  }"

echo ""
echo "✅ Employee account creation initiated!"
echo "⚠️  Note: Use the seed-auth.ts script for proper PIN hashing"
