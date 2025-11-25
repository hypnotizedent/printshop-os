/**
 * Customer Portal Demo Page
 * 
 * Example implementation showing how to use the OrderHistory component
 * in a customer portal page.
 * 
 * This file demonstrates:
 * - Basic usage of OrderHistory component
 * - Integration with routing (if using React Router)
 * - Layout and styling
 */

import { OrderHistory } from '../frontend/src/components/portal'

/**
 * Simple customer portal page with order history
 */
export function CustomerPortalPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Customer Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome back!</p>
            </div>
            <nav className="flex gap-4">
              <a href="/portal/orders" className="text-sm font-medium hover:underline">
                Orders
              </a>
              <a href="/portal/quotes" className="text-sm font-medium hover:underline">
                Quotes
              </a>
              <a href="/portal/account" className="text-sm font-medium hover:underline">
                Account
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <OrderHistory />
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PrintShop OS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

/**
 * Example with React Router integration
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

export function CustomerPortalApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/portal/orders" replace />} />
        <Route path="/portal/orders" element={<CustomerPortalPage />} />
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  )
}

/**
 * Standalone usage (no routing)
 * 
 * This is the simplest way to use the component.
 * Just render it anywhere in your app.
 */
export function SimpleUsage() {
  return (
    <div className="container mx-auto py-8">
      <OrderHistory />
    </div>
  )
}

/**
 * With custom customer ID
 * 
 * If you have customer authentication, you can pass the customer ID
 * to filter orders for that specific customer.
 */
export function AuthenticatedUsage() {
  // In a real app, this would come from your auth system
  const customerId = "customer-123"

  return (
    <div className="container mx-auto py-8">
      <OrderHistory customerId={customerId} />
    </div>
  )
}

/**
 * API Configuration
 * 
 * The components expect the API to be available at the URL specified
 * in the VITE_API_URL environment variable.
 * 
 * Create a .env file in your frontend directory:
 * 
 * ```
 * VITE_API_URL=http://localhost:3002
 * ```
 * 
 * Or set it directly in your code:
 * 
 * ```typescript
 * process.env.VITE_API_URL = 'https://api.yoursite.com'
 * ```
 */

/**
 * Complete Example with Layout
 */
export function CompleteExample() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">PrintShop OS</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">john@example.com</span>
              <button className="text-sm font-medium hover:underline">Logout</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card p-6">
          <nav className="space-y-2">
            <a
              href="/portal/orders"
              className="block px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground"
            >
              Order History
            </a>
            <a
              href="/portal/quotes"
              className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
            >
              Quotes
            </a>
            <a
              href="/portal/account"
              className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
            >
              Account Settings
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <OrderHistory />
        </main>
      </div>
    </div>
  )
}

/**
 * Usage Instructions
 * 
 * 1. Start the API server:
 *    ```bash
 *    cd services/api
 *    npm install
 *    npm run dev
 *    ```
 * 
 * 2. Start the frontend:
 *    ```bash
 *    cd frontend
 *    npm install
 *    npm run dev
 *    ```
 * 
 * 3. Open http://localhost:5173 in your browser
 * 
 * 4. The OrderHistory component will fetch and display orders from the API
 * 
 * 5. You can:
 *    - Search for orders
 *    - Filter by status and date range
 *    - Sort by various fields
 *    - View order details
 *    - Download invoices and files
 *    - Navigate through pages
 */
