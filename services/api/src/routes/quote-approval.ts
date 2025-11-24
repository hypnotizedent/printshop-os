/**
 * Quote Approval Routes
 * Handles approval, rejection, change requests, and order conversion
 */

import {
  Quote,
  QuoteStatus,
  ApprovalRequest,
  RejectionRequest,
  ChangeRequestPayload,
  ChangeRequest,
  validateApprovalRequest,
  isQuoteExpired,
} from '../../lib/quote-schema';
import { quoteStore } from './customer-quotes';

/**
 * Email notification service (mock implementation)
 */
class EmailNotificationService {
  private sentEmails: Array<{ to: string; subject: string; body: string }> = [];

  async sendQuoteApprovedNotification(quote: Quote): Promise<void> {
    const email = {
      to: quote.approvalEmail || '',
      subject: `Quote ${quote.quoteNumber} Approved`,
      body: `Your quote ${quote.quoteNumber} has been approved and signed.`,
    };
    this.sentEmails.push(email);
  }

  async sendQuoteRejectedNotification(quote: Quote): Promise<void> {
    const email = {
      to: 'staff@printshop.com',
      subject: `Quote ${quote.quoteNumber} Rejected`,
      body: `Quote ${quote.quoteNumber} has been rejected. Reason: ${quote.rejectionReason}`,
    };
    this.sentEmails.push(email);
  }

  async sendChangeRequestNotification(quote: Quote, changeRequest: ChangeRequest): Promise<void> {
    const email = {
      to: 'staff@printshop.com',
      subject: `Change Request for Quote ${quote.quoteNumber}`,
      body: `Customer has requested changes to quote ${quote.quoteNumber}. Comments: ${changeRequest.comments}`,
    };
    this.sentEmails.push(email);
  }

  async sendQuoteConvertedNotification(quote: Quote): Promise<void> {
    const email = {
      to: quote.approvalEmail || '',
      subject: `Quote ${quote.quoteNumber} Converted to Order ${quote.orderNumber}`,
      body: `Your quote has been converted to order ${quote.orderNumber} and production will begin.`,
    };
    this.sentEmails.push(email);
  }

  async sendQuoteExpiringNotification(quote: Quote): Promise<void> {
    const email = {
      to: quote.approvalEmail || '',
      subject: `Quote ${quote.quoteNumber} Expiring Soon`,
      body: `Your quote ${quote.quoteNumber} will expire in 3 days. Please review and approve.`,
    };
    this.sentEmails.push(email);
  }

  // For testing
  getSentEmails() {
    return this.sentEmails;
  }

  clearSentEmails() {
    this.sentEmails = [];
  }
}

export const emailService = new EmailNotificationService();

/**
 * Audit log service (mock implementation)
 */
class AuditLogService {
  private logs: Array<{
    quoteId: string;
    action: string;
    customerId: string;
    timestamp: string;
    metadata?: any;
  }> = [];

