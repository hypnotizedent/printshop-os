# Component Architecture - PrintShop OS

## Introduction

This document provides detailed technical information about each component in the PrintShop OS ecosystem, including technology choices, rationale, integration points, and extensibility considerations.

## Component Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    COMPONENT STACK                           │
├──────────────────┬──────────────────────┬───────────────────┤
│    Botpress      │      Strapi          │     Appsmith      │
│   (Frontend)     │     (Backend)        │    (Frontend)     │
├──────────────────┼──────────────────────┼───────────────────┤
│ • Conversational │ • REST API           │ • Low-code UI     │
│ • NLU Engine     │ • ORM/Database       │ • Drag & Drop     │
│ • Flow Builder   │ • Authentication     │ • API Integration │
│ • Multi-channel  │ • Content Types      │ • JavaScript      │
└──────────────────┴──────────────────────┴───────────────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Infrastructure   │
                    ├────────────────────┤
                    │ • PostgreSQL       │
                    │ • Redis            │
                    │ • MongoDB          │
                    │ • Docker           │
                    └────────────────────┘
```

---

## 1. Strapi - Central API & Headless CMS

### Purpose and Role

Strapi serves as the **central nervous system** of PrintShop OS:
- Single source of truth for all business data
- RESTful API provider for all client applications
- Authentication and authorization manager
- Business logic orchestrator

### Technology Stack

**Core Framework:**
- **Strapi 4.x**: Modern Node.js headless CMS
- **Node.js 18+**: Runtime environment
- **Koa.js**: Web framework (Strapi's underlying framework)

**Database:**
- **PostgreSQL 15+**: Production database (ACID compliant, robust)
- **SQLite 3**: Development/testing database (lightweight, file-based)

**Additional Technologies:**
- **Bookshelf.js / Knex.js**: ORM and query builder
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing

### Why Strapi?

**Advantages:**
1. **Rapid Development**: Content-Type Builder for quick data modeling
2. **Auto-Generated APIs**: REST endpoints created automatically
3. **Extensibility**: Plugin system for custom functionality
4. **Admin Panel**: Built-in UI for data management
5. **Open Source**: MIT licensed, active community
6. **Well Documented**: Extensive official documentation
7. **Role-Based Access**: Granular permissions out of the box

**Alternatives Considered:**
- **Custom Node.js/Express**: More control but significantly longer development time
- **Directus**: Similar features but less mature ecosystem
- **Hasura**: GraphQL-first, learning curve for REST API team

### Architecture

```
┌────────────────────────────────────────────────────────┐
│                   STRAPI ARCHITECTURE                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │           Admin Panel (React)                │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐   │
│  │         REST API Layer                       │   │
│  │  • Authentication Middleware                 │   │
│  │  • Permission Checking                       │   │
│  │  • Request Validation                        │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐   │
│  │      Business Logic Layer                    │   │
│  │  • Controllers (Route handlers)              │   │
│  │  • Services (Business logic)                 │   │
│  │  • Policies (Custom checks)                  │   │
│  │  • Lifecycle Hooks (Events)                  │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐   │
│  │         Data Access Layer                    │   │
│  │  • Content Types (Models)                    │   │
│  │  • ORM (Bookshelf.js)                        │   │
│  │  • Query Builder (Knex.js)                   │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐   │
│  │           PostgreSQL Database                │   │
│  │  • Tables                                    │   │
│  │  • Indexes                                   │   │
│  │  • Constraints                               │   │
│  └──────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Data Models (Content Types)

#### Job Collection Type
```javascript
{
  "kind": "collectionType",
  "collectionName": "jobs",
  "info": {
    "singularName": "job",
    "pluralName": "jobs",
    "displayName": "Job"
  },
  "attributes": {
    "JobID": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "Status": {
      "type": "enumeration",
      "enum": ["Pending Artwork", "In Production", "Complete", "Archived"],
      "default": "Pending Artwork"
    },
    "MockupImageURL": {
      "type": "string"
    },
    "ArtFileURL": {
      "type": "string"
    },
    "InkColors": {
      "type": "json"
    },
    "ImprintLocations": {
      "type": "json"
    },
    "Quantity": {
      "type": "integer",
      "min": 1
    },
    "customer": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::customer.customer",
      "inversedBy": "jobs"
    }
  }
}
```

