/**
 * Live Printavo Data Sync Service
 * 
 * Polls Printavo API every 15 minutes (configurable), transforms orders,
 * and syncs them to Strapi with comprehensive error handling and logging.
 * 
 * Features:
 * - Automatic polling at configurable intervals
 * - Incremental sync (only new/updated orders)
 * - Comprehensive error handling with retries
 * - Detailed logging for debugging and monitoring
 * - Graceful shutdown handling
 * 
 * Usage:
 *   npm run sync:printavo
 * 
 * Environment Variables:
 *   PRINTAVO_API_KEY - Printavo API key (required)
 *   PRINTAVO_API_URL - Printavo API base URL (default: https://www.printavo.com/api)
 *   STRAPI_API_URL - Strapi API base URL (default: http://localhost:1337)
 *   STRAPI_API_TOKEN - Strapi API token (required)
 *   SYNC_INTERVAL_MINUTES - Polling interval in minutes (default: 15)
 *   SYNC_BATCH_SIZE - Number of orders to process per batch (default: 100)
 *   SYNC_MAX_RETRIES - Maximum retry attempts for failed requests (default: 3)
 *   SYNC_TIMEOUT_SECONDS - Request timeout in seconds (default: 30)
 *   LOG_LEVEL - Logging level: debug, info, warn, error (default: info)
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import {
  transformPrintavoToStrapi,
  type PrintavoOrder,
} from '../lib/printavo-mapper';
import { type StrapiOrder } from '../lib/strapi-schema';

/**
 * Configuration for the sync service
 */
export interface SyncConfig {
  printavoApiKey: string;
  printavoApiUrl: string;
  strapiApiUrl: string;
  strapiApiToken: string;
  syncIntervalMinutes: number;
  syncBatchSize: number;
  maxRetries: number;
  timeoutSeconds: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Statistics for sync operations
 */
export interface SyncStats {
  totalFetched: number;
  totalTransformed: number;
  totalSynced: number;
  totalErrors: number;
  lastSyncTime: Date | null;
  lastSuccessfulSync: Date | null;
  errors: Array<{
    timestamp: Date;
    orderId?: number;
    error: string;
  }>;
}

/**
 * Result from a single sync cycle
 */
export interface SyncCycleResult {
  success: boolean;
  fetchedCount: number;
  syncedCount: number;
  errorCount: number;
  errors: Array<{
    orderId?: number;
    error: string;
  }>;
  duration: number;
  timestamp: Date;
}

/**
 * Logger for the sync service
 */
export class SyncLogger {
  private logLevel: SyncConfig['logLevel'];
  private logFile: string | null = null;

  constructor(logLevel: SyncConfig['logLevel'], logToFile: boolean = true) {
    this.logLevel = logLevel;

    if (logToFile) {
      const logDir = path.join(process.cwd(), 'data', 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      // Use date-based naming to group logs by day instead of creating a new file per restart
      const dateStr = new Date().toISOString().split('T')[0];
      this.logFile = path.join(logDir, `sync-printavo-${dateStr}.log`);
    }
  }

  private shouldLog(level: SyncConfig['logLevel']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  log(level: SyncConfig['logLevel'], message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data);

    // Console output
    if (level === 'error') {
      console.error(formattedMessage);
    } else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }

    // File output
    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (err) {
        console.error('Failed to write to log file:', err);
      }
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
}

/**
 * Printavo API Client
 */
export class PrintavoClient {
  private client: AxiosInstance;
  private logger: SyncLogger;

  constructor(apiKey: string, apiUrl: string, timeoutSeconds: number, logger: SyncLogger) {
    this.logger = logger;
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: timeoutSeconds * 1000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch orders from Printavo API
   * @param since - ISO 8601 timestamp to fetch orders updated since
   * @param limit - Maximum number of orders to fetch
   */
  async fetchOrders(since?: string, limit: number = 100): Promise<PrintavoOrder[]> {
    try {
      this.logger.debug('Fetching orders from Printavo', { since, limit });

      const params: any = { limit };
      if (since) {
        params.updated_since = since;
      }

      const response = await this.client.get('/v1/orders', { params });
      
      // Handle different response formats from Printavo API:
      // - response.data.data: Standard paginated response with nested data
      // - response.data: Direct array response
      // - []: Fallback for unexpected formats
      const orders = response.data?.data || response.data || [];

      this.logger.info(`Fetched ${orders.length} orders from Printavo`);
      return orders;
    } catch (error) {
      this.logger.error('Failed to fetch orders from Printavo', {
        error: this.formatError(error),
      });
      throw error;
    }
  }

  private formatError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return `${error.message} (status: ${error.response?.status || 'unknown'})`;
    }
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Strapi API Client
 */
export class StrapiClient {
  private client: AxiosInstance;
  private logger: SyncLogger;

