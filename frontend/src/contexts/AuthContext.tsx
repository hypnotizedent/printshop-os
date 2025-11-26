/**
 * Authentication Context
 * Provides authentication state and actions for customer and employee login.
 * Uses cookie-based session auth with Strapi backend.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// Types
export interface Customer {
  id: number;
  documentId: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
}

export interface Employee {
  id: number;
  documentId: string;
  name: string;
  role: string;
}

export type UserType = 'customer' | 'employee' | null;

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  userType: UserType;
  customer: Customer | null;
  employee: Employee | null;
  loginCustomer: (payload: { email: string }) => Promise<boolean>;
  signupCustomer: (payload: { name: string; email: string }) => Promise<boolean>;
  validateEmployeePIN: (payload: { pin: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<UserType>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);

  const refreshAuth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, { credentials: 'include' });
      if (!res.ok) throw new Error('Verification failed');
      const data = await res.json();
      setIsAuthenticated(!!data?.authenticated);
      setUserType(data?.userType ?? null);
      setCustomer(data?.customer ?? null);
      setEmployee(data?.employee ?? null);
    } catch {
      setIsAuthenticated(false);
      setUserType(null);
      setCustomer(null);
      setEmployee(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const loginCustomer: AuthContextValue['loginCustomer'] = async ({ email }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      if (!res.ok) return false;
      await refreshAuth();
      return true;
    } catch {
      return false;
    }
  };

  const signupCustomer: AuthContextValue['signupCustomer'] = async ({ name, email }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/customer/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) return false;
      await refreshAuth();
      return true;
    } catch {
      return false;
    }
  };

  const validateEmployeePIN: AuthContextValue['validateEmployeePIN'] = async ({ pin }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/employee/validate-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) return false;
      await refreshAuth();
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      setIsAuthenticated(false);
      setUserType(null);
      setCustomer(null);
      setEmployee(null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      userType,
      customer,
      employee,
      loginCustomer,
      signupCustomer,
      validateEmployeePIN,
      logout,
      refreshAuth,
    }),
    [isAuthenticated, isLoading, userType, customer, employee]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
