import { useState } from "react"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { Input } from "@/components/ui/input"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { DashboardWidgets } from "./DashboardWidgets"
import { QuickActions } from "./QuickActions"
import { RecentOrders } from "./RecentOrders"
import { Notifications } from "./Notifications"
import type { CustomerDashboardStats, CustomerOrder, CustomerNotification, QuoteRequest } from "@/lib/types"

interface DashboardProps {
  stats: CustomerDashboardStats
  recentOrders: CustomerOrder[]
  notifications: CustomerNotification[]
  pendingQuotes: QuoteRequest[]
  userName?: string
}

export function Dashboard({ 
  stats, 
  recentOrders, 
  notifications,
  pendingQuotes,
  userName = "Customer"
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [notificationList, setNotificationList] = useState(notifications)

  const handleDismissNotification = (id: string) => {
    setNotificationList(prev => prev.filter(n => n.id !== id))
  }

  const handleMarkAsRead = (id: string) => {
    setNotificationList(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/portal">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Welcome back, {userName}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your account
            </p>
          </div>
          
          {/* Search */}
          <div className="relative w-full md:w-80">
            <MagnifyingGlass 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
              size={20} 
            />
            <Input
              type="search"
              placeholder="Search orders, products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Dashboard Widgets */}
        <DashboardWidgets stats={stats} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Orders and Notifications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrders orders={recentOrders} />
          <Notifications 
            notifications={notificationList}
            onDismiss={handleDismissNotification}
            onMarkAsRead={handleMarkAsRead}
          />
        </div>

        {/* Pending Quotes Alert */}
        {pendingQuotes.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-yellow-500 text-xl font-bold">!</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Pending Quotes Awaiting Review
                </h3>
                <p className="text-sm text-muted-foreground">
                  You have {pendingQuotes.length} quote{pendingQuotes.length === 1 ? '' : 's'} waiting for your approval.
                </p>
                <div className="mt-3 space-y-2">
                  {pendingQuotes.slice(0, 3).map(quote => (
                    <div key={quote.id} className="text-sm">
                      <span className="font-medium text-foreground">
                        Quote #{quote.quoteNumber}
                      </span>
                      {' - '}
                      <span className="text-muted-foreground">
                        {quote.description}
                      </span>
                      {quote.estimatedTotal && (
                        <span className="ml-2 font-semibold text-foreground">
                          ${quote.estimatedTotal.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
