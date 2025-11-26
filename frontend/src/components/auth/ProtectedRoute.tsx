/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Allowed user types - if specified, only these types can access
   */
  allowedUserTypes?: ('customer' | 'employee')[];
  /**
   * Fallback component to show when not authenticated
   */
  fallback?: ReactNode;
}

/**
 * Wraps components that require authentication
 * Shows loading state while checking auth, redirects to login if not authenticated
 * 
 * @example
 * ```tsx
 * // Protect customer portal
 * <ProtectedRoute allowedUserTypes={['customer']}>
 *   <CustomerDashboard />
 * </ProtectedRoute>
 * 
 * // Protect employee dashboard
 * <ProtectedRoute allowedUserTypes={['employee']}>
 *   <ProductionDashboard />
 * </ProtectedRoute>
 * 
 * // Protect any authenticated route
 * <ProtectedRoute>
 *   <Settings />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({ 
  children, 
  allowedUserTypes,
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, userType } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show fallback or redirect message
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex h-screen items-center justify-center bg-muted/50">
        <div className="text-center space-y-4 p-8 rounded-lg bg-card border max-w-md">
          <h2 className="text-2xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground">
            Please log in to access this page.
          </p>
          <a 
            href="/login" 
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Check if user type is allowed
  if (allowedUserTypes && userType && !allowedUserTypes.includes(userType)) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/50">
        <div className="text-center space-y-4 p-8 rounded-lg bg-card border max-w-md">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Current user type: {userType}
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
}
