/**
 * Color Normalizer
 * Normalizes color names and maps to hex codes
 */

import Fuse from 'fuse.js';

export interface ColorMapping {
  name: string;
  hex: string;
  aliases: string[];
}

export interface NormalizedColor {
  name: string;
  hex: string;
}

const COLOR_MAPPINGS: ColorMapping[] = [
  {
    name: 'Black',
    hex: '#000000',
    aliases: ['BLK', 'BLACK', 'NOIR', 'NEGRO', 'SCHWARZ']
  },
  {
    name: 'White',
    hex: '#FFFFFF',
    aliases: ['WHT', 'WHITE', 'BLANC', 'BLANCO', 'WEISS']
  },
  {
    name: 'Navy',
    hex: '#000080',
    aliases: ['NVY', 'NAVY', 'NAVY BLUE', 'DARK BLUE', 'MARINE']
  },
  {
    name: 'Red',
    hex: '#FF0000',
    aliases: ['RD', 'RED', 'TRUE RED', 'CHERRY RED', 'ROUGE']
  },
  {
    name: 'Heather Gray',
    hex: '#B0B0B0',
    aliases: ['HGRY', 'HEATHER GREY', 'HEATHER GRAY', 'H.GREY', 'H.GRAY', 'HTH GRY']
  },
  {
    name: 'Royal Blue',
    hex: '#4169E1',
    aliases: ['ROYAL', 'ROYAL BLUE', 'RYL BLU', 'ROYAL BLU']
  },
  {
    name: 'Charcoal',
    hex: '#36454F',
    aliases: ['CHARCOAL', 'CHAR', 'CHARCOAL GRAY', 'CHARCOAL GREY', 'CHR']
  },
  {
    name: 'Navy',
    hex: '#000080',
    aliases: ['NAVY', 'NVY', 'DARK BLUE', 'NAVY BLUE']
  },
  {
    name: 'Maroon',
    hex: '#800000',
    aliases: ['MAROON', 'BURGUNDY', 'WINE', 'CARDINAL']
  },
  {
    name: 'Forest Green',
    hex: '#228B22',
    aliases: ['FOREST', 'FOREST GREEN', 'DARK GREEN', 'FRS GRN']
  },
  {
    name: 'Kelly Green',
    hex: '#4CBB17',
    aliases: ['KELLY', 'KELLY GREEN', 'IRISH GREEN', 'KLY GRN']
  },
  {
    name: 'Purple',
    hex: '#800080',
    aliases: ['PURPLE', 'PRPL', 'VIOLET', 'PLUM']
  },
  {
    name: 'Orange',
    hex: '#FFA500',
    aliases: ['ORANGE', 'ORG', 'SAFETY ORANGE', 'BRIGHT ORANGE']
  },
  {
    name: 'Yellow',
    hex: '#FFFF00',
    aliases: ['YELLOW', 'YLW', 'GOLD', 'BRIGHT YELLOW']
  },
  {
    name: 'Pink',
    hex: '#FFC0CB',
    aliases: ['PINK', 'PNK', 'LIGHT PINK', 'HOT PINK']
  },
  {
    name: 'Light Blue',
    hex: '#ADD8E6',
    aliases: ['LIGHT BLUE', 'LT BLUE', 'LT BLU', 'CAROLINA BLUE', 'SKY BLUE']
  },
  {
    name: 'Brown',
    hex: '#A52A2A',
    aliases: ['BROWN', 'BRN', 'CHOCOLATE', 'TAN']
  },
  {
    name: 'Gray',
    hex: '#808080',
    aliases: ['GRAY', 'GREY', 'GRY', 'SILVER']
  },
  {
    name: 'Dark Gray',
    hex: '#A9A9A9',
    aliases: ['DARK GRAY', 'DARK GREY', 'DK GRAY', 'DK GREY', 'SLATE']
  },
  {
    name: 'Light Gray',
    hex: '#D3D3D3',
    aliases: ['LIGHT GRAY', 'LIGHT GREY', 'LT GRAY', 'LT GREY', 'ASH']
  },
  {
    name: 'Olive',
    hex: '#808000',
    aliases: ['OLIVE', 'OLIVE GREEN', 'MILITARY GREEN', 'OLV']
  },
  {
    name: 'Lime',
    hex: '#00FF00',
    aliases: ['LIME', 'LIME GREEN', 'NEON GREEN', 'SAFETY GREEN']
  },
  {
    name: 'Turquoise',
    hex: '#40E0D0',
    aliases: ['TURQUOISE', 'TEAL', 'AQUA', 'CYAN']
  },
  {
    name: 'Sand',
    hex: '#C2B280',
    aliases: ['SAND', 'KHAKI', 'BEIGE', 'NATURAL']
  },
  {
    name: 'Mint',
    hex: '#98FF98',
    aliases: ['MINT', 'MINT GREEN', 'SEAFOAM', 'CELADON']
  },
  {
    name: 'Lavender',
    hex: '#E6E6FA',
    aliases: ['LAVENDER', 'LILAC', 'PERIWINKLE', 'LIGHT PURPLE']
  },
  {
    name: 'Coral',
    hex: '#FF7F50',
    aliases: ['CORAL', 'SALMON', 'PEACH']
  },
  {
    name: 'Heather Navy',
    hex: '#3B4D6B',
    aliases: ['HEATHER NAVY', 'HTH NAVY', 'H.NAVY', 'HEATHER NVY']
  },
  {
    name: 'Heather Red',
    hex: '#A8474B',
    aliases: ['HEATHER RED', 'HTH RED', 'H.RED', 'HEATHER RD']
  },
  {
    name: 'Heather Royal',
    hex: '#5A6FA8',
    aliases: ['HEATHER ROYAL', 'HTH ROYAL', 'H.ROYAL', 'HEATHER ROYAL BLUE']
  },
  {
    name: 'Heather Green',
    hex: '#5B7553',
    aliases: ['HEATHER GREEN', 'HTH GREEN', 'H.GREEN', 'HEATHER GRN']
  },
];

