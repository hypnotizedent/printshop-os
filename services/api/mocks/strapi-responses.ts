/**
 * Mock Strapi API Responses
 * Comprehensive collection of mock Strapi responses for testing
 */

export interface MockStrapiResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

/**
 * Successful Strapi responses
 */
export const mockStrapiSuccessResponses = {
  /**
   * Order created successfully
   */
  order_created: {
    data: {
      id: 1,
      documentId: 'stapi001',
      printavoId: '21199730',
      status: 'completed',
      customer: {
        id: 101,
        name: 'John Smith',
        email: 'john.smith@example.com',
        company: 'Acme Corp',
      },
      totals: {
        subtotal: 752.0,
        tax: 60.16,
        discount: 0,
        shipping: 45.0,
        fees: 95.0,
        total: 751.78,
        amountPaid: 751.78,
        amountOutstanding: 0,
      },
      lineItems: [
        {
          id: '92211045',
          description: '100pc Screen Print Shirt',
          quantity: 100,
          unitCost: 7.52,
          taxable: true,
          total: 752.0,
        },
      ],
      timeline: {
        createdAt: '2025-11-01T10:30:00.000-05:00',
        updatedAt: '2025-11-15T14:22:15.000-05:00',
        dueDate: '2025-12-15T17:00:00.000-05:00',
      },
      published: true,
      createdAt: '2025-11-21T14:00:00Z',
      updatedAt: '2025-11-21T14:00:00Z',
    },
    meta: {
      pagination: {
        page: 1,
        pageSize: 25,
        pageCount: 1,
        total: 1,
      },
    },
  },

  /**
   * Single order retrieved
   */
  order_retrieved: {
    data: {
      id: 1,
      documentId: 'stapi001',
      printavoId: '21199730',
      status: 'completed',
      customer: {
        id: 101,
        name: 'John Smith',
        email: 'john.smith@example.com',
        company: 'Acme Corp',
        firstName: 'John',
        lastName: 'Smith',
      },
      billingAddress: {
        street: '123 Business Ave',
        street2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      },
      shippingAddress: {
        street: '123 Business Ave',
        street2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      },
      totals: {
        subtotal: 752.0,
        tax: 60.16,
        discount: 0,
        shipping: 45.0,
        fees: 95.0,
        total: 751.78,
        amountPaid: 751.78,
        amountOutstanding: 0,
      },
      lineItems: [
        {
          id: '92211045',
          description: '100pc Screen Print Shirt',
          category: 'Apparel',
          quantity: 100,
          unitCost: 7.52,
          taxable: true,
          total: 752.0,
        },
      ],
      timeline: {
        createdAt: '2025-11-01T10:30:00.000-05:00',
        updatedAt: '2025-11-15T14:22:15.000-05:00',
        dueDate: '2025-12-15T17:00:00.000-05:00',
        customerDueDate: '2025-12-15T00:00:00.000-05:00',
        paymentDueDate: '2025-12-15T00:00:00.000-05:00',
      },
      orderNickname: 'Premium Polo Order',
      publicHash: 'a1b2c3d4e5f6g7h8i9j0',
      productionNotes: 'Use high quality inks. No pilling.',
      notes: 'Customer requested expedited production.',
      approved: true,
      published: true,
      createdAt: '2025-11-21T14:00:00Z',
      updatedAt: '2025-11-21T14:00:00Z',
    },
  },

  /**
   * Orders list with pagination
   */
  orders_list_paginated: {
    data: [
      {
        id: 1,
        documentId: 'stapi001',
        printavoId: '21199730',
        status: 'completed',
        customer: { name: 'John Smith', email: 'john@example.com' },
        totals: { total: 751.78, amountPaid: 751.78 },
      },
      {
        id: 2,
        documentId: 'stapi002',
        printavoId: '21199731',
        status: 'in_production',
        customer: { name: 'Sarah Johnson', email: 'sarah@example.com' },
        totals: { total: 687.5, amountPaid: 0 },
      },
      {
        id: 3,
        documentId: 'stapi003',
        printavoId: '21199732',
        status: 'quote',
        customer: { name: 'Michael Chen', email: 'michael@example.com' },
        totals: { total: 4687.5, amountPaid: 0 },
      },
      {
        id: 4,
        documentId: 'stapi004',
        printavoId: '21199733',
        status: 'ready_to_ship',
        customer: { name: 'Amanda Rodriguez', email: 'amanda@example.com' },
        totals: { total: 237.63, amountPaid: 237.63 },
      },
      {
        id: 5,
        documentId: 'stapi005',
        printavoId: '21199734',
        status: 'shipped',
        customer: { name: 'David Thompson', email: 'david@example.com' },
        totals: { total: 2922.5, amountPaid: 2922.5 },
      },
    ],
    meta: {
      pagination: {
        page: 1,
        pageSize: 25,
        pageCount: 1,
        total: 5,
      },
    },
  },

  /**
   * Quote with pricing details
   */
  quote_with_pricing: {
    data: {
      id: 10,
      documentId: 'quote001',
      quoteNumber: 'Q-2025-001',
      customer: {
        name: 'Demo Customer',
        email: 'demo@example.com',
      },
      lineItems: [
        {
          description: '100pc Screen Print, 1-color, left chest',
          quantity: 100,
          basePrice: 7.5,
          markup: 0.25,
          unitCost: 9.375,
          total: 937.5,
        },
      ],
      pricing: {
        subtotal: 937.5,
        setupFee: 50.0,
        screenFee: 0,
        rushFee: 0,
        shippingCost: 45.0,
        subtotalBeforeTax: 1032.5,
        taxRate: 0.08,
        tax: 82.6,
        total: 1115.1,
        profitMargin: 25,
      },
      status: 'draft',
      published: true,
      createdAt: '2025-11-21T14:00:00Z',
    },
  },

  /**
   * Empty orders list
   */
  orders_list_empty: {
    data: [],
    meta: {
      pagination: {
        page: 1,
        pageSize: 25,
        pageCount: 0,
        total: 0,
      },
    },
  },

  /**
   * Order updated successfully
   */
  order_updated: {
    data: {
      id: 1,
      documentId: 'stapi001',
      printavoId: '21199730',
      status: 'ready_to_ship',
      customer: { name: 'John Smith', email: 'john@example.com' },
      totals: { total: 751.78, amountPaid: 751.78 },
      updatedAt: '2025-11-21T15:30:00Z',
    },
  },

  /**
   * Sync completed successfully
   */
  sync_completed: {
    data: {
      syncId: 'sync-001',
      status: 'completed',
      startedAt: '2025-11-21T14:00:00Z',
      completedAt: '2025-11-21T14:05:30Z',
      totalProcessed: 100,
      successCount: 98,
      errorCount: 2,
      errors: [
        {
          orderId: 99999999,
          error: 'Customer email validation failed',
        },
        {
          orderId: 88888888,
          error: 'Invalid address format',
        },
      ],
      details: {
        ordersCreated: 50,
        ordersUpdated: 48,
        ordersSkipped: 2,
      },
    },
  },
};

