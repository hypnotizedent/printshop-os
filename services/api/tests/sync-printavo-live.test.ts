/**
 * Comprehensive test suite for Live Printavo Data Sync Service
 * Tests API clients, sync logic, error handling, retry mechanisms, and logging
 */

import axios from 'axios';
import * as fs from 'fs';
import {
  PrintavoSyncService,
  PrintavoClient,
  StrapiClient,
  SyncLogger,
  loadConfig,
  type SyncConfig,
} from '../scripts/sync-printavo-live';
import { type PrintavoOrder } from '../lib/printavo-mapper';
import { type StrapiOrder, OrderStatus } from '../lib/strapi-schema';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock fs
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('SyncLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should log messages at correct level', () => {
    const logger = new SyncLogger('info', false);

    logger.debug('debug message'); // Should not log
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(console.log).toHaveBeenCalledTimes(1); // Only info
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  test('should log debug messages when level is debug', () => {
    const logger = new SyncLogger('debug', false);

    logger.debug('debug message');
    logger.info('info message');

    expect(console.log).toHaveBeenCalledTimes(2);
  });

  test('should include data in log messages', () => {
    const logger = new SyncLogger('info', false);
    const data = { orderId: 123, status: 'success' };

    logger.info('test message', data);

    const logCall = (console.log as jest.Mock).mock.calls[0][0];
    expect(logCall).toContain('test message');
    expect(logCall).toContain(JSON.stringify(data));
  });

  test('should write to log file when enabled', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.appendFileSync.mockImplementation();

    const logger = new SyncLogger('info', true);
    logger.info('test message');

    expect(mockedFs.appendFileSync).toHaveBeenCalled();
  });

  test('should create log directory if it does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.mkdirSync.mockImplementation();
    mockedFs.appendFileSync.mockImplementation();

    const logger = new SyncLogger('info', true);
    logger.info('test message');

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('data/logs'),
      { recursive: true }
    );
  });
});

describe('PrintavoClient', () => {
  let logger: SyncLogger;
  let client: PrintavoClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = new SyncLogger('error', false);

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    client = new PrintavoClient('test-api-key', 'https://api.test.com', 30, logger);
  });

  test('should create client with correct configuration', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'https://api.test.com',
      timeout: 30000,
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
      },
    });
  });

  test('should fetch orders successfully', async () => {
    const mockOrders: PrintavoOrder[] = [
      {
        id: 123,
        customer: {
          full_name: 'Test Customer',
          email: 'test@example.com',
        },
        customer_id: 456,
        order_addresses_attributes: [],
        lineitems_attributes: [],
        order_total: 100,
        orderstatus: { name: 'QUOTE' },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    mockAxiosInstance.get.mockResolvedValue({ data: mockOrders });

    const result = await client.fetchOrders();

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/orders', {
      params: { limit: 100 },
    });
    expect(result).toEqual(mockOrders);
  });

  test('should fetch orders with since parameter', async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: [] });

    await client.fetchOrders('2025-01-01T00:00:00Z');

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/orders', {
      params: { limit: 100, updated_since: '2025-01-01T00:00:00Z' },
    });
  });

  test('should handle nested data response', async () => {
    const mockOrders: PrintavoOrder[] = [
      {
        id: 123,
        customer: { full_name: 'Test', email: 'test@example.com' },
        customer_id: 456,
        order_addresses_attributes: [],
        lineitems_attributes: [],
        order_total: 100,
        orderstatus: { name: 'QUOTE' },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    mockAxiosInstance.get.mockResolvedValue({ data: { data: mockOrders } });

    const result = await client.fetchOrders();

    expect(result).toEqual(mockOrders);
  });

  test('should throw error when fetch fails', async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

    await expect(client.fetchOrders()).rejects.toThrow();
  });
});

