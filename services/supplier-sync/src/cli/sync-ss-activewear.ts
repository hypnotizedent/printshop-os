#!/usr/bin/env node

/**
 * S&S Activewear Sync CLI
 * 
 * Usage:
 *   npm run sync:ss                    # Full sync
 *   npm run sync:ss -- --category 1    # Sync by category ID
 *   npm run sync:ss -- --brand 5       # Sync by brand ID
 *   npm run sync:ss -- --dry-run       # Preview without saving
 *   npm run sync:ss -- --incremental   # Only sync updated products
 */

import * as dotenv from 'dotenv';
import { SSActivewearClient } from '../clients/ss-activewear.client';
import { SSActivewearTransformer } from '../transformers/ss-activewear.transformer';
import { CacheService } from '../services/cache.service';
import { logger } from '../utils/logger';

dotenv.config();

interface SyncOptions {
  categoryId?: number;
  brandId?: number;
  dryRun?: boolean;
  incremental?: boolean;
  since?: Date;
}

class SSActivewearSync {
  private client: SSActivewearClient;
  private cache: CacheService;

  constructor() {
    const apiKey = process.env.SS_ACTIVEWEAR_API_KEY;
    const accountNumber = process.env.SS_ACTIVEWEAR_ACCOUNT_NUMBER;

    if (!apiKey || !accountNumber) {
      throw new Error('Missing S&S Activewear credentials. Check .env file.');
    }

    this.client = new SSActivewearClient({
      apiKey,
      accountNumber,
      baseURL: process.env.SS_ACTIVEWEAR_BASE_URL,
    });

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.cache = new CacheService(redisUrl);
  }

  /**
   * Full catalog sync
   */
  async syncAll(options: SyncOptions = {}): Promise<void> {
    logger.info('Starting S&S Activewear full sync', options);

    try {
      // Health check
      const isHealthy = await this.client.healthCheck();
      if (!isHealthy) {
        throw new Error('S&S Activewear API health check failed');
      }

      let productsToSync = [];

      if (options.categoryId) {
        // Sync by category
        logger.info(`Fetching products for category ${options.categoryId}`);
        productsToSync = await this.client.getProductsByCategory(options.categoryId);
      } else if (options.brandId) {
        // Sync by brand
        logger.info(`Fetching products for brand ${options.brandId}`);
        productsToSync = await this.client.getProductsByBrand(options.brandId);
      } else if (options.incremental && options.since) {
        // Incremental sync (only updated products)
        logger.info(`Fetching products updated since ${options.since.toISOString()}`);
        productsToSync = await this.client.getUpdatedProducts(options.since);
      } else {
        // Full sync - paginated
        logger.info('Fetching all products (paginated)');
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          logger.info(`Fetching page ${page}...`);
          const result = await this.client.getAllProducts({ page, perPage: 100 });
          productsToSync.push(...result.products);
          hasMore = result.hasMore;
          page++;

          // Log progress
          if (hasMore) {
            logger.info(`Fetched ${productsToSync.length} products so far...`);
          }
        }
      }

      logger.info(`Fetched ${productsToSync.length} products from S&S Activewear`);

      if (productsToSync.length === 0) {
        logger.warn('No products to sync');
        return;
      }

      // Transform products
      logger.info('Transforming products to unified format...');
      const unifiedProducts = SSActivewearTransformer.transformProducts(productsToSync);

      if (options.dryRun) {
        // Dry run - just log results
        logger.info('DRY RUN - No data will be saved');
        logger.info(`Would sync ${unifiedProducts.length} products`);
        logger.info('Sample product:', unifiedProducts[0]);
        return;
      }

      // Cache products
      logger.info('Caching products in Redis...');
      let cached = 0;
      for (const product of unifiedProducts) {
        try {
          await this.cache.setProduct(product);
          cached++;

          if (cached % 100 === 0) {
            logger.info(`Cached ${cached}/${unifiedProducts.length} products`);
          }
        } catch (error) {
          logger.error(`Failed to cache product ${product.sku}:`, error);
        }
      }

      logger.info(`✓ Successfully synced ${cached} products`);

      // Print cache stats
      const stats = await this.cache.getStats();
      logger.info('Cache stats:', stats);

    } catch (error) {
      logger.error('Sync failed:', error);
      throw error;
    }
  }

  /**
   * List available categories
   */
  async listCategories(): Promise<void> {
    try {
      const categories = await this.client.getCategories();
      console.log('\nAvailable Categories:');
      console.log('====================');
      categories.forEach((cat) => {
        console.log(`  ${cat.categoryID}: ${cat.categoryName}`);
      });
    } catch (error) {
      logger.error('Failed to list categories:', error);
      throw error;
    }
  }

  /**
   * List available brands
   */
  async listBrands(): Promise<void> {
    try {
      const brands = await this.client.getBrands();
      console.log('\nAvailable Brands:');
      console.log('=================');
      brands.forEach((brand) => {
        console.log(`  ${brand.brandID}: ${brand.brandName}`);
      });
    } catch (error) {
      logger.error('Failed to list brands:', error);
      throw error;
    }
  }

  /**
   * Cleanup
   */
  async disconnect(): Promise<void> {
    await this.cache.disconnect();
  }
}

// Parse CLI arguments
function parseArgs(): { command: string; options: SyncOptions } {
  const args = process.argv.slice(2);
  
  const command = args.find((arg) => !arg.startsWith('--')) || 'sync';
  const options: SyncOptions = {
    dryRun: args.includes('--dry-run'),
    incremental: args.includes('--incremental'),
  };

  // Parse category
  const categoryIndex = args.indexOf('--category');
  if (categoryIndex !== -1 && args[categoryIndex + 1]) {
    options.categoryId = parseInt(args[categoryIndex + 1], 10);
  }

  // Parse brand
  const brandIndex = args.indexOf('--brand');
  if (brandIndex !== -1 && args[brandIndex + 1]) {
    options.brandId = parseInt(args[brandIndex + 1], 10);
  }

  // Parse since date
  const sinceIndex = args.indexOf('--since');
  if (sinceIndex !== -1 && args[sinceIndex + 1]) {
    options.since = new Date(args[sinceIndex + 1]);
  } else if (options.incremental) {
    // Default to 24 hours ago for incremental
    options.since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  return { command, options };
}

// Main execution
async function main() {
  const { command, options } = parseArgs();
  const sync = new SSActivewearSync();

  try {
    switch (command) {
      case 'categories':
        await sync.listCategories();
        break;
      
      case 'brands':
        await sync.listBrands();
        break;
      
      case 'sync':
      default:
        await sync.syncAll(options);
        break;
    }

    await sync.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('CLI error:', error);
    await sync.disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
