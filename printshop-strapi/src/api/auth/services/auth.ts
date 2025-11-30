/**
 * Auth Service for PrintShop OS
 * Handles JWT token generation/verification and password hashing
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'printshop-os-secret-key-change-in-production';
const JWT_EXPIRES_IN_CUSTOMER = '7d';
const JWT_EXPIRES_IN_EMPLOYEE = '12h';
const BCRYPT_SALT_ROUNDS = 12;

// Types
export interface CustomerTokenPayload {
  id: number;
  documentId: string;
  email: string;
  type: 'customer';
}

export interface EmployeeTokenPayload {
  id: number;
  documentId: string;
  email?: string;
  role: string;
  department: string;
  type: 'employee';
}

export type TokenPayload = CustomerTokenPayload | EmployeeTokenPayload;

export interface CustomerData {
  id: number;
  documentId: string;
  email: string;
  name: string;
  phone?: string | null;
  company?: string | null;
}

export interface EmployeeData {
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  department: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a password with a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a customer
 */
export function generateCustomerToken(customer: {
  id: number;
  documentId: string;
  email: string;
}): string {
  const payload: CustomerTokenPayload = {
    id: customer.id,
    documentId: customer.documentId,
    email: customer.email,
    type: 'customer',
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN_CUSTOMER });
}

/**
 * Generate a JWT token for an employee
 */
export function generateEmployeeToken(employee: {
  id: number;
  documentId: string;
  email?: string;
  role: string;
  department: string;
}): string {
  const payload: EmployeeTokenPayload = {
    id: employee.id,
    documentId: employee.documentId,
    email: employee.email,
    role: employee.role,
    department: employee.department,
    type: 'employee',
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN_EMPLOYEE });
}

/**
 * Verify a JWT token and return the decoded payload
 */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * Check if an error is a TokenExpiredError
 */
export function isTokenExpiredError(error: unknown): boolean {
  return error instanceof jwt.TokenExpiredError;
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  return { valid: true };
}

/**
 * Validate PIN format
 */
export function isValidPIN(pin: string): { valid: boolean; message?: string } {
  if (!pin) {
    return { valid: false, message: 'PIN is required' };
  }
  if (pin.length < 4 || pin.length > 6) {
    return { valid: false, message: 'PIN must be 4-6 digits' };
  }
  if (!/^\d+$/.test(pin)) {
    return { valid: false, message: 'PIN must contain only digits' };
  }
  return { valid: true };
}

/**
 * Remove sensitive fields from customer data
 */
export function sanitizeCustomer(customer: Record<string, any>): CustomerData {
  const { passwordHash, ...customerData } = customer;
  return customerData as CustomerData;
}

/**
 * Remove sensitive fields from employee data
 */
export function sanitizeEmployee(employee: Record<string, any>): EmployeeData {
  const { pin, ...employeeData } = employee;
  return employeeData as EmployeeData;
}

export default {
  hashPassword,
  verifyPassword,
  generateCustomerToken,
  generateEmployeeToken,
  verifyToken,
  isTokenExpiredError,
  extractTokenFromHeader,
  isValidEmail,
  isValidPassword,
  isValidPIN,
  sanitizeCustomer,
  sanitizeEmployee,
};