/**
 * Error responses
 */
export const mockStrapiErrorResponses = {
  /**
   * 401 Unauthorized - Invalid token
   */
  unauthorized_401: {
    status: 401,
    error: {
      status: 401,
      name: 'UnauthorizedError',
      message: 'Invalid token',
      details: {
        message: 'Invalid token',
      },
    },
  },

  /**
   * 403 Forbidden - Insufficient permissions
   */
  forbidden_403: {
    status: 403,
    error: {
      status: 403,
      name: 'ForbiddenError',
      message: 'You do not have permission to perform this action',
      details: {
        message: 'Access denied',
      },
    },
  },

  /**
   * 404 Not Found - Resource doesn't exist
   */
  not_found_404: {
    status: 404,
    error: {
      status: 404,
      name: 'NotFoundError',
      message: 'Order with ID 1 not found',
      details: {
        message: 'Order not found',
      },
    },
  },

  /**
   * 400 Bad Request - Validation error
   */
  validation_error_400: {
    status: 400,
    error: {
      status: 400,
      name: 'ValidationError',
      message: 'Validation failed',
      details: {
        errors: [
          {
            path: ['printavoId'],
            message: 'printavoId is required',
          },
          {
            path: ['customer', 'email'],
            message: 'Email must be a valid email address',
          },
          {
            path: ['totals', 'total'],
            message: 'Total must be a positive number',
          },
        ],
      },
    },
  },

  /**
   * 409 Conflict - Duplicate order
   */
  duplicate_409: {
    status: 409,
    error: {
      status: 409,
      name: 'ConflictError',
      message: 'Order with printavoId 21199730 already exists',
      details: {
        existingOrderId: 'stapi001',
      },
    },
  },

  /**
   * 500 Internal Server Error
   */
  server_error_500: {
    status: 500,
    error: {
      status: 500,
      name: 'InternalServerError',
      message: 'An unexpected error occurred',
      details: {
        message: 'Database connection failed',
      },
    },
  },

  /**
   * 503 Service Unavailable
   */
  service_unavailable_503: {
    status: 503,
    error: {
      status: 503,
      name: 'ServiceUnavailableError',
      message: 'Strapi service is temporarily unavailable',
    },
  },

  /**
   * 429 Too Many Requests
   */
  rate_limit_429: {
    status: 429,
    error: {
      status: 429,
      name: 'TooManyRequestsError',
      message: 'Rate limit exceeded',
      details: {
        retryAfter: 60,
      },
    },
  },
};

