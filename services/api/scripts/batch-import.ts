/**
 * Batch import script for Printavo orders into Strapi
 * Handles 1000-item batches, duplicate detection, error recovery, and progress logging
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  transformPrintavoToStrapi,
  transformPrintavoOrdersBatch,
  type PrintavoOrder,
} from '../lib/printavo-mapper';
import { type StrapiOrder } from '../lib/strapi-schema';

/**
 * Configuration for batch import process
 */
export interface BatchImportConfig {
  /** Number of orders to process per batch */
  batchSize: number;
  /** Whether to skip duplicate orders */
  skipDuplicates: boolean;
  /** Maximum number of retries for failed batches */
  maxRetries: number;
  /** Delay between retry attempts in milliseconds */
  retryDelayMs: number;
  /** Output directory for results */
  outputDir: string;
  /** Whether to log to file */
  logToFile: boolean;
  /** Custom logger function */
  logger?: (level: string, message: string, data?: any) => void;
}

/**
 * Default configuration for batch import
 */
const DEFAULT_CONFIG: BatchImportConfig = {
  batchSize: 1000,
  skipDuplicates: true,
  maxRetries: 3,
  retryDelayMs: 1000,
  outputDir: './import-results',
  logToFile: true,
};

/**
 * Results from a single batch operation
 */
export interface BatchResult {
  batchNumber: number;
  startIndex: number;
  endIndex: number;
  totalOrders: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  successfulOrders: StrapiOrder[];
  errors: Array<{
    orderId: number;
    error: string;
  }>;
  duplicates: string[];
  processingTimeMs: number;
}

/**
 * Complete import session results
 */
export interface ImportSessionResult {
  startTime: Date;
  endTime?: Date;
  totalOrdersProcessed: number;
  totalSuccessful: number;
  totalErrors: number;
  totalDuplicates: number;
  batches: BatchResult[];
  sessionId: string;
  outputDirectory: string;
}

/**
 * Logger class for tracking batch import progress
 */
class ImportLogger {
  private sessionId: string;
  private logFile: string | null = null;
  private logs: Array<{ timestamp: Date; level: string; message: string; data?: any }> = [];
  private customLogger?: (level: string, message: string, data?: any) => void;

  constructor(
    sessionId: string,
    logToFile: boolean = true,
    outputDir: string = './import-results',
    customLogger?: (level: string, message: string, data?: any) => void,
  ) {
    this.sessionId = sessionId;
    this.customLogger = customLogger;

    if (logToFile) {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      this.logFile = path.join(outputDir, `import-${sessionId}.log`);
      this.log('info', 'Import session started', { sessionId });
    }
  }

