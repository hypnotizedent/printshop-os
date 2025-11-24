/**
 * Invoice PDF Generator
 * Generates professional invoice PDFs for customer download
 */

import PDFDocument from 'pdfkit';
import { Invoice } from '../billing-types';

/**
 * Company information for invoice header
 */
export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email?: string;
}

/**
 * Generate invoice PDF as a buffer
 */
export async function generateInvoicePDF(
  invoice: Invoice,
  companyInfo: CompanyInfo
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header - Company Info
      doc
        .fontSize(20)
        .text('PRINTSHOP OS', 50, 50)
        .fontSize(10)
        .text(companyInfo.name, 50, 75)
        .text(companyInfo.address, 50, 90)
        .text(`${companyInfo.city}, ${companyInfo.state} ${companyInfo.zip}`, 50, 105)
        .text(companyInfo.phone, 50, 120);

      // Title - INVOICE
      doc
        .fontSize(24)
        .text('INVOICE', 50, 160, { align: 'left' });

      // Invoice Details - Right Side
      const rightX = 350;
      doc
        .fontSize(10)
        .text(`Invoice #: ${invoice.invoiceNumber}`, rightX, 160)
        .text(`Invoice Date: ${formatDate(invoice.invoiceDate)}`, rightX, 175)
        .text(`Due Date: ${formatDate(invoice.dueDate)}`, rightX, 190)
        .text(`Order #: ${invoice.orderNumber}`, rightX, 205);

      // Bill To Section
      doc
        .fontSize(12)
        .text('Bill To:', 50, 230)
        .fontSize(10)
        .text(invoice.customerName, 50, 250)
        .text(invoice.customerEmail, 50, 265);

      if (invoice.customerAddress) {
        const addr = invoice.customerAddress;
        doc
          .text(addr.street, 50, 280)
          .text(
            addr.street2 || '',
            50,
            addr.street2 ? 295 : 280
          );
        const cityLine = addr.street2 ? 310 : 295;
        doc.text(`${addr.city}, ${addr.state} ${addr.zip}`, 50, cityLine);
      }

      // Line Items Table
      const tableTop = 350;
      const tableHeaders = {
        description: 50,
        qty: 350,
        unitPrice: 420,
        total: 490,
      };

      // Table Header
      doc
        .fontSize(10)
        .text('Description', tableHeaders.description, tableTop)
        .text('Qty', tableHeaders.qty, tableTop)
        .text('Unit Price', tableHeaders.unitPrice, tableTop)
        .text('Total', tableHeaders.total, tableTop);

      // Header underline
      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Line Items
      let yPosition = tableTop + 25;
      invoice.lineItems.forEach((item) => {
        // Check if we need a new page
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc
          .fontSize(10)
          .text(item.description, tableHeaders.description, yPosition, {
            width: 290,
          })
          .text(item.quantity.toString(), tableHeaders.qty, yPosition)
          .text(`$${item.unitPrice.toFixed(2)}`, tableHeaders.unitPrice, yPosition)
          .text(`$${item.total.toFixed(2)}`, tableHeaders.total, yPosition);

        yPosition += 20;
      });

      // Totals Section
      yPosition += 20;
      const totalsX = 420;

      doc
        .moveTo(400, yPosition)
        .lineTo(550, yPosition)
        .stroke();

      yPosition += 10;

      doc
        .fontSize(10)
        .text('Subtotal:', totalsX, yPosition)
        .text(`$${invoice.subtotal.toFixed(2)}`, 490, yPosition);

      yPosition += 20;
      doc
        .text('Tax:', totalsX, yPosition)
        .text(`$${invoice.tax.toFixed(2)}`, 490, yPosition);

      yPosition += 20;
      doc
        .text('Shipping:', totalsX, yPosition)
        .text(`$${invoice.shipping.toFixed(2)}`, 490, yPosition);

      yPosition += 10;
      doc
        .moveTo(400, yPosition)
        .lineTo(550, yPosition)
        .stroke();

      yPosition += 10;
      doc
        .fontSize(12)
        .text('Total Due:', totalsX, yPosition)
        .text(`$${invoice.total.toFixed(2)}`, 490, yPosition);

      // Payment Terms
      yPosition += 40;
      if (yPosition > 680) {
        doc.addPage();
        yPosition = 50;
      }

      doc
        .fontSize(10)
        .text('Payment Terms: Net 30', 50, yPosition)
        .text('Thank you for your business!', 50, yPosition + 20);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Format date string for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Default company info (can be overridden)
 */
export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'Your Print Shop Name',
  address: '123 Main St',
  city: 'City',
  state: 'ST',
  zip: '12345',
  phone: '(555) 123-4567',
  email: 'info@printshop.com',
};
