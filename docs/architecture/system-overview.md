# System Overview - PrintShop OS Architecture

## Introduction

PrintShop OS is a comprehensive, mission-critical business operating system designed specifically for apparel print shops. This document provides a high-level overview of the system architecture, component interactions, and design principles that guide the platform's development.

## Architecture Philosophy

### Design Principles

1. **Separation of Concerns**: Each component has a distinct responsibility
2. **API-First Design**: All data flows through well-defined REST APIs
3. **Scalability**: Built to grow from single-server to multi-server deployments
4. **Disaster Recovery**: Data persistence and backup strategies at every layer
5. **Real-time Operations**: Immediate data synchronization across all components
6. **Mobile-First**: Production interfaces optimized for mobile devices
7. **AI-Friendly**: Clear documentation for AI/ML agent integration

### Microservices Architecture

PrintShop OS follows a microservices architecture pattern where three main components communicate through RESTful APIs with a centralized data store.

```
┌──────────────────────────────────────────────────────────────┐
│                     SYSTEM ARCHITECTURE                       │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├──────────────────┬──────────────────────┬──────────────────┤
│    Botpress      │      Appsmith        │   Future Web UI   │
│  (Customer UI)   │   (Internal UI)      │   (Public Site)   │
└────────┬─────────┴──────────┬───────────┴──────────┬────────┘
         │                    │                      │
         └────────────────────┼──────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   API GATEWAY      │
                    │  (Optional/Future) │
                    └─────────┬──────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
┌────────▼─────────┐ ┌────────▼────────┐ ┌────────▼─────────┐
│  STRAPI API      │ │  STRAPI API     │ │  STRAPI API      │
│  (Jobs)          │ │  (Customers)    │ │  (Employees)     │
└────────┬─────────┘ └────────┬────────┘ └────────┬─────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   DATA LAYER       │
                    ├────────────────────┤
                    │   PostgreSQL       │
                    │   - Jobs           │
                    │   - Customers      │
                    │   - Employees      │
                    │   - TimeClockEntry │
                    └────────────────────┘
```

## System Components

### 1. Strapi (Central Hub)

**Role:** Central data repository and API provider

**Responsibilities:**
- Data model definition and management
- RESTful API exposure
- Authentication and authorization
- Data validation and business logic
- Database abstraction layer
- File storage management (images, documents)

**Technology Stack:**
- Node.js runtime
- Strapi 4.x framework
- PostgreSQL database
- SQLite (development mode)

**Key Features:**
- Content-Type Builder for data modeling
- Role-Based Access Control (RBAC)
- API token management
- Webhook support for event-driven actions
- Admin panel for data management

### 2. Appsmith (Internal Dashboard)

**Role:** Production team interface

**Responsibilities:**
- Display job queue and details
- Enable status updates
- Time clock functionality
- Mobile-optimized interface
- Real-time data display

**Technology Stack:**
- Appsmith low-code platform
- MongoDB for application data
- Redis for session management

**Key Features:**
- Drag-and-drop UI builder
- API datasource integration
- JavaScript-based logic
- Mobile responsive design
- Real-time data binding

### 3. Botpress (Customer Interface)

**Role:** Customer-facing order intake automation

**Responsibilities:**
- Conversational order collection
- Customer information gathering
- Order submission to Strapi
- Basic customer support
- Multi-channel deployment (web, mobile, messaging apps)

**Technology Stack:**
- Botpress conversational AI platform
- Natural Language Understanding (NLU)
- Flow-based conversation design

**Key Features:**
- Visual flow editor
- Variable management
- API action execution
- Multi-language support
- Analytics and insights

## Component Interaction Flow

### Order Intake Flow

```
Customer → Botpress → Strapi API → PostgreSQL
   ↓                                    ↓
Conversation                        Job Created
   ↓                                    ↓
Order Details                    Status: "Pending Artwork"
```

**Step-by-step:**
1. Customer initiates conversation with Botpress
2. Botpress collects: Name, Email, Quantity
3. Botpress calls Strapi API to create/find Customer record
4. Botpress calls Strapi API to create Job record
5. Job is created with status "Pending Artwork"
6. Customer receives confirmation

### Production Management Flow

```
Appsmith → Strapi API → PostgreSQL
   ↓            ↓             ↓
View Jobs   Fetch Data    Read Jobs
   ↓            ↓             ↓
Update Job  Post Update  Update Job
   ↓            ↓             ↓
Refresh     Return Data   Updated
```

**Step-by-step:**
1. Production team opens Appsmith dashboard
2. Appsmith queries Strapi API for jobs with status "In Production"
3. User selects a job to view details
4. User marks job as "Complete"
5. Appsmith sends update request to Strapi API
6. Strapi updates PostgreSQL database
7. Dashboard refreshes with updated data

### Time Clock Flow

```
Employee → Appsmith → Strapi API → PostgreSQL
   ↓          ↓           ↓             ↓
Clock In  Button    Create Entry  TimeClockEntry
   ↓          ↓           ↓             ↓
[Working] Timer     Timestamp    Employee Link
   ↓          ↓           ↓             ↓
Clock Out Button    Create Entry  TimeClockEntry
```

## Data Synchronization

### Real-time Updates

