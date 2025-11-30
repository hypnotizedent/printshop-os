# PrintShop OS - Business Services Stack

**Last Updated:** November 27, 2025  
**Status:** Ready for Deployment  
**Compose File:** `docker-compose.business-services.yml`

---

## Overview

The Business Services Stack provides self-hosted alternatives to common SaaS tools, reducing monthly costs and improving data ownership. These services integrate with the core PrintShop OS platform via n8n workflow automation.

### Cost Savings

| SaaS Alternative | Monthly Cost | Self-Hosted |
|------------------|--------------|-------------|
| QuickBooks/FreshBooks | $25-80/mo | Invoice Ninja: $0 |
| Zapier/Make | $20-100/mo | n8n: $0 |
| DocuSign + Cloud Storage | $25-50/mo | Paperless-ngx: $0 |
| Figma/Adobe XD | $15-50/mo | Penpot: $0 |
| 1Password Teams | $8/user/mo | Vaultwarden: $0 |
| **Total** | **$93-330/mo** | **$0** |

---

## Services

### 1. Invoice Ninja (Priority: HIGH)

**Purpose:** Handle payments, contracts, quotes, and invoicing

**Port:** 9000  
**URL:** http://localhost:9000  
**Docker Image:** `invoiceninja/invoiceninja:5`

#### Features
- Professional invoice generation and delivery
- Payment gateway integrations (Stripe, PayPal, etc.)
- Quote creation and approval workflows
- Recurring invoices and subscriptions
- Client portal for customers
- Contract and proposal management
- Expense tracking
- Time tracking and billable hours

#### Integration with PrintShop OS
- **Strapi Quote → Invoice Ninja**: When a quote is approved in Strapi, n8n creates a draft invoice
- **Payment Received → Strapi**: Webhook updates order status to "Paid" in Strapi
- **Customer Sync**: Customer records synchronized between systems

#### Setup
1. Access admin panel: http://localhost:9000/setup
2. Complete initial configuration wizard
3. Configure payment gateways (Settings → Payment Settings)
4. Set up email templates (Settings → Templates & Reminders)
5. Create API token for n8n integration (Settings → API Tokens)

#### Environment Variables
```bash
INVOICENINJA_APP_KEY=base64:xxxxx  # Generate with openssl rand -base64 32
INVOICENINJA_URL=http://localhost:9000
INVOICENINJA_DB_PASSWORD=secure_password
```

---

### 2. n8n (Priority: HIGH)

**Purpose:** Workflow automation between all services

**Port:** 5678  
**URL:** http://localhost:5678  
**Docker Image:** `n8nio/n8n:latest`

#### Features
- Visual workflow builder (no code required)
- 400+ pre-built integrations
- Custom JavaScript/Python code nodes
- Webhook triggers and responses
- Scheduled workflows (cron)
- Error handling and retry logic
- Execution history and debugging

#### Integration with PrintShop OS
- **Core Hub**: Connects all business services together
- **Strapi Webhooks**: Listens for content changes
- **Invoice Ninja Sync**: Bi-directional data flow
- **Email Automation**: SendGrid/SMTP integration
- **Social Media**: Auto-post order completions

#### Planned Workflows

1. **Quote to Invoice**
   - Trigger: Quote approved in Strapi
   - Actions: Create Invoice Ninja draft, notify sales

2. **Payment Confirmation**
   - Trigger: Invoice Ninja payment webhook
   - Actions: Update Strapi order, send receipt, notify production

3. **Document Processing**
   - Trigger: New file in Paperless-ngx
   - Actions: Tag document, link to order, notify team

4. **Order Completion**
   - Trigger: Job marked complete in Strapi
   - Actions: Generate invoice, email customer, post to social

#### Setup
1. Access: http://localhost:5678
2. Login with credentials from `.env`
3. Create first workflow
4. Configure credentials for:
   - Strapi (API Token)
   - Invoice Ninja (API Token)
   - SMTP (email)

#### Environment Variables
```bash
N8N_ENCRYPTION_KEY=xxxxx  # openssl rand -hex 32
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password
```

---

### 3. Paperless-ngx (Priority: MEDIUM)

**Purpose:** Document scanning, OCR, and management

**Port:** 8010  
**URL:** http://localhost:8010  
**Docker Image:** `ghcr.io/paperless-ngx/paperless-ngx:latest`

