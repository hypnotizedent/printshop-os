/**
 * Inventory Check Types
 * Normalized types for cross-supplier inventory queries
 */

export interface InventoryItem {
  size: string;
  color: string;
  qty: number;
  warehouse?: string;
}

export interface InventoryCheckResponse {
  sku: string;
  name: string;
  supplier: 'as-colour' | 's&s-activewear' | 'sanmar';
  price: number | null;
  currency: string;
  inventory: InventoryItem[];
  totalQty: number;
  lastChecked: string;
  cached: boolean;
  cacheExpires?: string;
}

export interface InventoryCheckError {
  error: string;
  sku: string;
  supplier?: string;
  code: 'NOT_FOUND' | 'SUPPLIER_ERROR' | 'INVALID_SKU' | 'CACHE_ERROR';
}

export type SupplierType = 'as-colour' | 's&s-activewear' | 'sanmar';

export interface SupplierInventoryResult {
  found: boolean;
  name?: string;
  price?: number;
  currency?: string;
  inventory?: InventoryItem[];
  error?: string;
}

export interface ColorAvailabilityResponse {
  sku: string;
  name: string;
  supplier: SupplierType;
  colorCount: number;
  colors: Array<{
    color: string;
    inStock: boolean;
    totalQty: number;
    sizes: string[];
  }>;
  lastChecked: string;
  cached: boolean;
}

export interface SizeAvailabilityResponse {
  sku: string;
  name: string;
  supplier: SupplierType;
  colorFilter: string | null;
  sizeCount: number;
  sizes: Array<{
    size: string;
    inStock: boolean;
    totalQty: number;
    colors: string[];
  }>;
  lastChecked: string;
  cached: boolean;
}

export interface PricingResponse {
  sku: string;
  supplier: SupplierType;
  basePrice: number;
  currency: string;
  priceBreaks: Array<{
    minQty: number;
    maxQty?: number;
    price: number;
    casePrice?: number;
  }>;
  quantity: number | null;
  priceForQuantity: number | null;
  lastChecked: string;
}
