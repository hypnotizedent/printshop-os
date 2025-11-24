/**
 * Tests for Cache Decorator
 */

import { CacheService } from '../cache';
import { CacheDecorator, InvalidateCache, withCache } from '../cache-decorator';
import { CacheConfig } from '../cache-config';

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    const store = new Map<string, { value: string; expiry?: number }>();
    
    return {
      get: jest.fn().mockImplementation(async (key: string) => {
        const item = store.get(key);
        if (!item) return null;
        if (item.expiry && Date.now() > item.expiry) {
          store.delete(key);
          return null;
        }
        return item.value;
      }),
      setex: jest.fn().mockImplementation(async (key: string, ttl: number, value: string) => {
        store.set(key, { value, expiry: Date.now() + ttl * 1000 });
        return 'OK';
      }),
      del: jest.fn().mockImplementation(async (...keys: string[]) => {
        let count = 0;
        keys.forEach(key => {
          if (store.has(key)) {
            store.delete(key);
            count++;
          }
        });
        return count;
      }),
      keys: jest.fn().mockImplementation(async (pattern: string) => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return Array.from(store.keys()).filter(key => regex.test(key));
      }),
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
      __store: store,
    };
  });
});

class TestService {
  cacheService?: CacheService;
  callCount = 0;

  @CacheDecorator({ ttl: 3600, keyPrefix: 'test:products' })
  async getProducts(): Promise<any[]> {
    this.callCount++;
    return [
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' },
    ];
  }

  @CacheDecorator({ ttl: 1800, keyPrefix: 'test:product' })
  async getProduct(id: number): Promise<any> {
    this.callCount++;
    return { id, name: `Product ${id}` };
  }

  @CacheDecorator({ ttl: 7200, keyPrefix: 'test:search' })
  async searchProducts(query: string, limit: number): Promise<any[]> {
    this.callCount++;
    return [{ id: 1, name: query, limit }];
  }

  @InvalidateCache({ pattern: 'test:products:*' })
  async updateProduct(id: number, data: any): Promise<void> {
    // Simulate update operation
  }

  @CacheDecorator({ ttl: 3600, keyPrefix: 'test:disabled', enabled: false })
  async getDisabledCache(): Promise<any> {
    this.callCount++;
    return { data: 'not cached' };
  }
}

