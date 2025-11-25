/**
 * Example usage of Redis caching layer with supplier connectors
 * 
 * This demonstrates how to use the cache layer to reduce API costs
 * and improve response times when fetching supplier data.
 */

import { createCacheService, getCacheService } from './cache';
import { createSanMarConnector } from './connectors/sanmar';
import { createASColourConnector } from './connectors/as-colour';
import { createSSActivewearConnector } from './connectors/ss-activewear';

/**
 * Example 1: Basic usage with automatic caching
 */
async function basicCachingExample() {
  console.log('\n=== Example 1: Basic Caching ===\n');
  
  // Create cache service (singleton)
  const cacheService = getCacheService();
  
  // Create connector with cache
  const sanmarConnector = createSanMarConnector(cacheService);
  
  console.log('First call - fetching from API (cache miss)...');
  const products1 = await sanmarConnector.fetchProducts();
  console.log(`Fetched ${products1.length} products`);
  
  console.log('\nSecond call - fetching from cache (cache hit)...');
  const products2 = await sanmarConnector.fetchProducts();
  console.log(`Fetched ${products2.length} products`);
  
  // Show cache statistics
  console.log('\nCache Statistics:');
  cacheService.logStats();
  
  await cacheService.disconnect();
}

/**
 * Example 2: Using all three suppliers with caching
 */
async function multipleSuppliersExample() {
  console.log('\n=== Example 2: Multiple Suppliers ===\n');
  
  const cacheService = getCacheService();
  
  // Create connectors for all three suppliers
  const sanmarConnector = createSanMarConnector(cacheService);
  const ascolourConnector = createASColourConnector(cacheService);
  const ssConnector = createSSActivewearConnector(cacheService);
  
  // Fetch products from all suppliers (first call - cache miss)
  console.log('Fetching from all suppliers...');
  const [sanmarProducts, ascolourProducts, ssProducts] = await Promise.all([
    sanmarConnector.fetchProducts(),
    ascolourConnector.fetchProducts(),
    ssConnector.fetchProducts(),
  ]);
  
  console.log(`SanMar: ${sanmarProducts.length} products`);
  console.log(`AS Colour: ${ascolourProducts.length} products`);
  console.log(`S&S Activewear: ${ssProducts.length} products`);
  
  // Second fetch - all from cache
  console.log('\nFetching again (from cache)...');
  const [sanmarProducts2, ascolourProducts2, ssProducts2] = await Promise.all([
    sanmarConnector.fetchProducts(),
    ascolourConnector.fetchProducts(),
    ssConnector.fetchProducts(),
  ]);
  
  console.log('All fetched from cache!');
  
  // Show statistics
  cacheService.logStats();
  
  await cacheService.disconnect();
}

/**
 * Example 3: Fetching individual products with caching
 */
async function individualProductExample() {
  console.log('\n=== Example 3: Individual Products ===\n');
  
  const cacheService = getCacheService();
  const sanmarConnector = createSanMarConnector(cacheService);
  
  // Fetch specific products
  console.log('Fetching product PC54 (cache miss)...');
  const product1 = await sanmarConnector.fetchProduct('PC54');
  console.log(`Product: ${product1?.name}`);
  
  console.log('\nFetching same product again (cache hit)...');
  const product2 = await sanmarConnector.fetchProduct('PC54');
  console.log(`Product: ${product2?.name}`);
  
  console.log('\nFetching different product (cache miss)...');
  const product3 = await sanmarConnector.fetchProduct('PC61');
  console.log(`Product: ${product3?.name}`);
  
  // Show statistics
  cacheService.logStats();
  
  await cacheService.disconnect();
}

/**
 * Example 4: Cache invalidation
 */
async function cacheInvalidationExample() {
  console.log('\n=== Example 4: Cache Invalidation ===\n');
  
  const cacheService = getCacheService();
  const sanmarConnector = createSanMarConnector(cacheService);
  
  // Fetch products to populate cache
  console.log('Fetching products...');
  await sanmarConnector.fetchProducts();
  
  console.log('\nFetching again (from cache)...');
  await sanmarConnector.fetchProducts();
  
  // Invalidate cache
  console.log('\nInvalidating cache...');
  await cacheService.deletePattern('supplier:products:list:sanmar:*');
  
  console.log('\nFetching after invalidation (cache miss)...');
  await sanmarConnector.fetchProducts();
  
  // Show statistics
  cacheService.logStats();
  
  await cacheService.disconnect();
}

