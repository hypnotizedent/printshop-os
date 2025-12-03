# Account Setup Guide

This guide explains how to set up and manage user accounts for the PrintShop OS three-portal authentication system.

## 🎯 Overview

PrintShop OS supports three types of user accounts:

1. **Owner** - Full admin access to the admin dashboard
2. **Employee** - Production floor access with PIN authentication
3. **Customer** - Portal access for order tracking and quotes

## 🚀 Quick Start - Seed Default Accounts

For development and testing, use the seed script to create all three default accounts:

```bash
cd printshop-strapi
npm run dev -- --run-script scripts/seed-auth.ts
```

This creates:
- **Owner**: `admin@mintprints.com` / `AdminPass123!`
- **Employee**: PIN `1234`
- **Customer**: `customer@test.com` / `CustomerPass123!`

## 📝 Manual Account Creation

### Create Owner Account (Admin)

Owners have full access to the admin dashboard and all system settings.

**Requirements:**
- Unique email address
- Strong password (min 8 characters)
- Optional: 2FA secret

**Via Seed Script:**
Edit `printshop-strapi/scripts/seed-auth.ts` and add your owner credentials, then run:
```bash
npm run dev -- --run-script scripts/seed-auth.ts
```

**Via API (requires admin access):**
```bash
./scripts/create-owner.sh "owner@example.com" "SecurePassword123!" "Owner Name"
```

**Via Strapi Admin Panel:**
1. Login to Strapi Admin: `http://localhost:1337/admin`
2. Navigate to Content Manager → Owners
3. Click "Create new entry"
4. Fill in email, name, and password (must be bcrypt hashed)
5. Set `isActive` to true
6. Save

### Create Employee Account

Employees use PIN authentication for quick clock-in on the production floor.

**Requirements:**
- First name and last name
- 4-6 digit PIN
- Role: operator, supervisor, or admin
- Department: screen_printing, embroidery, or digital
- Optional: email address

**Via Seed Script:**
Edit `printshop-strapi/scripts/seed-auth.ts` and add your employee, then run the seed script.

**Via API:**
```bash
./scripts/create-employee.sh "Jane" "Smith" "5678" "jane@mintprints.com"
```

**Via Strapi Admin Panel:**
1. Login to Strapi Admin
2. Navigate to Content Manager → Employees
3. Click "Create new entry"
4. Fill in required fields (PIN must be bcrypt hashed)
5. Set `isActive` to true
6. Save

### Create Customer Account

Customers can sign up themselves or be created by admins.

**Requirements:**
- Unique email address
- Password (min 8 characters)
- Full name
- Optional: company, phone

**Self-Signup (Recommended):**
Customers can sign up at: `https://mintprints-app.ronny.works/login/customer`

**Via Signup API:**
```bash
curl -X POST https://mintprints.ronny.works/api/auth/customer/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "CustomerPass123!",
    "name": "Customer Name",
    "company": "Company Name",
    "phone": "555-1234"
  }'
```

**Via Script:**
```bash
./scripts/create-customer.sh "customer@example.com" "Password123!" "Customer Name" "Company"
```

## 🔐 Login URLs

### Production
- **Admin Dashboard**: `https://mintprints-app.ronny.works/login/admin`
- **Employee Portal**: `https://mintprints-app.ronny.works/login/employee`
- **Customer Portal**: `https://mintprints-app.ronny.works/login/customer`

### Development
- **Admin Dashboard**: `http://localhost:5173/login/admin`
- **Employee Portal**: `http://localhost:5173/login/employee`
- **Customer Portal**: `http://localhost:5173/login/customer`

## 🧪 Testing Authentication

### Test Owner Login
```bash
curl -X POST https://mintprints.ronny.works/api/auth/owner/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mintprints.com","password":"AdminPass123!"}'
```

### Test Employee PIN
```bash
curl -X POST https://mintprints.ronny.works/api/auth/employee/validate-pin \
  -H "Content-Type: application/json" \
  -d '{"pin":"1234"}'
```

### Test Customer Login
```bash
curl -X POST https://mintprints.ronny.works/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"CustomerPass123!"}'
```

### Verify Token
```bash
# Get a token from login response, then:
curl -X GET https://mintprints.ronny.works/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔑 Password Requirements

- **Minimum length**: 8 characters
- **Recommended**: Include uppercase, lowercase, numbers, and symbols
- **Storage**: Passwords are hashed using bcrypt with 12 salt rounds

## 📌 PIN Requirements (Employees)

- **Length**: 4-6 digits
- **Format**: Numeric only
- **Storage**: PINs are hashed using bcrypt with 12 salt rounds
- **Recommendation**: Use unique PINs for each employee

## 🔒 Two-Factor Authentication (Owners Only)

2FA is optional for owner accounts and can be enabled in the admin dashboard.

**To enable 2FA:**
1. Login as owner
2. Navigate to account settings
3. Enable 2FA and scan the QR code
4. Save the backup codes

**To login with 2FA:**
```bash
curl -X POST https://mintprints.ronny.works/api/auth/owner/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@mintprints.com",
    "password":"AdminPass123!",
    "twoFactorCode":"123456"
  }'
```

## 🛠️ Troubleshooting

### "Invalid email or password"
- Verify credentials are correct
- Check that account exists in Strapi Admin
- Ensure password is properly hashed in database

### "Account is deactivated"
- Set `isActive` to `true` in Strapi Admin
- For owners: Content Manager → Owners → Edit entry
- For employees: Content Manager → Employees → Edit entry

### "Two-factor authentication code is required"
- Owner account has 2FA enabled
- Provide 6-digit code from authenticator app
- Or disable 2FA in Strapi Admin

### "Token expired"
- Token lifetimes:
  - Owner: 7 days
  - Employee: 12 hours
  - Customer: 7 days
- Login again to get a new token

## 📚 Additional Resources

- **API Documentation**: `/docs/API.md`
- **Authentication Flow**: `/docs/ARCHITECTURE.md`
- **Frontend Setup**: `/frontend/README.md`
- **Strapi Documentation**: `https://docs.strapi.io`

## 🔄 Account Management

### Reset Password (Owners/Customers)
Currently, password reset must be done manually in Strapi Admin:
1. Navigate to the user's content entry
2. Generate new password hash: `bcrypt.hash('newpassword', 12)`
3. Update `passwordHash` field
4. Save

### Reset PIN (Employees)
1. Navigate to employee entry in Strapi Admin
2. Generate new PIN hash: `bcrypt.hash('1234', 12)`
3. Update `pin` field
4. Save

### Deactivate Account
Set `isActive` to `false` in the content entry. The user will not be able to login.

### Delete Account
⚠️ **Warning**: Deleting accounts may break data relationships. It's recommended to deactivate instead.

If deletion is necessary:
1. Backup the database
2. Delete the content entry in Strapi Admin
3. Verify no orphaned data exists

## 🎓 Best Practices

1. **Use strong passwords** for owner and customer accounts
2. **Enable 2FA** for all owner accounts in production
3. **Rotate PINs regularly** for employees
4. **Monitor login attempts** via Strapi logs
5. **Use environment variables** for sensitive configuration
6. **Regular backups** of the authentication database
7. **Test authentication** after any system updates

## 📞 Support

For issues or questions:
- GitHub Issues: `https://github.com/hypnotizedent/printshop-os/issues`
- Documentation: `/docs/`
- Email: `support@mintprints.com`
