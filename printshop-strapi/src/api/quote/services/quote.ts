/**
 * quote service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::quote.quote', ({ strapi }) => ({
  /**
   * Find quotes that need reminder emails (pending 5+ days)
   */
  async findQuotesNeedingReminders() {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const quotes = await strapi.entityService.findMany('api::quote.quote', {
      filters: {
        status: 'Sent',
        emailSentAt: {
          $lt: fiveDaysAgo.toISOString(),
        },
        $or: [
          { reminderSentAt: { $null: true } },
          { 
            reminderSentAt: {
              $lt: fiveDaysAgo.toISOString(),
            }
          },
        ],
      },
      populate: ['customer'],
    });

    return quotes;
  },

  /**
   * Mark quote as reminder sent
   */
  async markReminderSent(quoteId: number) {
    return await strapi.entityService.update('api::quote.quote', quoteId, {
      data: {
        reminderSentAt: new Date(),
      },
    });
  },

  /**
   * Check for expired quotes and mark them
   */
  async checkExpiredQuotes() {
    const now = new Date();

    const quotes = await strapi.entityService.findMany('api::quote.quote', {
      filters: {
        status: 'Sent',
        validUntil: {
          $lt: now.toISOString(),
        },
      },
    });

    const updated = [];
    for (const quote of quotes) {
      const updatedQuote = await strapi.entityService.update('api::quote.quote', quote.id, {
        data: {
          status: 'Expired',
        },
      });
      updated.push(updatedQuote);
    }

    return updated;
  },
}));
