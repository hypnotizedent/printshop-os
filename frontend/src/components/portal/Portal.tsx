import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Navigation } from "./Navigation"
import { Dashboard } from "./Dashboard"
import type { 
  CustomerUser, 
  CustomerDashboardStats, 
  CustomerOrder, 
  CustomerNotification,
  QuoteRequest 
} from "@/lib/types"

// Mock data for demonstration
const mockUser: CustomerUser = {
  id: "1",
  name: "John Smith",
  email: "john.smith@example.com",
  company: "Acme Corporation",
  role: "customer"
}

const mockStats: CustomerDashboardStats = {
  ordersThisMonth: 12,
  pendingQuotes: 3,
  activeJobs: 2,
  totalSpentYTD: 45234
}

const mockOrders: CustomerOrder[] = [
  {
    id: "1",
    orderNumber: "12345",
    status: "completed",
    total: 1245,
    date: "2024-11-15",
    items: 3
  },
  {
    id: "2",
    orderNumber: "12344",
    status: "in-production",
    total: 890,
    date: "2024-11-14",
    items: 2
  },
  {
    id: "3",
    orderNumber: "12343",
    status: "shipped",
    total: 2100,
    date: "2024-11-12",
    items: 5,
    trackingNumber: "1Z999AA10123456784"
  },
  {
    id: "4",
    orderNumber: "12342",
    status: "completed",
    total: 650,
    date: "2024-11-10",
    items: 1
  },
  {
    id: "5",
    orderNumber: "12341",
    status: "completed",
    total: 1500,
    date: "2024-11-08",
    items: 4
  }
]

const mockNotifications: CustomerNotification[] = [
  {
    id: "1",
    type: "success",
    title: "Order Shipped",
    message: "Your order #12343 has been shipped and is on its way!",
    date: "2024-11-23T10:30:00Z",
    read: false,
    actionUrl: "/portal/orders/12343"
  },
  {
    id: "2",
    type: "warning",
    title: "Quote Expiring Soon",
    message: "Quote #5678 will expire in 2 days. Review and approve to proceed.",
    date: "2024-11-22T14:15:00Z",
    read: false,
    actionUrl: "/portal/quotes/pending"
  },
  {
    id: "3",
    type: "info",
    title: "New Product Available",
    message: "Check out our new premium card stock options!",
    date: "2024-11-20T09:00:00Z",
    read: true
  }
]

const mockPendingQuotes: QuoteRequest[] = [
  {
    id: "1",
    quoteNumber: "Q-2024-001",
    status: "pending",
    description: "Business Cards - 1000 units",
    requestedDate: "2024-11-20",
    estimatedTotal: 450,
    expiresAt: "2024-11-27"
  },
  {
    id: "2",
    quoteNumber: "Q-2024-002",
    status: "pending",
    description: "Brochures - 500 units, tri-fold",
    requestedDate: "2024-11-19",
    estimatedTotal: 1200,
    expiresAt: "2024-11-26"
  },
  {
    id: "3",
    quoteNumber: "Q-2024-003",
    status: "pending",
    description: "Flyers - 2000 units, full color",
    requestedDate: "2024-11-18",
    estimatedTotal: 890,
    expiresAt: "2024-11-25"
  }
]

// Placeholder components for other routes
function OrderHistory() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Order History</h1>
      <p className="text-muted-foreground mt-2">View all your past orders</p>
    </div>
  )
}

function TrackOrders() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Track Orders</h1>
      <p className="text-muted-foreground mt-2">Track your active orders</p>
    </div>
  )
}

function RequestQuote() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Request Quote</h1>
      <p className="text-muted-foreground mt-2">Submit a new quote request</p>
    </div>
  )
}

function PendingQuotes() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Pending Quotes</h1>
      <p className="text-muted-foreground mt-2">Review and approve quotes</p>
    </div>
  )
}

function QuoteHistory() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Quote History</h1>
      <p className="text-muted-foreground mt-2">View all your quotes</p>
    </div>
  )
}

function Profile() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      <p className="text-muted-foreground mt-2">Manage your account information</p>
    </div>
  )
}

function Addresses() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Addresses</h1>
      <p className="text-muted-foreground mt-2">Manage shipping and billing addresses</p>
    </div>
  )
}

function PaymentMethods() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Payment Methods</h1>
      <p className="text-muted-foreground mt-2">Manage your payment methods</p>
    </div>
  )
}

function NotificationSettings() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Notification Settings</h1>
      <p className="text-muted-foreground mt-2">Configure your notification preferences</p>
    </div>
  )
}

function ContactSupport() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Contact Us</h1>
      <p className="text-muted-foreground mt-2">Get in touch with our support team</p>
    </div>
  )
}

function SupportTickets() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">My Tickets</h1>
      <p className="text-muted-foreground mt-2">View and manage your support tickets</p>
    </div>
  )
}

export function Portal() {
  const handleSearch = () => {
    // TODO: Implement search functionality
    // This will be connected to the backend search API
  }

  const handleLogout = () => {
    // TODO: Implement logout functionality
    // This will clear session and redirect to login page
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-background">
        <Navigation 
          user={mockUser}
          notificationCount={mockNotifications.filter(n => !n.read).length}
          onSearch={handleSearch}
          onLogout={handleLogout}
        />
        <main className="flex-1 lg:ml-0">
          <div className="lg:hidden h-16" /> {/* Spacer for mobile header */}
          <Routes>
            <Route 
              path="/portal" 
              element={
                <ProtectedRoute allowedUserTypes={["customer"]}>
                  <Dashboard
                    stats={mockStats}
                    recentOrders={mockOrders}
                    notifications={mockNotifications}
                    pendingQuotes={mockPendingQuotes}
                    userName={mockUser.name.split(' ')[0]}
                  />
                </ProtectedRoute>
              } 
            />
            <Route path="/portal/orders/history" element={<ProtectedRoute allowedUserTypes={["customer"]}><OrderHistory /></ProtectedRoute>} />
            <Route path="/portal/orders/track" element={<ProtectedRoute allowedUserTypes={["customer"]}><TrackOrders /></ProtectedRoute>} />
            <Route path="/portal/quotes/request" element={<ProtectedRoute allowedUserTypes={["customer"]}><RequestQuote /></ProtectedRoute>} />
            <Route path="/portal/quotes/pending" element={<ProtectedRoute allowedUserTypes={["customer"]}><PendingQuotes /></ProtectedRoute>} />
            <Route path="/portal/quotes/history" element={<ProtectedRoute allowedUserTypes={["customer"]}><QuoteHistory /></ProtectedRoute>} />
            <Route path="/portal/account/profile" element={<ProtectedRoute allowedUserTypes={["customer"]}><Profile /></ProtectedRoute>} />
            <Route path="/portal/account/addresses" element={<ProtectedRoute allowedUserTypes={["customer"]}><Addresses /></ProtectedRoute>} />
            <Route path="/portal/account/payment" element={<ProtectedRoute allowedUserTypes={["customer"]}><PaymentMethods /></ProtectedRoute>} />
            <Route path="/portal/account/notifications" element={<ProtectedRoute allowedUserTypes={["customer"]}><NotificationSettings /></ProtectedRoute>} />
            <Route path="/portal/support/contact" element={<ProtectedRoute allowedUserTypes={["customer"]}><ContactSupport /></ProtectedRoute>} />
            <Route path="/portal/support/tickets" element={<ProtectedRoute allowedUserTypes={["customer"]}><SupportTickets /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/portal" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
