# Permission Matrix Documentation

## Overview

This document describes the role-based access control (RBAC) system for the PrintShop OS Production Dashboard. The system uses a permission-based approach where roles are assigned specific permissions that control access to features and data.

## Roles

### Admin
**Full system access** - Can perform any action in the system
- All permissions granted
- Intended for: System administrators, IT staff
- User count: 1-2 typically

### Manager
**All production features + reports** - Can manage production and view sensitive data
- Access to all production features
- Can view labor costs and financial metrics
- Can edit any time entries
- Can approve checklists and time entries
- Can create and publish SOPs
- Cannot manage system users/roles
- Intended for: Production managers, operations managers
- User count: 2-5 typically

### Supervisor
**Team oversight** - Can oversee their team and approve actions
- Can approve time entries and checklists
- Can view team metrics and time entries
- Can edit their own time entries
- Can create and edit SOPs (but not publish)
- Cannot view labor costs
- Intended for: Team leads, shift supervisors
- User count: 5-10 typically

### Operator
**Basic production features** - Can perform daily production tasks
- Can clock in/out
- Can complete checklists
- Can view SOPs and jobs
- Can view only their own metrics and time entries
- Can edit their own time entries
- Cannot approve anything
- Intended for: Production operators, floor workers
- User count: 15-50 typically

### Read-Only
**View-only access** - Can view limited information
- Can view SOPs
- Can view jobs
- Cannot clock in/out
- Cannot edit anything
- Intended for: Trainees, observers, external auditors
- User count: 0-5 typically

## Permission Categories

### Time Clock Permissions
| Permission | Admin | Manager | Supervisor | Operator | Read-Only |
|-----------|-------|---------|------------|----------|-----------|
| `time:clock-in` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `time:clock-out` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `time:edit-own` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `time:edit-all` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `time:approve` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `time:view-own` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `time:view-team` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `time:view-all` | ✅ | ✅ | ❌ | ❌ | ❌ |

### Checklist Permissions
| Permission | Admin | Manager | Supervisor | Operator | Read-Only |
|-----------|-------|---------|------------|----------|-----------|
| `checklist:complete` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `checklist:approve` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `checklist:create-template` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `checklist:edit-template` | ✅ | ✅ | ❌ | ❌ | ❌ |

### SOP Permissions
| Permission | Admin | Manager | Supervisor | Operator | Read-Only |
|-----------|-------|---------|------------|----------|-----------|
| `sop:view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sop:create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `sop:edit` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `sop:delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `sop:publish` | ✅ | ✅ | ❌ | ❌ | ❌ |

### Metrics Permissions
| Permission | Admin | Manager | Supervisor | Operator | Read-Only |
|-----------|-------|---------|------------|----------|-----------|
| `metrics:view-own` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `metrics:view-team` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `metrics:view-all` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `metrics:view-costs` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `metrics:export` | ✅ | ✅ | ❌ | ❌ | ❌ |

### Job Permissions
| Permission | Admin | Manager | Supervisor | Operator | Read-Only |
|-----------|-------|---------|------------|----------|-----------|
| `job:view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `job:update-status` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `job:assign` | ✅ | ✅ | ❌ | ❌ | ❌ |

### System Permissions
| Permission | Admin | Manager | Supervisor | Operator | Read-Only |
|-----------|-------|---------|------------|----------|-----------|
| `system:manage-users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `system:manage-roles` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `system:view-audit` | ✅ | ❌ | ❌ | ❌ | ❌ |

## Data-Level Restrictions

Permissions also control what data users can see:

### Time Entries
- **Operator**: Can only view/edit their own time entries
- **Supervisor**: Can view/approve time entries for their team
- **Manager**: Can view/edit all time entries
- **Admin**: Can view/edit all time entries

### Metrics
- **Operator**: Can only view their own metrics (productivity, quality)
- **Supervisor**: Can view metrics for their team
- **Manager**: Can view all metrics including labor costs
- **Admin**: Can view all metrics including labor costs

### Team Scope
Users with team-scoped permissions (Supervisor) can only access data for users in their assigned team. This is enforced at the API level using the `teamId` field.

## Backend Implementation

### Middleware Usage

```typescript
import { requirePermission, Permission } from './auth';

// Protect a route with single permission
router.get(
  '/api/production/metrics/all',
  requirePermission(Permission.METRICS_VIEW_ALL),
  metricsController.getAllMetrics
);

// Protect with multiple permissions (any)
router.patch(
  '/api/production/time-entries/:id',
  requireAnyPermission([
    Permission.TIME_EDIT_ALL,
    Permission.TIME_EDIT_OWN
  ]),
  timeController.updateTimeEntry
);
```