describe('StrapiClient', () => {
  let logger: SyncLogger;
  let client: StrapiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = new SyncLogger('error', false);

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    client = new StrapiClient('http://localhost:1337', 'test-token', 30, logger);
  });

  test('should create client with correct configuration', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:1337',
      timeout: 30000,
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
    });
  });

  test('should create new order when order does not exist', async () => {
    const mockOrder: StrapiOrder = {
      printavoId: '123',
      customer: { name: 'Test', email: 'test@example.com' },
      status: OrderStatus.QUOTE,
      totals: {
        subtotal: 100,
        tax: 0,
        discount: 0,
        shipping: 0,
        fees: 0,
        total: 100,
        amountPaid: 0,
        amountOutstanding: 100,
      },
      lineItems: [],
      timeline: {
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      published: true,
    };

    mockAxiosInstance.get.mockResolvedValue({ data: { data: [] } });
    mockAxiosInstance.post.mockResolvedValue({ data: { data: mockOrder } });

    await client.upsertOrder(mockOrder);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/orders', {
      data: mockOrder,
    });
    expect(mockAxiosInstance.put).not.toHaveBeenCalled();
  });

  test('should update existing order when order exists', async () => {
    const mockOrder: StrapiOrder = {
      printavoId: '123',
      customer: { name: 'Test', email: 'test@example.com' },
      status: OrderStatus.QUOTE,
      totals: {
        subtotal: 100,
        tax: 0,
        discount: 0,
        shipping: 0,
        fees: 0,
        total: 100,
        amountPaid: 0,
        amountOutstanding: 100,
      },
      lineItems: [],
      timeline: {
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      published: true,
    };

    const existingOrder = { id: 456, ...mockOrder };

    mockAxiosInstance.get.mockResolvedValue({ data: { data: [existingOrder] } });
    mockAxiosInstance.put.mockResolvedValue({ data: { data: mockOrder } });

    await client.upsertOrder(mockOrder);

    expect(mockAxiosInstance.put).toHaveBeenCalledWith('/api/orders/456', {
      data: mockOrder,
    });
    expect(mockAxiosInstance.post).not.toHaveBeenCalled();
  });

  test('should throw error when upsert fails', async () => {
    const mockOrder: StrapiOrder = {
      printavoId: '123',
      customer: { name: 'Test', email: 'test@example.com' },
      status: OrderStatus.QUOTE,
      totals: {
        subtotal: 100,
        tax: 0,
        discount: 0,
        shipping: 0,
        fees: 0,
        total: 100,
        amountPaid: 0,
        amountOutstanding: 100,
      },
      lineItems: [],
      timeline: {
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      published: true,
    };

    // Make both get and post fail to ensure upsert fails
    mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));
    mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

    await expect(client.upsertOrder(mockOrder)).rejects.toThrow();
  });
});

