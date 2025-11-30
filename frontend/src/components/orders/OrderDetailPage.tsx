/**
 * OrderDetailPage Component
 * Staff-facing order detail view with line items, payments, and actions
 */
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Package, 
  User,
  Clock,
  CalendarBlank,
  CurrencyDollar,
  Printer,
  Truck,
  FileText,
  CheckCircle,
  Warning,
  Copy,
  Receipt
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { generateInvoice, type Invoice } from "@/lib/api/invoices"
import { printInvoice } from "@/lib/api/invoice-utils"
import { InvoicePreview } from "@/components/invoices/InvoicePreview"

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';

interface LineItem {
  id: string;
  documentId: string;
  styleDescription?: string;
  styleNumber?: string;
  color?: string;
  totalQuantity: number;
  unitPrice: number;
  totalCost: number;
  sizeXS?: number;
  sizeS?: number;
  sizeM?: number;
  sizeL?: number;
  sizeXL?: number;
  size2XL?: number;
  size3XL?: number;
  size4XL?: number;
  size5XL?: number;
}

interface OrderDetail {
  id: string;
  documentId: string;
  orderNumber: string;
  orderNickname?: string;
  visualId?: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  amountOutstanding: number;
  salesTax: number;
  discount: number;
  fees: number;
  dueDate?: string;
  customerDueDate?: string;
  productionDueDate?: string;
  createdAt: string;
  notes?: string;
  productionNotes?: string;
  deliveryMethod?: string;
  customerPO?: string;
  customer?: {
    id: string;
    documentId: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  lineItems?: LineItem[];
}

interface OrderDetailPageProps {
  orderId: string;
  onBack: () => void;
  onViewCustomer?: (customerId: string) => void;
}

export function OrderDetailPage({ orderId, onBack, onViewCustomer }: OrderDetailPageProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<Invoice | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  const handleGenerateInvoice = async () => {
    if (!order) return;
    
    setIsGeneratingInvoice(true);
    try {
      const { success, invoice, error: invoiceError } = await generateInvoice({ 
        orderId: order.documentId 
      });
      
      if (success && invoice) {
        setInvoicePreview(invoice);
        toast.success('Invoice generated');
      } else {
        toast.error(invoiceError || 'Failed to generate invoice');
      }
    } catch {
      toast.error('Failed to generate invoice');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!invoicePreview) return;
    printInvoice(invoicePreview);
    toast.success('Invoice ready for download');
  };

  const handlePrintInvoice = () => {
    if (!invoicePreview) return;
    printInvoice(invoicePreview);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use populate=* for Strapi v5 compatibility
        const res = await fetch(
          `${API_BASE}/api/orders/${orderId}?populate=*`
        );
        if (!res.ok) throw new Error('Failed to fetch order');
        const data = await res.json();
        
        if (!data.data) {
          throw new Error('Order not found');
        }
        
        const o = data.data;
        
        // If customer relation is null, fetch by printavoCustomerId
        let customerData = o.customer;
        if (!customerData && o.printavoCustomerId) {
          try {
            const custRes = await fetch(
              `${API_BASE}/api/customers?filters[printavoId][$eq]=${o.printavoCustomerId}`
            );
            if (custRes.ok) {
              const custData = await custRes.json();
              if (custData.data && custData.data.length > 0) {
                customerData = custData.data[0];
              }
            }
          } catch (e) {
            console.warn('Could not fetch customer by printavoId:', e);
          }
        }
        
        setOrder({
          id: o.id.toString(),
          documentId: o.documentId,
          orderNumber: o.orderNumber || o.visualId || `#${o.id}`,
          orderNickname: o.orderNickname,
          visualId: o.visualId,
          status: o.status || 'QUOTE',
          totalAmount: o.totalAmount || 0,
          amountPaid: o.amountPaid || 0,
          amountOutstanding: o.amountOutstanding || 0,
          salesTax: o.salesTax || 0,
          discount: o.discount || 0,
          fees: o.fees || 0,
          dueDate: o.dueDate,
          customerDueDate: o.customerDueDate,
          productionDueDate: o.productionDueDate,
          createdAt: o.createdAt,
          notes: o.notes,
          productionNotes: o.productionNotes,
          deliveryMethod: o.deliveryMethod,
          customerPO: o.customerPO,
          customer: customerData ? {
            id: customerData.id?.toString(),
            documentId: customerData.documentId,
            name: customerData.name || 'Unknown',
            email: customerData.email,
            phone: customerData.phone,
            company: customerData.company,
          } : undefined,
          lineItems: (o.lineItems || []).map((li: any) => ({
            id: li.id.toString(),
            documentId: li.documentId,
            styleDescription: li.styleDescription,
            styleNumber: li.styleNumber,
            color: li.color,
            totalQuantity: li.totalQuantity || 0,
            unitPrice: li.unitPrice || 0,
            totalCost: li.totalCost || 0,
            sizeXS: li.sizeXS || 0,
            sizeS: li.sizeS || 0,
            sizeM: li.sizeM || 0,
            sizeL: li.sizeL || 0,
            sizeXL: li.sizeXL || 0,
            size2XL: li.size2XL || 0,
            size3XL: li.size3XL || 0,
            size4XL: li.size4XL || 0,
            size5XL: li.size5XL || 0,
          })),
        });
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'QUOTE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'QUOTE_SENT': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'QUOTE_APPROVED': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'IN_PRODUCTION': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'COMPLETE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'READY_FOR_PICKUP': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'SHIPPED': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'PAYMENT_NEEDED': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'INVOICE_PAID': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber);
      toast.success('Order number copied');
    }
  };

  // Get size breakdown for a line item
  const getSizeBreakdown = (item: LineItem) => {
    const sizes = [
      { label: 'XS', value: item.sizeXS },
      { label: 'S', value: item.sizeS },
      { label: 'M', value: item.sizeM },
      { label: 'L', value: item.sizeL },
      { label: 'XL', value: item.sizeXL },
      { label: '2XL', value: item.size2XL },
      { label: '3XL', value: item.size3XL },
      { label: '4XL', value: item.size4XL },
      { label: '5XL', value: item.size5XL },
    ].filter(s => s.value && s.value > 0);
    return sizes;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft size={18} />
          Back
        </Button>
        <Card className="p-12 text-center">
          <Warning size={48} className="mx-auto text-destructive mb-4" />
          <p className="text-destructive">{error || 'Order not found'}</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            Return
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft size={18} />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                #{order.orderNumber}
              </h1>
              <Button variant="ghost" size="sm" onClick={copyOrderNumber} className="h-8 w-8 p-0">
                <Copy size={16} />
              </Button>
              <Badge className={getStatusColor(order.status)}>
                {formatStatus(order.status)}
              </Badge>
            </div>
            {order.orderNickname && (
              <p className="text-xl text-muted-foreground font-medium mt-1">
                {order.orderNickname}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleGenerateInvoice}
            disabled={isGeneratingInvoice}
          >
            <Receipt size={18} />
            {isGeneratingInvoice ? 'Generating...' : 'Generate Invoice'}
          </Button>
          <Button variant="outline" className="gap-2">
            <Printer size={18} />
            Print
          </Button>
          <Button variant="outline" className="gap-2">
            <Truck size={18} />
            Ship
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Total
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <CurrencyDollar size={24} weight="fill" className="text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Paid
              </p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(order.amountPaid)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <CheckCircle size={24} weight="fill" className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Outstanding
              </p>
              <p className={`text-2xl font-bold mt-2 ${order.amountOutstanding > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                {formatCurrency(order.amountOutstanding)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900">
              <Warning size={24} weight="fill" className="text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Due Date
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {order.dueDate ? formatDate(order.dueDate) : 'TBD'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
              <CalendarBlank size={24} weight="fill" className="text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package size={20} />
                Line Items ({order.lineItems?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.lineItems && order.lineItems.length > 0 ? (
                <div className="space-y-4">
                  {order.lineItems.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-foreground">
                            {item.styleDescription || item.styleNumber || `Item ${index + 1}`}
                          </p>
                          {item.styleNumber && item.styleDescription && (
                            <p className="text-sm text-muted-foreground">
                              Style: {item.styleNumber}
                            </p>
                          )}
                          {item.color && (
                            <p className="text-sm text-muted-foreground">
                              Color: {item.color}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.totalCost)}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.totalQuantity} pcs × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Size Breakdown */}
                      {getSizeBreakdown(item).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                          {getSizeBreakdown(item).map(size => (
                            <Badge key={size.label} variant="secondary" className="text-xs">
                              {size.label}: {size.value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No line items found</p>
                  <p className="text-sm">Line items may still be importing</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(order.notes || order.productionNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Customer Notes</p>
                    <p className="text-foreground whitespace-pre-wrap">{order.notes}</p>
                  </div>
                )}
                {order.productionNotes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Production Notes</p>
                    <p className="text-foreground whitespace-pre-wrap">{order.productionNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.customer ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-foreground">{order.customer.name}</p>
                    {order.customer.company && (
                      <p className="text-sm text-muted-foreground">{order.customer.company}</p>
                    )}
                  </div>
                  {order.customer.email && (
                    <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                  )}
                  {order.customer.phone && (
                    <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                  )}
                  {onViewCustomer && order.customer.documentId && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => onViewCustomer(order.customer!.documentId)}
                    >
                      View Customer
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No customer linked</p>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDate(order.createdAt)}</span>
              </div>
              {order.customerDueDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer Due</span>
                  <span className="font-medium">{formatDate(order.customerDueDate)}</span>
                </div>
              )}
              {order.productionDueDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Production Due</span>
                  <span className="font-medium">{formatDate(order.productionDueDate)}</span>
                </div>
              )}
              {order.deliveryMethod && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <Badge variant="outline">{order.deliveryMethod}</Badge>
                </div>
              )}
              {order.customerPO && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer PO</span>
                  <span className="font-medium">{order.customerPO}</span>
                </div>
              )}
              
              <Separator className="my-3" />
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(order.totalAmount - order.salesTax - order.fees + order.discount)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.fees > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fees</span>
                  <span className="font-medium">{formatCurrency(order.fees)}</span>
                </div>
              )}
              {order.salesTax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatCurrency(order.salesTax)}</span>
                </div>
              )}
              
              <Separator className="my-3" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {invoicePreview && (
        <InvoicePreview
          invoice={invoicePreview}
          onClose={() => setInvoicePreview(null)}
          onDownload={handleDownloadInvoice}
          onPrint={handlePrintInvoice}
        />
      )}
    </div>
  );
}
