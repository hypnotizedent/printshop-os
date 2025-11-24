/**
 * JWT Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, User } from '../types';

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'printshop-os-secret-key-change-in-production';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication token required',
      timestamp: new Date()
    });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      email: payload.email
    };
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
      timestamp: new Date()
    });
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(...roles: Array<'operator' | 'supervisor' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date()
      });
      return;
    }

    next();
  };
}

/**
 * Verify JWT token for WebSocket authentication
 */
export function verifyWebSocketToken(token: string): User | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      email: payload.email
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate JWT token for testing purposes
 * @param user - User object to encode in the token
 * @param expiresIn - Token expiration time (e.g., '24h', '7d', or seconds as number)
 */
export function generateToken(user: User, expiresIn: string | number = '24h'): string {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    email: user.email
  };
  // Type assertion needed due to ms.StringValue template literal type in jsonwebtoken
  // jwt.sign accepts both string (like '24h') and number (seconds) for expiresIn
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: expiresIn as any
  });
}
