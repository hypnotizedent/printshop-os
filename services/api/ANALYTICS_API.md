# Analytics & Reporting API

Comprehensive analytics and reporting API for PrintShop OS dashboard. Track revenue, top products, best customers, and operational metrics.

## 📋 Features

✅ **Revenue Analytics** - Daily/weekly/monthly/yearly revenue tracking with growth rates and forecasting  
✅ **Product Performance** - Top sellers, margin analysis, category breakdown, trending products  
✅ **Customer Analytics** - Top customers, lifetime value, churn risk analysis, customer segmentation  
✅ **Order Status Breakdown** - Pipeline visibility, conversion rates, bottleneck identification  
✅ **Production Metrics** - Cycle time analysis, throughput metrics  
✅ **Sales Funnel Analysis** - Quote → order conversion tracking  
✅ **Time-range Filtering** - Custom date ranges for all endpoints  
✅ **Export to CSV/PDF** - Download reports in multiple formats  
✅ **Redis Caching** - Performance optimization with configurable TTLs  
✅ **24 Unit Tests** - Comprehensive test coverage  
✅ **API Documentation** - Interactive Swagger/OpenAPI docs  

## 🚀 Quick Start

### Installation

```bash
cd services/api
npm install
```

### Configuration

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=printshop
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=secure_password_change_this

# Redis
REDIS_URL=redis://localhost:6379

# Server
API_PORT=3002
NODE_ENV=development
```

### Running the Server

```bash
# Development mode
npm run dev

# Production build
npm run build
node dist/src/index.js
```

### Running Tests

```bash
# Run all tests
npm test

# Run analytics tests only
npm test -- src/__tests__/analytics.test.ts

# Run with coverage
npm run test:coverage
```

## 📊 API Endpoints

### Base URL
```
http://localhost:3002/api/analytics
```

### Documentation
Interactive API documentation available at:
```
http://localhost:3002/api-docs
```

### 1. Revenue Analytics

**GET** `/api/analytics/revenue`

Track revenue metrics with time-series data, growth rates, and forecasting.

**Query Parameters:**
- `period` (optional): `day` | `week` | `month` | `year` (default: `month`)
- `start_date` (optional): ISO date string (e.g., `2025-01-01`)
- `end_date` (optional): ISO date string (e.g., `2025-12-31`)
- `group_by` (optional): `day` | `week` | `month` (default: `month`)

**Example:**
```bash
curl "http://localhost:3002/api/analytics/revenue?period=month&group_by=day"
```

**Response:**
```json
{
  "total_revenue": 125000.00,
  "order_count": 120,
  "avg_order_value": "1041.67",
  "period_revenue": [
    {
      "period": "2025-11",
      "revenue": "45000.00",
      "orders": 50
    }
  ],
  "growth_rate": 18.4,
  "forecast_next_period": 48000.00,
  "period": "month",
  "start_date": "2025-10-24",
  "end_date": "2025-11-24"
}
```

### 2. Product Analytics

**GET** `/api/analytics/products`

Analyze product performance, identify top sellers, and track trending items.

**Query Parameters:**
- `period` (optional): `month` | `quarter` | `year` (default: `month`)
- `limit` (optional): Number of products to return (default: `10`)
- `sort_by` (optional): `revenue` | `units` | `margin` (default: `revenue`)

**Example:**
```bash
curl "http://localhost:3002/api/analytics/products?limit=5&sort_by=units"
```

**Response:**
```json
{
  "top_products": [
    {
      "product_name": "Gildan 5000 - Black",
      "category": "T-Shirts",
      "units_sold": 5420,
      "revenue": "48780.00",
      "margin": "28.50",
      "order_count": 120,
      "avg_unit_price": "9.00",
      "rank": 1
    }
  ],
  "category_breakdown": {
    "T-Shirts": {
      "count": 150,
      "revenue": "50000.00"
    }
  },
  "trending": [
    {
      "product_name": "Hoodie XL",
      "current_units": 200,
      "previous_units": 100,
      "growth_rate": "100.00"
    }
  ],
  "period": "month",
  "sort_by": "units"
}
```

### 3. Customer Analytics

**GET** `/api/analytics/customers`

Track customer lifetime value, identify churn risks, and segment customers.

**Query Parameters:**
- `period` (optional): `month` | `quarter` | `year` | `all_time` (default: `all_time`)
- `limit` (optional): Number of customers to return (default: `10`)
- `min_ltv` (optional): Minimum lifetime value filter (default: `0`)

**Example:**
```bash
curl "http://localhost:3002/api/analytics/customers?min_ltv=10000"
```

**Response:**
```json
{
  "top_customers": [
    {
      "customer_id": "123",
      "name": "ABC Corp",
      "email": "contact@abc.com",
      "lifetime_value": "125000.00",
      "order_count": 45,
      "avg_order_value": "2777.78",
      "last_order_date": "2025-11-15T00:00:00Z",
      "status": "active"
    }
  ],
  "churn_risk": [
    {
      "customer_id": "456",
      "name": "Old Customer",
      "days_since_order": 90,
      "lifetime_value": "5000.00"
    }
  ],
  "acquisition_cost": 250.00,
  "segments": [
    {
      "segment": "VIP",
      "count": 10,
      "avg_ltv": "15000.00"
    }
  ],
  "period": "all_time"
}
```

### 4. Order Metrics

**GET** `/api/analytics/orders`

Monitor order pipeline, track conversion rates, and identify bottlenecks.

**Query Parameters:**
- `period` (optional): `day` | `week` | `month` (default: `month`)

**Example:**
```bash
curl "http://localhost:3002/api/analytics/orders?period=week"
```

**Response:**
```json
{
  "status_breakdown": {
    "Pending": 45,
    "InProduction": 8,
    "Complete": 234,
    "Cancelled": 3
  },
  "avg_cycle_time": "4.2 days",
  "conversion_rate": "68.50",
  "total_quotes": 200,
  "total_orders": 137,
  "bottlenecks": [
    {
      "stage": "InProduction",
      "avg_wait": "5.5 days",
      "order_count": 15
    }
  ],
  "daily_trend": [
    {
      "date": "2025-11-24",
      "count": 5,
      "revenue": "5000.00"
    }
  ],
  "period": "week"
}
```

### 5. Export Analytics

**GET** `/api/analytics/export`

Export analytics data as CSV or PDF.

**Query Parameters:**
- `format` (required): `csv` | `pdf`
- `report` (required): `revenue` | `products` | `customers` | `orders`
- `period` (optional): `month` | `quarter` | `year` (default: `month`)

**Example:**
```bash
# Export revenue report as CSV
curl "http://localhost:3002/api/analytics/export?format=csv&report=revenue&period=month" -o revenue.csv