describe('CacheDecorator', () => {
  let cacheService: CacheService;
  let testService: TestService;
  let config: CacheConfig;

  beforeEach(() => {
    config = {
      host: 'localhost',
      port: 6379,
      enabled: true,
      ttl: {
        productLists: 3600,
        prices: 1800,
        inventory: 900,
        productDetails: 7200,
      },
    };
    cacheService = new CacheService(config);
    testService = new TestService();
    testService.cacheService = cacheService;
  });

  afterEach(async () => {
    await cacheService.disconnect();
  });

  describe('Cache Hit Scenarios', () => {
    it('should cache method results', async () => {
      const result1 = await testService.getProducts();
      const result2 = await testService.getProducts();
      
      expect(result1).toEqual(result2);
      expect(testService.callCount).toBe(1); // Method called only once
      
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.apiCalls).toBe(1);
    });

    it('should cache method with parameters', async () => {
      const result1 = await testService.getProduct(1);
      const result2 = await testService.getProduct(1);
      
      expect(result1).toEqual(result2);
      expect(testService.callCount).toBe(1);
      
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(1);
    });

    it('should differentiate cache by parameters', async () => {
      const result1 = await testService.getProduct(1);
      const result2 = await testService.getProduct(2);
      
      expect(result1).not.toEqual(result2);
      expect(testService.callCount).toBe(2); // Different parameters = different cache keys
      
      const stats = cacheService.getStats();
      expect(stats.misses).toBe(2);
      expect(stats.apiCalls).toBe(2);
    });

    it('should cache methods with multiple parameters', async () => {
      const result1 = await testService.searchProducts('shirt', 10);
      const result2 = await testService.searchProducts('shirt', 10);
      
      expect(result1).toEqual(result2);
      expect(testService.callCount).toBe(1);
    });

    it('should differentiate cache by multiple parameters', async () => {
      const result1 = await testService.searchProducts('shirt', 10);
      const result2 = await testService.searchProducts('shirt', 20);
      const result3 = await testService.searchProducts('pants', 10);
      
      expect(testService.callCount).toBe(3); // All different parameter combinations
    });
  });

  describe('Cache Miss Scenarios', () => {
    it('should call method on cache miss', async () => {
      const result = await testService.getProducts();
      
      expect(result).toEqual([
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
      ]);
      expect(testService.callCount).toBe(1);
      
      const stats = cacheService.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.apiCalls).toBe(1);
    });

    it('should handle multiple cache misses', async () => {
      await testService.getProduct(1);
      await testService.getProduct(2);
      await testService.getProduct(3);
      
      expect(testService.callCount).toBe(3);
      
      const stats = cacheService.getStats();
      expect(stats.misses).toBe(3);
      expect(stats.apiCalls).toBe(3);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache on manual invalidation', async () => {
      // Cache some products
      await testService.getProducts();
      expect(testService.callCount).toBe(1);
      
      // Manually invalidate cache
      await cacheService.deletePattern('test:products:*');
      
      // Should fetch fresh data
      await testService.getProducts();
      expect(testService.callCount).toBe(2);
    });

    it('should invalidate cache using decorator', async () => {
      // Cache some products
      await testService.getProducts();
      expect(testService.callCount).toBe(1);
      
      // Update product (triggers cache invalidation)
      await testService.updateProduct(1, { name: 'Updated' });
      
      // Should fetch fresh data
      await testService.getProducts();
      expect(testService.callCount).toBe(2);
    });
  });

  describe('TTL Expiration', () => {
    it('should respect TTL and refetch after expiration', async () => {
      // Create service with very short TTL
      class ShortTTLService {
        cacheService?: CacheService;
        callCount = 0;

        @CacheDecorator({ ttl: 1, keyPrefix: 'test:short' })
        async getData(): Promise<any> {
          this.callCount++;
          return { timestamp: Date.now() };
        }
      }

      const shortService = new ShortTTLService();
      shortService.cacheService = cacheService;

      const result1 = await shortService.getData();
      expect(shortService.callCount).toBe(1);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result2 = await shortService.getData();
      expect(shortService.callCount).toBe(2);
      expect(result2.timestamp).toBeGreaterThan(result1.timestamp);
    });
  });

  describe('Graceful Fallback', () => {
    it('should work without cache service', async () => {
      const noCacheService = new TestService();
      // No cacheService attached
      
      const result1 = await noCacheService.getProducts();
      const result2 = await noCacheService.getProducts();
      
      expect(result1).toEqual(result2);
      expect(noCacheService.callCount).toBe(2); // Called twice without cache
    });

    it('should work with disabled cache', async () => {
      const disabledConfig: CacheConfig = {
        ...config,
        enabled: false,
      };
      const disabledCache = new CacheService(disabledConfig);
      const serviceWithDisabledCache = new TestService();
      serviceWithDisabledCache.cacheService = disabledCache;
      
      const result1 = await serviceWithDisabledCache.getProducts();
      const result2 = await serviceWithDisabledCache.getProducts();
      
      expect(result1).toEqual(result2);
      expect(serviceWithDisabledCache.callCount).toBe(2); // No caching
      
      await disabledCache.disconnect();
    });

    it('should respect decorator enabled flag', async () => {
      const result1 = await testService.getDisabledCache();
      const result2 = await testService.getDisabledCache();
      
      expect(result1).toEqual(result2);
      expect(testService.callCount).toBe(2); // Caching disabled for this method
    });
  });

  describe('withCache Helper', () => {
    it('should attach cache service to connector', () => {
      const connector = new TestService();
      const connectorWithCache = withCache(connector, cacheService);
      
      expect(connectorWithCache.cacheService).toBe(cacheService);
    });
  });

  describe('Performance & Scalability', () => {
    it('should handle high volume of cached requests efficiently', async () => {
      // First call to cache the result
      await testService.getProducts();
      
      const startTime = Date.now();
      
      // 100 cached requests
      const promises = Array.from({ length: 100 }, () =>
        testService.getProducts()
      );
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (cached)
      expect(duration).toBeLessThan(1000); // Less than 1 second for 100 cached requests
      expect(testService.callCount).toBe(1); // Only one actual API call
      
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(100);
      expect(stats.apiCalls).toBe(1);
      expect(stats.cacheHitRate).toBeGreaterThan(0.99);
    });

    it('should track cache hit rate across multiple methods', async () => {
      // Mix of cache hits and misses
      await testService.getProducts(); // miss
      await testService.getProducts(); // hit
      await testService.getProducts(); // hit
      
      await testService.getProduct(1); // miss
      await testService.getProduct(1); // hit
      
      await testService.getProduct(2); // miss
      
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(3);
      expect(stats.cacheHitRate).toBeCloseTo(0.5, 2);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during cache operations gracefully', async () => {
      // Simulate cache error by removing the cache service mid-operation
      const result1 = await testService.getProducts();
      
      // Force cache error by setting invalid cache
      testService.cacheService = undefined;
      
      // Should still work (fallback to direct call)
      const result2 = await testService.getProducts();
      
      expect(result2).toBeDefined();
      expect(testService.callCount).toBe(2);
    });
  });
});
