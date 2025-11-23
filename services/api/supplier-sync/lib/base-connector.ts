/**
 * Base connector class with common functionality for all supplier connectors
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { ConnectorConfig, RetryConfig } from './types';

export abstract class BaseConnector {
  protected client: AxiosInstance;
  protected retryConfig: RetryConfig;

  constructor(protected config: ConnectorConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.retryConfig = config.retryConfig || {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    };
  }

  /**
   * Execute an API request with retry logic
   */
  protected async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    retries = 0
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      const isRetryable = this.isRetryableError(error);
      
      if (!isRetryable || retries >= this.retryConfig.maxRetries) {
        throw this.normalizeError(error);
      }

      const delay = this.calculateBackoff(retries);
      await this.sleep(delay);
      
      return this.executeWithRetry(requestFn, retries + 1);
    }
  }

  /**
   * Determine if an error is retryable
   */
  protected isRetryableError(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      // Network errors are retryable
      if (!axiosError.response) {
        return true;
      }

      // 5xx errors are retryable
      const status = axiosError.response.status;
      if (status >= 500 && status < 600) {
        return true;
      }

      // 429 (rate limit) is retryable
      if (status === 429) {
        return true;
      }

      // 408 (request timeout) is retryable
      if (status === 408) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  protected calculateBackoff(retryCount: number): number {
    const delay = Math.min(
      this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
      this.retryConfig.maxDelayMs
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Normalize error into a consistent format
   */
  protected normalizeError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data || axiosError.message;
      
      return new Error(
        `API Error (${status || 'network'}): ${JSON.stringify(message)}`
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(`Unknown error: ${JSON.stringify(error)}`);
  }

  /**
   * Extract array from various response structures
   * Handles common API response patterns like { data: [] }, { items: [] }, or direct arrays
   */
  protected extractArrayFromResponse<T>(
    response: any,
    possibleKeys: string[] = ['data', 'items', 'results', 'products', 'styles']
  ): T[] {
    // If response is already an array, return it
    if (Array.isArray(response)) {
      return response;
    }

    // Check each possible key for array data
    for (const key of possibleKeys) {
      if (response[key] && Array.isArray(response[key])) {
        return response[key];
      }
    }

    // No array found, return empty array
    this.log('warn', 'No array found in response structure', response);
    return [];
  }

  /**
   * Log message (override in subclasses for custom logging)
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (meta) {
      console[level](logMessage, meta);
    } else {
      console[level](logMessage);
    }
  }
}
