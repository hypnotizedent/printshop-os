/**
 * SKU Mapper - Generates internal SKUs from product attributes
 */

import { SKUGenerationOptions } from '../types';

/**
 * Standard size code mappings
 */
export const SIZE_CODES: Record<string, string> = {
  'Small': 'SM',
  'Medium': 'MD',
  'Large': 'LG',
  'X-Large': 'XL',
  '2X-Large': '2XL',
  '3X-Large': '3XL',
  '4X-Large': '4XL',
  '5X-Large': '5XL',
  'XS': 'XS',
  'S': 'SM',
  'M': 'MD',
  'L': 'LG',
  'XL': 'XL',
  '2XL': '2XL',
  '3XL': '3XL',
  '4XL': '4XL',
  '5XL': '5XL',
};

/**
 * Standard color code mappings
 */
export const COLOR_CODES: Record<string, string> = {
  'Black': 'BLK',
  'White': 'WHT',
  'Navy': 'NAV',
  'Red': 'RED',
  'Blue': 'BLU',
  'Green': 'GRN',
  'Yellow': 'YEL',
  'Orange': 'ORG',
  'Purple': 'PUR',
  'Pink': 'PNK',
  'Gray': 'GRY',
  'Grey': 'GRY',
  'Heather Gray': 'HGY',
  'Heather Grey': 'HGY',
  'Brown': 'BRN',
  'Tan': 'TAN',
  'Beige': 'BEG',
  'Maroon': 'MAR',
  'Burgundy': 'BRG',
  'Charcoal': 'CHR',
  'Royal Blue': 'RBL',
  'Navy Blue': 'NBL',
  'Light Blue': 'LBL',
  'Dark Blue': 'DBL',
  'Kelly Green': 'KGN',
  'Forest Green': 'FGN',
  'Lime': 'LIM',
  'Mint': 'MNT',
  'Aqua': 'AQU',
  'Teal': 'TEL',
};

/**
 * Standard style code mappings
 */
export const STYLE_CODES: Record<string, string> = {
  'Crew Neck': 'CN',
  'V-Neck': 'VN',
  'Polo': 'PL',
  'Hoodie': 'HD',
  'Zip Hoodie': 'ZH',
  'Tank Top': 'TK',
  'Long Sleeve': 'LS',
  'Short Sleeve': 'SS',
  'Sleeveless': 'SL',
  'Quarter Zip': 'QZ',
  'Henley': 'HN',
};

/**
 * Generate internal SKU from product and variant attributes
 * 
 * @param options - SKU generation options
 * @returns Generated SKU string
 * 
 * @example
 * generateInternalSKU({ baseSKU: 'GLD-5000', color: 'Black', size: 'L' })
 * // Returns: 'GLD-5000-BLK-LG'
 */
export function generateInternalSKU(options: SKUGenerationOptions): string {
  const { baseSKU, size, color, style } = options;
  
  const parts: string[] = [baseSKU];
  
  if (color) {
    const colorCode = normalizeColorCode(color);
    parts.push(colorCode);
  }
  
  if (size) {
    const sizeCode = normalizeSizeCode(size);
    parts.push(sizeCode);
  }
  
  if (style) {
    const styleCode = normalizeStyleCode(style);
    parts.push(styleCode);
  }
  
  return parts.join('-');
}

/**
 * Normalize size to standard code
 * 
 * @param size - Size string
 * @returns Normalized size code
 */
export function normalizeSizeCode(size: string): string {
  const normalized = size.trim();
  
  // Check exact match first
  if (SIZE_CODES[normalized]) {
    return SIZE_CODES[normalized];
  }
  
  // Check case-insensitive match
  const upperSize = normalized.toUpperCase();
  for (const [key, code] of Object.entries(SIZE_CODES)) {
    if (key.toUpperCase() === upperSize) {
      return code;
    }
  }
  
  // Default: take first 2-3 characters and uppercase
  return normalized.substring(0, Math.min(3, normalized.length)).toUpperCase();
}

/**
 * Normalize color to standard code
 * 
 * @param color - Color string
 * @returns Normalized color code
 */
export function normalizeColorCode(color: string): string {
  const normalized = color.trim();
  
  // Check exact match first
  if (COLOR_CODES[normalized]) {
    return COLOR_CODES[normalized];
  }
  
  // Check case-insensitive match
  const lowerColor = normalized.toLowerCase();
  for (const [key, code] of Object.entries(COLOR_CODES)) {
    if (key.toLowerCase() === lowerColor) {
      return code;
    }
  }
  
  // Default: take first 3 characters and uppercase
  return normalized.substring(0, 3).toUpperCase();
}

/**
 * Normalize style to standard code
 * 
 * @param style - Style string
 * @returns Normalized style code
 */
export function normalizeStyleCode(style: string): string {
  const normalized = style.trim();
  
  // Check exact match first
  if (STYLE_CODES[normalized]) {
    return STYLE_CODES[normalized];
  }
  
  // Check case-insensitive match
  const lowerStyle = normalized.toLowerCase();
  for (const [key, code] of Object.entries(STYLE_CODES)) {
    if (key.toLowerCase() === lowerStyle) {
      return code;
    }
  }
  
  // Default: take first 2 characters and uppercase
  return normalized.substring(0, 2).toUpperCase();
}

/**
 * Parse SKU into components
 * 
 * @param sku - SKU string to parse
 * @returns Parsed SKU components
 */
export function parseSKU(sku: string): {
  baseSKU?: string;
  colorCode?: string;
  sizeCode?: string;
  styleCode?: string;
} {
  const parts = sku.split('-');
  
  if (parts.length < 2) {
    return { baseSKU: sku };
  }
  
  // Assume format: BASE-COLOR-SIZE-STYLE or BASE-COLOR-SIZE
  const result: any = {};
  
  if (parts.length === 2) {
    // BASE-COLOR
    result.baseSKU = parts[0];
    result.colorCode = parts[1];
  } else if (parts.length === 3) {
    // BASE-COLOR-SIZE
    result.baseSKU = parts[0];
    result.colorCode = parts[1];
    result.sizeCode = parts[2];
  } else if (parts.length >= 4) {
    // BASE-COLOR-SIZE-STYLE or BASE-PART2-COLOR-SIZE
    // Assume last is size, second-to-last is color, rest is base
    result.baseSKU = parts.slice(0, -2).join('-');
    result.colorCode = parts[parts.length - 2];
    result.sizeCode = parts[parts.length - 1];
    
    // If 4+ parts, could be style code or part of base SKU
    if (parts.length === 4) {
      result.styleCode = undefined;
    }
  }
  
  return result;
}

/**
 * Validate SKU format
 * 
 * @param sku - SKU to validate
 * @returns True if SKU format is valid
 */
export function isValidSKU(sku: string): boolean {
  // SKU must be non-empty and contain only alphanumeric, hyphens, and underscores
  const skuPattern = /^[A-Z0-9][A-Z0-9\-_]*$/i;
  return skuPattern.test(sku) && sku.length >= 3 && sku.length <= 100;
}
