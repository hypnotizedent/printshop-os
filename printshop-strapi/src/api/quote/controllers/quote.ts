/**
 * quote controller
 */

import { factories } from '@strapi/strapi';
import crypto from 'crypto';

export default factories.createCoreController('api::quote.quote', ({ strapi }) => ({
  /**
   * Get quote by approval token (public)
   */
  async getByToken(ctx) {
    const { token } = ctx.params;

    const quote = await strapi.db.query('api::quote.quote').findOne({
      where: { approvalToken: token },
      populate: ['customer', 'attachments'],
    });

    if (!quote) {
      return ctx.notFound('Quote not found');
    }

    // Check if expired
    if (quote.expiresAt && new Date(quote.expiresAt) < new Date()) {
      return ctx.badRequest('Quote has expired');
    }

    // Mark as viewed if first time
    if (!quote.viewedAt) {
      await strapi.db.query('api::quote.quote').update({
        where: { id: quote.id },
        data: {
          viewedAt: new Date().toISOString(),
          status: quote.status === 'sent' ? 'viewed' : quote.status,
        },
      });
    }

    // Return sanitized quote (hide internal notes)
    const { internalNotes, approvalToken, ...publicQuote } = quote;

    return ctx.send({
      data: publicQuote,
    });
  },

  /**
   * Approve quote (public)
   */
  async approve(ctx) {
    const { token } = ctx.params;
    const { approvedBy, signature, notes } = ctx.request.body || {};

    const quote = await strapi.db.query('api::quote.quote').findOne({
      where: { approvalToken: token },
      populate: ['customer', 'order'],
    });

    if (!quote) {
      return ctx.notFound('Quote not found');
    }

    // Check if already approved
    if (quote.status === 'approved') {
      return ctx.badRequest('Quote has already been approved');
    }

    // Check if expired
    if (quote.expiresAt && new Date(quote.expiresAt) < new Date()) {
      return ctx.badRequest('Quote has expired');
    }

    // Check if rejected
    if (quote.status === 'rejected') {
      return ctx.badRequest('Quote has been rejected');
    }

    // Update quote
    const updatedQuote = await strapi.db.query('api::quote.quote').update({
      where: { id: quote.id },
      data: {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: approvedBy || 'Customer',
        approverSignature: signature,
        customerNotes: notes,
      },
    });

    // Create or update order if linked
    if (quote.order) {
      await strapi.db.query('api::order.order').update({
        where: { id: quote.order.id },
        data: {
          status: 'QUOTE_APPROVED',
        },
      });
    }

    // Generate new token for security
    const newToken = crypto.randomBytes(32).toString('hex');
    await strapi.db.query('api::quote.quote').update({
      where: { id: quote.id },
      data: { approvalToken: newToken },
    });

    return ctx.send({
      message: 'Quote approved successfully',
      data: {
        quoteNumber: updatedQuote.quoteNumber,
        approvedAt: updatedQuote.approvedAt,
        total: updatedQuote.total,
        depositAmount: updatedQuote.depositAmount,
      },
    });
  },

  /**
   * Reject quote (public)
   */
  async reject(ctx) {
    const { token } = ctx.params;
    const { reason } = ctx.request.body || {};

    const quote = await strapi.db.query('api::quote.quote').findOne({
      where: { approvalToken: token },
    });

    if (!quote) {
      return ctx.notFound('Quote not found');
    }

    // Check if already processed
    if (quote.status === 'approved') {
      return ctx.badRequest('Quote has already been approved');
    }

    if (quote.status === 'rejected') {
      return ctx.badRequest('Quote has already been rejected');
    }

    // Update quote
    await strapi.db.query('api::quote.quote').update({
      where: { id: quote.id },
      data: {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
      },
    });

    // Update linked order
    if (quote.order) {
      await strapi.db.query('api::order.order').update({
        where: { id: quote.order },
        data: {
          status: 'CANCELLED',
        },
      });
    }

    return ctx.send({
      message: 'Quote rejected',
      data: {
        quoteNumber: quote.quoteNumber,
        rejectedAt: new Date().toISOString(),
      },
    });
  },

  /**
   * Override create to generate quote number and token
   */
  async create(ctx) {
    const data = ctx.request.body.data || ctx.request.body;

    // Generate quote number if not provided
    if (!data.quoteNumber) {
      const count = await strapi.db.query('api::quote.quote').count({});
      data.quoteNumber = `Q-${String(count + 1).padStart(5, '0')}`;
    }

    // Generate approval token
    data.approvalToken = crypto.randomBytes(32).toString('hex');

    // Set expiration if validDays provided
    if (data.validDays && !data.expiresAt) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.validDays);
      data.expiresAt = expiresAt.toISOString();
    }

    // Calculate deposit if needed
    if (data.depositRequired && data.depositPercent && data.total) {
      data.depositAmount = (data.total * data.depositPercent) / 100;
    }

    ctx.request.body = { data };

    return super.create(ctx);
  },
}));
