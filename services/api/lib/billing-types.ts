/**
 * Billing and Invoicing Types
 * Defines the complete structure for invoices, payments, and payment methods
 */

/**
 * Invoice status types
 */
export enum InvoiceStatus {
  PAID = 'Paid',
  PENDING = 'Pending',
  OVERDUE = 'Overdue',
  VOID = 'Void',
}

/**
 * Payment status types
 */
export enum PaymentStatus {
  COMPLETED = 'Completed',
  PENDING = 'Pending',
  FAILED = 'Failed',
  REFUNDED = 'Refunded',
}

/**
 * Payment method types
 */
export enum PaymentMethodType {
  CARD = 'Card',
  BANK_ACH = 'Bank ACH',
  PAYPAL = 'PayPal',
}

/**
 * Line item in an invoice
 */
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Payment record
 */
export interface Payment {
  id: string;
  date: string;
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  transactionId?: string;
}

/**
 * Payment method
 */
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  token: string; // Tokenized payment method (PCI compliant)
}

/**
 * Complete invoice structure
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  amountPaid: number;
  balance: number;
  lineItems: InvoiceItem[];
  paymentHistory: Payment[];
  customerName: string;
  customerEmail: string;
  customerAddress?: {
    street: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
}

/**
 * Invoice list filters
 */
export interface InvoiceFilters {
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

/**
 * Account balance summary
 */
export interface AccountBalance {
  totalOutstanding: number;
  overdueAmount: number;
  currentAmount: number;
  invoiceCount: number;
}

/**
 * Invoice CSV export row
 */
export interface InvoiceCSVRow {
  invoiceNumber: string;
  orderNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  amountPaid: number;
  balance: number;
}

/**
 * Email invoice request
 */
export interface EmailInvoiceRequest {
  invoiceId: string;
  recipientEmail: string;
  message?: string;
}
