/**
 * InvoicesPage Component
 * List all invoices with filtering and actions
 */
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  FileText, 
  Download, 
  Eye,
  CheckCircle,
  MagnifyingGlass,
  Funnel,
  CurrencyDollar,
  Warning,
  Clock
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { 
  getInvoices, 
  generateInvoice,
  markInvoicePaid,
  type Invoice, 
  type InvoiceStatus,
  type InvoiceFilters 
} from "@/lib/api/invoices"
import { InvoicePreview } from "./InvoicePreview"

interface InvoicesPageProps {
  onViewOrder?: (orderId: string) => void;
}

export function InvoicesPage({ onViewOrder }: InvoicesPageProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: InvoiceFilters = {};
      
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }
      
      if (searchQuery) {
        filters.search = searchQuery;
      }
      
      const { invoices: data } = await getInvoices(filters);
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleViewInvoice = async (orderId: string) => {
    const { success, invoice, error } = await generateInvoice({ orderId });
    if (success && invoice) {
      setSelectedInvoice(invoice);
    } else {
      toast.error(error || 'Failed to load invoice');
    }
  };

  const handleDownload = async () => {
    if (!selectedInvoice) return;
    
    setIsDownloading(true);
    try {
      // Generate HTML invoice content
      const content = generatePrintableInvoice(selectedInvoice);
      
      // Create a new window for printing/saving
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
      }
      
      toast.success('Invoice ready for download');
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!selectedInvoice) return;
    
    const content = generatePrintableInvoice(selectedInvoice);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    const confirmed = window.confirm(
      `Mark invoice ${invoice.invoiceNumber} as paid?\n\nAmount: $${invoice.balance.toFixed(2)}`
    );
    
    if (!confirmed) return;
    
    const { success, error } = await markInvoicePaid(invoice.orderId, {
      amount: invoice.total,
      paymentMethod: 'Manual',
      notes: 'Marked as paid from invoices page',
    });
    
    if (success) {
      toast.success('Invoice marked as paid');
      fetchInvoices();
    } else {
      toast.error(error || 'Failed to mark invoice as paid');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Paid': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Overdue': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Void': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle size={16} weight="fill" className="text-green-600" />;
      case 'Pending':
        return <Clock size={16} weight="fill" className="text-yellow-600" />;
      case 'Overdue':
        return <Warning size={16} weight="fill" className="text-red-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  // Calculate summary stats
  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'Paid').length,
    pending: invoices.filter(i => i.status === 'Pending').length,
    overdue: invoices.filter(i => i.status === 'Overdue').length,
    totalOutstanding: invoices.reduce((sum, i) => sum + i.balance, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage and track all customer invoices</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText size={32} className="text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <CheckCircle size={32} weight="fill" className="text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock size={32} weight="fill" className="text-yellow-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.totalOutstanding)}
              </p>
            </div>
            <CurrencyDollar size={32} weight="fill" className="text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass 
                size={18} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
              />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Funnel size={18} className="text-muted-foreground" />
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(value as InvoiceStatus | "all")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} />
            Invoice List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No invoices found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your filters"
                  : "Invoices will appear here once orders are completed"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      {getStatusIcon(invoice.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {invoice.invoiceNumber}
                        </span>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Order: {invoice.orderNumber} • {invoice.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(invoice.invoiceDate)} • Due: {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(invoice.total)}
                      </p>
                      {invoice.balance > 0 && (
                        <p className="text-sm text-orange-600">
                          Due: {formatCurrency(invoice.balance)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice.orderId)}
                        className="h-8 w-8 p-0"
                        title="View Invoice"
                      >
                        <Eye size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleViewInvoice(invoice.orderId);
                        }}
                        className="h-8 w-8 p-0"
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </Button>
                      {invoice.status !== 'Paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkPaid(invoice)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          title="Mark as Paid"
                        >
                          <CheckCircle size={18} />
                        </Button>
                      )}
                      {onViewOrder && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewOrder(invoice.orderId)}
                        >
                          View Order
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <InvoicePreview
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDownload={handleDownload}
          onPrint={handlePrint}
          isDownloading={isDownloading}
        />
      )}
    </div>
  );
}

