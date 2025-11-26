# PrintShop OS - Implementation Quick Start

**Date:** November 26, 2025  
**Goal:** Start implementing critical gaps to replace Printavo  
**Timeline:** 22 days (Dec 3 - Dec 27, 2025)

---

## 🚀 Ready to Start? Follow This

### Prerequisites ✅
- [x] Strapi running on port 1337
- [x] 336 customers imported
- [x] 831 orders imported
- [x] All 10 content types operational
- [x] Gap analysis complete

### Development Environment
```bash
# Terminal 1: Strapi CMS
cd printshop-strapi
npm run develop

# Terminal 2: API Service (where new features go)
cd services/api
npm run dev

# Terminal 3: Production Dashboard (for employee auth)
cd services/production-dashboard
npm run dev

# Terminal 4: Frontend (when testing UI)
cd frontend
npm run dev
```

---

## 📋 Phase 1: Authentication (Start Here)

### Day 1: Customer Authentication Setup

**1. Install Dependencies**
```bash
cd services/api
npm install bcrypt jsonwebtoken @types/bcrypt @types/jsonwebtoken
```

**2. Create Auth Folder Structure**
```bash
mkdir -p src/auth/__tests__
touch src/auth/customer-auth.ts
touch src/auth/auth.middleware.ts
touch src/auth/__tests__/customer-auth.test.ts
```

**3. Configure Strapi**
```bash
# In Strapi Admin: http://localhost:1337/admin
# Settings → Users & Permissions Plugin → Advanced Settings
# Enable: Allow users to sign up
# JWT expiration: 604800000 (7 days)
```

**4. Implement Customer Auth**

File: `services/api/src/auth/customer-auth.ts`
```typescript
import axios from 'axios';
import { Request, Response } from 'express';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function signup(req: Request, res: Response) {
  try {
    const { email, password, name, company } = req.body;
    
    // Create Strapi user
    const userResponse = await axios.post(`${STRAPI_URL}/api/auth/local/register`, {
      username: email,
      email,
      password
    });
    
    // Create customer profile
    const customerResponse = await axios.post(`${STRAPI_URL}/api/customers`, {
      data: {
        name,
        email,
        company,
        user: userResponse.data.user.id
      }
    }, {
      headers: { Authorization: `Bearer ${userResponse.data.jwt}` }
    });
    
    res.json({
      jwt: userResponse.data.jwt,
      user: userResponse.data.user,
      customer: customerResponse.data
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    const response = await axios.post(`${STRAPI_URL}/api/auth/local`, {
      identifier: email,
      password
    });
    
    // Get customer profile
    const customerResponse = await axios.get(`${STRAPI_URL}/api/customers?filters[email][$eq]=${email}`, {
      headers: { Authorization: `Bearer ${response.data.jwt}` }
    });
    
    res.json({
      jwt: response.data.jwt,
      user: response.data.user,
      customer: customerResponse.data.data[0]
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}
```

**5. Add Auth Routes**

File: `services/api/src/index.ts` (add these routes)
```typescript
import { signup, login } from './auth/customer-auth';

app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
```

**6. Write Tests**

File: `services/api/src/auth/__tests__/customer-auth.test.ts`
```typescript
import { signup, login } from '../customer-auth';

describe('Customer Authentication', () => {
  it('should create new customer account', async () => {
    // Test signup
  });
  
  it('should login existing customer', async () => {
    // Test login
  });
  
  it('should reject invalid credentials', async () => {
    // Test error handling
  });
});
```

**7. Test Manually**
```bash
# Signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","company":"Test Co"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

### Day 2: Employee PIN Authentication

**Location:** `services/production-dashboard/src/auth/`

**1. Create Employee Auth**
```bash
cd services/production-dashboard
mkdir -p src/auth/__tests__
touch src/auth/employee-auth.ts
touch src/auth/__tests__/employee-auth.test.ts
```

**2. Implement PIN Validation**

File: `services/production-dashboard/src/auth/employee-auth.ts`
```typescript
import bcrypt from 'bcrypt';
import axios from 'axios';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function validatePIN(employeeId: string, pin: string): Promise<boolean> {
  try {
    const response = await axios.get(`${STRAPI_URL}/api/employees/${employeeId}`);
    const employee = response.data.data;
    
    return bcrypt.compare(pin, employee.attributes.pin);
  } catch (error) {
    return false;
  }
}

