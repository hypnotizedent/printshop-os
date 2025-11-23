/**
 * Queue Processor
 * Processes Bull queue jobs for workflow automation
 */

import type { Job } from 'bull';
import type { Core } from '@strapi/strapi';
import workflowQueue, {
  WorkflowJobType,
  QuoteApprovedJobData,
  CreateOrderJobData,
  CreateJobJobData,
  SendNotificationJobData,
} from './queue';
import { processQuoteApproval, createOrderFromQuote, createJobFromOrder } from './workflow';
import { sendEmail, sendWebSocketNotification } from './notification';

/**
 * Initialize queue processor
 */
export function initializeQueueProcessor(strapi: Core.Strapi) {
  // Process workflow jobs
  workflowQueue.process(async (job: Job) => {
    strapi.log.info(`Processing job ${job.id}: ${job.name}`);

    try {
      switch (job.name) {
        case WorkflowJobType.QUOTE_APPROVED:
          return await handleQuoteApproved(strapi, job.data as QuoteApprovedJobData);

        case WorkflowJobType.CREATE_ORDER:
          return await handleCreateOrder(strapi, job.data as CreateOrderJobData);

        case WorkflowJobType.CREATE_JOB:
          return await handleCreateJob(strapi, job.data as CreateJobJobData);

        case WorkflowJobType.SEND_NOTIFICATION:
          return await handleSendNotification(strapi, job.data as SendNotificationJobData);

        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      strapi.log.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  });

  // Event handlers
  workflowQueue.on('completed', (job: Job, result: any) => {
    strapi.log.info(`Job ${job.id} completed:`, result);
  });

  workflowQueue.on('failed', (job: Job, error: Error) => {
    strapi.log.error(`Job ${job.id} failed:`, error);
  });

  workflowQueue.on('stalled', (job: Job) => {
    strapi.log.warn(`Job ${job.id} stalled`);
  });

  strapi.log.info('Queue processor initialized');
}

/**
 * Handle quote approved event
 */
async function handleQuoteApproved(
  strapi: Core.Strapi,
  data: QuoteApprovedJobData
): Promise<any> {
  const { quoteId } = data;
  
  strapi.log.info(`Processing quote approval for quote ${quoteId}`);
  
  const result = await processQuoteApproval(strapi, quoteId);
  
  return {
    success: true,
    quoteId,
    orderId: result.order.id,
    jobId: result.job.id,
  };
}

/**
 * Handle create order event
 */
async function handleCreateOrder(
  strapi: Core.Strapi,
  data: CreateOrderJobData
): Promise<any> {
  const { quoteId } = data;
  
  strapi.log.info(`Creating order from quote ${quoteId}`);
  
  const quote = await strapi.documents('api::quote.quote').findOne({
    documentId: quoteId.toString(),
    populate: ['customer'],
  });

  if (!quote) {
    throw new Error(`Quote ${quoteId} not found`);
  }

  const order = await createOrderFromQuote(strapi, quote);
  
  return {
    success: true,
    quoteId,
    orderId: order.id,
  };
}

/**
 * Handle create job event
 */
async function handleCreateJob(
  strapi: Core.Strapi,
  data: CreateJobJobData
): Promise<any> {
  const { orderId, quoteId } = data;
  
  strapi.log.info(`Creating job from order ${orderId}`);
  
  const order = await strapi.documents('api::order.order').findOne({
    documentId: orderId.toString(),
    populate: ['customer'],
  });

  const quote = await strapi.documents('api::quote.quote').findOne({
    documentId: quoteId.toString(),
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (!quote) {
    throw new Error(`Quote ${quoteId} not found`);
  }

  const job = await createJobFromOrder(strapi, order, quote);
  
  return {
    success: true,
    orderId,
    jobId: job.id,
  };
}

/**
 * Handle send notification event
 */
async function handleSendNotification(
  strapi: Core.Strapi,
  data: SendNotificationJobData
): Promise<any> {
  const { type, recipient, data: notificationData } = data;
  
  strapi.log.info(`Sending ${type} notification to ${recipient}`);
  
  let success = false;
  
  if (type === 'email') {
    success = await sendEmail(
      recipient,
      notificationData.subject,
      notificationData.html,
      strapi
    );
  } else if (type === 'websocket') {
    success = await sendWebSocketNotification(
      recipient,
      notificationData.event,
      notificationData.payload,
      strapi
    );
  }
  
  return {
    success,
    type,
    recipient,
  };
}

/**
 * Gracefully shutdown queue processor
 */
export async function shutdownQueueProcessor(strapi: Core.Strapi) {
  strapi.log.info('Shutting down queue processor...');
  
  await workflowQueue.close();
  
  strapi.log.info('Queue processor shut down');
}

export default {
  initializeQueueProcessor,
  shutdownQueueProcessor,
};
