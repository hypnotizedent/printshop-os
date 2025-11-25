import axios, { AxiosInstance } from 'axios';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '../utils/logger';

/**
 * SanMar API Configuration
 */
export interface SanMarConfig {
  apiKey: string;
  accountNumber: string;
  baseURL?: string;
}

/**
 * SanMar Product Response
 */
export interface SanMarProduct {
  styleID: string;
  styleName: string;
  brandName: string;
  description?: string;
  categoryID?: string;
  categoryName?: string;
  fabricWeight?: string;
  fabricContent?: string;
  colors: SanMarColor[];
  sizes: string[];
  wholesalePrice?: number;
  retailPrice?: number;
  availability?: 'in-stock' | 'out-of-stock' | 'discontinued';
  images?: SanMarImage[];
  attributes?: Record<string, any>;
}

export interface SanMarColor {
  colorCode: string;
  colorName: string;
  hexCode?: string;
  inventory?: number;
}

export interface SanMarImage {
  url: string;
  type: 'front' | 'back' | 'side' | 'detail';
  color?: string;
}

export interface SanMarCategory {
  categoryID: string;
  name: string;
  parentCategoryID?: string;
}

export interface SanMarBrand {
  brandID: string;
  name: string;
}

/**
 * SanMar API Client
 * 
 * API Documentation: https://www.sanmar.com/api/
 * Rate Limits: TBD (typically 60-120 requests per minute)
 */
export class SanMarClient {
  private client: AxiosInstance;
  private rateLimiter: RateLimiterMemory;
  private config: SanMarConfig;

  constructor(config: SanMarConfig) {
    this.config = config;

    // Initialize axios client
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.sanmar.com',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'X-Account-Number': config.accountNumber,
      },
      timeout: 30000, // 30 seconds
    });

    // Rate limiter: 120 requests per minute (conservative estimate)
    this.rateLimiter = new RateLimiterMemory({
      points: 120,
      duration: 60,
      blockDuration: 61,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message || error.message;

          switch (status) {
            case 401:
              throw new Error(`Authentication failed: ${message}`);
            case 404:
              throw new Error(`Resource not found: ${message}`);
            case 429:
              throw new Error(`Rate limit exceeded: ${message}`);
            default:
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
  private async executeRequest<T>(request: () => Promise<T>): Promise<T> {
    await this.rateLimiter.consume('sanmar-api', 1);
    return request();
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<SanMarCategory[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get('/v1/categories');
      return response.data;
    });
  }

  /**
   * Get all brands
   */
  async getBrands(): Promise<SanMarBrand[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get('/v1/brands');
      return response.data;
    });
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: string): Promise<SanMarProduct[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get(`/v1/products`, {
        params: { categoryId },
      });
      return response.data;
    });
  }

  /**
   * Get products by brand
   */
  async getProductsByBrand(brandId: string): Promise<SanMarProduct[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get(`/v1/products`, {
        params: { brandId },
      });
      return response.data;
    });
  }

  /**
   * Get product by style ID
   */
  async getProduct(styleId: string): Promise<SanMarProduct> {
    return this.executeRequest(async () => {
      const response = await this.client.get(`/v1/products/${styleId}`);
      return response.data;
    });
  }

  /**
   * Get product inventory
   */
  async getProductInventory(styleId: string): Promise<any> {
    return this.executeRequest(async () => {
      const response = await this.client.get(`/v1/products/${styleId}/inventory`);
      return response.data;
    });
  }

  /**
   * Get product pricing
   */
  async getProductPricing(styleId: string): Promise<any> {
    return this.executeRequest(async () => {
      const response = await this.client.get(`/v1/products/${styleId}/pricing`);
      return response.data;
    });
  }

  /**
   * Get all products (paginated)
   */
  async getAllProducts(options?: {
    page?: number;
    perPage?: number;
  }): Promise<{ products: SanMarProduct[]; total: number; hasMore: boolean }> {
    return this.executeRequest(async () => {
      const response = await this.client.get('/v1/products', {
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
  async searchProducts(query: string): Promise<SanMarProduct[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get('/v1/products/search', {
        params: { q: query },
      });
      return response.data;
    });
  }

  /**
   * Get updated products since a specific date
   */
  async getUpdatedProducts(since: Date): Promise<SanMarProduct[]> {
    return this.executeRequest(async () => {
      const response = await this.client.get('/v1/products/updated', {
        params: {
          since: since.toISOString(),
        },
      });
      return response.data;
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.executeRequest(async () => {
        await this.client.get('/v1/categories');
        return true;
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
