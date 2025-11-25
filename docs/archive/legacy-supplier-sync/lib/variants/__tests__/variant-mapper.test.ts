/**
 * Tests for Variant Mapper
 */

import {
  normalizeSize,
  normalizeColor,
  calculateMarkup,
  determineInventoryStatus,
  getColorHex,
  validateVariantData,
} from '../variant-mapper';

describe('Variant Mapper', () => {
  describe('normalizeSize', () => {
    it('should normalize standard sizes', () => {
      expect(normalizeSize('SMALL')).toBe('S');
      expect(normalizeSize('small')).toBe('S');
      expect(normalizeSize('SM')).toBe('S');
      expect(normalizeSize('MEDIUM')).toBe('M');
      expect(normalizeSize('LARGE')).toBe('L');
      expect(normalizeSize('XLARGE')).toBe('XL');
      expect(normalizeSize('X-LARGE')).toBe('XL');
    });

    it('should handle extended sizes', () => {
      expect(normalizeSize('2XL')).toBe('2XL');
      expect(normalizeSize('2X-LARGE')).toBe('2XL');
      expect(normalizeSize('3XL')).toBe('3XL');
      expect(normalizeSize('4XL')).toBe('4XL');
      expect(normalizeSize('5XL')).toBe('5XL');
    });

    it('should handle youth sizes', () => {
      expect(normalizeSize('YOUTH SMALL')).toBe('YS');
      expect(normalizeSize('YOUTH MEDIUM')).toBe('YM');
      expect(normalizeSize('YOUTH LARGE')).toBe('YL');
    });

    it('should preserve unknown sizes', () => {
      expect(normalizeSize('Custom Size')).toBe('Custom Size');
      expect(normalizeSize('One Size')).toBe('One Size');
    });

    it('should handle whitespace', () => {
      expect(normalizeSize('  LARGE  ')).toBe('L');
      expect(normalizeSize('X-LARGE ')).toBe('XL');
    });
  });

  describe('normalizeColor', () => {
    it('should normalize standard colors', () => {
      expect(normalizeColor('black')).toBe('Black');
      expect(normalizeColor('BLACK')).toBe('Black');
      expect(normalizeColor('BLK')).toBe('Black');
      expect(normalizeColor('white')).toBe('White');
      expect(normalizeColor('WHT')).toBe('White');
      expect(normalizeColor('navy')).toBe('Navy');
      expect(normalizeColor('red')).toBe('Red');
    });

    it('should normalize compound colors', () => {
      expect(normalizeColor('heather gray')).toBe('Heather Gray');
      expect(normalizeColor('royal blue')).toBe('Royal Blue');
      expect(normalizeColor('kelly green')).toBe('Kelly Green');
    });

    it('should capitalize unknown colors', () => {
      expect(normalizeColor('sunset orange')).toBe('Sunset Orange');
      expect(normalizeColor('CUSTOM COLOR')).toBe('Custom Color');
    });

    it('should handle whitespace', () => {
      expect(normalizeColor('  black  ')).toBe('Black');
      expect(normalizeColor('royal blue ')).toBe('Royal Blue');
    });
  });

  describe('calculateMarkup', () => {
    it('should calculate correct markup', () => {
      expect(calculateMarkup(10, 50)).toBe(15.00);
      expect(calculateMarkup(10, 80)).toBe(18.00);
      expect(calculateMarkup(10, 100)).toBe(20.00);
    });

    it('should handle decimal costs', () => {
      expect(calculateMarkup(2.50, 80)).toBe(4.50);
      expect(calculateMarkup(12.99, 50)).toBe(19.48); // 12.99 * 1.5 = 19.485 -> 19.48
    });

    it('should round to 2 decimals', () => {
      expect(calculateMarkup(3.33, 33)).toBe(4.43);
      expect(calculateMarkup(1.11, 99)).toBe(2.21);
    });

    it('should handle zero markup', () => {
      expect(calculateMarkup(10, 0)).toBe(10.00);
    });

    it('should handle negative markup (discount)', () => {
      expect(calculateMarkup(10, -20)).toBe(8.00);
    });
  });

  describe('determineInventoryStatus', () => {
    it('should return out_of_stock for zero quantity', () => {
      expect(determineInventoryStatus(0)).toBe('out_of_stock');
    });

    it('should return low_stock below threshold', () => {
      expect(determineInventoryStatus(49)).toBe('low_stock');
      expect(determineInventoryStatus(25)).toBe('low_stock');
      expect(determineInventoryStatus(1)).toBe('low_stock');
    });

    it('should return in_stock at or above threshold', () => {
      expect(determineInventoryStatus(50)).toBe('in_stock');
      expect(determineInventoryStatus(100)).toBe('in_stock');
      expect(determineInventoryStatus(1000)).toBe('in_stock');
    });

    it('should handle custom threshold', () => {
      expect(determineInventoryStatus(30, 100)).toBe('low_stock');
      expect(determineInventoryStatus(100, 100)).toBe('in_stock');
      expect(determineInventoryStatus(10, 5)).toBe('in_stock');
    });
  });

  describe('getColorHex', () => {
    it('should return hex codes for standard colors', () => {
      expect(getColorHex('Black')).toBe('#000000');
      expect(getColorHex('White')).toBe('#FFFFFF');
      expect(getColorHex('Navy')).toBe('#000080');
      expect(getColorHex('Red')).toBe('#FF0000');
    });

    it('should return null for unknown colors', () => {
      expect(getColorHex('Custom Color')).toBeNull();
      expect(getColorHex('Sunset Pink')).toBeNull();
    });

    it('should be case-sensitive', () => {
      expect(getColorHex('Black')).toBe('#000000');
      expect(getColorHex('black')).toBeNull();
    });
  });

  describe('validateVariantData', () => {
    it('should validate correct variant data', () => {
      const variant = {
        sku: 'TEST-SKU-001',
        price: 10.00,
        wholesaleCost: 5.00,
        inventoryQty: 100,
      };
      
      const result = validateVariantData(variant);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing SKU', () => {
      const variant = {
        price: 10.00,
        wholesaleCost: 5.00,
      };
      
      const result = validateVariantData(variant);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('SKU is required and must be a string');
    });

    it('should reject invalid SKU type', () => {
      const variant = {
        sku: 123,
        price: 10.00,
        wholesaleCost: 5.00,
      };
      
      const result = validateVariantData(variant);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('SKU is required and must be a string');
    });

    it('should reject missing price', () => {
      const variant = {
        sku: 'TEST-SKU-001',
        wholesaleCost: 5.00,
      };
      
      const result = validateVariantData(variant);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Price is required and must be a non-negative number');
    });

    it('should reject negative price', () => {
      const variant = {
        sku: 'TEST-SKU-001',
        price: -10.00,
        wholesaleCost: 5.00,
      };
      
      const result = validateVariantData(variant);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Price is required and must be a non-negative number');
    });

    it('should reject missing wholesale cost', () => {
      const variant = {
        sku: 'TEST-SKU-001',
        price: 10.00,
      };
      
      const result = validateVariantData(variant);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Wholesale cost is required and must be a non-negative number');
    });

    it('should reject price lower than cost', () => {
      const variant = {
        sku: 'TEST-SKU-001',
        price: 5.00,
        wholesaleCost: 10.00,
      };
      
      const result = validateVariantData(variant);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Price must be greater than or equal to wholesale cost');
    });

    it('should reject negative inventory', () => {
      const variant = {
        sku: 'TEST-SKU-001',
        price: 10.00,
        wholesaleCost: 5.00,
        inventoryQty: -10,
      };
      
      const result = validateVariantData(variant);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Inventory quantity must be a non-negative number');
    });

    it('should allow zero price and cost', () => {
      const variant = {
        sku: 'TEST-SKU-001',
        price: 0,
        wholesaleCost: 0,
      };
      
      const result = validateVariantData(variant);
      expect(result.isValid).toBe(true);
    });
  });
});
