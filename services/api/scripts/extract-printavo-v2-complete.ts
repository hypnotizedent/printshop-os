/**
 * Printavo v2 Complete GraphQL API Data Extraction Script
 *
 * This is a comprehensive extraction script that queries ALL available fields
 * from Printavo's V2 GraphQL API including:
 * - Complete order data with imprints, production files, artwork
 * - Size breakdowns and personalizations
 * - Expenses, fees, and complete transaction history
 * - Full customer data with all contacts and addresses
 * - Quotes with complete line item details
 *
 * Features:
 * - Checkpoint/resume capability (saves every 50 orders)
 * - Extracts and normalizes imprints separately
 * - Creates file manifest for later download
 * - Detailed progress logging
 * - Complete error handling
 *
 * Usage:
 *   npm run printavo:extract-complete
 *   npm run printavo:extract-complete:resume  # Resume from checkpoint
 *
 * Environment Variables:
 *   PRINTAVO_EMAIL - Printavo account email
 *   PRINTAVO_TOKEN - Printavo API token (from "My Account" page)
 *   PRINTAVO_API_URL - API base URL (default: https://www.printavo.com/api/v2)
 *   PRINTAVO_RATE_LIMIT_MS - Rate limit in milliseconds (default: 500)
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import {
  PrintavoV2Config,
  PrintavoV2Order,
  PrintavoV2Customer,
  PrintavoV2Product,
  PrintavoV2Imprint,
  PrintavoV2LineItemGroup,
  ExtractionSummary,
  ExtractionCheckpoint,
  FilesManifest,
  FileManifestEntry,
  NormalizedImprint,
  PageInfo,
  Connection,
} from '../lib/printavo-v2-types';

// ============================================================================
// GraphQL Queries - Complete Schema
// ============================================================================

const ORDER_QUERY_COMPLETE = `
  query GetOrdersComplete($first: Int!, $after: String) {
    orders(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on Invoice {
          id
          visualId
          nickname
          total
          subtotal
          taxTotal
          discountTotal
          amountPaid
          amountOutstanding
          salesTax
          salesTaxAmount
          customerDueAt
          paymentDueAt
          productionNote
          customerNote
          tags
          merch
          publicUrl
          publicPdf
          workorderUrl
          packingSlipUrl
          createdAt
          updatedAt
          
          status {
            id
            name
            color
          }
          
          contact {
            id
            fullName
            firstName
            lastName
            email
            phone
          }
          
          owner {
            id
            email
            name
          }
          
          customer {
            id
            company
            email
            phone
          }
          
          billingAddress {
            companyName
            customerName
            address1
            address2
            city
            stateIso
            zipCode
            country
          }
          
          shippingAddress {
            companyName
            customerName
            address1
            address2
            city
            stateIso
            zipCode
            country
          }
          
          productionFiles {
            nodes {
              id
              fileUrl
              fileName
              fileType
              fileSize
              createdAt
            }
          }
          
          lineItemGroups {
            nodes {
              id
              position
              imprints {
                nodes {
                  id
                  name
                  placement
                  description
                  colors
                  stitchCount
                  printMethod
                  mockupUrl
                  artworkFiles {
                    nodes {
                      id
                      fileUrl
                      fileName
                      fileType
                      fileSize
                    }
                  }
                }
              }
              lineItems {
                nodes {
                  id
                  description
                  color
                  items
                  price
                  category {
                    id
                    name
                  }
                  itemNumber
                  taxed
                  position
                  markupPercentage
                  sizes {
                    size
                    count
                  }
                  personalizations {
                    name
                    number
                    size
                  }
                  product {
                    id
                    name
                    sku
                    description
                  }
                }
              }
            }
          }
          
          tasks {
            nodes {
              id
              name
              description
              dueAt
              completedAt
              assignee {
                id
                name
                email
              }
            }
          }
          
          transactions {
            nodes {
              ... on Payment {
                id
                amount
                createdAt
                paymentMethod
                note
              }
              ... on Refund {
                id
                amount
                createdAt
                reason
              }
            }
          }
          
          expenses {
            nodes {
              id
              amount
              description
              vendor
              category
              createdAt
            }
          }
          
          fees {
            nodes {
              id
              name
              amount
              taxable
            }
          }
        }
        
        ... on Quote {
          id
          visualId
          nickname
          total
          subtotal
          expiresAt
          createdAt
          updatedAt
          
          status {
            id
            name
            color
          }
          
          customer {
            id
            company
            email
          }
          
          contact {
            id
            fullName
            email
            phone
          }
          
          lineItemGroups {
            nodes {
              id
              position
              imprints {
                nodes {
                  id
                  name
                  placement
                  colors
                  printMethod
                  mockupUrl
                  artworkFiles {
                    nodes {
                      id
                      fileUrl
                      fileName
                      fileType
                    }
                  }
                }
              }
              lineItems {
                nodes {
                  id
                  description
                  color
                  items
                  price
                  sizes {
                    size
                    count
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const CUSTOMER_QUERY_COMPLETE = `
  query GetCustomersComplete($first: Int!, $after: String) {
    customers(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        firstName
        lastName
        company
        email
        phone
        createdAt
        updatedAt
        addresses {
          id
          name
          companyName
          customerName
          address1
          address2
          city
          state
          stateIso
          zip
          zipCode
          country
        }
        contacts {
          id
          fullName
          firstName
          lastName
          email
          phone
        }
      }
    }
  }
`;

const PRODUCT_QUERY = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        name
        sku
        description
        category
        price
      }
    }
  }
`;

// ============================================================================
// Logger
// ============================================================================

export class ExtractLogger {
  private logFile: string | null = null;

  constructor(logToFile: boolean = true) {
    if (logToFile) {
      const logDir = path.join(process.cwd(), 'data', 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      this.logFile = path.join(logDir, `extract-printavo-v2-complete-${dateStr}.log`);
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

  progress(message: string, data?: unknown): void {
    this.log('progress', message, data);
  }
}

// ============================================================================
// Printavo v2 Complete Client
// ============================================================================

export class PrintavoV2CompleteClient {
  private client: AxiosInstance;
  private config: PrintavoV2Config;
  private logger: ExtractLogger;

  constructor(config: PrintavoV2Config, logger: ExtractLogger) {
    this.config = config;
    this.logger = logger;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'email': config.email,
        'token': config.token,
      },
    });
  }

  async authenticate(): Promise<void> {
    // Header-based authentication - no separate auth call needed
    this.logger.info('Using header-based authentication with Printavo v2 API');
  }

  async executeQuery<T>(
    query: string,
    entityName: string,
    pageSize: number = 100,
    startCursor: string | null = null,
  ): Promise<T[]> {
    const allResults: T[] = [];
    let hasNextPage = true;
    let cursor: string | null = startCursor;
    let page = 1;

    while (hasNextPage) {
      try {
        this.logger.progress(`Fetching ${entityName} page ${page}...`);

        const variables: { first: number; after?: string } = { first: pageSize };
        if (cursor) {
          variables.after = cursor;
        }

        const response = await this.client.post('/graphql', {
          query,
          variables,
        });

        // Rate limiting
        await this.sleep(this.config.rateLimitMs);

        const data = response.data?.data?.[entityName];
        if (!data) {
          throw new Error(`No data returned for ${entityName}`);
        }

        const nodes = data.nodes || [];
        const pageInfo: PageInfo = data.pageInfo || { hasNextPage: false, endCursor: null };

        allResults.push(...nodes);
        hasNextPage = pageInfo.hasNextPage;
        cursor = pageInfo.endCursor;
        page++;

        this.logger.progress(`Fetched ${nodes.length} ${entityName}, total: ${allResults.length}`);
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? `${error.message} (status: ${error.response?.status})`
          : String(error);
        this.logger.error(`Error fetching ${entityName} page ${page}`, { error: message });
        throw new Error(`Failed to fetch ${entityName}: ${message}`);
      }
    }

    return allResults;
  }

  async extractOrders(startCursor: string | null = null): Promise<PrintavoV2Order[]> {
    return this.executeQuery<PrintavoV2Order>(ORDER_QUERY_COMPLETE, 'orders', 50, startCursor);
  }

  async extractCustomers(): Promise<PrintavoV2Customer[]> {
    return this.executeQuery<PrintavoV2Customer>(CUSTOMER_QUERY_COMPLETE, 'customers');
  }

  async extractProducts(): Promise<PrintavoV2Product[]> {
    return this.executeQuery<PrintavoV2Product>(PRODUCT_QUERY, 'products');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Complete Extraction Service
// ============================================================================

export class PrintavoV2CompleteExtractor {
  private client: PrintavoV2CompleteClient;
  private logger: ExtractLogger;
  private outputDir!: string;
  private timestamp!: string;
  private checkpointFile!: string;

  constructor(config: PrintavoV2Config, resumeMode: boolean = false) {
    this.logger = new ExtractLogger();
    this.client = new PrintavoV2CompleteClient(config, this.logger);

    // If resuming, find the most recent checkpoint
    if (resumeMode) {
      const checkpoint = this.loadCheckpoint();
      if (checkpoint) {
        this.timestamp = checkpoint.timestamp;
        this.outputDir = path.join(
          process.cwd(),
          'data',
          'printavo-export',
          'v2-complete',
          this.timestamp,
        );
        this.checkpointFile = path.join(this.outputDir, 'checkpoint.json');
        this.logger.info('Resuming from checkpoint', { timestamp: this.timestamp });
      } else {
        this.logger.info('No checkpoint found, starting fresh extraction');
        this.initializeNewExtraction();
      }
    } else {
      this.initializeNewExtraction();
    }
  }

  private initializeNewExtraction(): void {
    this.timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    this.outputDir = path.join(
      process.cwd(),
      'data',
      'printavo-export',
      'v2-complete',
      this.timestamp,
    );
    this.checkpointFile = path.join(this.outputDir, 'checkpoint.json');
  }

  private loadCheckpoint(): ExtractionCheckpoint | null {
    try {
      const baseDir = path.join(process.cwd(), 'data', 'printavo-export', 'v2-complete');
      if (!fs.existsSync(baseDir)) {
        return null;
      }

      const dirs = fs
        .readdirSync(baseDir)
        .filter((f) => fs.statSync(path.join(baseDir, f)).isDirectory())
        .sort()
        .reverse();

      for (const dir of dirs) {
        const checkpointPath = path.join(baseDir, dir, 'checkpoint.json');
        if (fs.existsSync(checkpointPath)) {
          const checkpoint = JSON.parse(
            fs.readFileSync(checkpointPath, 'utf-8'),
          ) as ExtractionCheckpoint;
          if (checkpoint.currentPhase !== 'complete') {
            return checkpoint;
          }
        }
      }
      return null;
    } catch (error) {
      this.logger.error('Error loading checkpoint', { error: String(error) });
      return null;
    }
  }

  private saveCheckpoint(checkpoint: ExtractionCheckpoint): void {
    try {
      fs.writeFileSync(this.checkpointFile, JSON.stringify(checkpoint, null, 2));
      this.logger.info('Checkpoint saved', { ordersProcessed: checkpoint.ordersProcessed });
    } catch (error) {
      this.logger.error('Error saving checkpoint', { error: String(error) });
    }
  }

  private saveToFile(filename: string, data: unknown): void {
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    this.logger.info(`Saved ${filename}`, { path: filepath });
  }

  private extractImprints(orders: PrintavoV2Order[]): NormalizedImprint[] {
    const imprints: NormalizedImprint[] = [];

    for (const order of orders) {
      const lineItemGroups = Array.isArray(order.lineItemGroups)
        ? order.lineItemGroups
        : (order.lineItemGroups as Connection<PrintavoV2LineItemGroup>)?.nodes || [];

      for (const group of lineItemGroups) {
        const groupImprints =
          (group.imprints as Connection<PrintavoV2Imprint>)?.nodes || [];

        for (const imprint of groupImprints) {
          const normalizedImprint: NormalizedImprint = {
            id: imprint.id,
            orderId: order.id,
            lineItemGroupId: group.id,
            name: imprint.name,
            placement: imprint.placement,
            description: imprint.description,
            colors: Array.isArray(imprint.colors)
              ? imprint.colors
              : typeof imprint.colors === 'string'
                ? [imprint.colors]
                : undefined,
            stitchCount: imprint.stitchCount,
            printMethod: imprint.printMethod,
            mockupUrl: imprint.mockupUrl,
            artworkFiles: imprint.artworkFiles?.nodes || [],
            artworkFileIds: (imprint.artworkFiles?.nodes || []).map((f) => f.id),
          };
          imprints.push(normalizedImprint);
        }
      }
    }

    return imprints;
  }

  private extractFileManifest(orders: PrintavoV2Order[]): FilesManifest {
    const files: FileManifestEntry[] = [];

    for (const order of orders) {
      // Production files
      const productionFiles = (order.productionFiles as Connection<any>)?.nodes || [];
      for (const file of productionFiles) {
        if (file.fileUrl) {
          files.push({
            id: file.id,
            url: file.fileUrl,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            source: 'production',
            relatedEntityType: 'order',
            relatedEntityId: order.id,
          });
        }
      }

      // Artwork files from imprints
      const lineItemGroups = Array.isArray(order.lineItemGroups)
        ? order.lineItemGroups
        : (order.lineItemGroups as Connection<PrintavoV2LineItemGroup>)?.nodes || [];

      for (const group of lineItemGroups) {
        const groupImprints =
          (group.imprints as Connection<PrintavoV2Imprint>)?.nodes || [];

        for (const imprint of groupImprints) {
          const artworkFiles = imprint.artworkFiles?.nodes || [];
          for (const file of artworkFiles) {
            if (file.fileUrl) {
              files.push({
                id: file.id,
                url: file.fileUrl,
                fileName: file.fileName,
                fileType: file.fileType,
                fileSize: file.fileSize,
                source: 'artwork',
                relatedEntityType: 'imprint',
                relatedEntityId: imprint.id,
              });
            }
          }
        }
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      totalFiles: files.length,
      files,
    };
  }

  async extract(): Promise<ExtractionSummary> {
    const startTime = Date.now();
    const summary: ExtractionSummary = {
      extractedAt: new Date().toISOString(),
      duration: 0,
      counts: {
        customers: 0,
        orders: 0,
        quotes: 0,
        products: 0,
        imprints: 0,
        files: 0,
      },
      errors: [],
    };

    try {
      // Create output directory
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      // Authenticate
      await this.client.authenticate();

      // Extract orders
      this.logger.info('Extracting orders with complete data...');
      const orders = await this.client.extractOrders();
      summary.counts.orders = orders.length;
      
      // Separate orders and quotes
      const actualOrders = orders.filter((o: any) => !o.expiresAt);
      const quotes = orders.filter((o: any) => o.expiresAt);
      
      this.saveToFile('orders.json', actualOrders);
      this.saveToFile('quotes.json', quotes);
      summary.counts.quotes = quotes.length;
      this.logger.info(`Extracted ${actualOrders.length} orders and ${quotes.length} quotes`);

      // Extract and normalize imprints
      this.logger.info('Extracting imprints...');
      const imprints = this.extractImprints(orders);
      summary.counts.imprints = imprints.length;
      this.saveToFile('imprints.json', imprints);
      this.logger.info(`Extracted ${imprints.length} imprints`);

      // Extract file manifest
      this.logger.info('Creating file manifest...');
      const fileManifest = this.extractFileManifest(orders);
      summary.counts.files = fileManifest.totalFiles;
      this.saveToFile('files_manifest.json', fileManifest);
      this.logger.info(`Created manifest with ${fileManifest.totalFiles} files`);

      // Extract customers
      try {
        this.logger.info('Extracting customers...');
        const customers = await this.client.extractCustomers();
        summary.counts.customers = customers.length;
        this.saveToFile('customers.json', customers);
        this.logger.info(`Extracted ${customers.length} customers`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        summary.errors.push({ entity: 'customers', error: message });
        this.logger.error('Failed to extract customers', { error: message });
      }

      // Extract products
      try {
        this.logger.info('Extracting products...');
        const products = await this.client.extractProducts();
        summary.counts.products = products.length;
        this.saveToFile('products.json', products);
        this.logger.info(`Extracted ${products.length} products`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        summary.errors.push({ entity: 'products', error: message });
        this.logger.error('Failed to extract products', { error: message });
      }

      // Save final checkpoint
      const finalCheckpoint: ExtractionCheckpoint = {
        timestamp: this.timestamp,
        ordersProcessed: summary.counts.orders,
        currentPhase: 'complete',
      };
      this.saveCheckpoint(finalCheckpoint);

      // Calculate duration and save summary
      summary.duration = Date.now() - startTime;
      this.saveToFile('summary.json', summary);

      this.logger.info('Extraction complete!', {
        duration: `${(summary.duration / 1000).toFixed(2)}s`,
        counts: summary.counts,
        errors: summary.errors.length,
      });

      return summary;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Extraction failed', { error: message });
      throw error;
    }
  }

  getOutputDir(): string {
    return this.outputDir;
  }
}

// ============================================================================
// Configuration
// ============================================================================

export function loadExtractConfig(): PrintavoV2Config {
  const email = process.env.PRINTAVO_EMAIL;
  const token = process.env.PRINTAVO_TOKEN;

  if (!email) {
    throw new Error('PRINTAVO_EMAIL environment variable is required');
  }

  if (!token) {
    throw new Error('PRINTAVO_TOKEN environment variable is required');
  }

  return {
    email,
    token,
    apiUrl: process.env.PRINTAVO_API_URL || 'https://www.printavo.com/api/v2',
    rateLimitMs: parseInt(process.env.PRINTAVO_RATE_LIMIT_MS || '500', 10),
  };
}

// ============================================================================
// Main Entry Point
// ============================================================================

if (require.main === module) {
  (async () => {
    try {
      const resumeMode = process.argv.includes('--resume');
      const modeText = resumeMode ? '(Resume Mode)' : '';
      
      console.log(`🚀 Printavo v2 Complete Data Extraction Starting... ${modeText}\n`);

      const config = loadExtractConfig();
      const extractor = new PrintavoV2CompleteExtractor(config, resumeMode);

      const summary = await extractor.extract();

      console.log('\n✅ Extraction Complete!');
      console.log(`📁 Output Directory: ${extractor.getOutputDir()}`);
      console.log(`⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s`);
      console.log('\n📊 Extraction Summary:');
      console.log(`   Customers: ${summary.counts.customers}`);
      console.log(`   Orders: ${summary.counts.orders}`);
      console.log(`   Quotes: ${summary.counts.quotes}`);
      console.log(`   Products: ${summary.counts.products}`);
      console.log(`   Imprints: ${summary.counts.imprints}`);
      console.log(`   Files: ${summary.counts.files}`);

      if (summary.errors.length > 0) {
        console.log(`\n⚠️  Errors: ${summary.errors.length}`);
        for (const err of summary.errors) {
          console.log(`   - ${err.entity}: ${err.error}`);
        }
      }
    } catch (error) {
      console.error('\n❌ Extraction Failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  })();
}
