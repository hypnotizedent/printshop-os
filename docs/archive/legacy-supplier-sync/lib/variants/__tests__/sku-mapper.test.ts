/**
 * Tests for SKU Mapper
 */

import {
  generateInternalSKU,
  normalizeSizeCode,
  normalizeColorCode,
  normalizeStyleCode,
  parseSKU,
  isValidSKU,
  SIZE_CODES,
  COLOR_CODES,
  STYLE_CODES,
} from '../sku-mapper';

describe('SKU Mapper', () => {
  describe('generateInternalSKU', () => {
    it('should generate SKU with base only', () => {
      const sku = generateInternalSKU({ baseSKU: 'GLD-5000' });
      expect(sku).toBe('GLD-5000');
    });

    it('should generate SKU with color', () => {
      const sku = generateInternalSKU({ baseSKU: 'GLD-5000', color: 'Black' });
      expect(sku).toBe('GLD-5000-BLK');
    });

    it('should generate SKU with color and size', () => {
      const sku = generateInternalSKU({ 
        baseSKU: 'GLD-5000', 
        color: 'Black', 
        size: 'Large' 
      });
      expect(sku).toBe('GLD-5000-BLK-LG');
    });

    it('should generate SKU with all attributes', () => {
      const sku = generateInternalSKU({ 
        baseSKU: 'BLC-3001', 
        color: 'Navy', 
        size: 'XL', 
        style: 'V-Neck' 
      });
      expect(sku).toBe('BLC-3001-NAV-XL-VN');
    });

    it('should handle unknown color', () => {
      const sku = generateInternalSKU({ 
        baseSKU: 'TST-100', 
        color: 'Sunset Orange' 
      });
      expect(sku).toBe('TST-100-SUN');
    });

    it('should handle unknown size', () => {
      const sku = generateInternalSKU({ 
        baseSKU: 'TST-100', 
        size: 'Youth Medium' 
      });
      expect(sku).toBe('TST-100-YOU');
    });
  });

  describe('normalizeSizeCode', () => {
    it('should normalize standard sizes', () => {
      expect(normalizeSizeCode('Small')).toBe('SM');
      expect(normalizeSizeCode('Medium')).toBe('MD');
      expect(normalizeSizeCode('Large')).toBe('LG');
      expect(normalizeSizeCode('X-Large')).toBe('XL');
      expect(normalizeSizeCode('2X-Large')).toBe('2XL');
    });

    it('should handle abbreviated sizes', () => {
      expect(normalizeSizeCode('S')).toBe('SM');
      expect(normalizeSizeCode('M')).toBe('MD');
      expect(normalizeSizeCode('L')).toBe('LG');
      expect(normalizeSizeCode('XL')).toBe('XL');
      expect(normalizeSizeCode('2XL')).toBe('2XL');
    });

    it('should be case-insensitive', () => {
      expect(normalizeSizeCode('SMALL')).toBe('SM');
      expect(normalizeSizeCode('small')).toBe('SM');
      expect(normalizeSizeCode('SmaLL')).toBe('SM');
    });

    it('should handle unknown sizes', () => {
      const code = normalizeSizeCode('Custom Size');
      expect(code).toBe('CUS');
    });

    it('should handle single character sizes', () => {
      const code = normalizeSizeCode('P');
      expect(code).toBe('P');
    });
  });

  describe('normalizeColorCode', () => {
    it('should normalize standard colors', () => {
      expect(normalizeColorCode('Black')).toBe('BLK');
      expect(normalizeColorCode('White')).toBe('WHT');
      expect(normalizeColorCode('Navy')).toBe('NAV');
      expect(normalizeColorCode('Red')).toBe('RED');
      expect(normalizeColorCode('Heather Gray')).toBe('HGY');
    });

    it('should be case-insensitive', () => {
      expect(normalizeColorCode('BLACK')).toBe('BLK');
      expect(normalizeColorCode('black')).toBe('BLK');
      expect(normalizeColorCode('BlAcK')).toBe('BLK');
    });

    it('should handle compound colors', () => {
      expect(normalizeColorCode('Royal Blue')).toBe('RBL');
      expect(normalizeColorCode('Kelly Green')).toBe('KGN');
    });

    it('should handle unknown colors', () => {
      const code = normalizeColorCode('Sunset Pink');
      expect(code).toBe('SUN');
    });
  });

  describe('normalizeStyleCode', () => {
    it('should normalize standard styles', () => {
      expect(normalizeStyleCode('Crew Neck')).toBe('CN');
      expect(normalizeStyleCode('V-Neck')).toBe('VN');
      expect(normalizeStyleCode('Hoodie')).toBe('HD');
      expect(normalizeStyleCode('Polo')).toBe('PL');
    });

    it('should be case-insensitive', () => {
      expect(normalizeStyleCode('CREW NECK')).toBe('CN');
      expect(normalizeStyleCode('crew neck')).toBe('CN');
    });

    it('should handle unknown styles', () => {
      const code = normalizeStyleCode('Custom Style');
      expect(code).toBe('CU');
    });
  });

  describe('parseSKU', () => {
    it('should parse SKU with only base', () => {
      const parsed = parseSKU('GLD-5000');
      expect(parsed.baseSKU).toBe('GLD');
      expect(parsed.colorCode).toBe('5000');
    });

    it('should parse SKU with color and size', () => {
      const parsed = parseSKU('GLD-5000-BLK-LG');
      expect(parsed.colorCode).toBe('BLK');
      expect(parsed.sizeCode).toBe('LG');
    });

    it('should handle simple SKU', () => {
      const parsed = parseSKU('SIMPLE');
      expect(parsed.baseSKU).toBe('SIMPLE');
    });
  });

  describe('isValidSKU', () => {
    it('should validate correct SKUs', () => {
      expect(isValidSKU('GLD-5000')).toBe(true);
      expect(isValidSKU('GLD-5000-BLK-LG')).toBe(true);
      expect(isValidSKU('ABC_123')).toBe(true);
      expect(isValidSKU('TEST-SKU-123')).toBe(true);
    });

    it('should reject invalid SKUs', () => {
      expect(isValidSKU('')).toBe(false);
      expect(isValidSKU('AB')).toBe(false);
      expect(isValidSKU('SKU WITH SPACES')).toBe(false);
      expect(isValidSKU('SKU@INVALID')).toBe(false);
      expect(isValidSKU('a'.repeat(101))).toBe(false);
    });

    it('should accept alphanumeric with hyphens and underscores', () => {
      expect(isValidSKU('ABC-123_XYZ')).toBe(true);
      expect(isValidSKU('SKU_001-BLK')).toBe(true);
    });
  });

  describe('SIZE_CODES', () => {
    it('should contain standard sizes', () => {
      expect(SIZE_CODES['Small']).toBe('SM');
      expect(SIZE_CODES['Medium']).toBe('MD');
      expect(SIZE_CODES['Large']).toBe('LG');
      expect(SIZE_CODES['XL']).toBe('XL');
    });
  });

  describe('COLOR_CODES', () => {
    it('should contain standard colors', () => {
      expect(COLOR_CODES['Black']).toBe('BLK');
      expect(COLOR_CODES['White']).toBe('WHT');
      expect(COLOR_CODES['Navy']).toBe('NAV');
    });
  });

  describe('STYLE_CODES', () => {
    it('should contain standard styles', () => {
      expect(STYLE_CODES['Crew Neck']).toBe('CN');
      expect(STYLE_CODES['V-Neck']).toBe('VN');
      expect(STYLE_CODES['Hoodie']).toBe('HD');
    });
  });
});
