/**
 * Bull Queue Service
 * Handles async job processing for Quote → Order → Job workflow
 */

import Queue from 'bull';

// Redis configuration from environment variables
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Create Bull queue for workflow processing
export const workflowQueue = new Queue('workflow-automation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Job types
export enum WorkflowJobType {
  QUOTE_APPROVED = 'quote.approved',
  CREATE_ORDER = 'create.order',
  CREATE_JOB = 'create.job',
  SEND_NOTIFICATION = 'send.notification',
}

// Queue job data interfaces
export interface QuoteApprovedJobData {
  quoteId: number;
  approvalToken?: string;
}

export interface CreateOrderJobData {
  quoteId: number;
}

export interface CreateJobJobData {
  orderId: number;
  quoteId: number;
}

export interface SendNotificationJobData {
  type: 'email' | 'websocket';
  template: string;
  recipient: string;
  data: any;
}

// Add job to queue
export async function addWorkflowJob(
  type: WorkflowJobType,
  data: QuoteApprovedJobData | CreateOrderJobData | CreateJobJobData | SendNotificationJobData
) {
  return await workflowQueue.add(type, data, {
    priority: type === WorkflowJobType.SEND_NOTIFICATION ? 5 : 1,
  });
}

// Get queue stats
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    workflowQueue.getWaitingCount(),
    workflowQueue.getActiveCount(),
    workflowQueue.getCompletedCount(),
    workflowQueue.getFailedCount(),
    workflowQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

export default workflowQueue;
