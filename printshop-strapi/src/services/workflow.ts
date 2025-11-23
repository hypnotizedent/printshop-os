/**
 * Workflow Service
 * Handles Quote → Order → Job workflow automation
 */

import type { Core } from '@strapi/strapi';
import { createAuditLog } from './audit';
import {
  sendOrderConfirmationEmail,
  notifyProductionTeam,
} from './notification';

/**
 * Generate order number
 */
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}-${random}`;
}

/**
 * Generate job number
 */
function generateJobNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `JOB-${year}${month}-${random}`;
}

/**
 * Process quote approval - creates order and job
 */
export async function processQuoteApproval(
  strapi: Core.Strapi,
  quoteId: number
): Promise<{ order: any; job: any }> {
  try {
    // 1. Get the quote
    const quote = await strapi.documents('api::quote.quote').findOne({
      documentId: quoteId.toString(),
      populate: ['customer'],
    });

    if (!quote) {
      throw new Error(`Quote ${quoteId} not found`);
    }

    if (quote.status === 'OrderCreated') {
      throw new Error(`Quote ${quoteId} already has an order created`);
    }

    // 2. Create the order
    const order = await createOrderFromQuote(strapi, quote);

    // 3. Create the production job
    const job = await createJobFromOrder(strapi, order, quote);

    // 4. Update quote status
    await strapi.documents('api::quote.quote').update({
      documentId: quote.documentId,
      data: {
        status: 'OrderCreated',
        approved_at: new Date().toISOString(),
      },
    });

    // 5. Create audit log for quote
    await createAuditLog(strapi, {
      entityType: 'quote',
      entityId: quoteId,
      event: 'quote.approved',
      oldStatus: quote.status,
      newStatus: 'OrderCreated',
      metadata: {
        orderId: order.id,
        jobId: job.id,
      },
    });

    // 6. Send notifications
    await sendNotifications(strapi, quote, order, job);

    strapi.log.info(
      `Quote ${quote.quoteNumber} → Order ${order.orderNumber} → Job ${job.jobNumber} workflow completed`
    );

    return { order, job };
  } catch (error) {
    strapi.log.error('Failed to process quote approval:', error);
    throw error;
  }
}

/**
 * Create order from approved quote
 */
export async function createOrderFromQuote(
  strapi: Core.Strapi,
  quote: any
): Promise<any> {
  try {
    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    const order = await strapi.documents('api::order.order').create({
      data: {
        orderNumber,
        status: 'Pending',
        quote: quote.documentId,
        customer: quote.customer?.documentId,
        items: quote.items,
        totalAmount: quote.totalAmount,
        customerInfo: {
          name: quote.customer?.name,
          email: quote.customer?.email,
        },
        notes: quote.notes,
        created_at_timestamp: now,
      },
    });

    // Create audit log
    await createAuditLog(strapi, {
      entityType: 'order',
      entityId: order.id,
      event: 'order.created',
      newStatus: 'Pending',
      metadata: {
        quoteId: quote.id,
        orderNumber,
      },
    });

    strapi.log.info(`Order created: ${orderNumber} from quote ${quote.quoteNumber}`);
    return order;
  } catch (error) {
    strapi.log.error('Failed to create order from quote:', error);
    throw error;
  }
}

/**
 * Create production job from order
 */
export async function createJobFromOrder(
  strapi: Core.Strapi,
  order: any,
  quote: any
): Promise<any> {
  try {
    const jobNumber = generateJobNumber();
    const now = new Date().toISOString();

    // Calculate due date (default 7 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const job = await strapi.documents('api::job.job').create({
      data: {
        jobNumber,
        title: `Job for Order ${order.orderNumber}`,
        status: 'PendingArtwork',
        customer: order.customer,
        order: order.documentId,
        quote: quote.documentId,
        dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD format
        totalAmount: order.totalAmount,
        productionNotes: order.notes,
        created_at_timestamp: now,
      },
    });

    // Create audit log
    await createAuditLog(strapi, {
      entityType: 'job',
      entityId: job.id,
      event: 'job.created',
      newStatus: 'PendingArtwork',
      metadata: {
        orderId: order.id,
        quoteId: quote.id,
        jobNumber,
      },
    });

    strapi.log.info(`Job created: ${jobNumber} from order ${order.orderNumber}`);
    return job;
  } catch (error) {
    strapi.log.error('Failed to create job from order:', error);
    throw error;
  }
}

/**
 * Send all notifications for the workflow
 */
async function sendNotifications(
  strapi: Core.Strapi,
  quote: any,
  order: any,
  job: any
): Promise<void> {
  try {
    // Send customer confirmation email
    if (quote.customer?.email) {
      await sendOrderConfirmationEmail(
        quote.customer.email,
        order.orderNumber,
        {
          totalAmount: order.totalAmount,
          items: order.items || [],
        },
        strapi
      );
    }

    // Notify production team
    await notifyProductionTeam(
      job.jobNumber,
      {
        customerName: quote.customer?.name || 'Unknown',
        dueDate: job.dueDate,
        status: job.status,
        items: order.items || [],
        productionNotes: job.productionNotes,
      },
      strapi
    );
  } catch (error) {
    // Log but don't throw - notifications shouldn't block workflow
    strapi.log.error('Failed to send notifications:', error);
  }
}

/**
 * Get workflow status for a quote
 */
export async function getWorkflowStatus(
  strapi: Core.Strapi,
  quoteId: number
): Promise<any> {
  try {
    const quote = await strapi.documents('api::quote.quote').findOne({
      documentId: quoteId.toString(),
      populate: ['order_id', 'order_id.job'],
    });

    if (!quote) {
      throw new Error(`Quote ${quoteId} not found`);
    }

    const status = {
      quote: {
        id: quote.id,
        number: quote.quoteNumber,
        status: quote.status,
        approved_at: quote.approved_at,
      },
      order: quote.order_id
        ? {
            id: quote.order_id.id,
            number: quote.order_id.orderNumber,
            status: quote.order_id.status,
            created_at: quote.order_id.created_at_timestamp,
          }
        : null,
      job: quote.order_id?.job
        ? {
            id: quote.order_id.job.id,
            number: quote.order_id.job.jobNumber,
            status: quote.order_id.job.status,
            created_at: quote.order_id.job.created_at_timestamp,
          }
        : null,
    };

    return status;
  } catch (error) {
    strapi.log.error('Failed to get workflow status:', error);
    throw error;
  }
}

export default {
  processQuoteApproval,
  createOrderFromQuote,
  createJobFromOrder,
  getWorkflowStatus,
};