### Data-Level Filtering

```typescript
const getTimeEntries = async (req: Request, res: Response) => {
  const user = req.user;
  
  let query = db.select().from(timeEntries);
  
  // Apply data-level restrictions
  if (await permissionsService.userHasPermission(user, Permission.TIME_VIEW_OWN)) {
    query = query.where(eq(timeEntries.employeeId, user.id));
  } else if (await permissionsService.userHasPermission(user, Permission.TIME_VIEW_TEAM)) {
    const teamIds = await getTeamMembers(user.id);
    query = query.where(inArray(timeEntries.employeeId, teamIds));
  }
  // else TIME_VIEW_ALL - no filter
  
  const entries = await query;
  res.json(entries);
};
```

## Frontend Implementation

### Using Permissions Context

```tsx
import { PermissionsProvider } from './contexts/PermissionsContext';

function App() {
  const user = useAuth(); // Get user from auth context
  
  return (
    <PermissionsProvider user={user}>
      <Dashboard />
    </PermissionsProvider>
  );
}
```

### Using usePermissions Hook

```tsx
import { usePermissions } from './hooks/usePermissions';
import { Permission } from './types/permissions';

function MetricsDashboard() {
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      <h1>Metrics Dashboard</h1>
      
      {hasPermission(Permission.METRICS_VIEW_OWN) && (
        <MyMetrics />
      )}
      
      {hasPermission(Permission.METRICS_VIEW_TEAM) && (
        <TeamMetrics />
      )}
      
      {hasPermission(Permission.METRICS_VIEW_COSTS) && (
        <LaborCosts />
      )}
    </div>
  );
}
```

### Using Protected Component

```tsx
import { Protected } from './components/ProtectedRoute';
import { Permission } from './types/permissions';

function TimeEntryCard() {
  return (
    <div>
      <h2>Time Entry</h2>
      <TimeDetails />
      
      <Protected permission={Permission.TIME_EDIT_ALL}>
        <EditButton />
      </Protected>
      
      <Protected 
        anyPermissions={[Permission.TIME_APPROVE, Permission.TIME_EDIT_ALL]}
        fallback={<p>You cannot approve this entry</p>}
      >
        <ApproveButton />
      </Protected>
    </div>
  );
}
```

## Audit Logging

Sensitive actions are automatically logged:

- Failed permission checks
- Time entry edits
- SOP publications
- User role changes
- Metric exports

Audit logs include:
- User ID and name
- Action performed
- Resource accessed
- Timestamp
- IP address
- User agent
- Success/failure status

Example audit log:
```json
{
  "userId": "user-123",
  "userName": "John Smith",
  "action": "time_entry_edited",
  "resource": "time_entry",
  "resourceId": "entry-456",
  "changes": {
    "before": { "clockOut": "5:00 PM" },
    "after": { "clockOut": "5:30 PM" }
  },
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-11-24T02:00:00Z",
  "success": true
}
```

## Security Best Practices

1. **Backend Enforcement**: Permissions are ALWAYS checked on the backend. Frontend checks are only for UX.

2. **Cache Invalidation**: Permission caches are cleared when user roles change.

3. **Rate Limiting**: Permission checks are rate-limited to prevent abuse.

4. **Audit Trail**: All sensitive actions are logged for compliance.

5. **Principle of Least Privilege**: Users are given minimum permissions needed for their role.

6. **Role Changes**: When a user's role changes, their session is invalidated and they must re-login.

## Testing

Comprehensive test coverage includes:

- ✅ Role permission matrix validation
- ✅ Permission checking logic
- ✅ Middleware authorization
- ✅ Data-level restrictions
- ✅ Audit logging
- ✅ Cache functionality
- ✅ Frontend permission rendering
- ✅ Edge cases and error handling

Run tests:
```bash
cd services/api
npm test src/production-dashboard/__tests__/permissions.test.ts
```

## Compliance

This RBAC system helps meet:

- **GDPR**: Data access restrictions and audit logs
- **SOC 2**: Access controls and audit trail
- **Privacy Laws**: Sensitive data (costs, employee metrics) restricted to managers
- **Internal Policies**: Role-based separation of duties

## Future Enhancements

Potential future improvements:

1. **Custom Roles**: Allow admins to create custom roles with specific permission sets
2. **Time-Based Permissions**: Permissions that expire after a certain time
3. **Resource-Level Permissions**: Fine-grained permissions per resource (e.g., specific jobs)
4. **Permission Inheritance**: Hierarchical permission structures
5. **Dynamic Permissions**: Permissions based on business rules (e.g., "can edit if created within 24 hours")
