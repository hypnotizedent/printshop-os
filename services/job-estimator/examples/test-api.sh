#!/bin/bash
# Test script for Pricing API
# Usage: ./examples/test-api.sh

API_URL="http://localhost:3001"

echo "=== Pricing API Test Script ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Health check
echo -e "${BLUE}Test 1: Health Check${NC}"
curl -s "${API_URL}/health" | jq .
echo ""
echo ""

# Test 2: Basic pricing calculation
echo -e "${BLUE}Test 2: Basic Pricing Calculation${NC}"
curl -s -X POST "${API_URL}/pricing/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 100,
    "service": "screen",
    "print_locations": ["front"],
    "color_count": 2
  }' | jq .
echo ""
echo ""

# Test 3: Complex order (from requirements example)
echo -e "${BLUE}Test 3: Complex Order (Requirements Example)${NC}"
curl -s -X POST "${API_URL}/pricing/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "garment_id": "ss-activewear-6001",
    "quantity": 100,
    "service": "screen",
    "print_locations": ["front", "back"],
    "color_count": 3,
    "is_rush": false,
    "customer_type": "repeat_customer"
  }' | jq .
echo ""
echo ""

# Test 4: Large order with volume discount
echo -e "${BLUE}Test 4: Large Order (500+ units, 20% discount)${NC}"
curl -s -X POST "${API_URL}/pricing/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "garment_id": "ss-activewear-6001",
    "quantity": 500,
    "service": "screen",
    "print_locations": ["front", "back"],
    "color_count": 2
  }' | jq '{
    quantity: .line_items[0].qty,
    subtotal: .subtotal,
    margin_pct: .margin_pct,
    total_price: .total_price,
    volume_discount: .breakdown.volume_discounts,
    calculation_time_ms: .calculation_time_ms
  }'
echo ""
echo ""

# Test 5: Get all pricing rules
echo -e "${BLUE}Test 5: List All Pricing Rules${NC}"
curl -s "${API_URL}/admin/rules" | jq '{
  count: .count,
  rule_ids: [.rules[].id]
}'
echo ""
echo ""

# Test 6: Performance metrics
echo -e "${BLUE}Test 6: Performance Metrics${NC}"
curl -s "${API_URL}/pricing/metrics" | jq .
echo ""
echo ""

# Test 7: Pricing history
echo -e "${BLUE}Test 7: Pricing History${NC}"
curl -s "${API_URL}/pricing/history" | jq '{
  total_calculations: .count,
  latest: .calculations[-1]
}'
echo ""
echo ""

echo -e "${GREEN}All tests completed!${NC}"
echo ""
echo "For more examples, see: docs/PRICING_API.md"
