/**
 * quote controller
 */

import { factories } from '@strapi/strapi';
import { addWorkflowJob, WorkflowJobType } from '../../../services/queue';
import { getWorkflowStatus } from '../../../services/workflow';

export default factories.createCoreController('api::quote.quote', ({ strapi }) => ({
  /**
   * Approve a quote and trigger workflow
   * POST /api/quotes/:id/approve
   */
  async approve(ctx) {
    try {
      const { id } = ctx.params;
      const { approvalToken } = ctx.request.body || {};

      // Get the quote
      const quote = await strapi.documents('api::quote.quote').findOne({
        documentId: id,
      });

      if (!quote) {
        return ctx.notFound('Quote not found');
      }

      // Validate quote can be approved
      if (quote.status === 'OrderCreated') {
        return ctx.badRequest('Quote already approved and order created');
      }

      if (quote.status === 'Rejected') {
        return ctx.badRequest('Quote has been rejected');
      }

      if (quote.status === 'Expired') {
        return ctx.badRequest('Quote has expired');
      }

      // Optional: Validate approval token if provided
      if (approvalToken && quote.approvalToken !== approvalToken) {
        return ctx.unauthorized('Invalid approval token');
      }

      // Optional: Check expiration
      if (quote.approval_link_expires_at) {
        const expiresAt = new Date(quote.approval_link_expires_at);
        if (expiresAt < new Date()) {
          // Update status to expired
          await strapi.documents('api::quote.quote').update({
            documentId: id,
            data: { status: 'Expired' },
          });
          return ctx.badRequest('Quote approval link has expired');
        }
      }

      // Add job to queue for async processing
      const job = await addWorkflowJob(WorkflowJobType.QUOTE_APPROVED, {
        quoteId: quote.id,
        approvalToken,
      });

      ctx.body = {
        message: 'Quote approval is being processed',
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        jobId: job.id,
      };
    } catch (error) {
      strapi.log.error('Quote approval failed:', error);
      ctx.internalServerError('Failed to approve quote');
    }
  },

  /**
   * Get workflow status for a quote
   * GET /api/quotes/:id/workflow-status
   */
  async workflowStatus(ctx) {
    try {
      const { id } = ctx.params;

      // Get the quote to find its numeric ID
      const quote = await strapi.documents('api::quote.quote').findOne({
        documentId: id,
      });

      if (!quote) {
        return ctx.notFound('Quote not found');
      }

      const status = await getWorkflowStatus(strapi, quote.id);

      ctx.body = status;
    } catch (error) {
      strapi.log.error('Failed to get workflow status:', error);
      ctx.internalServerError('Failed to get workflow status');
    }
  },
}));
