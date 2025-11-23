/**
 * Comprehensive unit tests for Printavo to Strapi data mapper
 * Tests field mappings, edge cases, null values, date formats, and error scenarios
 */

import {
  transformPrintavoToStrapi,
  transformPrintavoOrdersBatch,
  convertCustomer,
  convertAddress,
  convertLineItem,
  convertTimeline,
  calculateTotals,
  mapOrderStatus,
  normalizeState,
  extractAddressByType,
  PrintavoMapperError,
  type PrintavoOrder,
  type PrintavoAddress,
  type PrintavoLineItem,
} from './printavo-mapper';
import { OrderStatus, validateStrapiOrder } from './strapi-schema';

describe('Printavo to Strapi Mapper', () => {
  // Mock data factories
  const createMockPrintavoOrder = (overrides?: Partial<PrintavoOrder>): PrintavoOrder => ({
    id: 21199730,
    customer: {
      full_name: 'Randy Ramsey',
      email: 'r.ramsey10@yahoo.com',
      company: '',
      first_name: ' Randy',
      last_name: 'Ramsey',
      customer_id: 0,
    },
    order_addresses_attributes: [
      {
        id: 48187608,
        name: 'Customer Billing',
        customer_name: 'Randy Ramsey',
        company_name: '',
        address1: '',
        city: '',
        state: '',
        state_iso: null as any,
        country: 'US',
        country_iso: 'US',
        zip: '',
      },
      {
        id: 48187609,
        name: 'Customer Shipping',
        customer_name: 'Randy Ramsey',
        company_name: '',
        address1: '1109 Tace Drive',
        address2: 'APT 1A',
        city: 'Essex',
        state: 'Maryland',
        state_iso: 'MD',
        country: 'US',
        country_iso: 'US',
        zip: '21221',
      },
    ],
    lineitems_attributes: [],
    order_fees_attributes: [
      {
        id: 10564577,
        description: '(Waive With Zelle Payment)',
        taxable: false,
        amount: 0,
      },
    ],
    order_total: 1250,
    order_subtotal: 1250,
    sales_tax: 0,
    discount: 0,
    amount_paid: 0,
    amount_outstanding: 1250,
    total_untaxed: 1250,
    orderstatus: {
      name: 'QUOTE',
      color: '#AE0FBD',
    },
    due_date: '2025-11-21T10:00:00.000-05:00',
    customer_due_date: '2025-11-21T00:00:00.000-05:00',
    payment_due_date: '2025-11-21T00:00:00.000-05:00',
    created_at: '2025-11-21T18:35:47.684-05:00',
    updated_at: '2025-11-21T18:35:47.726-05:00',
    order_nickname: 'Sunflower Jaguar',
    public_hash: 'b499cd863d2b9db81e4d3af4a79c2800',
    production_notes: '',
    notes: '',
    approved: false,
    stats: {
      paid: false,
    },
    ...overrides,
  });

  describe('mapOrderStatus', () => {
    it('should map QUOTE to quote status', () => {
      expect(mapOrderStatus('QUOTE')).toBe(OrderStatus.QUOTE);
    });

    it('should map INVOICE PAID to invoice_paid status', () => {
      expect(mapOrderStatus('INVOICE PAID')).toBe(OrderStatus.INVOICE_PAID);
    });

    it('should map IN PRODUCTION to in_production status', () => {
      expect(mapOrderStatus('IN PRODUCTION')).toBe(OrderStatus.IN_PRODUCTION);
    });

    it('should handle case insensitive status names', () => {
      expect(mapOrderStatus('quote')).toBe(OrderStatus.QUOTE);
      expect(mapOrderStatus('Quote')).toBe(OrderStatus.QUOTE);
      expect(mapOrderStatus('invoice paid')).toBe(OrderStatus.INVOICE_PAID);
    });

    it('should map AWAITING APPROVAL to pending', () => {
      expect(mapOrderStatus('AWAITING APPROVAL')).toBe(OrderStatus.PENDING);
    });

    it('should default to pending for unknown status', () => {
      expect(mapOrderStatus('UNKNOWN_STATUS')).toBe(OrderStatus.PENDING);
    });

    it('should handle whitespace in status names', () => {
      expect(mapOrderStatus('  QUOTE  ')).toBe(OrderStatus.QUOTE);
    });
  });

  describe('normalizeState', () => {
    it('should convert full state name to abbreviation', () => {
      expect(normalizeState('Maryland')).toBe('MD');
      expect(normalizeState('California')).toBe('CA');
      expect(normalizeState('Texas')).toBe('TX');
    });

    it('should handle already abbreviated states', () => {
      expect(normalizeState('md')).toBe('MD');
      expect(normalizeState('CA')).toBe('CA');
    });

    it('should handle two-word state names', () => {
      expect(normalizeState('New York')).toBe('NY');
      expect(normalizeState('North Carolina')).toBe('NC');
      expect(normalizeState('West Virginia')).toBe('WV');
    });

    it('should return empty string for empty input', () => {
      expect(normalizeState('')).toBe('');
    });

    it('should return first two characters for unknown states', () => {
      expect(normalizeState('UnknownState')).toBe('UN');
    });
  });

  describe('extractAddressByType', () => {
    const addresses: PrintavoAddress[] = [
      {
        name: 'Customer Billing',
        address1: '123 Main St',
        city: 'Boston',
        state: 'Massachusetts',
        zip: '02101',
      },
      {
        name: 'Customer Shipping',
        address1: '456 Oak Ave',
        city: 'New York',
        state: 'New York',
        zip: '10001',
      },
    ];

    it('should extract shipping address by type', () => {
      const addr = extractAddressByType(addresses, 'Customer Shipping');
      expect(addr).toBeDefined();
      expect(addr?.address1).toBe('456 Oak Ave');
    });

    it('should extract billing address by type', () => {
      const addr = extractAddressByType(addresses, 'Customer Billing');
      expect(addr).toBeDefined();
      expect(addr?.address1).toBe('123 Main St');
    });

    it('should be case insensitive', () => {
      const addr = extractAddressByType(addresses, 'customer shipping');
      expect(addr).toBeDefined();
      expect(addr?.address1).toBe('456 Oak Ave');
    });

    it('should return undefined for non-existent address type', () => {
      const addr = extractAddressByType(addresses, 'NonExistent');
      expect(addr).toBeUndefined();
    });

    it('should return undefined for empty array', () => {
      const addr = extractAddressByType([], 'Customer Shipping');
      expect(addr).toBeUndefined();
    });
  });

  describe('convertAddress', () => {
    it('should convert valid address', () => {
      const printavoAddr: PrintavoAddress = {
        name: 'Customer Shipping',
        address1: '1109 Tace Drive',
        address2: 'APT 1A',
        city: 'Essex',
        state: 'Maryland',
        state_iso: 'MD',
        country: 'US',
        country_iso: 'US',
        zip: '21221',
      };

      const result = convertAddress(printavoAddr);
      expect(result.street).toBe('1109 Tace Drive');
      expect(result.street2).toBe('APT 1A');
      expect(result.city).toBe('Essex');
      expect(result.state).toBe('MD');
      expect(result.zip).toBe('21221');
      expect(result.country).toBe('US');
    });

    it('should use state_iso when available', () => {
      const printavoAddr: PrintavoAddress = {
        name: 'Test',
        address1: '123 Main',
        city: 'Test City',
        state: 'Maryland',
        state_iso: 'MD',
        zip: '12345',
      };

      const result = convertAddress(printavoAddr);
      expect(result.state).toBe('MD');
    });

    it('should convert full state name to abbreviation', () => {
      const printavoAddr: PrintavoAddress = {
        name: 'Test',
        address1: '123 Main',
        city: 'Test City',
        state: 'California',
        zip: '12345',
      };

      const result = convertAddress(printavoAddr);
      expect(result.state).toBe('CA');
    });

    it('should throw error when street is missing', () => {
      const printavoAddr: PrintavoAddress = {
        name: 'Test',
        address1: '',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
      };

      expect(() => convertAddress(printavoAddr)).toThrow();
    });

    it('should throw error when city is missing', () => {
      const printavoAddr: PrintavoAddress = {
        name: 'Test',
        address1: '123 Main',
        city: '',
        state: 'CA',
        zip: '12345',
      };

      expect(() => convertAddress(printavoAddr)).toThrow();
    });

    it('should throw error when state is missing', () => {
      const printavoAddr: PrintavoAddress = {
        name: 'Test',
        address1: '123 Main',
        city: 'Test City',
        state: '',
        zip: '12345',
      };

      expect(() => convertAddress(printavoAddr)).toThrow();
    });

    it('should throw error when zip is missing', () => {
      const printavoAddr: PrintavoAddress = {
        name: 'Test',
        address1: '123 Main',
        city: 'Test City',
        state: 'CA',
        zip: '',
      };

      expect(() => convertAddress(printavoAddr)).toThrow();
    });

    it('should omit street2 when not provided', () => {
      const printavoAddr: PrintavoAddress = {
        name: 'Test',
        address1: '123 Main',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
      };

      const result = convertAddress(printavoAddr);
      expect(result.street2).toBeUndefined();
    });

    it('should trim whitespace from fields', () => {
      const printavoAddr: PrintavoAddress = {
        name: 'Test',
        address1: '  123 Main  ',
        city: '  Test City  ',
        state: '  CA  ',
        zip: '  12345  ',
      };

      const result = convertAddress(printavoAddr);
      expect(result.street).toBe('123 Main');
      expect(result.city).toBe('Test City');
      expect(result.zip).toBe('12345');
    });
  });

  describe('convertCustomer', () => {
    it('should convert valid customer', () => {
      const printavoCustomer = {
        full_name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        first_name: 'John',
        last_name: 'Doe',
      };

      const result = convertCustomer(printavoCustomer);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.company).toBe('Acme Corp');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('should throw error for invalid email', () => {
      const printavoCustomer = {
        full_name: 'John Doe',
        email: 'invalid-email',
        company: 'Acme Corp',
      };

      expect(() => convertCustomer(printavoCustomer)).toThrow('Invalid email');
    });

    it('should throw error when email is empty', () => {
      const printavoCustomer = {
        full_name: 'John Doe',
        email: '',
        company: 'Acme Corp',
      };

      expect(() => convertCustomer(printavoCustomer)).toThrow();
    });

    it('should throw error when name is empty', () => {
      const printavoCustomer = {
        full_name: '',
        email: 'john@example.com',
        company: 'Acme Corp',
      };

      expect(() => convertCustomer(printavoCustomer)).toThrow('Customer name is required');
    });

    it('should omit company when empty', () => {
      const printavoCustomer = {
        full_name: 'John Doe',
        email: 'john@example.com',
        company: '',
      };

      const result = convertCustomer(printavoCustomer);
      expect(result.company).toBeUndefined();
    });

    it('should trim whitespace from fields', () => {
      const printavoCustomer = {
        full_name: '  John Doe  ',
        email: '  john@example.com  ',
        company: '  Acme Corp  ',
      };

      const result = convertCustomer(printavoCustomer);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.company).toBe('Acme Corp');
    });
  });

  describe('convertLineItem', () => {
    it('should convert line item with all fields', () => {
      const printavoItem: PrintavoLineItem = {
        id: 92211045,
        style_description: 'Client Supplied Hats',
        category: 'Embroidery',
        total_quantities: 12,
        unit_cost: 7.95,
        taxable: true,
        goods_status: 'delivered',
        style_number: 'HAT-001',
        color: 'Blue',
      };

      const result = convertLineItem(printavoItem);
      expect(result.id).toBe('92211045');
      expect(result.description).toBe('Client Supplied Hats');
      expect(result.category).toBe('Embroidery');
      expect(result.quantity).toBe(12);
      expect(result.unitCost).toBe(7.95);
      expect(result.total).toBe(95.4);
      expect(result.taxable).toBe(true);
    });

    it('should handle zero quantity', () => {
      const printavoItem: PrintavoLineItem = {
        id: 1,
        style_description: 'Item',
        total_quantities: 0,
        unit_cost: 10,
        taxable: false,
      };

      const result = convertLineItem(printavoItem);
      expect(result.quantity).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle missing quantity', () => {
      const printavoItem: PrintavoLineItem = {
        id: 1,
        style_description: 'Item',
        unit_cost: 10,
        taxable: false,
      } as any;

      const result = convertLineItem(printavoItem);
      expect(result.quantity).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle missing unit cost', () => {
      const printavoItem: PrintavoLineItem = {
        id: 1,
        style_description: 'Item',
        total_quantities: 5,
        taxable: false,
      } as any;

      const result = convertLineItem(printavoItem);
      expect(result.unitCost).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should omit category when empty', () => {
      const printavoItem: PrintavoLineItem = {
        id: 1,
        style_description: 'Item',
        category: '',
        total_quantities: 1,
        unit_cost: 10,
        taxable: false,
      };

      const result = convertLineItem(printavoItem);
      expect(result.category).toBeUndefined();
    });
  });

  describe('calculateTotals', () => {
    it('should calculate totals correctly', () => {
      const order = createMockPrintavoOrder({
        order_subtotal: 100,
        sales_tax: 10,
        discount: 5,
        order_total: 105,
        amount_paid: 50,
        order_fees_attributes: [{ id: 1, description: 'Fee', amount: 10, taxable: false }],
      });

      const result = calculateTotals(order);
      expect(result.subtotal).toBe(100);
      expect(result.tax).toBe(10);
      expect(result.discount).toBe(5);
      expect(result.fees).toBe(10);
      expect(result.total).toBe(105);
      expect(result.amountPaid).toBe(50);
    });

    it('should handle missing fields with defaults', () => {
      const order = createMockPrintavoOrder({
        order_subtotal: undefined,
        sales_tax: undefined,
        order_fees_attributes: undefined,
      });

      const result = calculateTotals(order);
      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.fees).toBe(0);
    });

    it('should calculate amount outstanding', () => {
      const order = createMockPrintavoOrder({
        order_total: 100,
        amount_paid: 30,
        amount_outstanding: undefined,
      });

      const result = calculateTotals(order);
      expect(result.amountOutstanding).toBe(70);
    });

    it('should use provided amount outstanding', () => {
      const order = createMockPrintavoOrder({
        order_total: 100,
        amount_paid: 30,
        amount_outstanding: 50,
      });

      const result = calculateTotals(order);
      expect(result.amountOutstanding).toBe(50);
    });

    it('should handle negative values as zero', () => {
      const order = createMockPrintavoOrder({
        order_subtotal: -10,
        sales_tax: -5,
        discount: -2,
        amount_paid: -15,
      });

      const result = calculateTotals(order);
      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.discount).toBe(0);
      expect(result.amountPaid).toBe(0);
    });

    it('should aggregate multiple fees', () => {
      const order = createMockPrintavoOrder({
        order_fees_attributes: [
          { id: 1, description: 'Fee 1', amount: 10, taxable: false },
          { id: 2, description: 'Fee 2', amount: 15, taxable: false },
          { id: 3, description: 'Fee 3', amount: 5, taxable: false },
        ],
      });

      const result = calculateTotals(order);
      expect(result.fees).toBe(30);
    });
  });

  describe('convertTimeline', () => {
    it('should convert timeline with all dates', () => {
      const order = createMockPrintavoOrder({
        created_at: '2025-11-21T18:35:47.684-05:00',
        updated_at: '2025-11-21T18:35:47.726-05:00',
        due_date: '2025-11-21T10:00:00.000-05:00',
        customer_due_date: '2025-11-20T00:00:00.000-05:00',
        payment_due_date: '2025-11-22T00:00:00.000-05:00',
      });

      const result = convertTimeline(order);
      expect(result.createdAt).toBe('2025-11-21T18:35:47.684-05:00');
      expect(result.updatedAt).toBe('2025-11-21T18:35:47.726-05:00');
      expect(result.dueDate).toBe('2025-11-21T10:00:00.000-05:00');
      expect(result.customerDueDate).toBe('2025-11-20T00:00:00.000-05:00');
      expect(result.paymentDueDate).toBe('2025-11-22T00:00:00.000-05:00');
    });

    it('should use createdAt as default for updatedAt when missing', () => {
      const order = createMockPrintavoOrder({
        created_at: '2025-11-21T18:35:47.684-05:00',
        updated_at: undefined,
      } as any);

      const result = convertTimeline(order);
      expect(result.updatedAt).toBe(result.createdAt);
    });

    it('should omit optional date fields when not provided', () => {
      const order = createMockPrintavoOrder({
        due_date: undefined,
        customer_due_date: undefined,
        payment_due_date: undefined,
      } as any);

      const result = convertTimeline(order);
      expect(result.dueDate).toBeUndefined();
      expect(result.customerDueDate).toBeUndefined();
      expect(result.paymentDueDate).toBeUndefined();
    });
  });

  describe('transformPrintavoToStrapi', () => {
    it('should transform complete valid order', () => {
      const printavoOrder = createMockPrintavoOrder();
      const result = transformPrintavoToStrapi(printavoOrder);

      expect(result.printavoId).toBe('21199730');
      expect(result.customer.name).toBe('Randy Ramsey');
      expect(result.customer.email).toBe('r.ramsey10@yahoo.com');
      expect(result.status).toBe(OrderStatus.QUOTE);
      expect(result.shippingAddress).toBeDefined();
      expect(result.shippingAddress?.city).toBe('Essex');
      expect(result.published).toBe(true);
    });

    it('should skip invalid shipping address but continue', () => {
      const printavoOrder = createMockPrintavoOrder({
        order_addresses_attributes: [
          {
            id: 1,
            name: 'Customer Shipping',
            address1: '',
            city: '',
            state: '',
            zip: '',
          },
        ],
      });

      const result = transformPrintavoToStrapi(printavoOrder);
      expect(result.shippingAddress).toBeUndefined();
      expect(result.printavoId).toBe('21199730');
    });

    it('should handle empty line items', () => {
      const printavoOrder = createMockPrintavoOrder({
        lineitems_attributes: [],
      });

      const result = transformPrintavoToStrapi(printavoOrder);
      expect(result.lineItems).toEqual([]);
    });

    it('should handle multiple line items', () => {
      const printavoOrder = createMockPrintavoOrder({
        lineitems_attributes: [
          {
            id: 1,
            style_description: 'Item 1',
            total_quantities: 10,
            unit_cost: 5,
            taxable: true,
          },
          {
            id: 2,
            style_description: 'Item 2',
            total_quantities: 20,
            unit_cost: 3,
            taxable: false,
          },
        ],
      });

      const result = transformPrintavoToStrapi(printavoOrder);
      expect(result.lineItems).toHaveLength(2);
      expect(result.lineItems[0].quantity).toBe(10);
      expect(result.lineItems[1].quantity).toBe(20);
    });

    it('should include optional fields when provided', () => {
      const printavoOrder = createMockPrintavoOrder({
        order_nickname: 'Test Order',
        public_hash: 'abc123',
        production_notes: 'Rush order',
        notes: 'Special instructions',
        approved: true,
      });

      const result = transformPrintavoToStrapi(printavoOrder);
      expect(result.orderNickname).toBe('Test Order');
      expect(result.publicHash).toBe('abc123');
      expect(result.productionNotes).toBe('Rush order');
      expect(result.notes).toBe('Special instructions');
      expect(result.approved).toBe(true);
    });

    it('should throw PrintavoMapperError on invalid email', () => {
      const printavoOrder = createMockPrintavoOrder({
        customer: {
          full_name: 'John Doe',
          email: 'invalid',
          company: '',
        },
      });

      expect(() => transformPrintavoToStrapi(printavoOrder)).toThrow(PrintavoMapperError);
    });

    it('should throw PrintavoMapperError on missing customer name', () => {
      const printavoOrder = createMockPrintavoOrder({
        customer: {
          full_name: '',
          email: 'john@example.com',
          company: '',
        },
      });

      expect(() => transformPrintavoToStrapi(printavoOrder)).toThrow(PrintavoMapperError);
    });

    it('should validate transformed order', () => {
      const printavoOrder = createMockPrintavoOrder();
      const result = transformPrintavoToStrapi(printavoOrder);
      const validation = validateStrapiOrder(result);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('transformPrintavoOrdersBatch', () => {
    it('should transform batch of valid orders', () => {
      const orders = [
        createMockPrintavoOrder({ id: 1, customer: { full_name: 'Customer 1', email: 'c1@example.com' } }),
        createMockPrintavoOrder({ id: 2, customer: { full_name: 'Customer 2', email: 'c2@example.com' } }),
        createMockPrintavoOrder({ id: 3, customer: { full_name: 'Customer 3', email: 'c3@example.com' } }),
      ];

      const result = transformPrintavoOrdersBatch(orders);
      expect(result.successful).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle mix of valid and invalid orders', () => {
      const orders = [
        createMockPrintavoOrder({ id: 1, customer: { full_name: 'Customer 1', email: 'c1@example.com' } }),
        createMockPrintavoOrder({ id: 2, customer: { full_name: '', email: 'c2@example.com' } }),
        createMockPrintavoOrder({ id: 3, customer: { full_name: 'Customer 3', email: 'invalid' } }),
      ];

      const result = transformPrintavoOrdersBatch(orders);
      expect(result.successful).toHaveLength(1);
      expect(result.errors).toHaveLength(2);
    });

    it('should record error details for failed transformations', () => {
      const orders = [
        createMockPrintavoOrder({ id: 1, customer: { full_name: 'Valid', email: 'v@example.com' } }),
        createMockPrintavoOrder({ id: 2, customer: { full_name: '', email: 'i@example.com' } }),
      ];

      const result = transformPrintavoOrdersBatch(orders);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].orderId).toBe(2);
      expect(result.errors[0].error).toContain('Customer name');
    });

    it('should handle empty batch', () => {
      const result = transformPrintavoOrdersBatch([]);
      expect(result.successful).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle batch with all invalid orders', () => {
      const orders = [
        createMockPrintavoOrder({ id: 1, customer: { full_name: '', email: 'i1@example.com' } }),
        createMockPrintavoOrder({ id: 2, customer: { full_name: '', email: 'i2@example.com' } }),
      ];

      const result = transformPrintavoOrdersBatch(orders);
      expect(result.successful).toHaveLength(0);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle null address2 field', () => {
      const printavoAddr: PrintavoAddress = {
        name: 'Test',
        address1: '123 Main',
        address2: null as any,
        city: 'Boston',
        state: 'MA',
        zip: '02101',
      };

      const result = convertAddress(printavoAddr);
      expect(result.street2).toBeUndefined();
    });

    it('should handle order with no addresses', () => {
      const order = createMockPrintavoOrder({
        order_addresses_attributes: [],
      });

      const result = transformPrintavoToStrapi(order);
      expect(result.billingAddress).toBeUndefined();
      expect(result.shippingAddress).toBeUndefined();
      expect(result.printavoId).toBe('21199730');
    });

    it('should handle very large order totals', () => {
      const order = createMockPrintavoOrder({
        order_total: 999999999,
        order_subtotal: 999999999,
      });

      const totals = calculateTotals(order);
      expect(totals.total).toBe(999999999);
      expect(totals.subtotal).toBe(999999999);
    });

    it('should handle dates with various timezone formats', () => {
      const order = createMockPrintavoOrder({
        created_at: '2025-11-21T18:35:47.684-05:00',
        updated_at: '2025-11-21T18:35:47.726Z',
        due_date: '2025-11-21T10:00:00.000+00:00',
      });

      const timeline = convertTimeline(order);
      expect(timeline.createdAt).toBeDefined();
      expect(timeline.updatedAt).toBeDefined();
      expect(timeline.dueDate).toBeDefined();
    });

    it('should handle customer with only required fields', () => {
      const customer = {
        full_name: 'John Doe',
        email: 'john@example.com',
      };

      const result = convertCustomer(customer);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.firstName).toBeUndefined();
      expect(result.lastName).toBeUndefined();
    });

    it('should preserve order ID as string', () => {
      const order = createMockPrintavoOrder({ id: 21199730 });
      const result = transformPrintavoToStrapi(order);
      expect(result.printavoId).toBe('21199730');
      expect(typeof result.printavoId).toBe('string');
    });
  });
});
