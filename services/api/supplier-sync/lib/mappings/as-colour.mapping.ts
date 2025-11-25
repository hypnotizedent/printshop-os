/**
 * AS Colour Supplier Mapping Configuration
 */

import { SupplierMapping, registerMapping } from './base.mapping';

export const ASColourMapping: SupplierMapping = {
  supplierId: 'as-colour',
  name: 'AS Colour',
  
  // Field mappings
  fields: {
    brand: 'AS Colour',  // AS Colour is always the brand
    name: ['styleName', 'name', 'title'],
    sku: ['sku', 'id', 'styleCode'],
    styleId: ['styleCode', 'id', 'productId'],
    category: ['productType', 'category', 'categoryName'],
    size: ['sizeName', 'size'],
    color: ['colourName', 'colorName', 'colour', 'color'],
    colorCode: ['hexCode', 'colorHex', 'hex'],
    price: ['price', 'baseCost', 'wholesalePrice'],
    quantity: ['stock', 'inventory', 'quantity'],
    weight: ['weight', 'unitWeight'],
    material: ['composition', 'material', 'fabric'],
    fit: ['fit', 'fitType'],
    description: ['description', 'shortDescription'],
    images: ['images', 'imageURL', 'imageUrls'],
  },
  
  // Size mappings (AS Colour uses standard naming)
  sizes: {
    'S': 'S',
    'M': 'M',
    'L': 'L',
    'XL': 'XL',
    '2XL': '2XL',
    '3XL': '3XL',
    'XS': 'XS',
    'SMALL': 'S',
    'MEDIUM': 'M',
    'LARGE': 'L',
    'XLARGE': 'XL',
    'X-LARGE': 'XL',
    '2XLARGE': '2XL',
    '2X-LARGE': '2XL',
  },
  
  // Color mappings (AS Colour typically uses full color names)
  colors: {
    'BLACK': 'Black',
    'WHITE': 'White',
    'NAVY': 'Navy',
    'RED': 'Red',
    'GREY': 'Gray',
    'GRAY': 'Gray',
    'CHARCOAL': 'Charcoal',
    'ROYAL': 'Royal Blue',
    'ROYAL BLUE': 'Royal Blue',
    'MAROON': 'Maroon',
    'FOREST': 'Forest Green',
    'FOREST GREEN': 'Forest Green',
    'KELLY': 'Kelly Green',
    'KELLY GREEN': 'Kelly Green',
    'PURPLE': 'Purple',
    'ORANGE': 'Orange',
    'YELLOW': 'Yellow',
    'GOLD': 'Yellow',
    'PINK': 'Pink',
    'LIGHT BLUE': 'Light Blue',
    'SKY BLUE': 'Light Blue',
    'SAND': 'Sand',
    'TAN': 'Sand',
    'NATURAL': 'Sand',
    'KHAKI': 'Sand',
    'MINT': 'Mint',
    'LAVENDER': 'Lavender',
    'CORAL': 'Coral',
    'SALMON': 'Coral',
  },
  
  // SKU format: AS-STYLE-COLOR-SIZE (e.g., AS-5001-BLACK-M)
  skuParser: (sku: string) => {
    const parts = sku.split('-');
    return {
      brand: 'AS Colour',
      style: parts[1] || parts[0] || '',
      color: parts[2] || '',
      size: parts[3] || '',
    };
  },
};

// Register the mapping
registerMapping(ASColourMapping);