#### Customer Collection Type
```javascript
{
  "kind": "collectionType",
  "collectionName": "customers",
  "info": {
    "singularName": "customer",
    "pluralName": "customers",
    "displayName": "Customer"
  },
  "attributes": {
    "Name": {
      "type": "string",
      "required": true
    },
    "Email": {
      "type": "email",
      "required": true,
      "unique": true
    },
    "jobs": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::job.job",
      "mappedBy": "customer"
    }
  }
}
```

### Integration Points

**Incoming Connections:**
- Botpress: Creates customers and jobs
- Appsmith: Reads and updates jobs, manages time clock
- Future: Mobile apps, web portals, third-party integrations

**Outgoing Connections:**
- PostgreSQL: Data persistence
- Email services: Notifications (future)
- Cloud storage: File uploads (future)
- Payment gateways: Processing (future)

### Extensibility

**Plugin System:**
Strapi supports custom plugins for extending functionality:
```javascript
// Future plugin example: Email notifications
module.exports = {
  async sendJobNotification(jobId) {
    const job = await strapi.entityService.findOne('api::job.job', jobId, {
      populate: ['customer']
    });
    
    await strapi.plugin('email').service('email').send({
      to: job.customer.Email,
      subject: `Job ${job.JobID} Status Update`,
      text: `Your job status is now: ${job.Status}`
    });
  }
};
```

**Custom Endpoints:**
```javascript
// Custom route: /api/jobs/statistics
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/jobs/statistics',
      handler: 'job.statistics',
    }
  ]
};

// Controller
module.exports = {
  async statistics(ctx) {
    const stats = await strapi.db.query('api::job.job').findMany({
      select: ['Status'],
      groupBy: ['Status']
    });
    
    ctx.body = stats;
  }
};
```

---

## 2. Appsmith - Internal Production Dashboard

### Purpose and Role

Appsmith provides a **mobile-optimized production interface** for:
- Viewing job queue and details
- Updating job status
- Time clock management
- Real-time production monitoring

### Technology Stack

**Platform:**
- **Appsmith CE**: Open-source low-code platform
- **React**: Frontend framework (underlying)
- **MongoDB**: Application metadata storage
- **Redis**: Session and cache management

**Client-Side:**
- **JavaScript**: Custom business logic
- **Lodash**: Utility functions
- **Moment.js**: Date/time manipulation

### Why Appsmith?

**Advantages:**
1. **Rapid UI Development**: Drag-and-drop interface builder
2. **Mobile Responsive**: Built-in mobile optimization
3. **API Integration**: Easy REST API connection
4. **JavaScript Support**: Custom logic when needed
5. **Version Control**: Git-based app versioning
6. **Self-Hosted**: Full control over deployment
7. **No Vendor Lock-in**: Export application JSON

**Alternatives Considered:**
- **Retool**: Similar features, more expensive, less open
- **Budibase**: Newer platform, smaller community
- **Custom React App**: Full control but 10x development time

### Architecture

