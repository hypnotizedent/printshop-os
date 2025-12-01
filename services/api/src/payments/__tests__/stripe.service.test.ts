/**
 * Stripe Payment Service Tests
 * Tests for payment processing operations
 */

// Create mock instance that will be shared
const mockStripeInstance = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  customers: {
    list: jest.fn(),
    create: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

// Mock Stripe before importing
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripeInstance);
});

import * as stripeService from '../stripe.service';

describe('Stripe Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {

    it('should create a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_123456789',
        client_secret: 'pi_123456789_secret_abc',
        status: 'requires_payment_method',
      };

      mockStripeInstance.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.createPaymentIntent({
        amount: 10000,
        orderId: 'order-123',
        orderNumber: 'ORD-2025-001',
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
      });

      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe('pi_123456789');
      expect(result.clientSecret).toBe('pi_123456789_secret_abc');
      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000,
          currency: 'usd',
          metadata: expect.objectContaining({
            orderId: 'order-123',
            orderNumber: 'ORD-2025-001',
          }),
        })
      );
    });

    it('should use custom currency', async () => {
      mockStripeInstance.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
        client_secret: 'secret',
      });

      await stripeService.createPaymentIntent({
        amount: 5000,
        currency: 'cad',
        orderId: 'order-123',
        orderNumber: 'ORD-2025-001',
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
      });

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'cad',
        })
      );
    });

    it('should handle payment intent errors', async () => {
      mockStripeInstance.paymentIntents.create.mockRejectedValue(
        new Error('Card declined')
      );

      const result = await stripeService.createPaymentIntent({
        amount: 10000,
        orderId: 'order-123',
        orderNumber: 'ORD-2025-001',
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card declined');
    });

    it('should include description with order number', async () => {
      mockStripeInstance.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
        client_secret: 'secret',
      });

      await stripeService.createPaymentIntent({
        amount: 5000,
        orderId: 'order-123',
        orderNumber: 'ORD-2025-001',
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        description: 'Custom description',
      });

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Custom description',
        })
      );
    });
  });

  describe('createCheckoutSession', () => {

    it('should create checkout session successfully', async () => {
      const mockSession = {
        id: 'cs_123456789',
        url: 'https://checkout.stripe.com/c/pay/cs_123456789',
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await stripeService.createCheckoutSession({
        orderId: 'order-123',
        orderNumber: 'ORD-2025-001',
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        lineItems: [
          { name: 'T-Shirts', quantity: 100, unitAmount: 1500 },
        ],
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.success).toBe(true);
      expect(result.checkoutUrl).toBe(mockSession.url);
    });

    it('should handle multiple line items', async () => {
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/...',
      });

      await stripeService.createCheckoutSession({
        orderId: 'order-123',
        orderNumber: 'ORD-2025-001',
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        lineItems: [
          { name: 'T-Shirts', description: '100 shirts', quantity: 100, unitAmount: 1500 },
          { name: 'Setup Fee', quantity: 1, unitAmount: 2500 },
        ],
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  name: 'T-Shirts',
                }),
              }),
              quantity: 100,
            }),
          ]),
        })
      );
    });

    it('should collect shipping address when specified', async () => {
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/...',
      });

      await stripeService.createCheckoutSession({
        orderId: 'order-123',
        orderNumber: 'ORD-2025-001',
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        lineItems: [{ name: 'Item', quantity: 1, unitAmount: 1000 }],
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        collectShippingAddress: true,
      });

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shipping_address_collection: { allowed_countries: ['US', 'CA'] },
        })
      );
    });

    it('should handle checkout session errors', async () => {
      mockStripeInstance.checkout.sessions.create.mockRejectedValue(
        new Error('Invalid request')
      );

      const result = await stripeService.createCheckoutSession({
        orderId: 'order-123',
        orderNumber: 'ORD-2025-001',
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        lineItems: [{ name: 'Item', quantity: 1, unitAmount: 1000 }],
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid request');
    });
  });

  describe('createDepositPayment', () => {

    it('should create 50% deposit payment', async () => {
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/...',
      });

      await stripeService.createDepositPayment(
        'order-123',
        'ORD-2025-001',
        10000, // $100.00 total
        'test@example.com',
        'John Doe',
        'https://example.com/success',
        'https://example.com/cancel'
      );

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 5000, // 50% = $50.00
              }),
              quantity: 1,
            }),
          ],
        })
      );
    });

    it('should round deposit amount correctly', async () => {
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/...',
      });

      await stripeService.createDepositPayment(
        'order-123',
        'ORD-2025-001',
        9999, // Odd number
        'test@example.com',
        'John Doe',
        'https://example.com/success',
        'https://example.com/cancel'
      );

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 5000, // Math.round(9999 * 0.5) = 5000
              }),
            }),
          ],
        })
      );
    });
  });

  describe('createFullPayment', () => {

    it('should create full payment checkout session', async () => {
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/...',
      });

      await stripeService.createFullPayment(
        'order-123',
        'ORD-2025-001',
        25000,
        'test@example.com',
        'John Doe',
        'https://example.com/success',
        'https://example.com/cancel'
      );

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 25000,
                product_data: expect.objectContaining({
                  name: expect.stringContaining('Full Payment'),
                }),
              }),
            }),
          ],
        })
      );
    });
  });

  describe('createBalancePayment', () => {

    it('should create balance payment checkout session', async () => {
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/...',
      });

      await stripeService.createBalancePayment(
        'order-123',
        'ORD-2025-001',
        12500, // Remaining balance
        'test@example.com',
        'John Doe',
        'https://example.com/success',
        'https://example.com/cancel'
      );

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 12500,
                product_data: expect.objectContaining({
                  name: expect.stringContaining('Balance Payment'),
                }),
              }),
            }),
          ],
        })
      );
    });
  });

  describe('getPaymentIntent', () => {

    it('should retrieve payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
        amount: 10000,
        amount_received: 10000,
        metadata: { orderId: 'order-123' },
      };

      mockStripeInstance.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.getPaymentIntent('pi_123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('succeeded');
      expect(result.amount).toBe(10000);
      expect(result.amountReceived).toBe(10000);
    });

    it('should handle retrieve errors', async () => {
      mockStripeInstance.paymentIntents.retrieve.mockRejectedValue(
        new Error('Payment intent not found')
      );

      const result = await stripeService.getPaymentIntent('pi_invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment intent not found');
    });
  });

  describe('getCheckoutSession', () => {

    it('should retrieve checkout session successfully', async () => {
      const mockSession = {
        id: 'cs_123',
        status: 'complete',
        payment_status: 'paid',
        amount_total: 10000,
        metadata: { orderId: 'order-123' },
        customer_email: 'test@example.com',
      };

      mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue(mockSession);

      const result = await stripeService.getCheckoutSession('cs_123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('complete');
      expect(result.paymentStatus).toBe('paid');
      expect(result.customerEmail).toBe('test@example.com');
    });

    it('should handle retrieve errors', async () => {
      mockStripeInstance.checkout.sessions.retrieve.mockRejectedValue(
        new Error('Session not found')
      );

      const result = await stripeService.getCheckoutSession('cs_invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session not found');
    });
  });

  describe('getOrCreateCustomer', () => {

    it('should return existing customer', async () => {
      mockStripeInstance.customers.list.mockResolvedValue({
        data: [{ id: 'cus_existing123' }],
      });

      const result = await stripeService.getOrCreateCustomer(
        'existing@example.com',
        'John Doe'
      );

      expect(result).toEqual({ customerId: 'cus_existing123' });
      expect(mockStripeInstance.customers.create).not.toHaveBeenCalled();
    });

    it('should create new customer when not found', async () => {
      mockStripeInstance.customers.list.mockResolvedValue({
        data: [],
      });
      mockStripeInstance.customers.create.mockResolvedValue({
        id: 'cus_new123',
      });

      const result = await stripeService.getOrCreateCustomer(
        'new@example.com',
        'Jane Doe',
        { source: 'website' }
      );

      expect(result).toEqual({ customerId: 'cus_new123' });
      expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        name: 'Jane Doe',
        metadata: { source: 'website' },
      });
    });

    it('should handle errors', async () => {
      mockStripeInstance.customers.list.mockRejectedValue(
        new Error('API error')
      );

      const result = await stripeService.getOrCreateCustomer(
        'test@example.com',
        'Test User'
      );

      expect(result).toEqual({ error: 'API error' });
    });
  });

  describe('createRefund', () => {

    it('should create full refund', async () => {
      const mockRefund = {
        id: 're_123',
        status: 'succeeded',
        amount: 10000,
      };

      mockStripeInstance.refunds.create.mockResolvedValue(mockRefund);

      const result = await stripeService.createRefund('pi_123');

      expect(result.success).toBe(true);
      expect(result.refundId).toBe('re_123');
      expect(result.status).toBe('succeeded');
      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: undefined,
        reason: undefined,
      });
    });

    it('should create partial refund', async () => {
      const mockRefund = {
        id: 're_123',
        status: 'succeeded',
        amount: 5000,
      };

      mockStripeInstance.refunds.create.mockResolvedValue(mockRefund);

      const result = await stripeService.createRefund('pi_123', 5000, 'requested_by_customer');

      expect(result.success).toBe(true);
      expect(result.amount).toBe(5000);
      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 5000,
        reason: 'requested_by_customer',
      });
    });

    it('should handle refund errors', async () => {
      mockStripeInstance.refunds.create.mockRejectedValue(
        new Error('Refund failed')
      );

      const result = await stripeService.createRefund('pi_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund failed');
    });
  });

  describe('constructWebhookEvent', () => {

    it('should construct valid webhook event', () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: {} },
      };

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = stripeService.constructWebhookEvent(
        'payload',
        'signature',
        'whsec_secret'
      );

      expect(result).toEqual(mockEvent);
    });

    it('should return null for invalid signature', () => {
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = stripeService.constructWebhookEvent(
        'payload',
        'invalid_signature',
        'whsec_secret'
      );

      expect(result).toBeNull();
    });
  });

  describe('Default Export', () => {

    it('should export all payment functions', () => {
      expect(stripeService.default).toBeDefined();
      expect(stripeService.default.createPaymentIntent).toBeDefined();
      expect(stripeService.default.createCheckoutSession).toBeDefined();
      expect(stripeService.default.createDepositPayment).toBeDefined();
      expect(stripeService.default.createFullPayment).toBeDefined();
      expect(stripeService.default.createBalancePayment).toBeDefined();
      expect(stripeService.default.getPaymentIntent).toBeDefined();
      expect(stripeService.default.getCheckoutSession).toBeDefined();
      expect(stripeService.default.getOrCreateCustomer).toBeDefined();
      expect(stripeService.default.createRefund).toBeDefined();
      expect(stripeService.default.constructWebhookEvent).toBeDefined();
    });
  });
});
