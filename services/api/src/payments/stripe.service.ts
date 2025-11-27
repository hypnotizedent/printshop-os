/**
 * Stripe Payment Service
 * Handles payment processing for PrintShop OS
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface CreatePaymentIntentParams {
  amount: number; // Amount in cents
  currency?: string;
  customerId?: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionParams {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  lineItems: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitAmount: number; // In cents
  }>;
  successUrl: string;
  cancelUrl: string;
  allowPromotion?: boolean;
  collectShippingAddress?: boolean;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Create a payment intent for direct card payments
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentResult> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency || 'usd',
      customer: params.customerId,
      description: params.description || `Order ${params.orderNumber}`,
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        ...params.metadata,
      },
      receipt_email: params.customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  } catch (error: any) {
    console.error('Stripe createPaymentIntent error:', error);
    return {
      success: false,
      error: error.message || 'Payment failed',
    };
  }
}

/**
 * Create a Stripe Checkout session for hosted payment page
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<PaymentResult> {
  try {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.lineItems.map(
      (item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description,
          },
          unit_amount: item.unitAmount,
        },
        quantity: item.quantity,
      })
    );

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: params.customerEmail,
      line_items: lineItems,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        customerName: params.customerName,
      },
      allow_promotion_codes: params.allowPromotion ?? true,
      shipping_address_collection: params.collectShippingAddress
        ? { allowed_countries: ['US', 'CA'] }
        : undefined,
    });

    return {
      success: true,
      checkoutUrl: session.url || undefined,
    };
  } catch (error: any) {
    console.error('Stripe createCheckoutSession error:', error);
    return {
      success: false,
      error: error.message || 'Checkout session creation failed',
    };
  }
}

/**
 * Create a deposit payment (50% of order total)
 */
export async function createDepositPayment(
  orderId: string,
  orderNumber: string,
  totalAmount: number,
  customerEmail: string,
  customerName: string,
  successUrl: string,
  cancelUrl: string
): Promise<PaymentResult> {
  const depositAmount = Math.round(totalAmount * 0.5);

  return createCheckoutSession({
    orderId,
    orderNumber,
    customerEmail,
    customerName,
    lineItems: [
      {
        name: `50% Deposit - Order #${orderNumber}`,
        description: 'Deposit payment to begin production',
        quantity: 1,
        unitAmount: depositAmount,
      },
    ],
    successUrl,
    cancelUrl,
  });
}

/**
 * Create full payment for order
 */
export async function createFullPayment(
  orderId: string,
  orderNumber: string,
  totalAmount: number,
  customerEmail: string,
  customerName: string,
  successUrl: string,
  cancelUrl: string
): Promise<PaymentResult> {
  return createCheckoutSession({
    orderId,
    orderNumber,
    customerEmail,
    customerName,
    lineItems: [
      {
        name: `Full Payment - Order #${orderNumber}`,
        description: 'Complete order payment',
        quantity: 1,
        unitAmount: totalAmount,
      },
    ],
    successUrl,
    cancelUrl,
  });
}

/**
 * Create balance payment (remaining after deposit)
 */
export async function createBalancePayment(
  orderId: string,
  orderNumber: string,
  balanceAmount: number,
  customerEmail: string,
  customerName: string,
  successUrl: string,
  cancelUrl: string
): Promise<PaymentResult> {
  return createCheckoutSession({
    orderId,
    orderNumber,
    customerEmail,
    customerName,
    lineItems: [
      {
        name: `Balance Payment - Order #${orderNumber}`,
        description: 'Remaining balance for order',
        quantity: 1,
        unitAmount: balanceAmount,
      },
    ],
    successUrl,
    cancelUrl,
  });
}

/**
 * Retrieve payment intent status
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      amountReceived: paymentIntent.amount_received,
      metadata: paymentIntent.metadata,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Retrieve checkout session
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    });
    return {
      success: true,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      metadata: session.metadata,
      customerEmail: session.customer_email,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create or get Stripe customer
 */
export async function getOrCreateCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<{ customerId: string } | { error: string }> {
  try {
    // Search for existing customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return { customerId: customers.data[0].id };
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    return { customerId: customer.id };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Process refund
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number, // Optional partial refund amount in cents
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason,
    });

    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Construct webhook event from payload
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return null;
  }
}

export default {
  createPaymentIntent,
  createCheckoutSession,
  createDepositPayment,
  createFullPayment,
  createBalancePayment,
  getPaymentIntent,
  getCheckoutSession,
  getOrCreateCustomer,
  createRefund,
  constructWebhookEvent,
};