#### Features
- Automatic document ingestion (email, folder watch)
- OCR with full-text search
- Smart tagging and categorization
- Correspondent matching
- Document workflows
- Archive and retention policies
- Mobile-friendly interface

#### Document Types for PrintShop
- Purchase orders from customers
- Supplier invoices and packing slips
- Shipping labels and tracking documents
- Contracts and agreements
- Art approval forms
- Quality inspection reports

#### Integration with PrintShop OS
- **n8n Trigger**: New document uploaded
- **Auto-Tag**: Based on content analysis
- **Link to Orders**: Associate with Strapi orders
- **Searchable Archive**: All business documents

#### Setup
1. Access: http://localhost:8010
2. Login with admin credentials from `.env`
3. Configure mail consumer (optional)
4. Set up document correspondents
5. Create tags for document types

#### Environment Variables
```bash
PAPERLESS_SECRET_KEY=xxxxx  # openssl rand -hex 32
PAPERLESS_ADMIN_USER=admin
PAPERLESS_ADMIN_PASSWORD=secure_password
PAPERLESS_OCR_LANGUAGE=eng
```

---

### 4. Penpot (Priority: MEDIUM)

**Purpose:** Design collaboration and mockup creation

**Port:** 9001  
**URL:** http://localhost:9001  
**Docker Image:** `penpotapp/frontend:latest`, `penpotapp/backend:latest`

#### Features
- Vector graphics editor
- Real-time collaboration
- Design system management
- Component libraries
- Export to SVG, PNG, PDF
- Comments and annotations
- Version history
- Open-source and self-hosted

#### Use Cases for PrintShop
- Customer mockup collaboration
- Art approval workflows
- Design template library
- Brand asset management
- Social media graphics

#### Integration with PrintShop OS
- **Design Library**: Store reusable templates
- **Customer Sharing**: Share links for approval
- **Export to Strapi**: Save mockups to order records

#### Setup
1. Access: http://localhost:9001
2. Create admin account
3. Set up team workspace
4. Import brand assets
5. Create template library

#### Environment Variables
```bash
PENPOT_PUBLIC_URI=http://localhost:9001
PENPOT_DB_NAME=penpot
```

---

### 5. Vaultwarden (Priority: LOW)

**Purpose:** Secure team password and credential management

**Port:** 8222  
**URL:** http://localhost:8222  
**Docker Image:** `vaultwarden/server:latest`

#### Features
- Bitwarden-compatible server
- Password vault
- Secure notes
- Two-factor authentication
- Organizations and sharing
- Emergency access
- Secure file attachments

#### Credentials to Store
- Supplier API keys (S&S, SanMar, AS Colour)
- Payment gateway credentials
- Email service tokens
- Social media accounts
- Hosting and domain credentials
- Database passwords

#### Integration with PrintShop OS
- **Central Secrets Store**: All API keys in one place
- **Team Access**: Role-based credential sharing
- **Audit Log**: Track credential access

#### Setup
1. Access: http://localhost:8222
2. Create admin account
3. Enable admin panel with `VAULTWARDEN_ADMIN_TOKEN`
4. Set up organization for team
5. Import existing passwords

#### Environment Variables
```bash
VAULTWARDEN_ADMIN_TOKEN=xxxxx  # openssl rand -base64 48
VAULTWARDEN_DOMAIN=http://localhost:8222
```

---

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- PrintShop OS core services running (postgres, redis)

### 1. Create Required Databases

```bash
# Connect to PostgreSQL and create databases
docker exec -it printshop-postgres psql -U strapi -c "CREATE DATABASE n8n;"
docker exec -it printshop-postgres psql -U strapi -c "CREATE DATABASE paperless;"
docker exec -it printshop-postgres psql -U strapi -c "CREATE DATABASE penpot;"
```

### 2. Configure Environment

```bash
# Copy and edit environment file if not already done
cp .env.example .env

# Generate secure keys
echo "N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "PAPERLESS_SECRET_KEY=$(openssl rand -hex 32)"
echo "INVOICENINJA_APP_KEY=base64:$(openssl rand -base64 32)"
echo "VAULTWARDEN_ADMIN_TOKEN=$(openssl rand -base64 48)"
```

