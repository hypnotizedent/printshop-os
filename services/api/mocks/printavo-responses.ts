/**
 * Mock Printavo API Responses
 * Comprehensive collection of realistic Printavo API responses for testing
 */

export interface MockPrintavoResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

/**
 * Successful Printavo order responses - realistic examples
 */
export const mockPrintavoSuccessResponses = {
  /**
   * 100pc screen print, 1-color, left chest
   * Expected pricing: $751.78 retail
   */
  order_100pc_1color_chest: {
    id: 21199730,
    customer: {
      id: 12345,
      full_name: 'John Smith',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      company: 'Acme Corp',
      customer_id: 12345,
    },
    order_addresses_attributes: [
      {
        id: 48187608,
        name: 'Customer Billing',
        customer_name: 'John Smith',
        company_name: 'Acme Corp',
        address1: '123 Business Ave',
        address2: 'Suite 100',
        city: 'New York',
        state: 'New York',
        state_iso: 'NY',
        country: 'United States',
        country_iso: 'US',
        zip: '10001',
      },
      {
        id: 48187609,
        name: 'Customer Shipping',
        customer_name: 'John Smith',
        company_name: 'Acme Corp',
        address1: '123 Business Ave',
        address2: 'Suite 100',
        city: 'New York',
        state: 'New York',
        state_iso: 'NY',
        country: 'United States',
        country_iso: 'US',
        zip: '10001',
      },
    ],
    lineitems_attributes: [
      {
        id: 92211045,
        style_description: '100pc Screen Print Shirt',
        category: 'Apparel',
        total_quantities: 100,
        unit_cost: 7.52,
        taxable: true,
        goods_status: 'delivered',
        style_number: 'SH-001',
        color: 'Navy',
        size_s: 10,
        size_m: 40,
        size_l: 30,
        size_xl: 20,
      },
    ],
    order_fees_attributes: [
      {
        id: 10564577,
        description: 'Screen Setup',
        taxable: false,
        amount: 50.0,
      },
      {
        id: 10564578,
        description: 'Shipping',
        taxable: false,
        amount: 45.0,
      },
    ],
    order_total: 751.78,
    order_subtotal: 752.0,
    sales_tax: 60.16,
    discount: 0,
    amount_paid: 751.78,
    amount_outstanding: 0,
    total_untaxed: 752.0,
    orderstatus: {
      id: 1,
      name: 'COMPLETED',
      color: '#00AA00',
    },
    due_date: '2025-12-15T17:00:00.000-05:00',
    customer_due_date: '2025-12-15T00:00:00.000-05:00',
    payment_due_date: '2025-12-15T00:00:00.000-05:00',
    created_at: '2025-11-01T10:30:00.000-05:00',
    updated_at: '2025-11-15T14:22:15.000-05:00',
    order_nickname: 'Premium Polo Order',
    public_hash: 'a1b2c3d4e5f6g7h8i9j0',
    production_notes: 'Use high quality inks. No pilling.',
    notes: 'Customer requested expedited production.',
    approved: true,
    stats: {
      paid: true,
    },
  },

  /**
   * Multi-color embroidered caps
   */
  order_caps_embroidery_multicolor: {
    id: 21199731,
    customer: {
      id: 12346,
      full_name: 'Sarah Johnson',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.j@example.com',
      company: 'Tech Innovations Inc',
      customer_id: 12346,
    },
    order_addresses_attributes: [
      {
        id: 48187610,
        name: 'Customer Billing',
        customer_name: 'Sarah Johnson',
        company_name: 'Tech Innovations Inc',
        address1: '456 Tech Drive',
        city: 'San Francisco',
        state: 'California',
        state_iso: 'CA',
        country: 'United States',
        country_iso: 'US',
        zip: '94102',
      },
      {
        id: 48187611,
        name: 'Customer Shipping',
        customer_name: 'Sarah Johnson',
        company_name: 'Tech Innovations Inc',
        address1: '456 Tech Drive',
        city: 'San Francisco',
        state: 'California',
        state_iso: 'CA',
        country: 'United States',
        country_iso: 'US',
        zip: '94102',
      },
    ],
    lineitems_attributes: [
      {
        id: 92211046,
        style_description: '50pc Embroidered Caps (3-color)',
        category: 'Headwear',
        total_quantities: 50,
        unit_cost: 12.5,
        taxable: true,
        goods_status: 'in_production',
        style_number: 'CAP-001',
        color: 'Black/White/Red',
      },
    ],
    order_fees_attributes: [
      {
        id: 10564579,
        description: 'Digitization',
        taxable: false,
        amount: 75.0,
      },
      {
        id: 10564580,
        description: 'Rush Shipping',
        taxable: false,
        amount: 125.0,
      },
    ],
    order_total: 687.5,
    order_subtotal: 625.0,
    sales_tax: 62.5,
    discount: 0,
    amount_paid: 0,
    amount_outstanding: 687.5,
    total_untaxed: 625.0,
    orderstatus: {
      id: 2,
      name: 'IN PRODUCTION',
      color: '#FFAA00',
    },
    due_date: '2025-12-20T17:00:00.000-05:00',
    customer_due_date: '2025-12-20T00:00:00.000-05:00',
    payment_due_date: '2025-12-20T00:00:00.000-05:00',
    created_at: '2025-11-10T09:15:00.000-05:00',
    updated_at: '2025-11-20T11:45:30.000-05:00',
    order_nickname: 'Tech Summit Branded Caps',
    public_hash: 'x1y2z3a4b5c6d7e8f9g0',
    production_notes: 'Embroidery on front. High stitch count.',
    notes: 'Call if any issues.',
    approved: true,
    stats: {
      paid: false,
    },
  },

  /**
   * Quote - pending approval
   */
  order_quote_pending: {
    id: 21199732,
    customer: {
      id: 12347,
      full_name: 'Michael Chen',
      email: 'michael@example.com',
      company: 'Chen Enterprises',
      customer_id: 12347,
    },
    order_addresses_attributes: [
      {
        id: 48187612,
        name: 'Customer Billing',
        customer_name: 'Michael Chen',
        company_name: 'Chen Enterprises',
        address1: '',
        city: '',
        state: '',
        country: 'US',
        zip: '',
      },
      {
        id: 48187613,
        name: 'Customer Shipping',
        customer_name: 'Michael Chen',
        company_name: 'Chen Enterprises',
        address1: '789 Commerce St',
        city: 'Boston',
        state: 'Massachusetts',
        state_iso: 'MA',
        country: 'United States',
        country_iso: 'US',
        zip: '02101',
      },
    ],
    lineitems_attributes: [
      {
        id: 92211047,
        style_description: '250pc Full Color Printed Hoodies',
        category: 'Apparel',
        total_quantities: 250,
        unit_cost: 18.75,
        taxable: true,
        goods_status: 'quote',
        style_number: 'HOOD-001',
      },
    ],
    order_fees_attributes: [],
    order_total: 4687.5,
    order_subtotal: 4687.5,
    sales_tax: 0,
    discount: 0,
    amount_paid: 0,
    amount_outstanding: 4687.5,
    total_untaxed: 4687.5,
    orderstatus: {
      id: 3,
      name: 'QUOTE',
      color: '#0000FF',
    },
    due_date: '2025-12-31T17:00:00.000-05:00',
    customer_due_date: null,
    payment_due_date: null,
    created_at: '2025-11-18T16:20:00.000-05:00',
    updated_at: '2025-11-18T16:20:00.000-05:00',
    order_nickname: 'Holiday Company Merchandise Quote',
    public_hash: 'p1q2r3s4t5u6v7w8x9y0',
    production_notes: '',
    notes: 'Awaiting customer feedback.',
    approved: false,
    stats: {
      paid: false,
    },
  },

  /**
   * Small order - ready to ship
   */
  order_ready_to_ship: {
    id: 21199733,
    customer: {
      id: 12348,
      full_name: 'Amanda Rodriguez',
      email: 'amanda@example.com',
      company: 'Rodriguez Marketing',
      customer_id: 12348,
    },
    order_addresses_attributes: [
      {
        id: 48187614,
        name: 'Customer Billing',
        customer_name: 'Amanda Rodriguez',
        company_name: 'Rodriguez Marketing',
        address1: '321 Madison Ave',
        city: 'Chicago',
        state: 'Illinois',
        state_iso: 'IL',
        country: 'United States',
        country_iso: 'US',
        zip: '60601',
      },
      {
        id: 48187615,
        name: 'Customer Shipping',
        customer_name: 'Amanda Rodriguez',
        company_name: 'Rodriguez Marketing',
        address1: '321 Madison Ave',
        city: 'Chicago',
        state: 'Illinois',
        state_iso: 'IL',
        country: 'United States',
        country_iso: 'US',
        zip: '60601',
      },
    ],
    lineitems_attributes: [
      {
        id: 92211048,
        style_description: '25pc Coffee Mugs - Full Color',
        category: 'Drinkware',
        total_quantities: 25,
        unit_cost: 8.5,
        taxable: true,
        goods_status: 'ready_to_ship',
        style_number: 'MUG-001',
        color: 'White',
      },
    ],
    order_fees_attributes: [
      {
        id: 10564581,
        description: 'Setup Fee',
        taxable: false,
        amount: 25.0,
      },
    ],
    order_total: 237.63,
    order_subtotal: 212.5,
    sales_tax: 17.0,
    discount: 0,
    amount_paid: 237.63,
    amount_outstanding: 0,
    total_untaxed: 212.5,
    orderstatus: {
      id: 4,
      name: 'READY TO SHIP',
      color: '#00FF00',
    },
    due_date: '2025-11-25T17:00:00.000-05:00',
    customer_due_date: '2025-11-25T00:00:00.000-05:00',
    payment_due_date: '2025-11-25T00:00:00.000-05:00',
    created_at: '2025-11-15T08:00:00.000-05:00',
    updated_at: '2025-11-21T14:30:00.000-05:00',
    order_nickname: 'Marketing Conference Merch',
    public_hash: 'k1l2m3n4o5p6q7r8s9t0',
    production_notes: '',
    notes: 'Ready for shipment.',
    approved: true,
    stats: {
      paid: true,
    },
  },

  /**
   * Large order - shipped
   */
  order_shipped: {
    id: 21199734,
    customer: {
      id: 12349,
      full_name: 'David Thompson',
      email: 'david.t@example.com',
      company: 'Thompson Industries',
      customer_id: 12349,
    },
    order_addresses_attributes: [
      {
        id: 48187616,
        name: 'Customer Billing',
        customer_name: 'David Thompson',
        company_name: 'Thompson Industries',
        address1: '555 Industrial Blvd',
        city: 'Detroit',
        state: 'Michigan',
        state_iso: 'MI',
        country: 'United States',
        country_iso: 'US',
        zip: '48201',
      },
      {
        id: 48187617,
        name: 'Customer Shipping',
        customer_name: 'David Thompson',
        company_name: 'Thompson Industries',
        address1: '555 Industrial Blvd',
        city: 'Detroit',
        state: 'Michigan',
        state_iso: 'MI',
        country: 'United States',
        country_iso: 'US',
        zip: '48201',
      },
    ],
    lineitems_attributes: [
      {
        id: 92211049,
        style_description: '500pc Branded T-Shirts (4-color front)',
        category: 'Apparel',
        total_quantities: 500,
        unit_cost: 5.25,
        taxable: true,
        goods_status: 'shipped',
        style_number: 'TSHIRT-BULK-001',
        color: 'Assorted',
        size_xs: 50,
        size_s: 100,
        size_m: 150,
        size_l: 100,
        size_xl: 50,
      },
    ],
    order_fees_attributes: [
      {
        id: 10564582,
        description: 'Multi-Color Setup',
        taxable: false,
        amount: 150.0,
      },
      {
        id: 10564583,
        description: 'Standard Shipping',
        taxable: false,
        amount: 95.0,
      },
    ],
    order_total: 2922.5,
    order_subtotal: 2625.0,
    sales_tax: 210.0,
    discount: 0,
    amount_paid: 2922.5,
    amount_outstanding: 0,
    total_untaxed: 2625.0,
    orderstatus: {
      id: 5,
      name: 'SHIPPED',
      color: '#0088FF',
    },
    due_date: '2025-11-30T17:00:00.000-05:00',
    customer_due_date: '2025-11-30T00:00:00.000-05:00',
    payment_due_date: '2025-11-30T00:00:00.000-05:00',
    created_at: '2025-10-20T12:00:00.000-05:00',
    updated_at: '2025-11-20T09:45:30.000-05:00',
    order_nickname: 'Employee Uniform Order',
    public_hash: 'e1f2g3h4i5j6k7l8m9n0',
    production_notes: 'Quality assurance passed.',
    notes: 'Tracking #: 1Z999AA10123456784',
    approved: true,
    stats: {
      paid: true,
    },
  },

  /**
   * Batch order list response
   */
  order_batch_list: [
    {
      id: 21199735,
      customer: {
        id: 12350,
        full_name: 'Jessica Martinez',
        email: 'jessica@example.com',
        company: 'Martinez Design Co',
      },
      order_total: 450.0,
      orderstatus: { name: 'COMPLETED' },
      created_at: '2025-11-01T10:00:00.000-05:00',
    },
    {
      id: 21199736,
      customer: {
        id: 12351,
        full_name: 'Robert Williams',
        email: 'robert.w@example.com',
        company: 'Williams Print Group',
      },
      order_total: 1250.0,
      orderstatus: { name: 'IN PRODUCTION' },
      created_at: '2025-11-10T14:30:00.000-05:00',
    },
    {
      id: 21199737,
      customer: {
        id: 12352,
        full_name: 'Lisa Anderson',
        email: 'lisa.a@example.com',
        company: 'Anderson Events',
      },
      order_total: 875.5,
      orderstatus: { name: 'READY TO SHIP' },
      created_at: '2025-11-15T11:15:00.000-05:00',
    },
  ],

  /**
   * Empty order list
   */
  order_empty_list: [],
};

