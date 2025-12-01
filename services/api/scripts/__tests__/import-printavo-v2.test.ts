/**
 * Unit tests for Printavo v2 Import Script
 *
 * Tests:
 * - Configuration loading
 * - Upsert logic (create vs update)
 * - Relationship handling
 * - Checkpoint/resume functionality
 * - Error handling
 */

import {
  StrapiImportClient,
  PrintavoV2Importer,
  ImportLogger,
  loadImportConfig,
  type ImportConfig,
} from '../import-printavo-v2';

// Define mock axios type
interface MockAxiosInstance {
  create: jest.Mock;
  post: jest.Mock;
  get: jest.Mock;
  put: jest.Mock;
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
    put: jest.fn(),
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
  readFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  readdirSync: jest.fn(() => []),
  statSync: jest.fn(() => ({ isDirectory: () => true })),
}));

const mockAxios = jest.requireMock('axios') as MockAxiosInstance;
const mockFs = jest.requireMock('fs') as {
  existsSync: jest.Mock;
  mkdirSync: jest.Mock;
  writeFileSync: jest.Mock;
  readFileSync: jest.Mock;
  appendFileSync: jest.Mock;
  readdirSync: jest.Mock;
  statSync: jest.Mock;
};

describe('Printavo v2 Import', () => {
  const mockConfig: ImportConfig = {
    strapiApiUrl: 'http://localhost:1337',
    strapiApiToken: 'test-token',
    sourceDir: '/test/source',
    batchSize: 100,
    retryAttempts: 1, // Use 1 retry for faster tests
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadImportConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should throw error when STRAPI_API_TOKEN is missing', () => {
      delete process.env.STRAPI_API_TOKEN;

      expect(() => loadImportConfig()).toThrow('STRAPI_API_TOKEN environment variable is required');
    });

    it('should throw error when no source directory found', () => {
      process.env.STRAPI_API_TOKEN = 'test-token';
      mockFs.existsSync.mockReturnValue(false);

      expect(() => loadImportConfig()).toThrow('No extraction directory found');
    });

    it('should use IMPORT_SOURCE_DIR when provided', () => {
      process.env.STRAPI_API_TOKEN = 'test-token';
      process.env.IMPORT_SOURCE_DIR = '/custom/source/dir';

      const config = loadImportConfig();

      expect(config.sourceDir).toBe('/custom/source/dir');
    });

    it('should use default Strapi URL', () => {
      process.env.STRAPI_API_TOKEN = 'test-token';
      process.env.IMPORT_SOURCE_DIR = '/test/source';

      const config = loadImportConfig();

      expect(config.strapiApiUrl).toBe('http://localhost:1337');
    });

    it('should use custom Strapi URL when provided', () => {
      process.env.STRAPI_API_TOKEN = 'test-token';
      process.env.STRAPI_API_URL = 'http://custom:1337';
      process.env.IMPORT_SOURCE_DIR = '/test/source';

      const config = loadImportConfig();

      expect(config.strapiApiUrl).toBe('http://custom:1337');
    });
  });

  describe('ImportLogger', () => {
    it('should format log messages correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const logger = new ImportLogger(false);

      logger.info('Test message');

      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[0][0];
      expect(logMessage).toContain('[INFO]');
      expect(logMessage).toContain('Test message');

      consoleSpy.mockRestore();
    });

    it('should include data in log messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const logger = new ImportLogger(false);

      logger.info('Test message', { key: 'value' });

      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[0][0];
      expect(logMessage).toContain('{"key":"value"}');

      consoleSpy.mockRestore();
    });

    it('should log warnings correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const logger = new ImportLogger(false);

      logger.warn('Warning message');

      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[0][0];
      expect(logMessage).toContain('[WARN]');

      consoleSpy.mockRestore();
    });
  });

  describe('StrapiImportClient', () => {
    let client: StrapiImportClient;
    let logger: ImportLogger;

    beforeEach(() => {
      logger = new ImportLogger(false);
      client = new StrapiImportClient(mockConfig, logger);
    });

    describe('findByPrintavoId', () => {
      it('should return existing entity when found', async () => {
        mockAxios.get.mockResolvedValueOnce({
          data: {
            data: [{ id: 123, documentId: 'doc123' }],
          },
        });

        const result = await client.findByPrintavoId('customers', 'printavo-id-1');

        expect(result).toEqual({ id: 123, documentId: 'doc123' });
        expect(mockAxios.get).toHaveBeenCalledWith('/api/customers', {
          params: {
            filters: {
              printavoId: { $eq: 'printavo-id-1' },
            },
          },
        });
      });

      it('should return null when not found', async () => {
        mockAxios.get.mockResolvedValueOnce({
          data: { data: [] },
        });

        const result = await client.findByPrintavoId('customers', 'nonexistent');

        expect(result).toBeNull();
      });

      it('should return null on error', async () => {
        mockAxios.get.mockRejectedValueOnce(new Error('Network error'));

        const result = await client.findByPrintavoId('customers', 'any-id');

        expect(result).toBeNull();
      });
    });

    describe('upsert', () => {
      it('should create new entity when not found', async () => {
        mockAxios.get.mockResolvedValueOnce({ data: { data: [] } });
        mockAxios.post.mockResolvedValueOnce({
          data: { data: { id: 456 } },
        });

        const result = await client.upsert('customers', 'printavo-1', { name: 'Test' });

        expect(result).toEqual({ action: 'created', id: 456 });
        expect(mockAxios.post).toHaveBeenCalledWith('/api/customers', { data: { name: 'Test' } });
      });

      it('should update existing entity when found', async () => {
        mockAxios.get.mockResolvedValueOnce({
          data: { data: [{ id: 123 }] },
        });
        mockAxios.put.mockResolvedValueOnce({
          data: { data: { id: 123 } },
        });

        const result = await client.upsert('customers', 'printavo-1', { name: 'Updated' });

        expect(result).toEqual({ action: 'updated', id: 123 });
        expect(mockAxios.put).toHaveBeenCalledWith('/api/customers/123', {
          data: { name: 'Updated' },
        });
      });
    });

    describe('importCustomers', () => {
      it('should import customers successfully', async () => {
        mockAxios.get.mockResolvedValue({ data: { data: [] } });
        mockAxios.post.mockResolvedValue({ data: { data: { id: 1 } } });

        const customers = [
          { id: 'c1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
          { id: 'c2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
        ];

        const stats = await client.importCustomers(customers);

        expect(stats.total).toBe(2);
        expect(stats.created).toBe(2);
        expect(stats.updated).toBe(0);
        expect(stats.failed).toBe(0);
      });

      it('should track failures', async () => {
        mockAxios.get.mockResolvedValue({ data: { data: [] } });
        mockAxios.post
          .mockResolvedValueOnce({ data: { data: { id: 1 } } })
          .mockRejectedValueOnce(new Error('Create failed'));

        const customers = [
          { id: 'c1', firstName: 'John', email: 'john@test.com' },
          { id: 'c2', firstName: 'Jane', email: 'jane@test.com' },
        ];

        const stats = await client.importCustomers(customers);

        expect(stats.total).toBe(2);
        expect(stats.created).toBe(1);
        expect(stats.failed).toBe(1);
        expect(stats.errors).toHaveLength(1);
        expect(stats.errors[0].id).toBe('c2');
      });
    });

    describe('importOrders', () => {
      it('should import orders successfully', async () => {
        mockAxios.get.mockResolvedValue({ data: { data: [] } });
        mockAxios.post.mockResolvedValue({ data: { data: { id: 1 } } });

        const orders = [
          {
            id: 'o1',
            visualId: '1001',
            nickname: 'Order 1',
            status: { id: 's1', name: 'QUOTE' },
          },
        ];

        const stats = await client.importOrders(orders);

        expect(stats.total).toBe(1);
        expect(stats.created).toBe(1);
        expect(stats.failed).toBe(0);
      });

      it('should resolve customer relationships', async () => {
        // Setup customer ID mapping first
        mockAxios.get.mockResolvedValueOnce({ data: { data: [] } });
        mockAxios.post.mockResolvedValueOnce({ data: { data: { id: 100 } } });

        await client.importCustomers([{ id: 'customer-1', email: 'test@test.com' }]);

        // Now import order with customer reference
        mockAxios.get.mockResolvedValue({ data: { data: [] } });
        mockAxios.post.mockResolvedValue({ data: { data: { id: 1 } } });

        const orders = [
          {
            id: 'o1',
            customer: { id: 'customer-1', email: 'test@test.com' },
            status: { id: 's1', name: 'QUOTE' },
          },
        ];

        const stats = await client.importOrders(orders);

        expect(stats.created).toBe(1);
        // Check that customer relationship was resolved
        const postCall = mockAxios.post.mock.calls[mockAxios.post.mock.calls.length - 1];
        expect(postCall[1].data.customer).toBe(100);
      });
    });
  });

  describe('PrintavoV2Importer', () => {
    describe('checkpoint functionality', () => {
      it('should skip already completed entities', async () => {
        mockFs.existsSync.mockImplementation((path: string) => {
          if (path.includes('import-checkpoint.json')) return true;
          if (path.includes('customers.json')) return true;
          return false;
        });

        mockFs.readFileSync.mockImplementation((path: string) => {
          if (path.includes('import-checkpoint.json')) {
            return JSON.stringify({
              lastUpdated: new Date().toISOString(),
              completed: { customers: true },
              progress: {},
            });
          }
          return '[]';
        });

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const importer = new PrintavoV2Importer(mockConfig);

        try {
          await importer.import();
        } catch {
          // Expected - other files not found
        }

        // Should log skip message for customers
        const skipMessage = consoleSpy.mock.calls.find((call) =>
          call[0].includes('Skipping customers'),
        );
        expect(skipMessage).toBeDefined();

        consoleSpy.mockRestore();
      });
    });

    describe('error handling', () => {
      it('should handle missing data files gracefully', async () => {
        mockFs.existsSync.mockReturnValue(false);

        const importer = new PrintavoV2Importer(mockConfig);
        const summary = await importer.import();

        expect(summary.stats).toHaveLength(0);
      });
    });
  });

  describe('error formatting', () => {
    let client: StrapiImportClient;
    let logger: ImportLogger;

    beforeEach(() => {
      logger = new ImportLogger(false);
      client = new StrapiImportClient(mockConfig, logger);
    });

    it('should format generic errors correctly', async () => {
      mockAxios.get.mockResolvedValue({ data: { data: [] } });
      mockAxios.post.mockRejectedValue(new Error('Generic error'));

      const stats = await client.importCustomers([{ id: 'c1', email: 'test@test.com' }]);

      expect(stats.errors).toHaveLength(1);
      expect(stats.errors[0].error).toContain('Generic error');
    });

    it('should handle string errors', async () => {
      mockAxios.get.mockResolvedValue({ data: { data: [] } });
      mockAxios.post.mockRejectedValue('String error');

      const stats = await client.importCustomers([{ id: 'c1', email: 'test@test.com' }]);

      expect(stats.errors).toHaveLength(1);
      // Error gets converted to string
      expect(stats.errors[0].error).toBeDefined();
    });
  });
});
