/**
 * Product Query Service
 * Unified interface for querying products across:
 * 1. Curated products in Strapi (top 500)
 * 2. Live supplier APIs (on-demand for full catalog)
 * 
 * Use cases:
 * - "What colors are available for style 5001?"
 * - "Check stock for Gildan G500 in Black, size L"
 * - "Get price for 100 units of PC54"
 */

import axios, { AxiosInstance } from 'axios';
import { CacheService } from './cache.service';
import { UnifiedProduct, ProductCategory, SupplierName } from '../types/product';
import { ASColourClient } from '../clients/as-colour.client';
import { SSActivewearClient } from '../clients/ss-activewear.client';
import { SanMarClient } from '../clients/sanmar.client';
import { ASColourTransformer } from '../transformers/as-colour.transformer';
import { SSActivewearTransformer } from '../transformers/ss-activewear.transformer';
import { logger } from '../utils/logger';

export interface ProductQueryConfig {
  strapiUrl?: string;
  strapiApiToken?: string;
  redisUrl?: string;
  asColourApiKey?: string;
  asColourEmail?: string;
  asColourPassword?: string;
  ssActivewearApiKey?: string;
  ssActivewearAccountNumber?: string;
  sanmarApiKey?: string;
  sanmarAccountNumber?: string;
}

export interface ProductSearchResult {
  sku: string;
  name: string;
  brand: string;
  supplier: string;
  category: string;
  basePrice: number;
  isCurated: boolean;
  imageUrl?: string;
}

export interface StockCheckResult {
  sku: string;
  supplier: string;
  available: boolean;
  totalQty: number;
  inventory: Array<{
    size: string;
    color: string;
    qty: number;
    warehouse?: string;
  }>;
  lastChecked: string;
  cached: boolean;
}

export interface ColorAvailability {
  color: string;
  colorCode?: string;
  hex?: string;
  inStock: boolean;
  sizes: string[];
}

export interface PriceBreakResult {
  sku: string;
  supplier: string;
  basePrice: number;
  currency: string;
  priceBreaks: Array<{
    minQty: number;
    maxQty?: number;
    price: number;
    casePrice?: number;
  }>;
  priceForQuantity?: number;
}

// Configuration constants
const MAX_VARIANTS_PER_QUERY = 100; // Limit variants to avoid excessive API calls

export class ProductQueryService {
  private strapiClient: AxiosInstance | null = null;
  private cacheService: CacheService | null = null;
  private asColourClient: ASColourClient | null = null;
  private ssActivewearClient: SSActivewearClient | null = null;
  private sanmarClient: SanMarClient | null = null;
  private asColourTransformer: ASColourTransformer;
  private ssActivewearTransformer: typeof SSActivewearTransformer;

  constructor(private config: ProductQueryConfig) {
    this.asColourTransformer = new ASColourTransformer();
    this.ssActivewearTransformer = SSActivewearTransformer;
    this.initClients();
  }