// Helper function to generate printable invoice HTML
function generatePrintableInvoice(invoice: Invoice): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company { font-size: 28px; font-weight: bold; color: #2563eb; }
    .company-info { font-size: 12px; color: #666; margin-top: 5px; }
    .invoice-title { font-size: 32px; color: #666; text-transform: uppercase; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .status.paid { background: #dcfce7; color: #166534; }
    .status.pending { background: #fef9c3; color: #854d0e; }
    .status.overdue { background: #fee2e2; color: #991b1b; }
    .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .bill-to, .invoice-info { width: 45%; }
    .section-title { font-weight: bold; margin-bottom: 10px; color: #333; font-size: 14px; }
    .info-row { font-size: 13px; margin-bottom: 4px; }
    .info-label { color: #666; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 13px; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals { margin-left: auto; width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
    .total-row.final { font-weight: bold; font-size: 16px; border-top: 2px solid #333; padding-top: 12px; margin-top: 8px; }
    .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">PRINTSHOP OS</div>
      <div class="company-info">
        Your Print Shop Name<br>
        123 Main St<br>
        City, ST 12345<br>
        (555) 123-4567
      </div>
    </div>
    <div style="text-align: right;">
      <div class="invoice-title">INVOICE</div>
      <div class="status ${invoice.status.toLowerCase()}">${invoice.status}</div>
    </div>
  </div>
  
  <div class="details">
    <div class="bill-to">
      <div class="section-title">Bill To:</div>
      <div style="font-weight: 500; margin-bottom: 4px;">${invoice.customerName}</div>
      <div class="info-row">${invoice.customerEmail}</div>
      ${invoice.customerAddress ? `
        <div class="info-row">${invoice.customerAddress.street}</div>
        ${invoice.customerAddress.street2 ? `<div class="info-row">${invoice.customerAddress.street2}</div>` : ''}
        <div class="info-row">${invoice.customerAddress.city}, ${invoice.customerAddress.state} ${invoice.customerAddress.zip}</div>
      ` : ''}
    </div>
    <div class="invoice-info" style="text-align: right;">
      <div class="info-row"><span class="info-label">Invoice #:</span> <strong>${invoice.invoiceNumber}</strong></div>
      <div class="info-row"><span class="info-label">Order #:</span> <strong>${invoice.orderNumber}</strong></div>
      <div class="info-row"><span class="info-label">Date:</span> ${new Date(invoice.invoiceDate).toLocaleDateString()}</div>
      <div class="info-row"><span class="info-label">Due Date:</span> ${new Date(invoice.dueDate).toLocaleDateString()}</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-center" style="width: 80px;">Qty</th>
        <th class="text-right" style="width: 100px;">Unit Price</th>
        <th class="text-right" style="width: 100px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.lineItems.length > 0 
        ? invoice.lineItems.map(item => `
          <tr>
            <td>${item.description}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
            <td class="text-right">$${item.total.toFixed(2)}</td>
          </tr>
        `).join('')
        : `<tr><td colspan="4" style="text-align: center; color: #666; padding: 30px;">Order total: $${invoice.total.toFixed(2)}</td></tr>`
      }
    </tbody>
  </table>
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>$${invoice.subtotal.toFixed(2)}</span>
    </div>
    ${invoice.discount > 0 ? `
      <div class="total-row" style="color: #166534;">
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
      <span>Total:</span>
      <span>$${invoice.total.toFixed(2)}</span>
    </div>
    ${invoice.amountPaid > 0 ? `
      <div class="total-row" style="color: #166534;">
        <span>Amount Paid:</span>
        <span>-$${invoice.amountPaid.toFixed(2)}</span>
      </div>
      <div class="total-row final">
        <span>Balance Due:</span>
        <span style="color: ${invoice.balance > 0 ? '#ea580c' : '#166534'};">$${invoice.balance.toFixed(2)}</span>
      </div>
    ` : ''}
  </div>
  
  <div class="footer">
    <p><strong>Payment Terms:</strong> Net 30</p>
    <p style="margin-top: 20px;">Thank you for your business!</p>
  </div>
</body>
</html>
  `.trim();
}
