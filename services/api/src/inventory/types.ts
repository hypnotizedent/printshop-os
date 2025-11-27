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
