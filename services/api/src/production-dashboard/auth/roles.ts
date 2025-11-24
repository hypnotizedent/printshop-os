/**
 * Role-Based Access Control (RBAC) - Role and Permission Definitions
 * Production Dashboard - PrintShop OS
 */

/**
 * User roles in the system
 */
export enum Role {
  ADMIN = 'admin',              // Full system access
  MANAGER = 'manager',          // All production features + reports
  SUPERVISOR = 'supervisor',    // Team oversight, approve time edits
  OPERATOR = 'operator',        // Basic production features
  READ_ONLY = 'read_only'       // View-only access
}

/**
 * Granular permissions for different features
 */
export enum Permission {
  // Time Clock
  TIME_CLOCK_IN = 'time:clock-in',
  TIME_CLOCK_OUT = 'time:clock-out',
  TIME_EDIT_OWN = 'time:edit-own',
  TIME_EDIT_ALL = 'time:edit-all',
  TIME_APPROVE = 'time:approve',
  TIME_VIEW_OWN = 'time:view-own',
  TIME_VIEW_TEAM = 'time:view-team',
  TIME_VIEW_ALL = 'time:view-all',
  
  // Checklists
  CHECKLIST_COMPLETE = 'checklist:complete',
  CHECKLIST_APPROVE = 'checklist:approve',
  CHECKLIST_CREATE = 'checklist:create-template',
  CHECKLIST_EDIT = 'checklist:edit-template',
  
  // SOPs
  SOP_VIEW = 'sop:view',
  SOP_CREATE = 'sop:create',
  SOP_EDIT = 'sop:edit',
  SOP_DELETE = 'sop:delete',
  SOP_PUBLISH = 'sop:publish',
  
  // Metrics
  METRICS_VIEW_OWN = 'metrics:view-own',
  METRICS_VIEW_TEAM = 'metrics:view-team',
  METRICS_VIEW_ALL = 'metrics:view-all',
  METRICS_VIEW_COSTS = 'metrics:view-costs',
  METRICS_EXPORT = 'metrics:export',
  
  // Jobs
  JOB_VIEW = 'job:view',
  JOB_UPDATE_STATUS = 'job:update-status',
  JOB_ASSIGN = 'job:assign',
  
  // System
  SYSTEM_MANAGE_USERS = 'system:manage-users',
  SYSTEM_MANAGE_ROLES = 'system:manage-roles',
  SYSTEM_VIEW_AUDIT = 'system:view-audit',
}

/**
 * Permission matrix mapping roles to their allowed permissions
 */
export const RolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // All permissions (superuser)
    ...Object.values(Permission)
  ],
  
  [Role.MANAGER]: [
    // Time
    Permission.TIME_CLOCK_IN,
    Permission.TIME_CLOCK_OUT,
    Permission.TIME_EDIT_OWN,
    Permission.TIME_EDIT_ALL,
    Permission.TIME_APPROVE,
    Permission.TIME_VIEW_ALL,
    
    // Checklists
    Permission.CHECKLIST_COMPLETE,
    Permission.CHECKLIST_APPROVE,
    Permission.CHECKLIST_CREATE,
    Permission.CHECKLIST_EDIT,
    
    // SOPs
    Permission.SOP_VIEW,
    Permission.SOP_CREATE,
    Permission.SOP_EDIT,
    Permission.SOP_PUBLISH,
    
    // Metrics
    Permission.METRICS_VIEW_ALL,
    Permission.METRICS_VIEW_COSTS,
    Permission.METRICS_EXPORT,
    
    // Jobs
    Permission.JOB_VIEW,
    Permission.JOB_UPDATE_STATUS,
    Permission.JOB_ASSIGN,
  ],
  
  [Role.SUPERVISOR]: [
    // Time
    Permission.TIME_CLOCK_IN,
    Permission.TIME_CLOCK_OUT,
    Permission.TIME_EDIT_OWN,
    Permission.TIME_APPROVE,
    Permission.TIME_VIEW_TEAM,
    
    // Checklists
    Permission.CHECKLIST_COMPLETE,
    Permission.CHECKLIST_APPROVE,
    
    // SOPs
    Permission.SOP_VIEW,
    Permission.SOP_CREATE,
    Permission.SOP_EDIT,
    
    // Metrics
    Permission.METRICS_VIEW_OWN,
    Permission.METRICS_VIEW_TEAM,
    
    // Jobs
    Permission.JOB_VIEW,
    Permission.JOB_UPDATE_STATUS,
  ],
  
  [Role.OPERATOR]: [
    // Time
    Permission.TIME_CLOCK_IN,
    Permission.TIME_CLOCK_OUT,
    Permission.TIME_EDIT_OWN,
    Permission.TIME_VIEW_OWN,
    
    // Checklists
    Permission.CHECKLIST_COMPLETE,
    
    // SOPs
    Permission.SOP_VIEW,
    
    // Metrics
    Permission.METRICS_VIEW_OWN,
    
    // Jobs
    Permission.JOB_VIEW,
  ],
  
  [Role.READ_ONLY]: [
    // View-only access
    Permission.SOP_VIEW,
    Permission.JOB_VIEW,
  ]
};

/**
 * Get all permissions for a given role
 */
export function getRolePermissions(role: Role): Permission[] {
  return RolePermissions[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function roleHasAnyPermission(role: Role, permissions: Permission[]): boolean {
  const rolePermissions = getRolePermissions(role);
  return permissions.some(p => rolePermissions.includes(p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function roleHasAllPermissions(role: Role, permissions: Permission[]): boolean {
  const rolePermissions = getRolePermissions(role);
  return permissions.every(p => rolePermissions.includes(p));
}