  private initClients(): void {
    // Strapi client
    if (this.config.strapiUrl) {
      this.strapiClient = axios.create({
        baseURL: this.config.strapiUrl,
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.strapiApiToken && {
            'Authorization': `Bearer ${this.config.strapiApiToken}`
          })
        },
        timeout: 10000
      });
    }

    // Cache service
    if (this.config.redisUrl) {
      this.cacheService = new CacheService(this.config.redisUrl);
    }

    // AS Colour client
    if (this.config.asColourApiKey) {
      this.asColourClient = new ASColourClient({
        apiKey: this.config.asColourApiKey,
      });
    }

    // S&S Activewear client
    if (this.config.ssActivewearApiKey && this.config.ssActivewearAccountNumber) {
      this.ssActivewearClient = new SSActivewearClient({
        apiKey: this.config.ssActivewearApiKey,
        accountNumber: this.config.ssActivewearAccountNumber,
      });
    }

    // SanMar client
    if (this.config.sanmarApiKey && this.config.sanmarAccountNumber) {
      this.sanmarClient = new SanMarClient({
        apiKey: this.config.sanmarApiKey,
        accountNumber: this.config.sanmarAccountNumber,
      });
    }
  }

  /**
   * Detect supplier from SKU prefix
   */
  private detectSupplier(sku: string): SupplierName {
    const upperSku = sku.toUpperCase();
    
    if (upperSku.startsWith('AC-') || /^\d{4,5}$/.test(sku)) {
      return SupplierName.AS_COLOUR;
    }
    
    if (upperSku.startsWith('SS-')) {
      return SupplierName.SS_ACTIVEWEAR;
    }
    
    if (upperSku.startsWith('SM-') || /^[A-Z]{1,3}\d+[A-Z]?$/i.test(sku)) {
      return SupplierName.SANMAR;
    }
    
    // Default based on numeric patterns
    if (/^\d+$/.test(sku)) {
      return SupplierName.SS_ACTIVEWEAR;
    }
    
    return SupplierName.SANMAR;
  }

  /**
   * Search curated products in Strapi
   */
  async searchCuratedProducts(query: string, options?: {
    category?: string;
    supplier?: string;
    limit?: number;
    curatedOnly?: boolean;
  }): Promise<ProductSearchResult[]> {
    if (!this.strapiClient) {
      logger.warn('Strapi client not configured, returning empty results');
      return [];
    }

    try {
      const params: any = {
        'pagination[limit]': options?.limit || 50,
        'sort': 'priority:desc,usageCount:desc'
      };

      // Build filters
      const filters: string[] = [];
      
      if (query) {
        filters.push(`filters[$or][0][name][$containsi]=${encodeURIComponent(query)}`);
        filters.push(`filters[$or][1][sku][$containsi]=${encodeURIComponent(query)}`);
        filters.push(`filters[$or][2][brand][$containsi]=${encodeURIComponent(query)}`);
      }

      if (options?.category) {
        params['filters[category][$eq]'] = options.category;
      }

      if (options?.supplier) {
        params['filters[supplier][$eq]'] = options.supplier;
      }

      if (options?.curatedOnly) {
        params['filters[isCurated][$eq]'] = true;
      }

      const filterStr = filters.length > 0 ? `?${filters.join('&')}` : '';
      const response = await this.strapiClient.get(`/api/products${filterStr}`, { params });
      
      const products = response.data.data || [];
      
      return products.map((p: any) => ({
        sku: p.sku,
        name: p.name,
        brand: p.brand || 'Unknown',
        supplier: p.supplier,
        category: p.category || 'other',
        basePrice: parseFloat(p.basePrice) || 0,
        isCurated: p.isCurated || false,
        imageUrl: p.images?.[0] || null
      }));
    } catch (error: any) {
      logger.error('Failed to search curated products', { error: error.message });
      return [];
    }
  }

  /**
   * Get product details from curated catalog or live API
   */
  async getProduct(sku: string): Promise<UnifiedProduct | null> {
    // Try cache first
    if (this.cacheService) {
      const cached = await this.cacheService.getProduct(sku);
      if (cached) {
        logger.debug('Product found in cache', { sku });
        return cached;
      }
    }

    // Try Strapi curated catalog
    if (this.strapiClient) {
      try {
        const response = await this.strapiClient.get(`/api/products`, {
          params: {
            'filters[sku][$eq]': sku
          }
        });
        
        if (response.data.data?.length > 0) {
          const p = response.data.data[0];
          const product: UnifiedProduct = {
            sku: p.sku,
            name: p.name,
            brand: p.brand || 'Unknown',
            description: p.description || '',
            category: p.category as ProductCategory || ProductCategory.OTHER,
            supplier: this.mapSupplier(p.supplier),
            variants: [],
            images: p.images || [],
            pricing: {
              basePrice: parseFloat(p.basePrice) || 0,
              currency: 'USD',
              breaks: p.priceBreaks || []
            },
            specifications: p.specifications,
            availability: {
              inStock: true,
              totalQuantity: 0
            },
            metadata: {
              supplierProductId: p.supplierProductId || p.sku,
              lastUpdated: new Date(p.lastSyncedAt || p.updatedAt)
            }
          };
          
          // Cache the product
          if (this.cacheService) {
            await this.cacheService.setProduct(product);
          }
          
          return product;
        }
      } catch (error: any) {
        logger.debug('Product not found in Strapi', { sku, error: error.message });
      }
    }

    // Fall back to live API query
    return this.getProductFromSupplierAPI(sku);
  }

  /**
   * Fetch product directly from supplier API
   */
  private async getProductFromSupplierAPI(sku: string): Promise<UnifiedProduct | null> {
    const supplier = this.detectSupplier(sku);
    const styleCode = this.extractStyleCode(sku, supplier);

    try {
      switch (supplier) {
        case SupplierName.AS_COLOUR:
          if (!this.asColourClient) return null;
          const asProduct = await this.asColourClient.getProduct(styleCode);
          if (!asProduct) return null;
          return this.asColourTransformer.transformProduct(asProduct);

        case SupplierName.SS_ACTIVEWEAR:
          if (!this.ssActivewearClient) return null;
          const ssProduct = await this.ssActivewearClient.getProduct(styleCode);
          if (!ssProduct) return null;
          return this.ssActivewearTransformer.transformProduct(ssProduct);

        case SupplierName.SANMAR:
          if (!this.sanmarClient) return null;
          const smProduct = await this.sanmarClient.getProduct(styleCode);
          if (!smProduct) return null;
          // SanMar uses cached CSV data - product data should come from Strapi
          logger.warn('SanMar product not found in Strapi cache, live API query not supported', { sku });
          return null;

        default:
          return null;
      }
    } catch (error: any) {
      logger.error('Failed to fetch product from supplier API', { sku, supplier, error: error.message });
      return null;
    }
  }

  /**
   * Check stock availability for a product
   */
  async checkStock(sku: string, options?: {
    color?: string;
    size?: string;
  }): Promise<StockCheckResult | null> {
    const supplier = this.detectSupplier(sku);
    const styleCode = this.extractStyleCode(sku, supplier);
    const cacheKey = `stock:${supplier}:${styleCode}`;

    // Check cache first (short TTL for inventory)
    if (this.cacheService) {
      const cached = await this.cacheService.getInventory(styleCode);
      if (cached) {
        logger.debug('Stock check from cache', { sku });
        let inventory = cached.inventory || [];
        
        // Filter by color/size if specified
        if (options?.color) {
          inventory = inventory.filter((i: any) => 
            i.color.toLowerCase().includes(options.color!.toLowerCase())
          );
        }
        if (options?.size) {
          inventory = inventory.filter((i: any) => 
            i.size.toLowerCase() === options.size!.toLowerCase()
          );
        }

        return {
          sku,
          supplier,
          available: inventory.some((i: any) => i.qty > 0),
          totalQty: inventory.reduce((sum: number, i: any) => sum + i.qty, 0),
          inventory,
          lastChecked: cached.lastChecked || new Date().toISOString(),
          cached: true
        };
      }
    }

    // Query supplier API
    try {
      let inventory: Array<{ size: string; color: string; qty: number; warehouse?: string }> = [];

      switch (supplier) {
        case SupplierName.AS_COLOUR:
          if (this.asColourClient) {
            const variants = await this.asColourClient.listVariants(styleCode);
            for (const v of variants.slice(0, MAX_VARIANTS_PER_QUERY)) {
              try {
                const inv = await this.asColourClient.getVariantInventory(styleCode, v.sku);
                if (inv) {
                  const items = Array.isArray(inv) ? inv : [inv];
                  items.forEach((item: any) => {
                    inventory.push({
                      size: v.size || 'OS',
                      color: v.colour || 'Unknown',
                      qty: item.quantity || 0,
                      warehouse: item.location
                    });
                  });
                }
              } catch (variantError: any) {
                logger.debug('Failed to fetch variant inventory', { 
                  styleCode, 
                  variantSku: v.sku, 
                  error: variantError.message 
                });
              }
            }
          }
          break;

        case SupplierName.SS_ACTIVEWEAR:
          if (this.ssActivewearClient) {
            const ssInventory = await this.ssActivewearClient.getProductInventory(styleCode);
            inventory = (ssInventory || []).map((item: any) => ({
              size: item.size || 'OS',
              color: item.colorName || 'Unknown',
              qty: item.qty || 0,
              warehouse: item.warehouseLocation
            }));
          }
          break;

        case SupplierName.SANMAR:
          // SanMar uses cached CSV data
          break;
      }

      // Filter if options specified
      if (options?.color) {
        inventory = inventory.filter(i => 
          i.color.toLowerCase().includes(options.color!.toLowerCase())
        );
      }
      if (options?.size) {
        inventory = inventory.filter(i => 
          i.size.toLowerCase() === options.size!.toLowerCase()
        );
      }

      const result: StockCheckResult = {
        sku,
        supplier,
        available: inventory.some(i => i.qty > 0),
        totalQty: inventory.reduce((sum, i) => sum + i.qty, 0),
        inventory,
        lastChecked: new Date().toISOString(),
        cached: false
      };

      // Cache the result
      if (this.cacheService) {
        await this.cacheService.updateInventory(styleCode, inventory as any);
      }

      return result;
    } catch (error: any) {
      logger.error('Stock check failed', { sku, supplier, error: error.message });
      return null;
    }
  }

  /**
   * Get available colors for a product
   */
  async getColorsAvailable(sku: string): Promise<ColorAvailability[]> {
    const product = await this.getProduct(sku);
    if (!product) return [];

    const stockResult = await this.checkStock(sku);
    if (!stockResult) {
      // Return colors without stock info
      return product.variants.reduce((colors: ColorAvailability[], v) => {
        const existing = colors.find(c => c.color === v.color.name);
        if (existing) {
          if (!existing.sizes.includes(v.size)) {
            existing.sizes.push(v.size);
          }
        } else {
          colors.push({
            color: v.color.name,
            colorCode: v.color.code,
            hex: v.color.hex,
            inStock: v.inStock,
            sizes: [v.size]
          });
        }
        return colors;
      }, []);
    }

    // Build color availability from stock data
    const colorMap = new Map<string, ColorAvailability>();
    
    for (const item of stockResult.inventory) {
      const existing = colorMap.get(item.color);
      if (existing) {
        if (!existing.sizes.includes(item.size)) {
          existing.sizes.push(item.size);
        }
        if (item.qty > 0) {
          existing.inStock = true;
        }
      } else {
        colorMap.set(item.color, {
          color: item.color,
          inStock: item.qty > 0,
          sizes: [item.size]
        });
      }
    }

    return Array.from(colorMap.values());
  }

  /**
   * Get price with quantity breaks
   */
  async getPricing(sku: string, quantity?: number): Promise<PriceBreakResult | null> {
    const supplier = this.detectSupplier(sku);
    const styleCode = this.extractStyleCode(sku, supplier);

    try {
      let basePrice = 0;
      let currency = 'USD';
      let priceBreaks: Array<{ minQty: number; maxQty?: number; price: number; casePrice?: number }> = [];

      switch (supplier) {
        case SupplierName.AS_COLOUR:
          if (this.asColourClient) {
            // AS Colour uses subscription-based pricing via pricelist
            const prices = await this.asColourClient.listPriceList(1, 1000);
            const productPrices = prices.filter((p: any) => 
              p.sku?.startsWith(styleCode)
            );
            if (productPrices.length > 0) {
              const avgPrice = productPrices.reduce((s: number, p: any) => s + p.price, 0) / productPrices.length;
              basePrice = avgPrice;
              currency = productPrices[0].currency || 'AUD';
              priceBreaks = [{ minQty: 1, price: avgPrice }];
            }
          }
          break;

        case SupplierName.SS_ACTIVEWEAR:
          if (this.ssActivewearClient) {
            const ssPrice = await this.ssActivewearClient.getProductPricing(styleCode);
            if (ssPrice && ssPrice.length > 0) {
              // Sort by quantity ascending
              const sorted = ssPrice.sort((a: any, b: any) => a.quantity - b.quantity);
              basePrice = sorted[0].price;
              priceBreaks = sorted.map((p: any, i: number) => ({
                minQty: p.quantity,
                maxQty: sorted[i + 1]?.quantity ? sorted[i + 1].quantity - 1 : undefined,
                price: p.price,
                casePrice: p.casePrice
              }));
            }
          }
          break;

        case SupplierName.SANMAR:
          // SanMar would use cached data
          break;
      }

      // Calculate price for specific quantity
      let priceForQuantity: number | undefined;
      if (quantity && priceBreaks.length > 0) {
        const applicableBreak = [...priceBreaks]
          .reverse()
          .find(b => quantity >= b.minQty);
        priceForQuantity = applicableBreak?.price || basePrice;
      }

      return {
        sku,
        supplier,
        basePrice,
        currency,
        priceBreaks,
        priceForQuantity
      };
    } catch (error: any) {
      logger.error('Pricing lookup failed', { sku, supplier, error: error.message });
      return null;
    }
  }

  /**
   * Get top curated products by usage/priority
   */
  async getTopProducts(limit = 50, options?: {
    category?: string;
    supplier?: string;
  }): Promise<ProductSearchResult[]> {
    if (!this.strapiClient) {
      logger.warn('Strapi client not configured');
      return [];
    }

    try {
      const params: any = {
        'pagination[limit]': limit,
        'sort': 'priority:desc,usageCount:desc',
        'filters[isCurated][$eq]': true,
        'filters[isActive][$eq]': true
      };

      if (options?.category) {
        params['filters[category][$eq]'] = options.category;
      }

      if (options?.supplier) {
        params['filters[supplier][$eq]'] = options.supplier;
      }

      const response = await this.strapiClient.get('/api/products', { params });
      const products = response.data.data || [];

      return products.map((p: any) => ({
        sku: p.sku,
        name: p.name,
        brand: p.brand || 'Unknown',
        supplier: p.supplier,
        category: p.category || 'other',
        basePrice: parseFloat(p.basePrice) || 0,
        isCurated: true,
        imageUrl: p.images?.[0] || null
      }));
    } catch (error: any) {
      logger.error('Failed to get top products', { error: error.message });
      return [];
    }
  }

  /**
   * Increment usage count for a product (call when added to quote)
   */
  async trackProductUsage(sku: string): Promise<void> {
    if (!this.strapiClient) return;

    try {
      // Find product
      const response = await this.strapiClient.get('/api/products', {
        params: { 'filters[sku][$eq]': sku }
      });

      if (response.data.data?.length > 0) {
        const product = response.data.data[0];
        const currentCount = product.usageCount || 0;
        
        await this.strapiClient.put(`/api/products/${product.documentId}`, {
          data: { usageCount: currentCount + 1 }
        });
        
        logger.debug('Product usage tracked', { sku, newCount: currentCount + 1 });
      }
    } catch (error: any) {
      logger.error('Failed to track product usage', { sku, error: error.message });
    }
  }

  // Helper methods
  private extractStyleCode(sku: string, supplier: SupplierName): string {
    switch (supplier) {
      case SupplierName.AS_COLOUR:
        return sku.replace(/^AC-/i, '');
      case SupplierName.SS_ACTIVEWEAR:
        return sku.replace(/^SS-/i, '');
      case SupplierName.SANMAR:
        return sku.replace(/^SM-/i, '').toUpperCase();
      default:
        return sku;
    }
  }

  private mapSupplier(supplier: string): SupplierName {
    const s = supplier?.toLowerCase();
    if (s === 'ascolour' || s === 'as-colour') return SupplierName.AS_COLOUR;
    if (s === 'ssactivewear' || s === 's&s-activewear') return SupplierName.SS_ACTIVEWEAR;
    if (s === 'sanmar') return SupplierName.SANMAR;
    return SupplierName.SANMAR;
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.cacheService) {
      await this.cacheService.close();
    }
  }
}
