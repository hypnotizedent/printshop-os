import { StatusTimeline } from "../components/portal/StatusTimeline"
import { OrderCard } from "../components/portal/OrderCard"
import { Card } from "@/components/ui/card"
import type { Order, OrderStatus } from "@/lib/types"

// Mock order data for demonstration
const mockOrders: Order[] = [
  {
    id: 1,
    attributes: {
      printavoId: '25847',
      customer: { name: 'Sarah Johnson', email: 'sarah@company.com', company: 'Tech Corp' },
      status: 'in_production',
      totals: { subtotal: 450, tax: 35.10, shipping: 15, discount: 0, fees: 0, total: 500.10, amountPaid: 250, amountOutstanding: 250.10 },
      lineItems: [
        { id: '1', description: 'Custom T-Shirts - Blue', category: 'Screen Printing', quantity: 100, unitCost: 4.50, taxable: true, total: 450 }
      ],
      timeline: { createdAt: '2025-11-25T10:00:00Z', updatedAt: '2025-11-28T14:00:00Z', dueDate: '2025-12-02T12:00:00Z' },
      orderNickname: 'Annual Company Shirts'
    }
  },
  {
    id: 2,
    attributes: {
      printavoId: '25846',
      customer: { name: 'Mike Williams', email: 'mike@startup.io', company: 'Startup Inc' },
      status: 'shipped',
      totals: { subtotal: 1200, tax: 93.60, shipping: 25, discount: 100, fees: 0, total: 1218.60, amountPaid: 1218.60, amountOutstanding: 0 },
      lineItems: [
        { id: '1', description: 'Embroidered Polo Shirts', category: 'Embroidery', quantity: 50, unitCost: 15, taxable: true, total: 750 },
        { id: '2', description: 'Custom Caps', category: 'Embroidery', quantity: 50, unitCost: 9, taxable: true, total: 450 }
      ],
      timeline: { createdAt: '2025-11-20T09:00:00Z', updatedAt: '2025-11-27T16:00:00Z', dueDate: '2025-11-28T12:00:00Z' },
      orderNickname: 'Sales Team Uniforms'
    }
  },
  {
    id: 3,
    attributes: {
      printavoId: '25845',
      customer: { name: 'Emily Chen', email: 'emily@design.co', company: 'Design Co' },
      status: 'quote',
      totals: { subtotal: 800, tax: 62.40, shipping: 0, discount: 0, fees: 50, total: 912.40, amountPaid: 0, amountOutstanding: 912.40 },
      lineItems: [
        { id: '1', description: 'Custom Hoodies - Black', category: 'Screen Printing', quantity: 25, unitCost: 32, taxable: true, total: 800 }
      ],
      timeline: { createdAt: '2025-11-28T08:00:00Z', updatedAt: '2025-11-28T08:00:00Z' }
    }
  },
  {
    id: 4,
    attributes: {
      printavoId: '25844',
      customer: { name: 'David Brown', email: 'david@events.com', company: 'Events Plus' },
      status: 'completed',
      totals: { subtotal: 2500, tax: 195, shipping: 50, discount: 200, fees: 0, total: 2545, amountPaid: 2545, amountOutstanding: 0 },
      lineItems: [
        { id: '1', description: 'Event T-Shirts - Multi-color', category: 'DTG Printing', quantity: 200, unitCost: 12.50, taxable: true, total: 2500 }
      ],
      timeline: { createdAt: '2025-11-15T11:00:00Z', updatedAt: '2025-11-22T15:00:00Z', dueDate: '2025-11-22T12:00:00Z' },
      orderNickname: 'Music Festival 2025'
    }
  },
  {
    id: 5,
    attributes: {
      printavoId: '25843',
      customer: { name: 'Lisa Anderson', email: 'lisa@gym.fit', company: 'FitGym' },
      status: 'cancelled',
      totals: { subtotal: 300, tax: 23.40, shipping: 10, discount: 0, fees: 0, total: 333.40, amountPaid: 0, amountOutstanding: 0 },
      lineItems: [
        { id: '1', description: 'Gym Tank Tops', category: 'Screen Printing', quantity: 30, unitCost: 10, taxable: true, total: 300 }
      ],
      timeline: { createdAt: '2025-11-10T14:00:00Z', updatedAt: '2025-11-12T09:00:00Z' }
    }
  }
]

const allStatuses: OrderStatus[] = [
  'quote', 'pending', 'in_production', 'ready_to_ship', 'shipped', 'delivered', 'completed', 'cancelled'
]

export default function OrderComponentsDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Customer Portal - Order Components Demo</h1>
          <p className="text-muted-foreground">Showcasing the new StatusTimeline and OrderCard components</p>
        </div>

        {/* StatusTimeline Demo Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">StatusTimeline Component</h2>
          
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Full Timeline (Various Statuses)</h3>
            <div className="space-y-8">
              {allStatuses.map(status => (
                <div key={status} className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground capitalize">{status.replace('_', ' ')}:</p>
                  <StatusTimeline status={status} />
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Compact Timeline</h3>
              <div className="space-y-4">
                {allStatuses.slice(0, 4).map(status => (
                  <div key={status} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground w-24 capitalize">{status.replace('_', ' ')}:</span>
                    <StatusTimeline status={status} compact />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Timeline without Labels</h3>
              <div className="space-y-4">
                <StatusTimeline status="in_production" showLabels={false} />
              </div>
            </Card>
          </div>
        </section>

        {/* OrderCard Demo Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">OrderCard Component</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-muted-foreground">Standard Order Cards</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mockOrders.slice(0, 4).map(order => (
                <OrderCard key={order.id} order={order} onViewDetails={(id) => console.log('View order:', id)} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-muted-foreground">Order Cards with Timeline</h3>
            <div className="grid grid-cols-1 gap-4">
              {mockOrders.slice(0, 2).map(order => (
                <OrderCard key={order.id} order={order} showTimeline onViewDetails={(id) => console.log('View order:', id)} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-muted-foreground">Compact Order Cards</h3>
            <div className="space-y-2">
              {mockOrders.map(order => (
                <OrderCard key={order.id} order={order} compact onViewDetails={(id) => console.log('View order:', id)} />
              ))}
            </div>
          </div>
        </section>

        {/* Status Colors Legend */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Status Color Legend</h2>
          <Card className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/40" />
                <span className="text-sm">Quote</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/40" />
                <span className="text-sm">In Production</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/40" />
                <span className="text-sm">Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/40" />
                <span className="text-sm">Cancelled</span>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}
