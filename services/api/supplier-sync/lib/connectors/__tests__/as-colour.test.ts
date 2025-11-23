/**
 * Tests for AS Colour connector
 */

import MockAdapter from 'axios-mock-adapter';
import { ASColourConnector } from '../as-colour';
import { ConnectorConfig } from '../../types';

describe('ASColourConnector', () => {
  let connector: ASColourConnector;
  let mockAdapter: MockAdapter;
  
  const config: ConnectorConfig = {
    baseUrl: 'https://api.ascolour.com/v1/catalog',
    auth: {
      apiKey: 'test-api-key',
    },
  };

  beforeEach(() => {
    connector = new ASColourConnector(config);
    // @ts-ignore - accessing protected property for testing
    mockAdapter = new MockAdapter(connector.client);
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  describe('fetchProducts', () => {
    it('should fetch and normalize products from data array', async () => {
      const mockResponse = {
        data: [
          {
            styleCode: 'AS-5001',
            styleName: 'Staple Tee',
            productType: 'T-Shirts',
            colours: [
              { name: 'Black', hexCode: '#000000' },
              { name: 'White', hexCode: '#FFFFFF' },
            ],
            composition: '100% Combed Cotton',
            shortDescription: 'Classic fit',
            fit: 'Regular',
            coreRange: true,
          },
        ],
      };

      mockAdapter.onGet('/products').reply(200, mockResponse);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(1);
      expect(products[0]).toMatchObject({
        supplier: 'AS Colour',
        styleId: 'AS-5001',
        name: 'Staple Tee',
        category: 'T-Shirts',
        material: '100% Combed Cotton',
      });
      expect(products[0].colors).toHaveLength(2);
      expect(products[0].tags).toContain('Classic fit');
      expect(products[0].tags).toContain('Core Range');
    });

    it('should handle products array response structure', async () => {
      const mockResponse = {
        products: [
          {
            id: 'AS-5002',
            name: 'Hoodie',
            category: 'Hoodies',
          },
        ],
      };

      mockAdapter.onGet('/products').reply(200, mockResponse);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(1);
      expect(products[0].styleId).toBe('AS-5002');
      expect(products[0].name).toBe('Hoodie');
    });

    it('should handle direct array response', async () => {
      const mockResponse = [
        {
          styleCode: 'AS-5003',
          styleName: 'Tank Top',
        },
      ];

      mockAdapter.onGet('/products').reply(200, mockResponse);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(1);
      expect(products[0].styleId).toBe('AS-5003');
    });

    it('should handle API errors with retry', async () => {
      mockAdapter
        .onGet('/products')
        .replyOnce(500)
        .onGet('/products')
        .reply(200, { data: [] });

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(0);
      expect(mockAdapter.history.get.length).toBe(2);
    });

    it('should fail after max retries', async () => {
      mockAdapter.onGet('/products').reply(503);

      await expect(connector.fetchProducts()).rejects.toThrow();
    }, 10000);
  });

  describe('fetchProduct', () => {
    it('should fetch a single product by style code', async () => {
      const mockProduct = {
        styleCode: 'AS-5004',
        styleName: 'Polo Shirt',
        productType: 'Polos',
        colours: [{ name: 'Navy', hexCode: '#001F3F' }],
        sizeGuideURL: 'https://example.com/size-guide',
      };

      mockAdapter.onGet('/products/AS-5004').reply(200, mockProduct);

      const product = await connector.fetchProduct('AS-5004');

      expect(product).not.toBeNull();
      expect(product?.styleId).toBe('AS-5004');
      expect(product?.name).toBe('Polo Shirt');
      expect(product?.sizes).toEqual(['One Size']);
    });

    it('should return null for non-existent product', async () => {
      mockAdapter.onGet('/products/INVALID').reply(404);

      const product = await connector.fetchProduct('INVALID');

      expect(product).toBeNull();
    });

    it('should handle network errors with retry', async () => {
      mockAdapter
        .onGet('/products/AS-5005')
        .networkErrorOnce()
        .onGet('/products/AS-5005')
        .reply(200, { styleCode: 'AS-5005', styleName: 'Retry Test' });

      const product = await connector.fetchProduct('AS-5005');

      expect(product).not.toBeNull();
      expect(product?.styleId).toBe('AS-5005');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      mockAdapter.onGet('/products').reply(200, { data: [] });

      const result = await connector.testConnection();

      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      mockAdapter.onGet('/products').reply(403);

      const result = await connector.testConnection();

      expect(result).toBe(false);
    });

    it('should verify API key header is set', async () => {
      mockAdapter.onGet('/products').reply(200, []);

      await connector.fetchProducts();

      expect(mockAdapter.history.get[0].headers?.['Subscription-Key']).toBe('test-api-key');
    });
  });

  describe('normalization', () => {
    it('should collect all image URLs', async () => {
      const product = {
        styleCode: 'IMG-001',
        imageURL: 'https://example.com/image1.jpg',
        websiteURL: 'https://example.com/product',
        images: ['https://example.com/image2.jpg', 'https://example.com/image3.jpg'],
      };

      mockAdapter.onGet('/products').reply(200, [product]);

      const products = await connector.fetchProducts();

      expect(products[0].imageUrls).toHaveLength(4);
      expect(products[0].imageUrls).toContain('https://example.com/image1.jpg');
      expect(products[0].imageUrls).toContain('https://example.com/product');
      expect(products[0].imageUrls).toContain('https://example.com/image2.jpg');
    });

    it('should handle missing optional fields', async () => {
      const minimalProduct = {
        styleCode: 'MIN-002',
      };

      mockAdapter.onGet('/products').reply(200, [minimalProduct]);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(1);
      expect(products[0].styleId).toBe('MIN-002');
      expect(products[0].name).toBe('Unnamed Product');
      expect(products[0].sizes).toEqual([]);
      expect(products[0].colors).toEqual([]);
    });

    it('should build tags from metadata', async () => {
      const product = {
        styleCode: 'TAG-001',
        shortDescription: 'Comfortable',
        fit: 'Slim Fit',
        coreRange: true,
      };

      mockAdapter.onGet('/products').reply(200, [product]);

      const products = await connector.fetchProducts();

      expect(products[0].tags).toContain('Comfortable');
      expect(products[0].tags).toContain('Slim Fit');
      expect(products[0].tags).toContain('Core Range');
    });

    it('should handle sizes from sizeGuideURL', async () => {
      const product = {
        styleCode: 'SIZE-001',
        sizeGuideURL: 'https://example.com/sizes',
      };

      mockAdapter.onGet('/products').reply(200, [product]);

      const products = await connector.fetchProducts();

      expect(products[0].sizes).toEqual(['One Size']);
    });

    it('should use provided sizes array when available', async () => {
      const product = {
        styleCode: 'SIZE-002',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
      };

      mockAdapter.onGet('/products').reply(200, [product]);

      const products = await connector.fetchProducts();

      expect(products[0].sizes).toEqual(['XS', 'S', 'M', 'L', 'XL']);
    });
  });

  describe('retry logic', () => {
    it('should retry on timeout', async () => {
      mockAdapter
        .onGet('/products')
        .timeoutOnce()
        .onGet('/products')
        .reply(200, []);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(0);
      expect(mockAdapter.history.get.length).toBe(2);
    });

    it('should not retry on 401 Unauthorized', async () => {
      mockAdapter.onGet('/products').reply(401);

      await expect(connector.fetchProducts()).rejects.toThrow();
      expect(mockAdapter.history.get.length).toBe(1);
    });
  });
});