```
┌────────────────────────────────────────────────────────┐
│              APPSMITH ARCHITECTURE                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │         User Interface (Browser)             │   │
│  │  • Pages and Widgets                         │   │
│  │  • Forms and Tables                          │   │
│  │  • Buttons and Actions                       │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐   │
│  │      Application Logic Layer                 │   │
│  │  • JavaScript Functions                      │   │
│  │  • Data Transformations                      │   │
│  │  • Event Handlers                            │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐   │
│  │         Datasource Layer                     │   │
│  │  • REST API Queries                          │   │
│  │  • GraphQL Queries (if used)                 │   │
│  │  • Database Connections                      │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│                      ▼                              │
│            External APIs (Strapi)                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Key Pages and Workflows

#### 1. Job List Page
**Purpose:** Display all jobs in production status

**Widgets:**
- **Table Widget**: Shows job list with columns
  - JobID
  - Customer Name
  - Quantity
  - Mockup Image (thumbnail)
  - Actions (View Details button)

**Datasource Query:**
```javascript
{
  "url": "{{appsmith.store.STRAPI_URL}}/api/jobs",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer {{appsmith.store.API_TOKEN}}"
  },
  "params": {
    "filters[Status][$eq]": "In Production",
    "populate": "customer",
    "sort": "createdAt:desc"
  }
}
```

#### 2. Job Details Page
**Purpose:** Display full job information and enable status updates

**Widgets:**
- **Image Widget**: Mockup image
- **Text Widgets**: Job details (colors, locations, quantity)
- **Button Widget**: "Mark as Complete"
- **Link Widget**: Art file download

**Update Query:**
```javascript
{
  "url": "{{appsmith.store.STRAPI_URL}}/api/jobs/{{Table1.selectedRow.id}}",
  "method": "PUT",
  "headers": {
    "Authorization": "Bearer {{appsmith.store.API_TOKEN}}",
    "Content-Type": "application/json"
  },
  "body": {
    "data": {
      "Status": "Complete"
    }
  }
}
```

#### 3. Time Clock Page
**Purpose:** Employee time tracking

**Widgets:**
- **Select Widget**: Employee selection
- **Button Widget**: "Clock In"
- **Button Widget**: "Clock Out"
- **Text Widget**: Current time display

**Clock In Query:**
```javascript
{
  "url": "{{appsmith.store.STRAPI_URL}}/api/time-clock-entries",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {{appsmith.store.API_TOKEN}}",
    "Content-Type": "application/json"
  },
  "body": {
    "data": {
      "Timestamp": "{{moment().toISOString()}}",
      "EntryType": "Clock In",
      "employee": "{{EmployeeSelect.selectedOptionValue}}"
    }
  }
}
```

### Integration Points

**Incoming Connections:**
- Production team: Mobile browsers
- Management: Desktop browsers

**Outgoing Connections:**
- Strapi API: All data operations
- MongoDB: App metadata and user data
- Redis: Session management

### Mobile Optimization

**Responsive Design:**
- Flexbox-based layouts
- Touch-friendly button sizes (minimum 44x44 pixels)
- Simplified navigation
- Swipe gestures support

**Performance:**
- Lazy loading for images
- Pagination for large datasets
- Optimistic UI updates
- Offline capability (future)

---

## 3. Botpress - Customer Order Intake

### Purpose and Role

Botpress provides **conversational AI** for:
- Automated customer order collection
- 24/7 availability
- Multi-channel deployment (web, mobile, messaging apps)
- Natural language understanding

### Technology Stack

**Platform:**
- **Botpress 12.x**: Open-source conversational AI
- **NLU Engine**: Natural language understanding
- **PostgreSQL**: Bot data storage

**Conversation Management:**
- **Flow Editor**: Visual conversation designer
- **Hooks**: Pre/post-action logic in JavaScript
- **Actions**: Custom JavaScript actions
- **Content Types**: Reusable message templates

### Why Botpress?

**Advantages:**
1. **Visual Flow Editor**: Easy conversation design
2. **NLU Built-in**: Intent and entity recognition
3. **Multi-channel**: Deploy to web, mobile, WhatsApp, Telegram, etc.
4. **Open Source**: Full customization capability
5. **On-Premise**: Data stays in your infrastructure
6. **API Actions**: Easy integration with external systems
7. **Analytics**: Built-in conversation analytics

**Alternatives Considered:**
- **Dialogflow**: Google-hosted, data privacy concerns
- **Rasa**: More complex, steeper learning curve
- **Custom Chatbot**: Time-consuming, reinventing the wheel

### Architecture

```
┌────────────────────────────────────────────────────────┐
│             BOTPRESS ARCHITECTURE                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │         Conversation Interface               │   │
│  │  • Web Widget                                │   │
│  │  • Mobile App                                │   │
│  │  • Messaging Channels                        │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐   │
│  │            NLU Engine                        │   │
│  │  • Intent Recognition                        │   │
│  │  • Entity Extraction                         │   │
│  │  • Language Detection                        │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐   │
│  │          Dialog Manager                      │   │
│  │  • Flow Execution                            │   │
│  │  • State Management                          │   │
│  │  • Variable Storage                          │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│  ┌───────────────────▼──────────────────────────┐   │
│  │          Action Layer                        │   │
│  │  • Custom JavaScript Actions                 │   │
│  │  • API Calls to Strapi                       │   │
│  │  • Data Processing                           │   │
│  └───────────────────┬──────────────────────────┘   │
│                      │                              │
│                      ▼                              │
│            External APIs (Strapi)                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Conversation Flow

#### Order Intake Flow
```
Start
  ↓
Greeting: "Welcome to PrintShop! Let's create your order."
  ↓
Ask Name: "What's your name?"
  ↓
Capture: {{user.name}}
  ↓
Ask Email: "What's your email address?"
  ↓
Capture: {{user.email}}
  ↓
Ask Quantity: "How many items do you need?"
  ↓
Capture: {{user.quantity}}
  ↓
Confirm: "Got it! Name: {{user.name}}, Email: {{user.email}}, Quantity: {{user.quantity}}"
  ↓
Action: Create Customer & Job in Strapi
  ↓
Success: "Your order {{job.JobID}} has been created! We'll contact you for artwork."
  ↓
End
```

