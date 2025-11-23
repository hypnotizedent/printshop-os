# Pricing API Documentation

## Overview

The Pricing API provides flexible, JSON-driven pricing calculations for print shop orders with full audit trail and caching capabilities.

## Features

- ✅ JSON-based pricing rules with versioning
- ✅ Rule precedence and condition evaluation
- ✅ Automatic caching for fast repeated calculations
- ✅ Full pricing history and audit trail
- ✅ Sub-100ms response times
- ✅ Admin API for rule management
- ✅ Comprehensive breakdown of all pricing components

## Quick Start

### Starting the API Server

```bash
# Development mode (with hot reload)
npm run api:dev

# Production mode
npm run build
npm run api:start
```

The server will start on port 3001 by default. You can change this with the `PORT` environment variable:

```bash
PORT=8080 npm run api:dev
```

### Basic Usage

Calculate pricing for an order:

```bash
curl -X POST http://localhost:3001/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "garment_id": "ss-activewear-6001",
    "quantity": 100,
    "service": "screen",
    "print_locations": ["front", "back"],
    "color_count": 3,
    "customer_type": "repeat_customer"
  }'
```

## API Endpoints

### Pricing Endpoints

#### POST /pricing/calculate

Calculate pricing for an order.

**Request Body:**
```json
{
  "garment_id": "ss-activewear-6001",
  "quantity": 100,
  "service": "screen",
  "print_locations": ["front", "back"],
  "color_count": 3,
  "stitch_count": 5000,
  "customer_type": "repeat_customer",
  "is_rush": false
}
```

**Query Parameters:**
- `dry_run` (boolean): If true, calculation won't be saved to history

**Response:**
```json
{
  "line_items": [
    {
      "description": "Garment x100",
      "unit_cost": 4.5,
      "qty": 100,
      "total": 450.0
    },
    {
      "description": "Print surcharge (front+back)",
      "unit_cost": 5.0,
      "qty": 100,
      "total": 500.0
    },
    {
      "description": "Color multiplier (3x)",
      "factor": 1.3,
      "total": 285.0
    },
    {
      "description": "Volume discount (100+ units)",
      "discount": 10,
      "total": -123.5
    }
  ],
  "subtotal": 1111.5,
  "margin_pct": 35.0,
  "total_price": 1500.52,
  "breakdown": {
    "base_cost": 450.0,
    "location_surcharges": 500.0,
    "color_adjustments": 285.0,
    "volume_discounts": 123.5,
    "margin_amount": 389.02
  },
  "rules_applied": [
    "volume-discount-100-499-v1",
    "location-surcharges-v1",
    "color-multipliers-screenprint-v1"
  ],
  "calculation_time_ms": 12
}
```

#### GET /pricing/history

Get pricing calculation history.

**Query Parameters:**
- `garment_id` (string): Filter by garment ID
- `customer_type` (string): Filter by customer type

**Response:**
```json
{
  "count": 42,
  "calculations": [
    {
      "timestamp": "2025-11-23T20:48:00.000Z",
      "input": { ... },
      "output": { ... }
    }
  ]
}
```

#### GET /pricing/metrics

Get performance metrics.

**Response:**
```json
{
  "avg_calculation_time_ms": 15.3,
  "total_calculations": 1234,
  "cache_hit_rate": 0.65,
  "cache": {
    "size": 42,
    "ttl": 300
  }
}
```

### Admin Endpoints

#### GET /admin/rules

Get all pricing rules.

**Response:**
```json
{
  "count": 9,
  "rules": [
    {
      "id": "volume-discount-100-499-v1",
      "description": "10% discount for 100-499 units",
      "version": 1,
      "effective_date": "2025-01-01",
      "conditions": {
        "quantity_min": 100,
        "quantity_max": 499
      },
      "calculations": {
        "discount_pct": 10
      },
      "priority": 10,
      "enabled": true,
      "created_at": "2025-11-23T12:00:00.000Z",
      "updated_at": "2025-11-23T12:00:00.000Z"
    }
  ]
}
```

#### GET /admin/rules/:id

Get a specific pricing rule.

**Response:**
```json
{
  "id": "volume-discount-100-499-v1",
  "description": "10% discount for 100-499 units",
  ...
}
```

#### POST /admin/rules

Create a new pricing rule.

**Request Body:**
```json
{
  "id": "custom-discount-v1",
  "description": "Custom discount for special customers",
  "version": 1,
  "effective_date": "2025-12-01",
  "expiry_date": "2026-01-31",
  "conditions": {
    "quantity_min": 50,
    "customer_type": ["vip", "wholesale"]
  },
  "calculations": {
    "discount_pct": 15,
    "margin_target": 0.30
  },
  "priority": 20,
  "enabled": true
}
```

**Response:**
```json
{
  "id": "custom-discount-v1",
  "created_at": "2025-11-23T20:48:00.000Z",
  "updated_at": "2025-11-23T20:48:00.000Z",
  ...
}
```

#### PUT /admin/rules/:id

Update a pricing rule.

**Request Body:**
```json
{
  "description": "Updated description",
  "enabled": false
}
```

