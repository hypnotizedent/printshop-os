import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  EnvelopeSimple, 
  Phone, 
  Buildings, 
  MapPin, 
  Package, 
  CurrencyDollar, 
  CalendarBlank,
  Plus,
  Copy,
  PaperPlaneTilt,
  Clock,
  CaretRight
} from '@phosphor-icons/react';
import { getCustomerWithOrders, getCustomerOrders, type CustomerWithOrders, type OrderAPIResponse, type StrapiPagination } from '@/lib/api/customers';
import { toast } from 'sonner';

interface CustomerDetailProps {
  customerId: string;
  onBack: () => void;
  onNewOrder?: () => void;
}

export function CustomerDetail({ customerId, onBack, onNewOrder }: CustomerDetailProps) {
  const [customer, setCustomer] = useState<CustomerWithOrders | null>(null);
  const [orders, setOrders] = useState<OrderAPIResponse[]>([]);
  const [orderPagination, setOrderPagination] = useState<StrapiPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getCustomerWithOrders(customerId);
        setCustomer(response.data);
        
        // Also fetch orders separately for better pagination control
        const ordersResponse = await getCustomerOrders(customerId, { pageSize: 10 });
        setOrders(ordersResponse.data || []);
        if (ordersResponse.meta?.pagination) {
          setOrderPagination(ordersResponse.meta.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch customer:', err);
        setError('Failed to load customer details');
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const loadMoreOrders = async () => {
    if (!orderPagination || orderPagination.page >= orderPagination.pageCount) return;

    setIsLoadingOrders(true);
    try {
      const response = await getCustomerOrders(customerId, {
        page: orderPagination.page + 1,
        pageSize: 10,
      });
      setOrders(prev => [...prev, ...(response.data || [])]);
      if (response.meta?.pagination) {
        setOrderPagination(response.meta.pagination);
      }
    } catch (err) {
      console.error('Failed to load more orders:', err);
      toast.error('Failed to load more orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'QUOTE': 'outline',
      'QUOTE_SENT': 'outline',
      'QUOTE_APPROVED': 'secondary',
      'IN_PRODUCTION': 'secondary',
      'COMPLETE': 'default',
      'READY_FOR_PICKUP': 'default',
      'SHIPPED': 'default',
      'INVOICE_PAID': 'default',
      'PAYMENT_NEEDED': 'destructive',
      'CANCELLED': 'destructive',
    };
    return (
      <Badge variant={statusColors[status] || 'secondary'}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  // Calculate stats from orders
  const stats = {
    totalOrders: orderPagination?.total || orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    avgOrderValue: orders.length > 0 
      ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / orders.length 
      : 0,
    lastOrderDate: orders.length > 0 ? orders[0]?.createdAt : null,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft size={18} />
          Back to Customers
        </Button>
        <Card className="p-12 text-center">
          <p className="text-destructive mb-4">{error || 'Customer not found'}</p>
          <Button variant="outline" onClick={onBack}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            {customer.company && (
              <p className="text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Buildings size={14} />
                {customer.company}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {customer.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${customer.email}`}>
                <PaperPlaneTilt size={16} className="mr-1.5" />
                Send Email
              </a>
            </Button>
          )}
          {onNewOrder && (
            <Button size="sm" onClick={onNewOrder}>
              <Plus size={16} className="mr-1.5" />
              New Order
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CurrencyDollar size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <CurrencyDollar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <CalendarBlank size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Order</p>
              <p className="text-lg font-semibold">{formatDate(stats.lastOrderDate)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs for details and orders */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="info">Contact Info</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {orders.length === 0 ? (
            <Card className="p-8 text-center">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                This customer hasn't placed any orders
              </p>
              {onNewOrder && (
                <Button onClick={onNewOrder}>
                  <Plus size={16} className="mr-1.5" />
                  Create First Order
                </Button>
              )}
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                {orders.map((order) => (
                  <Card 
                    key={order.documentId || order.id}
                    className="p-4 hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">Order #{order.orderNumber}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock size={12} />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                          {order.amountOutstanding > 0 && (
                            <p className="text-sm text-destructive">
                              {formatCurrency(order.amountOutstanding)} due
                            </p>
                          )}
                        </div>
                        {getStatusBadge(order.status)}
                        <CaretRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {orderPagination && orderPagination.page < orderPagination.pageCount && (
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={loadMoreOrders}
                    disabled={isLoadingOrders}
                  >
                    {isLoadingOrders ? 'Loading...' : 'Load More Orders'}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Customer contact details and address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.email && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <EnvelopeSimple size={18} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{customer.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(customer.email, 'Email')}
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(customer.phone!, 'Phone')}
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              )}

              {(customer.address || customer.city) && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin size={18} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">
                      {customer.address && <span>{customer.address}<br /></span>}
                      {customer.city && <span>{customer.city}</span>}
                      {customer.state && <span>, {customer.state}</span>}
                      {customer.zipCode && <span> {customer.zipCode}</span>}
                    </p>
                  </div>
                </div>
              )}

              {customer.printavoId && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Package size={18} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Printavo ID</p>
                    <p className="font-medium">{customer.printavoId}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Internal notes about this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.notes ? (
                <p className="text-foreground whitespace-pre-wrap">{customer.notes}</p>
              ) : (
                <p className="text-muted-foreground italic">No notes added yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