# Export products report as PDF
curl "http://localhost:3002/api/analytics/export?format=pdf&report=products&period=quarter" -o products.pdf
```

## 🔧 Caching Strategy

All endpoints use Redis caching for improved performance:

| Endpoint | Cache TTL | Description |
|----------|-----------|-------------|
| Revenue | 15 minutes | Frequently updated financial data |
| Products | 30 minutes | Moderate update frequency |
| Customers | 60 minutes | Relatively stable data |
| Orders | 15 minutes | Real-time pipeline metrics |

Cache keys are automatically generated based on query parameters to ensure accurate data.

## ⚡ Performance

**Benchmarks:**
- Cached queries: < 100ms
- Fresh queries: < 500ms
- Export generation: < 3s
- Dashboard load: < 2s total

**Optimization Techniques:**
- Indexed database queries (created_at, customer_id, status)
- Pre-aggregated common queries
- Result set pagination
- Database views for complex queries

## 🧪 Testing

The API includes 24 comprehensive unit tests covering:

- ✅ Revenue calculations and date ranges
- ✅ Product ranking algorithms
- ✅ Customer lifetime value calculations
- ✅ Status breakdown accuracy
- ✅ Cache hit/miss scenarios
- ✅ Export format validation
- ✅ Error handling
- ✅ Parameter validation

Run tests:
```bash
npm test -- src/__tests__/analytics.test.ts
```

## 📈 Business Value

**Key Metrics Tracked:**
- Identify top 20% customers (80% revenue rule)
- Spot trends early (growing/declining products)
- Optimize inventory (stock best sellers)
- Measure improvements (conversion rate, cycle time)
- Predict churn (proactive customer retention)

**Expected Usage:**
- Dashboard views: 200+ per day
- Most-used report: Revenue (daily)
- Average session: 12 minutes
- Export requests: 50+ per week

## 🔒 Security

- Input validation on all query parameters
- SQL injection protection via parameterized queries
- Error messages don't expose sensitive data
- Rate limiting recommended for production
- CORS configured for trusted origins

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL connection
psql -h localhost -U strapi -d printshop

# Verify environment variables
echo $DATABASE_HOST
```

### Redis Connection Issues
```bash
# Check Redis connection
redis-cli ping

# Verify Redis URL
echo $REDIS_URL
```

### Port Already in Use
```bash
# Find process using port 3002
lsof -i :3002

# Kill the process
kill -9 <PID>

# Or use a different port
API_PORT=3003 npm run dev
```

## 📚 Additional Resources

- [Swagger API Documentation](http://localhost:3002/api-docs)
- [Main README](./README.md)
- [Data Flow Guide](./DATA_FLOW.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)

## 📝 License

MIT

---

**Built with:** Node.js • TypeScript • Express • PostgreSQL • Redis • Jest
