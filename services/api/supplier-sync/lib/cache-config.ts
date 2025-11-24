/**
 * Cache configuration and TTL strategies
 */

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  enabled?: boolean;
  ttl?: {
    productLists: number;
    prices: number;
    inventory: number;
    productDetails: number;
  };
  connectionTimeout?: number;
  maxRetriesPerRequest?: number;
}

/**
 * Default TTL strategies (in seconds)
 * - Product lists: 1 hour (3600s) - changes infrequently
 * - Pricing: 30 minutes (1800s) - may change during sales
 * - Inventory: 15 minutes (900s) - needs to be fresh
 * - Product details: 2 hours (7200s) - rarely changes
 */
export const DEFAULT_TTL = {
  productLists: 3600,      // 1 hour
  prices: 1800,            // 30 minutes
  inventory: 900,          // 15 minutes
  productDetails: 7200,    // 2 hours
} as const;

/**
 * Cache key prefixes for different data types
 */
export const CACHE_PREFIXES = {
  productList: 'supplier:products:list',
  productDetail: 'supplier:products:detail',
  price: 'supplier:prices',
  inventory: 'supplier:inventory',
} as const;

/**
 * Get cache configuration from environment variables
 */
export function getCacheConfig(): CacheConfig {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    enabled: process.env.REDIS_ENABLED !== 'false',
    ttl: {
      productLists: parseInt(process.env.CACHE_TTL_PRODUCT_LISTS || String(DEFAULT_TTL.productLists), 10),
      prices: parseInt(process.env.CACHE_TTL_PRICES || String(DEFAULT_TTL.prices), 10),
      inventory: parseInt(process.env.CACHE_TTL_INVENTORY || String(DEFAULT_TTL.inventory), 10),
      productDetails: parseInt(process.env.CACHE_TTL_PRODUCT_DETAILS || String(DEFAULT_TTL.productDetails), 10),
    },
    connectionTimeout: 5000,
    maxRetriesPerRequest: 1,
  };
}
