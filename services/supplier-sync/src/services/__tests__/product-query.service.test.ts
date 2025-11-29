/**
 * Product Query Service Tests
 */

import { ProductQueryService, ProductQueryConfig } from '../product-query.service';
import { SupplierName, ProductCategory } from '../../types/product';

// Mock axios
jest.mock('axios');

describe('ProductQueryService', () => {
  let service: ProductQueryService;
  
  const mockConfig: ProductQueryConfig = {
    strapiUrl: 'http://localhost:1337',
    strapiApiToken: 'test-token',
  };

  beforeEach(() => {
    service = new ProductQueryService(mockConfig);
  });

  afterEach(async () => {
    await service.close();
  });

  describe('detectSupplier', () => {
    it('should detect AS Colour from AC- prefix', () => {
      // Access private method through bracket notation for testing
      const detect = (service as any).detectSupplier.bind(service);
      expect(detect('AC-5001')).toBe(SupplierName.AS_COLOUR);
    });

    it('should detect AS Colour from 4-5 digit numbers', () => {
      const detect = (service as any).detectSupplier.bind(service);
      expect(detect('5001')).toBe(SupplierName.AS_COLOUR);
      expect(detect('50001')).toBe(SupplierName.AS_COLOUR);
    });

    it('should detect S&S Activewear from SS- prefix', () => {
      const detect = (service as any).detectSupplier.bind(service);
      expect(detect('SS-G500')).toBe(SupplierName.SS_ACTIVEWEAR);
    });

    it('should detect SanMar from SM- prefix', () => {
      const detect = (service as any).detectSupplier.bind(service);
      expect(detect('SM-PC54')).toBe(SupplierName.SANMAR);
    });

    it('should detect SanMar from alphanumeric style codes', () => {
      const detect = (service as any).detectSupplier.bind(service);
      expect(detect('K110P')).toBe(SupplierName.SANMAR);
      expect(detect('PC54')).toBe(SupplierName.SANMAR);
    });

    it('should detect S&S Activewear from pure numeric style IDs', () => {
      const detect = (service as any).detectSupplier.bind(service);
      expect(detect('123456')).toBe(SupplierName.SS_ACTIVEWEAR);
    });
  });

  describe('extractStyleCode', () => {
    it('should strip AC- prefix', () => {
      const extract = (service as any).extractStyleCode.bind(service);
      expect(extract('AC-5001', SupplierName.AS_COLOUR)).toBe('5001');
    });

    it('should strip SS- prefix', () => {
      const extract = (service as any).extractStyleCode.bind(service);
      expect(extract('SS-G500', SupplierName.SS_ACTIVEWEAR)).toBe('G500');
    });

    it('should strip SM- prefix and uppercase', () => {
      const extract = (service as any).extractStyleCode.bind(service);
      expect(extract('SM-pc54', SupplierName.SANMAR)).toBe('PC54');
    });

    it('should handle codes without prefix', () => {
      const extract = (service as any).extractStyleCode.bind(service);
      expect(extract('5001', SupplierName.AS_COLOUR)).toBe('5001');
    });
  });

  describe('mapSupplier', () => {
    it('should map ascolour to AS_COLOUR', () => {
      const map = (service as any).mapSupplier.bind(service);
      expect(map('ascolour')).toBe(SupplierName.AS_COLOUR);
      expect(map('as-colour')).toBe(SupplierName.AS_COLOUR);
    });

    it('should map ssactivewear to SS_ACTIVEWEAR', () => {
      const map = (service as any).mapSupplier.bind(service);
      expect(map('ssactivewear')).toBe(SupplierName.SS_ACTIVEWEAR);
      expect(map('s&s-activewear')).toBe(SupplierName.SS_ACTIVEWEAR);
    });

    it('should map sanmar to SANMAR', () => {
      const map = (service as any).mapSupplier.bind(service);
      expect(map('sanmar')).toBe(SupplierName.SANMAR);
    });

    it('should default to SANMAR for unknown', () => {
      const map = (service as any).mapSupplier.bind(service);
      expect(map('unknown')).toBe(SupplierName.SANMAR);
    });
  });
});

describe('ProductQueryService Integration', () => {
  describe('searchCuratedProducts', () => {
    it('should return empty array when Strapi not configured', async () => {
      const service = new ProductQueryService({});
      const results = await service.searchCuratedProducts('test');
      expect(results).toEqual([]);
      await service.close();
    });
  });

  describe('getProduct', () => {
    it('should return null when product not found', async () => {
      const service = new ProductQueryService({});
      const result = await service.getProduct('NONEXISTENT');
      expect(result).toBeNull();
      await service.close();
    });
  });

  describe('checkStock', () => {
    it('should return empty inventory when supplier not configured', async () => {
      const service = new ProductQueryService({});
      const result = await service.checkStock('5001');
      // Graceful degradation - returns result with empty inventory
      expect(result).toBeDefined();
      expect(result?.inventory).toEqual([]);
      expect(result?.available).toBe(false);
      expect(result?.totalQty).toBe(0);
      await service.close();
    });
  });

  describe('getColorsAvailable', () => {
    it('should return empty array when product not found', async () => {
      const service = new ProductQueryService({});
      const result = await service.getColorsAvailable('NONEXISTENT');
      expect(result).toEqual([]);
      await service.close();
    });
  });

  describe('getPricing', () => {
    it('should return empty pricing when supplier not configured', async () => {
      const service = new ProductQueryService({});
      const result = await service.getPricing('5001');
      // Graceful degradation - returns result with zero pricing
      expect(result).toBeDefined();
      expect(result?.basePrice).toBe(0);
      expect(result?.priceBreaks).toEqual([]);
      await service.close();
    });
  });
});
