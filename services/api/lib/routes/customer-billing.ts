/**
 * Customer Billing Routes
 * API endpoints for invoice management, payment methods, and billing operations
 */

import {
  Invoice,
  InvoiceStatus,
  InvoiceFilters,
  PaymentMethod,
  PaymentMethodType,
  Payment,
  PaymentStatus,
  AccountBalance,
  EmailInvoiceRequest,
} from '../billing-types';
import { generateInvoicePDF, DEFAULT_COMPANY_INFO, CompanyInfo } from './invoice-generator';

/**
 * Mock data store for development/testing
 * In production, this would connect to Strapi/database
 */
class BillingService {
  private invoices: Map<string, Invoice> = new Map();
  private paymentMethods: Map<string, PaymentMethod> = new Map();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize with mock data for testing
   */
  private initializeMockData(): void {
    // Mock invoices
    const invoice1: Invoice = {
      id: 'inv-001',
      invoiceNumber: 'INV-2025-001',
      orderNumber: '12345',
      invoiceDate: '2025-11-20T00:00:00Z',
      dueDate: '2025-11-30T00:00:00Z',
      status: InvoiceStatus.PENDING,
      subtotal: 1045.0,
      tax: 78.38,
      shipping: 0,
      total: 1123.38,
      amountPaid: 0,
      balance: 1123.38,
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      customerAddress: {
        street: '123 Customer St',
        city: 'City',
        state: 'ST',
        zip: '12345',
      },
      lineItems: [
        {
          id: 'item-1',
          description: '100x Gildan 5000 - Black - Front Print',
          quantity: 100,
          unitPrice: 8.45,
          total: 845.0,
        },
        {
          id: 'item-2',
          description: 'Setup Fee',
          quantity: 1,
          unitPrice: 50.0,
          total: 50.0,
        },
        {
          id: 'item-3',
          description: 'Rush Fee',
          quantity: 1,
          unitPrice: 150.0,
          total: 150.0,
        },
      ],
      paymentHistory: [],
    };

    const invoice2: Invoice = {
      id: 'inv-002',
      invoiceNumber: 'INV-2025-002',
      orderNumber: '12346',
      invoiceDate: '2025-11-15T00:00:00Z',
      dueDate: '2025-11-25T00:00:00Z',
      status: InvoiceStatus.PAID,
      subtotal: 890.0,
      tax: 66.75,
      shipping: 25.0,
      total: 981.75,
      amountPaid: 981.75,
      balance: 0,
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      lineItems: [
        {
          id: 'item-4',
          description: '50x Bella Canvas 3001 - White - Logo Print',
          quantity: 50,
          unitPrice: 17.8,
          total: 890.0,
        },
      ],
      paymentHistory: [
        {
          id: 'pay-001',
          date: '2025-11-20T10:30:00Z',
          amount: 981.75,
          paymentMethod: 'Visa ****4242',
          status: PaymentStatus.COMPLETED,
          transactionId: 'txn_abc123',
        },
      ],
    };

    this.invoices.set(invoice1.id, invoice1);
    this.invoices.set(invoice2.id, invoice2);

    // Mock payment methods
    const paymentMethod1: PaymentMethod = {
      id: 'pm-001',
      type: PaymentMethodType.CARD,
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2026,
      isDefault: true,
      token: 'tok_visa_4242',
    };

    const paymentMethod2: PaymentMethod = {
      id: 'pm-002',
      type: PaymentMethodType.CARD,
      last4: '5858',
      expiryMonth: 6,
      expiryYear: 2027,
      isDefault: false,
      token: 'tok_mc_5858',
    };

    this.paymentMethods.set(paymentMethod1.id, paymentMethod1);
    this.paymentMethods.set(paymentMethod2.id, paymentMethod2);
  }

