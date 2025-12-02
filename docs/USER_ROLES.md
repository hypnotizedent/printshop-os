# PrintShop OS - User Roles and Permissions

**Last Updated:** December 2025

This document describes the three user roles in PrintShop OS and their respective capabilities and permissions.

## Role Overview

| Role | Portal | Login Method | Primary Use Case |
|------|--------|--------------|------------------|
| **Owner** | `/admin/*` | Email + Password + 2FA | Full business management |
| **Employee** | `/production/*` | PIN (4-6 digits) | Production floor operations |
| **Customer** | `/portal/*` | Email + Password | Order tracking and quotes |

## Owner (Admin) Role

### Capabilities
- **Full Access** - Complete access to all system features
- **Financial Data** - View revenue, costs, invoices, and reports
- **All Jobs** - View and manage all jobs across all employees
- **Customer Data** - Full customer information including contact details
- **Settings** - System configuration, pricing rules, integrations
- **User Management** - Manage employees and customer accounts
- **Reports** - Access to all business analytics and reports

### Portal Access
- Access to `/admin/*` routes
- Can also access `/production/*` routes (for troubleshooting)
- Can view customer portal content

### Authentication
- Email + Password login
- Two-factor authentication (2FA) supported
- Session timeout: 30 minutes of inactivity
- All login attempts are logged

### Available Features
| Feature | Access |
|---------|--------|
| Dashboard | Full stats including revenue |
| Jobs | All jobs, can assign to employees |
| Customers | Full list with contact info |
| Reports | Full financial reports |
| Settings | System-wide configuration |
| Invoices | Create and manage invoices |
| Quotes | Create and approve quotes |
| AI Assistant | Full access |
| Products | Manage product catalog |
| Shipping | Shipping labels and tracking |

## Employee Role

### Capabilities
- **Assigned Jobs Only** - View only jobs assigned to them
- **No Financial Data** - Cannot see pricing, costs, or revenue
- **Limited Customer Info** - First name only, no contact details
- **Production Operations** - Update job status, report issues
- **Time Tracking** - Clock in/out functionality

### Portal Access
- Access to `/production/*` routes only
- Cannot access `/admin/*` routes (redirected to production)
- Cannot access customer portal

### Authentication
- PIN-based login (4-6 digits)
- Touch-friendly interface for tablets
- Clock in toggle on login
- Fast re-authentication for shift changes

### Available Features
| Feature | Access |
|---------|--------|
| Dashboard | Assigned jobs only |
| My Jobs | List of assigned jobs |
| Schedule | Production schedule view |
| Help | Help resources |
| Clock In/Out | Time tracking |
| QR Scanner | Scan job QR codes |

### Restricted Features
- ❌ Financial reports
- ❌ Customer contact details
- ❌ Settings
- ❌ Invoice management
- ❌ Quote creation
- ❌ AI Assistant
- ❌ Product management

### Job Card Information
When viewing jobs, employees see:
- ✅ Job number
- ✅ Customer first name only
- ✅ Item description
- ✅ Quantity
- ✅ Due date/time
- ✅ Status
- ✅ Assigned machine
- ❌ Pricing/cost information
- ❌ Customer email/phone
- ❌ Full customer name

## Customer Role

### Capabilities
- **Own Orders** - View and track their orders
- **Quote Requests** - Submit and review quotes
- **Account Management** - Update profile and preferences
- **Support** - Create and track support tickets

### Portal Access
- Access to `/portal/*` routes only
- Cannot access admin or production routes
- Access to public pages (landing, designer, order tracking)

### Authentication
- Email + Password login
- Password reset via email
- Social login (future: Google, Apple)

### Available Features
| Feature | Access |
|---------|--------|
| Dashboard | Order summary and stats |
| Order History | Past orders with details |
| Track Orders | Real-time order tracking |
| Quotes | View and approve quotes |
| Profile | Account settings |
| Addresses | Shipping/billing addresses |
| Payment Methods | Saved payment methods |
| Support Tickets | Create and view tickets |

## Permission Matrix

| Permission | Owner | Employee | Customer |
|------------|-------|----------|----------|
| View All Jobs | ✅ | ❌ | ❌ |
| View Assigned Jobs | ✅ | ✅ | ❌ |
| View Own Orders | ✅ | ❌ | ✅ |
| View Financials | ✅ | ❌ | ❌ |
| View Reports | ✅ | ❌ | ❌ |
| Edit Settings | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| Update Job Status | ✅ | ✅ | ❌ |
| Create Quotes | ✅ | ❌ | ❌ |
| Approve Quotes | ✅ | ❌ | ✅ |
| Time Clock | ✅ | ✅ | ❌ |
| Contact Support | ✅ | ❌ | ✅ |

## API Permissions

### Owner Endpoints (require owner token)
```
POST /api/auth/owner/login
GET  /api/admin/*
POST /api/orders/* (create/update any)
GET  /api/reports/*
PUT  /api/settings/*
```

### Employee Endpoints (require employee token)
```
POST /api/auth/employee/validate-pin
GET  /api/employees/:id/jobs
GET  /api/employees/:id/stats
POST /api/employees/:id/clock-in
PUT  /api/jobs/:id/status (assigned only)
```

### Customer Endpoints (require customer token)
```
POST /api/auth/customer/login
POST /api/auth/customer/signup
GET  /api/customers/:id/orders
GET  /api/customers/:id/designs
POST /api/support/tickets
```

## Security Considerations

### Token-Based Authentication
All roles use JWT tokens with role embedded:
```json
{
  "userId": "123",
  "role": "owner|employee|customer",
  "exp": 1234567890
}
```

### Role Verification
- Backend validates role on every protected request
- Frontend enforces role-based routing
- Invalid role attempts logged and blocked

### PIN Security (Employees)
- PINs are hashed with bcrypt
- Minimum 4 digits, maximum 6 digits
- Failed attempts are logged
- Lockout after 5 failed attempts (planned)

### 2FA Security (Owners)
- TOTP-based authentication
- Backup codes available
- Required for sensitive operations (planned)

## Route Protection

### Frontend Protection
```tsx
// Example: Protected admin route
<ProtectedRoute allowedUserTypes={['owner']}>
  <AdminSettings />
</ProtectedRoute>

// Example: Employee or owner can access
<ProtectedRoute allowedUserTypes={['employee', 'owner']}>
  <ProductionSchedule />
</ProtectedRoute>
```

### Redirect Behavior
| Current Role | Attempting | Redirect To |
|--------------|------------|-------------|
| None | `/admin/*` | `/login/admin` |
| None | `/production/*` | `/login/employee` |
| None | `/portal/*` | `/login/customer` |
| Customer | `/admin/*` | `/portal` |
| Customer | `/production/*` | `/portal` |
| Employee | `/admin/*` | `/production` |
| Employee | `/portal/*` | `/production` |
| Owner | Any | Access granted |

## Session Management

### Session Timeouts
| Role | Timeout | Reason |
|------|---------|--------|
| Owner | 30 min | Security for admin access |
| Employee | 8 hours | Full shift duration |
| Customer | 24 hours | Convenience for ordering |

### Logout Behavior
- Clears token from localStorage
- Invalidates server session
- Redirects to appropriate login page

## Future Enhancements

### Planned Features
- [ ] Face ID for employee login
- [ ] Multi-factor authentication for all roles
- [ ] Custom permission sets
- [ ] Employee team leads (limited admin)
- [ ] Customer account types (wholesale/retail)
- [ ] Session activity logging
- [ ] Device management
