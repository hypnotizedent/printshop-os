import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface ASColourClientConfig {
  apiKey: string; // Subscription key
  baseURL?: string; // e.g. https://api.ascolour.com
  timeoutMs?: number;
  pageSize?: number; // default page size for catalog/inventory pagination
  maxPages?: number; // safety cap for pagination
  maxRetries?: number; // retry attempts on 429/503
  retryDelayMs?: number; // base delay before retry
}

export interface ASColourRawProduct {
  styleCode: string;
  styleName: string;
  description: string;
  shortDescription: string;
  printingTechniques: string;
  fabricWeight: string;
  composition: string;
  webId: number;
  productType: string;
  productWeight: string;
  coreRange: string;
  fit: string;
  gender: string;
  productSpecURL: string;
  sizeGuideURL: string;
  websiteURL: string;
  updatedAt: string;
}

export interface ASColourVariant {
  sku: string;
  styleCode: string;
  colour: string;
  colourHex: string;
  size: string;
  barcode: string;
  coreColour: string;
  updatedAt: string;
}

export interface ASColourInventoryItem {
  sku: string;
  location: string;
  quantity: number;
  nextDeliveryETA: string | null;
  updatedAt: string;
}

export interface ASColourPriceListItem {
  sku: string;
  price: number;
  currency: string;
  updatedAt: string;
}

export class ASColourClient {
  private client: AxiosInstance;
  private config: ASColourClientConfig;

  constructor(config: ASColourClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL || process.env.ASCOLOUR_BASE_URL || 'https://api.ascolour.com',
      timeout: config.timeoutMs || 30000,
      headers: {
        // Subscription key header per spec
        [process.env.ASCOLOUR_AUTH_HEADER_NAME || 'Subscription-Key']: config.apiKey,
        'Accept': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      r => r,
      async (err) => {
        const status = err.response?.status;
        const retryAfter = err.response?.headers['retry-after'];
        const maxRetries = this.config.maxRetries || 3;
        const retryDelay = this.config.retryDelayMs || 1000;
        
        if ((status === 429 || status === 503) && err.config && !err.config.__retryCount) {
          err.config.__retryCount = 0;
        }
        
        if ((status === 429 || status === 503) && err.config.__retryCount < maxRetries) {
          err.config.__retryCount++;
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay * err.config.__retryCount;
          logger.warn('AS Colour rate limit or service unavailable; retrying', { status, attempt: err.config.__retryCount, delayMs: delay });
          await new Promise(res => setTimeout(res, delay));
          return this.client.request(err.config);
        }
        
        logger.error('AS Colour API error', { status, message: err.message });
        return Promise.reject(err);
      }
    );
  }

  async healthCheck(): Promise<boolean> {
    // No explicit health endpoint in spec; attempt lightweight colours call.
    try {
      const res = await this.client.get('/v1/catalog/colours', { params: { pageNumber: 1, pageSize: 1 } });
      return res.status === 200;
    } catch (e) {
      logger.warn('AS Colour pseudo health check failed');
      return false;
    }
  }

  async listProducts(pageNumber = 1, pageSize?: number): Promise<ASColourRawProduct[]> {
    const size = pageSize || this.config.pageSize || Number(process.env.ASCOLOUR_PAGE_SIZE) || 100;
    const res = await this.client.get('/v1/catalog/products', { params: { pageNumber, pageSize: size } });
    return res.data.data || res.data.products || res.data || [];
  }

  async getAllProducts(): Promise<ASColourRawProduct[]> {
    const maxPages = this.config.maxPages || Number(process.env.ASCOLOUR_MAX_PAGES) || 50;
    const pageSize = this.config.pageSize || Number(process.env.ASCOLOUR_PAGE_SIZE) || 100;
    let pageNumber = 1;
    const all: ASColourRawProduct[] = [];
    while (pageNumber <= maxPages) {
      try {
        const batch = await this.listProducts(pageNumber, pageSize);
        if (!batch.length) break;
        all.push(...batch);
        logger.info('Fetched AS Colour catalog page', { pageNumber, batchSize: batch.length });
        if (batch.length < pageSize) break;
        pageNumber++;
      } catch (e: any) {
        if (e.response?.status === 404) {
          logger.warn('Products endpoint 404; stopping pagination');
          break;
        }
        throw e;
      }
    }
    return all;
  }