### 3. Start Services

```bash
# Ensure core services are running
docker compose up -d postgres redis

# Start business services
docker compose -f docker-compose.business-services.yml up -d

# Check status
docker compose -f docker-compose.business-services.yml ps

# View logs
docker compose -f docker-compose.business-services.yml logs -f
```

### 4. Access Services

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| Invoice Ninja | http://localhost:9000 | Setup wizard |
| n8n | http://localhost:5678 | From .env file |
| Paperless-ngx | http://localhost:8010 | From .env file |
| Penpot | http://localhost:9001 | Self-registration |
| Vaultwarden | http://localhost:8222 | Self-registration |

---

## Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| Invoice Ninja | 9000 | Invoicing/Payments |
| Invoice Ninja DB | 3306 | MariaDB (internal) |
| n8n | 5678 | Workflow Automation |
| Paperless-ngx | 8010 | Document Management |
| Penpot | 9001 | Design Collaboration |
| Penpot Backend | 6060 | API (internal) |
| Penpot Exporter | 6061 | Export (internal) |
| Vaultwarden | 8222 | Password Management |

---

## Backup Recommendations

### Critical Data Locations

| Service | Volume | Backup Priority |
|---------|--------|-----------------|
| Invoice Ninja | `invoiceninja_storage` | **CRITICAL** |
| Invoice Ninja DB | `invoiceninja_db_data` | **CRITICAL** |
| n8n | `n8n_data` | HIGH |
| Paperless-ngx | `paperless_data`, `paperless_media` | HIGH |
| Penpot | `penpot_assets` | MEDIUM |
| Vaultwarden | `vaultwarden_data` | **CRITICAL** |

### Backup Script Example

```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Stop services for consistent backup
docker-compose -f docker-compose.business-services.yml stop

# Backup volumes
for vol in invoiceninja_storage invoiceninja_db_data n8n_data paperless_data paperless_media penpot_assets vaultwarden_data; do
  docker run --rm -v printshop_${vol}:/data -v $BACKUP_DIR:/backup alpine \
    tar czf /backup/${vol}.tar.gz -C /data .
done

# Restart services
docker-compose -f docker-compose.business-services.yml start

echo "Backup complete: $BACKUP_DIR"
```

### Recommended Schedule
- **Daily**: Vaultwarden, Invoice Ninja DB
- **Weekly**: All services
- **Monthly**: Full system backup with verification

---

## Troubleshooting

### Common Issues

**Invoice Ninja not starting**
```bash
# Check if MariaDB is healthy
docker logs printshop-invoiceninja-db

# Verify APP_KEY is set correctly
docker exec printshop-invoiceninja php artisan config:cache
```

**n8n database connection failed**
```bash
# Verify n8n database exists
docker exec -it printshop-postgres psql -U strapi -c "\l"

# Check n8n logs
docker logs printshop-n8n
```

**Paperless-ngx OCR not working**
```bash
# Check OCR language pack
docker exec printshop-paperless python3 -m ocrmypdf --version

# Verify consume folder permissions
docker exec printshop-paperless ls -la /usr/src/paperless/consume
```

**Penpot connection issues**
```bash
# Check all Penpot containers are running
docker ps | grep penpot

# Verify database connection
docker logs printshop-penpot-backend
```

---

## Security Considerations

1. **Change all default passwords** in `.env` before deployment
2. **Generate unique encryption keys** for each service
3. **Enable HTTPS** in production (use Traefik)
4. **Limit network access** to internal network only
5. **Regular security updates** for all containers
6. **Enable 2FA** on Vaultwarden for all users
7. **Audit logs** - monitor access patterns

---

## Future Enhancements

- [ ] Traefik integration for SSL/TLS
- [ ] SSO integration (Authentik/Keycloak)
- [ ] Automated backup to S3/MinIO
- [ ] Monitoring dashboards (Grafana)
- [ ] Mobile apps configuration
- [ ] Advanced n8n workflow library

---

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture
- [SERVICE_DIRECTORY.md](../SERVICE_DIRECTORY.md) - Service locations
- [DEVELOPMENT_GUIDE.md](../DEVELOPMENT_GUIDE.md) - Development setup
- [ROADMAP.md](../ROADMAP.md) - Project roadmap (Phase 4: AI & Automation)
