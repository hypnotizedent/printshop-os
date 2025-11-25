import Redis from 'ioredis';
import { UnifiedProduct } from '../types/product';

export interface CacheConfig {
  productCatalogTTL: number; // 24 hours
  pricingTTL: number; // 1 hour
  inventoryTTL: number; // 15 minutes
}

export class CacheService {
  private redis: Redis;
  private config: CacheConfig;

  constructor(redisUrl: string, config?: Partial<CacheConfig>) {
    this.redis = new Redis(redisUrl);
    this.config = {
      productCatalogTTL: config?.productCatalogTTL || 86400, // 24h
      pricingTTL: config?.pricingTTL || 3600, // 1h
      inventoryTTL: config?.inventoryTTL || 900, // 15min
    };
  }

  /**
   * Get product from cache
   */
  async getProduct(sku: string): Promise<UnifiedProduct | null> {
    const key = `product:${sku}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Set product in cache
   */
  async setProduct(product: UnifiedProduct): Promise<void> {
    const key = `product:${product.sku}`;
    await this.redis.setex(
      key,
      this.config.productCatalogTTL,
      JSON.stringify(product)
    );
  }

  /**
   * Get multiple products from cache
   */
  async getProducts(skus: string[]): Promise<Map<string, UnifiedProduct>> {
    const keys = skus.map((sku) => `product:${sku}`);
    const values = await this.redis.mget(...keys);

    const result = new Map<string, UnifiedProduct>();
    values.forEach((value, index) => {
      if (value) {
        const product = JSON.parse(value);
        result.set(skus[index], product);
      }
    });

    return result;
  }

  /**
   * Set multiple products in cache
   */
  async setProducts(products: UnifiedProduct[]): Promise<void> {
    const pipeline = this.redis.pipeline();

    products.forEach((product) => {
      const key = `product:${product.sku}`;
      pipeline.setex(
        key,
        this.config.productCatalogTTL,
        JSON.stringify(product)
      );
    });

    await pipeline.exec();
  }

  /**
   * Update product pricing (shorter TTL)
   */
  async updatePricing(sku: string, pricing: any): Promise<void> {
    const key = `pricing:${sku}`;
    await this.redis.setex(
      key,
      this.config.pricingTTL,
      JSON.stringify(pricing)
    );
  }

  /**
   * Update product inventory (shortest TTL)
   */
  async updateInventory(sku: string, inventory: any): Promise<void> {
    const key = `inventory:${sku}`;
    await this.redis.setex(
      key,
      this.config.inventoryTTL,
      JSON.stringify(inventory)
    );
  }

  /**
   * Get inventory from cache
   */
  async getInventory(sku: string): Promise<any | null> {
    const key = `inventory:${sku}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Invalidate product cache
   */
  async invalidateProduct(sku: string): Promise<void> {
    await this.redis.del(`product:${sku}`);
  }

  /**
   * Invalidate all products from a supplier
   */
  async invalidateSupplier(supplier: string): Promise<void> {
    const pattern = `product:*`;
    const keys = await this.redis.keys(pattern);

    // Filter keys by supplier (stored in product data)
    const pipeline = this.redis.pipeline();
    for (const key of keys) {
      const product = await this.redis.get(key);
      if (product) {
        const parsed = JSON.parse(product);
        if (parsed.supplier === supplier) {
          pipeline.del(key);
        }
      }
    }

    await pipeline.exec();
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    productKeys: number;
    pricingKeys: number;
    inventoryKeys: number;
  }> {
    const allKeys = await this.redis.keys('*');
    const productKeys = allKeys.filter((k) => k.startsWith('product:'));
    const pricingKeys = allKeys.filter((k) => k.startsWith('pricing:'));
    const inventoryKeys = allKeys.filter((k) => k.startsWith('inventory:'));

    return {
      totalKeys: allKeys.length,
      productKeys: productKeys.length,
      pricingKeys: pricingKeys.length,
      inventoryKeys: inventoryKeys.length,
    };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}
