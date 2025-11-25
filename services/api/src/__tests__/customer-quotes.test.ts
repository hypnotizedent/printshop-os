/**
 * Customer Quotes Tests
 * Comprehensive test suite for quote listing, approval, rejection, and conversion
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  Quote,
  QuoteStatus,
  QuoteItem,
  ApprovalRequest,
  RejectionRequest,
  ChangeRequestPayload,
  validateQuote,
  validateApprovalRequest,
  isQuoteExpired,
  daysUntilExpiration,
} from '../../lib/quote-schema';
import {
  listCustomerQuotes,
  getQuoteDetail,
  getQuoteHistory,
  generateQuotePDF,
  getQuoteStatistics,
  quoteStore,
} from '../routes/customer-quotes';
import {
  approveQuote,
  rejectQuote,
  requestQuoteChanges,
  convertQuoteToOrder,
  emailService,
  auditLog,
} from '../routes/quote-approval';

/**
 * Helper function to create a sample quote
 */
function createSampleQuote(
  id: string,
  customerId: string,
  status: QuoteStatus = QuoteStatus.PENDING,
  daysUntilExpires: number = 7
): Quote {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + daysUntilExpires);

  const lineItem: QuoteItem = {
    id: `item-${id}`,
    productName: 'Gildan 5000',
    quantity: 100,
    unitPrice: 9.45,
    colors: 1,
    printLocations: ['Front'],
    description: 'Black t-shirt with logo',
    total: 945.0,
  };

  return {
    id,
    quoteNumber: `QTE-2025-${id.padStart(3, '0')}`,
    customerId,
    status,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lineItems: [lineItem],
    subtotal: 945.0,
    setupFees: 75.0,
    rushFee: 0,
    tax: 87.75,
    total: 1107.75,
    artworkFiles: [],
    changeRequests: [],
  };
}

/**
 * Test Suite
 */
