/**
 * JWT Middleware
 * Validates JWT tokens and adds user information to requests
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { Role } from '../production-dashboard/auth/roles';

export interface AuthRequest extends Request {
  authUser?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    userId: string; // Keep for backward compatibility
  };
}

/**
 * Middleware to validate JWT access tokens
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const payload = AuthService.verifyToken(token);

    if (payload.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    const user = AuthService.getUserById(payload.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.authUser = {
      id: user.id,
      userId: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
    };

    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication - adds user info if token is present, but doesn't fail if not
 */
export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = AuthService.verifyToken(token);
      if (payload.type === 'access') {
        const user = AuthService.getUserById(payload.userId);
        if (user) {
          req.authUser = {
            id: user.id,
            userId: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          };
        }
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
