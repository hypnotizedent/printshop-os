# RBAC Authentication System

Role-Based Access Control (RBAC) system for the PrintShop OS Production Dashboard.

## Quick Start

### Backend Setup

```typescript
import { requirePermission, Permission, Role } from './auth';
import express from 'express';

const app = express();

// Protect a route
app.get(
  '/api/metrics/all',
  requirePermission(Permission.METRICS_VIEW_ALL),
  (req, res) => {
    res.json({ metrics: [] });
  }
);
```

### Frontend Setup

```tsx
import { PermissionsProvider } from './contexts/PermissionsContext';
import { usePermissions } from './hooks/usePermissions';
import { Protected } from './components/ProtectedRoute';
import { Permission } from './types/permissions';

// 1. Wrap app with provider
function App() {
  const user = useAuth(); // Get user from your auth system
  
  return (
    <PermissionsProvider user={user}>
      <Dashboard />
    </PermissionsProvider>
  );
}

// 2. Use hook for conditional logic
function MyComponent() {
  const { hasPermission } = usePermissions();
  
  const handleEdit = () => {
    if (hasPermission(Permission.TIME_EDIT_ALL)) {
      // Perform edit
    }
  };
  
  return <button onClick={handleEdit}>Edit</button>;
}

// 3. Use Protected component for UI
function Dashboard() {
  return (
    <div>
      <Protected permission={Permission.METRICS_VIEW_COSTS}>
        <LaborCostCard />
      </Protected>
    </div>
  );
}
```

## Files

- `roles.ts` - Role and permission definitions
- `permissions.service.ts` - Permission checking service
- `rbac.middleware.ts` - Express middleware for route protection
- `audit.service.ts` - Audit logging for sensitive actions
- `PERMISSION_MATRIX.md` - Complete permission documentation

## Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | Full system access | All (30+) |
| **Manager** | Production management + reports | 20 |
| **Supervisor** | Team oversight | 14 |
| **Operator** | Basic production tasks | 8 |
| **Read-Only** | View-only access | 2 |

## Key Permissions

```typescript
// Time tracking
Permission.TIME_CLOCK_IN
Permission.TIME_EDIT_ALL
Permission.TIME_APPROVE

// Checklists
Permission.CHECKLIST_COMPLETE
Permission.CHECKLIST_APPROVE

// SOPs
Permission.SOP_VIEW
Permission.SOP_EDIT
Permission.SOP_PUBLISH

// Metrics
Permission.METRICS_VIEW_COSTS
Permission.METRICS_VIEW_TEAM
Permission.METRICS_EXPORT

// System
Permission.SYSTEM_MANAGE_USERS
Permission.SYSTEM_VIEW_AUDIT
```

## Backend Examples

### Protecting Routes

```typescript
// Single permission
router.post(
  '/api/sops',
  requirePermission(Permission.SOP_CREATE),
  sopController.create
);

// Any of multiple permissions
router.patch(
  '/api/time-entries/:id',
  requireAnyPermission([
    Permission.TIME_EDIT_ALL,
    Permission.TIME_EDIT_OWN
  ]),
  timeController.update
);

// All permissions required
router.post(
  '/api/sops/:id/publish',
  requireAllPermissions([
    Permission.SOP_EDIT,
    Permission.SOP_PUBLISH
  ]),
  sopController.publish
);
```

### Data-Level Filtering

```typescript
import { permissionsService, Permission } from './auth';

async function getMetrics(req, res) {
  const user = req.user;
  let query = db.select().from(metrics);
  
  // Filter based on permissions
  if (await permissionsService.userHasPermission(user, Permission.METRICS_VIEW_OWN)) {
    // Only own metrics
    query = query.where(eq(metrics.userId, user.id));
  } else if (await permissionsService.userHasPermission(user, Permission.METRICS_VIEW_TEAM)) {
    // Team metrics
    const teamMembers = await getTeamMembers(user.teamId);
    query = query.where(inArray(metrics.userId, teamMembers));
  }
  // else METRICS_VIEW_ALL - no filter
  
  const results = await query;
  res.json(results);
}
```

### Audit Logging

```typescript
import { auditService } from './auth';

async function updateTimeEntry(req, res) {
  const { id } = req.params;
  const user = req.user;
  
  const before = await getTimeEntry(id);
  await updateEntry(id, req.body);
  const after = await getTimeEntry(id);
  
  // Log the change
  await auditService.log({
    userId: user.id,
    userName: user.name,
    action: 'time_entry_edited',
    resource: 'time_entry',
    resourceId: id,
    changes: { before, after },
    ip: req.ip,
    timestamp: new Date()
  });
  
  res.json(after);
}
```

## Frontend Examples

### Conditional Rendering

```tsx
import { usePermissions } from './hooks/usePermissions';
import { Permission } from './types/permissions';

function MetricsDashboard() {
  const { hasPermission } = usePermissions();
  
  return (
    <div className="metrics">
      <h1>Metrics Dashboard</h1>
      
      {/* Always visible */}
      {hasPermission(Permission.METRICS_VIEW_OWN) && (
        <PersonalMetrics />
      )}
      
      {/* Supervisors and above */}
      {hasPermission(Permission.METRICS_VIEW_TEAM) && (
        <TeamMetrics />
      )}
      
      {/* Managers only */}
      {hasPermission(Permission.METRICS_VIEW_COSTS) && (
        <LaborCostAnalysis />
      )}
      
      {/* Managers only */}
      {hasPermission(Permission.METRICS_EXPORT) && (
        <button onClick={exportMetrics}>Export</button>
      )}
    </div>
  );
}
```

