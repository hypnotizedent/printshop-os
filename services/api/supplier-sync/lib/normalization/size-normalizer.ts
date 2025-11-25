/**
 * Size Normalizer
 * Normalizes size variations to standard S/M/L/XL/2XL/3XL/4XL/5XL format
 */

const SIZE_MAPPINGS: Record<string, string> = {
  // Standard
  'S': 'S',
  'M': 'M',
  'L': 'L',
  'XL': 'XL',
  '2XL': '2XL',
  '3XL': '3XL',
  '4XL': '4XL',
  '5XL': '5XL',
  
  // Spelled out
  'SMALL': 'S',
  'MEDIUM': 'M',
  'LARGE': 'L',
  'XLARGE': 'XL',
  'X-LARGE': 'XL',
  'EXTRA LARGE': 'XL',
  '2XLARGE': '2XL',
  '2X-LARGE': '2XL',
  '2X LARGE': '2XL',
  '3XLARGE': '3XL',
  '3X-LARGE': '3XL',
  '3X LARGE': '3XL',
  '4XLARGE': '4XL',
  '4X-LARGE': '4XL',
  '4X LARGE': '4XL',
  '5XLARGE': '5XL',
  '5X-LARGE': '5XL',
  '5X LARGE': '5XL',
  
  // Abbreviations
  'SM': 'S',
  'MD': 'M',
  'MED': 'M',
  'LG': 'L',
  'LRG': 'L',
  'XXL': '2XL',
  'XXXL': '3XL',
  'XXXXL': '4XL',
  'XXXXXL': '5XL',
  
  // Youth sizes
  'YXS': 'Youth XS',
  'YS': 'Youth S',
  'YM': 'Youth M',
  'YL': 'Youth L',
  'YXL': 'Youth XL',
  'YOUTH XS': 'Youth XS',
  'YOUTH SMALL': 'Youth S',
  'YOUTH MEDIUM': 'Youth M',
  'YOUTH LARGE': 'Youth L',
  'YOUTH XL': 'Youth XL',
  
  // Extra small
  'XS': 'XS',
  'XSMALL': 'XS',
  'X-SMALL': 'XS',
  'EXTRA SMALL': 'XS',
  
  // One size
  'OS': 'One Size',
  'ONE SIZE': 'One Size',
  'OSFA': 'One Size',
  'ONE SIZE FITS ALL': 'One Size',
};

/**
 * Normalize a size string to standard format
 */
export function normalizeSize(size: string | null | undefined): string {
  if (!size) return 'Unknown';
  
  const normalized = size.trim().toUpperCase();
  return SIZE_MAPPINGS[normalized] || size;
}

/**
 * Check if a size is valid (exists in mappings)
 */
export function isValidSize(size: string | null | undefined): boolean {
  if (!size) return false;
  const normalized = size.trim().toUpperCase();
  return normalized in SIZE_MAPPINGS;
}

/**
 * Get all supported standard sizes
 */
export function getStandardSizes(): string[] {
  return ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
}

/**
 * Get all youth sizes
 */
export function getYouthSizes(): string[] {
  return ['Youth XS', 'Youth S', 'Youth M', 'Youth L', 'Youth XL'];
}
