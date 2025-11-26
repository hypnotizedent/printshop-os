/**
 * Authentication Types
 * Phase 1: Customer & Employee Authentication
 */

export interface CustomerSignupData {
  email: string;
  password: string;
  name: string;
  company?: string;
  phone?: string;
}

export interface CustomerLoginData {
  email: string;
  password: string;
}

export interface CustomerAuthResponse {
  success: boolean;
  token?: string;
  customer?: {
    id: string;
    documentId: string;
    email: string;
    name: string;
    company?: string;
  };
  error?: string;
}

export interface EmployeePINValidation {
  pin: string;
  employeeId?: string;
}

export interface EmployeeAuthResponse {
  success: boolean;
  token?: string;
  employee?: {
    id: string;
    documentId: string;
    name: string;
    pin: string;
  };
  error?: string;
}

export interface JWTPayload {
  id: string;
  documentId: string;
  email?: string;
  type: 'customer' | 'employee';
  iat?: number;
  exp?: number;
}
