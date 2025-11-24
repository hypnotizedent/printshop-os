# Customer Portal Components

This directory contains the Customer Portal dashboard and navigation interface components for PrintShop OS.

## 📁 Component Structure

```
portal/
├── Portal.tsx              # Main portal wrapper with routing
├── Dashboard.tsx           # Dashboard page with overview
├── Navigation.tsx          # Responsive navigation sidebar/hamburger
├── DashboardWidgets.tsx    # Overview statistics widgets
├── QuickActions.tsx        # Quick action buttons
├── RecentOrders.tsx        # Recent orders display
├── Notifications.tsx       # Notification center
├── index.ts               # Barrel exports
└── __tests__/
    └── dashboard.test.tsx  # Comprehensive test suite (28 tests)
```

## 🎯 Features

### Navigation
- **Desktop**: Sidebar navigation with expandable sections
- **Mobile**: Hamburger menu with full-screen overlay
- **Navigation Structure**:
  - Dashboard
  - Orders (Order History, Track Orders)
  - Quotes (Request Quote, Pending Quotes, Quote History)
  - Account (Profile, Addresses, Payment Methods, Notifications)
  - Support (Contact Us, My Tickets)

### Dashboard
- Welcome message with user name
- Breadcrumb navigation
- Search functionality for orders and products
- Dashboard statistics widgets
- Quick action buttons
- Recent orders summary (last 5 orders)
- Notifications center
- Pending quotes alert

### Responsive Design
- **Mobile**: < 768px (stacked layout, hamburger menu)
- **Tablet**: 768px - 1024px (2-column widgets)
- **Desktop**: > 1024px (sidebar nav, 4-column widgets)

## 🚀 Usage

### Import Portal Component

```tsx
import { Portal } from "@/components/portal"

function App() {
  return <Portal />
}
```

### Import Individual Components

```tsx
import { 
  Dashboard, 
  Navigation, 
  DashboardWidgets, 
  QuickActions,
  RecentOrders,
  Notifications 
} from "@/components/portal"
```

### Example with Custom Data

```tsx
import { Dashboard } from "@/components/portal"

const stats = {
  ordersThisMonth: 12,
  pendingQuotes: 3,
  activeJobs: 2,
  totalSpentYTD: 45234
}

const orders = [
  {
    id: "1",
    orderNumber: "12345",
    status: "completed",
    total: 1245,
    date: "2024-11-15",
    items: 3
  }
]

function MyDashboard() {
  return (
    <Dashboard
      stats={stats}
      recentOrders={orders}
      notifications={[]}
      pendingQuotes={[]}
      userName="John"
    />
  )
}
```

## 🧪 Testing

Run tests with:

```bash
npm run test:run
```

All 28 tests cover:
- Dashboard rendering and data display
- Widget statistics
- Quick actions functionality
- Recent orders display
- Notifications management
- Search functionality
- Responsive layout
- Accessibility features

## 🎨 Components

### Portal
Main component that sets up routing and wraps all portal pages.

**Props**: None (uses internal mock data)

### Dashboard
Main dashboard page with overview and widgets.

**Props**:
- `stats: CustomerDashboardStats` - Dashboard statistics
- `recentOrders: CustomerOrder[]` - Recent orders list
- `notifications: CustomerNotification[]` - Notification list
- `pendingQuotes: QuoteRequest[]` - Pending quotes
- `userName?: string` - User's first name

### Navigation
Responsive navigation component with sidebar (desktop) and hamburger menu (mobile).

**Props**:
- `user: CustomerUser` - User information
- `notificationCount?: number` - Unread notification count
- `onSearch?: () => void` - Search handler
- `onLogout?: () => void` - Logout handler

### DashboardWidgets
Grid of statistics cards showing key metrics.

**Props**:
- `stats: CustomerDashboardStats` - Dashboard statistics

### QuickActions
Grid of quick action buttons for common tasks.

**Props**: None

### RecentOrders
List of recent orders with status and details.

**Props**:
- `orders: CustomerOrder[]` - List of recent orders

### Notifications
Notification center with alerts and messages.

**Props**:
- `notifications: CustomerNotification[]` - List of notifications
- `onDismiss?: (id: string) => void` - Dismiss notification handler
- `onMarkAsRead?: (id: string) => void` - Mark as read handler

## 📊 Type Definitions

All types are defined in `/src/lib/types.ts`:

- `CustomerUser`
- `CustomerDashboardStats`
- `CustomerOrder`
- `OrderStatus`
- `CustomerNotification`
- `QuoteRequest`

## ♿ Accessibility

- Keyboard navigation support (Tab, Enter, Escape)
- ARIA labels on all interactive elements
- Focus indicators
- Screen reader friendly
- Semantic HTML structure

## 📱 Mobile Support

- Touch-friendly interactive elements
- Mobile-optimized layouts
- Responsive breakpoints
- Hamburger menu for navigation
- Full-screen mobile menu overlay

## 🎯 Performance

- Lazy loading ready
- Optimized re-renders
- Efficient state management
- Minimal dependencies

## 🔗 Related Components

This portal uses UI components from:
- `/components/ui/card`
- `/components/ui/button`
- `/components/ui/badge`
- `/components/ui/input`
- `/components/ui/breadcrumb`
- `/components/ui/alert`
- `/components/ui/scroll-area`
- `/components/ui/avatar`

## 📝 Notes

- React Router v6 is required for routing
- Mock data is included in Portal.tsx for demonstration
- Placeholder pages exist for all routes
- Ready for backend integration
