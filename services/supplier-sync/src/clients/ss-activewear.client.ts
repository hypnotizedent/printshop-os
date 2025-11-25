import axios, { AxiosInstance } from 'axios';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export interface SSActivewearConfig {
  apiKey: string;
  accountNumber: string;
  baseURL?: string;
}

export interface SSProduct {
  styleID: string;
  styleName: string;
  brandName: string;
  brandID: number;
  categoryName: string;
  categoryID: number;
  description: string;
  pieceWeight: string;
  fabricType: string;
  fabricContent: string;
  sizes: string[];
  colors: SSColor[];
  pricing: SSPricing[];
  inventory: SSInventory[];
  images: SSImage[];
  specifications?: {
    fit?: string;
    features?: string[];
    printMethods?: string[];
  };
}

export interface SSColor {
  colorName: string;
  colorCode?: string;
  hexCode: string;
  colorFamilyName?: string;
  imageURL: string;
}

export interface SSPricing {
  quantity: number;
  price: number;
  casePrice?: number;
}

export interface SSInventory {
  size: string;
  colorName: string;
  qty: number;
  warehouseLocation?: string;
}

export interface SSImage {
  url: string;
  type: 'front' | 'back' | 'side' | 'detail';
  color?: string;
}

export interface SSCategory {
  categoryID: number;
  categoryName: string;
  parentCategoryID?: number;
}

export interface SSBrand {
  brandID: number;
  brandName: string;
}

/**
 * S&S Activewear API Client
 * 
 * API Documentation: https://api.ssactivewear.com/
 * Rate Limits: 120 requests per minute
 */
export class SSActivewearClient {
  private client: AxiosInstance;
  private rateLimiter: RateLimiterMemory;
  private config: SSActivewearConfig;

  constructor(config: SSActivewearConfig) {
    this.config = config;

    // Initialize axios client
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.ssactivewear.com',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.accountNumber}:${config.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Rate limiter: 120 requests per minute (2 per second with burst)
    this.rateLimiter = new RateLimiterMemory({
      points: 120,
      duration: 60,
      blockDuration: 61, // Block for 1 minute if limit exceeded
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message || error.message;

          if (status === 429) {
            throw new Error(`Rate limit exceeded: ${message}`);
          } else if (status === 401) {
            throw new Error(`Authentication failed: ${message}`);
          } else if (status === 404) {
            throw new Error(`Resource not found: ${message}`);
          } else {
            throw new Error(`API error (${status}): ${message}`);
          }
        }
        throw error;
      }
    );
  }

  /**
   * Execute API request with rate limiting
   */
  private async executeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    await this.rateLimiter.consume('ss-api', 1);
    return requestFn();
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<SSCategory[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get('/v2/categories');
      return response.data;
    });
  }

  /**
   * Get all brands
   */
  async getBrands(): Promise<SSBrand[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get('/v2/brands');
      return response.data;
    });
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: number): Promise<SSProduct[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get(`/v2/products`, {
        params: { categoryID: categoryId },
      });
      return response.data;
    });
  }

  /**
   * Get products by brand
   */
  async getProductsByBrand(brandId: number): Promise<SSProduct[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get(`/v2/products`, {
        params: { brandID: brandId },
      });
      return response.data;
    });
  }

  /**
   * Get product by style ID
   */
  async getProduct(styleId: string): Promise<SSProduct> {
    return this.executeRequest(async () => {
      const response = await this.client.get(`/v2/products/${styleId}`);
      return response.data;
    });
  }

  /**
   * Get product inventory
   */
  async getProductInventory(styleId: string): Promise<SSInventory[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get(`/v2/products/${styleId}/inventory`);
      return response.data;
    });
  }

  /**
   * Get product pricing
   */
  async getProductPricing(styleId: string): Promise<SSPricing[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get(`/v2/products/${styleId}/pricing`);
      return response.data;
    });
  }

  /**
   * Get all products (paginated)
   */
  async getAllProducts(options?: {
    page?: number;
    perPage?: number;
  }): Promise<{ products: SSProduct[]; total: number; hasMore: boolean }> {
    return this.executeRequest(async () => {
      const response = await this.client.get('/v2/products', {
        params: {
          page: options?.page || 1,
          perPage: options?.perPage || 100,
        },
      });

      return {
        products: response.data.products || [],
        total: response.data.total || 0,
        hasMore: response.data.hasMore || false,
      };
    });
  }

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<SSProduct[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get('/v2/products/search', {
        params: { q: query },
      });
      return response.data;
    });
  }

  /**
   * Get products updated since date
   */
  async getUpdatedProducts(since: Date): Promise<SSProduct[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get('/v2/products/updated', {
        params: {
          since: since.toISOString(),
        },
      });
      return response.data;
    });
  }

  /**
   * Batch get products by style IDs
   */
  async getProductsBatch(styleIds: string[]): Promise<SSProduct[]> {
    const products: SSProduct[] = [];

    // Process in chunks of 10 to respect rate limits
    const chunkSize = 10;
    for (let i = 0; i < styleIds.length; i += chunkSize) {
      const chunk = styleIds.slice(i, i + chunkSize);
      const promises = chunk.map((styleId) => this.getProduct(styleId));
      const results = await Promise.allSettled(promises);

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          products.push(result.value);
        }
      });

      // Small delay between chunks
      if (i + chunkSize < styleIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return products;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.executeRequest(async () => {
        await this.client.get('/v2/health');
        return true;
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
