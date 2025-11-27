/**
 * SendGrid Email Service
 * Handles transactional emails for PrintShop OS
 */

import sgMail, { MailDataRequired } from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Default sender
const DEFAULT_FROM = {
  email: process.env.SENDGRID_FROM_EMAIL || 'orders@printshop.com',
  name: process.env.SENDGRID_FROM_NAME || 'PrintShop OS',
};

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailParams {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: Array<{
    content: string; // Base64 encoded
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
  }>;
  categories?: string[];
  replyTo?: EmailRecipient;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a single email
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  try {
    const msg: MailDataRequired = {
      to: params.to,
      from: DEFAULT_FROM,
      subject: params.subject,
      text: params.text,
      html: params.html,
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicTemplateData,
      attachments: params.attachments,
      categories: params.categories,
      replyTo: params.replyTo,
    };

    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers['x-message-id'],
    };
  } catch (error: any) {
    console.error('SendGrid error:', error);
    return {
      success: false,
      error: error.message || 'Email send failed',
    };
  }
}

/**
 * Send quote to customer
 */
export async function sendQuoteEmail(params: {
  customerEmail: string;
  customerName: string;
  quoteNumber: string;
  quoteTotal: number;
  depositAmount: number;
  expiresAt: string;
  approvalUrl: string;
  lineItems: Array<{ name: string; quantity: number; price: number }>;
  notes?: string;
}): Promise<EmailResult> {
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(params.quoteTotal);

  const formattedDeposit = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(params.depositAmount);

  const lineItemsHtml = params.lineItems
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Your Quote is Ready!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hi ${params.customerName},</p>
        
        <p>Thank you for your interest! Here's your quote <strong>#${params.quoteNumber}</strong>:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
          <tfoot>
            <tr style="font-weight: bold; background: #f0f0f0;">
              <td colspan="2" style="padding: 10px;">Total</td>
              <td style="padding: 10px; text-align: right;">${formattedTotal}</td>
            </tr>
          </tfoot>
        </table>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Deposit Required:</strong> ${formattedDeposit} (50%)</p>
          <p style="margin: 5px 0 0 0;"><strong>Quote Valid Until:</strong> ${new Date(params.expiresAt).toLocaleDateString()}</p>
        </div>
        
        ${params.notes ? `<p><strong>Notes:</strong> ${params.notes}</p>` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.approvalUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Review & Approve Quote
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Click the button above to review your quote details and approve it. 
          Once approved, you'll be able to make the deposit payment.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px;">
          Questions? Reply to this email or call us at (555) 123-4567
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: { email: params.customerEmail, name: params.customerName },
    subject: `Quote #${params.quoteNumber} - ${formattedTotal}`,
    html,
    categories: ['quote', 'transactional'],
  });
}

/**
 * Send order confirmation
 */
export async function sendOrderConfirmationEmail(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderTotal: number;
  amountPaid: number;
  estimatedDelivery?: string;
  trackingUrl: string;
}): Promise<EmailResult> {
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(params.orderTotal);

  const formattedPaid = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(params.amountPaid);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✓ Order Confirmed!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hi ${params.customerName},</p>
        
        <p>Great news! Your order <strong>#${params.orderNumber}</strong> has been confirmed and is now in production.</p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p style="margin: 0;"><strong>Order Total:</strong> ${formattedTotal}</p>
          <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ${formattedPaid}</p>
          ${params.estimatedDelivery ? `<p style="margin: 5px 0 0 0;"><strong>Estimated Delivery:</strong> ${params.estimatedDelivery}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.trackingUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Track Your Order
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          You can track your order status anytime using the button above.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: { email: params.customerEmail, name: params.customerName },
    subject: `Order Confirmed! #${params.orderNumber}`,
    html,
    categories: ['order-confirmation', 'transactional'],
  });
}

/**
 * Send order status update
 */
export async function sendOrderStatusEmail(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  status: string;
  statusMessage: string;
  trackingUrl: string;
}): Promise<EmailResult> {
  const statusColors: Record<string, string> = {
    IN_PRODUCTION: '#ffc107',
    COMPLETE: '#28a745',
    READY_FOR_PICKUP: '#17a2b8',
    SHIPPED: '#6f42c1',
  };

  const statusColor = statusColors[params.status] || '#667eea';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${statusColor}; padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Order Update</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Order #${params.orderNumber}</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hi ${params.customerName},</p>
        
        <p>${params.statusMessage}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.trackingUrl}" 
             style="display: inline-block; background: ${statusColor}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Order Status
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: { email: params.customerEmail, name: params.customerName },
    subject: `Order #${params.orderNumber} - ${params.status.replace(/_/g, ' ')}`,
    html,
    categories: ['order-status', 'transactional'],
  });
}

/**
 * Send payment receipt
 */
export async function sendPaymentReceiptEmail(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  paymentType: 'deposit' | 'balance' | 'full';
  receiptUrl?: string;
}): Promise<EmailResult> {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(params.amount);

  const paymentTypeText = {
    deposit: 'Deposit Payment',
    balance: 'Balance Payment',
    full: 'Full Payment',
  }[params.paymentType];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">💳 Payment Received</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hi ${params.customerName},</p>
        
        <p>We've received your payment. Thank you!</p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 5px 0; color: #666;">Order</td>
              <td style="padding: 5px 0; text-align: right; font-weight: bold;">#${params.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Payment Type</td>
              <td style="padding: 5px 0; text-align: right;">${paymentTypeText}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Amount</td>
              <td style="padding: 5px 0; text-align: right; font-weight: bold; color: #28a745; font-size: 1.2em;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Date</td>
              <td style="padding: 5px 0; text-align: right;">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
        </div>
        
        ${params.receiptUrl ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${params.receiptUrl}" style="color: #667eea; text-decoration: none;">
            Download Receipt →
          </a>
        </div>
        ` : ''}
        
        <p style="color: #666; font-size: 14px;">
          This is your payment confirmation. Keep this email for your records.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: { email: params.customerEmail, name: params.customerName },
    subject: `Payment Receipt - Order #${params.orderNumber}`,
    html,
    categories: ['payment-receipt', 'transactional'],
  });
}

export default {
  sendEmail,
  sendQuoteEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendPaymentReceiptEmail,
};