export async function clockIn(req, res) {
  const { employeeId, pin } = req.body;
  
  const isValid = await validatePIN(employeeId, pin);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  
  // Create time clock entry
  // ... (existing time clock logic)
}
```

**3. Test**
```bash
npm test -- employee-auth.test.ts
```

---

## 📋 Phase 2: Quote Workflow (Day 3-5)

### Day 3: Create Quote Content Type

**1. Generate Strapi Content Type**
```bash
cd printshop-strapi
npm run strapi generate
# Select: api
# Name: quote
# Add attributes as per PRINTAVO_REPLACEMENT_PLAN.md
```

**2. Enable Public Permissions**
Edit `printshop-strapi/src/index.ts`:
```typescript
await strapi.documents('plugin::users-permissions.permission').update({
  filters: { action: 'api::quote.quote.find' },
  data: { enabled: true }
});
```

**3. Rebuild**
```bash
npm run build
npm run develop
```

---

### Day 4-5: Quote Approval Workflow

**Location:** `printshop-strapi/src/api/quote/controllers/quote.ts`

**Add Custom Methods:**
```typescript
export default factories.createCoreController('api::quote.quote', ({ strapi }) => ({
  async approve(ctx) {
    const { id } = ctx.params;
    
    const quote = await strapi.documents('api::quote.quote').update({
      documentId: id,
      data: {
        status: 'APPROVED',
        approvedAt: new Date().toISOString()
      }
    });
    
    // Emit WebSocket event
    strapi.io.emit('quote:approved', { quoteId: id });
    
    return quote;
  },
  
  async convertToOrder(ctx) {
    const { id } = ctx.params;
    const quote = await strapi.documents('api::quote.quote').findOne({ documentId: id });
    
    // Create order from quote
    const order = await strapi.documents('api::order.order').create({
      data: {
        customer: quote.customer,
        items: quote.items,
        totalAmount: quote.totalAmount,
        status: 'NEW',
        quoteId: id
      }
    });
    
    // Update quote status
    await strapi.documents('api::quote.quote').update({
      documentId: id,
      data: { status: 'CONVERTED' }
    });
    
    return order;
  }
}));
```

---

## 📋 Phase 3-5: See PRINTAVO_REPLACEMENT_PLAN.md

For remaining phases (Job Tracking, Support Tickets, Payments), follow the detailed plan in `PRINTAVO_REPLACEMENT_PLAN.md`.

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- customer-auth.test.ts

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

## 📝 Documentation Updates

**After each feature, update ONE line:**
```bash
# In SERVICE_DIRECTORY.md, add under "Recent Updates"
echo "- ✅ Customer authentication implemented" >> SERVICE_DIRECTORY.md
```

**DO NOT create:**
- ❌ Session reports
- ❌ Implementation summaries
- ❌ Epic documents

---

## 🔍 Debugging Tips

### Check Strapi Logs
```bash
cd printshop-strapi
npm run develop
# Watch console for errors
```

### Check API Logs
```bash
cd services/api
npm run dev
# Watch console for requests
```

### Test Strapi API Directly
```bash
# Get customers
curl http://localhost:1337/api/customers

# Get orders
curl http://localhost:1337/api/orders

# Create order (with auth)
curl -X POST http://localhost:1337/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":{"orderNumber":"13000","customer":1,"status":"NEW"}}'
```

---

## ✅ Daily Checklist

**Before committing:**
- [ ] Code written and working
- [ ] Tests written (8-15 per feature)
- [ ] Tests passing (`npm test`)
- [ ] Manual test completed
- [ ] SERVICE_DIRECTORY.md updated (1 line)
- [ ] No session reports created
- [ ] Git commit with proper message

**Commit Message Format:**
```bash
git commit -m "feat(auth): add customer signup and login

- Implement JWT authentication via Strapi
- Add signup endpoint with customer profile creation
- Add login endpoint with customer lookup
- 15 tests passing"
```

---

## 🆘 Need Help?

**Check these first:**
1. `PRINTAVO_REPLACEMENT_PLAN.md` - Full implementation details
2. `SERVICE_DIRECTORY.md` - Where files should go
3. `ARCHITECTURE.md` - How systems connect
4. `.github/copilot-instructions.md` - Project rules

**Common Issues:**
- **Port conflicts:** Check if services are already running
- **Strapi errors:** Rebuild with `npm run build`
- **JWT errors:** Check token expiration in Strapi settings
- **Import errors:** Use absolute imports: `import { X } from '@/lib/X'`

---

**Ready to start?** Begin with Phase 1, Day 1: Customer Authentication Setup ⬆️
