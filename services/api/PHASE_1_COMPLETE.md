# Authentication Implementation Guide

## Phase 1: Customer & Employee Authentication - COMPLETE ✅

### What Was Implemented

1. **Customer Authentication** (`src/auth/customer-auth.ts`)
   - Customer signup with email/password
   - Customer login with credential validation
   - Password hashing with bcrypt (10 salt rounds)
   - JWT token generation with 7-day expiration
   - Email format validation
   - Duplicate email detection

2. **Employee Authentication** (`src/auth/employee-auth.ts`)
   - Employee PIN validation (4-6 digits)
   - JWT token generation for employees
   - Optional employee ID filtering

3. **TypeScript Types** (`src/auth/types/auth.types.ts`)
   - CustomerSignupData, CustomerLoginData
   - EmployeePINValidation
   - CustomerAuthResponse, EmployeeAuthResponse
   - JWTPayload with customer/employee type discrimination

4. **Test Coverage** - 18 tests passed ✅
   - Customer signup (valid, invalid email, duplicate)
   - Customer login (valid, invalid credentials, no password)
   - Employee PIN (valid, invalid format, wrong PIN, 4-6 digits)
   - JWT token verification

5. **Strapi Schema Updates**
   - Added `passwordHash` field to customer schema (private)

### Environment Configuration

Add to your `.env` file:
```
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-strapi-api-token-here
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### API Usage Examples

#### Customer Signup
```typescript
import { signupCustomer } from './auth/customer-auth';

const result = await signupCustomer({
  email: 'customer@example.com',
  password: 'SecurePass123!',
  name: 'John Doe',
  company: 'ABC Company',
  phone: '555-1234'
});

if (result.success) {
  console.log('Token:', result.token);
  console.log('Customer:', result.customer);
}
```

#### Customer Login
```typescript
import { loginCustomer } from './auth/customer-auth';

const result = await loginCustomer({
  email: 'customer@example.com',
  password: 'SecurePass123!'
});

if (result.success) {
  console.log('Token:', result.token);
}
```

#### Employee PIN Validation
```typescript
import { validateEmployeePIN } from './auth/employee-auth';

const result = await validateEmployeePIN({
  pin: '1234',
  employeeId: 'emp123' // Optional
});

if (result.success) {
  console.log('Token:', result.token);
  console.log('Employee:', result.employee);
}
```

#### Verify JWT Token
```typescript
import { verifyToken } from './auth/customer-auth'; // or employee-auth

const decoded = verifyToken(token);
if (decoded) {
  console.log('Type:', decoded.type); // 'customer' or 'employee'
  console.log('ID:', decoded.documentId);
}
```

### Strapi Configuration Required

1. **Create API Token in Strapi Admin**
   - Go to Settings → API Tokens
   - Create new token with full access
   - Copy token to `.env` as `STRAPI_API_TOKEN`

2. **Enable Public Permissions** (if needed for signup)
   - Go to Settings → Roles → Public
   - Enable `customer.create` permission

3. **Rebuild Strapi Types**
   ```bash
   cd printshop-strapi
   npm run strapi ts:generate-types
   npm run build
   ```

### Next Steps: Phase 2 - Quote Workflow

Now that authentication is complete, Phase 2 will implement:
- Quote content type in Strapi
- Quote approval workflow (approve, reject, convert-to-order)
- Order creation from approved quotes
- Customer access to their quotes

### Testing

Run tests:
```bash
cd services/api
npm test -- src/auth/__tests__/
```

All 18 tests should pass ✅

### File Structure

```
services/api/src/auth/
├── types/
│   └── auth.types.ts          # TypeScript interfaces
├── customer-auth.ts            # Customer signup/login
├── employee-auth.ts            # Employee PIN validation
└── __tests__/
    ├── customer-auth.test.ts   # 12 customer auth tests
    └── employee-auth.test.ts   # 6 employee auth tests
```

### Security Notes

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days (configurable)
- Email validation enforced
- PIN format validated (4-6 digits only)
- Password hash marked as `private` in Strapi schema
- Failed login attempts don't reveal which field is wrong

### Dependencies Installed

- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token generation/verification
- `@types/bcrypt` - TypeScript types
- `@types/jsonwebtoken` - TypeScript types