### Protected Component

```tsx
import { Protected } from './components/ProtectedRoute';
import { Permission } from './types/permissions';

function TimeEntryCard({ entry }) {
  return (
    <div className="time-entry">
      <h3>Time Entry #{entry.id}</h3>
      <div>{entry.hours} hours</div>
      
      {/* Show edit button only to authorized users */}
      <Protected permission={Permission.TIME_EDIT_ALL}>
        <button onClick={() => editEntry(entry.id)}>
          Edit
        </button>
      </Protected>
      
      {/* Show approve button with fallback */}
      <Protected 
        permission={Permission.TIME_APPROVE}
        fallback={<p className="text-muted">Pending approval</p>}
      >
        <button onClick={() => approveEntry(entry.id)}>
          Approve
        </button>
      </Protected>
      
      {/* Multiple permission options */}
      <Protected 
        anyPermissions={[
          Permission.TIME_EDIT_ALL,
          Permission.TIME_APPROVE
        ]}
      >
        <button onClick={() => deleteEntry(entry.id)}>
          Delete
        </button>
      </Protected>
    </div>
  );
}
```

### Complex Permission Logic

```tsx
import { usePermissions } from './hooks/usePermissions';
import { Permission } from './types/permissions';

function JobCard({ job }) {
  const { hasPermission, hasAllPermissions } = usePermissions();
  
  const canEdit = hasPermission(Permission.JOB_UPDATE_STATUS);
  const canAssign = hasPermission(Permission.JOB_ASSIGN);
  const canPublish = hasAllPermissions([
    Permission.JOB_UPDATE_STATUS,
    Permission.JOB_ASSIGN
  ]);
  
  return (
    <div>
      <h2>{job.title}</h2>
      
      {canEdit && (
        <button onClick={() => editJob(job)}>Edit</button>
      )}
      
      {canAssign && (
        <AssignButton job={job} />
      )}
      
      {canPublish && job.status === 'draft' && (
        <button onClick={() => publishJob(job)}>Publish</button>
      )}
    </div>
  );
}
```

## Testing

```typescript
import { 
  Role, 
  Permission, 
  roleHasPermission,
  permissionsService 
} from './auth';

describe('Permissions', () => {
  it('should check role permissions', () => {
    expect(roleHasPermission(Role.MANAGER, Permission.TIME_EDIT_ALL)).toBe(true);
    expect(roleHasPermission(Role.OPERATOR, Permission.TIME_EDIT_ALL)).toBe(false);
  });
  
  it('should check user permissions', async () => {
    const user = { id: '1', role: Role.MANAGER, ... };
    expect(
      await permissionsService.userHasPermission(user, Permission.METRICS_VIEW_COSTS)
    ).toBe(true);
  });
});
```

Run all tests:
```bash
npm test src/production-dashboard/__tests__/permissions.test.ts
```

## Security Notes

⚠️ **Important**: 
- Frontend permission checks are for UX only
- Backend ALWAYS validates permissions
- Never trust client-side permission checks for security
- Audit logs are required for sensitive operations

## Documentation

See [PERMISSION_MATRIX.md](./PERMISSION_MATRIX.md) for complete permission documentation.

## Architecture

```
┌─────────────────────────────────────────┐
│          Frontend (React)               │
│  ┌─────────────────────────────────┐   │
│  │  PermissionsContext             │   │
│  │  - Provides permission checks   │   │
│  └─────────────────────────────────┘   │
│              ↓                          │
│  ┌─────────────────────────────────┐   │
│  │  usePermissions Hook            │   │
│  │  - hasPermission()              │   │
│  │  - hasAnyPermission()           │   │
│  └─────────────────────────────────┘   │
│              ↓                          │
│  ┌─────────────────────────────────┐   │
│  │  Protected Component            │   │
│  │  - Conditional rendering        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                   ↓
          API Requests (JWT + Role)
                   ↓
┌─────────────────────────────────────────┐
│          Backend (Express)              │
│  ┌─────────────────────────────────┐   │
│  │  RBAC Middleware                │   │
│  │  - requirePermission()          │   │
│  │  - requireAnyPermission()       │   │
│  └─────────────────────────────────┘   │
│              ↓                          │
│  ┌─────────────────────────────────┐   │
│  │  PermissionsService             │   │
│  │  - userHasPermission()          │   │
│  │  - Permission caching           │   │
│  └─────────────────────────────────┘   │
│              ↓                          │
│  ┌─────────────────────────────────┐   │
│  │  AuditService                   │   │
│  │  - Log access attempts          │   │
│  │  - Track sensitive actions      │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Support

For issues or questions:
1. Check [PERMISSION_MATRIX.md](./PERMISSION_MATRIX.md)
2. Review test files for examples
3. Open an issue in the repository