/**
 * Example 5: Cost savings demonstration
 */
async function costSavingsExample() {
  console.log('\n=== Example 5: Cost Savings Simulation ===\n');
  
  const cacheService = getCacheService();
  const sanmarConnector = createSanMarConnector(cacheService);
  
  // Simulate 100 API calls (typical hourly volume)
  console.log('Simulating 100 requests...');
  
  // First request populates cache
  await sanmarConnector.fetchProducts();
  
  // Next 99 requests hit cache
  for (let i = 0; i < 99; i++) {
    await sanmarConnector.fetchProducts();
  }
  
  const stats = cacheService.getStats();
  
  console.log('\nResults:');
  console.log(`Total requests: ${stats.hits + stats.misses}`);
  console.log(`Cache hits: ${stats.hits}`);
  console.log(`Cache misses: ${stats.misses}`);
  console.log(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(2)}%`);
  console.log(`API calls saved: ${stats.hits}`);
  console.log(`Cost savings (hourly): $${stats.costSavings.toFixed(2)}`);
  console.log(`Projected monthly savings: $${(stats.costSavings * 24 * 30).toFixed(2)}`);
  
  await cacheService.disconnect();
}

/**
 * Example 6: Cache configuration
 */
async function customConfigExample() {
  console.log('\n=== Example 6: Custom Configuration ===\n');
  
  // Create cache service with custom config
  const customCache = createCacheService({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    enabled: true,
    ttl: {
      productLists: 1800,  // 30 minutes instead of default 1 hour
      prices: 900,         // 15 minutes instead of default 30 minutes
      inventory: 300,      // 5 minutes instead of default 15 minutes
      productDetails: 3600, // 1 hour instead of default 2 hours
    },
  });
  
  console.log('Cache configured with custom TTL values');
  console.log('- Product lists: 30 minutes');
  console.log('- Prices: 15 minutes');
  console.log('- Inventory: 5 minutes');
  console.log('- Product details: 1 hour');
  
  await customCache.disconnect();
}

/**
 * Example 7: Graceful fallback when Redis unavailable
 */
async function gracefulFallbackExample() {
  console.log('\n=== Example 7: Graceful Fallback ===\n');
  
  // Create cache with invalid connection (simulates Redis being down)
  const fallbackCache = createCacheService({
    host: 'invalid-host',
    port: 9999,
    enabled: true,
    ttl: {
      productLists: 3600,
      prices: 1800,
      inventory: 900,
      productDetails: 7200,
    },
  });
  
  const sanmarConnector = createSanMarConnector(fallbackCache);
  
  console.log('Attempting to fetch products with unavailable Redis...');
  console.log('The system will gracefully fall back to direct API calls.');
  
  try {
    const products = await sanmarConnector.fetchProducts();
    console.log(`Successfully fetched ${products.length} products (via API fallback)`);
  } catch (error) {
    console.error('Error:', error);
  }
  
  await fallbackCache.disconnect();
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await basicCachingExample();
    await multipleSuppliersExample();
    await individualProductExample();
    await cacheInvalidationExample();
    await costSavingsExample();
    await customConfigExample();
    await gracefulFallbackExample();
  } catch (error) {
    console.error('Example failed:', error);
    process.exit(1);
  }
}

// Export examples for use
export {
  basicCachingExample,
  multipleSuppliersExample,
  individualProductExample,
  cacheInvalidationExample,
  costSavingsExample,
  customConfigExample,
  gracefulFallbackExample,
  runAllExamples,
};

// Run examples if executed directly
if (require.main === module) {
  runAllExamples()
    .then(() => {
      console.log('\n✓ All examples completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Examples failed:', error);
      process.exit(1);
    });
}
