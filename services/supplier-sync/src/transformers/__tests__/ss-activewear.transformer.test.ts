import { SSActivewearTransformer } from '../ss-activewear.transformer';
import { SSProduct } from '../../clients/ss-activewear.client';
import { ProductCategory, SupplierName } from '../../types/product';

describe('SSActivewearTransformer', () => {
  const mockSSProduct: SSProduct = {
    styleID: 'G200',
    styleName: 'Gildan Ultra Cotton T-Shirt',
    brandName: 'Gildan',
    brandID: 1,
    categoryName: 'T-Shirts',
    categoryID: 1,
    description: '100% cotton classic fit t-shirt',
    pieceWeight: '6.0 oz',
    fabricType: 'Cotton',
    fabricContent: '100% Cotton',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      {
        colorName: 'Black',
        colorCode: 'BLK',
        hexCode: '#000000',
        imageURL: 'https://example.com/black.jpg',
      },
      {
        colorName: 'White',
        colorCode: 'WHT',
        hexCode: '#FFFFFF',
        imageURL: 'https://example.com/white.jpg',
      },
    ],
    pricing: [
      { quantity: 1, price: 5.99 },
      { quantity: 12, price: 4.99 },
      { quantity: 72, price: 3.99 },
    ],
    inventory: [
      { size: 'S', colorName: 'Black', qty: 100 },
      { size: 'M', colorName: 'Black', qty: 150 },
      { size: 'L', colorName: 'Black', qty: 200 },
      { size: 'XL', colorName: 'Black', qty: 50 },
      { size: 'S', colorName: 'White', qty: 80 },
      { size: 'M', colorName: 'White', qty: 120 },
      { size: 'L', colorName: 'White', qty: 180 },
      { size: 'XL', colorName: 'White', qty: 40 },
    ],
    images: [
      { url: 'https://example.com/front.jpg', type: 'front' },
      { url: 'https://example.com/back.jpg', type: 'back' },
    ],
    specifications: {
      fit: 'Classic',
      features: ['Preshrunk', 'Taped neck and shoulders'],
      printMethods: ['Screen Print', 'DTG', 'Vinyl'],
    },
  };

  describe('transformProduct', () => {
    it('should transform S&S product to UnifiedProduct', () => {
      const result = SSActivewearTransformer.transformProduct(mockSSProduct);

      expect(result.sku).toBe('G200');
      expect(result.name).toBe('Gildan Ultra Cotton T-Shirt');
      expect(result.brand).toBe('Gildan');
      expect(result.description).toBe('100% cotton classic fit t-shirt');
      expect(result.category).toBe(ProductCategory.T_SHIRTS);
      expect(result.supplier).toBe(SupplierName.SS_ACTIVEWEAR);
    });

    it('should generate correct number of variants', () => {
      const result = SSActivewearTransformer.transformProduct(mockSSProduct);

      // 2 colors × 4 sizes = 8 variants
      expect(result.variants).toHaveLength(8);
    });

    it('should generate correct variant SKUs', () => {
      const result = SSActivewearTransformer.transformProduct(mockSSProduct);

      const skus = result.variants.map((v) => v.sku);
      expect(skus).toContain('G200-BLACK-S');
      expect(skus).toContain('G200-BLACK-M');
      expect(skus).toContain('G200-WHITE-L');
      expect(skus).toContain('G200-WHITE-XL');
    });

    it('should map inventory to variants correctly', () => {
      const result = SSActivewearTransformer.transformProduct(mockSSProduct);

      const blackMedium = result.variants.find(
        (v) => v.color.name === 'Black' && v.size === 'M'
      );
      expect(blackMedium).toBeDefined();
      expect(blackMedium?.quantity).toBe(150);
      expect(blackMedium?.inStock).toBe(true);

      const whiteSmall = result.variants.find(
        (v) => v.color.name === 'White' && v.size === 'S'
      );
      expect(whiteSmall).toBeDefined();
      expect(whiteSmall?.quantity).toBe(80);
      expect(whiteSmall?.inStock).toBe(true);
    });

    it('should transform pricing correctly', () => {
      const result = SSActivewearTransformer.transformProduct(mockSSProduct);

      expect(result.pricing.basePrice).toBe(5.99);
      expect(result.pricing.currency).toBe('USD');
      expect(result.pricing.breaks).toHaveLength(3);
      expect(result.pricing.breaks?.[0]).toEqual({
        quantity: 1,
        price: 5.99,
        casePrice: undefined,
      });
      expect(result.pricing.breaks?.[2]).toEqual({
        quantity: 72,
        price: 3.99,
        casePrice: undefined,
      });
    });

    it('should calculate availability correctly', () => {
      const result = SSActivewearTransformer.transformProduct(mockSSProduct);

      expect(result.availability.inStock).toBe(true);
      // Total: 100+150+200+50+80+120+180+40 = 920
      expect(result.availability.totalQuantity).toBe(920);
    });

    it('should include specifications', () => {
      const result = SSActivewearTransformer.transformProduct(mockSSProduct);

      expect(result.specifications?.weight).toBe('6.0 oz');
      expect(result.specifications?.fabric?.type).toBe('Cotton');
      expect(result.specifications?.fabric?.content).toBe('100% Cotton');
      expect(result.specifications?.fit).toBe('Classic');
      expect(result.specifications?.features).toHaveLength(2);
      expect(result.specifications?.printMethods).toHaveLength(3);
    });

    it('should include metadata', () => {
      const result = SSActivewearTransformer.transformProduct(mockSSProduct);

      expect(result.metadata.supplierProductId).toBe('G200');
      expect(result.metadata.supplierBrandId).toBe('1');
      expect(result.metadata.supplierCategoryId).toBe('1');
      expect(result.metadata.lastUpdated).toBeInstanceOf(Date);
    });

    it('should extract images correctly', () => {
      const result = SSActivewearTransformer.transformProduct(mockSSProduct);

      expect(result.images).toHaveLength(2);
      expect(result.images).toContain('https://example.com/front.jpg');
      expect(result.images).toContain('https://example.com/back.jpg');
    });
  });

  describe('category mapping', () => {
    it('should map t-shirts category', () => {
      const product = { ...mockSSProduct, categoryName: 'T-Shirts' };
      const result = SSActivewearTransformer.transformProduct(product);
      expect(result.category).toBe(ProductCategory.T_SHIRTS);
    });

    it('should map polos category', () => {
      const product = { ...mockSSProduct, categoryName: 'Polo Shirts' };
      const result = SSActivewearTransformer.transformProduct(product);
      expect(result.category).toBe(ProductCategory.POLOS);
    });

    it('should map hoodies category', () => {
      const product = { ...mockSSProduct, categoryName: 'Hoodies' };
      const result = SSActivewearTransformer.transformProduct(product);
      expect(result.category).toBe(ProductCategory.HOODIES);
    });

    it('should map headwear category', () => {
      const product = { ...mockSSProduct, categoryName: 'Hats' };
      const result = SSActivewearTransformer.transformProduct(product);
      expect(result.category).toBe(ProductCategory.HEADWEAR);
    });

    it('should default to OTHER for unknown categories', () => {
      const product = { ...mockSSProduct, categoryName: 'Unknown Category' };
      const result = SSActivewearTransformer.transformProduct(product);
      expect(result.category).toBe(ProductCategory.OTHER);
    });
  });

  describe('transformProducts (batch)', () => {
    it('should transform multiple products', () => {
      const products = [
        mockSSProduct,
        { ...mockSSProduct, styleID: 'G500', styleName: 'Heavy Cotton' },
      ];

      const results = SSActivewearTransformer.transformProducts(products);

      expect(results).toHaveLength(2);
      expect(results[0].sku).toBe('G200');
      expect(results[1].sku).toBe('G500');
    });
  });

  describe('SKU sanitization', () => {
    it('should handle colors with special characters', () => {
      const product = {
        ...mockSSProduct,
        colors: [
          {
            colorName: 'Navy/White',
            colorCode: 'NVY/WHT',
            hexCode: '#001F3F',
            imageURL: 'https://example.com/navy.jpg',
          },
        ],
        sizes: ['L'],
        inventory: [{ size: 'L', colorName: 'Navy/White', qty: 50 }],
      };

      const result = SSActivewearTransformer.transformProduct(product);
      const variant = result.variants[0];
      
      // Should sanitize "/" to "-"
      expect(variant.sku).toBe('G200-NAVY-WHITE-L');
    });

    it('should handle sizes with special characters', () => {
      const product = {
        ...mockSSProduct,
        colors: [
          {
            colorName: 'Black',
            colorCode: 'BLK',
            hexCode: '#000000',
            imageURL: 'https://example.com/black.jpg',
          },
        ],
        sizes: ['2XL'],
        inventory: [{ size: '2XL', colorName: 'Black', qty: 30 }],
      };

      const result = SSActivewearTransformer.transformProduct(product);
      const variant = result.variants[0];
      
      expect(variant.sku).toBe('G200-BLACK-2XL');
    });
  });
});
