#!/usr/bin/env npx ts-node
/**
 * Curated Products Management CLI
 * 
 * Commands:
 *   sync-curated   - Sync top products from suppliers to Strapi
 *   list-top       - List top products by usage/priority
 *   set-curated    - Mark products as curated
 *   import-popular - Import popular styles from supplier catalogs
 * 
 * Usage:
 *   npx ts-node src/cli/curate-products.ts sync-curated --supplier ascolour --limit 100
 *   npx ts-node src/cli/curate-products.ts list-top --limit 50
 *   npx ts-node src/cli/curate-products.ts set-curated --sku AC-5001 --priority 100
 */

import 'dotenv/config';
import axios, { AxiosInstance } from 'axios';
import { ASColourClient } from '../clients/as-colour.client';
import { SSActivewearClient } from '../clients/ss-activewear.client';
import { ASColourTransformer } from '../transformers/as-colour.transformer';
import { SSActivewearTransformer } from '../transformers/ss-activewear.transformer';
import { UnifiedProduct, SupplierName } from '../types/product';
import { logger } from '../utils/logger';

interface CuratedProduct {
  sku: string;
  name: string;
  brand: string;
  category: string;
  supplier: string;
  description: string;
  basePrice: number;
  colors: string[];
  sizes: string[];
  images: string[];
  supplierProductId: string;
  isCurated: boolean;
  priority: number;
  usageCount: number;
  specifications?: any;
  priceBreaks?: any[];
  tags?: string[];
}

// Popular styles that print shops commonly use
const POPULAR_STYLES = {
  'ascolour': [
    '5001', '5002', '5051', '5026', '5080', // Tees
    '5101', '5102', '5120', // Hoodies & Crews
    '5003', '5004', // Tanks
    '1105', '1118', // Headwear
  ],
  'ssactivewear': [
    'G500', 'G200', 'G800', // Gildan basics
    'BC3001', 'BC3413', 'BC3480', // Bella+Canvas
    'NL3600', 'NL6010', // Next Level
    'CC1717', 'CC1969', // Comfort Colors
    'PC54', 'PC61', // Port & Company
  ],
  'sanmar': [
    'G500', 'G640', 'G800', // Gildan via SanMar
    'PC54', 'PC61', 'PC78', // Port & Company
    'K110P', 'K500', // Port Authority polos
    'DT6000', 'DT104', // District
    'LPC54', 'LST350', // Women's styles
  ]
};

class CurateProductsCLI {
  private strapiClient: AxiosInstance;
  private asColourClient: ASColourClient | null = null;
  private ssActivewearClient: SSActivewearClient | null = null;
  private asColourTransformer: ASColourTransformer;

  constructor() {
    const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    const strapiToken = process.env.STRAPI_API_TOKEN;

    this.strapiClient = axios.create({
      baseURL: strapiUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(strapiToken && { 'Authorization': `Bearer ${strapiToken}` })
      },
      timeout: 30000
    });

    this.asColourTransformer = new ASColourTransformer();

    // Initialize supplier clients
    if (process.env.ASCOLOUR_API_KEY || process.env.ASCOLOUR_SUBSCRIPTION_KEY) {
      this.asColourClient = new ASColourClient({
        apiKey: process.env.ASCOLOUR_API_KEY || process.env.ASCOLOUR_SUBSCRIPTION_KEY || ''
      });
    }

