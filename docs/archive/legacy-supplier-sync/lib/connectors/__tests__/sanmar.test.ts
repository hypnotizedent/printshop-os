/**
 * Tests for SanMar connector
 */

import MockAdapter from 'axios-mock-adapter';
import { SanMarConnector } from '../sanmar';
import { ConnectorConfig } from '../../types';

describe('SanMarConnector', () => {
  let connector: SanMarConnector;
  let mockAdapter: MockAdapter;
  
  const config: ConnectorConfig = {
    baseUrl: 'https://api.sanmar.com',
    auth: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    },
  };

  beforeEach(() => {
    connector = new SanMarConnector(config);
    // @ts-ignore - accessing protected property for testing
    mockAdapter = new MockAdapter(connector.client);
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  describe('OAuth authentication', () => {
    it('should obtain OAuth token before API requests', async () => {
      mockAdapter.onPost('/oauth/token').reply(200, {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });

      mockAdapter.onGet('/styles').reply(200, []);

      await connector.fetchProducts();

      expect(mockAdapter.history.post.length).toBe(1);
      expect(mockAdapter.history.post[0].url).toBe('/oauth/token');
      expect(mockAdapter.history.get[0].headers?.Authorization).toBe('Bearer test-token');
    });

    it('should reuse valid token without requesting new one', async () => {
      mockAdapter.onPost('/oauth/token').reply(200, {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });

      mockAdapter.onGet('/styles').reply(200, []);

      await connector.fetchProducts();
      await connector.fetchProducts();

      expect(mockAdapter.history.post.length).toBe(1);
      expect(mockAdapter.history.get.length).toBe(2);
    });

    it('should refresh token on 401 response', async () => {
      mockAdapter
        .onPost('/oauth/token')
        .replyOnce(200, {
          access_token: 'token-1',
          token_type: 'Bearer',
          expires_in: 3600,
        })
        .onPost('/oauth/token')
        .replyOnce(200, {
          access_token: 'token-2',
          token_type: 'Bearer',
          expires_in: 3600,
        });

      mockAdapter
        .onGet('/styles')
        .replyOnce(401)
        .onGet('/styles')
        .reply(200, []);

      await connector.fetchProducts();

      expect(mockAdapter.history.post.length).toBe(2);
      expect(mockAdapter.history.get.length).toBe(2);
    });
  });

  describe('fetchProducts', () => {
    beforeEach(() => {
      mockAdapter.onPost('/oauth/token').reply(200, {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });
    });

    it('should fetch and normalize products successfully', async () => {
      const mockProducts = [
        {
          styleId: 'SM-001',
          styleName: 'Corporate Polo',
          brand: 'Nike',
          category: 'Polos',
          sizes: ['S', 'M', 'L', 'XL', '2XL'],
          colors: [
            { name: 'Black', hex: '#000000', sku: 'SM-001-BLK' },
            { name: 'Navy', colorCode: '#001F3F', sku: 'SM-001-NVY' },
          ],
          images: ['https://example.com/image1.jpg'],
          fabric: '100% Polyester',
          features: ['Moisture-wicking', 'Anti-microbial'],
          baseCost: 12.99,
        },
      ];

      mockAdapter.onGet('/styles').reply(200, mockProducts);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(1);
      expect(products[0]).toMatchObject({
        supplier: 'SanMar',
        styleId: 'SM-001',
        name: 'Corporate Polo',
        brand: 'Nike',
        category: 'Polos',
        baseCost: 12.99,
      });
      expect(products[0].colors).toHaveLength(2);
      expect(products[0].colors[0].name).toBe('Black');
    });

    it('should handle response with data wrapper', async () => {
      const mockResponse = {
        data: [
          { styleId: 'SM-002', styleName: 'Test Style' },
        ],
      };

      mockAdapter.onGet('/styles').reply(200, mockResponse);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(1);
      expect(products[0].styleId).toBe('SM-002');
    });

    it('should handle response with styles wrapper', async () => {
      const mockResponse = {
        styles: [
          { styleNumber: 'SM-003', name: 'Style Name' },
        ],
      };

      mockAdapter.onGet('/styles').reply(200, mockResponse);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(1);
      expect(products[0].styleId).toBe('SM-003');
    });

    it('should handle API errors with retry', async () => {
      mockAdapter
        .onGet('/styles')
        .replyOnce(500)
        .onGet('/styles')
        .reply(200, []);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(0);
    });

    it('should fail after max retries', async () => {
      mockAdapter.onGet('/styles').reply(500);

      await expect(connector.fetchProducts()).rejects.toThrow();
    }, 10000);
  });

  describe('fetchProduct', () => {
    beforeEach(() => {
      mockAdapter.onPost('/oauth/token').reply(200, {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });
    });

    it('should fetch a single product by ID', async () => {
      const mockProduct = {
        styleId: 'SM-004',
        styleName: 'Premium Jacket',
        brandName: 'Adidas',
        categoryName: 'Jackets',
        sizeList: ['M', 'L', 'XL'],
        colorList: [{ name: 'Red', hex: '#FF0000' }],
        imageUrls: ['https://example.com/jacket.jpg'],
        material: 'Nylon',
      };

      mockAdapter.onGet('/styles/SM-004').reply(200, mockProduct);

      const product = await connector.fetchProduct('SM-004');

      expect(product).not.toBeNull();
      expect(product?.styleId).toBe('SM-004');
      expect(product?.name).toBe('Premium Jacket');
      expect(product?.brand).toBe('Adidas');
    });

    it('should return null for non-existent product', async () => {
      mockAdapter.onGet('/styles/INVALID').reply(404);

      const product = await connector.fetchProduct('INVALID');

      expect(product).toBeNull();
    });

    it('should handle network errors with retry', async () => {
      mockAdapter
        .onGet('/styles/SM-005')
        .networkErrorOnce()
        .onGet('/styles/SM-005')
        .reply(200, { styleId: 'SM-005', styleName: 'Test' });

      const product = await connector.fetchProduct('SM-005');

      expect(product).not.toBeNull();
      expect(product?.styleId).toBe('SM-005');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      mockAdapter.onPost('/oauth/token').reply(200, {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });

      mockAdapter.onGet('/styles').reply(200, []);

      const result = await connector.testConnection();

      expect(result).toBe(true);
    });

    it('should return false for failed OAuth', async () => {
      mockAdapter.onPost('/oauth/token').reply(401);

      const result = await connector.testConnection();

      expect(result).toBe(false);
    });

    it('should return false for failed API call', async () => {
      mockAdapter.onPost('/oauth/token').reply(200, {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });

      mockAdapter.onGet('/styles').reply(403);

      const result = await connector.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('normalization', () => {
    beforeEach(() => {
      mockAdapter.onPost('/oauth/token').reply(200, {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });
    });

    it('should use alternative field names for style ID', async () => {
      const products = [
        { styleNumber: 'ALT-001' },
        { sku: 'ALT-002' },
        { productId: 'ALT-003' },
      ];

      mockAdapter.onGet('/styles').reply(200, products);

      const result = await connector.fetchProducts();

      expect(result[0].styleId).toBe('ALT-001');
      expect(result[1].styleId).toBe('ALT-002');
      expect(result[2].styleId).toBe('ALT-003');
    });

    it('should handle colors from colorList', async () => {
      const product = {
        styleId: 'CLR-001',
        colorList: [
          { name: 'Green', colorCode: '#00FF00', sku: 'CLR-001-GRN' },
        ],
      };

      mockAdapter.onGet('/styles').reply(200, [product]);

      const products = await connector.fetchProducts();

      expect(products[0].colors).toHaveLength(1);
      expect(products[0].colors[0]).toEqual({
        name: 'Green',
        hex: '#00FF00',
        sku: 'CLR-001-GRN',
        stock: null,
        price: null,
      });
    });

    it('should handle inventory from different fields', async () => {
      const products = [
        { styleId: 'INV-001', inventory: 500 },
        { styleId: 'INV-002', stock: 300 },
      ];

      mockAdapter.onGet('/styles').reply(200, products);

      const result = await connector.fetchProducts();

      expect(result[0].totalInventory).toBe(500);
      expect(result[0].inStock).toBe(true);
      expect(result[1].totalInventory).toBe(300);
      expect(result[1].inStock).toBe(true);
    });

    it('should handle missing optional fields', async () => {
      const minimalProduct = {
        styleId: 'MIN-003',
      };

      mockAdapter.onGet('/styles').reply(200, [minimalProduct]);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(1);
      expect(products[0].styleId).toBe('MIN-003');
      expect(products[0].name).toBe('Unnamed Product');
      expect(products[0].sizes).toEqual([]);
      expect(products[0].colors).toEqual([]);
    });
  });

  describe('retry logic', () => {
    beforeEach(() => {
      mockAdapter.onPost('/oauth/token').reply(200, {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });
    });

    it('should retry on 503 Service Unavailable', async () => {
      mockAdapter
        .onGet('/styles')
        .replyOnce(503)
        .onGet('/styles')
        .reply(200, []);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(0);
    });

    it('should retry on 429 Rate Limit', async () => {
      mockAdapter
        .onGet('/styles')
        .replyOnce(429)
        .onGet('/styles')
        .reply(200, []);

      const products = await connector.fetchProducts();

      expect(products).toHaveLength(0);
    });

    it('should not retry on 400 Bad Request', async () => {
      mockAdapter.onGet('/styles').reply(400);

      await expect(connector.fetchProducts()).rejects.toThrow();
    });
  });
});
