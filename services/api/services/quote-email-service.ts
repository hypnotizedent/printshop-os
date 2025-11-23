/**
 * Quote Email Service
 * Integrates Strapi quote data with SendGrid email delivery
 */

import SendGridService, { QuoteEmailData } from './email/sendgrid-service';

interface QuoteData {
  id: number;
  quoteNumber: string;
  status: string;
  items: any[];
  subtotal: number;
  tax?: number;
  total: number;
  validUntil?: string;
  notes?: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class QuoteEmailService {
  private sendGridService: typeof SendGridService;

  constructor() {
    this.sendGridService = SendGridService;
  }

  /**
   * Initialize the email service
   */
  public initialize(apiKey?: string): void {
    this.sendGridService.initialize(apiKey);
  }

  /**
   * Send quote email to customer
   */
  public async sendQuote(quote: QuoteData): Promise<EmailResult> {
    try {
      if (!quote.customer?.email) {
        return {
          success: false,
          error: 'Customer email is required',
        };
      }

      const emailData: QuoteEmailData = {
        quoteId: quote.id.toString(),
        customerName: quote.customer.name,
        customerEmail: quote.customer.email,
        items: this.formatQuoteItems(quote.items),
        subtotal: parseFloat(quote.subtotal.toString()),
        tax: quote.tax ? parseFloat(quote.tax.toString()) : undefined,
        total: parseFloat(quote.total.toString()),
        validUntil: quote.validUntil ? new Date(quote.validUntil) : undefined,
      };

      const messageId = await this.sendGridService.sendQuoteEmail(emailData);

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      console.error('Error sending quote email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send quote email',
      };
    }
  }

  /**
   * Send reminder email for pending quote
   */
  public async sendReminder(quote: QuoteData): Promise<EmailResult> {
    try {
      if (!quote.customer?.email) {
        return {
          success: false,
          error: 'Customer email is required',
        };
      }

      const emailData: QuoteEmailData = {
        quoteId: quote.id.toString(),
        customerName: quote.customer.name,
        customerEmail: quote.customer.email,
        items: this.formatQuoteItems(quote.items),
        subtotal: parseFloat(quote.subtotal.toString()),
        tax: quote.tax ? parseFloat(quote.tax.toString()) : undefined,
        total: parseFloat(quote.total.toString()),
        validUntil: quote.validUntil ? new Date(quote.validUntil) : undefined,
      };

      const messageId = await this.sendGridService.sendQuoteReminder(emailData);

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      console.error('Error sending reminder email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send reminder email',
      };
    }
  }

  /**
   * Format quote items for email display
   */
  private formatQuoteItems(items: Array<Record<string, any>>): Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }> {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map(item => ({
      description: item.description || item.name || 'Item',
      quantity: parseInt(item.quantity || '1'),
      unitPrice: parseFloat(item.unitPrice || item.price || '0'),
      total: parseFloat(item.total || '0'),
    }));
  }

  /**
   * Verify approval token
   */
  public verifyApprovalToken(token: string): { quoteId: string; exp: number } | null {
    return this.sendGridService.verifyApprovalToken(token);
  }
}

// Export singleton instance
export default new QuoteEmailService();