/**
 * Error responses
 */
export const mockPrintavoErrorResponses = {
  /**
   * 401 Unauthorized - Invalid API key
   */
  unauthorized_401: {
    status: 401,
    error: 'Unauthorized',
    message: 'Invalid API credentials',
    errors: {
      api_key: ['is invalid'],
    },
  },

  /**
   * 429 Too Many Requests - Rate limit exceeded
   */
  rate_limit_429: {
    status: 429,
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit of 100 requests per minute',
    retry_after: 60,
  },

  /**
   * 404 Not Found - Order doesn't exist
   */
  order_not_found_404: {
    status: 404,
    error: 'Not Found',
    message: 'Order with ID 99999999 not found',
  },

  /**
   * 400 Bad Request - Invalid order ID
   */
  invalid_order_id_400: {
    status: 400,
    error: 'Bad Request',
    message: 'Order ID must be a valid integer',
    errors: {
      id: ['is not an integer'],
    },
  },

  /**
   * 500 Internal Server Error
   */
  server_error_500: {
    status: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred. Please try again later.',
  },

  /**
   * 503 Service Unavailable
   */
  service_unavailable_503: {
    status: 503,
    error: 'Service Unavailable',
    message: 'The Printavo API is temporarily unavailable for maintenance.',
  },

  /**
   * 400 Validation Error
   */
  validation_error_400: {
    status: 400,
    error: 'Bad Request',
    message: 'Validation failed',
    errors: {
      customer: ['is required'],
      order_addresses_attributes: ['must have at least one address'],
    },
  },
};

