/**
 * SanMar API Connector
 * Handles OAuth authentication, product fetching, and normalization for SanMar
 */

import { BaseConnector } from '../base-connector';
import { NormalizedProduct, SupplierConnector, ConnectorConfig } from '../types';

interface SanMarProduct {
  styleId?: string;
  styleNumber?: string;
  sku?: string;
  productId?: string;
  styleName?: string;
  name?: string;
  title?: string;
  brand?: string;
  brandName?: string;
  category?: string;
  categoryName?: string;
  productType?: string;
  sizes?: string[];
  sizeList?: string[];
  colors?: Array<{
    name: string;
    hex?: string;
    colorCode?: string;
    sku?: string;
  }>;
  colorList?: Array<{
    name: string;
    hex?: string;
    colorCode?: string;
    sku?: string;
  }>;
  images?: string[];
  imageUrls?: string[];
  fabric?: string;
  material?: string;
  composition?: string;
  description?: string;
  features?: string[];
  price?: number;
  baseCost?: number;
  pricing?: Array<{ qty: number; price: number }>;
  inventory?: number;
  stock?: number;
}

interface SanMarResponse {
  data?: SanMarProduct[];
  products?: SanMarProduct[];
  styles?: SanMarProduct[];
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Token expiry buffer to refresh token before actual expiry (5 minutes in ms)
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

export class SanMarConnector extends BaseConnector implements SupplierConnector {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: ConnectorConfig) {
    super(config);
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with buffer before expiry)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - TOKEN_EXPIRY_BUFFER_MS) {
      return this.accessToken;
    }

    this.log('info', 'Requesting new OAuth token from SanMar');

    const response = await this.client.post<OAuthTokenResponse>(
      '/oauth/token',
      {
        grant_type: 'client_credentials',
        client_id: this.config.auth.clientId,
        client_secret: this.config.auth.clientSecret,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

    this.log('info', 'Successfully obtained OAuth token');
    return this.accessToken;
  }

  /**
   * Make authenticated request with automatic token refresh
   */
  private async makeAuthenticatedRequest<T>(
    requestFn: (token: string) => Promise<T>
  ): Promise<T> {
    try {
      const token = await this.getAccessToken();
      return await requestFn(token);
    } catch (error: any) {
      // If we get 401, token might be expired, try once more with fresh token
      if (error.response?.status === 401) {
        this.log('warn', 'Token expired, refreshing...');
        this.accessToken = null;
        const token = await this.getAccessToken();
        return await requestFn(token);
      }
      throw error;
    }
  }

  /**
   * Fetch all products from SanMar
   */
  async fetchProducts(): Promise<NormalizedProduct[]> {
    this.log('info', 'Fetching all products from SanMar');

    return this.executeWithRetry(async () => {
      return this.makeAuthenticatedRequest(async (token) => {
        const response = await this.client.get<SanMarResponse>('/styles', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Use base connector's helper to extract array from response
        const products = this.extractArrayFromResponse<SanMarProduct>(
          response.data,
          ['data', 'products', 'styles']
        );

        this.log('info', `Fetched ${products.length} products from SanMar`);

        return products.map(product => this.normalizeProduct(product));
      });
    });
  }

  /**
   * Fetch a single product by style ID
   */
  async fetchProduct(styleId: string): Promise<NormalizedProduct | null> {
    this.log('info', `Fetching product ${styleId} from SanMar`);

    return this.executeWithRetry(async () => {
      try {
        return await this.makeAuthenticatedRequest(async (token) => {
          const response = await this.client.get<SanMarProduct>(
            `/styles/${styleId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          return this.normalizeProduct(response.data);
        });
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.log('warn', `Product ${styleId} not found`);
          return null;
        }
        throw error;
      }
    });
  }

  /**
   * Test connection to SanMar API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeAuthenticatedRequest(async (token) => {
        await this.client.get('/styles', {
          params: { limit: 1 },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      });
      this.log('info', 'Successfully connected to SanMar API');
      return true;
    } catch (error) {
      this.log('error', 'Failed to connect to SanMar API', error);
      return false;
    }
  }

  /**
   * Normalize SanMar product to common product schema
   */
  private normalizeProduct(product: SanMarProduct): NormalizedProduct {
    // Get colors from either colors or colorList
    const colors = product.colors || product.colorList || [];

    return {
      supplier: 'SanMar',
      styleId:
        product.styleId ||
        product.styleNumber ||
        product.sku ||
        product.productId ||
        'unknown',
      name:
        product.styleName ||
        product.name ||
        product.title ||
        'Unnamed Product',
      brand: product.brand || product.brandName || 'SanMar',
      category:
        product.category ||
        product.categoryName ||
        product.productType ||
        '',
      sizes: product.sizes || product.sizeList || [],
      colors: colors.map(c => ({
        name: c.name,
        hex: c.hex || c.colorCode || null,
        sku: c.sku || null,
        stock: null,
        price: null,
      })),
      imageUrls: product.images || product.imageUrls || [],
      material:
        product.fabric ||
        product.material ||
        product.composition ||
        '',
      tags: product.features || [],
      description: product.description,
      baseCost: product.baseCost || product.price,
      bulkBreaks: product.pricing,
      totalInventory: product.inventory || product.stock,
      inStock:
        product.inventory !== undefined
          ? product.inventory > 0
          : product.stock !== undefined
          ? product.stock > 0
          : undefined,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Factory function to create SanMar connector from environment variables
 */
export function createSanMarConnector(): SanMarConnector {
  const config: ConnectorConfig = {
    baseUrl: process.env.SANMAR_BASE_URL || 'https://api.sanmar.com',
    auth: {
      clientId: process.env.SANMAR_CLIENT_ID,
      clientSecret: process.env.SANMAR_CLIENT_SECRET,
    },
    timeout: 30000,
  };

  if (!config.auth.clientId || !config.auth.clientSecret) {
    throw new Error('SanMar OAuth credentials not configured. Set SANMAR_CLIENT_ID and SANMAR_CLIENT_SECRET environment variables.');
  }

  return new SanMarConnector(config);
}
