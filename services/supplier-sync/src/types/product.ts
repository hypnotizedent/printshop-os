/**
 * Unified Product Schema
 * This schema normalizes product data from all suppliers into a single format
 */

export interface UnifiedProduct {
  // Core Identity
  sku: string; // Supplier's style ID
  name: string;
  brand: string;
  description: string;
  category: ProductCategory;
  supplier: SupplierName;

  // Variants (color/size combinations)
  variants: ProductVariant[];

  // Images
  images: string[];

  // Pricing
  pricing: {
    basePrice: number;
    currency: string;
    breaks?: Array<{
      quantity: number;
      price: number;
      casePrice?: number;
    }>;
  };

  // Specifications
  specifications?: {
    weight?: string;
    fabric?: {
      type: string;
      content: string;
    };
    fit?: string;
    features?: string[];
    printMethods?: string[];
  };

  // Availability
  availability: {
    inStock: boolean;
    totalQuantity: number;
  };

  // Metadata
  metadata: {
    supplierProductId: string;
    supplierBrandId?: string;
    supplierCategoryId?: string;
    lastUpdated: Date;
  };
}

export interface ProductVariant {
  sku: string; // Variant SKU (styleID-color-size)
  color: {
    name: string;
    code?: string;
    hex?: string;
    family?: string;
  };
  size: string;
  inStock: boolean;
  quantity: number;
  imageUrl?: string;
  warehouseLocation?: string;
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
  HEADWEAR = 'headwear',
  BAGS = 'bags',
  OUTERWEAR = 'outerwear',
  ATHLETIC = 'athletic',
  WORKWEAR = 'workwear',
  YOUTH = 'youth',
  ACCESSORIES = 'accessories',
  OTHER = 'other',
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