// Create Fuse instance for fuzzy matching
const fuse = new Fuse(COLOR_MAPPINGS, {
  keys: ['name', 'aliases'],
  threshold: 0.3,
  includeScore: true,
});

/**
 * Normalize a color name and return standardized name and hex code
 */
export function normalizeColor(color: string | null | undefined): NormalizedColor {
  if (!color) {
    return { name: 'Unknown', hex: '#808080' };
  }
  
  const normalized = color.trim().toUpperCase();
  
  // First, try exact match or alias match
  for (const mapping of COLOR_MAPPINGS) {
    if (mapping.name.toUpperCase() === normalized || 
        mapping.aliases.includes(normalized)) {
      return { name: mapping.name, hex: mapping.hex };
    }
  }
  
  // Try fuzzy match for close variations
  const fuzzyResults = fuse.search(color);
  if (fuzzyResults.length > 0 && fuzzyResults[0].score !== undefined && fuzzyResults[0].score < 0.2) {
    const match = fuzzyResults[0].item;
    return { name: match.name, hex: match.hex };
  }
  
  // Return original if no match (with default gray hex)
  return { name: color, hex: '#808080' };
}

/**
 * Check if a color exists in our mappings
 */
export function isKnownColor(color: string | null | undefined): boolean {
  if (!color) return false;
  
  const normalized = color.trim().toUpperCase();
  
  for (const mapping of COLOR_MAPPINGS) {
    if (mapping.name.toUpperCase() === normalized || 
        mapping.aliases.includes(normalized)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get hex code for a color name
 */
export function getColorHex(colorName: string): string | null {
  const result = normalizeColor(colorName);
  return result.name !== 'Unknown' ? result.hex : null;
}

/**
 * Get all supported color mappings
 */
export function getAllColorMappings(): ColorMapping[] {
  return COLOR_MAPPINGS;
}
