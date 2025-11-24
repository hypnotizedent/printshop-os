/**
 * Export Analytics Endpoint
 * GET /api/analytics/export
 */

import { Router, Request, Response } from 'express';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import { query } from '../../utils/db';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

interface ExportQuery {
  format: 'csv' | 'pdf';
  report: 'revenue' | 'products' | 'customers' | 'orders';
  period?: 'month' | 'quarter' | 'year';
}

/**
 * GET /api/analytics/export
 * Query params:
 *   - format: csv|pdf
 *   - report: revenue|products|customers|orders
 *   - period: month|quarter|year
 */
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      format,
      report,
      period = 'month',
    } = req.query as unknown as ExportQuery;

    if (!format || !report) {
      return res.status(400).json({ error: 'Missing required parameters: format and report' });
    }

    if (!['csv', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Must be csv or pdf' });
    }

    if (!['revenue', 'products', 'customers', 'orders'].includes(report)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    // Fetch data based on report type
    let data: any[] = [];
    let headers: any[] = [];
    let title = '';

    switch (report) {
      case 'revenue':
        title = 'Revenue Report';
        const revenueQuery = `
          SELECT 
            DATE_TRUNC('day', "createdAt") as date,
            COUNT(*) as orders,
            COALESCE(SUM(CAST("totalAmount" AS NUMERIC)), 0) as revenue
          FROM orders
          WHERE "createdAt" BETWEEN $1 AND $2
            AND status NOT IN ('Cancelled')
          GROUP BY DATE_TRUNC('day', "createdAt")
          ORDER BY date DESC
        `;
        const revenueResult = await query(revenueQuery, [
          startDate.toISOString(),
          endDate.toISOString(),
        ]);
        data = revenueResult.rows.map((row) => ({
          date: new Date(row.date).toISOString().split('T')[0],
          orders: row.orders,
          revenue: parseFloat(row.revenue).toFixed(2),
        }));
        headers = [
          { id: 'date', title: 'Date' },
          { id: 'orders', title: 'Orders' },
          { id: 'revenue', title: 'Revenue ($)' },
        ];
        break;

      case 'products':
        title = 'Product Performance Report';
        const productsQuery = `
          WITH product_data AS (
            SELECT 
              jsonb_array_elements(o.items::jsonb) as item
            FROM orders o
            WHERE o."createdAt" BETWEEN $1 AND $2
              AND o.status NOT IN ('Cancelled')
          )
          SELECT 
            COALESCE(item->>'description', 'Unknown Product') as product_name,
            SUM(COALESCE((item->>'quantity')::numeric, 0)) as units_sold,
            SUM(COALESCE((item->>'quantity')::numeric, 0) * COALESCE((item->>'unitCost')::numeric, 0)) as revenue
          FROM product_data
          WHERE item IS NOT NULL
          GROUP BY product_name
          ORDER BY revenue DESC
          LIMIT 50
        `;
        const productsResult = await query(productsQuery, [
          startDate.toISOString(),
          endDate.toISOString(),
        ]);
        data = productsResult.rows.map((row) => ({
          product_name: row.product_name,
          units_sold: row.units_sold,
          revenue: parseFloat(row.revenue || '0').toFixed(2),
        }));
        headers = [
          { id: 'product_name', title: 'Product Name' },
          { id: 'units_sold', title: 'Units Sold' },
          { id: 'revenue', title: 'Revenue ($)' },
        ];
        break;

      case 'customers':
        title = 'Customer Analytics Report';
        const customersQuery = `
          SELECT 
            c.name,
            c.email,
            COUNT(o.id) as order_count,
            COALESCE(SUM(CAST(o."totalAmount" AS NUMERIC)), 0) as lifetime_value
          FROM customers c
          LEFT JOIN orders o ON c.id = o.customer_id
          WHERE o.status NOT IN ('Cancelled')
            AND o."createdAt" BETWEEN $1 AND $2
          GROUP BY c.id, c.name, c.email
          ORDER BY lifetime_value DESC
          LIMIT 100
        `;
        const customersResult = await query(customersQuery, [
          startDate.toISOString(),
          endDate.toISOString(),
        ]);
        data = customersResult.rows.map((row) => ({
          name: row.name,
          email: row.email,
          order_count: row.order_count,
          lifetime_value: parseFloat(row.lifetime_value || '0').toFixed(2),
        }));
        headers = [
          { id: 'name', title: 'Customer Name' },
          { id: 'email', title: 'Email' },
          { id: 'order_count', title: 'Order Count' },
          { id: 'lifetime_value', title: 'Lifetime Value ($)' },
        ];
        break;

      case 'orders':
        title = 'Order Metrics Report';
        const ordersQuery = `
          SELECT 
            "orderNumber",
            status,
            "createdAt",
            CAST("totalAmount" AS NUMERIC) as total_amount
          FROM orders
          WHERE "createdAt" BETWEEN $1 AND $2
          ORDER BY "createdAt" DESC
          LIMIT 500
        `;
        const ordersResult = await query(ordersQuery, [
          startDate.toISOString(),
          endDate.toISOString(),
        ]);
        data = ordersResult.rows.map((row) => ({
          order_number: row.orderNumber,
          status: row.status,
          created_at: new Date(row.createdAt).toISOString().split('T')[0],
          total_amount: parseFloat(row.total_amount || '0').toFixed(2),
        }));
        headers = [
          { id: 'order_number', title: 'Order Number' },
          { id: 'status', title: 'Status' },
          { id: 'created_at', title: 'Created Date' },
          { id: 'total_amount', title: 'Total Amount ($)' },
        ];
        break;
    }

    if (format === 'csv') {
      // Generate CSV
      const tmpDir = '/tmp';
      const filename = `${report}-${period}-${Date.now()}.csv`;
      const filepath = path.join(tmpDir, filename);

      const csvWriter = createObjectCsvWriter({
        path: filepath,
        header: headers,
      });

      await csvWriter.writeRecords(data);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(filepath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        fs.unlinkSync(filepath);
      });
    } else {
      // Generate PDF
      const doc = new PDFDocument();
      const filename = `${report}-${period}-${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);

      // Add title
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${period}`, { align: 'center' });
      doc.fontSize(10).text(`Generated: ${new Date().toISOString().split('T')[0]}`, { align: 'center' });
      doc.moveDown(2);

      // Add data table
      doc.fontSize(10);
      
      // Table headers
      const headerTexts = headers.map((h) => h.title);
      doc.font('Helvetica-Bold');
      let xPos = 50;
      const colWidth = 120;
      headerTexts.forEach((header) => {
        doc.text(header, xPos, doc.y, { width: colWidth, continued: true });
        xPos += colWidth;
      });
      doc.text(''); // End line
      doc.moveDown(0.5);

      // Table rows
      doc.font('Helvetica');
      data.slice(0, 50).forEach((row) => {
        xPos = 50;
        headers.forEach((header) => {
          const value = row[header.id] || 'N/A';
          doc.text(String(value), xPos, doc.y, { width: colWidth, continued: true });
          xPos += colWidth;
        });
        doc.text(''); // End line
        doc.moveDown(0.3);
      });

      // Add footer
      doc.moveDown(2);
      doc.fontSize(8).text('PrintShop OS Analytics Report', { align: 'center' });

      doc.end();
    }
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Failed to generate export' });
  }
});

export default router;
