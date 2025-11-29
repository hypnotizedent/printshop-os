import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Navigation } from "./Navigation"
import { Dashboard } from "./Dashboard"
import { OrderHistory as OrderHistoryComponent } from "./OrderHistory"
import { QuotesPage } from "./QuotesPage"
import { ProfileSettings } from "./ProfileSettings"
import { CustomerAuthProvider, useCustomerAuthContext } from "@/hooks/useCustomerAuth"
import { fetchCustomerStats, type PortalCustomer } from "@/lib/portal-api"
import type { 
  CustomerUser, 
  CustomerDashboardStats, 
  CustomerOrder, 
  CustomerNotification,
  QuoteRequest 
} from "@/lib/types"

// Convert PortalCustomer to CustomerUser for Navigation component
function mapCustomerToUser(customer: PortalCustomer | null): CustomerUser {
  if (!customer) {
    return {
      id: "0",
      name: "Guest",
      email: "",
      role: "customer"
    }
  }
  return {
    id: customer.id,
    name: customer.name || customer.email,
    email: customer.email,
    company: customer.company,
    role: "customer"
  }
}

// Default stats when loading or no customer
const defaultStats: CustomerDashboardStats = {
  ordersThisMonth: 0,
  pendingQuotes: 0,
  activeJobs: 0,
  totalSpentYTD: 0
}

// Mock notifications (TODO: implement notification system)
const mockNotifications: CustomerNotification[] = []

// Mock pending quotes (TODO: wire to Strapi quotes)
const mockPendingQuotes: QuoteRequest[] = []

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
  return (
    <CustomerAuthProvider>
      <PortalContent />
    </CustomerAuthProvider>
  )
}

function PortalContent() {
  const { customer, logout, isLoggedIn, isLoading } = useCustomerAuthContext()
  const [stats, setStats] = useState<CustomerDashboardStats>(defaultStats)
  const [recentOrders, setRecentOrders] = useState<CustomerOrder[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  // Fetch dashboard stats when customer logs in
  useEffect(() => {
    async function loadDashboardData() {
      if (!customer?.documentId) {
        setStatsLoading(false)
        return
      }

      setStatsLoading(true)
      try {
        const dashboardStats = await fetchCustomerStats(customer.documentId)
        setStats(dashboardStats)
      } catch (err) {
        console.error('Failed to load dashboard stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }

    loadDashboardData()
  }, [customer?.documentId])

  const user = mapCustomerToUser(customer)

  const handleSearch = () => {
    // TODO: Implement search functionality
    // This will be connected to the backend search API
  }

  const handleLogout = () => {
    logout()
    // Redirect to login page
    window.location.href = '/login'
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-background">
        <Navigation 
          user={user}
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
                    stats={stats}
                    recentOrders={recentOrders}
                    notifications={mockNotifications}
                    pendingQuotes={mockPendingQuotes}
                    userName={user.name.split(' ')[0]}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/portal/orders/history" 
              element={
                <ProtectedRoute allowedUserTypes={["customer"]}>
                  <OrderHistoryComponent customerId={customer?.documentId} />
                </ProtectedRoute>
              } 
            />
            <Route path="/portal/orders/track" element={<ProtectedRoute allowedUserTypes={["customer"]}><TrackOrders /></ProtectedRoute>} />
            <Route path="/portal/quotes/request" element={<ProtectedRoute allowedUserTypes={["customer"]}><RequestQuote /></ProtectedRoute>} />
            <Route 
              path="/portal/quotes/pending" 
              element={
                <ProtectedRoute allowedUserTypes={["customer"]}>
                  <QuotesPage customerId={customer?.documentId} showOnlyPending={true} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/portal/quotes/history" 
              element={
                <ProtectedRoute allowedUserTypes={["customer"]}>
                  <QuotesPage customerId={customer?.documentId} showOnlyPending={false} />
                </ProtectedRoute>
              } 
            />
            <Route path="/portal/account/profile" element={<ProtectedRoute allowedUserTypes={["customer"]}><ProfileSettings /></ProtectedRoute>} />
            <Route path="/portal/account/addresses" element={<ProtectedRoute allowedUserTypes={["customer"]}><ProfileSettings /></ProtectedRoute>} />
            <Route path="/portal/account/payment" element={<ProtectedRoute allowedUserTypes={["customer"]}><PaymentMethods /></ProtectedRoute>} />
            <Route path="/portal/account/notifications" element={<ProtectedRoute allowedUserTypes={["customer"]}><ProfileSettings /></ProtectedRoute>} />
            <Route path="/portal/support/contact" element={<ProtectedRoute allowedUserTypes={["customer"]}><ContactSupport /></ProtectedRoute>} />
            <Route path="/portal/support/tickets" element={<ProtectedRoute allowedUserTypes={["customer"]}><SupportTickets /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/portal" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
