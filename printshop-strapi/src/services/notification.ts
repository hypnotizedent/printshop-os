/**
 * Notification Service
 * Handles email and WebSocket notifications
 */

import nodemailer from 'nodemailer';
import type { Core } from '@strapi/strapi';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

// Create email transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
}

// WebSocket instance (will be set from server initialization)
let io: any = null;

export function setWebSocketInstance(socketIo: any) {
  io = socketIo;
}

/**
 * Send email notification
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  strapi?: Core.Strapi
): Promise<boolean> {
  try {
    const transport = getTransporter();
    
    await transport.sendMail({
      from: process.env.SMTP_FROM || '"PrintShop OS" <noreply@printshop.com>',
      to,
      subject,
      html,
    });

    if (strapi) {
      strapi.log.info(`Email sent to ${to}: ${subject}`);
    }
    return true;
  } catch (error) {
    if (strapi) {
      strapi.log.error('Failed to send email:', error);
    }
    // Don't throw - notifications shouldn't block workflow
    return false;
  }
}

/**
 * Send WebSocket notification
 */
export async function sendWebSocketNotification(
  room: string,
  event: string,
  data: any,
  strapi?: Core.Strapi
): Promise<boolean> {
  try {
    if (!io) {
      if (strapi) {
        strapi.log.warn('WebSocket not initialized, skipping notification');
      }
      return false;
    }

    io.to(room).emit(event, data);

    if (strapi) {
      strapi.log.info(`WebSocket notification sent to room ${room}: ${event}`);
    }
    return true;
  } catch (error) {
    if (strapi) {
      strapi.log.error('Failed to send WebSocket notification:', error);
    }
    // Don't throw - notifications shouldn't block workflow
    return false;
  }
}

/**
 * HTML escape utility to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Send customer order confirmation email
 */
export async function sendOrderConfirmationEmail(
  customerEmail: string,
  orderNumber: string,
  orderDetails: any,
  strapi?: Core.Strapi
): Promise<boolean> {
  const html = `
    <h1>Order Confirmation - ${escapeHtml(orderNumber)}</h1>
    <p>Thank you for your order! Your order has been received and is being processed.</p>
    
    <h2>Order Details:</h2>
    <p><strong>Order Number:</strong> ${escapeHtml(orderNumber)}</p>
    <p><strong>Total Amount:</strong> $${escapeHtml(String(orderDetails.totalAmount))}</p>
    
    <h3>Items:</h3>
    <ul>
      ${orderDetails.items.map((item: any) => `
        <li>${escapeHtml(item.description)} - Quantity: ${escapeHtml(String(item.quantity))} - $${escapeHtml(String(item.price))}</li>
      `).join('')}
    </ul>
    
    <p>We'll notify you when your order moves to production.</p>
    
    <p>Best regards,<br>PrintShop OS Team</p>
  `;

  return await sendEmail(
    customerEmail,
    `Order Confirmation - ${orderNumber}`,
    html,
    strapi
  );
}

/**
 * Send production team notification email
 */
export async function sendProductionNotificationEmail(
  jobNumber: string,
  jobDetails: any,
  strapi?: Core.Strapi
): Promise<boolean> {
  const productionEmail = process.env.PRODUCTION_TEAM_EMAIL || 'production@printshop.com';
  
  const html = `
    <h1>New Production Job - ${escapeHtml(jobNumber)}</h1>
    <p>A new job is ready for production.</p>
    
    <h2>Job Details:</h2>
    <p><strong>Job Number:</strong> ${escapeHtml(jobNumber)}</p>
    <p><strong>Customer:</strong> ${escapeHtml(jobDetails.customerName)}</p>
    <p><strong>Due Date:</strong> ${escapeHtml(jobDetails.dueDate)}</p>
    <p><strong>Status:</strong> ${escapeHtml(jobDetails.status)}</p>
    
    <h3>Items:</h3>
    <ul>
      ${jobDetails.items.map((item: any) => `
        <li>${escapeHtml(item.description)} - Quantity: ${escapeHtml(String(item.quantity))}</li>
      `).join('')}
    </ul>
    
    ${jobDetails.productionNotes ? `<p><strong>Production Notes:</strong> ${escapeHtml(jobDetails.productionNotes)}</p>` : ''}
    
    <p>Please check the dashboard for full details.</p>
  `;

  return await sendEmail(
    productionEmail,
    `New Production Job - ${jobNumber}`,
    html,
    strapi
  );
}

