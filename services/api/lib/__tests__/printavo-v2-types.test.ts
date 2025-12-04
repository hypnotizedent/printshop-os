/**
 * Unit tests for Printavo v2 Types
 *
 * Tests that all type definitions are properly structured
 * and can be used correctly in TypeScript code.
 */

import {
  PrintavoV2Config,
  PrintavoV2Address,
  PrintavoV2Contact,
  PrintavoV2Customer,
  PrintavoV2ArtworkFile,
  PrintavoV2ProductionFile,
  PrintavoV2Imprint,
  PrintavoV2LineItemSize,
  PrintavoV2Personalization,
  PrintavoV2LineItem,
  PrintavoV2LineItemGroup,
  PrintavoV2Payment,
  PrintavoV2Refund,
  PrintavoV2Expense,
  PrintavoV2Fee,
  PrintavoV2Order,
  PrintavoV2Quote,
  PrintavoV2Invoice,
  ExtractionSummary,
  ExtractionCheckpoint,
  FilesManifest,
  FileManifestEntry,
  NormalizedImprint,
  PageInfo,
  Connection,
} from '../printavo-v2-types';

describe('Printavo v2 Types', () => {
  describe('Configuration Types', () => {
    it('should define PrintavoV2Config type', () => {
      const config: PrintavoV2Config = {
        email: 'test@example.com',
        token: 'test-api-token',
        apiUrl: 'https://api.example.com',
        rateLimitMs: 500,
      };

      expect(config.email).toBe('test@example.com');
      expect(config.token).toBe('test-api-token');
      expect(config.rateLimitMs).toBe(500);
    });

    it('should define PageInfo type', () => {
      const pageInfo: PageInfo = {
        hasNextPage: true,
        endCursor: 'cursor-123',
      };

      expect(pageInfo.hasNextPage).toBe(true);
      expect(pageInfo.endCursor).toBe('cursor-123');
    });

    it('should define Connection type', () => {
      const connection: Connection<PrintavoV2Contact> = {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [
          {
            id: '1',
            fullName: 'John Doe',
            email: 'john@example.com',
          },
        ],
      };

      expect(connection.nodes).toHaveLength(1);
      expect(connection.nodes![0].fullName).toBe('John Doe');
    });
  });

  describe('Address and Contact Types', () => {
    it('should define PrintavoV2Address type with all fields', () => {
      const address: PrintavoV2Address = {
        id: 'addr-1',
        companyName: 'Test Company',
        customerName: 'John Doe',
        address1: '123 Main St',
        address2: 'Suite 100',
        city: 'Springfield',
        stateIso: 'IL',
        zipCode: '62701',
        country: 'USA',
      };

      expect(address.companyName).toBe('Test Company');
      expect(address.city).toBe('Springfield');
    });

    it('should define PrintavoV2Contact type', () => {
      const contact: PrintavoV2Contact = {
        id: 'contact-1',
        fullName: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '555-1234',
      };

      expect(contact.fullName).toBe('Jane Smith');
      expect(contact.email).toBe('jane@example.com');
    });
  });

  describe('Customer Types', () => {
    it('should define PrintavoV2Customer type with all relationships', () => {
      const customer: PrintavoV2Customer = {
        id: 'cust-1',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme Corp',
        email: 'john@acme.com',
        phone: '555-0000',
        addresses: [
          {
            id: 'addr-1',
            address1: '123 Main St',
            city: 'Springfield',
          },
        ],
        contacts: [
          {
            id: 'contact-1',
            fullName: 'Jane Doe',
            email: 'jane@acme.com',
          },
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(customer.company).toBe('Acme Corp');
      expect(customer.addresses).toHaveLength(1);
      expect(customer.contacts).toHaveLength(1);
    });
  });

  describe('File Types', () => {
    it('should define PrintavoV2ArtworkFile type', () => {
      const artworkFile: PrintavoV2ArtworkFile = {
        id: 'artwork-1',
        fileUrl: 'https://example.com/artwork.pdf',
        fileName: 'logo.pdf',
        fileType: 'application/pdf',
        fileSize: 102400,
        createdAt: '2024-01-01T00:00:00Z',
      };

      expect(artworkFile.fileUrl).toContain('artwork.pdf');
      expect(artworkFile.fileSize).toBe(102400);
    });

    it('should define PrintavoV2ProductionFile type', () => {
      const productionFile: PrintavoV2ProductionFile = {
        id: 'prod-1',
        fileUrl: 'https://example.com/workorder.pdf',
        fileName: 'workorder.pdf',
        fileType: 'application/pdf',
        fileSize: 204800,
      };

      expect(productionFile.fileName).toBe('workorder.pdf');
    });
  });

  describe('Imprint Types', () => {
    it('should define PrintavoV2Imprint type with artwork files', () => {
      const imprint: PrintavoV2Imprint = {
        id: 'imprint-1',
        name: 'Front Logo',
        placement: 'Front Center',
        description: 'Company logo on chest',
        colors: ['Red', 'Blue', 'White'],
        stitchCount: 5000,
        printMethod: 'Screen Print',
        mockupUrl: 'https://example.com/mockup.png',
        artworkFiles: {
          nodes: [
            {
              id: 'file-1',
              fileUrl: 'https://example.com/logo.pdf',
              fileName: 'logo.pdf',
            },
          ],
        },
      };

      expect(imprint.name).toBe('Front Logo');
      expect(imprint.colors).toHaveLength(3);
      expect(imprint.artworkFiles?.nodes).toHaveLength(1);
    });
  });

  describe('Line Item Types', () => {
    it('should define PrintavoV2LineItemSize type', () => {
      const size: PrintavoV2LineItemSize = {
        size: 'M',
        count: 50,
      };

      expect(size.size).toBe('M');
      expect(size.count).toBe(50);
    });

    it('should define PrintavoV2Personalization type', () => {
      const personalization: PrintavoV2Personalization = {
        name: 'John Smith',
        number: '42',
        size: 'L',
      };

      expect(personalization.name).toBe('John Smith');
      expect(personalization.number).toBe('42');
    });

    it('should define PrintavoV2LineItem type with sizes and personalizations', () => {
      const lineItem: PrintavoV2LineItem = {
        id: 'item-1',
        description: 'T-Shirt - Black',
        color: 'Black',
        items: 100,
        price: 15.99,
        itemNumber: 'TS-001',
        taxed: true,
        position: 1,
        sizes: [
          { size: 'S', count: 20 },
          { size: 'M', count: 50 },
          { size: 'L', count: 30 },
        ],
        personalizations: [
          { name: 'John Doe', number: '10', size: 'M' },
        ],
        product: {
          id: 'prod-1',
          name: 'Premium T-Shirt',
          sku: 'TS-PREM-001',
        },
      };

      expect(lineItem.items).toBe(100);
      expect(lineItem.sizes).toHaveLength(3);
      expect(lineItem.personalizations).toHaveLength(1);
      expect(lineItem.product?.name).toBe('Premium T-Shirt');
    });

    it('should define PrintavoV2LineItemGroup type with imprints', () => {
      const lineItemGroup: PrintavoV2LineItemGroup = {
        id: 'group-1',
        position: 1,
        lineItems: {
          nodes: [
            {
              id: 'item-1',
              description: 'T-Shirt',
              items: 100,
            },
          ],
        },
        imprints: {
          nodes: [
            {
              id: 'imprint-1',
              name: 'Logo',
              placement: 'Front',
            },
          ],
        },
      };

      expect(lineItemGroup.position).toBe(1);
      const lineItems = lineItemGroup.lineItems as Connection<PrintavoV2LineItem>;
      expect(lineItems?.nodes).toHaveLength(1);
      expect(lineItemGroup.imprints?.nodes).toHaveLength(1);
    });
  });

  describe('Financial Types', () => {
    it('should define PrintavoV2Payment type', () => {
      const payment: PrintavoV2Payment = {
        id: 'payment-1',
        amount: 500.0,
        paymentMethod: 'Credit Card',
        createdAt: '2024-01-01T00:00:00Z',
        note: 'Initial deposit',
        __typename: 'Payment',
      };

      expect(payment.amount).toBe(500.0);
      expect(payment.paymentMethod).toBe('Credit Card');
    });

    it('should define PrintavoV2Refund type', () => {
      const refund: PrintavoV2Refund = {
        id: 'refund-1',
        amount: 100.0,
        createdAt: '2024-01-01T00:00:00Z',
        reason: 'Customer request',
        __typename: 'Refund',
      };

      expect(refund.amount).toBe(100.0);
      expect(refund.reason).toBe('Customer request');
    });

    it('should define PrintavoV2Expense type', () => {
      const expense: PrintavoV2Expense = {
        id: 'expense-1',
        amount: 250.0,
        description: 'Shipping costs',
        vendor: 'UPS',
        category: 'Shipping',
        createdAt: '2024-01-01T00:00:00Z',
      };

      expect(expense.amount).toBe(250.0);
      expect(expense.vendor).toBe('UPS');
    });

    it('should define PrintavoV2Fee type', () => {
      const fee: PrintavoV2Fee = {
        id: 'fee-1',
        name: 'Rush Fee',
        amount: 50.0,
        taxable: true,
      };

      expect(fee.name).toBe('Rush Fee');
      expect(fee.taxable).toBe(true);
    });
  });

  describe('Order Types', () => {
    it('should define complete PrintavoV2Order type', () => {
      const order: PrintavoV2Order = {
        id: 'order-1',
        visualId: 'INV-001',
        nickname: 'Company Event Shirts',
        total: 1500.0,
        subtotal: 1350.0,
        taxTotal: 150.0,
        amountPaid: 750.0,
        amountOutstanding: 750.0,
        customerDueAt: '2024-02-01T00:00:00Z',
        productionNote: 'Rush order',
        customerNote: 'Deliver to front desk',
        tags: ['rush', 'corporate'],
        publicUrl: 'https://example.com/orders/order-1',
        status: { id: 'status-1', name: 'In Production', color: 'blue' },
        customer: { id: 'cust-1', company: 'Acme Corp' },
        contact: { id: 'contact-1', fullName: 'John Doe', email: 'john@acme.com' },
        billingAddress: {
          companyName: 'Acme Corp',
          address1: '123 Main St',
          city: 'Springfield',
        },
        lineItemGroups: {
          nodes: [
            {
              id: 'group-1',
              position: 1,
              lineItems: { nodes: [] },
              imprints: { nodes: [] },
            },
          ],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      };

      expect(order.visualId).toBe('INV-001');
      expect(order.total).toBe(1500.0);
      expect(order.amountPaid).toBe(750.0);
      expect(order.tags).toContain('rush');
      expect(order.customer?.company).toBe('Acme Corp');
    });

    it('should define PrintavoV2Quote type', () => {
      const quote: PrintavoV2Quote = {
        id: 'quote-1',
        visualId: 'QT-001',
        nickname: 'Event Quote',
        total: 2000.0,
        subtotal: 1800.0,
        expiresAt: '2024-02-01T00:00:00Z',
        status: { id: 'status-1', name: 'Pending' },
        customer: { id: 'cust-1', company: 'Acme Corp' },
        createdAt: '2024-01-01T00:00:00Z',
      };

      expect(quote.visualId).toBe('QT-001');
      expect(quote.total).toBe(2000.0);
      expect(quote.expiresAt).toBe('2024-02-01T00:00:00Z');
    });

    it('should define PrintavoV2Invoice type', () => {
      const invoice: PrintavoV2Invoice = {
        id: 'invoice-1',
        visualId: 'INV-001',
        total: 1500.0,
        amountPaid: 1500.0,
        amountOutstanding: 0,
        dueAt: '2024-02-01T00:00:00Z',
        status: { id: 'status-1', name: 'Paid' },
        customer: { id: 'cust-1', company: 'Acme Corp' },
        payments: {
          nodes: [
            {
              id: 'payment-1',
              amount: 1500.0,
              createdAt: '2024-01-15T00:00:00Z',
            },
          ],
        },
      };

      expect(invoice.total).toBe(1500.0);
      expect(invoice.amountOutstanding).toBe(0);
      const payments = invoice.payments as Connection<PrintavoV2Payment>;
      expect(payments?.nodes).toHaveLength(1);
    });
  });

  describe('Extraction Summary and Checkpoint Types', () => {
    it('should define ExtractionSummary type', () => {
      const summary: ExtractionSummary = {
        extractedAt: '2024-01-01T00:00:00Z',
        duration: 120000,
        counts: {
          customers: 100,
          orders: 500,
          quotes: 50,
          products: 200,
          imprints: 300,
          files: 450,
        },
        errors: [
          { entity: 'customers', error: 'Network timeout' },
        ],
      };

      expect(summary.counts.orders).toBe(500);
      expect(summary.counts.imprints).toBe(300);
      expect(summary.errors).toHaveLength(1);
    });

    it('should define ExtractionCheckpoint type', () => {
      const checkpoint: ExtractionCheckpoint = {
        timestamp: '2024-01-01T00-00-00',
        lastProcessedOrderId: 'order-50',
        lastProcessedCursor: 'cursor-xyz',
        ordersProcessed: 50,
        totalOrders: 500,
        currentPhase: 'orders',
      };

      expect(checkpoint.ordersProcessed).toBe(50);
      expect(checkpoint.currentPhase).toBe('orders');
    });

    it('should define FilesManifest type', () => {
      const manifest: FilesManifest = {
        generatedAt: '2024-01-01T00:00:00Z',
        totalFiles: 2,
        files: [
          {
            id: 'file-1',
            url: 'https://example.com/file1.pdf',
            fileName: 'artwork.pdf',
            fileType: 'application/pdf',
            source: 'artwork',
            relatedEntityType: 'imprint',
            relatedEntityId: 'imprint-1',
          },
          {
            id: 'file-2',
            url: 'https://example.com/file2.pdf',
            fileName: 'workorder.pdf',
            fileType: 'application/pdf',
            source: 'production',
            relatedEntityType: 'order',
            relatedEntityId: 'order-1',
          },
        ],
      };

      expect(manifest.totalFiles).toBe(2);
      expect(manifest.files).toHaveLength(2);
      expect(manifest.files[0].source).toBe('artwork');
      expect(manifest.files[1].source).toBe('production');
    });

    it('should define FileManifestEntry type', () => {
      const entry: FileManifestEntry = {
        id: 'file-1',
        url: 'https://example.com/file.pdf',
        fileName: 'document.pdf',
        fileType: 'application/pdf',
        fileSize: 102400,
        source: 'artwork',
        relatedEntityType: 'order',
        relatedEntityId: 'order-1',
      };

      expect(entry.source).toBe('artwork');
      expect(entry.fileSize).toBe(102400);
    });

    it('should define NormalizedImprint type', () => {
      const normalizedImprint: NormalizedImprint = {
        id: 'imprint-1',
        orderId: 'order-1',
        lineItemGroupId: 'group-1',
        name: 'Front Logo',
        placement: 'Front Center',
        colors: ['Red', 'Blue'],
        printMethod: 'Screen Print',
        artworkFileIds: ['file-1', 'file-2'],
        artworkFiles: [
          {
            id: 'file-1',
            fileUrl: 'https://example.com/logo1.pdf',
            fileName: 'logo1.pdf',
          },
        ],
      };

      expect(normalizedImprint.orderId).toBe('order-1');
      expect(normalizedImprint.colors).toHaveLength(2);
      expect(normalizedImprint.artworkFileIds).toHaveLength(2);
      expect(normalizedImprint.artworkFiles).toHaveLength(1);
    });
  });
});
