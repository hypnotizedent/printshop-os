# 🚀 Supplier Integration Epic #85 - Quick Start Guide

**Last Updated:** November 23, 2025  
**Status:** Ready for Implementation  
**Timeline:** 3-4 Weeks

---

## 📍 Where Everything Is

| What | Where |
|------|-------|
| **Epic Issue** | https://github.com/hypnotizedent/printshop-os/issues/85 |
| **Full Documentation** | `/SUPPLIER_INTEGRATION_EPIC.md` |
| **This Guide** | `/SUPPLIER_INTEGRATION_QUICKSTART.md` |
| **Session Summary** | `/SESSION_ENTERPRISE_CONSOLIDATION_SUMMARY.md` |
| **Roadmap Context** | `/ROADMAP.md` (Phase 3B) |

---

## 🎯 The 11 Sub-Tasks at a Glance

### Week 1-2: Infrastructure Setup
```
Sub-Task 1: Supplier Data Normalization Layer    (2-3 days)
  → Create unified product schema
  → Handle S&S, AS Colour, SanMar formats

Sub-Task 2: Data Transformation Service          (3-4 days)
  → Transform each supplier API → unified format
  → Files: lib/transformers/{sands,ascolour,sanmar}.js

Sub-Task 3: Caching Strategy (Redis)             (2-3 days)
  → Implement TTL-based caching
  → Save $500/month on API costs

Sub-Task 4: Error Handling & Fallback            (2-3 days)
  → Circuit breaker pattern
  → Serve cached data when APIs down
```

### Week 3-4: Supplier Integrations
```
Sub-Task 5: S&S Activewear Integration           (3-4 days)
  → Largest supplier (300+ products)
  → REST API with Bearer token auth
  → Sync products, prices, inventory

Sub-Task 6: AS Colour Integration                (3-4 days)
  → REST + GraphQL options
  → Clean API with bulk query support
  → Variants handling (color/size combos)

Sub-Task 7: SanMar Integration                   (3-4 days)
  → OAuth 2.0 flow (most complex)
  → Corporate wear supplier
  → Token refresh management
```

### Week 4: Features & Testing
```
Sub-Task 8: Product Variants System              (2-3 days)
  → Support size/color/fabric combinations
  → Variant representation in unified schema

Sub-Task 9: Inventory Sync Strategy              (2-3 days)
  → Real-time for high-volume items (15-30 min)
  → Daily sync for all products
  → Event-driven on quote creation

Sub-Task 10: Comprehensive Testing               (2-3 days)
  → Unit, integration, load tests
  → Error scenario coverage

Sub-Task 11: Monitoring & Alerting               (2 days)
  → Status dashboards
  → Real-time alerts
  → Health metrics
```

---

## 🛠️ Implementation Pattern (Copy-Paste Ready)

### 1️⃣ Basic Supplier Client Structure
```javascript
// lib/suppliers/base-client.ts
export class BaseSupplierClient {
  protected apiKey: string;
  protected baseURL: string;
  
  async getProducts(page: number = 1) {
    const response = await this.client.get('/products', {
      params: { page, limit: 100 }
    });
    return response.data;
  }
  
  async transformProduct(supplier_response) {
    return {
      supplier_sku: supplier_response.id,
      internal_sku: `PROD-${Date.now()}`,
      name: supplier_response.name,
      supplier: this.name,
      base_cost: supplier_response.price,
      bulk_breaks: supplier_response.pricing_tiers || [],
      variants: supplier_response.options || [],
      total_inventory: supplier_response.stock,
      in_stock: supplier_response.stock > 0,
      last_updated: new Date().toISOString()
    };
  }
}
```

### 2️⃣ S&S Activewear Implementation
```javascript
// lib/suppliers/sands-client.ts
import { BaseSupplierClient } from './base-client';

export class SandsActivewearClient extends BaseSupplierClient {
  constructor() {
    super();
    this.name = 'sands';
    this.baseURL = 'https://api.sands.com';
    this.apiKey = process.env.SANDS_API_KEY;
  }
  
  async authenticate() {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
  }
  
  async syncAll() {
    let page = 1;
    while (true) {
      const products = await this.getProducts(page);
      if (!products.length) break;
      
      for (const product of products) {
        const normalized = this.transformProduct(product);
        await saveToStrapi(normalized);
        await cacheProduct(normalized);
      }
      
      page++;
    }
  }
}
```

### 3️⃣ Redis Caching Layer
```javascript
// lib/cache/supplier-cache.ts
import Redis from 'ioredis';

export class SupplierCache {
  private redis = new Redis();
  
  private TTLs = {
    PRODUCTS: 24 * 60 * 60,      // 24 hours
    INVENTORY: 1 * 60 * 60,       // 1 hour
    PRICING: 7 * 24 * 60 * 60    // 7 days
  };
  
  async getProduct(supplier: string, sku: string) {
    const key = `supplier:${supplier}:product:${sku}`;
    return await this.redis.get(key);
  }
  
  async setProduct(supplier: string, sku: string, data: any) {
    const key = `supplier:${supplier}:product:${sku}`;
    await this.redis.setex(
      key,
      this.TTLs.PRODUCTS,
      JSON.stringify(data)
    );
  }
}
```

