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
 * Send customer order confirmation email
 */
export async function sendOrderConfirmationEmail(
  customerEmail: string,
  orderNumber: string,
  orderDetails: any,
  strapi?: Core.Strapi
): Promise<boolean> {
  const html = `
    <h1>Order Confirmation - ${orderNumber}</h1>
    <p>Thank you for your order! Your order has been received and is being processed.</p>
    
    <h2>Order Details:</h2>
    <p><strong>Order Number:</strong> ${orderNumber}</p>
    <p><strong>Total Amount:</strong> $${orderDetails.totalAmount}</p>
    
    <h3>Items:</h3>
    <ul>
      ${orderDetails.items.map((item: any) => `
        <li>${item.description} - Quantity: ${item.quantity} - $${item.price}</li>
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
    <h1>New Production Job - ${jobNumber}</h1>
    <p>A new job is ready for production.</p>
    
    <h2>Job Details:</h2>
    <p><strong>Job Number:</strong> ${jobNumber}</p>
    <p><strong>Customer:</strong> ${jobDetails.customerName}</p>
    <p><strong>Due Date:</strong> ${jobDetails.dueDate}</p>
    <p><strong>Status:</strong> ${jobDetails.status}</p>
    
    <h3>Items:</h3>
    <ul>
      ${jobDetails.items.map((item: any) => `
        <li>${item.description} - Quantity: ${item.quantity}</li>
      `).join('')}
    </ul>
    
    ${jobDetails.productionNotes ? `<p><strong>Production Notes:</strong> ${jobDetails.productionNotes}</p>` : ''}
    
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

export default {
  sendEmail,
  sendWebSocketNotification,
  sendOrderConfirmationEmail,
  sendProductionNotificationEmail,
  notifyProductionTeam,
  setWebSocketInstance,
};