#### DELETE /admin/rules/:id

Delete a pricing rule.

**Response:** 204 No Content

#### POST /admin/cache/clear

Clear the pricing cache.

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

## Pricing Rule Format

### Complete Rule Example

```json
{
  "id": "unique-rule-id",
  "description": "Human-readable description",
  "version": 1,
  "effective_date": "2025-01-01",
  "expiry_date": "2025-12-31",
  "conditions": {
    "quantity_min": 100,
    "quantity_max": 499,
    "service": ["screen", "embroidery"],
    "colors_min": 2,
    "colors_max": 6,
    "location": ["front", "back"],
    "customer_type": ["repeat_customer", "vip"],
    "garment_type": ["premium"],
    "supplier": ["ss-activewear"]
  },
  "calculations": {
    "discount_pct": 10,
    "surcharge_pct": 5,
    "location_surcharge": {
      "front": 2.0,
      "back": 3.0,
      "sleeve": 1.5
    },
    "color_multiplier": {
      "2": 1.3,
      "3": 1.3,
      "4": 1.4
    },
    "stitch_price_per_1000": 1.5,
    "margin_target": 0.35,
    "setup_fee": 75.0,
    "unit_price_override": 5.0
  },
  "priority": 10,
  "enabled": true,
  "notes": "Additional context or instructions"
}
```

### Rule Precedence

Rules are evaluated in order of priority (highest first). When multiple rules match:
- The highest priority rule's calculations take precedence
- Conditions must ALL match for a rule to apply
- Multiple rules can contribute different calculation types

### Default Values

If no rules match or override defaults:
- **Location Surcharges:** Front +$2, Back +$3, Sleeve +$1.50
- **Color Multipliers:** 1 color = ×1.0, 2+ colors = ×1.3
- **Volume Discounts:** 1-99 = 0%, 100-499 = 10%, 500+ = 20%
- **Margin:** 35%
- **Embroidery:** $1.50 per 1000 stitches

## Pricing Calculation Flow

1. **Load Garment Cost** - Look up base cost from supplier data
2. **Apply Location Surcharges** - Add per-location charges
3. **Apply Color Multipliers** - Multiply for multi-color jobs
4. **Calculate Embroidery** - Price based on stitch count
5. **Apply Volume Discounts** - Reduce price for bulk orders
6. **Calculate Margin** - Add profit margin percentage
7. **Return Breakdown** - Show all calculation steps

## Performance

- **Target Response Time:** <100ms
- **Caching:** 5-minute TTL by default
- **Cache Invalidation:** Automatic on rule changes
- **Concurrent Requests:** Fully async, no blocking

## Testing

Run the comprehensive test suite:

```bash
# All tests
npm test

# Specific test suites
npm test pricing-rules-engine.test.ts
npm test pricing-api.test.ts
npm test api-server.test.ts

# With coverage
npm run test:coverage
```

Test coverage includes:
- 39 tests for rules engine
- 24 tests for pricing API service
- 22 tests for HTTP API endpoints
- **Total: 85+ tests covering all functionality**

## Examples

### Example 1: Basic Screen Print Order

```bash
curl -X POST http://localhost:3001/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 100,
    "service": "screen",
    "print_locations": ["front"],
    "color_count": 2
  }'
```

### Example 2: Embroidery Order

```bash
curl -X POST http://localhost:3001/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 50,
    "service": "embroidery",
    "stitch_count": 8000
  }'
```

### Example 3: Complex Multi-Location Order

```bash
curl -X POST http://localhost:3001/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "garment_id": "ss-activewear-6001",
    "quantity": 500,
    "service": "screen",
    "print_locations": ["front", "back", "sleeve"],
    "color_count": 4,
    "customer_type": "repeat_customer"
  }'
```

### Example 4: Dry Run (No History)

```bash
curl -X POST "http://localhost:3001/pricing/calculate?dry_run=true" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 100}'
```

## Integration with Strapi

The pricing engine is designed to integrate with Strapi CMS:

1. **PricingRule Collection** - Store rules in Strapi database
2. **PriceCalculation Collection** - Store calculation history
3. **Admin Panel** - Manage rules through Strapi UI
4. **REST API** - Access via Strapi's REST endpoints

Strapi schemas are located in:
- `printshop-strapi/src/api/pricing-rule/content-types/pricing-rule/schema.json`
- `printshop-strapi/src/api/price-calculation/content-types/price-calculation/schema.json`

## Production Deployment

### Environment Variables

```bash
PORT=3001                    # API server port
NODE_ENV=production          # Environment
CACHE_TTL=300               # Cache TTL in seconds
REDIS_URL=redis://localhost # Redis URL (future)
STRAPI_URL=http://localhost:1337  # Strapi URL
```

### Redis Integration (Future)

The current implementation uses in-memory caching. For production:

1. Replace `PricingCache` with Redis client
2. Store rules in Strapi database
3. Use Redis pub/sub for cache invalidation
4. Enable distributed caching across instances

## Support

For issues or questions:
- GitHub Issues: [printshop-os](https://github.com/hypnotizedent/printshop-os)
- Documentation: See `/docs` directory