describe('PrintavoSyncService', () => {
  let service: PrintavoSyncService;
  let mockAxiosInstance: any;
  let config: SyncConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    config = {
      printavoApiKey: 'test-key',
      printavoApiUrl: 'https://api.test.com',
      strapiApiUrl: 'http://localhost:1337',
      strapiApiToken: 'test-token',
      syncIntervalMinutes: 15,
      syncBatchSize: 100,
      maxRetries: 3,
      timeoutSeconds: 30,
      logLevel: 'error',
    };

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.appendFileSync.mockImplementation();

    service = new PrintavoSyncService(config);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should initialize with correct configuration', () => {
    expect(service).toBeDefined();
    const stats = service.getStats();
    expect(stats.totalFetched).toBe(0);
    expect(stats.totalSynced).toBe(0);
    expect(stats.totalErrors).toBe(0);
  });

  test('should start sync service and run first cycle', async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: [] });

    await service.start();

    expect(mockAxiosInstance.get).toHaveBeenCalled();

    await service.stop();
  });

  test('should handle sync cycle with no orders', async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: [] });

    const result = await service.runSyncCycle();

    expect(result.success).toBe(true);
    expect(result.fetchedCount).toBe(0);
    expect(result.syncedCount).toBe(0);
    expect(result.errorCount).toBe(0);
  });

  test('should sync orders successfully', async () => {
    const mockOrders: PrintavoOrder[] = [
      {
        id: 123,
        customer: {
          full_name: 'Test Customer',
          email: 'test@example.com',
        },
        customer_id: 456,
        order_addresses_attributes: [
          {
            id: 1,
            name: 'Customer Shipping',
            address1: '123 Main St',
            city: 'Test City',
            state: 'CA',
            zip: '12345',
          },
        ],
        lineitems_attributes: [],
        order_total: 100,
        orderstatus: { name: 'QUOTE' },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockOrders });
    mockAxiosInstance.get.mockResolvedValueOnce({ data: { data: [] } });
    mockAxiosInstance.post.mockResolvedValue({ data: { data: {} } });

    const result = await service.runSyncCycle();

    expect(result.fetchedCount).toBe(1);
    expect(result.syncedCount).toBe(1);
    expect(result.errorCount).toBe(0);
    expect(result.success).toBe(true);
  });

  test('should handle transformation errors gracefully', async () => {
    const mockOrders: PrintavoOrder[] = [
      {
        id: 123,
        customer: {
          full_name: 'Test Customer',
          email: 'invalid-email', // Invalid email to trigger transformation error
        },
        customer_id: 456,
        order_addresses_attributes: [],
        lineitems_attributes: [],
        order_total: 100,
        orderstatus: { name: 'QUOTE' },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    mockAxiosInstance.get.mockResolvedValue({ data: mockOrders });

    const result = await service.runSyncCycle();

    expect(result.fetchedCount).toBe(1);
    expect(result.syncedCount).toBe(0);
    expect(result.errorCount).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].orderId).toBe(123);
  });

  test('should retry on fetch failure', async () => {
    mockAxiosInstance.get
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: [] });

    // Use real timers for this test to avoid timeout issues
    jest.useRealTimers();
    const result = await service.runSyncCycle();
    jest.useFakeTimers();

    expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(true);
  });

  test('should fail after max retries', async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

    // Use real timers for this test to avoid timeout issues
    jest.useRealTimers();
    const result = await service.runSyncCycle();
    jest.useFakeTimers();

    expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(false);
    expect(result.errorCount).toBe(1);
  });

  test('should track sync statistics correctly', async () => {
    const mockOrders: PrintavoOrder[] = [
      {
        id: 123,
        customer: {
          full_name: 'Test Customer',
          email: 'test@example.com',
        },
        customer_id: 456,
        order_addresses_attributes: [
          {
            id: 1,
            name: 'Customer Shipping',
            address1: '123 Main St',
            city: 'Test City',
            state: 'CA',
            zip: '12345',
          },
        ],
        lineitems_attributes: [],
        order_total: 100,
        orderstatus: { name: 'QUOTE' },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockOrders });
    mockAxiosInstance.get.mockResolvedValueOnce({ data: { data: [] } });
    mockAxiosInstance.post.mockResolvedValue({ data: { data: {} } });

    await service.runSyncCycle();

    const stats = service.getStats();
    expect(stats.totalFetched).toBe(1);
    expect(stats.totalTransformed).toBe(1);
    expect(stats.totalSynced).toBe(1);
    expect(stats.totalErrors).toBe(0);
    expect(stats.lastSyncTime).toBeDefined();
    expect(stats.lastSuccessfulSync).toBeDefined();
  });

  test('should update lastSuccessfulSync only on success', async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

    // Use real timers for this test to avoid timeout issues
    jest.useRealTimers();
    await service.runSyncCycle();
    jest.useFakeTimers();

    const stats = service.getStats();
    expect(stats.lastSyncTime).toBeDefined();
    expect(stats.lastSuccessfulSync).toBeNull();
  });

  test('should limit stored errors to 100', async () => {
    const mockOrders: PrintavoOrder[] = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      customer: {
        full_name: 'Test Customer',
        email: 'invalid-email', // Invalid to trigger error
      },
      customer_id: 456,
      order_addresses_attributes: [],
      lineitems_attributes: [],
      order_total: 100,
      orderstatus: { name: 'QUOTE' },
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }));

    mockAxiosInstance.get.mockResolvedValue({ data: mockOrders });

    await service.runSyncCycle();

    const stats = service.getStats();
    expect(stats.errors.length).toBe(100);
    expect(stats.totalErrors).toBe(150);
  });
});

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should load configuration from environment variables', () => {
    process.env.PRINTAVO_API_KEY = 'test-key';
    process.env.STRAPI_API_TOKEN = 'test-token';
    process.env.PRINTAVO_API_URL = 'https://custom.api.com';
    process.env.STRAPI_API_URL = 'http://custom.strapi.com';
    process.env.SYNC_INTERVAL_MINUTES = '30';
    process.env.SYNC_BATCH_SIZE = '50';
    process.env.SYNC_MAX_RETRIES = '5';
    process.env.SYNC_TIMEOUT_SECONDS = '60';
    process.env.LOG_LEVEL = 'debug';

    const config = loadConfig();

    expect(config.printavoApiKey).toBe('test-key');
    expect(config.strapiApiToken).toBe('test-token');
    expect(config.printavoApiUrl).toBe('https://custom.api.com');
    expect(config.strapiApiUrl).toBe('http://custom.strapi.com');
    expect(config.syncIntervalMinutes).toBe(30);
    expect(config.syncBatchSize).toBe(50);
    expect(config.maxRetries).toBe(5);
    expect(config.timeoutSeconds).toBe(60);
    expect(config.logLevel).toBe('debug');
  });

  test('should use default values when optional env vars are not set', () => {
    process.env.PRINTAVO_API_KEY = 'test-key';
    process.env.STRAPI_API_TOKEN = 'test-token';

    const config = loadConfig();

    expect(config.printavoApiUrl).toBe('https://www.printavo.com/api');
    expect(config.strapiApiUrl).toBe('http://localhost:1337');
    expect(config.syncIntervalMinutes).toBe(15);
    expect(config.syncBatchSize).toBe(100);
    expect(config.maxRetries).toBe(3);
    expect(config.timeoutSeconds).toBe(30);
    expect(config.logLevel).toBe('info');
  });

  test('should throw error when PRINTAVO_API_KEY is missing', () => {
    process.env.STRAPI_API_TOKEN = 'test-token';
    delete process.env.PRINTAVO_API_KEY;

    expect(() => loadConfig()).toThrow('PRINTAVO_API_KEY environment variable is required');
  });

  test('should throw error when STRAPI_API_TOKEN is missing', () => {
    process.env.PRINTAVO_API_KEY = 'test-key';
    delete process.env.STRAPI_API_TOKEN;

    expect(() => loadConfig()).toThrow('STRAPI_API_TOKEN environment variable is required');
  });
});