  constructor(apiUrl: string, apiToken: string, timeoutSeconds: number, logger: SyncLogger) {
    this.logger = logger;
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: timeoutSeconds * 1000,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create or update an order in Strapi
   * @param order - Strapi order data
   */
  async upsertOrder(order: StrapiOrder): Promise<void> {
    try {
      this.logger.debug('Upserting order to Strapi', {
        printavoId: order.printavoId,
      });

      // Check if order exists by printavoId
      const existing = await this.findOrderByPrintavoId(order.printavoId);

      if (existing) {
        // Update existing order
        await this.client.put(`/api/orders/${existing.id}`, { data: order });
        this.logger.debug(`Updated order ${order.printavoId}`);
      } else {
        // Create new order
        await this.client.post('/api/orders', { data: order });
        this.logger.debug(`Created order ${order.printavoId}`);
      }
    } catch (error) {
      this.logger.error('Failed to upsert order to Strapi', {
        printavoId: order.printavoId,
        error: this.formatError(error),
      });
      throw error;
    }
  }

  /**
   * Find order by Printavo ID
   */
  private async findOrderByPrintavoId(printavoId: string): Promise<any | null> {
    try {
      const response = await this.client.get('/api/orders', {
        params: {
          filters: {
            printavoId: {
              $eq: printavoId,
            },
          },
        },
      });

      const orders = response.data?.data || [];
      return orders.length > 0 ? orders[0] : null;
    } catch (error) {
      this.logger.debug('Error finding order by printavoId', {
        printavoId,
        error: this.formatError(error),
      });
      return null;
    }
  }

  private formatError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return `${error.message} (status: ${error.response?.status || 'unknown'})`;
    }
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Main sync service
 */
export class PrintavoSyncService {
  private config: SyncConfig;
  private logger: SyncLogger;
  private printavoClient: PrintavoClient;
  private strapiClient: StrapiClient;
  private stats: SyncStats;
  private isRunning: boolean = false;
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(config: SyncConfig) {
    this.config = config;
    this.logger = new SyncLogger(config.logLevel);
    this.printavoClient = new PrintavoClient(
      config.printavoApiKey,
      config.printavoApiUrl,
      config.timeoutSeconds,
      this.logger,
    );
    this.strapiClient = new StrapiClient(
      config.strapiApiUrl,
      config.strapiApiToken,
      config.timeoutSeconds,
      this.logger,
    );
    this.stats = {
      totalFetched: 0,
      totalTransformed: 0,
      totalSynced: 0,
      totalErrors: 0,
      lastSyncTime: null,
      lastSuccessfulSync: null,
      errors: [],
    };
  }

  /**
   * Start the sync service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Sync service is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting Printavo sync service', {
      intervalMinutes: this.config.syncIntervalMinutes,
      batchSize: this.config.syncBatchSize,
    });

    // Run first sync immediately
    await this.runSyncCycle();

    // Schedule periodic syncs
    this.intervalHandle = setInterval(
      () => this.runSyncCycle(),
      this.config.syncIntervalMinutes * 60 * 1000,
    );

    this.logger.info('Sync service started successfully');
  }

  /**
   * Stop the sync service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Sync service is not running');
      return;
    }

    this.logger.info('Stopping sync service...');
    this.isRunning = false;

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    this.logger.info('Sync service stopped', {
      totalStats: this.stats,
    });
  }

  /**
   * Run a single sync cycle
   */
  async runSyncCycle(): Promise<SyncCycleResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    this.logger.info('Starting sync cycle');
    this.stats.lastSyncTime = timestamp;

    const result: SyncCycleResult = {
      success: false,
      fetchedCount: 0,
      syncedCount: 0,
      errorCount: 0,
      errors: [],
      duration: 0,
      timestamp,
    };

