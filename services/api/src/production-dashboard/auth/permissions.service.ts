/**
 * Permissions Service
 * Handles permission checking and user authorization
 */

import { Role, Permission, getRolePermissions, roleHasPermission, roleHasAnyPermission, roleHasAllPermissions } from './roles';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId?: string;
}

/**
 * Permission service for checking user permissions
 */
class PermissionsService {
  private permissionCache: Map<string, { permissions: Permission[], timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a user has a specific permission
   */
  async userHasPermission(user: User | string, permission: Permission): Promise<boolean> {
    const userObj = typeof user === 'string' ? await this.getUser(user) : user;
    if (!userObj) return false;

    return roleHasPermission(userObj.role, permission);
  }

  /**
   * Check if a user has any of the specified permissions
   */
  async userHasAnyPermission(user: User | string, permissions: Permission[]): Promise<boolean> {
    const userObj = typeof user === 'string' ? await this.getUser(user) : user;
    if (!userObj) return false;

    return roleHasAnyPermission(userObj.role, permissions);
  }

  /**
   * Check if a user has all of the specified permissions
   */
  async userHasAllPermissions(user: User | string, permissions: Permission[]): Promise<boolean> {
    const userObj = typeof user === 'string' ? await this.getUser(user) : user;
    if (!userObj) return false;

    return roleHasAllPermissions(userObj.role, permissions);
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(user: User | string): Promise<Permission[]> {
    const userObj = typeof user === 'string' ? await this.getUser(user) : user;
    if (!userObj) return [];

    // Check cache first
    const cached = this.permissionCache.get(userObj.id);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.permissions;
    }

    // Get fresh permissions
    const permissions = getRolePermissions(userObj.role);

    // Update cache
    this.permissionCache.set(userObj.id, {
      permissions,
      timestamp: Date.now()
    });

    return permissions;
  }

  /**
   * Clear permission cache for a user
   */
  clearUserCache(userId: string): void {
    this.permissionCache.delete(userId);
  }

  /**
   * Clear all permission caches
   */
  clearAllCaches(): void {
    this.permissionCache.clear();
  }

  /**
   * Get user by ID (placeholder - in production this would query a database)
   */
  private async getUser(_userId: string): Promise<User | null> {
    // This is a placeholder. In production, this would query your user database
    return null;
  }

  /**
   * Check if user can view data based on scope
   */
  canViewData(user: User, dataOwnerId: string, teamId?: string): boolean {
    const role = user.role;

    // Admin can see everything
    if (role === Role.ADMIN) {
      return true;
    }

    // Manager can see all data
    if (role === Role.MANAGER && roleHasPermission(role, Permission.TIME_VIEW_ALL)) {
      return true;
    }

    // Supervisor can see team data
    if (role === Role.SUPERVISOR && teamId && user.teamId === teamId) {
      return true;
    }

    // User can see their own data
    if (user.id === dataOwnerId) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can edit data based on scope
   */
  canEditData(user: User, dataOwnerId: string): boolean {
    const role = user.role;

    // Admin and Manager can edit all
    if (role === Role.ADMIN || (role === Role.MANAGER && roleHasPermission(role, Permission.TIME_EDIT_ALL))) {
      return true;
    }

    // User can edit their own data if they have the permission
    if (user.id === dataOwnerId && roleHasPermission(role, Permission.TIME_EDIT_OWN)) {
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const permissionsService = new PermissionsService();