  log(quoteId: string, action: string, customerId: string, metadata?: any): void {
    this.logs.push({
      quoteId,
      action,
      customerId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  // For testing
  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const auditLog = new AuditLogService();

/**
 * Approve quote with digital signature
 * POST /api/customer/quotes/:id/approve
 */
export async function approveQuote(
  quoteId: string,
  customerId: string,
  approvalData: ApprovalRequest
): Promise<Quote> {
  if (!quoteId) {
    throw new Error('quoteId is required');
  }

  if (!customerId) {
    throw new Error('customerId is required');
  }

  // Validate approval request
  const validation = validateApprovalRequest(approvalData);
  if (!validation.isValid) {
    throw new Error(`Invalid approval request: ${validation.errors.join(', ')}`);
  }

  // Check ownership
  if (!quoteStore.isQuoteOwnedByCustomer(quoteId, customerId)) {
    throw new Error('Access denied: Quote does not belong to customer');
  }

  const quote = quoteStore.getQuote(quoteId);
  if (!quote) {
    throw new Error('Quote not found');
  }

  // Check if quote is still pending
  if (quote.status !== QuoteStatus.PENDING) {
    throw new Error(`Cannot approve quote with status: ${quote.status}`);
  }

  // Check if quote is expired
  if (isQuoteExpired(quote)) {
    quoteStore.updateQuoteStatus(quoteId, QuoteStatus.EXPIRED);
    throw new Error('Quote has expired');
  }

  // Update quote with approval data
  const approvalMetadata = {
    approvalSignature: approvalData.signature,
    approvalName: approvalData.name,
    approvalEmail: approvalData.email,
    approvedAt: new Date().toISOString(),
  };

  quoteStore.updateQuoteStatus(quoteId, QuoteStatus.APPROVED, approvalMetadata);

  const updatedQuote = quoteStore.getQuote(quoteId)!;

  // Send notifications
  await emailService.sendQuoteApprovedNotification(updatedQuote);

  // Audit log
  auditLog.log(quoteId, 'APPROVED', customerId, {
    approvalName: approvalData.name,
    approvalEmail: approvalData.email,
  });

  return updatedQuote;
}

/**
 * Reject quote with reason
 * POST /api/customer/quotes/:id/reject
 */
export async function rejectQuote(
  quoteId: string,
  customerId: string,
  rejectionData: RejectionRequest
): Promise<Quote> {
  if (!quoteId) {
    throw new Error('quoteId is required');
  }

  if (!customerId) {
    throw new Error('customerId is required');
  }

  // Check ownership
  if (!quoteStore.isQuoteOwnedByCustomer(quoteId, customerId)) {
    throw new Error('Access denied: Quote does not belong to customer');
  }

  const quote = quoteStore.getQuote(quoteId);
  if (!quote) {
    throw new Error('Quote not found');
  }

  // Check if quote is still pending
  if (quote.status !== QuoteStatus.PENDING) {
    throw new Error(`Cannot reject quote with status: ${quote.status}`);
  }

  // Update quote with rejection data
  const rejectionMetadata: any = {
    rejectionReason: rejectionData.reason || 'No reason provided',
    rejectedAt: new Date().toISOString(),
  };

  if (rejectionData.comments) {
    rejectionMetadata.notes = rejectionData.comments;
  }

  quoteStore.updateQuoteStatus(quoteId, QuoteStatus.REJECTED, rejectionMetadata);

  const updatedQuote = quoteStore.getQuote(quoteId)!;

  // Send notifications
  await emailService.sendQuoteRejectedNotification(updatedQuote);

  // Audit log
  auditLog.log(quoteId, 'REJECTED', customerId, {
    reason: rejectionData.reason,
    comments: rejectionData.comments,
  });

  return updatedQuote;
}

/**
 * Request changes to quote
 * POST /api/customer/quotes/:id/request-changes
 */
export async function requestQuoteChanges(
  quoteId: string,
  customerId: string,
  changeData: ChangeRequestPayload
): Promise<Quote> {
  if (!quoteId) {
    throw new Error('quoteId is required');
  }

  if (!customerId) {
    throw new Error('customerId is required');
  }

  if (!changeData.comments || changeData.comments.trim().length === 0) {
    throw new Error('Comments are required for change request');
  }

  // Check ownership
  if (!quoteStore.isQuoteOwnedByCustomer(quoteId, customerId)) {
    throw new Error('Access denied: Quote does not belong to customer');
  }

  const quote = quoteStore.getQuote(quoteId);
  if (!quote) {
    throw new Error('Quote not found');
  }

  // Check if quote is still pending
  if (quote.status !== QuoteStatus.PENDING) {
    throw new Error(`Cannot request changes for quote with status: ${quote.status}`);
  }

  // Create change request
  const changeRequest: ChangeRequest = {
    id: `CR-${Date.now()}`,
    requestedAt: new Date().toISOString(),
    comments: changeData.comments,
    status: 'Pending',
  };

  quoteStore.addChangeRequest(quoteId, changeRequest);

  const updatedQuote = quoteStore.getQuote(quoteId)!;

  // Send notifications
  await emailService.sendChangeRequestNotification(updatedQuote, changeRequest);

  // Audit log
  auditLog.log(quoteId, 'CHANGE_REQUESTED', customerId, {
    comments: changeData.comments,
  });

  return updatedQuote;
}

/**
 * Convert approved quote to order
 * POST /api/customer/quotes/:id/convert
 */
export async function convertQuoteToOrder(
  quoteId: string,
  customerId: string
): Promise<{ quote: Quote; orderNumber: string }> {
  if (!quoteId) {
    throw new Error('quoteId is required');
  }

  if (!customerId) {
    throw new Error('customerId is required');
  }

  // Check ownership
  if (!quoteStore.isQuoteOwnedByCustomer(quoteId, customerId)) {
    throw new Error('Access denied: Quote does not belong to customer');
  }

  const quote = quoteStore.getQuote(quoteId);
  if (!quote) {
    throw new Error('Quote not found');
  }

  // Check if quote is approved
  if (quote.status !== QuoteStatus.APPROVED) {
    throw new Error('Only approved quotes can be converted to orders');
  }

  // Generate order number
  const orderNumber = `ORD-${Date.now()}`;

  // Update quote with conversion data
  const conversionMetadata = {
    orderNumber,
    convertedAt: new Date().toISOString(),
  };

  quoteStore.updateQuoteStatus(quoteId, QuoteStatus.CONVERTED, conversionMetadata);

  const updatedQuote = quoteStore.getQuote(quoteId)!;

  // Send notifications
  await emailService.sendQuoteConvertedNotification(updatedQuote);

  // Audit log
  auditLog.log(quoteId, 'CONVERTED', customerId, {
    orderNumber,
  });

  return {
    quote: updatedQuote,
    orderNumber,
  };
}
