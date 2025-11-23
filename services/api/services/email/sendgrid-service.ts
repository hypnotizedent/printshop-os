/**
 * SendGrid Email Service
 * Handles email sending, tracking, and delivery management
 */

import sgMail from '@sendgrid/mail';
import { generateQuoteApprovalToken, verifyQuoteApprovalToken } from '../../utils/jwt-utils';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface QuoteEmailData {
  quoteId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  validUntil?: Date;
  companyName?: string;
  companyLogo?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface EmailDeliveryStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked';
  timestamp: Date;
  recipient: string;
  error?: string;
}

export class SendGridService {
  private static instance: SendGridService;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): SendGridService {
    if (!SendGridService.instance) {
      SendGridService.instance = new SendGridService();
    }
    return SendGridService.instance;
  }

  /**
   * Initialize SendGrid with API key
   */
  public initialize(apiKey?: string): void {
    const key = apiKey || process.env.SENDGRID_API_KEY;
    
    if (!key) {
      throw new Error('SendGrid API key is required. Set SENDGRID_API_KEY environment variable.');
    }

    sgMail.setApiKey(key);
    this.initialized = true;
  }

  /**
   * Verify that SendGrid is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }

  /**
   * Send quote email to customer with approval/rejection links
   */
  public async sendQuoteEmail(data: QuoteEmailData): Promise<string> {
    this.ensureInitialized();

    // Generate JWT token for approval link (7-day expiration)
    const approvalToken = generateQuoteApprovalToken(data.quoteId, 7);
    
    // Build approval and rejection URLs
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const approvalUrl = `${baseUrl}/quote/approve/${approvalToken}`;
    const rejectUrl = `${baseUrl}/quote/reject/${approvalToken}`;

    // Generate email HTML from template
    const emailHtml = this.generateQuoteEmailHtml(data, approvalUrl, rejectUrl);
    const emailText = this.generateQuoteEmailText(data, approvalUrl, rejectUrl);

    const msg = {
      to: {
        email: data.customerEmail,
        name: data.customerName,
      },
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'quotes@printshop.com',
        name: process.env.SENDGRID_FROM_NAME || 'PrintShop',
      },
      subject: `Your PrintShop Quote for ${data.customerName}`,
      text: emailText,
      html: emailHtml,
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: false,
        },
        openTracking: {
          enable: true,
        },
      },
      customArgs: {
        quoteId: data.quoteId,
        type: 'quote_delivery',
      },
    };

    try {
      const response = await sgMail.send(msg);
      const messageId = response[0].headers['x-message-id'] as string;
      
      return messageId;
    } catch (error: any) {
      console.error('SendGrid error:', error);
      throw new Error(`Failed to send quote email: ${error.message}`);
    }
  }

  /**
   * Send reminder email for pending quotes (5+ days)
   */
  public async sendQuoteReminder(data: QuoteEmailData): Promise<string> {
    this.ensureInitialized();

    const approvalToken = generateQuoteApprovalToken(data.quoteId, 7);
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const approvalUrl = `${baseUrl}/quote/approve/${approvalToken}`;
    const rejectUrl = `${baseUrl}/quote/reject/${approvalToken}`;

    const emailHtml = this.generateReminderEmailHtml(data, approvalUrl, rejectUrl);
    const emailText = this.generateReminderEmailText(data, approvalUrl, rejectUrl);

    const msg = {
      to: {
        email: data.customerEmail,
        name: data.customerName,
      },
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'quotes@printshop.com',
        name: process.env.SENDGRID_FROM_NAME || 'PrintShop',
      },
      subject: `Reminder: Your PrintShop Quote is Waiting`,
      text: emailText,
      html: emailHtml,
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: false,
        },
        openTracking: {
          enable: true,
        },
      },
      customArgs: {
        quoteId: data.quoteId,
        type: 'quote_reminder',
      },
    };

    try {
      const response = await sgMail.send(msg);
      const messageId = response[0].headers['x-message-id'] as string;
      
      return messageId;
    } catch (error: any) {
      console.error('SendGrid error:', error);
      throw new Error(`Failed to send reminder email: ${error.message}`);
    }
  }

  /**
   * Generate HTML email for quote
   */
  private generateQuoteEmailHtml(
    data: QuoteEmailData,
    approvalUrl: string,
    rejectUrl: string
  ): string {
    const companyName = data.companyName || 'PrintShop';
    const unsubscribeUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/unsubscribe`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px; background-color: #f8f9fa; }
    .logo { max-width: 200px; }
    .content { padding: 20px; background-color: #ffffff; }
    .quote-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .quote-table th, .quote-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    .quote-table th { background-color: #f8f9fa; font-weight: bold; }
    .total-row { font-weight: bold; font-size: 1.1em; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 12px 30px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .button-approve { background-color: #28a745; color: #ffffff; }
    .button-reject { background-color: #dc3545; color: #ffffff; }
    .footer { padding: 20px; text-align: center; font-size: 0.9em; color: #666; background-color: #f8f9fa; }
    .footer a { color: #007bff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${data.companyLogo ? `<img src="${data.companyLogo}" alt="${companyName}" class="logo">` : `<h1>${companyName}</h1>`}
    </div>
    
    <div class="content">
      <h2>Hello ${data.customerName},</h2>
      
      <p>Thank you for your interest in our services. We're pleased to provide you with the following quote:</p>
      
      <table class="quote-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>$${item.unitPrice.toFixed(2)}</td>
              <td>$${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
            <td><strong>$${data.subtotal.toFixed(2)}</strong></td>
          </tr>
          ${data.tax ? `
            <tr>
              <td colspan="3" style="text-align: right;">Tax:</td>
              <td>$${data.tax.toFixed(2)}</td>
            </tr>
          ` : ''}
          <tr class="total-row">
            <td colspan="3" style="text-align: right;">Total:</td>
            <td>$${data.total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      ${data.validUntil ? `<p><em>This quote is valid until ${data.validUntil.toLocaleDateString()}</em></p>` : ''}
      
      <p>Please review the quote and let us know your decision:</p>
      
      <div class="button-container">
        <a href="${approvalUrl}" class="button button-approve">Approve Quote</a>
        <a href="${rejectUrl}" class="button button-reject">Decline Quote</a>
      </div>
      
      <p>If you have any questions or need modifications, please don't hesitate to contact us.</p>
    </div>
    
    <div class="footer">
      ${data.contactInfo?.email ? `<p>Email: <a href="mailto:${data.contactInfo.email}">${data.contactInfo.email}</a></p>` : ''}
      ${data.contactInfo?.phone ? `<p>Phone: ${data.contactInfo.phone}</p>` : ''}
      ${data.contactInfo?.website ? `<p>Website: <a href="${data.contactInfo.website}">${data.contactInfo.website}</a></p>` : ''}
      <p style="margin-top: 20px; font-size: 0.8em;">
        <a href="${unsubscribeUrl}">Unsubscribe</a> from quote emails
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for quote
   */
  private generateQuoteEmailText(
    data: QuoteEmailData,
    approvalUrl: string,
    rejectUrl: string
  ): string {
    const companyName = data.companyName || 'PrintShop';
    
    let text = `${companyName}\n\n`;
    text += `Hello ${data.customerName},\n\n`;
    text += `Thank you for your interest in our services. We're pleased to provide you with the following quote:\n\n`;
    
    text += `QUOTE DETAILS\n`;
    text += `${'='.repeat(60)}\n\n`;
    
    data.items.forEach(item => {
      text += `${item.description}\n`;
      text += `  Quantity: ${item.quantity}\n`;
      text += `  Unit Price: $${item.unitPrice.toFixed(2)}\n`;
      text += `  Total: $${item.total.toFixed(2)}\n\n`;
    });
    
    text += `${'-'.repeat(60)}\n`;
    text += `Subtotal: $${data.subtotal.toFixed(2)}\n`;
    if (data.tax) {
      text += `Tax: $${data.tax.toFixed(2)}\n`;
    }
    text += `TOTAL: $${data.total.toFixed(2)}\n`;
    text += `${'='.repeat(60)}\n\n`;
    
    if (data.validUntil) {
      text += `This quote is valid until ${data.validUntil.toLocaleDateString()}\n\n`;
    }
    
    text += `APPROVE QUOTE:\n${approvalUrl}\n\n`;
    text += `DECLINE QUOTE:\n${rejectUrl}\n\n`;
    
    text += `If you have any questions or need modifications, please don't hesitate to contact us.\n\n`;
    
    if (data.contactInfo?.email) text += `Email: ${data.contactInfo.email}\n`;
    if (data.contactInfo?.phone) text += `Phone: ${data.contactInfo.phone}\n`;
    if (data.contactInfo?.website) text += `Website: ${data.contactInfo.website}\n`;
    
    return text;
  }

  /**
   * Generate reminder email HTML
   */
  private generateReminderEmailHtml(
    data: QuoteEmailData,
    approvalUrl: string,
    rejectUrl: string
  ): string {
    const unsubscribeUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/unsubscribe`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px; background-color: #fff3cd; }
    .content { padding: 20px; background-color: #ffffff; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 12px 30px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .button-approve { background-color: #28a745; color: #ffffff; }
    .button-reject { background-color: #dc3545; color: #ffffff; }
    .footer { padding: 20px; text-align: center; font-size: 0.9em; color: #666; background-color: #f8f9fa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Quote Reminder</h1>
    </div>
    
    <div class="content">
      <h2>Hello ${data.customerName},</h2>
      
      <p>We wanted to follow up on the quote we sent you. Your quote for <strong>$${data.total.toFixed(2)}</strong> is still available and waiting for your decision.</p>
      
      <p>Please take a moment to review and respond:</p>
      
      <div class="button-container">
        <a href="${approvalUrl}" class="button button-approve">Approve Quote</a>
        <a href="${rejectUrl}" class="button button-reject">Decline Quote</a>
      </div>
      
      <p>If you have any questions or need to discuss the quote further, we're here to help!</p>
    </div>
    
    <div class="footer">
      ${data.contactInfo?.email ? `<p>Email: <a href="mailto:${data.contactInfo.email}">${data.contactInfo.email}</a></p>` : ''}
      <p style="margin-top: 20px; font-size: 0.8em;">
        <a href="${unsubscribeUrl}">Unsubscribe</a> from quote emails
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate reminder email plain text
   */
  private generateReminderEmailText(
    data: QuoteEmailData,
    approvalUrl: string,
    rejectUrl: string
  ): string {
    let text = `QUOTE REMINDER\n\n`;
    text += `Hello ${data.customerName},\n\n`;
    text += `We wanted to follow up on the quote we sent you. Your quote for $${data.total.toFixed(2)} is still available and waiting for your decision.\n\n`;
    text += `APPROVE QUOTE:\n${approvalUrl}\n\n`;
    text += `DECLINE QUOTE:\n${rejectUrl}\n\n`;
    text += `If you have any questions or need to discuss the quote further, we're here to help!\n\n`;
    
    if (data.contactInfo?.email) text += `Email: ${data.contactInfo.email}\n`;
    
    return text;
  }

  /**
   * Verify approval token and extract quote ID
   */
  public verifyApprovalToken(token: string): { quoteId: string; exp: number } | null {
    return verifyQuoteApprovalToken(token);
  }
}

export default SendGridService.getInstance();