  /**
   * List invoices with optional filters and pagination
   */
  async listInvoices(
    _customerId: string,
    filters?: InvoiceFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ invoices: Invoice[]; total: number; page: number; totalPages: number }> {
    let filtered = Array.from(this.invoices.values());

    // Apply filters
    if (filters) {
      if (filters.status) {
        filtered = filtered.filter((inv) => inv.status === filters.status);
      }
      if (filters.startDate) {
        filtered = filtered.filter((inv) => inv.invoiceDate >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter((inv) => inv.invoiceDate <= filters.endDate!);
      }
      if (filters.minAmount !== undefined) {
        filtered = filtered.filter((inv) => inv.total >= filters.minAmount!);
      }
      if (filters.maxAmount !== undefined) {
        filtered = filtered.filter((inv) => inv.total <= filters.maxAmount!);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(searchLower) ||
            inv.orderNumber.toLowerCase().includes(searchLower)
        );
      }
    }

    // Sort by invoice date descending
    filtered.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const invoices = filtered.slice(start, end);

    return { invoices, total, page, totalPages };
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    return this.invoices.get(invoiceId) || null;
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(
    invoiceId: string,
    companyInfo?: CompanyInfo
  ): Promise<Buffer | null> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      return null;
    }

    return generateInvoicePDF(invoice, companyInfo || DEFAULT_COMPANY_INFO);
  }

  /**
   * Email invoice to recipient
   */
  async emailInvoice(request: EmailInvoiceRequest): Promise<boolean> {
    const invoice = await this.getInvoice(request.invoiceId);
    if (!invoice) {
      return false;
    }

    // In production, this would use a real email service
    console.log(`Emailing invoice ${invoice.invoiceNumber} to ${request.recipientEmail}`);
    if (request.message) {
      console.log(`Message: ${request.message}`);
    }

    return true;
  }

  /**
   * Export invoices to CSV
   */
  async exportInvoicesCSV(_customerId: string, filters?: InvoiceFilters): Promise<string> {
    const { invoices } = await this.listInvoices(_customerId, filters, 1, 1000);

    const headers = [
      'Invoice Number',
      'Order Number',
      'Invoice Date',
      'Due Date',
      'Status',
      'Subtotal',
      'Tax',
      'Shipping',
      'Total',
      'Amount Paid',
      'Balance',
    ];

    const rows: string[][] = [headers];

    invoices.forEach((invoice) => {
      rows.push([
        invoice.invoiceNumber,
        invoice.orderNumber,
        invoice.invoiceDate,
        invoice.dueDate,
        invoice.status,
        invoice.subtotal.toFixed(2),
        invoice.tax.toFixed(2),
        invoice.shipping.toFixed(2),
        invoice.total.toFixed(2),
        invoice.amountPaid.toFixed(2),
        invoice.balance.toFixed(2),
      ]);
    });

    return rows.map((row) => row.join(',')).join('\n');
  }

  /**
   * Get payment history for customer
   */
  async getPaymentHistory(_customerId: string): Promise<Payment[]> {
    const allPayments: Payment[] = [];

    this.invoices.forEach((invoice) => {
      allPayments.push(...invoice.paymentHistory);
    });

    // Sort by date descending
    allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allPayments;
  }

  /**
   * List payment methods for customer
   */
  async listPaymentMethods(_customerId: string): Promise<PaymentMethod[]> {
    return Array.from(this.paymentMethods.values());
  }

  /**
   * Add new payment method
   */
  async addPaymentMethod(
    _customerId: string,
    token: string,
    type: PaymentMethodType,
    last4: string,
    expiryMonth?: number,
    expiryYear?: number
  ): Promise<PaymentMethod> {
    const id = `pm-${Date.now()}`;
    const isDefault = this.paymentMethods.size === 0; // First method is default

    const paymentMethod: PaymentMethod = {
      id,
      type,
      last4,
      expiryMonth,
      expiryYear,
      isDefault,
      token,
    };

    this.paymentMethods.set(id, paymentMethod);
    return paymentMethod;
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(_customerId: string, paymentMethodId: string): Promise<boolean> {
    return this.paymentMethods.delete(paymentMethodId);
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(_customerId: string, paymentMethodId: string): Promise<boolean> {
    const method = this.paymentMethods.get(paymentMethodId);
    if (!method) {
      return false;
    }

    // Unset all other defaults
    this.paymentMethods.forEach((pm) => {
      pm.isDefault = false;
    });

    // Set this one as default
    method.isDefault = true;
    return true;
  }

  /**
   * Get account balance summary
   */
  async getAccountBalance(_customerId: string): Promise<AccountBalance> {
    const invoices = Array.from(this.invoices.values());
    const now = new Date();

    const totalOutstanding = invoices
      .filter((inv) => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.VOID)
      .reduce((sum, inv) => sum + inv.balance, 0);

    const overdueAmount = invoices
      .filter(
        (inv) =>
          inv.status === InvoiceStatus.OVERDUE ||
          (inv.status === InvoiceStatus.PENDING && new Date(inv.dueDate) < now)
      )
      .reduce((sum, inv) => sum + inv.balance, 0);

    const currentAmount = totalOutstanding - overdueAmount;

    const invoiceCount = invoices.filter(
      (inv) => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.VOID
    ).length;

    return {
      totalOutstanding,
      overdueAmount,
      currentAmount,
      invoiceCount,
    };
  }
}

// Export singleton instance
export const billingService = new BillingService();

/**
 * API Route Handlers
 * These would be used in an Express app
 */

export const BillingRoutes = {
  /**
   * GET /api/customer/invoices
   */
  listInvoices: async (customerId: string, query: any) => {
    const filters: InvoiceFilters = {
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      minAmount: query.minAmount ? parseFloat(query.minAmount) : undefined,
      maxAmount: query.maxAmount ? parseFloat(query.maxAmount) : undefined,
      search: query.search,
    };

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 20;

    return billingService.listInvoices(customerId, filters, page, limit);
  },

  /**
   * GET /api/customer/invoices/:id
   */
  getInvoice: async (invoiceId: string) => {
    return billingService.getInvoice(invoiceId);
  },

  /**
   * GET /api/customer/invoices/:id/pdf
   */
  getInvoicePDF: async (invoiceId: string) => {
    return billingService.generateInvoicePDF(invoiceId);
  },

  /**
   * POST /api/customer/invoices/:id/email
   */
  emailInvoice: async (request: EmailInvoiceRequest) => {
    return billingService.emailInvoice(request);
  },

  /**
   * GET /api/customer/invoices/export
   */
  exportInvoices: async (customerId: string, query: any) => {
    const filters: InvoiceFilters = {
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
    };

    return billingService.exportInvoicesCSV(customerId, filters);
  },

  /**
   * GET /api/customer/payments
   */
  getPaymentHistory: async (customerId: string) => {
    return billingService.getPaymentHistory(customerId);
  },

  /**
   * GET /api/customer/payment-methods
   */
  listPaymentMethods: async (customerId: string) => {
    return billingService.listPaymentMethods(customerId);
  },

  /**
   * POST /api/customer/payment-methods
   */
  addPaymentMethod: async (customerId: string, body: any) => {
    return billingService.addPaymentMethod(
      customerId,
      body.token,
      body.type,
      body.last4,
      body.expiryMonth,
      body.expiryYear
    );
  },

  /**
   * DELETE /api/customer/payment-methods/:id
   */
  removePaymentMethod: async (customerId: string, paymentMethodId: string) => {
    return billingService.removePaymentMethod(customerId, paymentMethodId);
  },

  /**
   * PATCH /api/customer/payment-methods/:id/default
   */
  setDefaultPaymentMethod: async (customerId: string, paymentMethodId: string) => {
    return billingService.setDefaultPaymentMethod(customerId, paymentMethodId);
  },

  /**
   * GET /api/customer/balance
   */
  getAccountBalance: async (customerId: string) => {
    return billingService.getAccountBalance(customerId);
  },
};
