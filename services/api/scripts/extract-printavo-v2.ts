/**
 * Printavo v2 GraphQL API Data Extraction Script
 *
 * Extracts all data from Printavo using the v2 GraphQL API:
 * - Customers with contacts and addresses
 * - Orders with line items, tasks, payments, invoices
 * - Quotes with line item groups
 * - Products with variants
 * - Invoices with payments
 *
 * Features:
 * - Email/password authentication for bearer token
 * - Cursor-based pagination
 * - Rate limiting (500ms between requests)
 * - Timestamped JSON output files
 * - Comprehensive error handling and logging
 *
 * Usage:
 *   npm run printavo:extract
 *
 * Environment Variables:
 *   PRINTAVO_EMAIL - Printavo account email
 *   PRINTAVO_TOKEN - Printavo API token (from "My Account" page)
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// ============================================================================
// Types
// ============================================================================

export interface PrintavoV2Config {
  email: string;
  token: string;
  apiUrl: string;
  rateLimitMs: number;
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface PrintavoV2Address {
  id: string;
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface PrintavoV2Contact {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface PrintavoV2Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  addresses?: PrintavoV2Address[];
  contacts?: PrintavoV2Contact[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PrintavoV2LineItem {
  id: string;
  description?: string;
  color?: string;
  quantity?: number;
  price?: number;
  category?: string;
  itemNumber?: string;
  taxable?: boolean;
}

export interface PrintavoV2LineItemGroup {
  id: string;
  position?: number;
  lineItems?: PrintavoV2LineItem[];
}

export interface PrintavoV2Task {
  id: string;
  name?: string;
  description?: string;
  dueAt?: string;
  completedAt?: string;
  assignee?: { id: string; name?: string };
}

export interface PrintavoV2Payment {
  id: string;
  amount?: number;
  paymentMethod?: string;
  createdAt?: string;
  note?: string;
}

export interface PrintavoV2Order {
  id: string;
  visualId?: string;
  orderNumber?: string;
  nickname?: string;
  status?: { id: string; name?: string; color?: string };
  productionStatus?: string;
  customerDueAt?: string;
  inHandsDate?: string;
  total?: number;
  subtotal?: number;
  taxTotal?: number;
  discountTotal?: number;
  customer?: { id: string; company?: string; email?: string };
  lineItemGroups?: PrintavoV2LineItemGroup[];
  tasks?: PrintavoV2Task[];
  payments?: PrintavoV2Payment[];
  createdAt?: string;
  updatedAt?: string;
  productionNote?: string;
  customerNote?: string;
}

export interface PrintavoV2Quote {
  id: string;
  visualId?: string;
  status?: { id: string; name?: string };
  total?: number;
  expiresAt?: string;
  customer?: { id: string; company?: string; email?: string };
  lineItemGroups?: PrintavoV2LineItemGroup[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PrintavoV2ProductVariant {
  id: string;
  sku?: string;
  color?: string;
  size?: string;
  price?: number;
}

export interface PrintavoV2Product {
  id: string;
  name?: string;
  sku?: string;
  description?: string;
  category?: string;
  defaultPrice?: number;
  variants?: PrintavoV2ProductVariant[];
}

export interface PrintavoV2Invoice {
  id: string;
  invoiceNumber?: string;
  status?: { id: string; name?: string };
  total?: number;
  paidAmount?: number;
  dueDate?: string;
  order?: { id: string; visualId?: string };
  payments?: PrintavoV2Payment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ExtractionSummary {
  extractedAt: string;
  duration: number;
  counts: {
    customers: number;
    orders: number;
    quotes: number;
    products: number;
    invoices: number;
  };
  errors: Array<{ entity: string; error: string }>;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const CUSTOMER_QUERY = `
  query GetCustomers($first: Int!, $after: String) {
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

const ORDER_QUERY = `
  query GetOrders($first: Int!, $after: String) {
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

const QUOTE_QUERY = `
  query GetQuotes($first: Int!, $after: String) {
    quotes(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        visualId
        total
        expiresAt
        createdAt
        updatedAt
        status {
          id
          name
        }
        customer {
          id
          company
          email
        }
        lineItemGroups {
          id
          position
          lineItems {
            id
            description
            color
            items
            price
            category
          }
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

const INVOICE_QUERY = `
  query GetInvoices($first: Int!, $after: String) {
    invoices(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        visualId
        total
        amountPaid
        amountOutstanding
        dueAt
        createdAt
        updatedAt
        status {
          id
          name
        }
        customer {
          id
          company
          email
        }
        payments {
          id
          amount
          createdAt
        }
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
      this.logFile = path.join(logDir, `extract-printavo-v2-${dateStr}.log`);
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
}

// ============================================================================
// Printavo v2 Client
// ============================================================================

export class PrintavoV2Client {
  private client: AxiosInstance;
  private config: PrintavoV2Config;
  private logger: ExtractLogger;

  constructor(config: PrintavoV2Config, logger: ExtractLogger) {
    this.config = config;
    this.logger = logger;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'email': config.email,
        'token': config.token,
      },
    });
  }

  /**
   * Header-based authentication - no separate auth call needed
   */
  async authenticate(): Promise<void> {
    this.logger.info('Using header-based authentication with Printavo v2 API');
  }

  /**
   * Execute a GraphQL query with pagination
   */
  async executeQuery<T>(
    query: string,
    entityName: string,
    pageSize: number = 100,
  ): Promise<T[]> {
    const allResults: T[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    let page = 1;

    while (hasNextPage) {
      try {
        this.logger.info(`Fetching ${entityName} page ${page}...`);

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

        this.logger.info(`Fetched ${nodes.length} ${entityName}, total: ${allResults.length}`);
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

  /**
   * Extract all customers
   */
  async extractCustomers(): Promise<PrintavoV2Customer[]> {
    return this.executeQuery<PrintavoV2Customer>(CUSTOMER_QUERY, 'customers');
  }

  /**
   * Extract all orders
   */
  async extractOrders(): Promise<PrintavoV2Order[]> {
    return this.executeQuery<PrintavoV2Order>(ORDER_QUERY, 'orders');
  }

  /**
   * Extract all quotes
   */
  async extractQuotes(): Promise<PrintavoV2Quote[]> {
    return this.executeQuery<PrintavoV2Quote>(QUOTE_QUERY, 'quotes');
  }

  /**
   * Extract all products
   */
  async extractProducts(): Promise<PrintavoV2Product[]> {
    return this.executeQuery<PrintavoV2Product>(PRODUCT_QUERY, 'products');
  }

  /**
   * Extract all invoices
   */
  async extractInvoices(): Promise<PrintavoV2Invoice[]> {
    return this.executeQuery<PrintavoV2Invoice>(INVOICE_QUERY, 'invoices');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Extraction Service
// ============================================================================

export class PrintavoV2Extractor {
  private client: PrintavoV2Client;
  private logger: ExtractLogger;
  private outputDir: string;
  private timestamp: string;

  constructor(config: PrintavoV2Config) {
    this.logger = new ExtractLogger();
    this.client = new PrintavoV2Client(config, this.logger);
    this.timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    this.outputDir = path.join(process.cwd(), 'data', 'printavo-export', 'v2', this.timestamp);
  }

  /**
   * Run the full extraction process
   */
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
        invoices: 0,
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

      // Extract orders
      try {
        this.logger.info('Extracting orders...');
        const orders = await this.client.extractOrders();
        summary.counts.orders = orders.length;
        this.saveToFile('orders.json', orders);
        this.logger.info(`Extracted ${orders.length} orders`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        summary.errors.push({ entity: 'orders', error: message });
        this.logger.error('Failed to extract orders', { error: message });
      }

      // Extract quotes
      try {
        this.logger.info('Extracting quotes...');
        const quotes = await this.client.extractQuotes();
        summary.counts.quotes = quotes.length;
        this.saveToFile('quotes.json', quotes);
        this.logger.info(`Extracted ${quotes.length} quotes`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        summary.errors.push({ entity: 'quotes', error: message });
        this.logger.error('Failed to extract quotes', { error: message });
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

      // Extract invoices
      try {
        this.logger.info('Extracting invoices...');
        const invoices = await this.client.extractInvoices();
        summary.counts.invoices = invoices.length;
        this.saveToFile('invoices.json', invoices);
        this.logger.info(`Extracted ${invoices.length} invoices`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        summary.errors.push({ entity: 'invoices', error: message });
        this.logger.error('Failed to extract invoices', { error: message });
      }

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

  private saveToFile(filename: string, data: unknown): void {
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    this.logger.info(`Saved ${filename}`, { path: filepath });
  }

  /**
   * Get the output directory for this extraction
   */
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
      console.log('🚀 Printavo v2 Data Extraction Starting...\n');

      const config = loadExtractConfig();
      const extractor = new PrintavoV2Extractor(config);

      const summary = await extractor.extract();

      console.log('\n✅ Extraction Complete!');
      console.log(`📁 Output Directory: ${extractor.getOutputDir()}`);
      console.log(`⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s`);
      console.log('\n📊 Extraction Summary:');
      console.log(`   Customers: ${summary.counts.customers}`);
      console.log(`   Orders: ${summary.counts.orders}`);
      console.log(`   Quotes: ${summary.counts.quotes}`);
      console.log(`   Products: ${summary.counts.products}`);
      console.log(`   Invoices: ${summary.counts.invoices}`);

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
