#!/bin/bash
# Create Owner Account via API
# Usage: ./scripts/create-owner.sh [email] [password] [name]

set -e

# Default values
EMAIL="${1:-admin@mintprints.com}"
PASSWORD="${2:-AdminPass123!}"
NAME="${3:-Admin User}"
API_URL="${STRAPI_URL:-http://localhost:1337}"

echo "🔐 Creating owner account..."
echo "   Email: $EMAIL"
echo "   Name: $NAME"
echo "   API: $API_URL"
echo ""

# Create owner via direct API call (requires Strapi admin access)
# Note: This is a simplified version. In production, you'd need proper admin authentication
curl -X POST "$API_URL/api/owners" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"email\": \"$EMAIL\",
      \"name\": \"$NAME\",
      \"passwordHash\": \"placeholder_will_be_hashed_by_seed_script\",
      \"isActive\": true,
      \"twoFactorEnabled\": false
    }
  }"

echo ""
echo "✅ Owner account creation initiated!"
echo "⚠️  Note: Use the seed-auth.ts script for proper password hashing"
