/**
 * RBAC Middleware
 * Express middleware for protecting routes based on permissions
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../auth/jwt.middleware';
import { Permission } from './roles';
import { permissionsService, User } from './permissions.service';
import { auditService } from './audit.service';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Middleware to require a specific permission
 */
export const requirePermission = (permission: Permission) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.authUser;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized - No user found' });
        return;
      }

      const hasPermission = await permissionsService.userHasPermission(
        user,
        permission
      );

      if (!hasPermission) {
        // Log unauthorized attempt
        await auditService.log({
          userId: user.id,
          userName: user.name,
          action: 'access_denied',
          resource: permission,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date(),
          success: false
        });

        res.status(403).json({
          error: 'Forbidden - Insufficient permissions',
          required: permission
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to require any of the specified permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.authUser;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized - No user found' });
        return;
      }

      const hasPermission = await permissionsService.userHasAnyPermission(
        user,
        permissions
      );

      if (!hasPermission) {
        // Log unauthorized attempt
        await auditService.log({
          userId: user.id,
          userName: user.name,
          action: 'access_denied',
          resource: permissions.join(','),
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date(),
          success: false
        });

        res.status(403).json({
          error: 'Forbidden - Insufficient permissions',
          required: permissions
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to require all of the specified permissions
 */
export const requireAllPermissions = (permissions: Permission[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.authUser;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized - No user found' });
        return;
      }

      const hasPermissions = await permissionsService.userHasAllPermissions(
        user,
        permissions
      );

      if (!hasPermissions) {
        // Log unauthorized attempt
        await auditService.log({
          userId: user.id,
          userName: user.name,
          action: 'access_denied',
          resource: permissions.join(','),
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date(),
          success: false
        });

        res.status(403).json({
          error: 'Forbidden - Insufficient permissions',
          required: permissions
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to log successful access
 */
export const logAccess = (action: string, resource: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    const user = req.authUser;

    if (user) {
      await auditService.log({
        userId: user.id,
        userName: user.name,
        action,
        resource,
        resourceId: req.params.id || req.params.resourceId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
        success: true
      });
    }

    next();
  };
};
