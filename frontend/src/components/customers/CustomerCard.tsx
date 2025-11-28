import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EnvelopeSimple, Phone, Package, CurrencyDollar, CalendarBlank, ArrowRight } from '@phosphor-icons/react';

export interface CustomerCardData {
  id: string;
  documentId: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate: string | null;
  status: 'active' | 'inactive';
}

interface CustomerCardProps {
  customer: CustomerCardData;
  onClick?: () => void;
  onNewOrder?: () => void;
  variant?: 'default' | 'compact';
}

export function CustomerCard({ customer, onClick, onNewOrder, variant = 'default' }: CustomerCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (variant === 'compact') {
    return (
      <Card 
        className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {customer.name}
            </h3>
            {customer.company && (
              <p className="text-sm text-muted-foreground truncate">{customer.company}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{customer.totalOrders} orders</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(customer.totalRevenue)}</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
      <div className="space-y-4">
        {/* Header with name and status */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
              {customer.name}
            </h3>
            {customer.company && (
              <p className="text-sm text-muted-foreground truncate">{customer.company}</p>
            )}
          </div>
          <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
            {customer.status}
          </Badge>
        </div>

        {/* Contact info */}
        <div className="space-y-2">
          {customer.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <EnvelopeSimple size={16} className="shrink-0" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone size={16} className="shrink-0" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Package size={12} />
              <span>Total Orders</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{customer.totalOrders}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <CurrencyDollar size={12} />
              <span>Revenue</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(customer.totalRevenue)}</p>
          </div>
        </div>

        {/* Last order date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
          <CalendarBlank size={12} />
          <span>Last order: {formatDate(customer.lastOrderDate)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onClick}
          >
            View Details
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={onNewOrder}
          >
            New Order
          </Button>
        </div>
      </div>
    </Card>
  );
}