    if (process.env.SS_ACTIVEWEAR_API_KEY && process.env.SS_ACTIVEWEAR_ACCOUNT_NUMBER) {
      this.ssActivewearClient = new SSActivewearClient({
        apiKey: process.env.SS_ACTIVEWEAR_API_KEY,
        accountNumber: process.env.SS_ACTIVEWEAR_ACCOUNT_NUMBER
      });
    }
  }

  async run(): Promise<void> {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
      this.showHelp();
      return;
    }

    const options = this.parseArgs(args.slice(1));

    switch (command) {
      case 'sync-curated':
        await this.syncCurated(options);
        break;
      case 'list-top':
        await this.listTop(options);
        break;
      case 'set-curated':
        await this.setCurated(options);
        break;
      case 'import-popular':
        await this.importPopular(options);
        break;
      case 'help':
        this.showHelp();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        this.showHelp();
        process.exit(1);
    }
  }

  private parseArgs(args: string[]): Record<string, string | boolean> {
    const options: Record<string, string | boolean> = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const value = args[i + 1];
        
        if (value && !value.startsWith('--')) {
          options[key] = value;
          i++;
        } else {
          options[key] = true;
        }
      }
    }
    
    return options;
  }

  /**
   * Sync curated products from supplier to Strapi
   */
  async syncCurated(options: Record<string, string | boolean>): Promise<void> {
    const supplier = (options.supplier as string)?.toLowerCase() || 'ascolour';
    const limit = parseInt(options.limit as string) || 100;
    const dryRun = options['dry-run'] === true;

    console.log(`\n📦 Syncing curated products from ${supplier}`);
    console.log(`   Limit: ${limit}, Dry run: ${dryRun}\n`);

    let products: UnifiedProduct[] = [];

    switch (supplier) {
      case 'ascolour':
        products = await this.fetchASColourProducts(limit);
        break;
      case 'ssactivewear':
        products = await this.fetchSSProducts(limit);
        break;
      default:
        console.error(`Supplier ${supplier} not supported yet`);
        return;
    }

    console.log(`✓ Fetched ${products.length} products from ${supplier}`);

    if (dryRun) {
      console.log('\n[DRY RUN] Would sync the following products:\n');
      for (const p of products.slice(0, 10)) {
        console.log(`  - ${p.sku}: ${p.name} ($${p.pricing.basePrice})`);
      }
      if (products.length > 10) {
        console.log(`  ... and ${products.length - 10} more`);
      }
      return;
    }

    // Sync to Strapi
    let synced = 0;
    let errors = 0;

    for (const product of products) {
      try {
        await this.upsertProduct(product, true);
        synced++;
        process.stdout.write(`\rSynced: ${synced}/${products.length}`);
      } catch (error: any) {
        errors++;
        logger.error('Failed to sync product', { sku: product.sku, error: error.message });
      }
    }

    console.log(`\n\n✓ Synced ${synced} products, ${errors} errors`);
  }

  /**
   * List top products by usage/priority
   */
  async listTop(options: Record<string, string | boolean>): Promise<void> {
    const limit = parseInt(options.limit as string) || 50;
    const category = options.category as string;
    const supplier = options.supplier as string;

    console.log(`\n📊 Top ${limit} curated products:\n`);

    try {
      const params: any = {
        'pagination[limit]': limit,
        'sort': 'priority:desc,usageCount:desc',
        'filters[isCurated][$eq]': true
      };

      if (category) {
        params['filters[category][$eq]'] = category;
      }
      if (supplier) {
        params['filters[supplier][$eq]'] = supplier;
      }

      const response = await this.strapiClient.get('/api/products', { params });
      const products = response.data.data || [];

      if (products.length === 0) {
        console.log('No curated products found.');
        console.log('Run: npx ts-node src/cli/curate-products.ts import-popular');
        return;
      }

      console.log('Rank | SKU          | Name                           | Usage | Priority | Supplier');
      console.log('-----|--------------|--------------------------------|-------|----------|----------');
      
      products.forEach((p: any, i: number) => {
        const rank = String(i + 1).padStart(4);
        const sku = (p.sku || '').padEnd(12).slice(0, 12);
        const name = (p.name || '').padEnd(30).slice(0, 30);
        const usage = String(p.usageCount || 0).padStart(5);
        const priority = String(p.priority || 0).padStart(8);
        const supplier = (p.supplier || '').padEnd(10);
        
        console.log(`${rank} | ${sku} | ${name} | ${usage} | ${priority} | ${supplier}`);
      });

      console.log(`\nTotal: ${products.length} curated products`);
    } catch (error: any) {
      console.error('Failed to list products:', error.message);
    }
  }

  /**
   * Mark a product as curated with priority
   */
  async setCurated(options: Record<string, string | boolean>): Promise<void> {
    const sku = options.sku as string;
    const priority = parseInt(options.priority as string) || 50;
    const uncurate = options.uncurate === true;

    if (!sku) {
      console.error('Error: --sku is required');
      return;
    }

    console.log(`\n📌 Setting curation for ${sku}`);
    console.log(`   Priority: ${priority}, Curated: ${!uncurate}\n`);

    try {
      // Find product
      const response = await this.strapiClient.get('/api/products', {
        params: { 'filters[sku][$eq]': sku }
      });

      if (response.data.data?.length === 0) {
        console.error(`Product ${sku} not found in Strapi`);
        return;
      }

      const product = response.data.data[0];
      
      // Update
      await this.strapiClient.put(`/api/products/${product.documentId}`, {
        data: {
          isCurated: !uncurate,
          priority: uncurate ? 0 : priority
        }
      });

      console.log(`✓ Updated ${sku}: isCurated=${!uncurate}, priority=${priority}`);
    } catch (error: any) {
      console.error('Failed to update product:', error.message);
    }
  }

  /**
   * Import popular styles from supplier catalogs
   */
  async importPopular(options: Record<string, string | boolean>): Promise<void> {
    const supplier = (options.supplier as string)?.toLowerCase();
    const dryRun = options['dry-run'] === true;

    const suppliers = supplier 
      ? [supplier] 
      : ['ascolour', 'ssactivewear'];

    console.log(`\n🌟 Importing popular styles from: ${suppliers.join(', ')}`);
    console.log(`   Dry run: ${dryRun}\n`);

    for (const sup of suppliers) {
      const styles = POPULAR_STYLES[sup as keyof typeof POPULAR_STYLES] || [];
      
      if (styles.length === 0) {
        console.log(`No popular styles defined for ${sup}`);
        continue;
      }

      console.log(`\n📦 ${sup}: ${styles.length} popular styles`);

      for (const styleCode of styles) {
        try {
          let product: UnifiedProduct | null = null;

          if (sup === 'ascolour' && this.asColourClient) {
            const raw = await this.asColourClient.getProduct(styleCode);
            if (raw) {
              product = this.asColourTransformer.transformProduct(raw);
            }
          } else if (sup === 'ssactivewear' && this.ssActivewearClient) {
            const raw = await this.ssActivewearClient.getProduct(styleCode);
            if (raw) {
              product = SSActivewearTransformer.transformProduct(raw);
            }
          }

          if (product) {
            if (dryRun) {
              console.log(`  ✓ [DRY] ${product.sku}: ${product.name}`);
            } else {
              await this.upsertProduct(product, true, 75); // High priority for popular items
              console.log(`  ✓ Imported ${product.sku}: ${product.name}`);
            }
          } else {
            console.log(`  ✗ ${styleCode}: Not found`);
          }
        } catch (error: any) {
          console.log(`  ✗ ${styleCode}: ${error.message}`);
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log('\n✓ Import complete');
  }

  /**
   * Fetch products from AS Colour
   */
  private async fetchASColourProducts(limit: number): Promise<UnifiedProduct[]> {
    if (!this.asColourClient) {
      throw new Error('AS Colour client not configured');
    }

    const rawProducts = await this.asColourClient.getAllProducts();
    const products = this.asColourTransformer.transformProducts(rawProducts.slice(0, limit));
    return products;
  }

  /**
   * Fetch products from S&S Activewear
   */
  private async fetchSSProducts(limit: number): Promise<UnifiedProduct[]> {
    if (!this.ssActivewearClient) {
      throw new Error('S&S Activewear client not configured');
    }

    const result = await this.ssActivewearClient.getAllProducts({ perPage: limit });
    return result.products.map(p => SSActivewearTransformer.transformProduct(p));
  }

  /**
   * Upsert product to Strapi
   */
  private async upsertProduct(
    product: UnifiedProduct, 
    markCurated = false,
    priority = 50
  ): Promise<void> {
    const curatedProduct: CuratedProduct = {
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      category: product.category,
      supplier: this.mapSupplierToStrapi(product.supplier),
      description: product.description,
      basePrice: product.pricing.basePrice,
      colors: product.variants.map(v => v.color.name).filter((v, i, a) => a.indexOf(v) === i),
      sizes: product.variants.map(v => v.size).filter((v, i, a) => a.indexOf(v) === i),
      images: product.images,
      supplierProductId: product.metadata.supplierProductId,
      isCurated: markCurated,
      priority: markCurated ? priority : 0,
      usageCount: 0,
      specifications: product.specifications,
      priceBreaks: product.pricing.breaks
    };

    try {
      // Check if exists
      const response = await this.strapiClient.get('/api/products', {
        params: { 'filters[sku][$eq]': product.sku }
      });

      if (response.data.data?.length > 0) {
        // Update existing
        const existing = response.data.data[0];
        await this.strapiClient.put(`/api/products/${existing.documentId}`, {
          data: {
            ...curatedProduct,
            usageCount: existing.usageCount || 0, // Preserve usage count
            lastSyncedAt: new Date().toISOString()
          }
        });
      } else {
        // Create new
        await this.strapiClient.post('/api/products', {
          data: {
            ...curatedProduct,
            lastSyncedAt: new Date().toISOString()
          }
        });
      }
    } catch (error: any) {
      throw new Error(`Strapi upsert failed: ${error.message}`);
    }
  }

  private mapSupplierToStrapi(supplier: SupplierName): string {
    switch (supplier) {
      case SupplierName.AS_COLOUR: return 'ascolour';
      case SupplierName.SS_ACTIVEWEAR: return 'ssactivewear';
      case SupplierName.SANMAR: return 'sanmar';
      default: return 'sanmar';
    }
  }

  private showHelp(): void {
    console.log(`
Curated Products Management CLI

Commands:
  sync-curated     Sync products from supplier to Strapi as curated
  list-top         List top curated products by usage/priority
  set-curated      Mark/unmark a product as curated
  import-popular   Import popular/common styles from suppliers

Options:
  --supplier       Supplier name (ascolour, ssactivewear, sanmar)
  --limit          Number of products to process
  --sku            Product SKU for single product operations
  --priority       Priority value (0-100, higher = more prominent)
  --category       Filter by category
  --dry-run        Preview changes without applying them
  --uncurate       Remove curated status

Examples:
  # Import popular styles from AS Colour
  npx ts-node src/cli/curate-products.ts import-popular --supplier ascolour

  # Sync top 100 products from S&S
  npx ts-node src/cli/curate-products.ts sync-curated --supplier ssactivewear --limit 100

  # List top 50 curated products
  npx ts-node src/cli/curate-products.ts list-top --limit 50

  # Set product as high priority curated
  npx ts-node src/cli/curate-products.ts set-curated --sku AC-5001 --priority 100
`);
  }
}

// Run CLI
const cli = new CurateProductsCLI();
cli.run().catch(error => {
  console.error('CLI error:', error.message);
  process.exit(1);
});