    try {
      // Fetch orders from Printavo
      const since = this.stats.lastSuccessfulSync?.toISOString();
      const orders = await this.fetchWithRetry(since);
      result.fetchedCount = orders.length;
      this.stats.totalFetched += orders.length;

      if (orders.length === 0) {
        this.logger.info('No new orders to sync');
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Transform and sync orders
      for (const printavoOrder of orders) {
        try {
          // Transform order
          const strapiOrder = transformPrintavoToStrapi(printavoOrder);
          this.stats.totalTransformed++;

          // Sync to Strapi with retry
          await this.syncWithRetry(strapiOrder);
          result.syncedCount++;
          this.stats.totalSynced++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error('Failed to process order', {
            orderId: printavoOrder.id,
            error: errorMessage,
          });

          result.errors.push({
            orderId: printavoOrder.id,
            error: errorMessage,
          });
          result.errorCount++;
          this.stats.totalErrors++;
          this.stats.errors.push({
            timestamp: new Date(),
            orderId: printavoOrder.id,
            error: errorMessage,
          });

          // Keep only last 100 errors in memory
          if (this.stats.errors.length > 100) {
            this.stats.errors.shift();
          }
        }
      }

      result.success = result.errorCount === 0 || result.syncedCount > 0;
      if (result.success) {
        this.stats.lastSuccessfulSync = timestamp;
      }

      this.logger.info('Sync cycle completed', {
        fetched: result.fetchedCount,
        synced: result.syncedCount,
        errors: result.errorCount,
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Sync cycle failed', { error: errorMessage });
      result.errors.push({ error: errorMessage });
      result.errorCount++;
      this.stats.totalErrors++;
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Fetch orders with retry logic
   */
  private async fetchWithRetry(since?: string): Promise<PrintavoOrder[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.printavoClient.fetchOrders(since, this.config.syncBatchSize);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Fetch attempt ${attempt} failed`, {
          error: lastError.message,
          willRetry: attempt < this.config.maxRetries,
        });

        if (attempt < this.config.maxRetries) {
          await this.sleep(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw new Error(`Failed to fetch orders after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Sync order with retry logic
   */
  private async syncWithRetry(order: StrapiOrder): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.strapiClient.upsertOrder(order);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Sync attempt ${attempt} failed for order ${order.printavoId}`, {
          error: lastError.message,
          willRetry: attempt < this.config.maxRetries,
        });

        if (attempt < this.config.maxRetries) {
          await this.sleep(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw new Error(`Failed to sync order after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current sync statistics
   */
  getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * Get logger instance
   */
  getLogger(): SyncLogger {
    return this.logger;
  }
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): SyncConfig {
  const printavoApiKey = process.env.PRINTAVO_API_KEY;
  const strapiApiToken = process.env.STRAPI_API_TOKEN;

  if (!printavoApiKey) {
    throw new Error('PRINTAVO_API_KEY environment variable is required');
  }

  if (!strapiApiToken) {
    throw new Error('STRAPI_API_TOKEN environment variable is required');
  }

  return {
    printavoApiKey,
    printavoApiUrl: process.env.PRINTAVO_API_URL || 'https://www.printavo.com/api',
    strapiApiUrl: process.env.STRAPI_API_URL || 'http://localhost:1337',
    strapiApiToken,
    syncIntervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || '15', 10),
    syncBatchSize: parseInt(process.env.SYNC_BATCH_SIZE || '100', 10),
    maxRetries: parseInt(process.env.SYNC_MAX_RETRIES || '3', 10),
    timeoutSeconds: parseInt(process.env.SYNC_TIMEOUT_SECONDS || '30', 10),
    logLevel: (process.env.LOG_LEVEL as SyncConfig['logLevel']) || 'info',
  };
}

/**
 * Main entry point when run as a script
 */
if (require.main === module) {
  (async () => {
    try {
      const config = loadConfig();
      const service = new PrintavoSyncService(config);

      // Handle graceful shutdown
      const shutdown = async () => {
        console.log('\nReceived shutdown signal, stopping service...');
        await service.stop();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      // Start the service
      await service.start();

      // Keep process running
      console.log('Press Ctrl+C to stop the service');
    } catch (error) {
      console.error('Failed to start sync service:', error);
      process.exit(1);
    }
  })();
}
