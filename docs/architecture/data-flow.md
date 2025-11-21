# Data Flow - PrintShop OS

## Introduction

This document provides detailed information about how data flows through the PrintShop OS system, including API request/response patterns, database relationships, and real-time synchronization strategies.

## Overall Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      DATA FLOW OVERVIEW                       │
└──────────────────────────────────────────────────────────────┘

Customer Input → Botpress → HTTP POST → Strapi API → PostgreSQL
                                            ↓
                                      Validation
                                            ↓
                                      Business Logic
                                            ↓
                                      Database Write
                                            ↓
                                      Response JSON
                                            ↑
Production Team → Appsmith → HTTP GET → Strapi API → PostgreSQL
                                            ↓
                                       Query Data
                                            ↓
                                      Format Response
                                            ↓
                                      Return JSON
```

## Core Data Models

### Entity Relationship Diagram

```
┌─────────────────┐
│    Customer     │
├─────────────────┤
│ id (PK)         │
│ Name            │
│ Email (UNIQUE)  │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────────┐
│         Job             │
├─────────────────────────┤
│ id (PK)                 │
│ JobID (UNIQUE)          │
│ Status (ENUM)           │
│ MockupImageURL          │
│ ArtFileURL              │
│ InkColors (JSON)        │
│ ImprintLocations (JSON) │
│ Quantity (INTEGER)      │
│ customer_id (FK)        │◄─── Links to Customer
│ createdAt               │
│ updatedAt               │
└─────────────────────────┘

┌─────────────────┐
│    Employee     │
├─────────────────┤
│ id (PK)         │
│ EmployeeID      │
│ Name            │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────┐
│  TimeClockEntry     │
├─────────────────────┤
│ id (PK)             │
│ Timestamp           │
│ EntryType (ENUM)    │
│ employee_id (FK)    │◄─── Links to Employee
│ createdAt           │
│ updatedAt           │
└─────────────────────┘
```

## API Request/Response Patterns

### 1. Customer Order Creation Flow

#### Step 1: Check if Customer Exists

**Request:**
```http
GET /api/customers?filters[Email][$eq]=customer@example.com
Authorization: Bearer {API_TOKEN}
```

**Response (Customer Exists):**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "Name": "John Doe",
        "Email": "customer@example.com",
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T10:00:00.000Z"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

**Response (Customer Not Found):**
```json
{
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 0,
      "total": 0
    }
  }
}
```

#### Step 2: Create Customer (if needed)

**Request:**
```http
POST /api/customers
Authorization: Bearer {API_TOKEN}
Content-Type: application/json

{
  "data": {
    "Name": "John Doe",
    "Email": "customer@example.com"
  }
}
```

**Response:**
```json
{
  "data": {
    "id": 2,
    "attributes": {
      "Name": "John Doe",
      "Email": "customer@example.com",
      "createdAt": "2025-01-20T14:30:00.000Z",
      "updatedAt": "2025-01-20T14:30:00.000Z"
    }
  },
  "meta": {}
}
```

#### Step 3: Create Job

**Request:**
```http
POST /api/jobs
Authorization: Bearer {API_TOKEN}
Content-Type: application/json

