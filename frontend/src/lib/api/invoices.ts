/**
 * Invoice API Client
 * Handles invoice generation, listing, and management
 * 
 * Created: November 29, 2025
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';

// ============================================================================
// Types
// ============================================================================

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Void';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceAddress {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  orderId: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  lineItems: InvoiceLineItem[];
  customerName: string;
  customerEmail: string;
  customerAddress?: InvoiceAddress;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  search?: string;
}

export interface PaymentInfo {
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

export interface GenerateInvoiceOptions {
  orderId: string;
  dueDate?: string;
  notes?: string;
}

// ============================================================================
// Invoice API Functions
// ============================================================================

/**
 * Generate invoice from an order
 * Returns the invoice data (not the PDF directly)
 */
export async function generateInvoice(
  options: GenerateInvoiceOptions
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  try {
    // Fetch the order with all details
    const orderRes = await fetch(
      `${API_BASE}/api/orders/${options.orderId}?populate=*`
    );
    
    if (!orderRes.ok) {
      throw new Error('Order not found');
    }
    
    const orderData = await orderRes.json();
    const order = orderData.data;
    
    // Create invoice from order data
    const invoice: Invoice = {
      id: `inv-${order.id}`,
      invoiceNumber: `INV-${order.orderNumber || order.id}`,
      orderNumber: order.orderNumber || order.visualId || `#${order.id}`,
      orderId: order.documentId || order.id.toString(),
      invoiceDate: new Date().toISOString(),
      dueDate: options.dueDate || calculateDueDate(30),
      status: order.amountOutstanding <= 0 ? 'Paid' : 'Pending',
      subtotal: calculateSubtotal(order),
      tax: order.salesTax || 0,
      shipping: order.shippingCost || 0,
      discount: order.discount || 0,
      total: order.totalAmount || 0,
      amountPaid: order.amountPaid || 0,
      balance: order.amountOutstanding || order.totalAmount || 0,
      lineItems: (order.lineItems || []).map((item: Record<string, unknown>) => ({
        id: String(item.id || ''),
        description: String(item.styleDescription || item.styleNumber || 'Item'),
        quantity: Number(item.totalQuantity || item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
        total: Number(item.totalCost || item.total || 0),
      })),
      customerName: order.customer?.name || 'Customer',
      customerEmail: order.customer?.email || '',
      customerAddress: order.customer?.address ? {
        street: String(order.customer.address.street || ''),
        street2: order.customer.address.street2 ? String(order.customer.address.street2) : undefined,
        city: String(order.customer.address.city || ''),
        state: String(order.customer.address.state || ''),
        zip: String(order.customer.address.zip || ''),
      } : undefined,
    };
    
    return { success: true, invoice };
  } catch (error) {
    console.error('Generate invoice error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate invoice' 
    };
  }
}

/**
 * Download invoice as PDF
 * Generates and returns PDF blob for download
 */
export async function downloadInvoicePDF(orderId: string): Promise<Blob | null> {
  try {
    // First generate the invoice data
    const { success, invoice, error } = await generateInvoice({ orderId });
    
    if (!success || !invoice) {
      throw new Error(error || 'Failed to generate invoice');
    }
    
    // Call backend PDF generation endpoint if available
    // For now, we'll create a simple HTML-based PDF using the browser
    const pdfContent = generatePDFContent(invoice);
    
    // Create a blob from the HTML content
    // In production, this would call a backend endpoint that uses pdfkit
    const blob = new Blob([pdfContent], { type: 'text/html' });
    return blob;
  } catch (error) {
    console.error('Download invoice PDF error:', error);
    return null;
  }
}

/**
 * Get all invoices (orders that have invoicing data)
 */
export async function getInvoices(
  filters?: InvoiceFilters
): Promise<{ invoices: Invoice[]; total: number }> {
  try {
    // Build query params for orders that are invoice-ready
    const params = new URLSearchParams({
      'populate': '*',
      'pagination[limit]': '100',
      'sort': 'createdAt:desc',
    });
    
    // Only get orders that have been invoiced (have status indicating payment due)
    // This includes: INVOICE_SENT, PAYMENT_NEEDED, INVOICE_PAID, etc.
    const invoiceStatuses = [
      'INVOICE_SENT',
      'PAYMENT_NEEDED', 
      'INVOICE_PAID',
      'COMPLETE',
      'READY_FOR_PICKUP',
      'SHIPPED',
    ];
    
    if (filters?.status) {
      // Filter by payment status
      if (filters.status === 'Paid') {
        params.append('filters[amountOutstanding][$eq]', '0');
      } else if (filters.status === 'Pending') {
        params.append('filters[amountOutstanding][$gt]', '0');
      }
    }
    
    if (filters?.customerId) {
      params.append('filters[customer][documentId][$eq]', filters.customerId);
    }
    
    if (filters?.startDate) {
      params.append('filters[createdAt][$gte]', filters.startDate);
    }
    
    if (filters?.endDate) {
      params.append('filters[createdAt][$lte]', filters.endDate);
    }
    
    const response = await fetch(`${API_BASE}/api/orders?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform orders to invoices, filtering for those with invoice-ready status
    const invoices: Invoice[] = (data.data || [])
      .filter((order: Record<string, unknown>) => {
        const status = String(order.status || '');
        // Include orders that are in production or later stages
        return invoiceStatuses.some(s => status.includes(s)) || 
               Number(order.totalAmount || 0) > 0;
      })
      .map((order: Record<string, unknown>) => ({
        id: `inv-${order.id}`,
        invoiceNumber: `INV-${order.orderNumber || order.id}`,
        orderNumber: String(order.orderNumber || order.visualId || `#${order.id}`),
        orderId: String(order.documentId || order.id),
        invoiceDate: String(order.createdAt || new Date().toISOString()),
        dueDate: String(order.dueDate || calculateDueDate(30)),
        status: getInvoiceStatus(order),
        subtotal: calculateSubtotal(order),
        tax: Number(order.salesTax || 0),
        shipping: Number(order.shippingCost || 0),
        discount: Number(order.discount || 0),
        total: Number(order.totalAmount || 0),
        amountPaid: Number(order.amountPaid || 0),
        balance: Number(order.amountOutstanding || order.totalAmount || 0),
        lineItems: [],
        customerName: (order.customer as Record<string, unknown>)?.name 
          ? String((order.customer as Record<string, unknown>).name) 
          : 'Customer',
        customerEmail: (order.customer as Record<string, unknown>)?.email 
          ? String((order.customer as Record<string, unknown>).email) 
          : '',
      }));
    
    // Apply search filter client-side
    let filteredInvoices = invoices;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredInvoices = invoices.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        inv.orderNumber.toLowerCase().includes(searchLower) ||
        inv.customerName.toLowerCase().includes(searchLower)
      );
    }
    
    return {
      invoices: filteredInvoices,
      total: filteredInvoices.length,
    };
  } catch (error) {
    console.error('Get invoices error:', error);
    return { invoices: [], total: 0 };
  }
}

