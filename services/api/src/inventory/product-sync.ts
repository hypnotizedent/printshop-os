/**
 * Product Sync Service
 *
 * TypeScript service for syncing top products to Strapi.
 * Works with the inventory module to provide product lookups.
 *
 * Two-Tier Architecture:
 * - Tier 1: Top Products in Strapi (~500-1000 SKUs)
 * - Tier 2: Full Catalog via supplier APIs (500K+ products)
 */

import axios, { AxiosInstance } from 'axios';

export interface TopProduct {
  styleNumber: string;
  styleName: string;
  orderCount: number;
  totalQuantity: number;
  lastUsed: string | null;
  categories: string[];
  sampleColors: string[];
  score: number;
}

export interface StrapiProduct {
  id?: number;
  documentId?: string;
  sku: string;
  name: string;
  brand: string;
  description?: string;
  category: string;
  supplier: 'sanmar' | 'ascolour' | 'ssactivewear';
  basePrice?: number;
  colors?: string[];
  sizes?: string[];
  images?: string[];
  supplierProductId?: string;
  lastSyncedAt?: string;
  isActive?: boolean;
  isFavorite?: boolean;
  isCurated?: boolean;
  usageCount?: number;
  priority?: number;
  isTopProduct?: boolean;
  orderCount?: number;
  totalUnitsOrdered?: number;
  lastOrderedAt?: string;
  topProductScore?: number;
  tags?: string[];
  specifications?: Record<string, unknown>;
  priceBreaks?: Array<{ quantity: number; price: number }>;
}

export interface ProductSyncConfig {
  strapiUrl: string;
  strapiToken?: string;
}

/**
 * Brand detection patterns for style names
 */
const BRAND_PATTERNS = [
  { pattern: /next level/i, brand: 'Next Level Apparel' },
  { pattern: /gildan/i, brand: 'Gildan' },
  { pattern: /bella\+?canvas/i, brand: 'Bella+Canvas' },
  { pattern: /comfort colors/i, brand: 'Comfort Colors' },
  { pattern: /port\s*[&and]*\s*company/i, brand: 'Port & Company' },
  { pattern: /district/i, brand: 'District' },
  { pattern: /jerzees/i, brand: 'JERZEES' },
  { pattern: /hanes/i, brand: 'Hanes' },
  { pattern: /champion/i, brand: 'Champion' },
  { pattern: /american apparel/i, brand: 'American Apparel' },
  { pattern: /as\s*colour/i, brand: 'AS Colour' },
  { pattern: /independent trading/i, brand: 'Independent Trading Co.' },
  { pattern: /los angeles apparel/i, brand: 'Los Angeles Apparel' },
  { pattern: /lane seven/i, brand: 'Lane Seven' },
];

/**
 * Supplier detection from SKU patterns
 */
function detectSupplierFromSku(sku: string): 'sanmar' | 'ascolour' | 'ssactivewear' {
  const upperSku = sku.toUpperCase();

  // AS Colour: 4-5 digit style codes
  if (/^\d{4,5}$/.test(upperSku)) {
    return 'ascolour';
  }

  // Common S&S patterns
  const ssPatterns = ['G', 'BC', 'NL', 'CC', 'B', 'IND', 'AL'];
  for (const prefix of ssPatterns) {
    if (upperSku.startsWith(prefix) && upperSku.length > prefix.length) {
      return 'ssactivewear';
    }
  }

  // SanMar: alpha + numeric patterns
  if (/^[A-Z]{2,4}\d+[A-Z]?$/.test(upperSku)) {
    return 'sanmar';
  }

  // Default
  return 'sanmar';
}

/**
 * Extract brand from style name
 */
function extractBrand(styleName: string): string {
  for (const { pattern, brand } of BRAND_PATTERNS) {
    if (pattern.test(styleName)) {
      return brand;
    }
  }

  // Try to extract from "Brand - Product" format
  const parts = styleName.split(' - ');
  if (parts.length > 1) {
    return parts[0].trim();
  }

  return 'Unknown';
}

/**
 * Product Sync Service
 */
export class ProductSyncService {
  private strapiClient: AxiosInstance;

