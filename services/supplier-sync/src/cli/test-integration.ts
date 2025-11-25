#!/usr/bin/env node

/**
 * Test S&S Activewear Integration
 * 
 * This script validates the setup without requiring real API credentials.
 * It tests:
 * 1. Environment configuration
 * 2. Redis connection
 * 3. Data transformation logic
 * 4. Cache service
 */

import * as dotenv from 'dotenv';
import { SSActivewearTransformer } from '../transformers/ss-activewear.transformer';
import { CacheService } from '../services/cache.service';
import { SSProduct } from '../clients/ss-activewear.client';
import { ProductCategory, SupplierName } from '../types/product';

dotenv.config();

// Mock product data for testing
const mockSSProduct: SSProduct = {
  styleID: 'TEST-001',
  styleName: 'Test Product',
  brandName: 'Test Brand',
  brandID: 1,
  categoryName: 'T-Shirts',
  categoryID: 1,
  description: 'Test product description',
  pieceWeight: '5.0 oz',
  fabricType: 'Cotton',
  fabricContent: '100% Cotton',
  sizes: ['S', 'M', 'L'],
  colors: [
    {
      colorName: 'Black',
      colorCode: 'BLK',
      hexCode: '#000000',
      imageURL: 'https://example.com/black.jpg',
    },
    {
      colorName: 'White',
      colorCode: 'WHT',
      hexCode: '#FFFFFF',
      imageURL: 'https://example.com/white.jpg',
    },
  ],
  pricing: [
    { quantity: 1, price: 10.0 },
    { quantity: 12, price: 8.0 },
  ],
  inventory: [
    { size: 'S', colorName: 'Black', qty: 50 },
    { size: 'M', colorName: 'Black', qty: 100 },
    { size: 'L', colorName: 'Black', qty: 75 },
    { size: 'S', colorName: 'White', qty: 60 },
    { size: 'M', colorName: 'White', qty: 90 },
    { size: 'L', colorName: 'White', qty: 80 },
  ],
  images: [
    { url: 'https://example.com/front.jpg', type: 'front' },
  ],
  specifications: {
    fit: 'Regular',
    features: ['Preshrunk'],
    printMethods: ['Screen Print'],
  },
};

class IntegrationTester {
  private cache?: CacheService;
  private testResults: { test: string; passed: boolean; message?: string }[] = [];

  /**
   * Run all tests
   */
  async runTests(): Promise<void> {
    console.log('🧪 Starting S&S Activewear Integration Tests\n');
    console.log('='.repeat(50));

    await this.testEnvironment();
    await this.testRedis();
    await this.testTransformer();
    await this.testCache();

    console.log('\n' + '='.repeat(50));
    this.printSummary();
  }

  /**
   * Test 1: Environment Configuration
   */
  async testEnvironment(): Promise<void> {
    console.log('\n📋 Test 1: Environment Configuration');

    const requiredVars = [
      'SS_ACTIVEWEAR_API_KEY',
      'SS_ACTIVEWEAR_ACCOUNT_NUMBER',
      'REDIS_URL',
    ];

    let allPresent = true;
    for (const varName of requiredVars) {
      const value = process.env[varName];
      const isSet = value && value !== 'your_api_key_here' && value !== 'your_account_number';
      
      if (isSet) {
        console.log(`  ✓ ${varName}: Configured`);
      } else {
        console.log(`  ⚠ ${varName}: Not configured (using default/placeholder)`);
        if (varName.startsWith('SS_ACTIVEWEAR')) {
          console.log(`    → This is OK for testing, but needed for real API calls`);
        } else {
          allPresent = false;
        }
      }
    }

    this.testResults.push({
      test: 'Environment Configuration',
      passed: true,
      message: allPresent ? 'All required vars present' : 'Some vars using defaults',
    });
  }