/**
 * Get a single invoice by order ID
 */
export async function getInvoice(orderId: string): Promise<Invoice | null> {
  const { success, invoice } = await generateInvoice({ orderId });
  return success ? invoice ?? null : null;
}

/**
 * Mark invoice as paid
 */
export async function markInvoicePaid(
  orderId: string,
  paymentInfo: PaymentInfo
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update the order's payment information in Strapi
    const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          amountPaid: paymentInfo.amount,
          amountOutstanding: 0,
          status: 'INVOICE_PAID',
          paymentMethod: paymentInfo.paymentMethod,
          paymentTransactionId: paymentInfo.transactionId,
          paymentNotes: paymentInfo.notes,
          paidAt: new Date().toISOString(),
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error?.message || 'Failed to mark as paid' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Mark invoice paid error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to mark invoice as paid' 
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateDueDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

function calculateSubtotal(order: Record<string, unknown>): number {
  const total = Number(order.totalAmount || 0);
  const tax = Number(order.salesTax || 0);
  const shipping = Number(order.shippingCost || 0);
  return total - tax - shipping;
}

function getInvoiceStatus(order: Record<string, unknown>): InvoiceStatus {
  const amountOutstanding = Number(order.amountOutstanding || 0);
  const status = String(order.status || '');
  
  if (amountOutstanding <= 0 || status === 'INVOICE_PAID') {
    return 'Paid';
  }
  
  const dueDate = order.dueDate ? new Date(String(order.dueDate)) : null;
  if (dueDate && dueDate < new Date()) {
    return 'Overdue';
  }
  
  return 'Pending';
}

function generatePDFContent(invoice: Invoice): string {
  // Generate a printable HTML invoice
  // In production, this would be replaced with proper PDF generation
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company { font-size: 24px; font-weight: bold; color: #333; }
    .invoice-title { font-size: 32px; color: #666; }
    .details { margin-bottom: 30px; }
    .details-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .bill-to, .invoice-info { width: 45%; }
    .section-title { font-weight: bold; margin-bottom: 10px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .totals { margin-left: auto; width: 300px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.final { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 12px; }
    .footer { margin-top: 40px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">PRINTSHOP OS</div>
    <div class="invoice-title">INVOICE</div>
  </div>
  
  <div class="details">
    <div class="details-row">
      <div class="bill-to">
        <div class="section-title">Bill To:</div>
        <div>${invoice.customerName}</div>
        <div>${invoice.customerEmail}</div>
        ${invoice.customerAddress ? `
          <div>${invoice.customerAddress.street}</div>
          ${invoice.customerAddress.street2 ? `<div>${invoice.customerAddress.street2}</div>` : ''}
          <div>${invoice.customerAddress.city}, ${invoice.customerAddress.state} ${invoice.customerAddress.zip}</div>
        ` : ''}
      </div>
      <div class="invoice-info">
        <div><strong>Invoice #:</strong> ${invoice.invoiceNumber}</div>
        <div><strong>Order #:</strong> ${invoice.orderNumber}</div>
        <div><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</div>
        <div><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</div>
        <div><strong>Status:</strong> ${invoice.status}</div>
      </div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.lineItems.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>$${item.unitPrice.toFixed(2)}</td>
          <td>$${item.total.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>$${invoice.subtotal.toFixed(2)}</span>
    </div>
    ${invoice.discount > 0 ? `
      <div class="total-row">
        <span>Discount:</span>
        <span>-$${invoice.discount.toFixed(2)}</span>
      </div>
    ` : ''}
    <div class="total-row">
      <span>Tax:</span>
      <span>$${invoice.tax.toFixed(2)}</span>
    </div>
    ${invoice.shipping > 0 ? `
      <div class="total-row">
        <span>Shipping:</span>
        <span>$${invoice.shipping.toFixed(2)}</span>
      </div>
    ` : ''}
    <div class="total-row final">
      <span>Total Due:</span>
      <span>$${invoice.balance.toFixed(2)}</span>
    </div>
  </div>
  
  <div class="footer">
    <p>Payment Terms: Net 30</p>
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
  `.trim();
}
