/**
 * Unit tests for Printavo v2 Extraction Script
 *
 * Tests:
 * - Configuration loading
 * - Authentication flow
 * - Pagination logic
 * - Error handling
 * - Rate limiting
 */

import {
  PrintavoV2Client,
  PrintavoV2Extractor,
  ExtractLogger,
  loadExtractConfig,
  type PrintavoV2Config,
} from '../extract-printavo-v2';

// Define mock axios type
interface MockAxiosInstance {
  create: jest.Mock;
  post: jest.Mock;
  get: jest.Mock;
  defaults: {
    headers: {
      common: Record<string, string>;
    };
  };
  isAxiosError: jest.Mock;
}

// Mock axios
jest.mock('axios', () => {
  const instance: MockAxiosInstance = {
    create: jest.fn(),
    post: jest.fn(),
    get: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
    isAxiosError: jest.fn((error: unknown) => {
      return (
        typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error &&
        (error as { isAxiosError: boolean }).isAxiosError === true
      );
    }),
  };
  instance.create = jest.fn(() => instance);
  return instance;
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  readdirSync: jest.fn(() => []),
}));

const mockAxios = jest.requireMock('axios') as MockAxiosInstance;

describe('Printavo v2 Extraction', () => {
  const mockConfig: PrintavoV2Config = {
    email: 'test@example.com',
    password: 'testpassword',
    apiUrl: 'https://www.printavo.com/api/v2',
    rateLimitMs: 10, // Fast for testing
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadExtractConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should throw error when PRINTAVO_EMAIL is missing', () => {
      delete process.env.PRINTAVO_EMAIL;
      process.env.PRINTAVO_PASSWORD = 'testpass';

      expect(() => loadExtractConfig()).toThrow('PRINTAVO_EMAIL environment variable is required');
    });

    it('should throw error when PRINTAVO_PASSWORD is missing', () => {
      process.env.PRINTAVO_EMAIL = 'test@example.com';
      delete process.env.PRINTAVO_PASSWORD;

      expect(() => loadExtractConfig()).toThrow(
        'PRINTAVO_PASSWORD environment variable is required',
      );
    });

    it('should load config with default values', () => {
      process.env.PRINTAVO_EMAIL = 'test@example.com';
      process.env.PRINTAVO_PASSWORD = 'testpass';

      const config = loadExtractConfig();

      expect(config.email).toBe('test@example.com');
      expect(config.password).toBe('testpass');
      expect(config.apiUrl).toBe('https://www.printavo.com/api/v2');
      expect(config.rateLimitMs).toBe(500);
    });

    it('should load custom API URL from environment', () => {
      process.env.PRINTAVO_EMAIL = 'test@example.com';
      process.env.PRINTAVO_PASSWORD = 'testpass';
      process.env.PRINTAVO_API_URL = 'https://custom.api.url';

      const config = loadExtractConfig();

      expect(config.apiUrl).toBe('https://custom.api.url');
    });

    it('should load custom rate limit from environment', () => {
      process.env.PRINTAVO_EMAIL = 'test@example.com';
      process.env.PRINTAVO_PASSWORD = 'testpass';
      process.env.PRINTAVO_RATE_LIMIT_MS = '1000';

      const config = loadExtractConfig();

      expect(config.rateLimitMs).toBe(1000);
    });
  });

  describe('ExtractLogger', () => {
    it('should format log messages correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const logger = new ExtractLogger(false);

      logger.info('Test message');

      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[0][0];
      expect(logMessage).toContain('[INFO]');
      expect(logMessage).toContain('Test message');

      consoleSpy.mockRestore();
    });

    it('should include data in log messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const logger = new ExtractLogger(false);

      logger.info('Test message', { key: 'value' });

      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[0][0];
      expect(logMessage).toContain('{"key":"value"}');

      consoleSpy.mockRestore();
    });

    it('should use console.error for error level', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const logger = new ExtractLogger(false);

      logger.error('Error message');

      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[0][0];
      expect(logMessage).toContain('[ERROR]');

      consoleSpy.mockRestore();
    });
  });

  describe('PrintavoV2Client', () => {
    let client: PrintavoV2Client;
    let logger: ExtractLogger;

    beforeEach(() => {
      logger = new ExtractLogger(false);
      client = new PrintavoV2Client(mockConfig, logger);
    });

    describe('authenticate', () => {
      it('should authenticate successfully', async () => {
        mockAxios.post.mockResolvedValueOnce({
          data: { token: 'test-bearer-token' },
        });

        await client.authenticate();

        expect(mockAxios.post).toHaveBeenCalledWith(
          `${mockConfig.apiUrl}/auth`,
          { email: mockConfig.email, password: mockConfig.password },
          { headers: { 'Content-Type': 'application/json' } },
        );
      });

      it('should handle authentication with access_token format', async () => {
        mockAxios.post.mockResolvedValueOnce({
          data: { access_token: 'test-access-token' },
        });

        await client.authenticate();

        expect(mockAxios.post).toHaveBeenCalled();
      });

      it('should throw error when no token received', async () => {
        mockAxios.post.mockResolvedValueOnce({
          data: {},
        });

        await expect(client.authenticate()).rejects.toThrow('No token received');
      });

      it('should throw error on authentication failure', async () => {
        const mockError = {
          isAxiosError: true,
          message: 'Unauthorized',
          response: { status: 401 },
        };
        mockAxios.post.mockRejectedValueOnce(mockError);

        await expect(client.authenticate()).rejects.toThrow('Authentication failed');
      });
    });

    describe('executeQuery', () => {
      beforeEach(async () => {
        mockAxios.post.mockResolvedValueOnce({
          data: { token: 'test-token' },
        });
        await client.authenticate();
      });

      it('should handle single page response', async () => {
        mockAxios.post.mockResolvedValueOnce({
          data: {
            data: {
              customers: {
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [{ id: '1', name: 'Customer 1' }],
              },
            },
          },
        });

        const results = await client.extractCustomers();

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('1');
      });

      it('should handle pagination', async () => {
        // First page
        mockAxios.post.mockResolvedValueOnce({
          data: {
            data: {
              customers: {
                pageInfo: { hasNextPage: true, endCursor: 'cursor1' },
                nodes: [{ id: '1' }],
              },
            },
          },
        });

        // Second page
        mockAxios.post.mockResolvedValueOnce({
          data: {
            data: {
              customers: {
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [{ id: '2' }],
              },
            },
          },
        });

        const results = await client.extractCustomers();

        expect(results).toHaveLength(2);
        expect(mockAxios.post).toHaveBeenCalledTimes(3); // 1 auth + 2 pages
      });

      it('should throw error when no data returned', async () => {
        mockAxios.post.mockResolvedValueOnce({
          data: { data: {} },
        });

        await expect(client.extractCustomers()).rejects.toThrow('No data returned');
      });
    });
  });

  describe('PrintavoV2Extractor', () => {
    it('should create output directory', async () => {
      const fs = require('fs');
      const extractor = new PrintavoV2Extractor(mockConfig);

      // Mock authentication failure to end early
      mockAxios.post.mockRejectedValueOnce(new Error('Auth failed'));

      try {
        await extractor.extract();
      } catch {
        // Expected to fail
      }

      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('should return summary with counts', async () => {
      // Mock successful auth
      mockAxios.post.mockResolvedValueOnce({
        data: { token: 'test-token' },
      });

      // Mock empty responses for all entities
      const emptyResponse = (entityName: string) => ({
        data: {
          data: {
            [entityName]: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [],
            },
          },
        },
      });

      mockAxios.post
        .mockResolvedValueOnce(emptyResponse('customers'))
        .mockResolvedValueOnce(emptyResponse('orders'))
        .mockResolvedValueOnce(emptyResponse('quotes'))
        .mockResolvedValueOnce(emptyResponse('products'))
        .mockResolvedValueOnce(emptyResponse('invoices'));

      const extractor = new PrintavoV2Extractor(mockConfig);
      const summary = await extractor.extract();

      expect(summary.counts.customers).toBe(0);
      expect(summary.counts.orders).toBe(0);
      expect(summary.counts.quotes).toBe(0);
      expect(summary.counts.products).toBe(0);
      expect(summary.counts.invoices).toBe(0);
      expect(summary.errors).toHaveLength(0);
    });

    it('should record errors for failed entity extraction', async () => {
      // Mock successful auth
      mockAxios.post.mockResolvedValueOnce({
        data: { token: 'test-token' },
      });

      // Mock failed customers, successful others
      mockAxios.post.mockRejectedValueOnce(new Error('Customer fetch failed'));

      const emptyResponse = (entityName: string) => ({
        data: {
          data: {
            [entityName]: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [],
            },
          },
        },
      });

      mockAxios.post
        .mockResolvedValueOnce(emptyResponse('orders'))
        .mockResolvedValueOnce(emptyResponse('quotes'))
        .mockResolvedValueOnce(emptyResponse('products'))
        .mockResolvedValueOnce(emptyResponse('invoices'));

      const extractor = new PrintavoV2Extractor(mockConfig);
      const summary = await extractor.extract();

      expect(summary.errors).toHaveLength(1);
      expect(summary.errors[0].entity).toBe('customers');
    });
  });
});
