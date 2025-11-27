/**
 * Stripe Webhook Handler
 * Processes payment events from Stripe
 */

import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { constructWebhookEvent } from './stripe.service';

export interface WebhookHandlers {
  onPaymentSucceeded?: (paymentIntent: Stripe.PaymentIntent) => Promise<void>;
  onPaymentFailed?: (paymentIntent: Stripe.PaymentIntent) => Promise<void>;
  onCheckoutCompleted?: (session: Stripe.Checkout.Session) => Promise<void>;
  onCheckoutExpired?: (session: Stripe.Checkout.Session) => Promise<void>;
  onRefundCreated?: (refund: Stripe.Refund) => Promise<void>;
}

/**
 * Create webhook handler middleware
 */
export function createWebhookHandler(
  webhookSecret: string,
  handlers: WebhookHandlers
) {
  return async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const event = constructWebhookEvent(req.body, signature, webhookSecret);
    
    if (!event) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          if (handlers.onPaymentSucceeded) {
            await handlers.onPaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          }
          break;

        case 'payment_intent.payment_failed':
          if (handlers.onPaymentFailed) {
            await handlers.onPaymentFailed(event.data.object as Stripe.PaymentIntent);
          }
          break;

        case 'checkout.session.completed':
          if (handlers.onCheckoutCompleted) {
            await handlers.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          }
          break;

        case 'checkout.session.expired':
          if (handlers.onCheckoutExpired) {
            await handlers.onCheckoutExpired(event.data.object as Stripe.Checkout.Session);
          }
          break;

        case 'charge.refunded':
          if (handlers.onRefundCreated) {
            await handlers.onRefundCreated(event.data.object as unknown as Stripe.Refund);
          }
          break;

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      return res.json({ received: true });
    } catch (error: any) {
      console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
      return res.status(500).json({ error: 'Webhook handler failed' });
    }
  };
}

/**
 * Default handlers that update Strapi
 */
export function createStrapiPaymentHandlers(strapiUrl: string, strapiToken: string): WebhookHandlers {
  const updatePaymentInStrapi = async (
    orderId: string,
    paymentData: {
      status: string;
      stripePaymentIntentId?: string;
      amount?: number;
      paidAt?: string;
    }
  ) => {
    try {
      // First, find the payment record for this order
      const searchResponse = await fetch(
        `${strapiUrl}/api/payments?filters[order][id][$eq]=${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${strapiToken}`,
          },
        }
      );

      const payments = await searchResponse.json();
      
      if (payments.data && payments.data.length > 0) {
        const paymentId = payments.data[0].id;
        
        // Update existing payment
        await fetch(`${strapiUrl}/api/payments/${paymentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${strapiToken}`,
          },
          body: JSON.stringify({ data: paymentData }),
        });
      } else {
        // Create new payment record
        await fetch(`${strapiUrl}/api/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${strapiToken}`,
          },
          body: JSON.stringify({
            data: {
              order: orderId,
              ...paymentData,
            },
          }),
        });
      }
    } catch (error) {
      console.error('[Strapi Update] Failed to update payment:', error);
      throw error;
    }
  };

  return {
    onPaymentSucceeded: async (paymentIntent) => {
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        await updatePaymentInStrapi(orderId, {
          status: 'paid',
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount_received,
          paidAt: new Date().toISOString(),
        });
        console.log(`[Strapi Update] Order ${orderId} marked as paid`);
      }
    },

    onPaymentFailed: async (paymentIntent) => {
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        await updatePaymentInStrapi(orderId, {
          status: 'failed',
          stripePaymentIntentId: paymentIntent.id,
        });
        console.log(`[Strapi Update] Order ${orderId} payment failed`);
      }
    },

    onCheckoutCompleted: async (session) => {
      const orderId = session.metadata?.orderId;
      if (orderId && session.payment_status === 'paid') {
        await updatePaymentInStrapi(orderId, {
          status: 'paid',
          stripePaymentIntentId: session.payment_intent as string,
          amount: session.amount_total || 0,
          paidAt: new Date().toISOString(),
        });
        console.log(`[Strapi Update] Order ${orderId} checkout completed`);
      }
    },

    onCheckoutExpired: async (session) => {
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await updatePaymentInStrapi(orderId, {
          status: 'expired',
        });
        console.log(`[Strapi Update] Order ${orderId} checkout expired`);
      }
    },

    onRefundCreated: async (refund) => {
      console.log(`[Stripe Webhook] Refund created: ${refund.id}`);
      // Refund handling would go here
    },
  };
}

export default {
  createWebhookHandler,
  createStrapiPaymentHandlers,
};
