/**
 * Tests for Redis Cache Service
 */

import { CacheService } from '../cache';
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
      set: jest.fn().mockImplementation(async (key: string, value: string) => {
        store.set(key, { value });
        return 'OK';
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
      // Expose store for testing
      __store: store,
    };
  });
});

describe('CacheService', () => {
  let cacheService: CacheService;
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
  });

  afterEach(async () => {
    await cacheService.disconnect();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      const testData = { id: 1, name: 'Test Product' };
      await cacheService.set('test-key', testData);
      const result = await cacheService.get<typeof testData>('test-key');
      
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('non-existent');
      
      expect(result).toBeNull();
    });

    it('should delete a value', async () => {
      await cacheService.set('test-key', { data: 'test' });
      const deleted = await cacheService.delete('test-key');
      const result = await cacheService.get('test-key');
      
      expect(deleted).toBe(true);
      expect(result).toBeNull();
    });

    it('should handle complex objects', async () => {
      const complexData = {
        products: [
          { id: 1, name: 'Product 1', colors: ['red', 'blue'] },
          { id: 2, name: 'Product 2', colors: ['green'] },
        ],
        metadata: {
          total: 2,
          page: 1,
        },
      };
      
      await cacheService.set('complex-key', complexData);
      const result = await cacheService.get('complex-key');
      
      expect(result).toEqual(complexData);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should set value with TTL', async () => {
      await cacheService.set('ttl-key', { data: 'test' }, 1);
      const result = await cacheService.get('ttl-key');
      
      expect(result).toEqual({ data: 'test' });
    });

    it('should respect TTL and expire values', async () => {
      // Set with very short TTL for testing
      await cacheService.set('expire-key', { data: 'test' }, 1);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result = await cacheService.get('expire-key');
      expect(result).toBeNull();
    });

    it('should set value without TTL', async () => {
      await cacheService.set('no-ttl-key', { data: 'test' });
      const result = await cacheService.get('no-ttl-key');
      
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('Pattern Deletion', () => {
    it('should delete keys matching pattern', async () => {
      await cacheService.set('product:1', { id: 1 });
      await cacheService.set('product:2', { id: 2 });
      await cacheService.set('product:3', { id: 3 });
      await cacheService.set('user:1', { id: 1 });
      
      const deleted = await cacheService.deletePattern('product:*');
      
      expect(deleted).toBe(3);
      expect(await cacheService.get('product:1')).toBeNull();
      expect(await cacheService.get('product:2')).toBeNull();
      expect(await cacheService.get('product:3')).toBeNull();
      expect(await cacheService.get('user:1')).not.toBeNull();
    });

    it('should handle pattern with no matches', async () => {
      const deleted = await cacheService.deletePattern('nonexistent:*');
      
      expect(deleted).toBe(0);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits', async () => {
      await cacheService.set('stats-key', { data: 'test' });
      
      await cacheService.get('stats-key');
      await cacheService.get('stats-key');
      await cacheService.get('stats-key');
      
      const stats = cacheService.getStats();
      
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(0);
    });

    it('should track cache misses', async () => {
      await cacheService.get('miss-key-1');
      await cacheService.get('miss-key-2');
      await cacheService.get('miss-key-3');
      
      const stats = cacheService.getStats();
      
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(3);
    });

    it('should track API calls', async () => {
      cacheService.incrementApiCalls();
      cacheService.incrementApiCalls();
      cacheService.incrementApiCalls();
      
      const stats = cacheService.getStats();
      
      expect(stats.apiCalls).toBe(3);
    });

    it('should calculate cache hit rate', async () => {
      await cacheService.set('hit-key', { data: 'test' });
      
      // 4 hits
      await cacheService.get('hit-key');
      await cacheService.get('hit-key');
      await cacheService.get('hit-key');
      await cacheService.get('hit-key');
      
      // 1 miss
      await cacheService.get('miss-key');
      
      const stats = cacheService.getStats();
      
      expect(stats.hits).toBe(4);
      expect(stats.misses).toBe(1);
      expect(stats.cacheHitRate).toBeCloseTo(0.8, 2); // 4/5 = 0.8
    });

    it('should calculate cost savings', async () => {
      await cacheService.set('savings-key', { data: 'test' });
      
      // Multiple cache hits = saved API calls
      for (let i = 0; i < 10; i++) {
        await cacheService.get('savings-key');
      }
      
      const stats = cacheService.getStats();
      
      expect(stats.hits).toBe(10);
      expect(stats.costSavings).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      await cacheService.set('reset-key', { data: 'test' });
      await cacheService.get('reset-key');
      
      cacheService.resetStats();
      const stats = cacheService.getStats();
      
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.apiCalls).toBe(0);
      expect(stats.cacheHitRate).toBe(0);
      expect(stats.costSavings).toBe(0);
    });
  });

  describe('Graceful Fallback', () => {
    it('should handle disabled cache', async () => {
      const disabledConfig: CacheConfig = {
        ...config,
        enabled: false,
      };
      const disabledCache = new CacheService(disabledConfig);
      
      await disabledCache.set('test-key', { data: 'test' });
      const result = await disabledCache.get('test-key');
      
      expect(result).toBeNull();
      expect(disabledCache.isEnabled()).toBe(false);
      
      await disabledCache.disconnect();
    });

    it('should track misses when cache is disabled', async () => {
      const disabledConfig: CacheConfig = {
        ...config,
        enabled: false,
      };
      const disabledCache = new CacheService(disabledConfig);
      
      await disabledCache.get('test-key');
      const stats = disabledCache.getStats();
      
      expect(stats.misses).toBe(1);
      
      await disabledCache.disconnect();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', async () => {
      await cacheService.set('null-key', null);
      const result = await cacheService.get('null-key');
      
      expect(result).toEqual(null);
    });

    it('should handle empty arrays', async () => {
      await cacheService.set('empty-array', []);
      const result = await cacheService.get('empty-array');
      
      expect(result).toEqual([]);
    });

    it('should handle empty objects', async () => {
      await cacheService.set('empty-object', {});
      const result = await cacheService.get('empty-object');
      
      expect(result).toEqual({});
    });

    it('should handle large data sets', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Product ${i}`,
        description: 'A'.repeat(100),
      }));
      
      await cacheService.set('large-data', largeData);
      const result = await cacheService.get('large-data');
      
      expect(result).toEqual(largeData);
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent get operations', async () => {
      await cacheService.set('concurrent-key', { data: 'test' });
      
      const promises = Array.from({ length: 10 }, () =>
        cacheService.get('concurrent-key')
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toEqual({ data: 'test' });
      });
      
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(10);
    });

    it('should handle concurrent set operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        cacheService.set(`concurrent-set-${i}`, { id: i })
      );
      
      await Promise.all(promises);
      
      // Verify all values were set
      for (let i = 0; i < 10; i++) {
        const result = await cacheService.get(`concurrent-set-${i}`);
        expect(result).toEqual({ id: i });
      }
    });
  });

  describe('Cache Enabled Status', () => {
    it('should report enabled status correctly', () => {
      expect(cacheService.isEnabled()).toBe(true);
    });

    it('should report disabled status correctly', async () => {
      const disabledConfig: CacheConfig = {
        ...config,
        enabled: false,
      };
      const disabledCache = new CacheService(disabledConfig);
      
      expect(disabledCache.isEnabled()).toBe(false);
      
      await disabledCache.disconnect();
    });
  });

  describe('Logging', () => {
    it('should log statistics without errors', () => {
      expect(() => {
        cacheService.logStats();
      }).not.toThrow();
    });
  });
});