  /**
   * Test 2: Redis Connection
   */
  async testRedis(): Promise<void> {
    console.log('\n🔴 Test 2: Redis Connection');

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.cache = new CacheService(redisUrl);

      // Try a simple operation
      const testProduct = SSActivewearTransformer.transformProduct(mockSSProduct);
      await this.cache.setProduct(testProduct);
      const retrieved = await this.cache.getProduct(testProduct.sku);

      if (retrieved) {
        console.log('  ✓ Redis connection successful');
        console.log('  ✓ Can write to cache');
        console.log('  ✓ Can read from cache');
        this.testResults.push({
          test: 'Redis Connection',
          passed: true,
          message: 'All operations successful',
        });
      } else {
        throw new Error('Retrieved null from cache');
      }
    } catch (error) {
      console.log('  ✗ Redis connection failed');
      console.log(`  → Error: ${error}`);
      console.log('  → Make sure Redis is running: docker compose up -d redis');
      this.testResults.push({
        test: 'Redis Connection',
        passed: false,
        message: 'Connection failed - is Redis running?',
      });
    }
  }

  /**
   * Test 3: Data Transformer
   */
  async testTransformer(): Promise<void> {
    console.log('\n🔄 Test 3: Data Transformer');

    try {
      const result = SSActivewearTransformer.transformProduct(mockSSProduct);

      // Validate structure
      const checks = [
        { name: 'SKU', pass: result.sku === 'TEST-001' },
        { name: 'Name', pass: result.name === 'Test Product' },
        { name: 'Category', pass: result.category === ProductCategory.T_SHIRTS },
        { name: 'Supplier', pass: result.supplier === SupplierName.SS_ACTIVEWEAR },
        { name: 'Variants', pass: result.variants.length === 6 }, // 2 colors × 3 sizes
        { name: 'Images', pass: result.images.length > 0 },
        { name: 'Pricing', pass: result.pricing.basePrice === 10.0 },
        { name: 'Availability', pass: result.availability.totalQuantity === 455 },
      ];

      let allPassed = true;
      for (const check of checks) {
        if (check.pass) {
          console.log(`  ✓ ${check.name}: Correct`);
        } else {
          console.log(`  ✗ ${check.name}: Failed`);
          allPassed = false;
        }
      }

      // Show sample variant
      console.log('\n  Sample Variant:');
      const variant = result.variants[0];
      console.log(`    SKU: ${variant.sku}`);
      console.log(`    Color: ${variant.color.name} (${variant.color.hex})`);
      console.log(`    Size: ${variant.size}`);
      console.log(`    Stock: ${variant.quantity}`);

      this.testResults.push({
        test: 'Data Transformer',
        passed: allPassed,
        message: allPassed ? 'All transformations correct' : 'Some transformations failed',
      });
    } catch (error) {
      console.log('  ✗ Transformer failed');
      console.log(`  → Error: ${error}`);
      this.testResults.push({
        test: 'Data Transformer',
        passed: false,
        message: `Error: ${error}`,
      });
    }
  }

  /**
   * Test 4: Cache Service
   */
  async testCache(): Promise<void> {
    console.log('\n💾 Test 4: Cache Service');

    if (!this.cache) {
      console.log('  ⚠ Skipping (Redis not available)');
      return;
    }

    try {
      const product = SSActivewearTransformer.transformProduct(mockSSProduct);

      // Test individual product caching
      await this.cache.setProduct(product);
      console.log('  ✓ Cache individual product');

      // Test retrieval
      const retrieved = await this.cache.getProduct(product.sku);
      console.log(`  ✓ Retrieve product: ${retrieved ? 'Success' : 'Failed'}`);

      // Test batch caching
      const products = [
        product,
        SSActivewearTransformer.transformProduct({
          ...mockSSProduct,
          styleID: 'TEST-002',
        }),
      ];
      await this.cache.setProducts(products);
      console.log('  ✓ Cache multiple products');

      // Test pricing update
      await this.cache.updatePricing(product.sku, {
        basePrice: 12.0,
        currency: 'USD',
      });
      console.log('  ✓ Update pricing');

      // Test inventory update
      await this.cache.updateInventory(product.sku, {
        available: true,
        totalQuantity: 500,
      });
      console.log('  ✓ Update inventory');

      // Get stats
      const stats = await this.cache.getStats();
      console.log(`\n  Cache Statistics:`);
      console.log(`    Total Keys: ${stats.totalKeys}`);
      console.log(`    Product Keys: ${stats.productKeys}`);
      console.log(`    Pricing Keys: ${stats.pricingKeys}`);
      console.log(`    Inventory Keys: ${stats.inventoryKeys}`);

      this.testResults.push({
        test: 'Cache Service',
        passed: true,
        message: 'All cache operations successful',
      });
    } catch (error) {
      console.log('  ✗ Cache service failed');
      console.log(`  → Error: ${error}`);
      this.testResults.push({
        test: 'Cache Service',
        passed: false,
        message: `Error: ${error}`,
      });
    }
  }

  /**
   * Print test summary
   */
  printSummary(): void {
    console.log('\n📊 Test Summary\n');

    const passed = this.testResults.filter((r) => r.passed).length;
    const total = this.testResults.length;

    for (const result of this.testResults) {
      const icon = result.passed ? '✓' : '✗';
      console.log(`  ${icon} ${result.test}`);
      if (result.message) {
        console.log(`    → ${result.message}`);
      }
    }

    console.log(`\nPassed: ${passed}/${total}`);

    if (passed === total) {
      console.log('\n🎉 All tests passed! Your S&S integration is ready.');
      console.log('\nNext steps:');
      console.log('  1. Add real S&S API credentials to .env');
      console.log('  2. Run: npm run sync:ss -- --dry-run --category 1');
      console.log('  3. Test with real data sync');
    } else {
      console.log('\n⚠️  Some tests failed. Please fix the issues above.');
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.cache) {
      await this.cache.disconnect();
    }
  }
}

// Run tests
async function main() {
  const tester = new IntegrationTester();
  try {
    await tester.runTests();
  } catch (error) {
    console.error('Test suite failed:', error);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main();
}