/**
 * Edge cases and special scenarios
 */
export const mockStrapiEdgeCases = {
  /**
   * Order with minimal fields
   */
  order_minimal: {
    data: {
      id: 100,
      documentId: 'minimal001',
      printavoId: '21199740',
      status: 'quote',
      customer: {
        id: 200,
        name: 'Minimal Customer',
        email: 'minimal@example.com',
      },
      totals: {
        subtotal: 0,
        tax: 0,
        discount: 0,
        shipping: 0,
        fees: 0,
        total: 0,
        amountPaid: 0,
        amountOutstanding: 0,
      },
      lineItems: [],
      timeline: {
        createdAt: '2025-11-20T12:00:00Z',
        updatedAt: '2025-11-20T12:00:00Z',
      },
      published: true,
    },
  },

  /**
   * Order with very large totals
   */
  order_large_amounts: {
    data: {
      id: 101,
      documentId: 'large001',
      printavoId: '99999999',
      status: 'completed',
      customer: {
        name: 'Enterprise Customer',
        email: 'enterprise@example.com',
      },
      totals: {
        subtotal: 25000000.0,
        tax: 2000000.0,
        discount: 0,
        shipping: 50000.0,
        fees: 50000.0,
        total: 27100000.0,
        amountPaid: 27100000.0,
        amountOutstanding: 0,
      },
      lineItems: [
        {
          id: '999999999',
          description: '10000pc Premium Branded Items',
          quantity: 10000,
          unitCost: 2500.0,
          total: 25000000.0,
        },
      ],
      timeline: {
        createdAt: '2025-11-20T12:00:00Z',
        updatedAt: '2025-11-20T12:00:00Z',
      },
      published: true,
    },
  },

  /**
   * Order with special characters
   */
  order_special_chars: {
    data: {
      id: 102,
      documentId: 'special001',
      printavoId: '21199742',
      status: 'completed',
      customer: {
        name: "D'Angelo O'Brien",
        email: 'dob@example.com',
        company: "O'Brien & Sons, Inc.",
      },
      billingAddress: {
        street: '123 Main St. Apt #4B',
        city: "Saint-Jean-sur-Richelieu",
        state: 'QC',
        zip: 'J3B 1R3',
        country: 'CA',
      },
      shippingAddress: {
        street: '123 Main St. Apt #4B',
        city: "Saint-Jean-sur-Richelieu",
        state: 'QC',
        zip: 'J3B 1R3',
        country: 'CA',
      },
      notes: 'Rush order! "Must ship" by Friday @ 5PM. Use UPS & sign on delivery.',
      productionNotes: "Customer's brand guidelines: don't use Comic Sans. Use Helvetica Neue.",
      published: true,
    },
  },

  /**
   * Paginated response with multiple pages
   */
  orders_paginated_page_2: {
    data: [
      {
        id: 6,
        documentId: 'stapi006',
        printavoId: '21199735',
        status: 'completed',
        customer: { name: 'Jessica Martinez', email: 'jessica@example.com' },
        totals: { total: 450.0 },
      },
      {
        id: 7,
        documentId: 'stapi007',
        printavoId: '21199736',
        status: 'in_production',
        customer: { name: 'Robert Williams', email: 'robert@example.com' },
        totals: { total: 1250.0 },
      },
    ],
    meta: {
      pagination: {
        page: 2,
        pageSize: 2,
        pageCount: 3,
        total: 7,
      },
    },
  },

  /**
   * Order with all optional fields populated
   */
  order_full_details: {
    data: {
      id: 1,
      documentId: 'stapi001',
      printavoId: '21199730',
      status: 'completed',
      customer: {
        id: 101,
        name: 'John Smith',
        email: 'john.smith@example.com',
        company: 'Acme Corp',
        firstName: 'John',
        lastName: 'Smith',
      },
      billingAddress: {
        street: '123 Business Ave',
        street2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      },
      shippingAddress: {
        street: '123 Business Ave',
        street2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      },
      totals: {
        subtotal: 752.0,
        tax: 60.16,
        discount: 0,
        shipping: 45.0,
        fees: 95.0,
        total: 751.78,
        amountPaid: 751.78,
        amountOutstanding: 0,
      },
      lineItems: [
        {
          id: '92211045',
          description: '100pc Screen Print Shirt',
          category: 'Apparel',
          quantity: 100,
          unitCost: 7.52,
          taxable: true,
          total: 752.0,
        },
      ],
      timeline: {
        createdAt: '2025-11-01T10:30:00.000-05:00',
        updatedAt: '2025-11-15T14:22:15.000-05:00',
        dueDate: '2025-12-15T17:00:00.000-05:00',
        customerDueDate: '2025-12-15T00:00:00.000-05:00',
        paymentDueDate: '2025-12-15T00:00:00.000-05:00',
      },
      orderNickname: 'Premium Polo Order',
      publicHash: 'a1b2c3d4e5f6g7h8i9j0',
      productionNotes: 'Use high quality inks. No pilling.',
      notes: 'Customer requested expedited production.',
      approved: true,
      published: true,
      createdAt: '2025-11-21T14:00:00Z',
      updatedAt: '2025-11-21T14:00:00Z',
    },
  },
};

/**
 * Create mock Strapi response
 */
export function createMockStrapiResponse(
  data: any,
  status: number = 200,
  pagination?: { page: number; pageSize: number; pageCount: number; total: number },
): MockStrapiResponse {
  const response: MockStrapiResponse = {
    status,
    data,
    headers: {
      'content-type': 'application/json',
    },
  };

  if (pagination) {
    (response.data as any).meta = {
      pagination,
    };
  }

  return response;
}

/**
 * Get mock order by documentId
 */
export function getMockStrapiOrder(documentId: string): any {
  const allOrders = [
    ...Object.values(mockStrapiSuccessResponses),
    ...Object.values(mockStrapiEdgeCases),
  ].filter((item) => item?.data?.documentId === documentId);

  return allOrders.length > 0 ? allOrders[0].data : null;
}
