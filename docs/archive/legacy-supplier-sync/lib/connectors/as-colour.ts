/**
 * AS Colour API Connector
 * Handles authentication, product fetching, and normalization for AS Colour
 */

import { BaseConnector } from '../base-connector';
import { NormalizedProduct, SupplierConnector, ConnectorConfig } from '../types';
import { CacheService } from '../cache';
import { CacheDecorator } from '../cache-decorator';
import { CACHE_PREFIXES, DEFAULT_TTL } from '../cache-config';

interface ASProduct {
  styleCode?: string;
  id?: string;
  styleName?: string;
  name?: string;
  productType?: string;
  category?: string;
  sizeGuideURL?: string;
  sizes?: string[];
  colours?: Array<{
    name: string;
    hexCode?: string;
    sku?: string;
  }>;
  websiteURL?: string;
  imageURL?: string;
  images?: string[];
  composition?: string;
  material?: string;
  shortDescription?: string;
  fit?: string;
  coreRange?: string | boolean;
  description?: string;
  price?: number;
  pricing?: Array<{ qty: number; price: number }>;
  stock?: number;
}

interface ASResponse {
  data?: ASProduct[];
  products?: ASProduct[];
}

export class ASColourConnector extends BaseConnector implements SupplierConnector {
  constructor(config: ConnectorConfig, cacheService?: CacheService) {
    super(config, cacheService);
    
    // Set up API key authentication
    if (config.auth.apiKey) {
      this.client.defaults.headers.common['Subscription-Key'] = config.auth.apiKey;
    }
    
    this.client.defaults.headers.common['Accept'] = 'application/json';
  }

  /**
   * Fetch all products from AS Colour
   */
  @CacheDecorator({ ttl: DEFAULT_TTL.productLists, keyPrefix: `${CACHE_PREFIXES.productList}:ascolour` })
  async fetchProducts(): Promise<NormalizedProduct[]> {
    this.log('info', 'Fetching all products from AS Colour');

    return this.executeWithRetry(async () => {
      const response = await this.client.get<ASResponse>('/products');
      
      // Use base connector's helper to extract array from response
      const products = this.extractArrayFromResponse<ASProduct>(
        response.data,
        ['data', 'products']
      );
      
      this.log('info', `Fetched ${products.length} products from AS Colour`);
      
      return products.map(product => this.normalizeProduct(product));
    });
  }

  /**
   * Fetch a single product by style code
   */
  @CacheDecorator({ ttl: DEFAULT_TTL.productDetails, keyPrefix: `${CACHE_PREFIXES.productDetail}:ascolour` })
  async fetchProduct(styleCode: string): Promise<NormalizedProduct | null> {
    this.log('info', `Fetching product ${styleCode} from AS Colour`);

    return this.executeWithRetry(async () => {
      try {
        const response = await this.client.get<ASProduct>(`/products/${styleCode}`);
        return this.normalizeProduct(response.data);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.log('warn', `Product ${styleCode} not found`);
          return null;
        }
        throw error;
      }
    });
  }

  /**
   * Test connection to AS Colour API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/products', {
        params: { limit: 1 },
      });
      this.log('info', 'Successfully connected to AS Colour API');
      return true;
    } catch (error) {
      this.log('error', 'Failed to connect to AS Colour API', error);
      return false;
    }
  }

  /**
   * Normalize AS Colour product to common product schema
   */
  private normalizeProduct(product: ASProduct): NormalizedProduct {
    // Build tags from available metadata
    const tags: string[] = [];
    if (product.shortDescription) tags.push(product.shortDescription);
    if (product.fit) tags.push(product.fit);
    if (product.coreRange) tags.push('Core Range');

    // Collect image URLs
    const imageUrls: string[] = [];
    if (product.imageURL) imageUrls.push(product.imageURL);
    if (product.websiteURL) imageUrls.push(product.websiteURL);
    if (product.images) imageUrls.push(...product.images);

    // Handle sizes
    const sizes = product.sizes || (product.sizeGuideURL ? ['One Size'] : []);

    return {
      supplier: 'AS Colour',
      styleId: product.styleCode || product.id || 'unknown',
      name: product.styleName || product.name || 'Unnamed Product',
      brand: 'AS Colour',
      category: product.productType || product.category || '',
      sizes,
      colors: (product.colours || []).map(c => ({
        name: c.name,
        hex: c.hexCode || null,
        sku: c.sku || null,
        stock: null,
        price: null,
      })),
      imageUrls,
      material: product.composition || product.material || '',
      tags: tags.filter(Boolean),
      description: product.description,
      baseCost: product.price,
      bulkBreaks: product.pricing,
      totalInventory: product.stock,
      inStock: product.stock ? product.stock > 0 : undefined,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Factory function to create AS Colour connector from environment variables
 */
export function createASColourConnector(cacheService?: CacheService): ASColourConnector {
  const config: ConnectorConfig = {
    baseUrl: process.env.ASCOLOUR_BASE_URL || 'https://api.ascolour.com/v1/catalog',
    auth: {
      apiKey: process.env.ASCOLOUR_API_KEY,
    },
    timeout: 30000,
  };

  if (!config.auth.apiKey) {
    throw new Error('AS Colour API key not configured. Set ASCOLOUR_API_KEY environment variable.');
  }

  return new ASColourConnector(config, cacheService);
}
