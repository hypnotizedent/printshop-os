import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusTimeline } from "./StatusTimeline"
import { orderStatusColors, formatOrderStatus } from "./order-utils"
import { 
  Eye, 
  Package,
  CalendarBlank,
  CurrencyDollar
} from "@phosphor-icons/react"
import type { Order } from "@/lib/types"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface OrderCardProps {
  order: Order
  onViewDetails?: (orderId: number) => void
  showTimeline?: boolean
  compact?: boolean
}

export function OrderCard({ 
  order, 
  onViewDetails, 
  showTimeline = false,
  compact = false 
}: OrderCardProps) {
  const { attributes } = order

  const handleViewClick = () => {
    if (onViewDetails) {
      onViewDetails(order.id)
    }
    // When no onViewDetails handler is provided, clicking does nothing
    // Navigation should be handled by the parent component with a router context
  }

  if (compact) {
    return (
      <Card 
        className="p-3 hover:bg-muted/50 transition-colors cursor-pointer border"
        onClick={handleViewClick}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground">
                #{attributes.printavoId}
              </span>
              <Badge className={cn("text-xs border", orderStatusColors[attributes.status])}>
                {formatOrderStatus(attributes.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{format(new Date(attributes.timeline.createdAt), "MMM d, yyyy")}</span>
              <span>•</span>
              <span>{attributes.lineItems.length} {attributes.lineItems.length === 1 ? 'item' : 'items'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-foreground">
              ${attributes.totals.total.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header with order number and status */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">#{attributes.printavoId}</h3>
              <Badge className={cn("border", orderStatusColors[attributes.status])}>
                {formatOrderStatus(attributes.status)}
              </Badge>
            </div>
            {attributes.orderNickname && (
              <p className="text-sm text-muted-foreground mt-1">
                {attributes.orderNickname}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewClick}
          >
            <Eye size={16} className="mr-2" />
            View
          </Button>
        </div>

        {/* Order info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarBlank size={16} />
            <div>
              <p className="text-xs text-muted-foreground">Order Date</p>
              <p className="font-medium text-foreground">
                {format(new Date(attributes.timeline.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          
          {attributes.timeline.dueDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarBlank size={16} />
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="font-medium text-foreground">
                  {format(new Date(attributes.timeline.dueDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package size={16} />
            <div>
              <p className="text-xs text-muted-foreground">Items</p>
              <p className="font-medium text-foreground">
                {attributes.lineItems.length} {attributes.lineItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <CurrencyDollar size={16} />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold text-foreground">
                ${attributes.totals.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Optional Status Timeline */}
        {showTimeline && (
          <div className="pt-2 border-t">
            <StatusTimeline status={attributes.status} compact />
          </div>
        )}

        {/* Customer info for context */}
        <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
          <span>{attributes.customer.name}</span>
          {attributes.totals.amountOutstanding > 0 && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              Balance: ${attributes.totals.amountOutstanding.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
