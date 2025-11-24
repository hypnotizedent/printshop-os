# Customer Portal Components

React components for customer order history and details view.

## Components

### OrderHistory

Main component that displays a list of orders with pagination, filtering, sorting, and search functionality.

**Features:**
- Responsive design (table view for desktop, card view for mobile)
- Pagination with page numbers
- Status filtering
- Date range filtering
- Search by order number, product name, or PO number
- Sort by date, amount, order number, or status
- Order details modal

**Usage:**

```tsx
import { OrderHistory } from '@/components/portal'

function CustomerPortalPage() {
  return (
    <div className="container mx-auto py-6">
      <OrderHistory />
    </div>
  )
}
```

**Props:**
- `customerId` (optional): Filter orders by customer ID

### OrderDetails

Displays detailed information about a specific order including items, pricing, customer info, and shipping details.

**Features:**
- Order information with status badge
- Customer and shipping address display
- Line items with quantities and pricing
- Complete pricing breakdown (subtotal, fees, tax, shipping, discounts)
- Download buttons for invoice and art files
- Order notes display
- Mobile-responsive layout

**Usage:**

```tsx
import { OrderDetails } from '@/components/portal'

function OrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null)

  // Fetch order...

  return (
    <div className="container mx-auto py-6">
      {order && (
        <OrderDetails
          order={order}
          onDownloadInvoice={(orderId) => {
            window.open(`/api/customer/orders/${orderId}/invoice`, '_blank')
          }}
          onDownloadFiles={(orderId) => {
            window.open(`/api/customer/orders/${orderId}/files`, '_blank')
          }}
        />
      )}
    </div>
  )
}
```

**Props:**
- `order` (required): Order object with all details
- `onDownloadInvoice` (required): Callback function for invoice download
- `onDownloadFiles` (required): Callback function for files download

### OrderFilters

Filter controls for order list with status and date range filters.

**Features:**
- Status dropdown (all statuses available)
- Date range picker (from/to dates)
- Clear filters button
- Touch-friendly on mobile

**Usage:**

```tsx
import { OrderFilters, type OrderFilterState } from '@/components/portal'

function OrderListPage() {
  const handleFilterChange = (filters: OrderFilterState) => {
    console.log('Filters:', filters)
    // Apply filters to order list
  }

  const handleClearFilters = () => {
    console.log('Clearing filters')
    // Reset filters
  }

  return (
    <OrderFilters
      onFilterChange={handleFilterChange}
      onClearFilters={handleClearFilters}
    />
  )
}
```

**Props:**
- `onFilterChange` (required): Callback when filters change
- `onClearFilters` (required): Callback when clear filters is clicked

**Filter State:**
```typescript
interface OrderFilterState {
  status?: string
  dateFrom?: Date
  dateTo?: Date
}
```

### OrderSearch

Search input with debouncing for finding orders by order number, product name, or PO number.

**Features:**
- Debounced search (300ms default)
- Search icon
- Customizable placeholder

**Usage:**

```tsx
import { OrderSearch } from '@/components/portal'

function OrderListPage() {
  const handleSearch = (query: string) => {
    console.log('Search query:', query)
    // Perform search
  }

  return (
    <OrderSearch
      onSearch={handleSearch}
      placeholder="Search by order number, product name, or PO..."
      debounceMs={300}
    />
  )
}
```

**Props:**
- `onSearch` (required): Callback function called with search query
- `placeholder` (optional): Input placeholder text
- `debounceMs` (optional): Debounce delay in milliseconds (default: 300)

## Types

All types are defined in `@/lib/types.ts`:

```typescript
export type OrderStatus = 
  | 'quote'
  | 'pending'
  | 'in_production'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'invoice_paid'
  | 'payment_due'

export interface Order {
  id: number
  attributes: {
    printavoId: string
    customer: OrderCustomer
    billingAddress?: OrderAddress
    shippingAddress?: OrderAddress
    status: OrderStatus
    totals: OrderTotals
    lineItems: OrderLineItem[]
    timeline: OrderTimeline
    notes?: string
    productionNotes?: string
    orderNickname?: string
  }
}

export interface OrderListResponse {
  data: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
```

## API Integration

The components expect the API to be running at the URL specified in the `VITE_API_URL` environment variable (default: `http://localhost:3002`).

### Environment Setup

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3002
```

### API Endpoints Used

- `GET /api/customer/orders` - List orders
- `GET /api/customer/orders/:id` - Get order details
- `GET /api/customer/orders/:id/invoice` - Download invoice PDF
- `GET /api/customer/orders/:id/files` - Download art files

## Styling

The components use:
- Tailwind CSS for styling
- Radix UI for accessible components
- shadcn/ui components from `@/components/ui`
- Phosphor Icons for icons
- date-fns for date formatting

## Mobile Responsiveness

All components are fully responsive:

- **OrderHistory**: Switches from table view (desktop) to card view (mobile) at 768px breakpoint
- **OrderDetails**: Stacks elements vertically on mobile, side-by-side on desktop
- **OrderFilters**: Wraps controls on smaller screens
- **OrderSearch**: Full width on mobile with touch-friendly input

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled

## Performance

- Pagination limits data loaded at once (10 items per page default)
- Search debounced at 300ms to reduce API calls
- Order details loaded on-demand
- Downloads open in new tab/window to prevent page blocking
