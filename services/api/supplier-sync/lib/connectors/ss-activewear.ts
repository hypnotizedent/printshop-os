/**
 * S&S Activewear API Connector
 * Handles authentication, product fetching, and normalization for S&S Activewear
 */

import { BaseConnector } from '../base-connector';
import { NormalizedProduct, SupplierConnector, ConnectorConfig } from '../types';

interface SSStyle {
  styleID?: string;
  styleId?: string;
  styleCode?: string;
  style?: string;
  itemSku?: string;
  itemNumber?: string;
  styleNumber?: string;
  sku?: string;
  title?: string;
  styleName?: string;
  styleDescription?: string;
  name?: string;
  brandName?: string;
  baseCategory?: string;
  categoryName?: string;
  sizeList?: string[];
  colorList?: Array<{
    name: string;
    hex?: string;
    sku?: string;
    stock?: number;
    price?: number;
  }>;
  mediaUrls?: string[];
  fabric?: string;
  features?: string[];
  description?: string;
  baseCost?: number;
  pricing?: Array<{ qty: number; price: number }>;
  inventory?: number;
}

interface SSResponse {
  data?: SSStyle[];
  styles?: SSStyle[];
}

export class SSActivewearConnector extends BaseConnector implements SupplierConnector {
  constructor(config: ConnectorConfig) {
    super(config);
    
    // Set up Basic Auth
    if (config.auth.username && config.auth.password) {
      this.client.defaults.auth = {
        username: config.auth.username,
        password: config.auth.password,
      };
    }
  }

  /**
   * Fetch all products from S&S Activewear
   */
  async fetchProducts(): Promise<NormalizedProduct[]> {
    this.log('info', 'Fetching all products from S&S Activewear');

    return this.executeWithRetry(async () => {
      const response = await this.client.get<SSStyle[]>('/styles');
      const styles = Array.isArray(response.data) ? response.data : [];
      
      this.log('info', `Fetched ${styles.length} styles from S&S Activewear`);
      
      return styles.map(style => this.normalizeStyle(style));
    });
  }

  /**
   * Fetch a single product by style ID
   */
  async fetchProduct(styleId: string): Promise<NormalizedProduct | null> {
    this.log('info', `Fetching style ${styleId} from S&S Activewear`);

    return this.executeWithRetry(async () => {
      try {
        const response = await this.client.get<SSStyle>(`/styles/${styleId}`);
        return this.normalizeStyle(response.data);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.log('warn', `Style ${styleId} not found`);
          return null;
        }
        throw error;
      }
    });
  }

  /**
   * Test connection to S&S Activewear API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/styles', {
        params: { limit: 1 },
      });
      this.log('info', 'Successfully connected to S&S Activewear API');
      return true;
    } catch (error) {
      this.log('error', 'Failed to connect to S&S Activewear API', error);
      return false;
    }
  }

  /**
   * Normalize S&S style to common product schema
   */
  private normalizeStyle(style: SSStyle): NormalizedProduct {
    return {
      supplier: 'S&S Activewear',
      styleId:
        style.styleID ||
        style.styleId ||
        style.styleCode ||
        style.style ||
        style.itemSku ||
        style.itemNumber ||
        style.styleNumber ||
        style.sku ||
        'unknown',
      name:
        style.title ||
        style.styleName ||
        style.styleDescription ||
        style.name ||
        'Unnamed Product',
      brand: style.brandName || 'S&S Activewear',
      category: style.baseCategory || style.categoryName || '',
      sizes: style.sizeList || [],
      colors: (style.colorList || []).map(c => ({
        name: c.name,
        hex: c.hex || null,
        sku: c.sku || null,
        stock: c.stock || null,
        price: c.price || null,
      })),
      imageUrls: style.mediaUrls || [],
      material: style.fabric || '',
      tags: style.features || [],
      description: style.description,
      baseCost: style.baseCost,
      bulkBreaks: style.pricing,
      totalInventory: style.inventory,
      inStock: style.inventory ? style.inventory > 0 : undefined,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Factory function to create S&S Activewear connector from environment variables
 */
export function createSSActivewearConnector(): SSActivewearConnector {
  const config: ConnectorConfig = {
    baseUrl: process.env.SS_BASE_URL || 'https://api.ssactivewear.com/v2',
    auth: {
      username: process.env.SS_USERNAME,
      password: process.env.SS_PASSWORD,
    },
    timeout: 30000,
  };

  if (!config.auth.username || !config.auth.password) {
    throw new Error('S&S Activewear credentials not configured. Set SS_USERNAME and SS_PASSWORD environment variables.');
  }

  return new SSActivewearConnector(config);
}
