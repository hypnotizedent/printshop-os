#!/bin/bash
# Create Customer Account via API
# Usage: ./scripts/create-customer.sh [email] [password] [name] [company]

set -e

# Default values
EMAIL="${1:-customer@test.com}"
PASSWORD="${2:-CustomerPass123!}"
NAME="${3:-Test Customer}"
COMPANY="${4:-Test Company}"
API_URL="${STRAPI_URL:-http://localhost:1337}"

echo "👥 Creating customer account..."
echo "   Email: $EMAIL"
echo "   Name: $NAME"
echo "   Company: $COMPANY"
echo "   API: $API_URL"
echo ""

# Use the signup endpoint which properly hashes the password
curl -X POST "$API_URL/api/auth/customer/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"$NAME\",
    \"company\": \"$COMPANY\"
  }"

echo ""
echo "✅ Customer account created!"
echo "   You can now login with:"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