/**
 * Notify production team via WebSocket and Email
 */
export async function notifyProductionTeam(
  jobNumber: string,
  jobDetails: any,
  strapi?: Core.Strapi
): Promise<void> {
  // Send WebSocket notification
  await sendWebSocketNotification(
    'production-team',
    'job:new',
    {
      jobNumber,
      ...jobDetails,
    },
    strapi
  );

  // Send email notification
  await sendProductionNotificationEmail(jobNumber, jobDetails, strapi);
}

/**
 * Send ticket created confirmation email
 */
export async function sendTicketCreatedEmail(
  customerEmail: string,
  ticketNumber: string,
  subject: string,
  strapi?: Core.Strapi
): Promise<boolean> {
  const html = `
    <h1>Support Ticket Created</h1>
    <p>Your support ticket has been successfully created. Our team will review it and respond as soon as possible.</p>
    
    <h2>Ticket Details:</h2>
    <p><strong>Ticket Number:</strong> ${escapeHtml(ticketNumber)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    
    <p>You can track the status of your ticket and view responses in your customer portal.</p>
    
    <p>Best regards,<br>PrintShop OS Support Team</p>
  `;

  return await sendEmail(
    customerEmail,
    `Support Ticket Created - ${ticketNumber}`,
    html,
    strapi
  );
}

/**
 * Send ticket response email
 */
export async function sendTicketResponseEmail(
  customerEmail: string,
  ticketNumber: string,
  subject: string,
  message: string,
  strapi?: Core.Strapi
): Promise<boolean> {
  const html = `
    <h1>New Response to Your Support Ticket</h1>
    <p>Our team has added a response to your support ticket.</p>
    
    <h2>Ticket Details:</h2>
    <p><strong>Ticket Number:</strong> ${escapeHtml(ticketNumber)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    
    <h3>Response:</h3>
    <p>${escapeHtml(message)}</p>
    
    <p>View the full conversation in your customer portal.</p>
    
    <p>Best regards,<br>PrintShop OS Support Team</p>
  `;

  return await sendEmail(
    customerEmail,
    `New Response - ${ticketNumber}`,
    html,
    strapi
  );
}

/**
 * Send ticket status change email
 */
export async function sendTicketStatusEmail(
  customerEmail: string,
  ticketNumber: string,
  subject: string,
  status: string,
  strapi?: Core.Strapi
): Promise<boolean> {
  const html = `
    <h1>Ticket Status Updated</h1>
    <p>The status of your support ticket has been updated.</p>
    
    <h2>Ticket Details:</h2>
    <p><strong>Ticket Number:</strong> ${escapeHtml(ticketNumber)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <p><strong>New Status:</strong> ${escapeHtml(status)}</p>
    
    <p>View the full details in your customer portal.</p>
    
    <p>Best regards,<br>PrintShop OS Support Team</p>
  `;

  return await sendEmail(
    customerEmail,
    `Ticket Status Updated - ${ticketNumber}`,
    html,
    strapi
  );
}

export default {
  sendEmail,
  sendWebSocketNotification,
  sendOrderConfirmationEmail,
  sendProductionNotificationEmail,
  notifyProductionTeam,
  sendTicketCreatedEmail,
  sendTicketResponseEmail,
  sendTicketStatusEmail,
  setWebSocketInstance,
};
