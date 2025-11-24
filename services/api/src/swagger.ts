/**
 * Swagger/OpenAPI Documentation Configuration
 */

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'PrintShop OS Analytics API',
    version: '1.0.0',
    description: 'Comprehensive analytics and reporting API for PrintShop OS',
    contact: {
      name: 'PrintShop OS Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:3002',
      description: 'Development server',
    },
    {
      url: 'https://api.printshop-os.com',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Analytics',
      description: 'Analytics and reporting endpoints',
    },
  ],
  paths: {
    '/api/analytics': {
      get: {
        tags: ['Analytics'],
        summary: 'Get API information',
        description: 'Returns information about available analytics endpoints',
        responses: {
          200: {
            description: 'API information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    version: { type: 'string' },
                    endpoints: {
                      type: 'object',
                      properties: {
                        revenue: { type: 'string' },
                        products: { type: 'string' },
                        customers: { type: 'string' },
                        orders: { type: 'string' },
                        export: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/analytics/revenue': {
      get: {
        tags: ['Analytics'],
        summary: 'Get revenue analytics',
        description: 'Returns revenue metrics with time-series data, growth rates, and forecasting',
        parameters: [
          {
            name: 'period',
            in: 'query',
            description: 'Time period for analysis',
            schema: {
              type: 'string',
              enum: ['day', 'week', 'month', 'year'],
              default: 'month',
            },
          },
          {
            name: 'start_date',
            in: 'query',
            description: 'Start date (ISO 8601 format)',
            schema: {
              type: 'string',
              format: 'date',
            },
          },
          {
            name: 'end_date',
            in: 'query',
            description: 'End date (ISO 8601 format)',
            schema: {
              type: 'string',
              format: 'date',
            },
          },
          {
            name: 'group_by',
            in: 'query',
            description: 'Grouping for time-series data',
            schema: {
              type: 'string',
              enum: ['day', 'week', 'month'],
              default: 'month',
            },
          },
        ],
        responses: {
          200: {
            description: 'Revenue analytics data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total_revenue: { type: 'number' },
                    order_count: { type: 'integer' },
                    avg_order_value: { type: 'string' },
                    period_revenue: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          period: { type: 'string' },
                          revenue: { type: 'string' },
                          orders: { type: 'integer' },
                        },
                      },
                    },
                    growth_rate: { type: 'number' },
                    forecast_next_period: { type: 'number' },
                    period: { type: 'string' },
                    start_date: { type: 'string' },
                    end_date: { type: 'string' },
                    cached: { type: 'boolean' },
                  },
                },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/analytics/products': {
      get: {
        tags: ['Analytics'],
        summary: 'Get product analytics',
        description: 'Returns product performance metrics, top sellers, and trending products',
        parameters: [
          {
            name: 'period',
            in: 'query',
            description: 'Time period for analysis',
            schema: {
              type: 'string',
              enum: ['month', 'quarter', 'year'],
              default: 'month',
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of products to return',
            schema: {
              type: 'integer',
              default: 10,
            },
          },
          {
            name: 'sort_by',
            in: 'query',
            description: 'Sort products by metric',
            schema: {
              type: 'string',
              enum: ['revenue', 'units', 'margin'],
              default: 'revenue',
            },
          },
        ],
        responses: {
          200: {
            description: 'Product analytics data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    top_products: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          product_name: { type: 'string' },
                          category: { type: 'string' },
                          units_sold: { type: 'integer' },
                          revenue: { type: 'string' },
                          margin: { type: 'string' },
                          order_count: { type: 'integer' },
                          avg_unit_price: { type: 'string' },
                          rank: { type: 'integer' },
                        },
                      },
                    },
                    category_breakdown: { type: 'object' },
                    trending: { type: 'array' },
                    period: { type: 'string' },
                    sort_by: { type: 'string' },
                    cached: { type: 'boolean' },
                  },
                },
              },
            },
          },
          500: {
            description: 'Server error',
          },
        },
      },
    },
    '/api/analytics/customers': {
      get: {
        tags: ['Analytics'],
        summary: 'Get customer analytics',
        description: 'Returns customer metrics including lifetime value, churn risk, and segmentation',
        parameters: [
          {
            name: 'period',
            in: 'query',
            description: 'Time period for analysis',
            schema: {
              type: 'string',
              enum: ['month', 'quarter', 'year', 'all_time'],
              default: 'all_time',
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of customers to return',
            schema: {
              type: 'integer',
              default: 10,
            },
          },
          {
            name: 'min_ltv',
            in: 'query',
            description: 'Minimum lifetime value filter',
            schema: {
              type: 'number',
              default: 0,
            },
          },
        ],
        responses: {
          200: {
            description: 'Customer analytics data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    top_customers: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          customer_id: { type: 'string' },
                          name: { type: 'string' },
                          email: { type: 'string' },
                          lifetime_value: { type: 'string' },
                          order_count: { type: 'integer' },
                          avg_order_value: { type: 'string' },
                          last_order_date: { type: 'string' },
                          status: { type: 'string' },
                        },
                      },
                    },
                    churn_risk: { type: 'array' },
                    acquisition_cost: { type: 'number' },
                    segments: { type: 'array' },
                    period: { type: 'string' },
                    cached: { type: 'boolean' },
                  },
                },
              },
            },
          },
          500: {
            description: 'Server error',
          },
        },
      },
    },
    '/api/analytics/orders': {
      get: {
        tags: ['Analytics'],
        summary: 'Get order metrics',
        description: 'Returns order pipeline metrics, status breakdown, cycle times, and bottlenecks',
        parameters: [
          {
            name: 'period',
            in: 'query',
            description: 'Time period for analysis',
            schema: {
              type: 'string',
              enum: ['day', 'week', 'month'],
              default: 'month',
            },
          },
        ],
        responses: {
          200: {
            description: 'Order metrics data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status_breakdown: {
                      type: 'object',
                      additionalProperties: { type: 'integer' },
                    },
                    avg_cycle_time: { type: 'string' },
                    conversion_rate: { type: 'string' },
                    total_quotes: { type: 'integer' },
                    total_orders: { type: 'integer' },
                    bottlenecks: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          stage: { type: 'string' },
                          avg_wait: { type: 'string' },
                          order_count: { type: 'integer' },
                        },
                      },
                    },
                    daily_trend: { type: 'array' },
                    period: { type: 'string' },
                    cached: { type: 'boolean' },
                  },
                },
              },
            },
          },
          500: {
            description: 'Server error',
          },
        },
      },
    },
    '/api/analytics/export': {
      get: {
        tags: ['Analytics'],
        summary: 'Export analytics report',
        description: 'Export analytics data as CSV or PDF',
        parameters: [
          {
            name: 'format',
            in: 'query',
            required: true,
            description: 'Export format',
            schema: {
              type: 'string',
              enum: ['csv', 'pdf'],
            },
          },
          {
            name: 'report',
            in: 'query',
            required: true,
            description: 'Report type to export',
            schema: {
              type: 'string',
              enum: ['revenue', 'products', 'customers', 'orders'],
            },
          },
          {
            name: 'period',
            in: 'query',
            description: 'Time period for report',
            schema: {
              type: 'string',
              enum: ['month', 'quarter', 'year'],
              default: 'month',
            },
          },
        ],
        responses: {
          200: {
            description: 'File download',
            content: {
              'text/csv': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
              'application/pdf': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
          400: {
            description: 'Invalid parameters',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
          500: {
            description: 'Server error',
          },
        },
      },
    },
  },
  components: {
    schemas: {},
  },
};