  async getProduct(styleCode: string): Promise<ASColourRawProduct | null> {
    try {
      const res = await this.client.get(`/v1/catalog/products/${encodeURIComponent(styleCode)}`);
      return res.data.data || res.data.product || res.data || null;
    } catch (e: any) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  }

  async listVariants(styleCode: string): Promise<any[]> { // refine type when spec available
    const res = await this.client.get(`/v1/catalog/products/${encodeURIComponent(styleCode)}/variants`);
    return res.data.data || res.data.variants || res.data || [];
  }

  async getVariant(styleCode: string, variantCode: string): Promise<any | null> {
    try {
      const res = await this.client.get(`/v1/catalog/products/${encodeURIComponent(styleCode)}/variants/${encodeURIComponent(variantCode)}`);
      return res.data.data || res.data.variant || res.data || null;
    } catch (e: any) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  }

  async getVariantInventory(styleCode: string, variantCode: string): Promise<any | null> {
    try {
      const res = await this.client.get(`/v1/catalog/products/${encodeURIComponent(styleCode)}/variants/${encodeURIComponent(variantCode)}/inventory`);
      return res.data.data || res.data.inventory || res.data || null;
    } catch (e: any) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  }

  async getVariantInbound(styleCode: string, variantCode: string): Promise<any | null> {
    try {
      const res = await this.client.get(`/v1/catalog/products/${encodeURIComponent(styleCode)}/variants/${encodeURIComponent(variantCode)}/inbound`);
      return res.data.data || res.data.inbound || res.data || null;
    } catch (e: any) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  }

  async getProductImages(styleCode: string): Promise<string[]> {
    const res = await this.client.get(`/v1/catalog/products/${encodeURIComponent(styleCode)}/images`);
    return res.data.data || res.data.images || res.data || [];
  }

  async listColours(colourFilter?: string): Promise<any[]> {
    const params: any = {};
    if (colourFilter) params.ColourFilter = colourFilter;
    const res = await this.client.get('/v1/catalog/colours', { params });
    return res.data.data || res.data.colours || res.data || [];
  }

  async searchProducts(query: string): Promise<ASColourRawProduct[]> {
    // No dedicated search endpoint in spec; fallback to products with future filter support.
    const all = await this.getAllProducts();
    const q = query.toLowerCase();
    return all.filter(p => p.styleName.toLowerCase().includes(q) || p.styleCode.toLowerCase().includes(q));
  }

  async listInventoryItems(params: { skuFilter?: string; updatedAtMin?: string; pageNumber?: number; pageSize?: number } = {}): Promise<any[]> {
    const query: any = {};
    if (params.skuFilter) query.skuFilter = params.skuFilter;
    if (params.updatedAtMin) query['updatedAt:min'] = params.updatedAtMin;
    query.pageNumber = params.pageNumber || 1;
    query.pageSize = params.pageSize || this.config.pageSize || Number(process.env.ASCOLOUR_PAGE_SIZE) || 100;
    const res = await this.client.get('/v1/inventory/items', { params: query });
    return res.data.data || res.data.items || res.data || [];
  }

  async getInventoryItem(sku: string): Promise<any | null> {
    try {
      const res = await this.client.get(`/v1/inventory/items/${encodeURIComponent(sku)}`);
      return res.data.data || res.data.item || res.data || null;
    } catch (e: any) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  }

  async authenticate(email: string, password: string): Promise<string | null> {
    try {
      const res = await this.client.post('/v1/api/authentication', { email, password });
      const token = res.data.token || res.data.accessToken || res.data?.authorization || null;
      if (token) {
        this.client.defaults.headers['Authorization'] = `Bearer ${token}`;
        logger.info('AS Colour bearer token set');
      }
      return token;
    } catch (e: any) {
      if (e.response?.status === 401) return null;
      throw e;
    }
  }

  async listPriceList(pageNumber = 1, pageSize?: number): Promise<any[]> {
    const size = pageSize || this.config.pageSize || Number(process.env.ASCOLOUR_PAGE_SIZE) || 100;
    const res = await this.client.get('/v1/catalog/pricelist', { params: { pageNumber, pageSize: size } });
    return res.data.data || res.data.prices || res.data || [];
  }

  async getCategories(): Promise<string[]> {
    const products = await this.getAllProducts();
    return Array.from(new Set(products.map(p => p.productType).filter(Boolean)));
  }
}