### Custom Actions

#### Create Order Action
```javascript
/**
 * Creates a customer and job in Strapi
 * @title Create Order in Strapi
 */
const createOrder = async () => {
  const { name, email, quantity } = temp;
  const STRAPI_URL = process.env.STRAPI_URL;
  const API_TOKEN = process.env.STRAPI_API_TOKEN;
  
  try {
    // Step 1: Check if customer exists
    const customersResponse = await axios.get(
      `${STRAPI_URL}/api/customers?filters[Email][$eq]=${email}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` }
      }
    );
    
    let customerId;
    
    if (customersResponse.data.data.length > 0) {
      // Customer exists
      customerId = customersResponse.data.data[0].id;
    } else {
      // Create new customer
      const createCustomerResponse = await axios.post(
        `${STRAPI_URL}/api/customers`,
        {
          data: {
            Name: name,
            Email: email
          }
        },
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      customerId = createCustomerResponse.data.data.id;
    }
    
    // Step 2: Create job
    const createJobResponse = await axios.post(
      `${STRAPI_URL}/api/jobs`,
      {
        data: {
          Status: 'Pending Artwork',
          Quantity: parseInt(quantity),
          customer: customerId
        }
      },
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Store job info in conversation
    temp.jobId = createJobResponse.data.data.attributes.JobID;
    
  } catch (error) {
    bp.logger.error('Error creating order:', error);
    temp.error = 'Failed to create order. Please try again.';
  }
};

return createOrder();
```

### Integration Points

**Incoming Connections:**
- Customers: Web chat widget
- Customers: Mobile app (future)
- Customers: WhatsApp, Telegram (future)

**Outgoing Connections:**
- Strapi API: Customer and job creation
- Email service: Confirmation emails (future)
- SMS service: Order notifications (future)

### Extensibility

**Multi-Language Support:**
```javascript
// Language detection and switching
const userLanguage = event.nlu.language;
if (userLanguage === 'es') {
  bp.dialog.jumpTo('flows/order-intake-spanish.flow.json');
}
```

**Advanced NLU:**
```javascript
// Custom entity extraction
const extractQuantity = (text) => {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0]) : null;
};
```

---

## Infrastructure Components

### PostgreSQL Database

**Purpose:** Primary data store for all business data

**Configuration:**
- Version: PostgreSQL 15+
- Connection Pool: 20-50 connections
- Backup Schedule: Daily full backup, hourly incremental
- Replication: Read replica for reporting (future)

### Redis

**Purpose:** Caching and session management

**Use Cases:**
- Session storage for Appsmith
- API response caching
- Rate limiting counters
- Real-time pub/sub (future)

### MongoDB

**Purpose:** Appsmith application metadata

**Use Cases:**
- Application definitions
- User preferences
- Datasource configurations
- Page layouts

### Docker

**Purpose:** Container orchestration

**Benefits:**
- Consistent environments
- Easy deployment
- Resource isolation
- Scalability

---

## Component Communication Patterns

### Synchronous REST API Calls
```
Appsmith → HTTP GET → Strapi → Query DB → Return JSON → Appsmith
```

### Asynchronous Webhooks (Future)
```
Strapi → Event Trigger → Webhook POST → External Service → Acknowledge
```

### Event-Driven Architecture (Future)
```
Action → Event Bus → Multiple Subscribers → Parallel Processing
```

---

## Future Extensions

### Additional Components (Roadmap)

1. **Finance Module**
   - Invoicing system
   - Payment processing
   - Accounting integration

2. **Marketing Module**
   - Email campaigns
   - Customer analytics
   - Automated follow-ups

3. **Sales CRM**
   - Lead management
   - Quote generation
   - Pipeline tracking

4. **Mobile Apps**
   - Native iOS app (React Native)
   - Native Android app (React Native)
   - Shared codebase with web

---

## Conclusion

Each component is carefully chosen for:
- **Rapid development**: Minimize time to MVP
- **Scalability**: Grow with business needs
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Easy to add new features
- **Cost-effectiveness**: Open-source where possible

The architecture supports the 60-day MVP timeline while providing a solid foundation for future growth.

---

**Related Documentation:**
- [System Overview](system-overview.md)
- [Data Flow](data-flow.md)
- [Phase Implementation Guides](../phases/)