/**
 * Edge cases and special scenarios
 */
export const mockPrintavoEdgeCases = {
  /**
   * Order with missing optional fields
   */
  order_minimal_fields: {
    id: 21199740,
    customer: {
      full_name: 'Minimal Customer',
      email: 'minimal@example.com',
    },
    order_addresses_attributes: [],
    lineitems_attributes: [],
    order_fees_attributes: [],
    order_total: 0,
    order_subtotal: 0,
    sales_tax: 0,
    discount: 0,
    amount_paid: 0,
    amount_outstanding: 0,
    orderstatus: {
      name: 'QUOTE',
    },
    created_at: '2025-11-20T12:00:00.000-05:00',
    updated_at: '2025-11-20T12:00:00.000-05:00',
  },

  /**
   * Order with null values
   */
  order_with_nulls: {
    id: 21199741,
    customer: {
      full_name: 'Null Test Customer',
      email: 'null.test@example.com',
      company: null,
      first_name: null,
      last_name: null,
    },
    order_addresses_attributes: [],
    lineitems_attributes: [],
    order_fees_attributes: null,
    order_total: 500,
    order_subtotal: 500,
    sales_tax: null,
    discount: null,
    amount_paid: null,
    amount_outstanding: null,
    orderstatus: {
      name: 'IN PRODUCTION',
      color: null,
    },
    due_date: null,
    customer_due_date: null,
    payment_due_date: null,
    created_at: '2025-11-20T12:00:00.000-05:00',
    updated_at: '2025-11-20T12:00:00.000-05:00',
    production_notes: null,
    notes: null,
    approved: null,
  },

  /**
   * Order with very large numbers
   */
  order_large_values: {
    id: 99999999,
    customer: {
      full_name: 'Big Order Customer',
      email: 'bigorder@example.com',
    },
    order_addresses_attributes: [
      {
        name: 'Customer Shipping',
        address1: '1 Billionaire Lane',
        city: 'Wealthy City',
        state: 'CA',
        zip: '90001',
      },
    ],
    lineitems_attributes: [
      {
        id: 999999999,
        style_description: '10000pc Premium Branded Items',
        total_quantities: 10000,
        unit_cost: 2500.0,
        taxable: true,
      },
    ],
    order_fees_attributes: [
      {
        id: 999999,
        description: 'Premium Handling',
        amount: 50000.0,
        taxable: false,
      },
    ],
    order_total: 25050000.0,
    order_subtotal: 25000000.0,
    sales_tax: 2000000.0,
    discount: 0,
    amount_paid: 25050000.0,
    amount_outstanding: 0,
    orderstatus: {
      name: 'COMPLETED',
    },
    created_at: '2025-11-20T12:00:00.000-05:00',
    updated_at: '2025-11-20T12:00:00.000-05:00',
  },

  /**
   * Order with special characters in notes
   */
  order_special_chars: {
    id: 21199742,
    customer: {
      full_name: "D'Angelo O'Brien",
      email: 'dob@example.com',
      company: "O'Brien & Sons, Inc.",
    },
    order_addresses_attributes: [
      {
        name: 'Customer Shipping',
        address1: '123 Main St. Apt #4B',
        city: "Saint-Jean-sur-Richelieu",
        state: 'QC',
        zip: 'J3B 1R3',
      },
    ],
    lineitems_attributes: [
      {
        id: 1,
        style_description: 'Shirts w/ "Special" Design & Stitching',
        total_quantities: 50,
        unit_cost: 15.0,
        taxable: true,
      },
    ],
    order_fees_attributes: [],
    order_total: 750.0,
    order_subtotal: 750.0,
    sales_tax: 0,
    orderstatus: {
      name: 'COMPLETED',
    },
    created_at: '2025-11-20T12:00:00.000-05:00',
    updated_at: '2025-11-20T12:00:00.000-05:00',
    notes: 'Rush order! "Must ship" by Friday @ 5PM. Use UPS & sign on delivery.',
    production_notes: "Customer's brand guidelines: don't use Comic Sans. Use Helvetica Neue.",
  },

  /**
   * Order with multiple line items
   */
  order_multiple_items: {
    id: 21199743,
    customer: {
      full_name: 'Multi Item Customer',
      email: 'multi@example.com',
    },
    order_addresses_attributes: [
      {
        name: 'Customer Shipping',
        address1: '100 Market St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
      },
    ],
    lineitems_attributes: [
      {
        id: 1,
        style_description: 'T-Shirts (Screen Print)',
        total_quantities: 100,
        unit_cost: 7.5,
        taxable: true,
      },
      {
        id: 2,
        style_description: 'Hoodies (Full Color)',
        total_quantities: 50,
        unit_cost: 18.0,
        taxable: true,
      },
      {
        id: 3,
        style_description: 'Caps (Embroidered)',
        total_quantities: 75,
        unit_cost: 12.0,
        taxable: true,
      },
      {
        id: 4,
        style_description: 'Coffee Mugs (Printed)',
        total_quantities: 200,
        unit_cost: 4.5,
        taxable: true,
      },
      {
        id: 5,
        style_description: 'Tote Bags (Custom Print)',
        total_quantities: 150,
        unit_cost: 6.0,
        taxable: true,
      },
    ],
    order_fees_attributes: [
      { id: 1, description: 'Screen Setup', amount: 75.0, taxable: false },
      { id: 2, description: 'Embroidery Digitization', amount: 100.0, taxable: false },
      { id: 3, description: 'Express Shipping', amount: 250.0, taxable: false },
    ],
    order_total: 4287.5,
    order_subtotal: 3825.0,
    sales_tax: 306.0,
    discount: 0,
    amount_paid: 4287.5,
    amount_outstanding: 0,
    orderstatus: {
      name: 'COMPLETED',
    },
    created_at: '2025-11-20T12:00:00.000-05:00',
    updated_at: '2025-11-20T12:00:00.000-05:00',
  },
};

