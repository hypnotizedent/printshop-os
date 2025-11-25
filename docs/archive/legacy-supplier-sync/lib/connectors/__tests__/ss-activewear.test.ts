/**
 * Tests for S&S Activewear connector
 */

import MockAdapter from 'axios-mock-adapter';
import { SSActivewearConnector } from '../ss-activewear';
import { ConnectorConfig } from '../../types';

describe('SSActivewearConnector', () => {
  let connector: SSActivewearConnector;
  let mockAdapter: MockAdapter;
  
  const config: ConnectorConfig = {
    baseUrl: 'https://api.ssactivewear.com/v2',
    auth: {
      username: 'test-user',
      password: 'test-pass',
    },
  };

  beforeEach(() => {
    connector = new SSActivewearConnector(config);
    // @ts-ignore - accessing protected property for testing
    mockAdapter = new MockAdapter(connector.client);
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  describe('fetchProducts', () => {
    it('should fetch and normalize products successfully', async () => {
      const mockStyles = [
        {
          styleID: 'SS-001',
          title: 'Test T-Shirt',
          brandName: 'Gildan',
          baseCategory: 'T-Shirts',
          sizeList: ['S', 'M', 'L', 'XL'],
          colorList: [
            { name: 'Black', hex: '#000000', sku: 'SS-001-BLK' },
            { name: 'White', hex: '#FFFFFF', sku: 'SS-001-WHT' },
          ],
          mediaUrls: ['https://example.com/image1.jpg'],
          fabric: '100% Cotton',
          features: ['Pre-shrunk', 'Soft'],
        },
      ];

      mockAdapter.onGet('/styles').reply(200, mockStyles);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(1);
      expect(products[0]).toMatchObject({
        supplier: 'S&S Activewear',
        styleId: 'SS-001',
        name: 'Test T-Shirt',
        brand: 'Gildan',
        category: 'T-Shirts',
        sizes: ['S', 'M', 'L', 'XL'],
      });
      expect(products[0].colors).toHaveLength(2);
      expect(products[0].colors[0].name).toBe('Black');
    });

    it('should handle empty response', async () => {
      mockAdapter.onGet('/styles').reply(200, []);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(0);
    });

    it('should handle API errors with retry', async () => {
      mockAdapter.onGet('/styles').replyOnce(500).onGet('/styles').reply(200, []);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(0);
      expect(mockAdapter.history.get.length).toBe(2);
    });

    it('should fail after max retries', async () => {
      mockAdapter.onGet('/styles').reply(500);

      await expect(connector.fetchProducts()).rejects.toThrow();
    }, 10000);
  });

  describe('fetchProduct', () => {
    it('should fetch a single product by ID', async () => {
      const mockStyle = {
        styleID: 'SS-002',
        title: 'Premium Hoodie',
        brandName: 'Bella+Canvas',
        baseCategory: 'Hoodies',
        sizeList: ['M', 'L'],
        colorList: [{ name: 'Navy', hex: '#001F3F' }],
        mediaUrls: [],
        fabric: '80% Cotton, 20% Polyester',
      };

      mockAdapter.onGet('/styles/SS-002').reply(200, mockStyle);

      const product = await connector.fetchProduct('SS-002');

      expect(product).not.toBeNull();
      expect(product?.styleId).toBe('SS-002');
      expect(product?.name).toBe('Premium Hoodie');
      expect(product?.brand).toBe('Bella+Canvas');
    });

    it('should return null for non-existent product', async () => {
      mockAdapter.onGet('/styles/INVALID').reply(404);

      const product = await connector.fetchProduct('INVALID');

      expect(product).toBeNull();
    });

    it('should handle network errors with retry', async () => {
      mockAdapter
        .onGet('/styles/SS-003')
        .networkErrorOnce()
        .onGet('/styles/SS-003')
        .reply(200, { styleID: 'SS-003', title: 'Test' });

      const product = await connector.fetchProduct('SS-003');

      expect(product).not.toBeNull();
      expect(product?.styleId).toBe('SS-003');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      mockAdapter.onGet('/styles').reply(200, []);

      const result = await connector.testConnection();

      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      mockAdapter.onGet('/styles').reply(401);

      const result = await connector.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('normalization', () => {
    it('should handle missing optional fields gracefully', async () => {
      const minimalStyle = {
        styleID: 'MIN-001',
      };

      mockAdapter.onGet('/styles').reply(200, [minimalStyle]);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(1);
      expect(products[0].styleId).toBe('MIN-001');
      expect(products[0].name).toBe('Unnamed Product');
      expect(products[0].sizes).toEqual([]);
      expect(products[0].colors).toEqual([]);
    });

    it('should use alternative field names', async () => {
      const styleWithAltFields = {
        styleCode: 'ALT-001',
        styleName: 'Alternative Name',
        categoryName: 'Alt Category',
      };

      mockAdapter.onGet('/styles').reply(200, [styleWithAltFields]);

      const products = await connector.fetchProducts();

      expect(products[0].styleId).toBe('ALT-001');
      expect(products[0].name).toBe('Alternative Name');
      expect(products[0].category).toBe('Alt Category');
    });

    it('should properly normalize color information', async () => {
      const styleWithColors = {
        styleID: 'CLR-001',
        colorList: [
          { name: 'Red', hex: '#FF0000', sku: 'CLR-001-RED', stock: 100, price: 5.99 },
          { name: 'Blue', sku: 'CLR-001-BLU' },
        ],
      };

      mockAdapter.onGet('/styles').reply(200, [styleWithColors]);

      const products = await connector.fetchProducts();

      expect(products[0].colors).toHaveLength(2);
      expect(products[0].colors[0]).toEqual({
        name: 'Red',
        hex: '#FF0000',
        sku: 'CLR-001-RED',
        stock: 100,
        price: 5.99,
      });
      expect(products[0].colors[1]).toEqual({
        name: 'Blue',
        hex: null,
        sku: 'CLR-001-BLU',
        stock: null,
        price: null,
      });
    });
  });

  describe('retry logic', () => {
    it('should retry on 503 Service Unavailable', async () => {
      mockAdapter
        .onGet('/styles')
        .replyOnce(503)
        .onGet('/styles')
        .reply(200, [{ styleID: 'RETRY-001' }]);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(1);
      expect(mockAdapter.history.get.length).toBe(2);
    });

    it('should retry on 429 Rate Limit', async () => {
      mockAdapter
        .onGet('/styles')
        .replyOnce(429)
        .onGet('/styles')
        .reply(200, []);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(0);
      expect(mockAdapter.history.get.length).toBe(2);
    });

    it('should not retry on 400 Bad Request', async () => {
      mockAdapter.onGet('/styles').reply(400);

      await expect(connector.fetchProducts()).rejects.toThrow();
      expect(mockAdapter.history.get.length).toBe(1);
    });

    it('should not retry on 404 Not Found', async () => {
      mockAdapter.onGet('/styles/NONE').reply(404);

      const product = await connector.fetchProduct('NONE');

      expect(product).toBeNull();
      expect(mockAdapter.history.get.length).toBe(1);
    });
  });
});
