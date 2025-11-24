/**
 * Customer Orders API Tests
 * 
 * Comprehensive test suite for customer order endpoints
 */

import request from 'supertest';
import express from 'express';
import axios from 'axios';
import customerOrdersRouter from '../customer-orders';
import { OrderStatus } from '../../lib/strapi-schema';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create test app
const app = express();
app.use(express.json());
app.use('/api/customer', customerOrdersRouter);

// Mock Strapi responses
const mockOrders = [
  {
    id: 1,
    attributes: {
      printavoId: '12345',
      customer: {
        name: 'John Smith',
        email: 'john@example.com',
        company: 'Acme Corp',
      },
      status: OrderStatus.COMPLETED,
      totals: {
        subtotal: 845.00,
        tax: 75.15,
        shipping: 0,
        discount: 0,
        fees: 200.00,
        total: 1120.15,
        amountPaid: 1120.15,
        amountOutstanding: 0,
      },
      lineItems: [
        {
          id: '1',
          description: '100x Gildan 5000 - Black - Front Logo',
          quantity: 100,
          unitCost: 8.45,
          taxable: true,
          total: 845.00,
        },
      ],
      timeline: {
        createdAt: '2025-11-15T14:30:00Z',
        updatedAt: '2025-11-18T19:45:00Z',
        dueDate: '2025-11-20T00:00:00Z',
      },
      orderNickname: 'Corporate Shirts Q4',
    },
  },
  {
    id: 2,
    attributes: {
      printavoId: '12346',
      customer: {
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
      status: OrderStatus.IN_PRODUCTION,
      totals: {
        subtotal: 500.00,
        tax: 45.00,
        shipping: 25.00,
        discount: 50.00,
        fees: 0,
        total: 520.00,
        amountPaid: 0,
        amountOutstanding: 520.00,
      },
      lineItems: [
        {
          id: '2',
          description: '50x T-Shirts - White - Back Print',
          quantity: 50,
          unitCost: 10.00,
          taxable: true,
          total: 500.00,
        },
      ],
      timeline: {
        createdAt: '2025-11-20T10:00:00Z',
        updatedAt: '2025-11-20T10:00:00Z',
        dueDate: '2025-11-25T00:00:00Z',
      },
    },
  },
];

describe('Customer Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/customer/orders', () => {
    it('should fetch orders with default pagination', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: mockOrders,
          meta: {
            pagination: {
              page: 1,
              pageSize: 10,
              pageCount: 1,
              total: 2,
            },
          },
        },
      });

      const response = await request(app)
        .get('/api/customer/orders')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders'),
        expect.objectContaining({
          params: expect.objectContaining({
            pagination: {
              page: 1,
              pageSize: 10,
            },
          }),
        })
      );
    });

    it('should support custom pagination parameters', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: [mockOrders[0]],
          meta: {
            pagination: {
              page: 2,
              pageSize: 1,
              pageCount: 2,
              total: 2,
            },
          },
        },
      });

      const response = await request(app)
        .get('/api/customer/orders?page=2&limit=1')
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should filter orders by status', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: [mockOrders[0]],
          meta: {
            pagination: {
              page: 1,
              pageSize: 10,
              pageCount: 1,
              total: 1,
            },
          },
        },
      });

      await request(app)
        .get('/api/customer/orders?status=completed')
        .expect(200);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          params: expect.objectContaining({
            filters: expect.objectContaining({
              status: { $in: ['completed'] },
            }),
          }),
        })
      );
    });

    it('should filter orders by multiple statuses', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: mockOrders,
          meta: {
            pagination: {
              page: 1,
              pageSize: 10,
              pageCount: 1,
              total: 2,
            },
          },
        },
      });

      await request(app)
        .get('/api/customer/orders?status=completed,in_production')
        .expect(200);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          params: expect.objectContaining({
            filters: expect.objectContaining({
              status: { $in: ['completed', 'in_production'] },
            }),
          }),
        })
      );
    });

    it('should filter orders by date range', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: [mockOrders[1]],
          meta: {
            pagination: {
              page: 1,
              pageSize: 10,
              pageCount: 1,
              total: 1,
            },
          },
        },
      });

      await request(app)
        .get('/api/customer/orders?dateFrom=2025-11-20&dateTo=2025-11-30')
        .expect(200);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          params: expect.objectContaining({
            filters: expect.objectContaining({
              'timeline.createdAt': {
                $gte: '2025-11-20',
                $lte: '2025-11-30',
              },
            }),
          }),
        })
      );
    });

    it('should search orders by order number', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: [mockOrders[0]],
          meta: {
            pagination: {
              page: 1,
              pageSize: 10,
              pageCount: 1,
              total: 1,
            },
          },
        },
      });

      await request(app)
        .get('/api/customer/orders?search=12345')
        .expect(200);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          params: expect.objectContaining({
            filters: expect.objectContaining({
              $or: expect.arrayContaining([
                { printavoId: { $containsi: '12345' } },
              ]),
            }),
          }),
        })
      );
    });

    it('should support sorting orders', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: mockOrders,
          meta: {
            pagination: {
              page: 1,
              pageSize: 10,
              pageCount: 1,
              total: 2,
            },
          },
        },
      });

      await request(app)
        .get('/api/customer/orders?sort=totals.total:asc')
        .expect(200);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          params: expect.objectContaining({
            sort: ['totals.total:asc'],
          }),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Strapi API error'));

      const response = await request(app)
        .get('/api/customer/orders')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch orders');
    });

    it('should enforce maximum page limit', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: mockOrders,
          meta: {
            pagination: {
              page: 1,
              pageSize: 100,
              pageCount: 1,
              total: 2,
            },
          },
        },
      });

      await request(app)
        .get('/api/customer/orders?limit=200')
        .expect(200);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          params: expect.objectContaining({
            pagination: {
              page: 1,
              pageSize: 100, // Should be capped at 100
            },
          }),
        })
      );
    });
  });

  describe('GET /api/customer/orders/:id', () => {
    it('should fetch order details by ID', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: mockOrders[0],
        },
      });

      const response = await request(app)
        .get('/api/customer/orders/1')
        .expect(200);

      expect(response.body.data).toEqual(mockOrders[0]);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders/1'),
        expect.objectContaining({
          params: expect.objectContaining({
            populate: expect.arrayContaining(['lineItems', 'customer']),
          }),
        })
      );
    });

    it('should return 404 for non-existent order', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: null,
        },
      });

      const response = await request(app)
        .get('/api/customer/orders/999')
        .expect(404);

      expect(response.body.error).toBe('Order not found');
    });

    it('should handle Strapi 404 errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 404 },
      };
      mockedAxios.get.mockRejectedValue(axiosError);
      (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(true);

      const response = await request(app)
        .get('/api/customer/orders/999')
        .expect(404);

      expect(response.body.error).toBe('Order not found');
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Database error'));
      (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);

      const response = await request(app)
        .get('/api/customer/orders/1')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch order details');
    });
  });

  describe('GET /api/customer/orders/:id/invoice', () => {
    it('should generate invoice PDF', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: mockOrders[0],
        },
      });

      const response = await request(app)
        .get('/api/customer/orders/1/invoice')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('invoice-12345.pdf');
    });

    it('should return 404 for non-existent order', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: null,
        },
      });

      const response = await request(app)
        .get('/api/customer/orders/999/invoice')
        .expect(404);

      expect(response.body.error).toBe('Order not found');
    });

    it('should handle errors during PDF generation', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/customer/orders/1/invoice')
        .expect(500);

      expect(response.body.error).toBe('Failed to generate invoice');
    });
  });

  describe('GET /api/customer/orders/:id/files', () => {
    it('should generate files zip archive', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: mockOrders[0],
        },
      });

      const response = await request(app)
        .get('/api/customer/orders/1/files')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/zip');
      expect(response.headers['content-disposition']).toContain('order-12345-files.zip');
    });

    it('should return 404 for non-existent order', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: null,
        },
      });

      const response = await request(app)
        .get('/api/customer/orders/999/files')
        .expect(404);

      expect(response.body.error).toBe('Order not found');
    });

    it('should handle errors during archive generation', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/customer/orders/1/files')
        .expect(500);

      expect(response.body.error).toBe('Failed to generate file archive');
    });
  });
});
