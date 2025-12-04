/**
 * Complete TypeScript types for Printavo V2 GraphQL API
 * 
 * This file contains comprehensive type definitions for all objects
 * available in the Printavo V2 GraphQL API, including:
 * - Orders, Invoices, Quotes
 * - Line Items with sizes and personalizations
 * - Imprints with artwork files
 * - Production files
 * - Payments, Refunds, Expenses, Fees
 * - Customers with contacts and addresses
 * - Tasks and transactions
 */

// ============================================================================
// Configuration & Pagination
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

export interface Connection<T> {
  pageInfo?: PageInfo;
  nodes?: T[];
}

// ============================================================================
// Address & Contact Types
// ============================================================================

export interface PrintavoV2Address {
  id?: string;
  companyName?: string;
  customerName?: string;
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  stateIso?: string;
  zip?: string;
  zipCode?: string;
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

// ============================================================================
// Customer Types
// ============================================================================

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

// ============================================================================
// File Types
// ============================================================================

export interface PrintavoV2ArtworkFile {
  id: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrintavoV2ProductionFile {
  id: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Imprint Types
// ============================================================================

export interface PrintavoV2Imprint {
  id: string;
  name?: string;
  placement?: string;
  description?: string;
  colors?: string[] | string;
  stitchCount?: number;
  printMethod?: string;
  mockupUrl?: string;
  artworkFiles?: Connection<PrintavoV2ArtworkFile>;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Line Item Types
// ============================================================================

export interface PrintavoV2LineItemSize {
  size: string;
  count: number;
}

export interface PrintavoV2Personalization {
  name?: string;
  number?: string | number;
  size?: string;
}

export interface PrintavoV2Product {
  id: string;
  name?: string;
  sku?: string;
  description?: string;
  category?: string;
  price?: number;
  defaultPrice?: number;
}

export interface PrintavoV2Category {
  id: string;
  name?: string;
}

export interface PrintavoV2LineItem {
  id: string;
  description?: string;
  color?: string;
  items?: number;
  quantity?: number;
  price?: number;
  category?: PrintavoV2Category | string;
  itemNumber?: string;
  taxed?: boolean;
  taxable?: boolean;
  position?: number;
  markupPercentage?: number;
  sizes?: PrintavoV2LineItemSize[];
  personalizations?: PrintavoV2Personalization[];
  product?: PrintavoV2Product;
}

export interface PrintavoV2LineItemGroup {
  id: string;
  position?: number;
  lineItems?: Connection<PrintavoV2LineItem> | PrintavoV2LineItem[];
  imprints?: Connection<PrintavoV2Imprint>;
}

// ============================================================================
// Task Types
// ============================================================================

export interface PrintavoV2User {
  id: string;
  name?: string;
  email?: string;
}

export interface PrintavoV2Task {
  id: string;
  name?: string;
  description?: string;
  dueAt?: string;
  completedAt?: string;
  assignee?: PrintavoV2User;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Financial Types
// ============================================================================

export interface PrintavoV2Payment {
  id: string;
  amount?: number;
  paymentMethod?: string;
  createdAt?: string;
  note?: string;
  __typename?: 'Payment';
}

export interface PrintavoV2Refund {
  id: string;
  amount?: number;
  createdAt?: string;
  reason?: string;
  __typename?: 'Refund';
}

export interface PrintavoV2Expense {
  id: string;
  amount?: number;
  description?: string;
  vendor?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrintavoV2Fee {
  id: string;
  name?: string;
  amount?: number;
  taxable?: boolean;
}

export type PrintavoV2Transaction = PrintavoV2Payment | PrintavoV2Refund;

// ============================================================================
// Status Types
// ============================================================================

export interface PrintavoV2Status {
  id: string;
  name?: string;
  color?: string;
}

// ============================================================================
// Order Types
// ============================================================================

export interface PrintavoV2Order {
  id: string;
  visualId?: string;
  orderNumber?: string;
  nickname?: string;
  status?: PrintavoV2Status;
  productionStatus?: string;
  
  // Financial fields
  total?: number;
  subtotal?: number;
  taxTotal?: number;
  discountTotal?: number;
  salesTax?: number;
  salesTaxAmount?: number;
  amountPaid?: number;
  amountOutstanding?: number;
  
  // Dates
  customerDueAt?: string;
  paymentDueAt?: string;
  inHandsDate?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Notes and metadata
  productionNote?: string;
  customerNote?: string;
  tags?: string[] | string;
  merch?: boolean;
  
  // URLs
  publicUrl?: string;
  publicPdf?: string;
  workorderUrl?: string;
  packingSlipUrl?: string;
  
  // Relationships
  customer?: PrintavoV2Customer;
  contact?: PrintavoV2Contact;
  owner?: PrintavoV2User;
  billingAddress?: PrintavoV2Address;
  shippingAddress?: PrintavoV2Address;
  
  // Collections
  lineItemGroups?: Connection<PrintavoV2LineItemGroup> | PrintavoV2LineItemGroup[];
  tasks?: Connection<PrintavoV2Task> | PrintavoV2Task[];
  payments?: Connection<PrintavoV2Payment> | PrintavoV2Payment[];
  productionFiles?: Connection<PrintavoV2ProductionFile>;
  transactions?: Connection<PrintavoV2Transaction>;
  expenses?: Connection<PrintavoV2Expense>;
  fees?: Connection<PrintavoV2Fee>;
}

// ============================================================================
// Quote Types
// ============================================================================

export interface PrintavoV2Quote {
  id: string;
  visualId?: string;
  nickname?: string;
  status?: PrintavoV2Status;
  
  // Financial fields
  total?: number;
  subtotal?: number;
  
  // Dates
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Relationships
  customer?: PrintavoV2Customer;
  contact?: PrintavoV2Contact;
  
  // Collections
  lineItemGroups?: Connection<PrintavoV2LineItemGroup> | PrintavoV2LineItemGroup[];
}

// ============================================================================
// Invoice Types
// ============================================================================

export interface PrintavoV2Invoice {
  id: string;
  visualId?: string;
  invoiceNumber?: string;
  status?: PrintavoV2Status;
  
  // Financial fields
  total?: number;
  paidAmount?: number;
  amountPaid?: number;
  amountOutstanding?: number;
  
  // Dates
  dueDate?: string;
  dueAt?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Relationships
  order?: { id: string; visualId?: string };
  customer?: PrintavoV2Customer;
  payments?: Connection<PrintavoV2Payment> | PrintavoV2Payment[];
}

// ============================================================================
// Product Variant Types (for product catalog)
// ============================================================================

export interface PrintavoV2ProductVariant {
  id: string;
  sku?: string;
  color?: string;
  size?: string;
  price?: number;
}

// ============================================================================
// Extraction Summary
// ============================================================================

export interface ExtractionSummary {
  extractedAt: string;
  duration: number;
  counts: {
    customers: number;
    orders: number;
    quotes: number;
    products: number;
    invoices?: number;
    imprints?: number;
    files?: number;
  };
  errors: Array<{ entity: string; error: string }>;
}

// ============================================================================
// Checkpoint for Resume Capability
// ============================================================================

export interface ExtractionCheckpoint {
  timestamp: string;
  lastProcessedOrderId?: string;
  lastProcessedCursor?: string;
  ordersProcessed: number;
  totalOrders?: number;
  currentPhase: 'orders' | 'customers' | 'quotes' | 'products' | 'complete';
}

// ============================================================================
// File Manifest
// ============================================================================

export interface FileManifestEntry {
  id: string;
  url: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  source: 'artwork' | 'production';
  relatedEntityType: 'order' | 'quote' | 'imprint';
  relatedEntityId: string;
}

export interface FilesManifest {
  generatedAt: string;
  totalFiles: number;
  files: FileManifestEntry[];
}

// ============================================================================
// Normalized Imprint Data
// ============================================================================

export interface NormalizedImprint {
  id: string;
  orderId?: string;
  quoteId?: string;
  lineItemGroupId: string;
  name?: string;
  placement?: string;
  description?: string;
  colors?: string[];
  stitchCount?: number;
  printMethod?: string;
  mockupUrl?: string;
  artworkFileIds?: string[];
  artworkFiles?: PrintavoV2ArtworkFile[];
  createdAt?: string;
  updatedAt?: string;
}
