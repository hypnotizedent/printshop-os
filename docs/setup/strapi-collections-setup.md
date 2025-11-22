# Strapi Collection Types Setup Guide

This guide walks through creating the 4 core collection types for PrintShop OS.

## Collection Types to Create

### 1. Customer
**Fields:**
- `name` (Text, required)
- `email` (Email, required, unique)
- `phone` (Text)
- `company` (Text)
- `notes` (Rich text)
- `tags` (Enumeration: nonprofit, monthly, vip, late-pay)
- `isActive` (Boolean, default: true)

### 2. Job
**Fields:**
- `jobNumber` (Text, required, unique)
- `title` (Text, required)
- `description` (Rich text)
- `customer` (Relation: many-to-one with Customer)
- `status` (Enumeration: quote, approved, in-production, completed, cancelled)
- `priority` (Enumeration: low, medium, high, urgent)
- `dueDate` (Date)
- `quantity` (Number, integer)
- `garmentType` (Text)
- `printMethod` (Enumeration: screen-print, dtg, embroidery, finishing)
- `mockupUrl` (Text, URL)
- `totalPrice` (Decimal)
- `depositAmount` (Decimal)
- `depositPaid` (Boolean, default: false)
- `pressNotes` (Rich text)

### 3. Employee
**Fields:**
- `firstName` (Text, required)
- `lastName` (Text, required)
- `email` (Email, unique)
- `role` (Enumeration: admin, sales, press-operator, supervisor)
- `isActive` (Boolean, default: true)
- `hireDate` (Date)

### 4. TimeClockEntry
**Fields:**
- `employee` (Relation: many-to-one with Employee)
- `job` (Relation: many-to-one with Job)
- `clockIn` (DateTime, required)
- `clockOut` (DateTime)
- `totalMinutes` (Number, integer)
- `notes` (Text)

## Steps to Create in Strapi Admin Panel

1. Navigate to http://localhost:1337/admin
2. Click **Content-Type Builder** in the left sidebar
3. Click **Create new collection type**
4. Enter the collection name (singular): `Customer`
5. Click **Continue**
6. Add each field one by one using the appropriate field type
7. Configure field settings (required, unique, default values)
8. Click **Finish** and **Save**
9. Repeat for each collection type

## API Permissions

After creating collection types:

1. Go to **Settings** → **Roles** → **Public**
2. Enable the following permissions for each collection:
   - `find` (get all)
   - `findOne` (get one)
   - `create`
   - `update`
   - `delete`
3. Click **Save**

## Generate API Token

1. Go to **Settings** → **API Tokens**
2. Click **Create new API Token**
3. Name: `PrintShop Development Token`
4. Token type: **Full access**
5. Token duration: **Unlimited**
6. Click **Save**
7. **IMPORTANT**: Copy the token immediately and save it securely

## Test API Endpoints

Once complete, test the API:

```bash
# Get all customers (should return empty array initially)
curl http://localhost:1337/api/customers

# Get all jobs
curl http://localhost:1337/api/jobs

# Get all employees
curl http://localhost:1337/api/employees

# Get all time-clock-entries
curl http://localhost:1337/api/time-clock-entries
```

## Next Steps

After collection types are created:
1. Create test data via the admin panel
2. Test API endpoints with curl or Postman
3. Proceed to Phase 2: Appsmith Dashboard
