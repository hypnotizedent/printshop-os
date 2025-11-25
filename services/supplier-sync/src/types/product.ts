/**
 * Unified Product Schema
 * This schema normalizes product data from all suppliers into a single format
 */

export interface UnifiedProduct {
  // Core Identity
  id: string; // Internal ID
  sku: string; // Our SKU
  supplierSKU: string; // Supplier's SKU
  supplier: SupplierName;
  supplierProductId: string;

  // Basic Info
  name: string;
  description: string;
  category: ProductCategory;
  subcategory?: string;
  brand: string;

  // Specifications
  specifications: {
    material?: string;
    weight?: string;
    sizes: string[];
    colors: ProductColor[];
    printAreas?: PrintArea[];
    features?: string[];
  };

  // Pricing
  pricing: {
    basePrice: number;
    currency: string;
    priceBreaks?: PriceBreak[];
    msrp?: number;
    costPlus?: number;
  };

  // Inventory
  inventory: {
    available: boolean;
    totalStock?: number;
    stockByVariant: VariantStock[];
    lastUpdated: Date;
  };

  // Metadata
  metadata: {
    imageUrls: string[];
    sizeChart?: string;
    careInstructions?: string;
    tags?: string[];
    isActive: boolean;
    lastSyncedAt: Date;
  };
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  colorCode?: string;
  price: number;
  stock: number;
  available: boolean;
  imageUrl?: string;
}

export interface ProductColor {
  name: string;
  code?: string; // Hex code
  imageUrl?: string;
}

export interface PrintArea {
  name: string; // "Front", "Back", "Left Chest", etc.
  width: number; // inches
  height: number; // inches
}

export interface PriceBreak {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
}

export interface VariantStock {
  size: string;
  color: string;
  quantity: number;
  available: boolean;
}

export enum SupplierName {
  SS_ACTIVEWEAR = 'ss-activewear',
  AS_COLOUR = 'as-colour',
  SANMAR = 'sanmar',
}

export enum ProductCategory {
  T_SHIRTS = 't-shirts',
  POLOS = 'polos',
  HOODIES = 'hoodies',
  SWEATSHIRTS = 'sweatshirts',
  HATS = 'hats',
  BAGS = 'bags',
  OUTERWEAR = 'outerwear',
  ATHLETIC = 'athletic',
  WORKWEAR = 'workwear',
  ACCESSORIES = 'accessories',
}

/**
 * Supplier-specific interfaces (to be transformed into UnifiedProduct)
 */

// S&S Activewear API Response
export interface SSActivewearProduct {
  styleID: string;
  styleName: string;
  brandName: string;
  categoryName: string;
  description: string;
  pieceWeight: string;
  fabricType: string;
  sizes: string[];
  colors: Array<{
    colorName: string;
    hexCode: string;
    imageURL: string;
  }>;
  pricing: Array<{
    quantity: number;
    price: number;
  }>;
  inventory: Array<{
    size: string;
    colorName: string;
    qty: number;
  }>;
}

// AS Colour API Response
export interface ASColourProduct {
  code: string;
  name: string;
  description: string;
  category: string;
  fabric: string;
  gsm: number;
  sizes: string[];
  colours: Array<{
    name: string;
    swatch: string;
  }>;
  pricing: {
    retail: number;
    wholesale: number;
  };
  stock: Array<{
    size: string;
    colour: string;
    available: number;
  }>;
}

// SanMar API Response
export interface SanMarProduct {
  productId: string;
  productKey: string;
  brandName: string;
  productName: string;
  productDescription: string;
  categoryId: string;
  caseQuantity: number;
  sellPrice: number;
  sizes: Array<{
    sizeName: string;
    sizeSequence: number;
  }>;
  colors: Array<{
    colorName: string;
    hexCode: string;
    colorImageUrl: string;
  }>;
  inventory: Array<{
    size: string;
    color: string;
    availableQty: number;
  }>;
}
