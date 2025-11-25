/**
 * Tests for BaseConnector
 */

import MockAdapter from 'axios-mock-adapter';
import { BaseConnector } from '../base-connector';
import { ConnectorConfig } from '../types';

class TestConnector extends BaseConnector {
  constructor(config: ConnectorConfig) {
    super(config);
  }

  // Expose protected methods for testing
  public async testExecuteWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    return this.executeWithRetry(fn);
  }

  public testIsRetryableError(error: any): boolean {
    return this.isRetryableError(error);
  }

  public testCalculateBackoff(retryCount: number): number {
    return this.calculateBackoff(retryCount);
  }

  public testNormalizeError(error: any): Error {
    return this.normalizeError(error);
  }
}

describe('BaseConnector', () => {
  let connector: TestConnector;
  let mockAdapter: MockAdapter;

  const config: ConnectorConfig = {
    baseUrl: 'https://api.test.com',
    auth: {},
    retryConfig: {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
    },
  };

  beforeEach(() => {
    connector = new TestConnector(config);
    // @ts-ignore - accessing protected property for testing
    mockAdapter = new MockAdapter(connector.client);
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      mockAdapter.onGet('/test').reply(200, { success: true });

      const result = await connector.testExecuteWithRetry(() =>
        // @ts-ignore
        connector.client.get('/test')
      );

      expect(result.data).toEqual({ success: true });
      expect(mockAdapter.history.get.length).toBe(1);
    });

    it('should retry on 500 error and eventually succeed', async () => {
      mockAdapter
        .onGet('/test')
        .replyOnce(500)
        .onGet('/test')
        .reply(200, { success: true });

      const result = await connector.testExecuteWithRetry(() =>
        // @ts-ignore
        connector.client.get('/test')
      );

      expect(result.data).toEqual({ success: true });
      expect(mockAdapter.history.get.length).toBe(2);
    });

    it('should fail after max retries', async () => {
      mockAdapter.onGet('/test').reply(500);

      await expect(
        connector.testExecuteWithRetry(() =>
          // @ts-ignore
          connector.client.get('/test')
        )
      ).rejects.toThrow();

      expect(mockAdapter.history.get.length).toBe(4); // initial + 3 retries
    });

    it('should not retry on non-retryable errors', async () => {
      mockAdapter.onGet('/test').reply(400);

      await expect(
        connector.testExecuteWithRetry(() =>
          // @ts-ignore
          connector.client.get('/test')
        )
      ).rejects.toThrow();

      expect(mockAdapter.history.get.length).toBe(1);
    });
  });

  describe('isRetryableError', () => {
    it('should identify 5xx errors as retryable', () => {
      const errors = [500, 502, 503, 504];
      errors.forEach((status) => {
        const error: any = {
          isAxiosError: true,
          response: { status },
        };
        expect(connector.testIsRetryableError(error)).toBe(true);
      });
    });

    it('should identify 429 (rate limit) as retryable', () => {
      const error: any = {
        isAxiosError: true,
        response: { status: 429 },
      };
      expect(connector.testIsRetryableError(error)).toBe(true);
    });

    it('should identify 408 (timeout) as retryable', () => {
      const error: any = {
        isAxiosError: true,
        response: { status: 408 },
      };
      expect(connector.testIsRetryableError(error)).toBe(true);
    });

    it('should identify network errors as retryable', () => {
      const error: any = {
        isAxiosError: true,
        response: undefined,
      };
      expect(connector.testIsRetryableError(error)).toBe(true);
    });

    it('should not identify 4xx client errors as retryable', () => {
      const errors = [400, 401, 403, 404];
      errors.forEach((status) => {
        const error: any = {
          isAxiosError: true,
          response: { status },
        };
        expect(connector.testIsRetryableError(error)).toBe(false);
      });
    });

    it('should not identify non-axios errors as retryable', () => {
      const error = new Error('Regular error');
      expect(connector.testIsRetryableError(error)).toBe(false);
    });
  });

  describe('calculateBackoff', () => {
    it('should calculate exponential backoff', () => {
      const backoff0 = connector.testCalculateBackoff(0);
      const backoff1 = connector.testCalculateBackoff(1);
      const backoff2 = connector.testCalculateBackoff(2);

      expect(backoff0).toBeGreaterThanOrEqual(100);
      expect(backoff0).toBeLessThanOrEqual(130);
      
      expect(backoff1).toBeGreaterThanOrEqual(200);
      expect(backoff1).toBeLessThanOrEqual(260);
      
      expect(backoff2).toBeGreaterThanOrEqual(400);
      expect(backoff2).toBeLessThanOrEqual(520);
    });

    it('should respect max delay', () => {
      const backoff10 = connector.testCalculateBackoff(10);
      
      expect(backoff10).toBeLessThanOrEqual(1300); // maxDelayMs + jitter
    });

    it('should add jitter to prevent thundering herd', () => {
      const backoffs = Array.from({ length: 10 }, () =>
        connector.testCalculateBackoff(1)
      );

      const uniqueBackoffs = new Set(backoffs);
      expect(uniqueBackoffs.size).toBeGreaterThan(1);
    });
  });

  describe('normalizeError', () => {
    it('should normalize axios errors', () => {
      const axiosError: any = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
        message: 'Request failed',
      };

      const normalized = connector.testNormalizeError(axiosError);

      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toContain('500');
      expect(normalized.message).toContain('Internal Server Error');
    });

    it('should normalize network errors', () => {
      const networkError: any = {
        isAxiosError: true,
        message: 'Network Error',
      };

      const normalized = connector.testNormalizeError(networkError);

      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toContain('network');
      expect(normalized.message).toContain('Network Error');
    });

    it('should preserve Error instances', () => {
      const error = new Error('Test error');

      const normalized = connector.testNormalizeError(error);

      expect(normalized).toBe(error);
      expect(normalized.message).toBe('Test error');
    });

    it('should handle unknown errors', () => {
      const unknownError = { some: 'object' };

      const normalized = connector.testNormalizeError(unknownError);

      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toContain('Unknown error');
    });
  });

  describe('client configuration', () => {
    it('should set up axios client with correct config', () => {
      // @ts-ignore
      expect(connector.client.defaults.baseURL).toBe('https://api.test.com');
      // @ts-ignore
      expect(connector.client.defaults.timeout).toBe(30000);
      // @ts-ignore
      expect(connector.client.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should use custom timeout if provided', () => {
      const customConfig: ConnectorConfig = {
        ...config,
        timeout: 60000,
      };

      const customConnector = new TestConnector(customConfig);
      // @ts-ignore
      expect(customConnector.client.defaults.timeout).toBe(60000);
    });
  });
});
