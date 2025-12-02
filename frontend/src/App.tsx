/**
 * PrintShop OS - Main Application
 * Three-Portal Architecture: Owner/Employee/Customer
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { useAuth } from "./contexts/AuthContext"

// Page imports
import { CustomerLanding } from "./pages/public/CustomerLanding"
import { CustomerLogin } from "./pages/auth/CustomerLogin"
import { EmployeeLogin } from "./pages/auth/EmployeeLogin"
import { AdminLogin } from "./pages/auth/AdminLogin"
import { EmployeeLayout } from "./pages/employee/EmployeeLayout"
import { AdminLayout } from "./pages/admin/AdminLayout"
import { Portal } from "./components/portal/Portal"
import { AuthPage } from "./components/auth/AuthPage"
import OnlineDesignerPage from "./apps/online-designer/pages/Index"

// Public pages
import { FAQ } from "./pages/public/FAQ"
import { Contact } from "./pages/public/Contact"
import { ShippingInfo } from "./pages/public/ShippingInfo"
import { Privacy } from "./pages/public/Privacy"
import { Terms } from "./pages/public/Terms"
import { ForgotPassword } from "./pages/auth/ForgotPassword"

// Legacy imports for backward compatibility
import OrderStatus from "./pages/OrderStatus"
import QuoteApproval from "./pages/QuoteApproval"

// Root redirect component - redirects based on authentication state
function RootRedirect() {
  const { isAuthenticated, userType, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <CustomerLanding />
  }
  
  // Redirect authenticated users to their appropriate portal
  switch (userType) {
    case 'owner':
      return <Navigate to="/admin" replace />
    case 'employee':
      return <Navigate to="/production" replace />
    case 'customer':
      return <Navigate to="/portal" replace />
    default:
      return <CustomerLanding />
  }
}

// Legacy login page that redirects to appropriate login
function LegacyLoginPage() {
  const { isAuthenticated, userType } = useAuth()
  
  // If already authenticated, redirect to appropriate page
  if (isAuthenticated) {
    switch (userType) {
      case 'owner':
        return <Navigate to="/admin" replace />
      case 'employee':
        return <Navigate to="/production" replace />
      case 'customer':
        return <Navigate to="/portal" replace />
    }
  }
  
  // Default to the combined auth page for backward compatibility
  return <AuthPage />
}

// Main App with three-portal routing
function App() {
  return (
    <Router>
      <Routes>
        {/* ===== Public Routes ===== */}
        {/* Root - Customer Landing or redirect based on auth */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Online Designer - public access */}
        <Route path="/designer" element={<OnlineDesignerPage />} />
        
        {/* Public order tracking */}
        <Route path="/track/:orderNumber" element={<OrderStatus />} />
        <Route path="/track" element={<OrderStatus />} />
        
        {/* Public quote approval */}
        <Route path="/quote/:token" element={<QuoteApproval />} />
        
        {/* Public information pages */}
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/shipping" element={<ShippingInfo />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* ===== Login Routes ===== */}
        {/* Role-specific login pages */}
        <Route path="/login/customer" element={<CustomerLogin />} />
        <Route path="/login/employee" element={<EmployeeLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Legacy combined login (for backward compatibility) */}
        <Route path="/login" element={<LegacyLoginPage />} />
        
        {/* ===== Customer Portal Routes ===== */}
        {/* Customer portal with internal routing */}
        <Route path="/portal/*" element={<Portal />} />
        
        {/* ===== Employee Portal Routes ===== */}
        {/* Employee production dashboard */}
        <Route path="/production/*" element={<EmployeeLayout />} />
        
        {/* ===== Admin/Owner Routes ===== */}
        {/* Full admin dashboard */}
        <Route path="/admin/*" element={<AdminLayout />} />
        
        {/* ===== Fallback Routes ===== */}
        {/* Redirect old dashboard routes to admin */}
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/jobs" element={<Navigate to="/admin" replace />} />
        <Route path="/customers" element={<Navigate to="/admin" replace />} />
        <Route path="/settings" element={<Navigate to="/admin" replace />} />
        
        {/* Catch-all redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App