### 4️⃣ Error Handling with Circuit Breaker
```javascript
// lib/resilience/circuit-breaker.ts
export class CircuitBreaker {
  private status: 'up' | 'degraded' | 'down' = 'up';
  private failures = 0;
  private failureThreshold = 3;
  
  async callSupplierAPI(fn: () => Promise<any>) {
    if (this.status === 'down') {
      return { data: null, status: 'cached', cached_at: '...' };
    }
    
    try {
      const result = await fn();
      this.failures = 0;
      return { ...result, status: 'live' };
    } catch (error) {
      this.failures++;
      if (this.failures > this.failureThreshold) {
        this.status = 'degraded';
        // Alert admin
      }
      // Serve from cache
      return { data: cachedData, status: 'cached' };
    }
  }
}
```

---

## 📊 Success Metrics to Track

```
Sync Reliability:       >99% success rate (target)
Cache Hit Rate:         >80% (target)
API Response Time:      <500ms cached / <2s live
Cost Savings:           $500/month reduction
Fallback Success:       100% graceful degradation
Time to Market:         3-4 weeks
```

---

## 👥 Team Assignments (Recommended)

### Team A: Infrastructure Lead (3-4 days)
- Sub-task 1: Data normalization
- Sub-task 2: Transformation service
- Sets foundation for other teams

### Team B: Caching & Resilience (3-4 days)
- Sub-task 3: Redis caching
- Sub-task 4: Error handling
- Can start parallel to Team A

### Team C: S&S Integration (3-4 days)
- Sub-task 5: S&S Activewear
- Largest supplier, can parallelize after infrastructure

### Team D: Secondary Suppliers (3-4 days each)
- Sub-task 6: AS Colour
- Sub-task 7: SanMar

### Team E: Polish & Testing (2-3 days each)
- Sub-task 8: Variants
- Sub-task 9: Inventory
- Sub-task 10: Testing
- Sub-task 11: Monitoring

---

## 🔗 Integration Points

This epic connects to:
- **Phase 1:** Strapi (data storage) ← DEPENDENCY
- **Phase 2:** Job Estimator (pricing engine) ← CONSUMER
- **Phase 2:** Customer Portal (quote engine) ← CONSUMER
- **Phase 3:** Production Dashboard ← CONSUMER
- **Phase 4:** Analytics (inventory visibility) ← CONSUMER

---

## 📋 Daily Standup Talking Points

**What to say:**
- "We're on Sprint [X] of Epic #85"
- "Completed: [sub-task name]"
- "Blocker: [issue, or 'none']"
- "Cache hit rate: [%]"
- "API failures: [count]"

**What to avoid:**
- Discussing individual issues #24-31, #58, #62-68 (all consolidated)
- Starting work before infrastructure is ready

---

## 🚨 Known Gotchas

1. **SanMar OAuth:** Token expiry needs refresh logic - don't forget
2. **S&S Pagination:** Default limit is 100, adjust if needed
3. **Cache Invalidation:** Watch TTL on inventory - 1hr may be too long in summer
4. **Variant Naming:** Each supplier uses different conventions - normalize early
5. **Rate Limiting:** S&S has 500 req/hour limit - respect it

---

## 🎯 Go/No-Go Checklist Before Week 1 Starts

- [ ] Team assigned to sub-tasks
- [ ] Epic #85 reviewed by all team members
- [ ] Development environment set up
- [ ] API credentials obtained (S&S, AS Colour, SanMar)
- [ ] Redis instance available (or docker-compose ready)
- [ ] Strapi running and accessible
- [ ] Database schema reviewed
- [ ] Slack channel created for epic updates
- [ ] Daily standup time scheduled
- [ ] Definition of done agreed (code review, tests, etc.)

---

## 📞 Questions?

**Reference these in order:**
1. `SUPPLIER_INTEGRATION_EPIC.md` (full details)
2. `SESSION_ENTERPRISE_CONSOLIDATION_SUMMARY.md` (context)
3. GitHub Epic #85 comments (team discussion)
4. Individual supplier API docs (S&S, AS Colour, SanMar)

---

## 🚀 Ready to Start?

```bash
# Day 1 checklist:
1. Team reads this guide
2. Everyone reviews Epic #85 on GitHub
3. First standup: confirm assignments
4. Team A starts: normalization layer
5. Teams B-E get dev environment ready

# Week 1 goal:
Infrastructure foundation in place (Sub-tasks 1-4 done)
```

**You've got this! 🎉**

---

*Quick Reference Card - November 23, 2025*  
*For detailed implementation, see SUPPLIER_INTEGRATION_EPIC.md*
