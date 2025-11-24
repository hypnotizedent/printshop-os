/**
 * Customer Orders API Routes
 * 
 * REST API endpoints for customer portal order history and details
 */

import express, { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';
import axios from 'axios';
import { StrapiOrder } from '../lib/strapi-schema';

const router = express.Router();

// Strapi configuration from environment
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

/**
 * GET /api/customer/orders
 * 
 * List customer orders with pagination, filtering, sorting, and search
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - sort: Sort field and direction (e.g., "createdAt:desc", "total:asc")
 * - status: Filter by status (comma-separated for multiple)
 * - dateFrom: Filter by start date (ISO 8601)
 * - dateTo: Filter by end date (ISO 8601)
 * - search: Search by order number, product name, or PO number
 */
router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract and validate query parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, (parseInt(req.query.limit as string) || 10)));
    const sort = (req.query.sort as string) || 'timeline.createdAt:desc';
    const status = req.query.status as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const search = req.query.search as string;

    // Build Strapi query filters
    interface StrapiFilters {
      status?: { $in: string[] };
      'timeline.createdAt'?: {
        $gte?: string;
        $lte?: string;
      };
      $or?: Array<{
        printavoId?: { $containsi: string };
        orderNickname?: { $containsi: string };
        'lineItems.description'?: { $containsi: string };
      }>;
    }
    
    const filters: StrapiFilters = {};
    
    // Filter by status
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      filters.status = { $in: statuses };
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filters['timeline.createdAt'] = {};
      if (dateFrom) {
        filters['timeline.createdAt'].$gte = dateFrom;
      }
      if (dateTo) {
        filters['timeline.createdAt'].$lte = dateTo;
      }
    }

    // Search functionality
    if (search) {
      filters.$or = [
        { printavoId: { $containsi: search } },
        { orderNickname: { $containsi: search } },
        { 'lineItems.description': { $containsi: search } },
      ];
    }

    // Make request to Strapi
    const strapiParams = {
      filters,
      pagination: {
        page,
        pageSize: limit,
      },
      sort: [sort],
      populate: ['lineItems'],
    };

    const response = await axios.get(`${STRAPI_URL}/api/orders`, {
      params: strapiParams,
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    // Transform response to match expected format
    const orders = response.data.data || [];
    const pagination = response.data.meta?.pagination || {
      page,
      pageSize: limit,
      pageCount: 1,
      total: orders.length,
    };

    res.json({
      data: orders,
      pagination: {
        page: pagination.page,
        limit: pagination.pageSize,
        total: pagination.total,
        pages: pagination.pageCount,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/customer/orders/:id
 * 
 * Get detailed information for a specific order
 */
router.get('/orders/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch order from Strapi with all related data
    const response = await axios.get(`${STRAPI_URL}/api/orders/${id}`, {
      params: {
        populate: ['lineItems', 'customer', 'billingAddress', 'shippingAddress'],
      },
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    if (!response.data.data) {
      res.status(404).json({
        error: 'Order not found',
        message: `Order with ID ${id} does not exist`,
      });
      return;
    }

    res.json({
      data: response.data.data,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      res.status(404).json({
        error: 'Order not found',
        message: `Order with ID ${req.params.id} does not exist`,
      });
      return;
    }

    console.error('Error fetching order details:', error);
    res.status(500).json({
      error: 'Failed to fetch order details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/customer/orders/:id/invoice
 * 
 * Download invoice PDF for a specific order
 */
router.get('/orders/:id/invoice', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch order details
    const response = await axios.get(`${STRAPI_URL}/api/orders/${id}`, {
      params: {
        populate: ['lineItems', 'customer', 'billingAddress'],
      },
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    if (!response.data.data) {
      res.status(404).json({
        error: 'Order not found',
      });
      return;
    }

    const order = response.data.data.attributes as StrapiOrder;

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.printavoId}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add invoice header
    doc.fontSize(24).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Order #${order.printavoId}`, { align: 'right' });
    doc.text(`Date: ${new Date(order.timeline.createdAt).toLocaleDateString()}`, { align: 'right' });
    if (order.timeline.dueDate) {
      doc.text(`Due Date: ${new Date(order.timeline.dueDate).toLocaleDateString()}`, { align: 'right' });
    }
    doc.moveDown();

    // Customer information
    doc.fontSize(14).text('Bill To:');
    doc.fontSize(10);
    doc.text(order.customer.name);
    if (order.customer.company) {
      doc.text(order.customer.company);
    }
    doc.text(order.customer.email);
    if (order.billingAddress) {
      doc.text(order.billingAddress.street);
      if (order.billingAddress.street2) {
        doc.text(order.billingAddress.street2);
      }
      doc.text(`${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.zip}`);
    }
    doc.moveDown(2);

    // Line items table
    doc.fontSize(12).text('Items:');
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const col1X = 50;
    const col2X = 350;
    const col3X = 420;
    const col4X = 480;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', col1X, tableTop);
    doc.text('Qty', col2X, tableTop);
    doc.text('Unit Price', col3X, tableTop);
    doc.text('Total', col4X, tableTop);
    doc.font('Helvetica');

    // Draw line under header
    doc.moveTo(col1X, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .stroke();

    // Line items
    let itemY = tableTop + 25;
    order.lineItems.forEach((item) => {
      doc.text(item.description, col1X, itemY, { width: 280 });
      doc.text(item.quantity.toString(), col2X, itemY);
      doc.text(`$${item.unitCost.toFixed(2)}`, col3X, itemY);
      doc.text(`$${item.total.toFixed(2)}`, col4X, itemY);
      itemY += 20;
    });

    doc.moveDown(2);

    // Totals
    const totalsX = 400;
    doc.fontSize(10);
    doc.text(`Subtotal:`, totalsX, doc.y);
    doc.text(`$${order.totals.subtotal.toFixed(2)}`, 500, doc.y, { align: 'right' });
    doc.moveDown(0.5);

    if (order.totals.fees > 0) {
      doc.text(`Fees:`, totalsX, doc.y);
      doc.text(`$${order.totals.fees.toFixed(2)}`, 500, doc.y, { align: 'right' });
      doc.moveDown(0.5);
    }

    if (order.totals.discount > 0) {
      doc.text(`Discount:`, totalsX, doc.y);
      doc.text(`-$${order.totals.discount.toFixed(2)}`, 500, doc.y, { align: 'right' });
      doc.moveDown(0.5);
    }

    doc.text(`Tax:`, totalsX, doc.y);
    doc.text(`$${order.totals.tax.toFixed(2)}`, 500, doc.y, { align: 'right' });
    doc.moveDown(0.5);

    if (order.totals.shipping > 0) {
      doc.text(`Shipping:`, totalsX, doc.y);
      doc.text(`$${order.totals.shipping.toFixed(2)}`, 500, doc.y, { align: 'right' });
      doc.moveDown(0.5);
    }

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Total:`, totalsX, doc.y);
    doc.text(`$${order.totals.total.toFixed(2)}`, 500, doc.y, { align: 'right' });
    doc.font('Helvetica');
    doc.moveDown(0.5);

    if (order.totals.amountPaid > 0) {
      doc.fontSize(10);
      doc.text(`Amount Paid:`, totalsX, doc.y);
      doc.text(`$${order.totals.amountPaid.toFixed(2)}`, 500, doc.y, { align: 'right' });
      doc.moveDown(0.5);
    }

    if (order.totals.amountOutstanding > 0) {
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`Balance Due:`, totalsX, doc.y);
      doc.text(`$${order.totals.amountOutstanding.toFixed(2)}`, 500, doc.y, { align: 'right' });
    }

    // Footer
    doc.fontSize(8).font('Helvetica');
    doc.moveDown(3);
    doc.text('Thank you for your business!', { align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating invoice:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to generate invoice',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

/**
 * GET /api/customer/orders/:id/files
 * 
 * Download art files as a zip archive for a specific order
 */
router.get('/orders/:id/files', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch order details
    const response = await axios.get(`${STRAPI_URL}/api/orders/${id}`, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    if (!response.data.data) {
      res.status(404).json({
        error: 'Order not found',
      });
      return;
    }

    const order = response.data.data.attributes as StrapiOrder;

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=order-${order.printavoId}-files.zip`);

    // Create zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add placeholder files (in production, fetch actual files from storage)
    archive.append('This is a placeholder for design proof file', {
      name: 'Design_Proof.pdf',
    });
    archive.append('This is a placeholder for final art file', {
      name: 'Final_Art.ai',
    });

    // Finalize archive
    await archive.finalize();
  } catch (error) {
    console.error('Error generating file archive:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to generate file archive',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

export default router;
