/**
 * Quote Schema and Type Definitions
 * Defines the complete structure for customer quotes, approval, and conversion
 */

/**
 * Valid quote statuses
 */
export enum QuoteStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired',
  CONVERTED = 'Converted',
}

/**
 * Quote item in quote format
 */
export interface QuoteItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  colors: number;
  printLocations: string[];
  description: string;
  total: number;
}

/**
 * Change request for quote modifications
 */
export interface ChangeRequest {
  id: string;
  requestedAt: string;
  comments: string;
  status: 'Pending' | 'Reviewed';
}

/**
 * File attachment
 */
export interface QuoteFile {
  id: string;
  name: string;
  url: string;
  type: string;
}

/**
 * Complete Quote document
 */
export interface Quote {
  id: string;
  quoteNumber: string; // QTE-2025-001
  customerId: string;
  status: QuoteStatus;
  createdAt: string;
  expiresAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  convertedAt?: string;
  orderNumber?: string; // If converted

  lineItems: QuoteItem[];
  subtotal: number;
  setupFees: number;
  rushFee: number;
  tax: number;
  total: number;

  artworkFiles: QuoteFile[];
  proofFile?: QuoteFile;

  approvalSignature?: string; // Base64 image
  approvalName?: string;
  approvalEmail?: string;

  rejectionReason?: string;
  changeRequests: ChangeRequest[];

  notes?: string;
}

/**
 * Approval request payload
 */
export interface ApprovalRequest {
  signature: string; // Base64 image
  name: string;
  email: string;
  termsAccepted: boolean;
}

/**
 * Rejection request payload
 */
export interface RejectionRequest {
  reason?: string;
  comments?: string;
}

/**
 * Change request payload
 */
export interface ChangeRequestPayload {
  comments: string;
}

/**
 * Validation result object
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a Quote object
 *
 * @param quote - The quote object to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateQuote(quote: Partial<Quote>): ValidationResult {
  const errors: string[] = [];

  if (!quote.quoteNumber) {
    errors.push('quoteNumber is required');
  }

  if (!quote.customerId) {
    errors.push('customerId is required');
  }

  if (!quote.status) {
    errors.push('status is required');
  } else if (!Object.values(QuoteStatus).includes(quote.status as QuoteStatus)) {
    errors.push(`status must be one of: ${Object.values(QuoteStatus).join(', ')}`);
  }

  if (!quote.createdAt) {
    errors.push('createdAt is required');
  }

  if (!quote.expiresAt) {
    errors.push('expiresAt is required');
  }

  if (typeof quote.total !== 'number' || quote.total < 0) {
    errors.push('total must be a non-negative number');
  }

  if (!Array.isArray(quote.lineItems)) {
    errors.push('lineItems must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an approval request
 *
 * @param request - The approval request to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateApprovalRequest(request: Partial<ApprovalRequest>): ValidationResult {
  const errors: string[] = [];

  if (!request.signature || request.signature.trim().length === 0) {
    errors.push('signature is required and cannot be empty');
  }

  if (!request.name || request.name.trim().length === 0) {
    errors.push('name is required and cannot be empty');
  }

  if (!request.email || request.email.trim().length === 0) {
    errors.push('email is required and cannot be empty');
  } else if (!isValidEmail(request.email)) {
    errors.push('email is not a valid email format');
  }

  if (!request.termsAccepted) {
    errors.push('terms must be accepted');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates email format
 *
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Checks if a quote is expired
 *
 * @param quote - The quote to check
 * @returns true if expired, false otherwise
 */
export function isQuoteExpired(quote: Quote): boolean {
  const expiresAt = new Date(quote.expiresAt);
  const now = new Date();
  return now > expiresAt;
}

/**
 * Calculates days until quote expires
 *
 * @param quote - The quote to check
 * @returns number of days until expiration (negative if expired)
 */
export function daysUntilExpiration(quote: Quote): number {
  const expiresAt = new Date(quote.expiresAt);
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