  constructor(config: ProductSyncConfig) {
    this.strapiClient = axios.create({
      baseURL: config.strapiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.strapiToken && { Authorization: `Bearer ${config.strapiToken}` }),
      },
    });
  }

  /**
   * Check if Strapi is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.strapiClient.get('/_health');
      return response.status === 204;
    } catch {
      try {
        const response = await this.strapiClient.get('/api/products?pagination[limit]=1');
        return response.status === 200;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get product by SKU
   */
  async getProduct(sku: string): Promise<StrapiProduct | null> {
    try {
      const response = await this.strapiClient.get('/api/products', {
        params: { 'filters[sku][$eq]': sku },
      });

      const products = response.data.data || [];
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error(`Failed to get product ${sku}:`, error);
      return null;
    }
  }

  /**
   * Get top products from Strapi
   */
  async getTopProducts(limit = 500): Promise<StrapiProduct[]> {
    try {
      const response = await this.strapiClient.get('/api/products', {
        params: {
          'filters[isTopProduct][$eq]': 'true',
          'sort': 'topProductScore:desc',
          'pagination[limit]': limit,
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get top products:', error);
      return [];
    }
  }

  /**
   * Create or update a product in Strapi
   */
  async upsertProduct(product: StrapiProduct): Promise<boolean> {
    try {
      const existing = await this.getProduct(product.sku);

      if (existing) {
        // Preserve usage count from existing
        product.usageCount = existing.usageCount || 0;

        await this.strapiClient.put(`/api/products/${existing.documentId}`, {
          data: product,
        });
      } else {
        await this.strapiClient.post('/api/products', {
          data: product,
        });
      }

      return true;
    } catch (error) {
      console.error(`Failed to upsert product ${product.sku}:`, error);
      return false;
    }
  }

  /**
   * Sync a top product to Strapi
   */
  async syncTopProduct(topProduct: TopProduct): Promise<boolean> {
    const cleanName = topProduct.styleName.replace(/[\r\n]+/g, ' ').trim();

    const product: StrapiProduct = {
      sku: topProduct.styleNumber,
      name: cleanName,
      brand: extractBrand(cleanName),
      description: '',
      category: 'other',
      supplier: detectSupplierFromSku(topProduct.styleNumber),
      isTopProduct: true,
      isCurated: true,
      orderCount: topProduct.orderCount,
      totalUnitsOrdered: topProduct.totalQuantity,
      topProductScore: topProduct.score,
      lastOrderedAt: topProduct.lastUsed || undefined,
      priority: Math.min(100, Math.round(topProduct.score)),
      colors: topProduct.sampleColors,
      tags: topProduct.categories,
      lastSyncedAt: new Date().toISOString(),
    };

    return this.upsertProduct(product);
  }

  /**
   * Batch sync top products
   */
  async syncTopProducts(
    products: TopProduct[],
    options: { onProgress?: (synced: number, total: number) => void } = {}
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    for (let i = 0; i < products.length; i++) {
      try {
        const success = await this.syncTopProduct(products[i]);
        if (success) {
          synced++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }

      if (options.onProgress) {
        options.onProgress(i + 1, products.length);
      }
    }

    return { synced, errors };
  }

  /**
   * Mark product as top product with score
   */
  async markAsTopProduct(
    sku: string,
    orderCount: number,
    totalUnits: number,
    score: number,
    lastOrdered?: string
  ): Promise<boolean> {
    try {
      const existing = await this.getProduct(sku);

      if (!existing) {
        console.warn(`Product ${sku} not found in Strapi`);
        return false;
      }

      await this.strapiClient.put(`/api/products/${existing.documentId}`, {
        data: {
          isTopProduct: true,
          isCurated: true,
          orderCount,
          totalUnitsOrdered: totalUnits,
          topProductScore: score,
          lastOrderedAt: lastOrdered,
          priority: Math.min(100, Math.round(score)),
        },
      });

      return true;
    } catch (error) {
      console.error(`Failed to mark ${sku} as top product:`, error);
      return false;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<{
    total: number;
    topProducts: number;
    curated: number;
    bySupplier: Record<string, number>;
  }> {
    try {
      // Total products
      const totalRes = await this.strapiClient.get('/api/products', {
        params: { 'pagination[limit]': 1, 'pagination[withCount]': 'true' },
      });
      const total = totalRes.data.meta?.pagination?.total || 0;

      // Top products
      const topRes = await this.strapiClient.get('/api/products', {
        params: {
          'filters[isTopProduct][$eq]': 'true',
          'pagination[limit]': 1,
          'pagination[withCount]': 'true',
        },
      });
      const topProducts = topRes.data.meta?.pagination?.total || 0;

      // Curated products
      const curatedRes = await this.strapiClient.get('/api/products', {
        params: {
          'filters[isCurated][$eq]': 'true',
          'pagination[limit]': 1,
          'pagination[withCount]': 'true',
        },
      });
      const curated = curatedRes.data.meta?.pagination?.total || 0;

      // By supplier
      const bySupplier: Record<string, number> = {};
      for (const supplier of ['sanmar', 'ascolour', 'ssactivewear']) {
        const res = await this.strapiClient.get('/api/products', {
          params: {
            'filters[supplier][$eq]': supplier,
            'pagination[limit]': 1,
            'pagination[withCount]': 'true',
          },
        });
        bySupplier[supplier] = res.data.meta?.pagination?.total || 0;
      }

      return { total, topProducts, curated, bySupplier };
    } catch (error) {
      console.error('Failed to get product stats:', error);
      return { total: 0, topProducts: 0, curated: 0, bySupplier: {} };
    }
  }
}

/**
 * Factory function to create ProductSyncService with environment config
 */
export function createProductSyncService(): ProductSyncService {
  return new ProductSyncService({
    strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
    strapiToken: process.env.STRAPI_API_TOKEN,
  });
}

export default ProductSyncService;
