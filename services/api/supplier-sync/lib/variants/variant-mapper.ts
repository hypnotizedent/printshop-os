/**
 * Variant Mapper - Normalizes supplier data to internal format
 */

/**
 * Normalize size from supplier format
 * 
 * @param supplierSize - Size string from supplier
 * @returns Normalized size string
 */
export function normalizeSize(supplierSize: string): string {
  const normalized = supplierSize.trim().toUpperCase();
  
  const sizeMap: Record<string, string> = {
    'SMALL': 'S',
    'SM': 'S',
    'MEDIUM': 'M',
    'MED': 'M',
    'MD': 'M',
    'LARGE': 'L',
    'LG': 'L',
    'XLARGE': 'XL',
    'X-LARGE': 'XL',
    'EXTRA LARGE': 'XL',
    '2XLARGE': '2XL',
    '2X-LARGE': '2XL',
    '2X': '2XL',
    '3XLARGE': '3XL',
    '3X-LARGE': '3XL',
    '3X': '3XL',
    '4XLARGE': '4XL',
    '4X-LARGE': '4XL',
    '4X': '4XL',
    '5XLARGE': '5XL',
    '5X-LARGE': '5XL',
    '5X': '5XL',
    'XSMALL': 'XS',
    'X-SMALL': 'XS',
    'EXTRA SMALL': 'XS',
    'XXS': 'XXS',
    'YOUTH SMALL': 'YS',
    'YOUTH MEDIUM': 'YM',
    'YOUTH LARGE': 'YL',
    'YOUTH XL': 'YXL',
  };
  
  return sizeMap[normalized] || supplierSize.trim();
}

/**
 * Normalize color from supplier format
 * 
 * @param supplierColor - Color string from supplier
 * @returns Normalized color string
 */
export function normalizeColor(supplierColor: string): string {
  const normalized = supplierColor.trim().toLowerCase();
  
  const colorMap: Record<string, string> = {
    'blk': 'Black',
    'black': 'Black',
    'wht': 'White',
    'white': 'White',
    'nvy': 'Navy',
    'navy': 'Navy',
    'navy blue': 'Navy',
    'rd': 'Red',
    'red': 'Red',
    'blu': 'Blue',
    'blue': 'Blue',
    'grn': 'Green',
    'green': 'Green',
    'yel': 'Yellow',
    'yellow': 'Yellow',
    'org': 'Orange',
    'orange': 'Orange',
    'pur': 'Purple',
    'purple': 'Purple',
    'pnk': 'Pink',
    'pink': 'Pink',
    'gry': 'Gray',
    'gray': 'Gray',
    'grey': 'Gray',
    'heather gray': 'Heather Gray',
    'heather grey': 'Heather Gray',
    'hgray': 'Heather Gray',
    'hgrey': 'Heather Gray',
    'brn': 'Brown',
    'brown': 'Brown',
    'tan': 'Tan',
    'beige': 'Beige',
    'maroon': 'Maroon',
    'burgundy': 'Burgundy',
    'charcoal': 'Charcoal',
    'royal blue': 'Royal Blue',
    'light blue': 'Light Blue',
    'dark blue': 'Dark Blue',
    'kelly green': 'Kelly Green',
    'forest green': 'Forest Green',
    'lime': 'Lime',
    'mint': 'Mint',
    'aqua': 'Aqua',
    'teal': 'Teal',
  };
  
  if (colorMap[normalized]) {
    return colorMap[normalized];
  }
  
  // Capitalize first letter of each word
  return supplierColor
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Calculate markup price
 * 
 * @param cost - Wholesale cost
 * @param markupPercentage - Markup percentage (e.g., 80 for 80%)
 * @returns Calculated retail price
 */
export function calculateMarkup(cost: number, markupPercentage: number): number {
  return parseFloat((cost * (1 + markupPercentage / 100)).toFixed(2));
}

/**
 * Determine inventory status based on quantity
 * 
 * @param quantity - Inventory quantity
 * @param lowStockThreshold - Threshold for low stock (default: 50)
 * @returns Inventory status
 */
export function determineInventoryStatus(
  quantity: number,
  lowStockThreshold: number = 50
): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (quantity === 0) {
    return 'out_of_stock';
  } else if (quantity < lowStockThreshold) {
    return 'low_stock';
  } else {
    return 'in_stock';
  }
}

/**
 * Parse hex color code
 * 
 * @param colorName - Color name
 * @returns Hex color code or null
 */
export function getColorHex(colorName: string): string | null {
  const colorHexMap: Record<string, string> = {
    'Black': '#000000',
    'White': '#FFFFFF',
    'Navy': '#000080',
    'Red': '#FF0000',
    'Blue': '#0000FF',
    'Green': '#008000',
    'Yellow': '#FFFF00',
    'Orange': '#FFA500',
    'Purple': '#800080',
    'Pink': '#FFC0CB',
    'Gray': '#808080',
    'Heather Gray': '#B8B8B8',
    'Brown': '#8B4513',
    'Tan': '#D2B48C',
    'Beige': '#F5F5DC',
    'Maroon': '#800000',
    'Burgundy': '#800020',
    'Charcoal': '#36454F',
    'Royal Blue': '#4169E1',
    'Light Blue': '#ADD8E6',
    'Dark Blue': '#00008B',
    'Kelly Green': '#4CBB17',
    'Forest Green': '#228B22',
    'Lime': '#00FF00',
    'Mint': '#98FF98',
    'Aqua': '#00FFFF',
    'Teal': '#008080',
  };
  
  return colorHexMap[colorName] || null;
}

/**
 * Validate variant data
 * 
 * @param variant - Variant data to validate
 * @returns Validation result with errors
 */
export function validateVariantData(variant: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!variant.sku || typeof variant.sku !== 'string') {
    errors.push('SKU is required and must be a string');
  }
  
  if (variant.price === undefined || typeof variant.price !== 'number' || variant.price < 0) {
    errors.push('Price is required and must be a non-negative number');
  }
  
  if (variant.wholesaleCost === undefined || typeof variant.wholesaleCost !== 'number' || variant.wholesaleCost < 0) {
    errors.push('Wholesale cost is required and must be a non-negative number');
  }
  
  if (variant.price !== undefined && variant.wholesaleCost !== undefined && variant.price < variant.wholesaleCost) {
    errors.push('Price must be greater than or equal to wholesale cost');
  }
  
  if (variant.inventoryQty !== undefined && (typeof variant.inventoryQty !== 'number' || variant.inventoryQty < 0)) {
    errors.push('Inventory quantity must be a non-negative number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
