/**
 * Customer Billing API Tests
 * Comprehensive test suite for billing and invoicing functionality
 */

import { describe, it, expect } from '@jest/globals';
import {
  billingService,
  BillingRoutes,
} from '../customer-billing';
import {
  InvoiceStatus,
  PaymentMethodType,
  PaymentStatus,
} from '../../billing-types';

describe('Customer Billing API', () => {
  const mockCustomerId = 'customer-123';

  describe('Invoice Management', () => {
    it('should list all invoices without filters', async () => {
      const result = await billingService.listInvoices(mockCustomerId);

      expect(result).toBeDefined();
      expect(result.invoices).toBeInstanceOf(Array);
      expect(result.invoices.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should filter invoices by status', async () => {
      const result = await billingService.listInvoices(
        mockCustomerId,
        { status: InvoiceStatus.PAID }
      );

      expect(result.invoices.length).toBeGreaterThan(0);
      result.invoices.forEach((invoice) => {
        expect(invoice.status).toBe(InvoiceStatus.PAID);
      });
    });

    it('should filter invoices by pending status', async () => {
      const result = await billingService.listInvoices(
        mockCustomerId,
        { status: InvoiceStatus.PENDING }
      );

      expect(result.invoices.length).toBeGreaterThan(0);
      result.invoices.forEach((invoice) => {
        expect(invoice.status).toBe(InvoiceStatus.PENDING);
      });
    });

    it('should search invoices by invoice number', async () => {
      const result = await billingService.listInvoices(
        mockCustomerId,
        { search: 'INV-2025-001' }
      );

      expect(result.invoices.length).toBe(1);
      expect(result.invoices[0].invoiceNumber).toBe('INV-2025-001');
    });

    it('should search invoices by order number', async () => {
      const result = await billingService.listInvoices(
        mockCustomerId,
        { search: '12345' }
      );

      expect(result.invoices.length).toBeGreaterThan(0);
      expect(result.invoices[0].orderNumber).toBe('12345');
    });

    it('should paginate invoice results', async () => {
      const page1 = await billingService.listInvoices(mockCustomerId, undefined, 1, 1);
      const page2 = await billingService.listInvoices(mockCustomerId, undefined, 2, 1);

      expect(page1.invoices.length).toBe(1);
      expect(page2.invoices.length).toBe(1);
      expect(page1.invoices[0].id).not.toBe(page2.invoices[0].id);
    });

    it('should get invoice by ID', async () => {
      const invoice = await billingService.getInvoice('inv-001');

      expect(invoice).toBeDefined();
      expect(invoice?.id).toBe('inv-001');
      expect(invoice?.invoiceNumber).toBe('INV-2025-001');
      expect(invoice?.status).toBe(InvoiceStatus.PENDING);
    });

    it('should return null for non-existent invoice', async () => {
      const invoice = await billingService.getInvoice('non-existent');

      expect(invoice).toBeNull();
    });

    it('should display invoice details with line items', async () => {
      const invoice = await billingService.getInvoice('inv-001');

      expect(invoice).toBeDefined();
      expect(invoice?.lineItems).toBeInstanceOf(Array);
      expect(invoice?.lineItems.length).toBeGreaterThan(0);
      
      const firstItem = invoice?.lineItems[0];
      expect(firstItem?.description).toBeDefined();
      expect(firstItem?.quantity).toBeGreaterThan(0);
      expect(firstItem?.unitPrice).toBeGreaterThan(0);
      expect(firstItem?.total).toBeCloseTo(firstItem!.quantity * firstItem!.unitPrice, 2);
    });

    it('should calculate invoice totals correctly', async () => {
      const invoice = await billingService.getInvoice('inv-001');

      expect(invoice).toBeDefined();
      expect(invoice?.subtotal).toBe(1045.0);
      expect(invoice?.tax).toBe(78.38);
      expect(invoice?.total).toBe(1123.38);
      expect(invoice?.balance).toBe(invoice!.total - invoice!.amountPaid);
    });

    it('should display payment status indicators', async () => {
      const paidInvoice = await billingService.getInvoice('inv-002');
      const pendingInvoice = await billingService.getInvoice('inv-001');

      expect(paidInvoice?.status).toBe(InvoiceStatus.PAID);
      expect(pendingInvoice?.status).toBe(InvoiceStatus.PENDING);
    });
  });

  describe('PDF Generation', () => {
    it('should generate invoice PDF', async () => {
      const pdf = await billingService.generateInvoicePDF('inv-001');

      expect(pdf).toBeDefined();
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf!.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent invoice PDF', async () => {
      const pdf = await billingService.generateInvoicePDF('non-existent');

      expect(pdf).toBeNull();
    });

    it('should generate PDF in less than 2 seconds', async () => {
      const startTime = Date.now();
      const pdf = await billingService.generateInvoicePDF('inv-001');
      const endTime = Date.now();

      expect(pdf).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('Email Invoice', () => {
    it('should email invoice to custom address', async () => {
      const result = await billingService.emailInvoice({
        invoiceId: 'inv-001',
        recipientEmail: 'custom@example.com',
      });

      expect(result).toBe(true);
    });

    it('should email invoice with custom message', async () => {
      const result = await billingService.emailInvoice({
        invoiceId: 'inv-001',
        recipientEmail: 'custom@example.com',
        message: 'Please review this invoice',
      });

      expect(result).toBe(true);
    });

    it('should return false for non-existent invoice', async () => {
      const result = await billingService.emailInvoice({
        invoiceId: 'non-existent',
        recipientEmail: 'custom@example.com',
      });

      expect(result).toBe(false);
    });
  });

  describe('Export to CSV', () => {
    it('should export invoices to CSV', async () => {
      const csv = await billingService.exportInvoicesCSV(mockCustomerId);

      expect(csv).toBeDefined();
      expect(csv.length).toBeGreaterThan(0);
      expect(csv).toContain('Invoice Number');
      expect(csv).toContain('INV-2025-001');
    });

    it('should export filtered invoices to CSV', async () => {
      const csv = await billingService.exportInvoicesCSV(
        mockCustomerId,
        { status: InvoiceStatus.PAID }
      );

      expect(csv).toBeDefined();
      expect(csv).toContain('INV-2025-002');
      expect(csv).not.toContain('INV-2025-001');
    });
  });

  describe('Payment History', () => {
    it('should retrieve payment history', async () => {
      const payments = await billingService.getPaymentHistory(mockCustomerId);

      expect(payments).toBeInstanceOf(Array);
      expect(payments.length).toBeGreaterThan(0);
    });

    it('should display payment details', async () => {
      const payments = await billingService.getPaymentHistory(mockCustomerId);
      const firstPayment = payments[0];

      expect(firstPayment.id).toBeDefined();
      expect(firstPayment.date).toBeDefined();
      expect(firstPayment.amount).toBeGreaterThan(0);
      expect(firstPayment.paymentMethod).toBeDefined();
      expect(firstPayment.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should sort payments by date descending', async () => {
      const payments = await billingService.getPaymentHistory(mockCustomerId);

      for (let i = 1; i < payments.length; i++) {
        const prevDate = new Date(payments[i - 1].date);
        const currDate = new Date(payments[i].date);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });
  });

  describe('Payment Methods', () => {
    it('should list payment methods', async () => {
      const methods = await billingService.listPaymentMethods(mockCustomerId);

      expect(methods).toBeInstanceOf(Array);
      expect(methods.length).toBeGreaterThan(0);
    });

    it('should display payment method details', async () => {
      const methods = await billingService.listPaymentMethods(mockCustomerId);
      const firstMethod = methods[0];

      expect(firstMethod.id).toBeDefined();
      expect(firstMethod.type).toBeDefined();
      expect(firstMethod.last4).toBeDefined();
      expect(firstMethod.last4.length).toBe(4);
      expect(firstMethod.token).toBeDefined();
    });

    it('should add new payment method', async () => {
      const newMethod = await billingService.addPaymentMethod(
        mockCustomerId,
        'tok_test_1234',
        PaymentMethodType.CARD,
        '9999',
        12,
        2028
      );

      expect(newMethod).toBeDefined();
      expect(newMethod.id).toBeDefined();
      expect(newMethod.type).toBe(PaymentMethodType.CARD);
      expect(newMethod.last4).toBe('9999');
      expect(newMethod.expiryMonth).toBe(12);
      expect(newMethod.expiryYear).toBe(2028);
      expect(newMethod.token).toBe('tok_test_1234');
    });

    it('should remove payment method', async () => {
      const result = await billingService.removePaymentMethod(mockCustomerId, 'pm-002');

      expect(result).toBe(true);
    });

    it('should return false when removing non-existent payment method', async () => {
      const result = await billingService.removePaymentMethod(mockCustomerId, 'non-existent');

      expect(result).toBe(false);
    });

    it('should set default payment method', async () => {
      const result = await billingService.setDefaultPaymentMethod(mockCustomerId, 'pm-001');

      expect(result).toBe(true);

      const methods = await billingService.listPaymentMethods(mockCustomerId);
      const defaultMethod = methods.find((m) => m.id === 'pm-001');
      expect(defaultMethod?.isDefault).toBe(true);
    });

    it('should ensure only one default payment method', async () => {
      await billingService.setDefaultPaymentMethod(mockCustomerId, 'pm-001');

      const methods = await billingService.listPaymentMethods(mockCustomerId);
      const defaultMethods = methods.filter((m) => m.isDefault);

      expect(defaultMethods.length).toBe(1);
    });

    it('should use tokenized payment methods (PCI compliant)', async () => {
      const methods = await billingService.listPaymentMethods(mockCustomerId);

      methods.forEach((method) => {
        expect(method.token).toBeDefined();
        expect(method.token).toContain('tok_');
        // Ensure no raw card data is stored
        expect(method.last4.length).toBe(4);
      });
    });
  });

  describe('Account Balance', () => {
    it('should calculate outstanding balance', async () => {
      const balance = await billingService.getAccountBalance(mockCustomerId);

      expect(balance).toBeDefined();
      expect(balance.totalOutstanding).toBeGreaterThanOrEqual(0);
      expect(balance.overdueAmount).toBeGreaterThanOrEqual(0);
      expect(balance.currentAmount).toBeGreaterThanOrEqual(0);
      expect(balance.invoiceCount).toBeGreaterThanOrEqual(0);
    });

    it('should separate current and overdue amounts', async () => {
      const balance = await billingService.getAccountBalance(mockCustomerId);

      expect(balance.totalOutstanding).toBe(
        balance.overdueAmount + balance.currentAmount
      );
    });
  });

  describe('BillingRoutes Integration', () => {
    it('should handle list invoices route', async () => {
      const result = await BillingRoutes.listInvoices(mockCustomerId, {
        page: '1',
        limit: '20',
      });

      expect(result).toBeDefined();
      expect(result.invoices).toBeInstanceOf(Array);
    });

    it('should handle get invoice route', async () => {
      const invoice = await BillingRoutes.getInvoice('inv-001');

      expect(invoice).toBeDefined();
      expect(invoice?.id).toBe('inv-001');
    });

    it('should handle get invoice PDF route', async () => {
      const pdf = await BillingRoutes.getInvoicePDF('inv-001');

      expect(pdf).toBeDefined();
      expect(pdf).toBeInstanceOf(Buffer);
    });

    it('should handle email invoice route', async () => {
      const result = await BillingRoutes.emailInvoice({
        invoiceId: 'inv-001',
        recipientEmail: 'test@example.com',
      });

      expect(result).toBe(true);
    });

    it('should handle export invoices route', async () => {
      const csv = await BillingRoutes.exportInvoices(mockCustomerId, {});

      expect(csv).toBeDefined();
      expect(csv).toContain('Invoice Number');
    });
  });
});
