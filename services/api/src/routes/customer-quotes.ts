/**
 * Customer Quotes Routes
 * Handles quote listing, details, and history for customer portal
 */

import {
  Quote,
  QuoteStatus,
  validateQuote,
  isQuoteExpired,
} from '../../lib/quote-schema';

/**
 * Mock data store for quotes (to be replaced with Strapi integration)
 */
class QuoteStore {
  private quotes: Map<string, Quote> = new Map();

  /**
   * Get all quotes for a customer
   */
  getQuotesByCustomer(customerId: string, status?: QuoteStatus): Quote[] {
    const quotes = Array.from(this.quotes.values()).filter(
      (q) => q.customerId === customerId
    );

    if (status) {
      return quotes.filter((q) => q.status === status);
    }

    return quotes;
  }

  /**
   * Get a specific quote by ID
   */
  getQuote(quoteId: string): Quote | null {
    return this.quotes.get(quoteId) || null;
  }

  /**
   * Save a quote
   */
  saveQuote(quote: Quote): boolean {
    const validation = validateQuote(quote);
    if (!validation.isValid) {
      throw new Error(`Invalid quote: ${validation.errors.join(', ')}`);
    }
    this.quotes.set(quote.id, quote);
    return true;
  }

  /**
   * Update quote status
   */
  updateQuoteStatus(quoteId: string, status: QuoteStatus, metadata?: any): boolean {
    const quote = this.quotes.get(quoteId);
    if (!quote) {
      return false;
    }

    quote.status = status;

    if (metadata) {
      Object.assign(quote, metadata);
    }

    this.quotes.set(quoteId, quote);
    return true;
  }

  /**
   * Check if customer owns quote
   */
  isQuoteOwnedByCustomer(quoteId: string, customerId: string): boolean {
    const quote = this.quotes.get(quoteId);
    return quote?.customerId === customerId;
  }

  /**
   * Add change request to quote
   */
  addChangeRequest(quoteId: string, changeRequest: any): boolean {
    const quote = this.quotes.get(quoteId);
    if (!quote) {
      return false;
    }

    quote.changeRequests.push(changeRequest);
    this.quotes.set(quoteId, quote);
    return true;
  }

  /**
   * Clear all quotes (for testing)
   */
  clear(): void {
    this.quotes.clear();
  }

  /**
   * Seed with sample data (for testing)
   */
  seed(quotes: Quote[]): void {
    for (const quote of quotes) {
      this.quotes.set(quote.id, quote);
    }
  }
}

// Singleton instance
export const quoteStore = new QuoteStore();

/**
 * List quotes for customer
 * GET /api/customer/quotes
 */
export async function listCustomerQuotes(
  customerId: string,
  status?: QuoteStatus
): Promise<{ quotes: Quote[]; total: number }> {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  let quotes = quoteStore.getQuotesByCustomer(customerId, status);

  // Update expired quotes
  quotes = quotes.map((quote) => {
    if (quote.status === QuoteStatus.PENDING && isQuoteExpired(quote)) {
      quoteStore.updateQuoteStatus(quote.id, QuoteStatus.EXPIRED);
      return { ...quote, status: QuoteStatus.EXPIRED };
    }
    return quote;
  });

  // Sort by creation date, newest first
  quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    quotes,
    total: quotes.length,
  };
}

/**
 * Get quote details
 * GET /api/customer/quotes/:id
 */
export async function getQuoteDetail(
  quoteId: string,
  customerId: string
): Promise<Quote> {
  if (!quoteId) {
    throw new Error('quoteId is required');
  }

  if (!customerId) {
    throw new Error('customerId is required');
  }

  const quote = quoteStore.getQuote(quoteId);
  if (!quote) {
    throw new Error('Quote not found');
  }

  // Check ownership
  if (!quoteStore.isQuoteOwnedByCustomer(quoteId, customerId)) {
    throw new Error('Access denied: Quote does not belong to customer');
  }

  // Update if expired
  if (quote.status === QuoteStatus.PENDING && isQuoteExpired(quote)) {
    quoteStore.updateQuoteStatus(quoteId, QuoteStatus.EXPIRED);
    quote.status = QuoteStatus.EXPIRED;
  }

  return quote;
}

/**
 * Get quote history (past quotes)
 * GET /api/customer/quotes/history
 */
export async function getQuoteHistory(
  customerId: string,
  limit: number = 10
): Promise<{ quotes: Quote[]; total: number }> {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  const allQuotes = quoteStore.getQuotesByCustomer(customerId);

  // Filter to completed statuses only
  const historyQuotes = allQuotes.filter(
    (q) =>
      q.status === QuoteStatus.APPROVED ||
      q.status === QuoteStatus.REJECTED ||
      q.status === QuoteStatus.EXPIRED ||
      q.status === QuoteStatus.CONVERTED
  );

  // Sort by date, newest first
  historyQuotes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Apply limit
  const limitedQuotes = historyQuotes.slice(0, limit);

  return {
    quotes: limitedQuotes,
    total: historyQuotes.length,
  };
}

/**
 * Generate PDF for quote
 * GET /api/customer/quotes/:id/pdf
 */
export async function generateQuotePDF(
  quoteId: string,
  customerId: string
): Promise<{ url: string; filename: string }> {
  if (!quoteId) {
    throw new Error('quoteId is required');
  }

  if (!customerId) {
    throw new Error('customerId is required');
  }

  const quote = quoteStore.getQuote(quoteId);
  if (!quote) {
    throw new Error('Quote not found');
  }

  // Check ownership
  if (!quoteStore.isQuoteOwnedByCustomer(quoteId, customerId)) {
    throw new Error('Access denied: Quote does not belong to customer');
  }

  // Mock PDF generation (to be replaced with actual PDF generation)
  const filename = `${quote.quoteNumber}.pdf`;
  const url = `/api/customer/quotes/${quoteId}/pdf/download`;

  return {
    url,
    filename,
  };
}

/**
 * Get quote statistics for customer
 */
export async function getQuoteStatistics(customerId: string): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  converted: number;
  total: number;
}> {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  const allQuotes = quoteStore.getQuotesByCustomer(customerId);

  const stats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    converted: 0,
    total: allQuotes.length,
  };

  for (const quote of allQuotes) {
    switch (quote.status) {
      case QuoteStatus.PENDING:
        stats.pending++;
        break;
      case QuoteStatus.APPROVED:
        stats.approved++;
        break;
      case QuoteStatus.REJECTED:
        stats.rejected++;
        break;
      case QuoteStatus.EXPIRED:
        stats.expired++;
        break;
      case QuoteStatus.CONVERTED:
        stats.converted++;
        break;
    }
  }

  return stats;
}
