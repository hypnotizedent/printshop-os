import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  EnvelopeSimple, 
  Phone, 
  Buildings, 
  Package, 
  CurrencyDollar,
  Plus,
  Clock,
  FileText
} from "@phosphor-icons/react"
import type { Customer } from "@/lib/types"

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';

interface Order {
  id: string;
  documentId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  dueDate: string;
  createdAt: string;
  notes?: string;
  items?: Array<{
    description?: string;
    quantity?: number;
  }>;
}

interface CustomerDetailPageProps {
  customerId: string;
  onBack: () => void;
  onNewOrder: (customerId: string) => void;
}

export function CustomerDetailPage({ customerId, onBack, onNewOrder }: CustomerDetailPageProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer details
  useEffect(() => {
    const fetchCustomer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/customers/${customerId}`);
        if (!res.ok) throw new Error('Failed to fetch customer');
        const data = await res.json();
        
        const c = data.data;
        setCustomer({
          id: c.documentId || c.id.toString(),
          name: c.name || 'Unknown',
          email: c.email || '',
          phone: c.phone || '',
          company: c.company || '',
          totalOrders: 0,
          totalRevenue: 0,
          lastOrderDate: c.updatedAt || new Date().toISOString(),
          status: 'active' as const,
        });
      } catch (err) {
        setError('Failed to load customer details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  // Fetch customer orders
  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        // First get the customer to find their printavoId
        const customerRes = await fetch(`${API_BASE}/api/customers/${customerId}`);
        if (!customerRes.ok) throw new Error('Failed to fetch customer');
        const customerData = await customerRes.json();
        const printavoCustomerId = customerData.data?.printavoId;
        
        if (!printavoCustomerId) {
          console.log('No Printavo ID for customer, skipping orders fetch');
          setOrders([]);
          setOrdersLoading(false);
          return;
        }
        
        // Fetch orders filtered by printavoCustomerId
        const res = await fetch(
          `${API_BASE}/api/orders?filters[printavoCustomerId][$eq]=${printavoCustomerId}&sort=createdAt:desc&pagination%5Blimit%5D=50`
        );
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        
        const fetchedOrders: Order[] = (data.data || []).map((o: any) => ({
          id: o.id.toString(),
          documentId: o.documentId,
          orderNumber: o.orderNumber || `#${o.id}`,
          status: o.status || 'PENDING',
          totalAmount: o.totalAmount || 0,
          dueDate: o.dueDate || '',
          createdAt: o.createdAt,
          notes: o.notes,
          items: o.items || [],
        }));
        
        setOrders(fetchedOrders);
        
        // Update customer stats
        if (customer) {
          const totalRevenue = fetchedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
          setCustomer(prev => prev ? {
            ...prev,
            totalOrders: fetchedOrders.length,
            totalRevenue,
            lastOrderDate: fetchedOrders[0]?.createdAt || prev.lastOrderDate,
          } : null);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setOrdersLoading(false);
      }
    };

    if (customerId && customer) {
      fetchOrders();
    }
  }, [customerId, customer?.id]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'QUOTE': 'bg-yellow-100 text-yellow-800',
      'QUOTE_SENT': 'bg-yellow-100 text-yellow-800',
      'PENDING': 'bg-blue-100 text-blue-800',
      'IN_PRODUCTION': 'bg-purple-100 text-purple-800',
      'READY_TO_SHIP': 'bg-cyan-100 text-cyan-800',
      'SHIPPED': 'bg-indigo-100 text-indigo-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'INVOICE PAID': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
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
          <p className="text-destructive">{error || 'Customer not found'}</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            Return to Customer List
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
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {customer.name}
            </h1>
            <p className="text-muted-foreground">{customer.company}</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => onNewOrder(customerId)}>
          <Plus size={18} weight="bold" />
          New Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Total Orders
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {customer.totalOrders}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Package size={24} weight="fill" className="text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">
                ${customer.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <CurrencyDollar size={24} weight="fill" className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <EnvelopeSimple size={20} className="text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium truncate">{customer.email || 'Not provided'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Phone size={20} className="text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{customer.phone || 'Not provided'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} />
            Order History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-24" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No orders found for this customer.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {ordersLoading ? 'Loading orders...' : 'Orders may still be importing from Printavo.'}
              </p>
              <Button onClick={() => onNewOrder(customerId)}>
                <Plus size={16} className="mr-2" />
                Create First Order
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div
                  key={order.documentId || order.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-foreground">
                        {order.orderNumber}
                      </span>
                      <Badge className={getStatusColor(order.status)}>
                        {formatStatus(order.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      {order.dueDate && (
                        <span>
                          Due: {new Date(order.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {order.items && order.items.length > 0 && (
                        <span>
                          {order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)} items
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">
                      ${order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
