# Security Considerations for Analytics API

## Overview

This document outlines security considerations and recommendations for the Analytics & Reporting API.

## Current Security Measures

### ✅ Implemented

1. **SQL Injection Protection**
   - All database queries use parameterized statements
   - No string concatenation in SQL queries
   - Input validation on all query parameters

2. **Error Handling**
   - Generic error messages that don't expose sensitive data
   - Stack traces only shown in development mode
   - Proper HTTP status codes

3. **Environment Variables**
   - Database credentials stored in environment variables
   - Production mode requires DATABASE_PASSWORD to be set
   - No hardcoded secrets in code

4. **Input Validation**
   - Query parameter validation (period, format, report types)
   - Numeric limits enforced (pagination, limits)
   - Date format validation

5. **CORS Configuration**
   - CORS middleware configured
   - Can be restricted to trusted origins in production

## Recommended Enhancements

### ⚠️ Rate Limiting (High Priority)

The export endpoint (`/api/analytics/export`) performs file system operations and should be rate-limited to prevent abuse.

**Recommended Implementation:**

```typescript
import rateLimit from 'express-rate-limit';

const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many export requests, please try again later',
});

// Apply to export endpoint
app.use('/api/analytics/export', exportLimiter);
```

**Risk if not implemented:** DoS via excessive file generation requests

### Authentication & Authorization

Currently, the API has no authentication. For production:

1. **Implement JWT Authentication**
   ```typescript
   import jwt from 'jsonwebtoken';
   
   const authenticateToken = (req, res, next) => {
     const token = req.headers['authorization']?.split(' ')[1];
     if (!token) return res.sendStatus(401);
     
     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
       if (err) return res.sendStatus(403);
       req.user = user;
       next();
     });
   };
   ```

2. **Role-Based Access Control**
   - Different analytics views for different roles
   - Limit sensitive data (revenue, customer details) to authorized users

### Request Validation

Consider using a validation library like `express-validator`:

```typescript
import { query, validationResult } from 'express-validator';

router.get('/revenue',
  query('period').isIn(['day', 'week', 'month', 'year']),
  query('start_date').optional().isISO8601(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... rest of handler
  }
);
```

### HTTPS Only

In production, enforce HTTPS:

```typescript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

### Security Headers

Add security headers using `helmet`:

```typescript
import helmet from 'helmet';
app.use(helmet());
```

### Audit Logging

Log access to sensitive endpoints:

```typescript
const auditLogger = (req, res, next) => {
  console.log({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    user: req.user?.id,
    ip: req.ip,
  });
  next();
};

app.use('/api/analytics', auditLogger);
```

## Configuration Hardening

### Environment Variables

Always set these in production:

```env
NODE_ENV=production
DATABASE_PASSWORD=<strong-password>
REDIS_URL=<secure-redis-url>
JWT_SECRET=<strong-secret>
```

### Database

1. Use read-only database user for analytics queries
2. Limit database connection pool size
3. Enable SSL/TLS for database connections

```typescript
const pool = new Pool({
  // ... other config
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-cert.pem').toString(),
  } : false,
});
```

### Redis

1. Enable Redis authentication
2. Use Redis ACLs to limit command access
3. Enable SSL/TLS for Redis connections

```env
REDIS_URL=rediss://:password@redis-host:6380
```

## Data Privacy

### PII Protection

Customer data includes personal information:

1. **Data Minimization**: Only return necessary fields
2. **Data Masking**: Mask email addresses for non-admin users
   ```typescript
   const maskEmail = (email: string) => {
     const [name, domain] = email.split('@');
     return `${name[0]}***@${domain}`;
   };
   ```

3. **Retention Policy**: Implement data retention limits
4. **Export Controls**: Restrict who can export customer data

### GDPR Compliance

If serving EU customers:

1. Implement data access requests (subject access)
2. Implement data deletion (right to be forgotten)
3. Log data processing activities
4. Obtain consent for analytics tracking

## Vulnerability Management

### Dependencies

Regularly update dependencies:

```bash
npm audit
npm audit fix
```

### Security Scanning

Run security scans in CI/CD:

```yaml
- name: Run security audit
  run: npm audit --audit-level=moderate
```

### Monitoring

Set up monitoring for:

1. Failed authentication attempts
2. Unusual query patterns
3. High error rates
4. Slow query performance

## Incident Response

### Preparation

1. Document incident response procedures
2. Maintain contact list for security incidents
3. Regular backup of analytics data

### Detection

Monitor for:
- Unusual API access patterns
- Database connection anomalies
- Unauthorized data access attempts

### Response

If a security incident occurs:

1. Isolate affected systems
2. Collect evidence (logs, metrics)
3. Notify stakeholders
4. Patch vulnerabilities
5. Document lessons learned

## Compliance

### SOC 2

For SOC 2 compliance:

1. Enable audit logging
2. Implement access controls
3. Document security procedures
4. Regular security reviews

### PCI DSS

If handling payment data:

1. Encrypt data at rest and in transit
2. Implement strong access controls
3. Regular security assessments
4. Maintain audit trails

## Security Checklist

- [ ] Implement rate limiting on all endpoints
- [ ] Add authentication middleware
- [ ] Enable HTTPS in production
- [ ] Add security headers (helmet)
- [ ] Implement audit logging
- [ ] Set up dependency scanning
- [ ] Configure database SSL/TLS
- [ ] Configure Redis authentication
- [ ] Implement data masking for PII
- [ ] Set up security monitoring
- [ ] Document incident response procedures
- [ ] Regular security audits

## Contact

For security concerns or vulnerability reports:
- Email: security@printshop-os.com
- Security Policy: See SECURITY.md in root

## Version History

- v1.0.0 (2025-11-24): Initial security documentation
