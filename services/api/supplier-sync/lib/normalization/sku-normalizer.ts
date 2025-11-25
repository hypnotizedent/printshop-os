/**
 * SKU Normalizer
 * Generates consistent internal SKU format from supplier SKUs
 * Internal format: BRAND-STYLE-COLOR-SIZE
 */

const BRAND_CODES: Record<string, string> = {
  'GILDAN': 'GLD',
  'BELLA+CANVAS': 'BLC',
  'BELLA CANVAS': 'BLC',
  'BELLACANVAS': 'BLC',
  'NEXT LEVEL': 'NXL',
  'NEXTLEVEL': 'NXL',
  'HANES': 'HNS',
  'FRUIT OF THE LOOM': 'FOL',
  'AMERICAN APPAREL': 'AAL',
  'AS COLOUR': 'ASC',
  'ASCOLOUR': 'ASC',
  'PORT & COMPANY': 'P&C',
  'PORT AUTHORITY': 'PA',
  'SPORT-TEK': 'STK',
  'DISTRICT': 'DST',
  'ANVIL': 'ANV',
  'COMFORT COLORS': 'CC',
  'COMFORTCOLORS': 'CC',
  'JERZEES': 'JRZ',
  'CHAMPION': 'CHP',
};

const COLOR_CODES: Record<string, string> = {
  'Black': 'BLK',
  'White': 'WHT',
  'Navy': 'NAV',
  'Red': 'RED',
  'Heather Gray': 'HGR',
  'Royal Blue': 'RYL',
  'Charcoal': 'CHR',
  'Maroon': 'MAR',
  'Forest Green': 'FGR',
  'Kelly Green': 'KGR',
  'Purple': 'PRP',
  'Orange': 'ORG',
  'Yellow': 'YEL',
  'Pink': 'PNK',
  'Light Blue': 'LBL',
  'Brown': 'BRN',
  'Gray': 'GRY',
  'Dark Gray': 'DGR',
  'Light Gray': 'LGR',
  'Olive': 'OLV',
  'Lime': 'LIM',
  'Turquoise': 'TRQ',
  'Sand': 'SND',
  'Mint': 'MNT',
  'Lavender': 'LAV',
  'Coral': 'CRL',
  'Heather Navy': 'HNV',
  'Heather Red': 'HRD',
  'Heather Royal': 'HRY',
  'Heather Green': 'HGN',
};

/**
 * Normalize SKU to internal format
 */
export function normalizeSKU(
  supplierSKU: string,
  supplierId: string,
  brand: string,
  style: string,
  color: string,
  size: string
): string {
  // Get brand code
  const brandUpper = brand.toUpperCase();
  const brandCode = BRAND_CODES[brandUpper] || brand.substring(0, 3).toUpperCase();
  
  // Clean and truncate style code
  const styleCode = style.replace(/[^A-Z0-9]/gi, '').substring(0, 6).toUpperCase();
  
  // Get color code
  const colorCode = COLOR_CODES[color] || color.substring(0, 3).toUpperCase();
  
  // Use size as-is
  const sizeCode = size;
  
  return `${brandCode}-${styleCode}-${colorCode}-${sizeCode}`;
}

/**
 * Parse internal SKU format back to components
 */
export function parseSKU(sku: string): {
  brandCode: string;
  styleCode: string;
  colorCode: string;
  sizeCode: string;
} | null {
  const parts = sku.split('-');
  
  if (parts.length !== 4) {
    return null;
  }
  
  return {
    brandCode: parts[0],
    styleCode: parts[1],
    colorCode: parts[2],
    sizeCode: parts[3],
  };
}

/**
 * Validate internal SKU format
 */
export function isValidInternalSKU(sku: string): boolean {
  // Format: BRAND-STYLE-COLOR-SIZE
  // Note: Size code can contain spaces for youth sizes like "Youth XL"
  const regex = /^[A-Z]{2,3}-[A-Z0-9]{1,6}-[A-Z]{3}-[A-Z0-9]+(\s[A-Z0-9]+)?$/;
  return regex.test(sku);
}

/**
 * Get brand code from brand name
 */
export function getBrandCode(brand: string): string {
  const brandUpper = brand.toUpperCase();
  return BRAND_CODES[brandUpper] || brand.substring(0, 3).toUpperCase();
}

/**
 * Get color code from color name
 */
export function getColorCode(color: string): string {
  return COLOR_CODES[color] || color.substring(0, 3).toUpperCase();
}
