/**
 * Supplier Clients for Inventory Check
 * Wrapper around existing supplier clients with inventory-focused methods
 */

import axios, { AxiosInstance } from 'axios';
import { SupplierInventoryResult, InventoryItem } from './types';

// AS Colour Client
export class ASColourInventoryClient {
  private client: AxiosInstance;

  constructor(apiKey: string, baseURL = 'https://api.ascolour.com') {
    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Subscription-Key': apiKey,
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Get inventory for a specific SKU
   * SKU format: AC-{styleCode} or just styleCode
   */
  async getInventory(sku: string): Promise<SupplierInventoryResult> {
    try {
      // Extract style code (remove AC- prefix if present)
      const styleCode = sku.replace(/^AC-/i, '');
      
      // Try to get product info first
      const productRes = await this.client.get(`/v1/catalog/products/${encodeURIComponent(styleCode)}`);
      const product = productRes.data?.data || productRes.data?.product || productRes.data;
      
      if (!product) {
        return { found: false, error: 'Product not found' };
      }

      // Get variants for inventory
      const variantsRes = await this.client.get(`/v1/catalog/products/${encodeURIComponent(styleCode)}/variants`);
      const variants = variantsRes.data?.data || variantsRes.data?.variants || variantsRes.data || [];

      // Get price from pricelist
      let price: number | undefined;
      try {
        const priceRes = await this.client.get('/v1/catalog/pricelist', {
          params: { pageSize: 1000 }
        });
        const prices = priceRes.data?.data || priceRes.data?.prices || priceRes.data || [];
        const skuPrice = prices.find((p: any) => p.sku?.startsWith(styleCode));
        if (skuPrice) {
          price = skuPrice.price;
        }
      } catch {
        // Price lookup is optional
      }

      // Build inventory from variants
      const inventory: InventoryItem[] = [];
      for (const variant of variants) {
        try {
          const invRes = await this.client.get(
            `/v1/catalog/products/${encodeURIComponent(styleCode)}/variants/${encodeURIComponent(variant.sku || variant.code)}/inventory`
          );
          const invData = invRes.data?.data || invRes.data?.inventory || invRes.data;
          
          if (invData) {
            const items = Array.isArray(invData) ? invData : [invData];
            for (const item of items) {
              inventory.push({
                size: variant.size || 'OS',
                color: variant.colour || variant.color || 'Unknown',
                qty: item.quantity || item.qty || 0,
                warehouse: item.location || item.warehouse,
              });
            }
          }
        } catch {
          // Individual variant inventory lookup may fail
        }
      }

      return {
        found: true,
        name: product.styleName || product.name || styleCode,
        price,
        currency: 'AUD',
        inventory,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { found: false, error: 'Product not found' };
      }
      return { found: false, error: error.message || 'API error' };
    }
  }
}

// S&S Activewear Client
export class SSActivewearInventoryClient {
  private client: AxiosInstance;

  constructor(apiKey: string, accountNumber: string, baseURL = 'https://api.ssactivewear.com') {
    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountNumber}:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get inventory for a specific style
   * SKU format: SS-{styleID} or just styleID
   */
  async getInventory(sku: string): Promise<SupplierInventoryResult> {
    try {
      // Extract style ID (remove SS- prefix if present)
      const styleId = sku.replace(/^SS-/i, '');
      
      // Get product info
      const productRes = await this.client.get(`/v2/products/${styleId}`);
      const product = productRes.data;
      
      if (!product || !product.styleID) {
        return { found: false, error: 'Product not found' };
      }

      // Get inventory
      let inventory: InventoryItem[] = [];
      try {
        const invRes = await this.client.get(`/v2/products/${styleId}/inventory`);
        const invData = invRes.data || [];
        
        inventory = invData.map((item: any) => ({
          size: item.size || 'OS',
          color: item.colorName || item.color || 'Unknown',
          qty: item.qty || item.quantity || 0,
          warehouse: item.warehouseLocation || item.warehouse,
        }));
      } catch {
        // Inventory endpoint may fail
      }

      // Get pricing (lowest tier)
      let price: number | undefined;
      try {
        const priceRes = await this.client.get(`/v2/products/${styleId}/pricing`);
        const pricing = priceRes.data || [];
        if (pricing.length > 0) {
          // Get the price for quantity 1 or lowest tier
          const lowestTier = pricing.sort((a: any, b: any) => a.quantity - b.quantity)[0];
          price = lowestTier?.price;
        }
      } catch {
        // Pricing is optional
      }

      return {
        found: true,
        name: `${product.brandName || ''} ${product.styleName || styleId}`.trim(),
        price,
        currency: 'USD',
        inventory,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { found: false, error: 'Product not found' };
      }
      return { found: false, error: error.message || 'API error' };
    }
  }
}

// SanMar Client (uses cached CSV data)
export class SanMarInventoryClient {
  private productCache: Map<string, any> = new Map();
  private inventoryCache: Map<string, InventoryItem[]> = new Map();
  private cacheLoaded = false;

  constructor() {
    // CSV data path used by sync job to populate cache
  }

  /**
   * Load CSV data into memory cache
   * This would be called periodically by a background job
   */
  async loadCache(): Promise<void> {
    // In production, this would parse the SFTP-downloaded CSV files
    // For now, return empty - the cache would be populated by a separate sync job
    this.cacheLoaded = true;
  }

  /**
   * Get inventory for a specific product
   * SKU format: SM-{productId} or just productId (e.g., K110P)
   */
  async getInventory(sku: string): Promise<SupplierInventoryResult> {
    // Extract product ID (remove SM- prefix if present)
    const productId = sku.replace(/^SM-/i, '').toUpperCase();

    // Check in-memory cache first
    const cachedProduct = this.productCache.get(productId);
    const cachedInventory = this.inventoryCache.get(productId);

    if (cachedProduct) {
      return {
        found: true,
        name: cachedProduct.name || productId,
        price: cachedProduct.price,
        currency: 'USD',
        inventory: cachedInventory || [],
      };
    }

    // If not in cache, return not found
    // In production, you could also try the SanMar web API as fallback
    return {
      found: false,
      error: 'Product not in cache. SanMar data is loaded via periodic SFTP sync.',
    };
  }

  /**
   * Update cache with product data (called by sync job)
   */
  updateProductCache(productId: string, data: { name: string; price?: number }): void {
    this.productCache.set(productId.toUpperCase(), data);
  }

  /**
   * Update cache with inventory data (called by sync job)
   */
  updateInventoryCache(productId: string, inventory: InventoryItem[]): void {
    this.inventoryCache.set(productId.toUpperCase(), inventory);
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { products: number; lastLoaded: boolean } {
    return {
      products: this.productCache.size,
      lastLoaded: this.cacheLoaded,
    };
  }
}
