/**
 * Auth Service for PrintShop OS
 * Handles JWT token generation/verification and password hashing
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Constants
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  // Only use fallback in development/testing
  return secret || 'dev-secret-do-not-use-in-production';
}

const JWT_SECRET = getJWTSecret();
const JWT_EXPIRES_IN_CUSTOMER = '7d';
const JWT_EXPIRES_IN_EMPLOYEE = '12h';
const JWT_EXPIRES_IN_OWNER = '7d';
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

export interface OwnerTokenPayload {
  id: number;
  documentId: string;
  email: string;
  type: 'owner';
}

export type TokenPayload = CustomerTokenPayload | EmployeeTokenPayload | OwnerTokenPayload;

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

export interface OwnerData {
  id: number;
  documentId: string;
  email: string;
  name: string;
  twoFactorEnabled?: boolean;
  isActive?: boolean;
  lastLogin?: string | null;
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
 * Generate a JWT token for an owner
 */
export function generateOwnerToken(owner: {
  id: number;
  documentId: string;
  email: string;
}): string {
  const payload: OwnerTokenPayload = {
    id: owner.id,
    documentId: owner.documentId,
    email: owner.email,
    type: 'owner',
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN_OWNER });
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
 * Returns customer data without passwordHash
 */
export function sanitizeCustomer(customer: Record<string, unknown>): CustomerData {
  const { passwordHash, ...customerData } = customer;
  // Return the sanitized data - required fields come from Strapi schema
  return {
    id: customerData.id as number,
    documentId: customerData.documentId as string,
    email: customerData.email as string,
    name: customerData.name as string,
    phone: (customerData.phone as string | null | undefined) || null,
    company: (customerData.company as string | null | undefined) || null,
  };
}

/**
 * Remove sensitive fields from employee data
 * Returns employee data without pin
 */
export function sanitizeEmployee(employee: Record<string, unknown>): EmployeeData {
  const { pin, ...employeeData } = employee;
  // Return the sanitized data - required fields come from Strapi schema
  return {
    id: employeeData.id as number,
    documentId: employeeData.documentId as string,
    firstName: employeeData.firstName as string,
    lastName: employeeData.lastName as string,
    email: employeeData.email as string | undefined,
    role: employeeData.role as string,
    department: employeeData.department as string,
  };
}

/**
 * Remove sensitive fields from owner data
 * Returns owner data without passwordHash and twoFactorSecret
 */
export function sanitizeOwner(owner: Record<string, unknown>): OwnerData {
  const { passwordHash, twoFactorSecret, ...ownerData } = owner;
  // Return the sanitized data - required fields come from Strapi schema
  return {
    id: ownerData.id as number,
    documentId: ownerData.documentId as string,
    email: ownerData.email as string,
    name: ownerData.name as string,
    twoFactorEnabled: ownerData.twoFactorEnabled as boolean | undefined,
    isActive: ownerData.isActive as boolean | undefined,
    lastLogin: (ownerData.lastLogin as string | null | undefined) || null,
  };
}

export default {
  hashPassword,
  verifyPassword,
  generateCustomerToken,
  generateEmployeeToken,
  generateOwnerToken,
  verifyToken,
  isTokenExpiredError,
  extractTokenFromHeader,
  isValidEmail,
  isValidPassword,
  isValidPIN,
  sanitizeCustomer,
  sanitizeEmployee,
  sanitizeOwner,
};
