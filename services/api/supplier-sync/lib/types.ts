/**
 * Common types and interfaces for supplier connectors
 */

/**
 * Color variant information
 */
export interface ColorVariant {
  name: string;
  hex?: string | null;
  sku?: string | null;
  stock?: number | null;
  price?: number | null;
}

/**
 * Normalized product schema shared across all suppliers
 */
export interface NormalizedProduct {
  supplier: string;
  styleId: string;
  name: string;
  brand: string;
  category: string;
  sizes: string[];
  colors: ColorVariant[];
  imageUrls: string[];
  material?: string;
  tags?: string[];
  description?: string;
  baseCost?: number;
  bulkBreaks?: BulkPriceBreak[];
  totalInventory?: number;
  inStock?: boolean;
  lastUpdated?: string;
}

/**
 * Bulk pricing tier
 */
export interface BulkPriceBreak {
  qty: number;
  price: number;
}

/**
 * Retry configuration for API requests
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Base connector interface that all supplier connectors must implement
 */
export interface SupplierConnector {
  /**
   * Fetch all products from the supplier
   */
  fetchProducts(): Promise<NormalizedProduct[]>;

  /**
   * Fetch a single product by ID/SKU
   */
  fetchProduct(id: string): Promise<NormalizedProduct | null>;

  /**
   * Test the connection to the supplier API
   */
  testConnection(): Promise<boolean>;
}

/**
 * Authentication credentials for suppliers
 */
export interface AuthCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  token?: string;
}

/**
 * Connector configuration
 */
export interface ConnectorConfig {
  baseUrl: string;
  auth: AuthCredentials;
  timeout?: number;
  retryConfig?: RetryConfig;
}