- **Appsmith**: Polls Strapi API at configurable intervals (default: 5 seconds)
- **Botpress**: Makes synchronous API calls on customer actions
- **Future**: WebSocket implementation for true real-time updates

### Data Consistency

- **Single Source of Truth**: All data stored in PostgreSQL via Strapi
- **API-Mediated Access**: No direct database access from components
- **Transaction Support**: Database transactions for multi-step operations
- **Validation**: Server-side validation in Strapi for all data operations

## Scalability Considerations

### Horizontal Scaling

**Current State (MVP):**
- Single server deployment
- All components on one Docker host

**Future Scalability:**
- Multiple Strapi instances behind load balancer
- Database read replicas for query performance
- Redis caching for frequently accessed data
- CDN for static assets (images, files)

### Vertical Scaling

**Resource Allocation:**
- PostgreSQL: 2-4 GB RAM minimum
- Strapi: 1-2 GB RAM per instance
- Appsmith: 2 GB RAM minimum
- Botpress: 1-2 GB RAM minimum
- Redis: 512 MB RAM minimum
- MongoDB: 1 GB RAM minimum

### Performance Optimization

1. **Database Indexing**: Proper indexes on frequently queried fields
2. **API Pagination**: Limit large result sets
3. **Caching Strategy**: Redis for session and frequently accessed data
4. **Image Optimization**: Thumbnail generation and CDN delivery
5. **Query Optimization**: Efficient Strapi queries with selective field loading

## High Availability Architecture (Future)

```
┌──────────────────────────────────────────────────────┐
│                   Load Balancer                      │
└────────────┬─────────────────────┬───────────────────┘
             │                     │
    ┌────────▼────────┐   ┌────────▼────────┐
    │  Strapi Node 1  │   │  Strapi Node 2  │
    └────────┬────────┘   └────────┬────────┘
             │                     │
    ┌────────▼─────────────────────▼────────┐
    │         PostgreSQL Primary            │
    └────────┬─────────────────────────────┘
             │
    ┌────────▼────────┐
    │  PostgreSQL     │
    │  Read Replica   │
    └─────────────────┘
```

## Security Architecture

### Authentication & Authorization

- **Strapi Admin**: Email/password authentication, JWT tokens
- **API Access**: API tokens with granular permissions
- **Role-Based Access**: Different permission sets for different user types

### Data Security

- **Transport Layer**: HTTPS/TLS for all API communications (production)
- **Data at Rest**: Database encryption support
- **Secrets Management**: Environment variables, never hardcoded
- **API Rate Limiting**: Prevent abuse and DDoS attacks

### Network Security

- **Firewall Rules**: Restrict access to internal services
- **VPN Access**: Optional VPN for admin interfaces
- **Service Isolation**: Each component in separate container/network segment

## Disaster Recovery Architecture

### Backup Strategy

1. **Database Backups**:
   - Automated daily PostgreSQL dumps
   - Point-in-time recovery capability
   - Off-site backup storage

2. **Application Backups**:
   - Strapi configuration and customizations
   - Appsmith application exports
   - Botpress flow definitions

3. **File Storage Backups**:
   - Uploaded images and documents
   - Synchronized to cloud storage

### Recovery Procedures

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours
- **Automated restore scripts**: One-command recovery
- **Regular DR testing**: Quarterly recovery drills

See [Disaster Recovery Guide](../deployment/disaster-recovery.md) for detailed procedures.

## Monitoring & Observability

### Health Checks

- **Container Health**: Docker health checks for all services
- **API Health**: Dedicated health endpoints
- **Database Health**: Connection pool monitoring

### Logging

- **Application Logs**: Structured JSON logging
- **Access Logs**: API request/response logging
- **Error Tracking**: Centralized error aggregation (future: Sentry)

### Metrics (Future)

- **System Metrics**: CPU, memory, disk usage
- **Application Metrics**: Request rates, response times
- **Business Metrics**: Jobs processed, customers served

## Integration Points

### Current Integrations

1. **Botpress → Strapi**: REST API for order creation
2. **Appsmith → Strapi**: REST API for job management

### Future Integrations

1. **Payment Gateway**: Stripe, Square, or PayPal
2. **Email Service**: SendGrid or Mailgun for notifications
3. **SMS Service**: Twilio for customer updates
4. **Accounting Software**: QuickBooks integration
5. **Shipping APIs**: FedEx, UPS, USPS tracking
6. **Design Tools**: Adobe Creative Cloud integration

## Development vs Production Architecture

### Development Environment

- Single Docker Compose file
- SQLite database option
- All services on `localhost`
- Minimal resource allocation
- Hot reload enabled

### Production Environment

- Multi-server deployment
- PostgreSQL with replication
- Separate domains/subdomains
- Production-grade resources
- SSL/TLS certificates
- Load balancing
- Monitoring and alerting

## Conclusion

This architecture is designed to start simple (single-server MVP) while providing a clear path to enterprise-scale deployment. The API-first, microservices approach ensures that each component can be independently scaled, updated, and maintained without affecting the entire system.

The centralized data model in Strapi ensures data consistency, while the component-based architecture allows for flexible deployment and future expansion with additional modules (Finance, Marketing, Sales, etc.).

---

**Next Steps:**
- Review [Data Flow Documentation](data-flow.md)
- Review [Component Architecture](component-architecture.md)
- Review [Implementation Phases](../phases/)
