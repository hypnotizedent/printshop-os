/**
 * RBAC Permissions Tests
 * Comprehensive test coverage for role-based access control
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
  Role, 
  Permission, 
  getRolePermissions, 
  roleHasPermission,
  roleHasAnyPermission,
  roleHasAllPermissions 
} from '../auth/roles';
import { permissionsService, User } from '../auth/permissions.service';
import { auditService, AuditLogEntry } from '../auth/audit.service';
import { requirePermission, requireAnyPermission, requireAllPermissions } from '../auth/rbac.middleware';
import { Request, Response } from 'express';

// Mock users for testing
const adminUser: User = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@printshop.com',
  role: Role.ADMIN
};

const managerUser: User = {
  id: 'manager-1',
  name: 'Manager User',
  email: 'manager@printshop.com',
  role: Role.MANAGER,
  teamId: 'team-1'
};

const supervisorUser: User = {
  id: 'supervisor-1',
  name: 'Supervisor User',
  email: 'supervisor@printshop.com',
  role: Role.SUPERVISOR,
  teamId: 'team-1'
};

const operatorUser: User = {
  id: 'operator-1',
  name: 'Operator User',
  email: 'operator@printshop.com',
  role: Role.OPERATOR,
  teamId: 'team-1'
};

// Helper functions for creating mock Express objects
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    user: undefined,
    params: {},
    query: {},
    body: {},
    headers: {},
    ip: '127.0.0.1',
    ...overrides
  } as Request;
}

function createMockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res) as any;
  res.json = jest.fn().mockReturnValue(res) as any;
  return res;
}

describe('Role Permissions Matrix', () => {
  it('Admin should have all permissions', () => {
    const permissions = getRolePermissions(Role.ADMIN);
    
    // Admin should have all permissions
    expect(permissions).toContain(Permission.TIME_EDIT_ALL);
    expect(permissions).toContain(Permission.METRICS_VIEW_COSTS);
    expect(permissions).toContain(Permission.SYSTEM_MANAGE_USERS);
    expect(permissions.length).toBeGreaterThan(20);
  });

  it('Manager should have production permissions but not system admin', () => {
    const permissions = getRolePermissions(Role.MANAGER);
    
    expect(permissions).toContain(Permission.TIME_EDIT_ALL);
    expect(permissions).toContain(Permission.METRICS_VIEW_COSTS);
    expect(permissions).toContain(Permission.JOB_ASSIGN);
    expect(permissions).not.toContain(Permission.SYSTEM_MANAGE_USERS);
  });

  it('Supervisor should have team oversight permissions', () => {
    const permissions = getRolePermissions(Role.SUPERVISOR);
    
    expect(permissions).toContain(Permission.TIME_APPROVE);
    expect(permissions).toContain(Permission.TIME_VIEW_TEAM);
    expect(permissions).toContain(Permission.CHECKLIST_APPROVE);
    expect(permissions).not.toContain(Permission.TIME_EDIT_ALL);
    expect(permissions).not.toContain(Permission.METRICS_VIEW_COSTS);
  });

  it('Operator should have basic production permissions', () => {
    const permissions = getRolePermissions(Role.OPERATOR);
    
    expect(permissions).toContain(Permission.TIME_CLOCK_IN);
    expect(permissions).toContain(Permission.TIME_CLOCK_OUT);
    expect(permissions).toContain(Permission.TIME_VIEW_OWN);
    expect(permissions).toContain(Permission.CHECKLIST_COMPLETE);
    expect(permissions).not.toContain(Permission.TIME_EDIT_ALL);
    expect(permissions).not.toContain(Permission.TIME_APPROVE);
  });

  it('ReadOnly should have minimal view permissions', () => {
    const permissions = getRolePermissions(Role.READ_ONLY);
    
    expect(permissions).toContain(Permission.SOP_VIEW);
    expect(permissions).toContain(Permission.JOB_VIEW);
    expect(permissions).not.toContain(Permission.TIME_CLOCK_IN);
    expect(permissions.length).toBe(2);
  });
});

describe('Role Permission Checks', () => {
  it('should correctly check if role has specific permission', () => {
    expect(roleHasPermission(Role.ADMIN, Permission.SYSTEM_MANAGE_USERS)).toBe(true);
    expect(roleHasPermission(Role.MANAGER, Permission.TIME_EDIT_ALL)).toBe(true);
    expect(roleHasPermission(Role.OPERATOR, Permission.TIME_EDIT_ALL)).toBe(false);
    expect(roleHasPermission(Role.READ_ONLY, Permission.TIME_CLOCK_IN)).toBe(false);
  });

  it('should correctly check if role has any permissions', () => {
    expect(roleHasAnyPermission(Role.SUPERVISOR, [
      Permission.TIME_EDIT_ALL,
      Permission.TIME_APPROVE
    ])).toBe(true);

    expect(roleHasAnyPermission(Role.OPERATOR, [
      Permission.TIME_EDIT_ALL,
      Permission.TIME_APPROVE
    ])).toBe(false);
  });

  it('should correctly check if role has all permissions', () => {
    expect(roleHasAllPermissions(Role.MANAGER, [
      Permission.TIME_EDIT_ALL,
      Permission.METRICS_VIEW_COSTS
    ])).toBe(true);

    expect(roleHasAllPermissions(Role.SUPERVISOR, [
      Permission.TIME_EDIT_ALL,
      Permission.METRICS_VIEW_COSTS
    ])).toBe(false);
  });
});

describe('Permissions Service', () => {
  beforeEach(() => {
    permissionsService.clearAllCaches();
  });

  it('should check user permissions correctly', async () => {
    expect(await permissionsService.userHasPermission(managerUser, Permission.METRICS_VIEW_ALL)).toBe(true);
    expect(await permissionsService.userHasPermission(operatorUser, Permission.METRICS_VIEW_ALL)).toBe(false);
  });

  it('should get all user permissions', async () => {
    const permissions = await permissionsService.getUserPermissions(operatorUser);
    
    expect(permissions).toContain(Permission.TIME_CLOCK_IN);
    expect(permissions).not.toContain(Permission.TIME_EDIT_ALL);
  });

  it('should cache user permissions', async () => {
    // First call
    const permissions1 = await permissionsService.getUserPermissions(managerUser);
    
    // Second call (should be cached)
    const permissions2 = await permissionsService.getUserPermissions(managerUser);
    
    expect(permissions1).toEqual(permissions2);
  });

  it('should check data viewing permissions correctly', () => {
    // Manager can view all data
    expect(permissionsService.canViewData(managerUser, 'any-user-id')).toBe(true);
    
    // Supervisor can view team data
    expect(permissionsService.canViewData(supervisorUser, 'team-member-id', 'team-1')).toBe(true);
    expect(permissionsService.canViewData(supervisorUser, 'other-member-id', 'team-2')).toBe(false);
    
    // Operator can view own data
    expect(permissionsService.canViewData(operatorUser, 'operator-1')).toBe(true);
    expect(permissionsService.canViewData(operatorUser, 'other-user-id')).toBe(false);
  });

  it('should check data editing permissions correctly', () => {
    // Manager can edit all data
    expect(permissionsService.canEditData(managerUser, 'any-user-id')).toBe(true);
    
    // Operator can edit own data
    expect(permissionsService.canEditData(operatorUser, 'operator-1')).toBe(true);
    expect(permissionsService.canEditData(operatorUser, 'other-user-id')).toBe(false);
  });
});

describe('RBAC Middleware', () => {
  beforeEach(async () => {
    await auditService.clear();
  });

  it('should allow user with correct permission', async () => {
    const req = createMockRequest({ user: managerUser });
    const res = createMockResponse();
    const next = jest.fn();
    
    await requirePermission(Permission.METRICS_VIEW_ALL)(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should deny user without permission', async () => {
    const req = createMockRequest({ user: operatorUser });
    const res = createMockResponse();
    const next = jest.fn();
    
    await requirePermission(Permission.METRICS_VIEW_ALL)(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Forbidden')
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should deny request without user', async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = jest.fn();
    
    await requirePermission(Permission.TIME_CLOCK_IN)(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should log unauthorized access attempt', async () => {
    const req = createMockRequest({ user: operatorUser });
    const res = createMockResponse();
    const next = jest.fn();
    
    await requirePermission(Permission.TIME_EDIT_ALL)(req, res, next);
    
    const logs = await auditService.getRecentLogs(1);
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('access_denied');
    expect(logs[0].resource).toBe(Permission.TIME_EDIT_ALL);
    expect(logs[0].userId).toBe(operatorUser.id);
  });

  it('should allow user with any of specified permissions', async () => {
    const req = createMockRequest({ user: supervisorUser });
    const res = createMockResponse();
    const next = jest.fn();
    
    await requireAnyPermission([
      Permission.TIME_EDIT_ALL,
      Permission.TIME_APPROVE
    ])(req, res, next);
    
    expect(next).toHaveBeenCalled();
  });

  it('should deny user without any of specified permissions', async () => {
    const req = createMockRequest({ user: operatorUser });
    const res = createMockResponse();
    const next = jest.fn();
    
    await requireAnyPermission([
      Permission.TIME_EDIT_ALL,
      Permission.TIME_APPROVE
    ])(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow user with all specified permissions', async () => {
    const req = createMockRequest({ user: managerUser });
    const res = createMockResponse();
    const next = jest.fn();
    
    await requireAllPermissions([
      Permission.TIME_EDIT_ALL,
      Permission.METRICS_VIEW_COSTS
    ])(req, res, next);
    
    expect(next).toHaveBeenCalled();
  });

  it('should deny user without all specified permissions', async () => {
    const req = createMockRequest({ user: supervisorUser });
    const res = createMockResponse();
    const next = jest.fn();
    
    await requireAllPermissions([
      Permission.TIME_EDIT_ALL,
      Permission.METRICS_VIEW_COSTS
    ])(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Audit Service', () => {
  beforeEach(async () => {
    await auditService.clear();
  });

  it('should log audit entries', async () => {
    const entry: AuditLogEntry = {
      userId: 'user-1',
      userName: 'Test User',
      action: 'time_entry_edited',
      resource: 'time_entry',
      resourceId: '123',
      timestamp: new Date()
    };

    await auditService.log(entry);

    expect(auditService.getLogCount()).toBe(1);
  });

  it('should query logs by user', async () => {
    await auditService.log({
      userId: 'user-1',
      action: 'action-1',
      resource: 'resource-1',
      timestamp: new Date()
    });

    await auditService.log({
      userId: 'user-2',
      action: 'action-2',
      resource: 'resource-2',
      timestamp: new Date()
    });

    const logs = await auditService.getUserLogs('user-1');
    
    expect(logs.length).toBe(1);
    expect(logs[0].userId).toBe('user-1');
  });

  it('should query logs by action', async () => {
    await auditService.log({
      userId: 'user-1',
      action: 'time_entry_edited',
      resource: 'time_entry',
      timestamp: new Date()
    });

    await auditService.log({
      userId: 'user-1',
      action: 'sop_viewed',
      resource: 'sop',
      timestamp: new Date()
    });

    const logs = await auditService.query({ action: 'time_entry_edited' });
    
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('time_entry_edited');
  });

  it('should limit query results', async () => {
    for (let i = 0; i < 10; i++) {
      await auditService.log({
        userId: 'user-1',
        action: `action-${i}`,
        resource: 'resource',
        timestamp: new Date()
      });
    }

    const logs = await auditService.query({ limit: 5 });
    
    expect(logs.length).toBe(5);
  });

  it('should sort logs by timestamp descending', async () => {
    const now = new Date();
    
    await auditService.log({
      userId: 'user-1',
      action: 'action-1',
      resource: 'resource',
      timestamp: new Date(now.getTime() - 1000)
    });

    await auditService.log({
      userId: 'user-1',
      action: 'action-2',
      resource: 'resource',
      timestamp: now
    });

    const logs = await auditService.getRecentLogs(2);
    
    expect(logs[0].action).toBe('action-2');
    expect(logs[1].action).toBe('action-1');
  });
});

describe('Data-Level Restrictions', () => {
  it('should restrict time entries by role', () => {
    // Operator can only view own data
    expect(permissionsService.canViewData(operatorUser, operatorUser.id)).toBe(true);
    expect(permissionsService.canViewData(operatorUser, managerUser.id)).toBe(false);

    // Supervisor can view team data
    expect(permissionsService.canViewData(supervisorUser, supervisorUser.id)).toBe(true);
    expect(permissionsService.canViewData(supervisorUser, 'team-member-id', 'team-1')).toBe(true);
    expect(permissionsService.canViewData(supervisorUser, 'other-member-id', 'team-2')).toBe(false);

    // Manager can view all data
    expect(permissionsService.canViewData(managerUser, 'any-user-id')).toBe(true);

    // Admin can view all data
    expect(permissionsService.canViewData(adminUser, 'any-user-id')).toBe(true);
  });

  it('should restrict editing by role', () => {
    // Operator can edit own data
    expect(permissionsService.canEditData(operatorUser, operatorUser.id)).toBe(true);
    expect(permissionsService.canEditData(operatorUser, managerUser.id)).toBe(false);

    // Manager can edit all data
    expect(permissionsService.canEditData(managerUser, 'any-user-id')).toBe(true);

    // Admin can edit all data
    expect(permissionsService.canEditData(adminUser, 'any-user-id')).toBe(true);
  });
});