  /**
   * Log a message with optional data
   */
  log(level: string, message: string, data?: any): void {
    const entry = {
      timestamp: new Date(),
      level,
      message,
      data,
    };

    this.logs.push(entry);

    const formattedMessage = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] ${message}${
      data ? ' ' + JSON.stringify(data) : ''
    }`;

    // Use custom logger if provided
    if (this.customLogger) {
      this.customLogger(level, message, data);
    } else {
      if (level === 'error') {
        console.error(formattedMessage);
      } else if (level === 'warn') {
        console.warn(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    }

    // Write to log file
    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (err) {
        console.error('Failed to write to log file:', err);
      }
    }
  }

  /**
   * Get all logs for this session
   */
  getLogs(): typeof this.logs {
    return this.logs;
  }

  /**
   * Save logs to JSON file
   */
  saveLogs(outputDir: string): string {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const logsFile = path.join(outputDir, `import-${this.sessionId}-logs.json`);
    fs.writeFileSync(logsFile, JSON.stringify(this.logs, null, 2));
    return logsFile;
  }
}

/**
 * Batch importer for Printavo orders
 */
export class PrintavoBatchImporter {
  private config: BatchImportConfig;
  private logger: ImportLogger;
  private seenPrintavoIds: Set<string> = new Set();
  private sessionResult: ImportSessionResult;

  constructor(config: Partial<BatchImportConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.logger = new ImportLogger(
      sessionId,
      this.config.logToFile,
      this.config.outputDir,
      this.config.logger,
    );

    this.sessionResult = {
      startTime: new Date(),
      totalOrdersProcessed: 0,
      totalSuccessful: 0,
      totalErrors: 0,
      totalDuplicates: 0,
      batches: [],
      sessionId,
      outputDirectory: this.config.outputDir,
    };

    this.logger.log('info', 'Batch importer initialized', {
      batchSize: this.config.batchSize,
      skipDuplicates: this.config.skipDuplicates,
      maxRetries: this.config.maxRetries,
    });
  }

  /**
   * Check if an order has already been imported
   */
  private isDuplicate(printavoId: string): boolean {
    if (!this.config.skipDuplicates) {
      return false;
    }
    return this.seenPrintavoIds.has(printavoId);
  }

  /**
   * Mark an order as imported
   */
  private markAsImported(printavoId: string): void {
    this.seenPrintavoIds.add(printavoId);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Process a single batch of orders
   */
  private processBatch(orders: PrintavoOrder[], batchNumber: number): BatchResult {
    const startTime = Date.now();
    const startIndex = (batchNumber - 1) * this.config.batchSize;
    const endIndex = startIndex + orders.length;

    this.logger.log('info', `Processing batch ${batchNumber}`, {
      orderCount: orders.length,
      startIndex,
      endIndex,
    });

    const duplicates: string[] = [];
    const ordersToProcess: PrintavoOrder[] = [];

    // Filter duplicates
    for (const order of orders) {
      const printavoId = String(order.id);
      if (this.isDuplicate(printavoId)) {
        duplicates.push(printavoId);
        this.logger.log('warn', `Duplicate order found: ${printavoId}`);
      } else {
        ordersToProcess.push(order);
        this.markAsImported(printavoId);
      }
    }

    // Transform orders
    const transformResult = transformPrintavoOrdersBatch(ordersToProcess);

    const processingTimeMs = Date.now() - startTime;
    const batchResult: BatchResult = {
      batchNumber,
      startIndex,
      endIndex,
      totalOrders: orders.length,
      successCount: transformResult.successful.length,
      errorCount: transformResult.errors.length,
      duplicateCount: duplicates.length,
      successfulOrders: transformResult.successful,
      errors: transformResult.errors,
      duplicates,
      processingTimeMs,
    };

    // Log batch completion
    this.logger.log('info', `Batch ${batchNumber} completed`, {
      successful: batchResult.successCount,
      errors: batchResult.errorCount,
      duplicates: batchResult.duplicateCount,
      processingTimeMs,
    });

    if (transformResult.errors.length > 0) {
      this.logger.log('warn', `Batch ${batchNumber} had errors`, {
        errorCount: transformResult.errors.length,
        errors: transformResult.errors.slice(0, 5),
      });
    }

    return batchResult;
  }

  /**
   * Load Printavo orders from JSON file
   */
  private loadOrdersFromFile(filePath: string): PrintavoOrder[] {
    try {
      this.logger.log('info', 'Loading orders from file', { filePath });
      const content = fs.readFileSync(filePath, 'utf-8');
      const orders = JSON.parse(content);

      if (!Array.isArray(orders)) {
        throw new Error('File content must be a JSON array of orders');
      }

      this.logger.log('info', 'Orders loaded successfully', { count: orders.length });
      return orders;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.log('error', 'Failed to load orders from file', { filePath, error: errorMessage });
      throw error;
    }
  }

  /**
   * Load Printavo orders from an array
   */
  private loadOrdersFromArray(orders: PrintavoOrder[]): PrintavoOrder[] {
    this.logger.log('info', 'Orders loaded from array', { count: orders.length });
    return orders;
  }

  /**
   * Save successful orders to JSON file
   */
  private saveSuccessfulOrders(
    orders: StrapiOrder[],
    batchNumber: number,
    sessionId: string,
  ): string {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }

    const filename = `batch-${batchNumber}-successful-${sessionId}.json`;
    const filepath = path.join(this.config.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(orders, null, 2));
    return filepath;
  }

  /**
   * Save failed orders report to JSON file
   */
  private saveFailedOrders(
    errors: Array<{ orderId: number; error: string }>,
    batchNumber: number,
    sessionId: string,
  ): string {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }

    const filename = `batch-${batchNumber}-errors-${sessionId}.json`;
    const filepath = path.join(this.config.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(errors, null, 2));
    return filepath;
  }

  /**
   * Import orders from a file
   */
  async importFromFile(filePath: string): Promise<ImportSessionResult> {
    try {
      const orders = this.loadOrdersFromFile(filePath);
      return this.importOrders(orders);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.log('error', 'File import failed', { error: errorMessage });
      this.sessionResult.endTime = new Date();
      throw error;
    }
  }

  /**
   * Import orders from an array
   */
  async importOrders(orders: PrintavoOrder[]): Promise<ImportSessionResult> {
    try {
      this.logger.log('info', 'Starting import process', { totalOrders: orders.length });

      const totalBatches = Math.ceil(orders.length / this.config.batchSize);
      this.logger.log('info', 'Import plan created', {
        totalBatches,
        ordersPerBatch: this.config.batchSize,
      });

      // Process each batch
      for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
        const startIdx = (batchNum - 1) * this.config.batchSize;
        const endIdx = Math.min(startIdx + this.config.batchSize, orders.length);
        const batchOrders = orders.slice(startIdx, endIdx);

        let batchResult: BatchResult | null = null;
        let lastError: Error | null = null;

        // Retry logic for batch processing
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
          try {
            batchResult = this.processBatch(batchOrders, batchNum);
            break;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            this.logger.log('warn', `Batch ${batchNum} failed on attempt ${attempt}`, {
              error: lastError.message,
              willRetry: attempt < this.config.maxRetries,
            });

            if (attempt < this.config.maxRetries) {
              await this.sleep(this.config.retryDelayMs * attempt);
            }
          }
        }

        if (!batchResult) {
          this.logger.log('error', `Batch ${batchNum} failed after ${this.config.maxRetries} attempts`, {
            error: lastError?.message,
          });
          continue;
        }

        // Save results
        if (batchResult.successCount > 0) {
          const filepath = this.saveSuccessfulOrders(
            batchResult.successfulOrders,
            batchNum,
            this.sessionResult.sessionId,
          );
          this.logger.log('info', `Saved successful orders for batch ${batchNum}`, { filepath });
        }

        if (batchResult.errorCount > 0) {
          const filepath = this.saveFailedOrders(
            batchResult.errors,
            batchNum,
            this.sessionResult.sessionId,
          );
          this.logger.log('info', `Saved error report for batch ${batchNum}`, { filepath });
        }

        // Update session totals
        this.sessionResult.batches.push(batchResult);
        this.sessionResult.totalOrdersProcessed += batchResult.totalOrders;
        this.sessionResult.totalSuccessful += batchResult.successCount;
        this.sessionResult.totalErrors += batchResult.errorCount;
        this.sessionResult.totalDuplicates += batchResult.duplicateCount;

        // Progress update
        const progress = (batchNum / totalBatches) * 100;
        this.logger.log('info', 'Progress update', {
          batch: `${batchNum}/${totalBatches}`,
          progressPercent: progress.toFixed(1),
          successful: this.sessionResult.totalSuccessful,
          errors: this.sessionResult.totalErrors,
          duplicates: this.sessionResult.totalDuplicates,
        });
      }

      this.sessionResult.endTime = new Date();
      const duration = this.sessionResult.endTime.getTime() - this.sessionResult.startTime.getTime();

      this.logger.log('info', 'Import process completed', {
        totalSuccessful: this.sessionResult.totalSuccessful,
        totalErrors: this.sessionResult.totalErrors,
        totalDuplicates: this.sessionResult.totalDuplicates,
        durationMs: duration,
        durationSeconds: (duration / 1000).toFixed(2),
      });

      // Save session summary
      this.saveSessionSummary();

      return this.sessionResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.log('error', 'Import process failed', { error: errorMessage });
      this.sessionResult.endTime = new Date();
      throw error;
    }
  }

  /**
   * Save session summary and logs
   */
  private saveSessionSummary(): void {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }

    // Save summary
    const summaryFile = path.join(
      this.config.outputDir,
      `session-summary-${this.sessionResult.sessionId}.json`,
    );
    fs.writeFileSync(
      summaryFile,
      JSON.stringify(
        {
          sessionId: this.sessionResult.sessionId,
          startTime: this.sessionResult.startTime.toISOString(),
          endTime: this.sessionResult.endTime?.toISOString(),
          durationMs: this.sessionResult.endTime
            ? this.sessionResult.endTime.getTime() - this.sessionResult.startTime.getTime()
            : 0,
          totalOrdersProcessed: this.sessionResult.totalOrdersProcessed,
          totalSuccessful: this.sessionResult.totalSuccessful,
          totalErrors: this.sessionResult.totalErrors,
          totalDuplicates: this.sessionResult.totalDuplicates,
          successRate: (
            (this.sessionResult.totalSuccessful / this.sessionResult.totalOrdersProcessed) *
            100
          ).toFixed(2),
          batchCount: this.sessionResult.batches.length,
          batches: this.sessionResult.batches.map((b) => ({
            batchNumber: b.batchNumber,
            totalOrders: b.totalOrders,
            successCount: b.successCount,
            errorCount: b.errorCount,
            duplicateCount: b.duplicateCount,
            processingTimeMs: b.processingTimeMs,
          })),
        },
        null,
        2,
      ),
    );

    this.logger.log('info', 'Session summary saved', { filepath: summaryFile });

    // Save logs
    const logsFile = this.logger.saveLogs(this.config.outputDir);
    this.logger.log('info', 'Session logs saved', { filepath: logsFile });
  }

  /**
   * Get current session result
   */
  getSessionResult(): ImportSessionResult {
    return this.sessionResult;
  }

  /**
   * Get session statistics
   */
  getStats(): {
    totalProcessed: number;
    totalSuccessful: number;
    totalErrors: number;
    totalDuplicates: number;
    successRate: string;
    errorRate: string;
    duplicateRate: string;
  } {
    const total = this.sessionResult.totalOrdersProcessed;
    return {
      totalProcessed: total,
      totalSuccessful: this.sessionResult.totalSuccessful,
      totalErrors: this.sessionResult.totalErrors,
      totalDuplicates: this.sessionResult.totalDuplicates,
      successRate: total > 0 ? ((this.sessionResult.totalSuccessful / total) * 100).toFixed(2) : '0.00',
      errorRate: total > 0 ? ((this.sessionResult.totalErrors / total) * 100).toFixed(2) : '0.00',
      duplicateRate: total > 0 ? ((this.sessionResult.totalDuplicates / total) * 100).toFixed(2) : '0.00',
    };
  }
}

/**
 * Run batch import from file (convenience function)
 */
export async function runBatchImport(
  filePath: string,
  config?: Partial<BatchImportConfig>,
): Promise<ImportSessionResult> {
  const importer = new PrintavoBatchImporter(config);
  return importer.importFromFile(filePath);
}

/**
 * Run batch import from array (convenience function)
 */
export async function runBatchImportFromArray(
  orders: PrintavoOrder[],
  config?: Partial<BatchImportConfig>,
): Promise<ImportSessionResult> {
  const importer = new PrintavoBatchImporter(config);
  return importer.importOrders(orders);
}
