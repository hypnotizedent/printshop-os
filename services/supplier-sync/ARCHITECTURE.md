# Supplier Integration System - Architecture

## Overview
Unified supplier integration layer for real-time product catalog, pricing, and inventory sync from multiple apparel suppliers (S&S Activewear, AS Colour, SanMar).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (Quote UI, Pricing Engine, Production Dashboard)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Strapi API Layer                            │
│         (Products, Variants, Prices, Inventory)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Redis Caching Layer (TTL: 1-24h)                │
│    - Product Catalog Cache                                   │
│    - Pricing Cache (hourly refresh)                          │
│    - Inventory Cache (15min refresh)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            Supplier Sync Service                             │
│  - Data Normalization                                        │
│  - API Rate Limiting                                         │
│  - Error Handling & Retry                                    │
│  - Graceful Degradation                                      │
└─────┬────────────────┬────────────────┬─────────────────────┘
      │                │                │
┌─────▼─────┐   ┌──────▼──────┐   ┌────▼──────┐
│ S&S API   │   │ AS Colour   │   │  SanMar   │
│ REST      │   │ REST        │   │  OAuth2   │
└───────────┘   └─────────────┘   └───────────┘
```

## Key Features

1. **Unified Data Model** - Single schema for all suppliers
2. **Smart Caching** - Redis-backed with configurable TTL
3. **Rate Limiting** - Respect API limits, prevent overages
4. **Graceful Degradation** - Fall back to cached data on API failure
5. **Cost Optimization** - ~$500/month savings via caching

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [x] Architecture design
- [ ] Unified Product schema in Strapi
- [ ] Redis caching strategy
- [ ] Base sync service structure

### Phase 2: S&S Activewear Integration (Week 2)
- [ ] API authentication
- [ ] Product catalog sync
- [ ] Pricing sync
- [ ] Inventory sync
- [ ] Rate limiting

### Phase 3: AS Colour Integration (Week 3)
- [ ] API authentication
- [ ] Product catalog sync
- [ ] Pricing sync
- [ ] Inventory sync

### Phase 4: SanMar Integration (Week 3-4)
- [ ] OAuth2 authentication
- [ ] Product catalog sync
- [ ] Pricing sync
- [ ] Inventory sync

### Phase 5: Optimization (Week 4)
- [ ] Performance tuning
- [ ] Monitoring & alerts
- [ ] Error recovery
- [ ] Documentation
