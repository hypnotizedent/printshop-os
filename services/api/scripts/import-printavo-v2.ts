/**
 * Printavo v2 Data Import Script
 *
 * Imports extracted Printavo v2 data into Strapi:
 * - Reads JSON files from the extraction directory
 * - Imports in correct order (customers first, then orders, etc.)
 * - Uses upsert logic (check by printavoId, update if exists, create if not)
 * - Maintains relationships between entities
 * - Tracks import statistics
 * - Supports checkpoint/resume for large imports
 *
 * Usage:
 *   npm run printavo:import
 *
 * Environment Variables:
 *   STRAPI_API_URL - Strapi base URL (default: http://localhost:1337)
 *   STRAPI_API_TOKEN - Strapi API token
 *   IMPORT_SOURCE_DIR - Directory containing extracted JSON files (optional)
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import {
  transformPrintavoV2Customer,
  transformPrintavoV2Order,
  transformPrintavoV2Quote,
  transformPrintavoV2Invoice,
} from '../lib/printavo-mapper';
import type {
  PrintavoV2Customer,
  PrintavoV2Order,
  PrintavoV2Quote,
  PrintavoV2Invoice,
  PrintavoV2Product,
} from './extract-printavo-v2';

// ============================================================================
// Types
// ============================================================================

export interface ImportConfig {
  strapiApiUrl: string;
  strapiApiToken: string;
  sourceDir: string;
  batchSize: number;
  retryAttempts: number;
}

export interface ImportStats {
  entity: string;
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export interface ImportSummary {
  importedAt: string;
  duration: number;
  stats: ImportStats[];
  checkpointFile: string;
}

export interface ImportCheckpoint {
  lastUpdated: string;
  completed: Record<string, boolean>;
  progress: Record<string, { processed: number; total: number }>;
}

// ============================================================================
// Logger
// ============================================================================

export class ImportLogger {
  private logFile: string | null = null;

  constructor(logToFile: boolean = true) {
    if (logToFile) {
      const logDir = path.join(process.cwd(), 'data', 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      this.logFile = path.join(logDir, `import-printavo-v2-${dateStr}.log`);
    }
  }

  private formatMessage(level: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  log(level: string, message: string, data?: unknown): void {
    const formattedMessage = this.formatMessage(level, message, data);
    if (level === 'error') {
      console.error(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch {
        // Ignore file write errors
      }
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }
}

// ============================================================================
// Strapi Client
// ============================================================================

export class StrapiImportClient {
  private client: AxiosInstance;
  private logger: ImportLogger;
  private config: ImportConfig;
  private customerIdMap: Map<string, number> = new Map(); // printavoId -> strapiId

  constructor(config: ImportConfig, logger: ImportLogger) {
    this.config = config;
    this.logger = logger;
    this.client = axios.create({
      baseURL: config.strapiApiUrl,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.strapiApiToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Find an entity by printavoId
   */
  async findByPrintavoId(
    collection: string,
    printavoId: string,
  ): Promise<{ id: number; documentId?: string } | null> {
    try {
      const response = await this.client.get(`/api/${collection}`, {
        params: {
          filters: {
            printavoId: {
              $eq: printavoId,
            },
          },
        },
      });

      const items = response.data?.data || [];
      if (items.length > 0) {
        return {
          id: items[0].id,
          documentId: items[0].documentId,
        };
      }
      return null;
    } catch (error) {
      this.logger.debug(`Error finding ${collection} by printavoId`, {
        printavoId,
        error: this.formatError(error),
      });
      return null;
    }
  }

  /**
   * Create or update an entity in Strapi
   */
  async upsert(
    collection: string,
    printavoId: string,
    data: Record<string, unknown>,
  ): Promise<{ action: 'created' | 'updated'; id: number }> {
    const existing = await this.findByPrintavoId(collection, printavoId);

    if (existing) {
      // Update existing
      await this.client.put(`/api/${collection}/${existing.id}`, { data });
      this.logger.debug(`Updated ${collection}`, { printavoId, id: existing.id });
      return { action: 'updated', id: existing.id };
    } else {
      // Create new
      const response = await this.client.post(`/api/${collection}`, { data });
      const newId = response.data?.data?.id;
      this.logger.debug(`Created ${collection}`, { printavoId, id: newId });
      return { action: 'created', id: newId };
    }
  }

  /**
   * Import customers
   */
  async importCustomers(customers: PrintavoV2Customer[]): Promise<ImportStats> {
    const stats: ImportStats = {
      entity: 'customers',
      total: customers.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (const customer of customers) {
      try {
        const transformed = transformPrintavoV2Customer(customer);
        const result = await this.upsertWithRetry('customers', customer.id, transformed);

        if (result.action === 'created') {
          stats.created++;
        } else {
          stats.updated++;
        }

        // Store mapping for later relationship resolution
        this.customerIdMap.set(customer.id, result.id);
      } catch (error) {
        stats.failed++;
        stats.errors.push({
          id: customer.id,
          error: this.formatError(error),
        });
        this.logger.error(`Failed to import customer ${customer.id}`, {
          error: this.formatError(error),
        });
      }
    }

    return stats;
  }

  /**
   * Import orders
   */
  async importOrders(orders: PrintavoV2Order[]): Promise<ImportStats> {
    const stats: ImportStats = {
      entity: 'orders',
      total: orders.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (const order of orders) {
      try {
        const transformed = transformPrintavoV2Order(order);

        // Resolve customer relationship
        if (order.customer?.id && this.customerIdMap.has(order.customer.id)) {
          (transformed as Record<string, unknown>).customer = this.customerIdMap.get(
            order.customer.id,
          );
        }

        const result = await this.upsertWithRetry('orders', order.id, transformed);

        if (result.action === 'created') {
          stats.created++;
        } else {
          stats.updated++;
        }
      } catch (error) {
        stats.failed++;
        stats.errors.push({
          id: order.id,
          error: this.formatError(error),
        });
        this.logger.error(`Failed to import order ${order.id}`, {
          error: this.formatError(error),
        });
      }
    }

    return stats;
  }

  /**
   * Import quotes
   */
  async importQuotes(quotes: PrintavoV2Quote[]): Promise<ImportStats> {
    const stats: ImportStats = {
      entity: 'quotes',
      total: quotes.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (const quote of quotes) {
      try {
        const transformed = transformPrintavoV2Quote(quote);

        // Resolve customer relationship
        if (quote.customer?.id && this.customerIdMap.has(quote.customer.id)) {
          (transformed as Record<string, unknown>).customer = this.customerIdMap.get(
            quote.customer.id,
          );
        }

        const result = await this.upsertWithRetry('quotes', quote.id, transformed);

        if (result.action === 'created') {
          stats.created++;
        } else {
          stats.updated++;
        }
      } catch (error) {
        stats.failed++;
        stats.errors.push({
          id: quote.id,
          error: this.formatError(error),
        });
        this.logger.error(`Failed to import quote ${quote.id}`, {
          error: this.formatError(error),
        });
      }
    }

    return stats;
  }

  /**
   * Import products
   */
  async importProducts(products: PrintavoV2Product[]): Promise<ImportStats> {
    const stats: ImportStats = {
      entity: 'products',
      total: products.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (const product of products) {
      try {
        const transformed = {
          printavoId: product.id,
          name: product.name || 'Unknown Product',
          sku: product.sku || '',
          description: product.description || '',
          category: product.category || '',
          price: product.defaultPrice || 0,
        };

        const result = await this.upsertWithRetry('products', product.id, transformed);

        if (result.action === 'created') {
          stats.created++;
        } else {
          stats.updated++;
        }
      } catch (error) {
        stats.failed++;
        stats.errors.push({
          id: product.id,
          error: this.formatError(error),
        });
        this.logger.error(`Failed to import product ${product.id}`, {
          error: this.formatError(error),
        });
      }
    }

    return stats;
  }

  /**
   * Import invoices
   */
  async importInvoices(invoices: PrintavoV2Invoice[]): Promise<ImportStats> {
    const stats: ImportStats = {
      entity: 'invoices',
      total: invoices.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (const invoice of invoices) {
      try {
        const transformed = transformPrintavoV2Invoice(invoice);

        const result = await this.upsertWithRetry('invoices', invoice.id, transformed);

        if (result.action === 'created') {
          stats.created++;
        } else {
          stats.updated++;
        }
      } catch (error) {
        stats.failed++;
        stats.errors.push({
          id: invoice.id,
          error: this.formatError(error),
        });
        this.logger.error(`Failed to import invoice ${invoice.id}`, {
          error: this.formatError(error),
        });
      }
    }

    return stats;
  }

  /**
   * Upsert with retry logic
   */
  private async upsertWithRetry(
    collection: string,
    printavoId: string,
    data: Record<string, unknown>,
  ): Promise<{ action: 'created' | 'updated'; id: number }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await this.upsert(collection, printavoId, data);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.retryAttempts) {
          await this.sleep(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  private formatError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      if (data?.error?.message) {
        return `${error.message}: ${data.error.message}`;
      }
      return `${error.message} (status: ${error.response?.status || 'unknown'})`;
    }
    return error instanceof Error ? error.message : String(error);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Import Service
// ============================================================================

export class PrintavoV2Importer {
  private client: StrapiImportClient;
  private logger: ImportLogger;
  private config: ImportConfig;
  private checkpointFile: string;

  constructor(config: ImportConfig) {
    this.config = config;
    this.logger = new ImportLogger();
    this.client = new StrapiImportClient(config, this.logger);
    this.checkpointFile = path.join(config.sourceDir, 'import-checkpoint.json');
  }

  /**
   * Run the full import process
   */
  async import(): Promise<ImportSummary> {
    const startTime = Date.now();
    const summary: ImportSummary = {
      importedAt: new Date().toISOString(),
      duration: 0,
      stats: [],
      checkpointFile: this.checkpointFile,
    };

    try {
      // Load or create checkpoint
      const checkpoint = this.loadCheckpoint();

      // Import customers first (needed for relationships)
      if (!checkpoint.completed.customers) {
        this.logger.info('Importing customers...');
        const customers = this.loadDataFile<PrintavoV2Customer>('customers.json');
        if (customers.length > 0) {
          const stats = await this.client.importCustomers(customers);
          summary.stats.push(stats);
          this.logger.info(`Customers imported`, {
            created: stats.created,
            updated: stats.updated,
            failed: stats.failed,
          });
        }
        checkpoint.completed.customers = true;
        this.saveCheckpoint(checkpoint);
      } else {
        this.logger.info('Skipping customers (already imported)');
      }

      // Import orders
      if (!checkpoint.completed.orders) {
        this.logger.info('Importing orders...');
        const orders = this.loadDataFile<PrintavoV2Order>('orders.json');
        if (orders.length > 0) {
          const stats = await this.client.importOrders(orders);
          summary.stats.push(stats);
          this.logger.info(`Orders imported`, {
            created: stats.created,
            updated: stats.updated,
            failed: stats.failed,
          });
        }
        checkpoint.completed.orders = true;
        this.saveCheckpoint(checkpoint);
      } else {
        this.logger.info('Skipping orders (already imported)');
      }

      // Import quotes
      if (!checkpoint.completed.quotes) {
        this.logger.info('Importing quotes...');
        const quotes = this.loadDataFile<PrintavoV2Quote>('quotes.json');
        if (quotes.length > 0) {
          const stats = await this.client.importQuotes(quotes);
          summary.stats.push(stats);
          this.logger.info(`Quotes imported`, {
            created: stats.created,
            updated: stats.updated,
            failed: stats.failed,
          });
        }
        checkpoint.completed.quotes = true;
        this.saveCheckpoint(checkpoint);
      } else {
        this.logger.info('Skipping quotes (already imported)');
      }

      // Import products
      if (!checkpoint.completed.products) {
        this.logger.info('Importing products...');
        const products = this.loadDataFile<PrintavoV2Product>('products.json');
        if (products.length > 0) {
          const stats = await this.client.importProducts(products);
          summary.stats.push(stats);
          this.logger.info(`Products imported`, {
            created: stats.created,
            updated: stats.updated,
            failed: stats.failed,
          });
        }
        checkpoint.completed.products = true;
        this.saveCheckpoint(checkpoint);
      } else {
        this.logger.info('Skipping products (already imported)');
      }

      // Import invoices
      if (!checkpoint.completed.invoices) {
        this.logger.info('Importing invoices...');
        const invoices = this.loadDataFile<PrintavoV2Invoice>('invoices.json');
        if (invoices.length > 0) {
          const stats = await this.client.importInvoices(invoices);
          summary.stats.push(stats);
          this.logger.info(`Invoices imported`, {
            created: stats.created,
            updated: stats.updated,
            failed: stats.failed,
          });
        }
        checkpoint.completed.invoices = true;
        this.saveCheckpoint(checkpoint);
      } else {
        this.logger.info('Skipping invoices (already imported)');
      }

      // Calculate duration
      summary.duration = Date.now() - startTime;

      // Save error log
      this.saveErrorLog(summary);

      this.logger.info('Import complete!', {
        duration: `${(summary.duration / 1000).toFixed(2)}s`,
        stats: summary.stats.map((s) => ({
          entity: s.entity,
          total: s.total,
          created: s.created,
          updated: s.updated,
          failed: s.failed,
        })),
      });

      return summary;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Import failed', { error: message });
      throw error;
    }
  }

  private loadDataFile<T>(filename: string): T[] {
    const filepath = path.join(this.config.sourceDir, filename);
    if (!fs.existsSync(filepath)) {
      this.logger.warn(`Data file not found: ${filename}`);
      return [];
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content) as T[];
  }

  private loadCheckpoint(): ImportCheckpoint {
    if (fs.existsSync(this.checkpointFile)) {
      const content = fs.readFileSync(this.checkpointFile, 'utf-8');
      return JSON.parse(content) as ImportCheckpoint;
    }
    return {
      lastUpdated: new Date().toISOString(),
      completed: {},
      progress: {},
    };
  }

  private saveCheckpoint(checkpoint: ImportCheckpoint): void {
    checkpoint.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.checkpointFile, JSON.stringify(checkpoint, null, 2));
  }

  private saveErrorLog(summary: ImportSummary): void {
    const errors: Array<{ entity: string; id: string; error: string }> = [];
    for (const stat of summary.stats) {
      for (const err of stat.errors) {
        errors.push({ entity: stat.entity, ...err });
      }
    }

    if (errors.length > 0) {
      const errorFile = path.join(this.config.sourceDir, 'import-errors.json');
      fs.writeFileSync(errorFile, JSON.stringify(errors, null, 2));
      this.logger.info(`Saved ${errors.length} errors to ${errorFile}`);
    }
  }
}

// ============================================================================
// Configuration
// ============================================================================

export function loadImportConfig(): ImportConfig {
  const strapiApiToken = process.env.STRAPI_API_TOKEN;

  if (!strapiApiToken) {
    throw new Error('STRAPI_API_TOKEN environment variable is required');
  }

  // Find the latest extraction directory
  let sourceDir = process.env.IMPORT_SOURCE_DIR;
  if (!sourceDir) {
    const exportBase = path.join(process.cwd(), 'data', 'printavo-export', 'v2');
    if (fs.existsSync(exportBase)) {
      const dirs = fs
        .readdirSync(exportBase)
        .filter((d) => fs.statSync(path.join(exportBase, d)).isDirectory())
        .sort()
        .reverse();
      if (dirs.length > 0) {
        sourceDir = path.join(exportBase, dirs[0]);
      }
    }
  }

  if (!sourceDir) {
    throw new Error(
      'No extraction directory found. Run printavo:extract first or set IMPORT_SOURCE_DIR',
    );
  }

  return {
    strapiApiUrl: process.env.STRAPI_API_URL || 'http://localhost:1337',
    strapiApiToken,
    sourceDir,
    batchSize: parseInt(process.env.IMPORT_BATCH_SIZE || '100', 10),
    retryAttempts: parseInt(process.env.IMPORT_RETRY_ATTEMPTS || '3', 10),
  };
}

// ============================================================================
// Main Entry Point
// ============================================================================

if (require.main === module) {
  (async () => {
    try {
      console.log('🚀 Printavo v2 Data Import Starting...\n');

      const config = loadImportConfig();
      console.log(`📁 Source Directory: ${config.sourceDir}`);
      console.log(`🔗 Strapi URL: ${config.strapiApiUrl}\n`);

      const importer = new PrintavoV2Importer(config);
      const summary = await importer.import();

      console.log('\n✅ Import Complete!');
      console.log(`⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s`);
      console.log('\n📊 Import Summary:');

      let totalCreated = 0;
      let totalUpdated = 0;
      let totalFailed = 0;

      for (const stat of summary.stats) {
        console.log(`   ${stat.entity}:`);
        console.log(`     - Created: ${stat.created}`);
        console.log(`     - Updated: ${stat.updated}`);
        console.log(`     - Failed: ${stat.failed}`);
        totalCreated += stat.created;
        totalUpdated += stat.updated;
        totalFailed += stat.failed;
      }

      console.log(`\n   Total: ${totalCreated} created, ${totalUpdated} updated, ${totalFailed} failed`);

      if (totalFailed > 0) {
        console.log(`\n⚠️  See import-errors.json for details on failed imports`);
      }
    } catch (error) {
      console.error('\n❌ Import Failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  })();
}
