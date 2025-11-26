/**
 * Customer Authentication Service
 * Phase 1: Customer signup, login, JWT generation
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import {
  CustomerSignupData,
  CustomerLoginData,
  CustomerAuthResponse,
  JWTPayload,
} from './types/auth.types';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

/**
 * Create a new customer account
 */
export async function signupCustomer(
  data: CustomerSignupData
): Promise<CustomerAuthResponse> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }

    // Check if customer already exists
    const existingResponse = await axios.get(
      `${STRAPI_URL}/api/customers?filters[email][$eq]=${data.email}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      }
    );

    if (existingResponse.data.data.length > 0) {
      return {
        success: false,
        error: 'Customer with this email already exists',
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create customer in Strapi
    const createResponse = await axios.post(
      `${STRAPI_URL}/api/customers`,
      {
        data: {
          email: data.email,
          name: data.name,
          company: data.company || null,
          phone: data.phone || null,
          passwordHash,
          notes: 'Customer portal signup',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const customer = createResponse.data.data;

    // Generate JWT token
    const token = generateCustomerToken({
      id: customer.id,
      documentId: customer.documentId,
      email: customer.email,
    });

    return {
      success: true,
      token,
      customer: {
        id: customer.id,
        documentId: customer.documentId,
        email: customer.email,
        name: customer.name,
        company: customer.company,
      },
    };
  } catch (error: any) {
    console.error('Customer signup error:', error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || 'Signup failed',
    };
  }
}

/**
 * Login existing customer
 */
export async function loginCustomer(
  data: CustomerLoginData
): Promise<CustomerAuthResponse> {
  try {
    // Find customer by email
    const response = await axios.get(
      `${STRAPI_URL}/api/customers?filters[email][$eq]=${data.email}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      }
    );

    if (response.data.data.length === 0) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    const customer = response.data.data[0];

    // Verify password
    if (!customer.passwordHash) {
      return {
        success: false,
        error: 'Account not configured for portal access. Please contact support.',
      };
    }

    const isValidPassword = await bcrypt.compare(
      data.password,
      customer.passwordHash
    );

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Generate JWT token
    const token = generateCustomerToken({
      id: customer.id,
      documentId: customer.documentId,
      email: customer.email,
    });

    return {
      success: true,
      token,
      customer: {
        id: customer.id,
        documentId: customer.documentId,
        email: customer.email,
        name: customer.name,
        company: customer.company,
      },
    };
  } catch (error: any) {
    console.error('Customer login error:', error.message);
    return {
      success: false,
      error: 'Login failed',
    };
  }
}

/**
 * Generate JWT token for customer
 */
function generateCustomerToken(payload: {
  id: string;
  documentId: string;
  email: string;
}): string {
  const jwtPayload: JWTPayload = {
    id: payload.id,
    documentId: payload.documentId,
    email: payload.email,
    type: 'customer',
  };

  return jwt.sign(jwtPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
