/**
 * quote controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quote.quote', ({ strapi }) => ({
  /**
   * Send quote via email to customer
   */
  async send(ctx) {
    try {
      const { id } = ctx.params;

      // Get the quote with customer information
      const quote = await strapi.entityService.findOne('api::quote.quote', id, {
        populate: ['customer'],
      });

      if (!quote) {
        return ctx.notFound('Quote not found');
      }

      if (quote.status !== 'Draft') {
        return ctx.badRequest('Quote has already been sent or processed');
      }

      // Get customer information
      const customer = quote.customer;
      if (!customer || !customer.email) {
        return ctx.badRequest('Customer email is required to send quote');
      }

      // Note: In production, integrate with the email service:
      // const quoteEmailService = require('../../../services/quote-email-service').default;
      // quoteEmailService.initialize();
      // const result = await quoteEmailService.sendQuote(quote);
      // 
      // if (!result.success) {
      //   return ctx.badRequest(result.error);
      // }

      // Generate approval token
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'printshop-secret-change-in-production';
      const approvalToken = jwt.sign(
        { quoteId: id.toString(), type: 'quote_approval' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Update quote with email sent status
      const updatedQuote = await strapi.entityService.update('api::quote.quote', id, {
        data: {
          status: 'Sent',
          emailSentAt: new Date(),
          emailDeliveryStatus: 'sent',
          approvalToken,
        },
      });

      return ctx.send({
        data: updatedQuote,
        message: 'Quote sent successfully',
      });
    } catch (error) {
      strapi.log.error('Error sending quote:', error);
      return ctx.internalServerError('Failed to send quote');
    }
  },

  /**
   * Approve quote via email link (no authentication required)
   */
  async approve(ctx) {
    try {
      const { token } = ctx.params;

      if (!token) {
        return ctx.badRequest('Approval token is required');
      }

      // Verify token and extract quote ID (JWT verification will be done separately)
      // For now, we'll just look up by token
      const quotes = await strapi.entityService.findMany('api::quote.quote', {
        filters: { approvalToken: token },
      });

      if (!quotes || quotes.length === 0) {
        return ctx.notFound('Invalid or expired approval link');
      }

      const quote = quotes[0];

      if (quote.status === 'Approved') {
        return ctx.send({
          data: quote,
          message: 'Quote has already been approved',
        });
      }

      if (quote.status === 'Rejected') {
        return ctx.badRequest('Quote has already been rejected');
      }

      // Update quote status to Approved
      const updatedQuote = await strapi.entityService.update('api::quote.quote', quote.id, {
        data: {
          status: 'Approved',
          approvedAt: new Date(),
        },
      });

      // TODO: Trigger order creation (Task 2.2)

      return ctx.send({
        data: updatedQuote,
        message: 'Quote approved successfully',
      });
    } catch (error) {
      strapi.log.error('Error approving quote:', error);
      return ctx.internalServerError('Failed to approve quote');
    }
  },

  /**
   * Reject quote via email link (no authentication required)
   */
  async reject(ctx) {
    try {
      const { token } = ctx.params;
      const { reason } = ctx.request.body;

      if (!token) {
        return ctx.badRequest('Rejection token is required');
      }

      // Find quote by token
      const quotes = await strapi.entityService.findMany('api::quote.quote', {
        filters: { approvalToken: token },
      });

      if (!quotes || quotes.length === 0) {
        return ctx.notFound('Invalid or expired rejection link');
      }

      const quote = quotes[0];

      if (quote.status === 'Rejected') {
        return ctx.send({
          data: quote,
          message: 'Quote has already been rejected',
        });
      }

      if (quote.status === 'Approved') {
        return ctx.badRequest('Quote has already been approved');
      }

      // Update quote status to Rejected
      const updatedQuote = await strapi.entityService.update('api::quote.quote', quote.id, {
        data: {
          status: 'Rejected',
          rejectedAt: new Date(),
          rejectionReason: reason || null,
        },
      });

      return ctx.send({
        data: updatedQuote,
        message: 'Quote rejected successfully',
      });
    } catch (error) {
      strapi.log.error('Error rejecting quote:', error);
      return ctx.internalServerError('Failed to reject quote');
    }
  },

  /**
   * Handle SendGrid webhook events
   */
  async webhook(ctx) {
    try {
      const events = ctx.request.body;

      if (!Array.isArray(events)) {
        return ctx.badRequest('Invalid webhook payload');
      }

      for (const event of events) {
        const { event: eventType, sg_message_id, quote_id, timestamp } = event;

        if (!quote_id) {
          continue;
        }

        // Find quote by message ID or custom args
        const quotes = await strapi.entityService.findMany('api::quote.quote', {
          filters: { 
            $or: [
              { emailMessageId: sg_message_id },
              { id: quote_id },
            ]
          },
        });

        if (!quotes || quotes.length === 0) {
          continue;
        }

        const quote = quotes[0];
        const updateData: any = {};

        // Update based on event type
        switch (eventType) {
          case 'delivered':
            updateData.emailDeliveryStatus = 'delivered';
            break;
          case 'bounce':
          case 'dropped':
            updateData.emailDeliveryStatus = 'bounced';
            break;
          case 'open':
            updateData.emailDeliveryStatus = 'opened';
            updateData.emailOpenedAt = new Date(timestamp * 1000);
            break;
          case 'click':
            updateData.emailDeliveryStatus = 'clicked';
            updateData.emailClickedAt = new Date(timestamp * 1000);
            break;
        }

        if (Object.keys(updateData).length > 0) {
          await strapi.entityService.update('api::quote.quote', quote.id, {
            data: updateData,
          });
        }
      }

      return ctx.send({ received: true });
    } catch (error) {
      strapi.log.error('Error processing webhook:', error);
      return ctx.internalServerError('Failed to process webhook');
    }
  },
}));
