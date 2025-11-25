/**
 * Base Supplier Mapping Configuration
 * Defines the structure for supplier-specific mappings
 */

export interface SupplierMapping {
  supplierId: string;
  name: string;
  
  // Field mappings from supplier format to internal format
  fields: Record<string, string | string[]>;
  
  // Size mappings
  sizes?: Record<string, string>;
  
  // Color mappings
  colors?: Record<string, string>;
  
  // SKU parser function
  skuParser?: (sku: string) => {
    prefix?: string;
    brand?: string;
    style: string;
    color: string;
    size: string;
  };
  
  // Custom transform functions
  transforms?: {
    brand?: (value: any) => string;
    name?: (value: any) => string;
    category?: (value: any) => string;
    price?: (value: any) => any;
    size?: (value: any) => string;
    color?: (value: any) => string;
  };
}

/**
 * Get mapping configuration for a supplier
 */
export function getMappingForSupplier(supplierId: string): SupplierMapping | null {
  // This will be populated by individual mapping files
  const mappings = getMappingRegistry();
  return mappings[supplierId] || null;
}

// Registry of all supplier mappings
const mappingRegistry: Record<string, SupplierMapping> = {};

/**
 * Register a supplier mapping
 */
export function registerMapping(mapping: SupplierMapping): void {
  mappingRegistry[mapping.supplierId] = mapping;
}

/**
 * Get all registered mappings
 */
export function getMappingRegistry(): Record<string, SupplierMapping> {
  return mappingRegistry;
}

/**
 * Get all registered supplier IDs
 */
export function getRegisteredSuppliers(): string[] {
  return Object.keys(mappingRegistry);
}
