/**
 * Attribute Mapper
 * Extracts and normalizes product attributes from supplier data
 */

import { SupplierMapping } from '../mappings/base.mapping';

/**
 * Extract field value from supplier data using mapping configuration
 */
export function extractField(
  data: any,
  fieldPath: string | string[],
  defaultValue: any = null
): any {
  if (!data) return defaultValue;
  
  const paths = Array.isArray(fieldPath) ? fieldPath : [fieldPath];
  
  for (const path of paths) {
    // If path doesn't contain dots and doesn't exist as a key, treat it as a constant value
    if (!path.includes('.') && !Object.prototype.hasOwnProperty.call(data, path)) {
      // Return the path itself as a constant if it looks like a value (contains spaces or special chars)
      if (path.includes(' ') || path.match(/[A-Z][a-z]/) || path === path) {
        // This might be a constant value, continue to next path
        continue;
      }
    }
    
    const value = getNestedValue(data, path);
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  
  // If no paths worked and the first path looks like a constant string, return it
  const firstPath = paths[0];
  if (typeof firstPath === 'string' && (firstPath.includes(' ') || /^[A-Z]/.test(firstPath))) {
    return firstPath;
  }
  
  return defaultValue;
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

/**
 * Extract all fields from supplier data using mapping
 */
export function extractFields(
  supplierData: any,
  mapping: SupplierMapping
): Record<string, any> {
  const extracted: Record<string, any> = {};
  
  for (const [key, fieldPath] of Object.entries(mapping.fields)) {
    extracted[key] = extractField(supplierData, fieldPath);
  }
  
  return extracted;
}

/**
 * Normalize brand name
 */
export function normalizeBrand(brand: string | null | undefined): string {
  if (!brand) return 'Unknown';
  
  // Clean and standardize brand names
  const normalized = brand.trim()
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/[^\w\s&+\-]/gi, '');  // Remove special chars except &, +, -
  
  // Common brand normalization
  const brandMap: Record<string, string> = {
    'BELLA CANVAS': 'Bella+Canvas',
    'BELLACANVAS': 'Bella+Canvas',
    'BELLA+CANVAS': 'Bella+Canvas',
    'NEXT LEVEL': 'Next Level',
    'NEXTLEVEL': 'Next Level',
    'AS COLOUR': 'AS Colour',
    'ASCOLOUR': 'AS Colour',
    'FRUIT OF THE LOOM': 'Fruit of the Loom',
    'PORT & COMPANY': 'Port & Company',
    'PORT AUTHORITY': 'Port Authority',
    'SPORT-TEK': 'Sport-Tek',
    'COMFORT COLORS': 'Comfort Colors',
    'COMFORTCOLORS': 'Comfort Colors',
  };
  
  const upperBrand = normalized.toUpperCase();
  return brandMap[upperBrand] || normalized;
}

/**
 * Normalize product name
 */
export function normalizeName(
  name: string | null | undefined,
  brand?: string | null
): string {
  if (!name) return 'Unknown';
  
  let normalized = name.trim()
    .replace(/\s+/g, ' ');  // Normalize whitespace
  
  // Remove brand prefix if present
  if (brand) {
    const brandRegex = new RegExp(`^${brand}\\s+`, 'i');
    normalized = normalized.replace(brandRegex, '');
  }
  
  return normalized;
}

/**
 * Normalize category
 */
export function normalizeCategory(category: string | null | undefined): string {
  if (!category) return 'Apparel';
  
  const normalized = category.trim();
  
  // Map common category variations
  const categoryMap: Record<string, string> = {
    'T-SHIRTS': 'T-Shirts',
    'TSHIRTS': 'T-Shirts',
    'TEE': 'T-Shirts',
    'TEES': 'T-Shirts',
    'HOODIES': 'Hoodies',
    'HOODIE': 'Hoodies',
    'SWEATSHIRT': 'Sweatshirts',
    'SWEATSHIRTS': 'Sweatshirts',
    'POLO': 'Polos',
    'POLOS': 'Polos',
    'TANK': 'Tank Tops',
    'TANKS': 'Tank Tops',
    'TANK TOP': 'Tank Tops',
    'TANK TOPS': 'Tank Tops',
    'LONG SLEEVE': 'Long Sleeve',
    'LONGSLEEVE': 'Long Sleeve',
    'HAT': 'Headwear',
    'HATS': 'Headwear',
    'CAP': 'Headwear',
    'CAPS': 'Headwear',
    'HEADWEAR': 'Headwear',
    'BAG': 'Bags',
    'BAGS': 'Bags',
    'TOTE': 'Bags',
    'TOTES': 'Bags',
  };
  
  const upperCategory = normalized.toUpperCase();
  return categoryMap[upperCategory] || normalized;
}

/**
 * Normalize weight (convert to oz)
 */
export function normalizeWeight(weight: string | number | null | undefined): number | null {
  if (!weight) return null;
  
  if (typeof weight === 'number') {
    return weight;
  }
  
  // Parse weight string (e.g., "5.0 oz", "150g")
  const weightStr = weight.toString().toLowerCase();
  const match = weightStr.match(/(\d+\.?\d*)\s*(oz|g|gram|grams)?/);
  
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    // Convert grams to oz (1 oz = 28.35g)
    if (unit && (unit === 'g' || unit === 'gram' || unit === 'grams')) {
      return value / 28.35;
    }
    
    return value;
  }
  
  return null;
}

/**
 * Normalize material/fabric
 */
export function normalizeMaterial(material: string | null | undefined): string | null {
  if (!material) return null;
  
  return material.trim()
    .replace(/\s+/g, ' ');
}

/**
 * Normalize fit
 */
export function normalizeFit(fit: string | null | undefined): string | null {
  if (!fit) return null;
  
  const normalized = fit.trim().toUpperCase();
  
  const fitMap: Record<string, string> = {
    'STANDARD': 'Standard',
    'REGULAR': 'Standard',
    'CLASSIC': 'Standard',
    'SLIM': 'Slim',
    'FITTED': 'Slim',
    'RELAXED': 'Relaxed',
    'LOOSE': 'Relaxed',
    'ATHLETIC': 'Athletic',
    'PERFORMANCE': 'Athletic',
  };
  
  return fitMap[normalized] || fit;
}

/**
 * Normalize style code/number
 */
export function normalizeStyle(style: string | null | undefined): string {
  if (!style) return 'Unknown';
  
  return style.trim().toUpperCase();
}
