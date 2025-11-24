/**
 * Cache decorator for supplier connector methods
 */

import { CacheService } from './cache';

export interface CacheOptions {
  ttl: number;
  keyPrefix: string;
  enabled?: boolean;
}

/**
 * Generate cache key from method name and arguments
 */
function generateCacheKey(
  prefix: string,
  methodName: string,
  args: any[]
): string {
  const argKey = args.length > 0 ? `:${JSON.stringify(args)}` : '';
  return `${prefix}:${methodName}${argKey}`;
}

/**
 * Cache decorator factory
 * 
 * Usage:
 * @CacheDecorator({ ttl: 3600, keyPrefix: 'supplier:sanmar' })
 * async fetchProducts(): Promise<Product[]> { ... }
 */
export function CacheDecorator(options: CacheOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Check if caching is disabled or no cache service available
      if (options.enabled === false) {
        return originalMethod.apply(this, args);
      }

      // Get cache service from the instance
      const cacheService: CacheService | undefined = (this as any).cacheService;
      
      if (!cacheService || !cacheService.isEnabled()) {
        // No cache available, call original method
        const result = await originalMethod.apply(this, args);
        if (cacheService) {
          cacheService.incrementApiCalls();
        }
        return result;
      }

      // Generate cache key
      const cacheKey = generateCacheKey(
        options.keyPrefix,
        propertyKey,
        args
      );

      try {
        // Try to get from cache
        const cached = await cacheService.get(cacheKey);
        
        if (cached !== null) {
          // Cache hit - return cached data
          return cached;
        }

        // Cache miss - call original method
        cacheService.incrementApiCalls();
        const result = await originalMethod.apply(this, args);

        // Store in cache (don't wait for completion)
        cacheService.set(cacheKey, result, options.ttl).catch((error: Error) => {
          console.warn(`Failed to cache result for ${cacheKey}:`, error);
        });

        return result;
      } catch (error) {
        // If cache fails, fallback to original method
        console.warn(`Cache decorator failed for ${propertyKey}, using direct call:`, error);
        const result = await originalMethod.apply(this, args);
        if (cacheService) {
          cacheService.incrementApiCalls();
        }
        return result;
      }
    };

    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 * Invalidates cache entries matching a pattern after method execution
 * 
 * Usage:
 * @InvalidateCache({ pattern: 'supplier:sanmar:fetchProducts*' })
 * async updateProduct(id: string): Promise<void> { ... }
 */
export function InvalidateCache(options: { pattern: string }) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Invalidate cache
      const cacheService: CacheService | undefined = (this as any).cacheService;
      
      if (cacheService && cacheService.isEnabled()) {
        try {
          const deletedCount = await cacheService.deletePattern(options.pattern);
          if (deletedCount > 0) {
            console.info(`Invalidated ${deletedCount} cache entries matching ${options.pattern}`);
          }
        } catch (error) {
          console.warn(`Failed to invalidate cache for pattern ${options.pattern}:`, error);
        }
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Utility function to wrap a connector with cache service
 */
export function withCache<T extends object>(
  connector: T,
  cacheService: CacheService
): T {
  (connector as any).cacheService = cacheService;
  return connector;
}
