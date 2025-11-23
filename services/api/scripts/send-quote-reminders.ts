/**
 * Quote Reminder Scheduler
 * Sends reminder emails for quotes pending 5+ days
 * 
 * Usage: ts-node scripts/send-quote-reminders.ts
 * Can be run via cron job daily
 */

import axios from 'axios';
import quoteEmailService from '../services/quote-email-service';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

interface Quote {
  id: number;
  quoteNumber: string;
  status: string;
  items: any[];
  subtotal: number;
  tax?: number;
  total: number;
  validUntil?: string;
  emailSentAt?: string;
  reminderSentAt?: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
}

async function fetchQuotesNeedingReminders(): Promise<Quote[]> {
  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const response = await axios.get(`${STRAPI_URL}/api/quotes`, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      params: {
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
      },
    });

    return response.data.data || [];
  } catch (error: any) {
    console.error('Error fetching quotes:', error.message);
    return [];
  }
}

async function markReminderSent(quoteId: number): Promise<void> {
  try {
    await axios.put(
      `${STRAPI_URL}/api/quotes/${quoteId}`,
      {
        data: {
          reminderSentAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );
  } catch (error: any) {
    console.error(`Error updating quote ${quoteId}:`, error.message);
  }
}

async function sendReminders(): Promise<void> {
  console.log('Starting quote reminder job...');
  
  // Initialize email service
  quoteEmailService.initialize();

  // Fetch quotes needing reminders
  const quotes = await fetchQuotesNeedingReminders();
  console.log(`Found ${quotes.length} quotes needing reminders`);

  let successCount = 0;
  let failCount = 0;

  for (const quote of quotes) {
    console.log(`Sending reminder for quote ${quote.quoteNumber} to ${quote.customer.email}`);

    const result = await quoteEmailService.sendReminder(quote);

    if (result.success) {
      await markReminderSent(quote.id);
      successCount++;
      console.log(`✓ Reminder sent for quote ${quote.quoteNumber}`);
    } else {
      failCount++;
      console.error(`✗ Failed to send reminder for quote ${quote.quoteNumber}: ${result.error}`);
    }
  }

  console.log(`\nReminder job complete: ${successCount} sent, ${failCount} failed`);
}

// Run if executed directly
if (require.main === module) {
  sendReminders()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { sendReminders, fetchQuotesNeedingReminders };