/**
 * Create mock response with headers
 */
export function createMockResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {},
): MockPrintavoResponse {
  return {
    status,
    data,
    headers: {
      'content-type': 'application/json',
      'x-total-count': data?.length?.toString() || '1',
      ...headers,
    },
  };
}

/**
 * Get a complete mock order by ID
 */
export function getMockOrder(id: string | number): any {
  const idNum = Number(id);
  switch (idNum) {
    case 21199730:
      return mockPrintavoSuccessResponses.order_100pc_1color_chest;
    case 21199731:
      return mockPrintavoSuccessResponses.order_caps_embroidery_multicolor;
    case 21199732:
      return mockPrintavoSuccessResponses.order_quote_pending;
    case 21199733:
      return mockPrintavoSuccessResponses.order_ready_to_ship;
    case 21199734:
      return mockPrintavoSuccessResponses.order_shipped;
    case 21199740:
      return mockPrintavoEdgeCases.order_minimal_fields;
    case 21199741:
      return mockPrintavoEdgeCases.order_with_nulls;
    case 99999999:
      return mockPrintavoEdgeCases.order_large_values;
    case 21199742:
      return mockPrintavoEdgeCases.order_special_chars;
    case 21199743:
      return mockPrintavoEdgeCases.order_multiple_items;
    default:
      return null;
  }
}

/**
 * Get all mock order IDs
 */
export function getAllMockOrderIds(): number[] {
  return [21199730, 21199731, 21199732, 21199733, 21199734, 21199740, 21199741, 99999999, 21199742, 21199743];
}
