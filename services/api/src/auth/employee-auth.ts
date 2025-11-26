/**
 * Employee Authentication Service
 * Phase 1: Employee PIN validation
 */

import jwt from 'jsonwebtoken';
import axios from 'axios';
import {
  EmployeePINValidation,
  EmployeeAuthResponse,
  JWTPayload,
} from './types/auth.types';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Validate employee PIN for production dashboard access
 */
export async function validateEmployeePIN(
  data: EmployeePINValidation
): Promise<EmployeeAuthResponse> {
  try {
    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(data.pin)) {
      return {
        success: false,
        error: 'Invalid PIN format. Must be 4-6 digits.',
      };
    }

    // Build query - search by PIN and optionally by employee ID
    let url = `${STRAPI_URL}/api/employees?filters[pin][$eq]=${data.pin}`;
    if (data.employeeId) {
      url += `&filters[documentId][$eq]=${data.employeeId}`;
    }

    // Find employee by PIN
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    });

    if (response.data.data.length === 0) {
      return {
        success: false,
        error: 'Invalid PIN',
      };
    }

    const employee = response.data.data[0];

    // Generate JWT token
    const token = generateEmployeeToken({
      id: employee.id,
      documentId: employee.documentId,
      name: employee.name,
    });

    return {
      success: true,
      token,
      employee: {
        id: employee.id,
        documentId: employee.documentId,
        name: employee.name,
        pin: employee.pin,
      },
    };
  } catch (error: any) {
    console.error('Employee PIN validation error:', error.message);
    return {
      success: false,
      error: 'PIN validation failed',
    };
  }
}

/**
 * Generate JWT token for employee
 */
function generateEmployeeToken(payload: {
  id: string;
  documentId: string;
  name: string;
}): string {
  const jwtPayload: JWTPayload = {
    id: payload.id,
    documentId: payload.documentId,
    type: 'employee',
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
