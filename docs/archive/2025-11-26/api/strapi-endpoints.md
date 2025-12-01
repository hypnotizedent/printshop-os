# Strapi API Endpoints Reference

## Overview

Complete reference for all Strapi REST API endpoints in PrintShop OS. All endpoints follow RESTful conventions and return JSON responses.

**Base URL:** `http://localhost:1337/api` (development)  
**Authentication:** Bearer token in Authorization header  
**Content-Type:** `application/json`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Customers API](#customers-api)
3. [Jobs API](#jobs-api)
4. [Employees API](#employees-api)
5. [Time Clock Entries API](#time-clock-entries-api)
6. [Error Responses](#error-responses)
7. [Pagination](#pagination)
8. [Filtering](#filtering)
9. [Sorting](#sorting)
10. [Population](#population)

---

## Authentication

### API Token

Include API token in all requests:

```http
Authorization: Bearer YOUR_API_TOKEN_HERE
```

### Generate Token

1. Login to Strapi admin panel
2. Settings → API Tokens
3. Create new token with desired permissions
4. Copy token (shown only once)

---

## Customers API

### List All Customers

**Endpoint:** `GET /api/customers`

**Description:** Retrieve all customers

**Request:**
```http
GET /api/customers HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "Name": "John Doe",
        "Email": "john@example.com",
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T10:00:00.000Z"
      }
    },
    {
      "id": 2,
      "attributes": {
        "Name": "Jane Smith",
        "Email": "jane@example.com",
        "createdAt": "2025-01-16T14:30:00.000Z",
        "updatedAt": "2025-01-16T14:30:00.000Z"
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

### Get Single Customer

**Endpoint:** `GET /api/customers/:id`

**Parameters:**
- `id` (path, required): Customer ID

**Request:**
```http
GET /api/customers/1 HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "Name": "John Doe",
      "Email": "john@example.com",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  },
  "meta": {}
}
```

### Create Customer

**Endpoint:** `POST /api/customers`

**Request:**
```http
POST /api/customers HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json

{
  "data": {
    "Name": "Alice Johnson",
    "Email": "alice@example.com"
  }
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 3,
    "attributes": {
      "Name": "Alice Johnson",
      "Email": "alice@example.com",
      "createdAt": "2025-01-20T16:00:00.000Z",
      "updatedAt": "2025-01-20T16:00:00.000Z"
    }
  },
  "meta": {}
}
```

### Update Customer

**Endpoint:** `PUT /api/customers/:id`

**Request:**
```http
PUT /api/customers/3 HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json

{
  "data": {
    "Name": "Alice Johnson-Williams"
  }
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 3,
    "attributes": {
      "Name": "Alice Johnson-Williams",
      "Email": "alice@example.com",
      "createdAt": "2025-01-20T16:00:00.000Z",
      "updatedAt": "2025-01-20T17:30:00.000Z"
    }
  },
  "meta": {}
}
```

### Delete Customer

**Endpoint:** `DELETE /api/customers/:id`

**Request:**
```http
DELETE /api/customers/3 HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 3,
    "attributes": {
      "Name": "Alice Johnson-Williams",
      "Email": "alice@example.com",
      "createdAt": "2025-01-20T16:00:00.000Z",
      "updatedAt": "2025-01-20T17:30:00.000Z"
    }
  },
  "meta": {}
}
```

---

## Jobs API

### List All Jobs

**Endpoint:** `GET /api/jobs`

**Request:**
```http
GET /api/jobs HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "JobID": "JOB-2025-001",
        "Status": "In Production",
        "MockupImageURL": "https://example.com/mockups/job-001.png",
        "ArtFileURL": "https://example.com/artwork/job-001.ai",
        "InkColors": ["Black", "Red", "White"],
        "ImprintLocations": ["Front", "Back"],
        "Quantity": 100,
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-18T14:30:00.000Z"
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

### Get Single Job

**Endpoint:** `GET /api/jobs/:id`

**Query Parameters:**
- `populate` (optional): Populate related data (e.g., `customer`)

**Request:**
```http
GET /api/jobs/1?populate=customer HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "JobID": "JOB-2025-001",
      "Status": "In Production",
      "MockupImageURL": "https://example.com/mockups/job-001.png",
      "ArtFileURL": "https://example.com/artwork/job-001.ai",
      "InkColors": ["Black", "Red", "White"],
      "ImprintLocations": ["Front", "Back"],
      "Quantity": 100,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-18T14:30:00.000Z",
      "customer": {
        "data": {
          "id": 1,
          "attributes": {
            "Name": "John Doe",
            "Email": "john@example.com"
          }
        }
      }
    }
  },
  "meta": {}
}
```

### Create Job

**Endpoint:** `POST /api/jobs`

**Request:**
```http
POST /api/jobs HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json

{
  "data": {
    "Status": "Pending Artwork",
    "Quantity": 50,
    "customer": 1
  }
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 2,
    "attributes": {
      "JobID": "JOB-2025-002",
      "Status": "Pending Artwork",
      "MockupImageURL": null,
      "ArtFileURL": null,
      "InkColors": null,
      "ImprintLocations": null,
      "Quantity": 50,
      "createdAt": "2025-01-20T16:00:00.000Z",
      "updatedAt": "2025-01-20T16:00:00.000Z"
    }
  },
  "meta": {}
}
```

### Update Job

**Endpoint:** `PUT /api/jobs/:id`

**Request:**
```http
PUT /api/jobs/1 HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json

{
  "data": {
    "Status": "Complete"
  }
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "JobID": "JOB-2025-001",
      "Status": "Complete",
      "MockupImageURL": "https://example.com/mockups/job-001.png",
      "ArtFileURL": "https://example.com/artwork/job-001.ai",
      "InkColors": ["Black", "Red", "White"],
      "ImprintLocations": ["Front", "Back"],
      "Quantity": 100,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-20T16:30:00.000Z"
    }
  },
  "meta": {}
}
```

### Update Job with Full Details

**Request:**
```http
PUT /api/jobs/2 HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json

{
  "data": {
    "Status": "In Production",
    "MockupImageURL": "https://example.com/mockups/job-002.png",
    "ArtFileURL": "https://example.com/artwork/job-002.pdf",
    "InkColors": ["Navy", "Gold"],
    "ImprintLocations": ["Left Chest"],
    "Quantity": 75
  }
}
```

---

## Employees API

### List All Employees

**Endpoint:** `GET /api/employees`

**Request:**
```http
GET /api/employees HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "EmployeeID": "EMP001",
        "Name": "Mike Wilson",
        "createdAt": "2025-01-10T09:00:00.000Z",
        "updatedAt": "2025-01-10T09:00:00.000Z"
      }
    },
    {
      "id": 2,
      "attributes": {
        "EmployeeID": "EMP002",
        "Name": "Sarah Davis",
        "createdAt": "2025-01-11T10:00:00.000Z",
        "updatedAt": "2025-01-11T10:00:00.000Z"
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

### Create Employee

**Endpoint:** `POST /api/employees`

**Request:**
```http
POST /api/employees HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json

{
  "data": {
    "EmployeeID": "EMP003",
    "Name": "Tom Anderson"
  }
}
```

---

## Time Clock Entries API

### List Time Clock Entries

**Endpoint:** `GET /api/time-clock-entries`

**Request:**
```http
GET /api/time-clock-entries?populate=employee HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "Timestamp": "2025-01-20T08:00:00.000Z",
        "EntryType": "Clock In",
        "createdAt": "2025-01-20T08:00:01.000Z",
        "updatedAt": "2025-01-20T08:00:01.000Z",
        "employee": {
          "data": {
            "id": 1,
            "attributes": {
              "EmployeeID": "EMP001",
              "Name": "Mike Wilson"
            }
          }
        }
      }
    },
    {
      "id": 2,
      "attributes": {
        "Timestamp": "2025-01-20T17:00:00.000Z",
        "EntryType": "Clock Out",
        "createdAt": "2025-01-20T17:00:01.000Z",
        "updatedAt": "2025-01-20T17:00:01.000Z",
        "employee": {
          "data": {
            "id": 1,
            "attributes": {
              "EmployeeID": "EMP001",
              "Name": "Mike Wilson"
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

### Create Time Clock Entry

**Endpoint:** `POST /api/time-clock-entries`

**Request (Clock In):**
```http
POST /api/time-clock-entries HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json

{
  "data": {
    "Timestamp": "2025-01-21T08:00:00.000Z",
    "EntryType": "Clock In",
    "employee": 1
  }
}
```

**Request (Clock Out):**
```http
POST /api/time-clock-entries HTTP/1.1
Host: localhost:1337
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json

{
  "data": {
    "Timestamp": "2025-01-21T17:00:00.000Z",
    "EntryType": "Clock Out",
    "employee": 1
  }
}
```

---

## Error Responses

### 400 Bad Request

**Validation Error:**
```json
{
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "Email must be unique",
    "details": {
      "errors": [
        {
          "path": ["Email"],
          "message": "This attribute must be unique",
          "name": "unique"
        }
      ]
    }
  }
}
```

### 401 Unauthorized

**Missing/Invalid Token:**
```json
{
  "error": {
    "status": 401,
    "name": "UnauthorizedError",
    "message": "Missing or invalid credentials",
    "details": {}
  }
}
```

### 403 Forbidden

**Insufficient Permissions:**
```json
{
  "error": {
    "status": 403,
    "name": "ForbiddenError",
    "message": "Forbidden",
    "details": {}
  }
}
```

### 404 Not Found

**Resource Not Found:**
```json
{
  "error": {
    "status": 404,
    "name": "NotFoundError",
    "message": "Not Found",
    "details": {}
  }
}
```

### 500 Internal Server Error

**Server Error:**
```json
{
  "error": {
    "status": 500,
    "name": "InternalServerError",
    "message": "An error occurred",
    "details": {}
  }
}
```

---

## Pagination

### Query Parameters

- `pagination[page]`: Page number (default: 1)
- `pagination[pageSize]`: Results per page (default: 25, max: 100)
- `pagination[start]`: Offset (alternative to page)
- `pagination[limit]`: Limit (alternative to pageSize)

### Examples

**Page-based:**
```http
GET /api/jobs?pagination[page]=2&pagination[pageSize]=10
```

**Offset-based:**
```http
GET /api/jobs?pagination[start]=10&pagination[limit]=10
```

### Response

```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "page": 2,
      "pageSize": 10,
      "pageCount": 5,
      "total": 47
    }
  }
}
```

---

## Filtering

### Simple Filter

**Exact match:**
```http
GET /api/jobs?filters[Status][$eq]=In Production
```

### Complex Filters

**Multiple conditions:**
```http
GET /api/jobs?filters[Status][$eq]=In Production&filters[Quantity][$gte]=100
```

**Nested filters (customer email):**
```http
GET /api/jobs?filters[customer][Email][$eq]=john@example.com&populate=customer
```

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equal | `Status[$eq]=Complete` |
| `$ne` | Not equal | `Status[$ne]=Archived` |
| `$lt` | Less than | `Quantity[$lt]=50` |
| `$lte` | Less than or equal | `Quantity[$lte]=100` |
| `$gt` | Greater than | `Quantity[$gt]=50` |
| `$gte` | Greater than or equal | `Quantity[$gte]=100` |
| `$in` | In array | `Status[$in][0]=Pending&Status[$in][1]=In Production` |
| `$notIn` | Not in array | `Status[$notIn][0]=Archived` |
| `$contains` | Contains | `Name[$contains]=John` |
| `$notContains` | Not contains | `Name[$notContains]=Test` |
| `$null` | Is null | `MockupImageURL[$null]=true` |
| `$notNull` | Is not null | `ArtFileURL[$notNull]=true` |

---

## Sorting

### Single Field

**Ascending:**
```http
GET /api/jobs?sort=createdAt
```

**Descending:**
```http
GET /api/jobs?sort=createdAt:desc
```

### Multiple Fields

```http
GET /api/jobs?sort[0]=Status&sort[1]=createdAt:desc
```

---

## Population

### Populate Relations

**Single relation:**
```http
GET /api/jobs?populate=customer
```

**Multiple relations:**
```http
GET /api/jobs?populate[0]=customer&populate[1]=employee
```

**Deep population:**
```http
GET /api/jobs?populate[customer][populate][0]=jobs
```

**Populate all:**
```http
GET /api/jobs?populate=*
```

---

## Rate Limiting

**Limits:**
- Development: Unlimited
- Production: 100 requests per 15 minutes per IP

**Headers in Response:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

---

## Examples Using cURL

### Create Customer and Job

```bash
# 1. Create customer
CUSTOMER_RESPONSE=$(curl -X POST http://localhost:1337/api/customers \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "Name": "Test Customer",
      "Email": "test@example.com"
    }
  }')

# Extract customer ID
CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq '.data.id')

# 2. Create job for customer
curl -X POST http://localhost:1337/api/jobs \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d "{
    \"data\": {
      \"Status\": \"Pending Artwork\",
      \"Quantity\": 100,
      \"customer\": $CUSTOMER_ID
    }
  }"
```

---

## Next Steps

- Review [Integration Guide](integration-guide.md)
- See [Phase Implementation Guides](../phases/)

---

**API Reference Complete! ✅**