{
  "data": {
    "Status": "Pending Artwork",
    "Quantity": 100,
    "customer": 2
  }
}
```

**Response:**
```json
{
  "data": {
    "id": 15,
    "attributes": {
      "JobID": "JOB-2025-015",
      "Status": "Pending Artwork",
      "MockupImageURL": null,
      "ArtFileURL": null,
      "InkColors": null,
      "ImprintLocations": null,
      "Quantity": 100,
      "createdAt": "2025-01-20T14:31:00.000Z",
      "updatedAt": "2025-01-20T14:31:00.000Z"
    },
    "relationships": {
      "customer": {
        "data": {
          "id": 2,
          "type": "customer"
        }
      }
    }
  },
  "meta": {}
}
```

### 2. Production Dashboard Query Flow

#### Fetch Jobs In Production

**Request:**
```http
GET /api/jobs?filters[Status][$eq]=In Production&populate=customer&sort=createdAt:desc
Authorization: Bearer {API_TOKEN}
```

**Response:**
```json
{
  "data": [
    {
      "id": 12,
      "attributes": {
        "JobID": "JOB-2025-012",
        "Status": "In Production",
        "MockupImageURL": "https://storage.example.com/mockups/job-012.png",
        "ArtFileURL": "https://storage.example.com/artwork/job-012.ai",
        "InkColors": ["Black", "Red", "White"],
        "ImprintLocations": ["Front", "Back"],
        "Quantity": 150,
        "createdAt": "2025-01-18T09:00:00.000Z",
        "updatedAt": "2025-01-20T08:00:00.000Z",
        "customer": {
          "data": {
            "id": 5,
            "attributes": {
              "Name": "ABC Company",
              "Email": "orders@abccompany.com"
            }
          }
        }
      }
    },
    {
      "id": 13,
      "attributes": {
        "JobID": "JOB-2025-013",
        "Status": "In Production",
        "MockupImageURL": "https://storage.example.com/mockups/job-013.png",
        "ArtFileURL": "https://storage.example.com/artwork/job-013.pdf",
        "InkColors": ["Navy", "Gold"],
        "ImprintLocations": ["Left Chest"],
        "Quantity": 50,
        "createdAt": "2025-01-19T11:30:00.000Z",
        "updatedAt": "2025-01-20T07:45:00.000Z",
        "customer": {
          "data": {
            "id": 3,
            "attributes": {
              "Name": "XYZ Corporation",
              "Email": "info@xyzcorp.com"
            }
          }
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 2
    }
  }
}
```

#### Update Job Status

**Request:**
```http
PUT /api/jobs/12
Authorization: Bearer {API_TOKEN}
Content-Type: application/json

{
  "data": {
    "Status": "Complete"
  }
}
```

**Response:**
```json
{
  "data": {
    "id": 12,
    "attributes": {
      "JobID": "JOB-2025-012",
      "Status": "Complete",
      "MockupImageURL": "https://storage.example.com/mockups/job-012.png",
      "ArtFileURL": "https://storage.example.com/artwork/job-012.ai",
      "InkColors": ["Black", "Red", "White"],
      "ImprintLocations": ["Front", "Back"],
      "Quantity": 150,
      "createdAt": "2025-01-18T09:00:00.000Z",
      "updatedAt": "2025-01-20T14:45:00.000Z"
    }
  },
  "meta": {}
}
```

### 3. Time Clock Entry Flow

#### Clock In

**Request:**
```http
POST /api/time-clock-entries
Authorization: Bearer {API_TOKEN}
Content-Type: application/json

{
  "data": {
    "Timestamp": "2025-01-20T08:00:00.000Z",
    "EntryType": "Clock In",
    "employee": 3
  }
}
```

**Response:**
```json
{
  "data": {
    "id": 145,
    "attributes": {
      "Timestamp": "2025-01-20T08:00:00.000Z",
      "EntryType": "Clock In",
      "createdAt": "2025-01-20T08:00:01.000Z",
      "updatedAt": "2025-01-20T08:00:01.000Z"
    },
    "relationships": {
      "employee": {
        "data": {
          "id": 3,
          "type": "employee"
        }
      }
    }
  },
  "meta": {}
}
```

#### Clock Out

**Request:**
```http
POST /api/time-clock-entries
Authorization: Bearer {API_TOKEN}
Content-Type: application/json

{
  "data": {
    "Timestamp": "2025-01-20T17:00:00.000Z",
    "EntryType": "Clock Out",
    "employee": 3
  }
}
```

**Response:**
```json
{
  "data": {
    "id": 146,
    "attributes": {
      "Timestamp": "2025-01-20T17:00:00.000Z",
      "EntryType": "Clock Out",
      "createdAt": "2025-01-20T17:00:01.000Z",
      "updatedAt": "2025-01-20T17:00:01.000Z"
    },
    "relationships": {
      "employee": {
        "data": {
          "id": 3,
          "type": "employee"
        }
      }
    }
  },
  "meta": {}
}
```

## Database Relationships

### Customer → Jobs Relationship

**Type:** One-to-Many  
**Description:** One customer can have multiple jobs

**Database Schema:**
```sql
-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table with foreign key
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    mockup_image_url TEXT,
    art_file_url TEXT,
    ink_colors JSONB,
    imprint_locations JSONB,
    quantity INTEGER,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
```

### Employee → TimeClockEntries Relationship

**Type:** One-to-Many  
**Description:** One employee can have multiple time clock entries

**Database Schema:**
```sql
-- Employees table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time Clock Entries table
CREATE TABLE time_clock_entries (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    entry_type VARCHAR(20) NOT NULL,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_time_clock_employee_id ON time_clock_entries(employee_id);
CREATE INDEX idx_time_clock_timestamp ON time_clock_entries(timestamp);
```

## Real-Time Synchronization Strategies

### Current Implementation: Polling

#### Appsmith Polling Strategy

**Configuration:**
```javascript
// In Appsmith datasource query
{
  "runOnPageLoad": true,
  "refreshInterval": 5000, // 5 seconds
  "autoRefresh": true
}
```

**Flow:**
```
Appsmith Timer (5s) → Query Execution → Strapi API Call → Data Return → UI Update
                           ↓
                    Check for Changes
                           ↓
                    Update Only If Changed
```

**Advantages:**
- Simple to implement
- Works with standard REST APIs
- No special server configuration needed

**Disadvantages:**
- Increased API calls (even when no changes)
- 5-second delay in seeing updates
- Higher server load with many clients

### Future Implementation: WebSockets

#### Real-Time Updates with WebSockets

**Architecture:**
```
┌─────────────┐
│  Appsmith   │
└──────┬──────┘
       │ WebSocket Connection
       ▼
┌──────────────┐
│   Strapi     │
│  (WebSocket  │
│   Server)    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
└──────────────┘
```

**Event Flow:**
```
1. Client connects via WebSocket
2. Server sends initial data
3. Database change occurs
4. Strapi emits event
5. WebSocket pushes update to all connected clients
6. Clients update UI immediately
```

**Implementation (Future):**
```javascript
// Server-side (Strapi plugin)
strapi.db.on('create:job', (job) => {
  io.emit('job:created', job);
});

strapi.db.on('update:job', (job) => {
  io.emit('job:updated', job);
});

// Client-side (Appsmith custom widget)
socket.on('job:updated', (job) => {
  updateJobList(job);
});
```

### Future Implementation: Webhooks

#### Event-Driven Updates

**Configuration:**
```
Strapi Webhook Settings:
- Event: job.update
- URL: https://appsmith.example.com/api/v1/webhooks/job-update
- Headers: { "Authorization": "Bearer {token}" }
```

**Flow:**
```
Job Updated in Strapi → Webhook Triggered → HTTP POST to Appsmith
                                                   ↓
                                            Process Update
                                                   ↓
                                            Refresh Data
```

## Data Validation and Business Logic

### Strapi Data Validation

#### Job Creation Validation

```javascript
// Strapi lifecycle hook
module.exports = {
  beforeCreate(event) {
    const { data } = event.params;
    
    // Validate quantity is positive
    if (data.Quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    
    // Set default status
    if (!data.Status) {
      data.Status = 'Pending Artwork';
    }
    
    // Generate JobID if not provided
    if (!data.JobID) {
      data.JobID = `JOB-${new Date().getFullYear()}-${generateNextJobNumber()}`;
    }
  },
  
  afterCreate(event) {
    const { result } = event;
    
    // Send notification email (future)
    // notifyCustomer(result.customer.email, result.JobID);
  }
};
```

### Customer Email Uniqueness

```javascript
// Strapi validation
{
  "email": {
    "type": "email",
    "unique": true,
    "required": true
  }
}
```

## Performance Optimization

### Query Optimization

#### Bad Practice (N+1 Query Problem)
```javascript
// Fetches jobs, then makes separate call for each customer
const jobs = await strapi.entityService.findMany('api::job.job');
for (let job of jobs) {
  job.customer = await strapi.entityService.findOne('api::customer.customer', job.customer.id);
}
```

#### Good Practice (Single Query with Population)
```javascript
// Fetches jobs with customers in single optimized query
const jobs = await strapi.entityService.findMany('api::job.job', {
  populate: ['customer']
});
```

### Pagination for Large Datasets

```http
GET /api/jobs?pagination[page]=1&pagination[pageSize]=25
```

### Filtering for Relevant Data Only

```http
GET /api/jobs?filters[Status][$eq]=In Production&fields[0]=JobID&fields[1]=Quantity
```

## Error Handling

### API Error Responses

#### Validation Error
```json
{
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "Quantity must be greater than 0",
    "details": {
      "errors": [
        {
          "path": ["Quantity"],
          "message": "Quantity must be greater than 0",
          "name": "ValidationError"
        }
      ]
    }
  }
}
```

#### Authentication Error
```json
{
  "error": {
    "status": 401,
    "name": "UnauthorizedError",
    "message": "Missing or invalid credentials"
  }
}
```

#### Not Found Error
```json
{
  "error": {
    "status": 404,
    "name": "NotFoundError",
    "message": "Job with ID 999 not found"
  }
}
```

## Conclusion

Understanding these data flow patterns is crucial for:
- **Debugging**: Trace data through the system
- **Optimization**: Identify bottlenecks and improve performance
- **Integration**: Build new features that work with existing patterns
- **Troubleshooting**: Quickly identify where issues occur

All data flows through Strapi's REST API, ensuring consistency, validation, and a single source of truth in the PostgreSQL database.

---

**Related Documentation:**
- [System Overview](system-overview.md)
- [Component Architecture](component-architecture.md)
- [API Endpoints Reference](../api/strapi-endpoints.md)
