/**
 * Types for inventory synchronization
 */

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'backordered' | 'discontinued';
export type SyncSource = 'scheduled' | 'manual' | 'webhook';
export type SyncStatus = 'running' | 'completed' | 'failed';
export type ChangeType = 'quantity' | 'price' | 'status' | 'leadtime';

export interface SupplierInventoryData {
  supplierId: string;
  supplierSKU: string;
  quantity: number;
  price: number;
  leadTime?: number;
  isAvailable?: boolean;
  backorderDate?: Date;
}

export interface InventoryChange {
  id?: string;
  variantId: string;
  sku: string;
  supplierId: string;
  changeType: ChangeType;
  oldValue: any;
  newValue: any;
  detectedAt: Date;
  notified: boolean;
}

export interface SyncLogData {
  supplierId: string;
  supplierName: string;
  status: SyncStatus;
  variantsSynced?: number;
  changesDetected?: number;
  errors?: string[];
  duration?: number;
}

export interface BulkInventoryResult {
  [sku: string]: SupplierInventoryData;
}

export interface SyncResult {
  logId: string;
  supplierId: string;
  variantsSynced: number;
  changesDetected: number;
  errors: string[];
  duration: number;
  status: SyncStatus;
}
