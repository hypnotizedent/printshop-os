/**
 * SS Activewear Supplier Mapping Configuration
 */

import { SupplierMapping, registerMapping } from './base.mapping';

export const SSActivewearMapping: SupplierMapping = {
  supplierId: 'ss-activewear',
  name: 'SS Activewear',
  
  // Field mappings
  fields: {
    brand: ['brandName', 'brand'],
    name: ['styleName', 'title', 'name'],
    sku: ['styleColorSizeId', 'sku', 'itemSku'],
    styleId: ['styleID', 'styleId', 'styleCode', 'style'],
    category: ['productCategory', 'baseCategory', 'categoryName', 'category'],
    size: ['sizeName', 'size'],
    color: ['colorName', 'color'],
    colorCode: ['colorHexCode', 'hex'],
    price: ['wholeSalePrice', 'price', 'baseCost'],
    quantity: ['warehouseQty', 'inventory', 'stock'],
    weight: ['unitWeight', 'weight'],
    material: ['fabricContent', 'fabric', 'material'],
    description: ['styleDescription', 'description'],
    images: ['mediaUrls', 'imageUrls', 'images'],
  },
  
  // Size mappings
  sizes: {
    'SMALL': 'S',
    'MEDIUM': 'M',
    'LARGE': 'L',
    'XLARGE': 'XL',
    'X-LARGE': 'XL',
    '2XLARGE': '2XL',
    '2X-LARGE': '2XL',
    '3XLARGE': '3XL',
    '3X-LARGE': '3XL',
    '4XLARGE': '4XL',
    '4X-LARGE': '4XL',
    'XSMALL': 'XS',
    'X-SMALL': 'XS',
  },
  
  // Color mappings
  colors: {
    'BLK': 'Black',
    'WHT': 'White',
    'NVY': 'Navy',
    'RD': 'Red',
    'HGRY': 'Heather Gray',
    'ROYAL': 'Royal Blue',
    'CHAR': 'Charcoal',
    'MAROON': 'Maroon',
    'FOREST': 'Forest Green',
    'KELLY': 'Kelly Green',
    'PURPLE': 'Purple',
    'ORANGE': 'Orange',
    'YELLOW': 'Yellow',
    'PINK': 'Pink',
    'LT BLUE': 'Light Blue',
  },
  
  // SKU format: SSACT_BRAND_STYLE_COLOR_SIZE
  skuParser: (sku: string) => {
    const parts = sku.split('_');
    return {
      prefix: parts[0],
      brand: parts[1],
      style: parts[2] || '',
      color: parts[3] || '',
      size: parts[4] || '',
    };
  },
};

// Register the mapping
registerMapping(SSActivewearMapping);
