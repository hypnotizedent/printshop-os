/**
 * Authentication Context
 * Provides authentication state and actions for customer and employee login.
 * Uses JWT token auth with Strapi backend.
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
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
}

export type UserType = 'customer' | 'employee' | null;

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  userType: UserType;
  customer: Customer | null;
  employee: Employee | null;
  token: string | null;
  loginCustomer: (payload: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  signupCustomer: (payload: { name: string; email: string; password: string; phone?: string; company?: string }) => Promise<{ success: boolean; error?: string }>;
  validateEmployeePIN: (payload: { pin: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';
const TOKEN_KEY = 'printshop_auth_token';

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<UserType>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());

  const refreshAuth = async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setIsAuthenticated(false);
      setUserType(null);
      setCustomer(null);
      setEmployee(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        headers: { 'Authorization': `Bearer ${storedToken}` },
      });
      if (!res.ok) throw new Error('Verification failed');
      const data = await res.json();
      
      setIsAuthenticated(true);
      setToken(storedToken);
      
      if (data.type === 'customer') {
        setUserType('customer');
        setCustomer(data.user);
        setEmployee(null);
      } else if (data.type === 'employee') {
        setUserType('employee');
        setEmployee(data.employee);
        setCustomer(null);
      }
    } catch {
      clearStoredToken();
      setIsAuthenticated(false);
      setUserType(null);
      setCustomer(null);
      setEmployee(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const loginCustomer: AuthContextValue['loginCustomer'] = async ({ email, password }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error?.message || 'Login failed' };
      }
      
      setStoredToken(data.token);
      setToken(data.token);
      setIsAuthenticated(true);
      setUserType('customer');
      setCustomer(data.user);
      setEmployee(null);
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signupCustomer: AuthContextValue['signupCustomer'] = async ({ name, email, password, phone, company }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/customer/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, company }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error?.message || 'Signup failed' };
      }
      
      setStoredToken(data.token);
      setToken(data.token);
      setIsAuthenticated(true);
      setUserType('customer');
      setCustomer(data.user);
      setEmployee(null);
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const validateEmployeePIN: AuthContextValue['validateEmployeePIN'] = async ({ pin }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/employee/validate-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error?.message || 'Invalid PIN' };
      }
      
      setStoredToken(data.token);
      setToken(data.token);
      setIsAuthenticated(true);
      setUserType('employee');
      setEmployee(data.employee);
      setCustomer(null);
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      const storedToken = getStoredToken();
      if (storedToken) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${storedToken}` },
        });
      }
    } finally {
      clearStoredToken();
      setToken(null);
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
      token,
      loginCustomer,
      signupCustomer,
      validateEmployeePIN,
      logout,
      refreshAuth,
    }),
    [isAuthenticated, isLoading, userType, customer, employee, token]
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