describe('Customer Quotes - Complete Test Suite', () => {
  const testCustomerId = 'customer-123';
  const otherCustomerId = 'customer-456';

  beforeEach(() => {
    // Clear stores before each test
    quoteStore.clear();
    emailService.clearSentEmails();
    auditLog.clearLogs();
  });

  afterEach(() => {
    quoteStore.clear();
    emailService.clearSentEmails();
    auditLog.clearLogs();
  });

  // ============================================================================
  // Schema Validation Tests
  // ============================================================================
  describe('Schema Validation', () => {
    it('should validate a complete quote', () => {
      const quote = createSampleQuote('001', testCustomerId);
      const validation = validateQuote(quote);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should fail validation for missing required fields', () => {
      const invalidQuote: Partial<Quote> = {
        id: '001',
      };

      const validation = validateQuote(invalidQuote);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should validate approval request with all fields', () => {
      const request: ApprovalRequest = {
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        name: 'John Smith',
        email: 'john@company.com',
        termsAccepted: true,
      };

      const validation = validateApprovalRequest(request);
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should fail validation for approval without signature', () => {
      const request: Partial<ApprovalRequest> = {
        name: 'John Smith',
        email: 'john@company.com',
        termsAccepted: true,
      };

      const validation = validateApprovalRequest(request);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('signature is required and cannot be empty');
    });

    it('should fail validation for approval without terms acceptance', () => {
      const request: Partial<ApprovalRequest> = {
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        name: 'John Smith',
        email: 'john@company.com',
        termsAccepted: false,
      };

      const validation = validateApprovalRequest(request);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('terms must be accepted');
    });

    it('should detect expired quotes', () => {
      const expiredQuote = createSampleQuote('001', testCustomerId, QuoteStatus.PENDING, -1);
      expect(isQuoteExpired(expiredQuote)).toBe(true);
    });

    it('should calculate days until expiration', () => {
      const quote = createSampleQuote('001', testCustomerId, QuoteStatus.PENDING, 5);
      const days = daysUntilExpiration(quote);
      expect(days).toBeGreaterThanOrEqual(4);
      expect(days).toBeLessThanOrEqual(6);
    });
  });

  // ============================================================================
  // Quote Listing Tests
  // ============================================================================
  describe('List Customer Quotes', () => {
    it('should list all quotes for a customer', async () => {
      const quote1 = createSampleQuote('001', testCustomerId);
      const quote2 = createSampleQuote('002', testCustomerId);
      const quote3 = createSampleQuote('003', otherCustomerId);

      quoteStore.seed([quote1, quote2, quote3]);

      const result = await listCustomerQuotes(testCustomerId);

      expect(result.quotes.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.quotes[0].customerId).toBe(testCustomerId);
    });

    it('should filter quotes by status', async () => {
      const quote1 = createSampleQuote('001', testCustomerId, QuoteStatus.PENDING);
      const quote2 = createSampleQuote('002', testCustomerId, QuoteStatus.APPROVED);
      const quote3 = createSampleQuote('003', testCustomerId, QuoteStatus.PENDING);

      quoteStore.seed([quote1, quote2, quote3]);

      const result = await listCustomerQuotes(testCustomerId, QuoteStatus.PENDING);

      expect(result.quotes.length).toBe(2);
      expect(result.quotes.every((q) => q.status === QuoteStatus.PENDING)).toBe(true);
    });

    it('should automatically mark expired quotes', async () => {
      const expiredQuote = createSampleQuote('001', testCustomerId, QuoteStatus.PENDING, -1);
      quoteStore.seed([expiredQuote]);

      const result = await listCustomerQuotes(testCustomerId);

      expect(result.quotes[0].status).toBe(QuoteStatus.EXPIRED);
    });

    it('should sort quotes by creation date (newest first)', async () => {
      const quote1 = createSampleQuote('001', testCustomerId);
      const quote2 = createSampleQuote('002', testCustomerId);
      const quote3 = createSampleQuote('003', testCustomerId);

      // Manually set different creation dates
      quote1.createdAt = '2025-11-20T10:00:00Z';
      quote2.createdAt = '2025-11-22T10:00:00Z';
      quote3.createdAt = '2025-11-21T10:00:00Z';

      quoteStore.seed([quote1, quote2, quote3]);

      const result = await listCustomerQuotes(testCustomerId);

      expect(result.quotes[0].id).toBe('002');
      expect(result.quotes[1].id).toBe('003');
      expect(result.quotes[2].id).toBe('001');
    });

    it('should throw error if customerId is missing', async () => {
      await expect(listCustomerQuotes('')).rejects.toThrow('customerId is required');
    });
  });

  // ============================================================================
  // Quote Detail Tests
  // ============================================================================
  describe('Get Quote Detail', () => {
    it('should retrieve quote details for owner', async () => {
      const quote = createSampleQuote('001', testCustomerId);
      quoteStore.seed([quote]);

      const result = await getQuoteDetail('001', testCustomerId);

      expect(result.id).toBe('001');
      expect(result.quoteNumber).toBe('QTE-2025-001');
    });

    it('should deny access to quote not owned by customer', async () => {
      const quote = createSampleQuote('001', otherCustomerId);
      quoteStore.seed([quote]);

      await expect(getQuoteDetail('001', testCustomerId)).rejects.toThrow(
        'Access denied: Quote does not belong to customer'
      );
    });

    it('should throw error if quote not found', async () => {
      await expect(getQuoteDetail('999', testCustomerId)).rejects.toThrow('Quote not found');
    });

    it('should update expired quote status on retrieval', async () => {
      const expiredQuote = createSampleQuote('001', testCustomerId, QuoteStatus.PENDING, -1);
      quoteStore.seed([expiredQuote]);

      const result = await getQuoteDetail('001', testCustomerId);

      expect(result.status).toBe(QuoteStatus.EXPIRED);
    });
  });

  // ============================================================================
  // Quote Approval Tests
  // ============================================================================
  describe('Approve Quote', () => {
    it('should approve quote with valid signature', async () => {
      const quote = createSampleQuote('001', testCustomerId);
      quoteStore.seed([quote]);

      const approvalData: ApprovalRequest = {
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        name: 'John Smith',
        email: 'john@company.com',
        termsAccepted: true,
      };

      const result = await approveQuote('001', testCustomerId, approvalData);

      expect(result.status).toBe(QuoteStatus.APPROVED);
      expect(result.approvalSignature).toBe(approvalData.signature);
      expect(result.approvalName).toBe(approvalData.name);
      expect(result.approvalEmail).toBe(approvalData.email);
      expect(result.approvedAt).toBeDefined();
    });

    it('should send email notification on approval', async () => {
      const quote = createSampleQuote('001', testCustomerId);
      quoteStore.seed([quote]);

      const approvalData: ApprovalRequest = {
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        name: 'John Smith',
        email: 'john@company.com',
        termsAccepted: true,
      };

      await approveQuote('001', testCustomerId, approvalData);

      const emails = emailService.getSentEmails();
      expect(emails.length).toBe(1);
      expect(emails[0].subject).toContain('Approved');
    });

    it('should create audit log entry on approval', async () => {
      const quote = createSampleQuote('001', testCustomerId);
      quoteStore.seed([quote]);

      const approvalData: ApprovalRequest = {
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        name: 'John Smith',
        email: 'john@company.com',
        termsAccepted: true,
      };

      await approveQuote('001', testCustomerId, approvalData);

      const logs = auditLog.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('APPROVED');
      expect(logs[0].customerId).toBe(testCustomerId);
    });

    it('should fail to approve already approved quote', async () => {
      const quote = createSampleQuote('001', testCustomerId, QuoteStatus.APPROVED);
      quoteStore.seed([quote]);

      const approvalData: ApprovalRequest = {
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        name: 'John Smith',
        email: 'john@company.com',
        termsAccepted: true,
      };

      await expect(approveQuote('001', testCustomerId, approvalData)).rejects.toThrow(
        'Cannot approve quote with status: Approved'
      );
    });

    it('should fail to approve expired quote', async () => {
      const expiredQuote = createSampleQuote('001', testCustomerId, QuoteStatus.PENDING, -1);
      quoteStore.seed([expiredQuote]);

      const approvalData: ApprovalRequest = {
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        name: 'John Smith',
        email: 'john@company.com',
        termsAccepted: true,
      };

      await expect(approveQuote('001', testCustomerId, approvalData)).rejects.toThrow(
        'Quote has expired'
      );
    });

    it('should deny approval for non-owner', async () => {
      const quote = createSampleQuote('001', otherCustomerId);
      quoteStore.seed([quote]);

      const approvalData: ApprovalRequest = {
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        name: 'John Smith',
        email: 'john@company.com',
        termsAccepted: true,
      };

      await expect(approveQuote('001', testCustomerId, approvalData)).rejects.toThrow(
        'Access denied'
      );
    });
  });

  // ============================================================================
  // Quote Rejection Tests
  // ============================================================================
  describe('Reject Quote', () => {
    it('should reject quote with reason', async () => {
      const quote = createSampleQuote('001', testCustomerId);
      quoteStore.seed([quote]);

      const rejectionData: RejectionRequest = {
        reason: 'Not in budget',
        comments: 'Price is too high',
      };

      const result = await rejectQuote('001', testCustomerId, rejectionData);

      expect(result.status).toBe(QuoteStatus.REJECTED);
      expect(result.rejectionReason).toBe('Not in budget');
      expect(result.rejectedAt).toBeDefined();
    });

    it('should send email notification on rejection', async () => {
      const quote = createSampleQuote('001', testCustomerId);
      quoteStore.seed([quote]);

      const rejectionData: RejectionRequest = {
        reason: 'Not in budget',
      };

      await rejectQuote('001', testCustomerId, rejectionData);

      const emails = emailService.getSentEmails();
      expect(emails.length).toBe(1);
      expect(emails[0].subject).toContain('Rejected');
    });

    it('should create audit log entry on rejection', async () => {
      const quote = createSampleQuote('001', testCustomerId);
      quoteStore.seed([quote]);

      const rejectionData: RejectionRequest = {
        reason: 'Not in budget',
      };

      await rejectQuote('001', testCustomerId, rejectionData);

      const logs = auditLog.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('REJECTED');
    });

    it('should reject quote without reason', async () => {
      const quote = createSampleQuote('001', testCustomerId);
      quoteStore.seed([quote]);

      const rejectionData: RejectionRequest = {};

      const result = await rejectQuote('001', testCustomerId, rejectionData);

      expect(result.status).toBe(QuoteStatus.REJECTED);
      expect(result.rejectionReason).toBe('No reason provided');
    });
  });

  // ============================================================================
  // Change Request Tests
  // ============================================================================
  describe('Request Quote Changes', () => {
    it('should create change request with comments', async () => {
      const quote = createSampleQuote('001', testCustomerId);
      quoteStore.seed([quote]);

      const changeData: ChangeRequestPayload = {
        comments: 'Please change back text size from 14" to 12"',
      };

      const result = await requestQuoteChanges('001', testCustomerId, changeData);

      expect(result.changeRequests.length).toBe(1);
      expect(result.changeRequests[0].comments).toBe(changeData.comments);
      expect(result.changeRequests[0].status).toBe('Pending');
    });

    it('should send email notification on change request', async () => {
      const quote = createSampleQuote('001', testCustomerId);
      quoteStore.seed([quote]);

      const changeData: ChangeRequestPayload = {
        comments: 'Please change back text size',
      };

      await requestQuoteChanges('001', testCustomerId, changeData);

      const emails = emailService.getSentEmails();
      expect(emails.length).toBe(1);
      expect(emails[0].subject).toContain('Change Request');
    });

    it('should fail without comments', async () => {
      const quote = createSampleQuote('001', testCustomerId);
      quoteStore.seed([quote]);

      const changeData: ChangeRequestPayload = {
        comments: '',
      };

      await expect(requestQuoteChanges('001', testCustomerId, changeData)).rejects.toThrow(
        'Comments are required'
      );
    });
  });

  // ============================================================================
  // Convert to Order Tests
  // ============================================================================
  describe('Convert Quote to Order', () => {
    it('should convert approved quote to order', async () => {
      const quote = createSampleQuote('001', testCustomerId, QuoteStatus.APPROVED);
      quoteStore.seed([quote]);

      const result = await convertQuoteToOrder('001', testCustomerId);

      expect(result.quote.status).toBe(QuoteStatus.CONVERTED);
      expect(result.orderNumber).toBeDefined();
      expect(result.orderNumber).toContain('ORD-');
      expect(result.quote.convertedAt).toBeDefined();
    });

    it('should send email notification on conversion', async () => {
      const quote = createSampleQuote('001', testCustomerId, QuoteStatus.APPROVED);
      quoteStore.seed([quote]);

      await convertQuoteToOrder('001', testCustomerId);

      const emails = emailService.getSentEmails();
      expect(emails.length).toBe(1);
      expect(emails[0].subject).toContain('Converted to Order');
    });

    it('should fail to convert non-approved quote', async () => {
      const quote = createSampleQuote('001', testCustomerId, QuoteStatus.PENDING);
      quoteStore.seed([quote]);

      await expect(convertQuoteToOrder('001', testCustomerId)).rejects.toThrow(
        'Only approved quotes can be converted to orders'
      );
    });
  });

  // ============================================================================
  // Quote History Tests
  // ============================================================================
  describe('Get Quote History', () => {
    it('should return only completed quotes', async () => {
      const quote1 = createSampleQuote('001', testCustomerId, QuoteStatus.PENDING);
      const quote2 = createSampleQuote('002', testCustomerId, QuoteStatus.APPROVED);
      const quote3 = createSampleQuote('003', testCustomerId, QuoteStatus.CONVERTED);
      const quote4 = createSampleQuote('004', testCustomerId, QuoteStatus.REJECTED);

      quoteStore.seed([quote1, quote2, quote3, quote4]);

      const result = await getQuoteHistory(testCustomerId);

      expect(result.quotes.length).toBe(3);
      expect(result.quotes.every((q) => q.status !== QuoteStatus.PENDING)).toBe(true);
    });

    it('should limit results', async () => {
      const quotes = [];
      for (let i = 1; i <= 20; i++) {
        quotes.push(createSampleQuote(i.toString().padStart(3, '0'), testCustomerId, QuoteStatus.APPROVED));
      }

      quoteStore.seed(quotes);

      const result = await getQuoteHistory(testCustomerId, 5);

      expect(result.quotes.length).toBe(5);
      expect(result.total).toBe(20);
    });
  });

  // ============================================================================
  // PDF Generation Tests
  // ============================================================================
  describe('Generate Quote PDF', () => {
    it('should generate PDF for quote', async () => {
      const quote = createSampleQuote('001', testCustomerId);
      quoteStore.seed([quote]);

      const result = await generateQuotePDF('001', testCustomerId);

      expect(result.url).toBeDefined();
      expect(result.filename).toBe('QTE-2025-001.pdf');
    });

    it('should deny PDF access to non-owner', async () => {
      const quote = createSampleQuote('001', otherCustomerId);
      quoteStore.seed([quote]);

      await expect(generateQuotePDF('001', testCustomerId)).rejects.toThrow('Access denied');
    });
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================
  describe('Get Quote Statistics', () => {
    it('should calculate statistics correctly', async () => {
      const quotes = [
        createSampleQuote('001', testCustomerId, QuoteStatus.PENDING),
        createSampleQuote('002', testCustomerId, QuoteStatus.PENDING),
        createSampleQuote('003', testCustomerId, QuoteStatus.APPROVED),
        createSampleQuote('004', testCustomerId, QuoteStatus.REJECTED),
        createSampleQuote('005', testCustomerId, QuoteStatus.CONVERTED),
      ];

      quoteStore.seed(quotes);

      const stats = await getQuoteStatistics(testCustomerId);

      expect(stats.pending).toBe(2);
      expect(stats.approved).toBe(1);
      expect(stats.rejected).toBe(1);
      expect(stats.converted).toBe(1);
      expect(stats.total).toBe(5);
    });
  });
});
