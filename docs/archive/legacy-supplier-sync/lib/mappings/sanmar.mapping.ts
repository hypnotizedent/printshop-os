/**
 * SanMar Supplier Mapping Configuration
 */

import { SupplierMapping, registerMapping } from './base.mapping';

export const SanMarMapping: SupplierMapping = {
  supplierId: 'sanmar',
  name: 'SanMar',
  
  // Field mappings
  fields: {
    brand: ['Brand', 'brandName', 'brand'],
    name: ['Description', 'styleName', 'name', 'title'],
    sku: ['SKU', 'sku', 'productId'],
    styleId: ['styleNumber', 'styleId', 'productId'],
    category: ['Category', 'categoryName', 'productType', 'category'],
    size: ['Size', 'sizeName', 'size'],
    color: ['Color', 'colorName', 'color'],
    colorCode: ['ColorHex', 'hex', 'colorCode'],
    price: ['PriceC', 'price', 'baseCost'],  // Tier C pricing is most common
    priceA: ['PriceA'],
    priceB: ['PriceB'],
    priceC: ['PriceC'],
    quantity: ['Inventory', 'stock', 'inventory'],
    weight: ['Weight', 'unitWeight', 'weight'],
    material: ['FabricWeight', 'fabric', 'material', 'composition'],
    description: ['description', 'productDescription'],
    images: ['imageUrls', 'images'],
  },
  
  // Size mappings
  sizes: {
    'S': 'S',
    'M': 'M',
    'L': 'L',
    'XL': 'XL',
    '2XL': '2XL',
    '3XL': '3XL',
    '4XL': '4XL',
    'LG': 'L',  // SanMar uses "LG"
    'SMALL': 'S',
    'MEDIUM': 'M',
    'LARGE': 'L',
    'XLARGE': 'XL',
    'X-LARGE': 'XL',
    'XSMALL': 'XS',
    'X-SMALL': 'XS',
  },
  
  // Color mappings
  colors: {
    'BLACK': 'Black',
    'WHITE': 'White',
    'NAVY': 'Navy',
    'TRUE RED': 'Red',
    'RED': 'Red',
    'VINTAGE HEATHER': 'Heather Gray',
    'HEATHER GRAY': 'Heather Gray',
    'ROYAL': 'Royal Blue',
    'ROYAL BLUE': 'Royal Blue',
    'CHARCOAL': 'Charcoal',
    'MAROON': 'Maroon',
    'FOREST': 'Forest Green',
    'FOREST GREEN': 'Forest Green',
    'KELLY': 'Kelly Green',
    'KELLY GREEN': 'Kelly Green',
    'PURPLE': 'Purple',
    'ORANGE': 'Orange',
    'GOLD': 'Yellow',
    'YELLOW': 'Yellow',
    'PINK': 'Pink',
    'CAROLINA BLUE': 'Light Blue',
    'LIGHT BLUE': 'Light Blue',
  },
  
  // SKU format: BRAND-STYLE-COLOR-SIZE (e.g., GIL-G500-BLACK-LARGE)
  skuParser: (sku: string) => {
    const parts = sku.split('-');
    return {
      brand: parts[0] || '',
      style: parts[1] || '',
      color: parts[2] || '',
      size: parts[3] || '',
    };
  },
};

// Register the mapping
registerMapping(SanMarMapping);
