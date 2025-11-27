# n8n Workflow Integration Guide

## Overview

PrintShop OS integrates with the [Zie619/n8n-workflows](https://github.com/Zie619/n8n-workflows) collection, providing **4,343+ ready-to-use automation workflows** across 15+ categories and 365+ integrations.

## Quick Start

### 1. Start n8n

```bash
# Using business services stack
docker-compose -f docker-compose.business-services.yml up -d n8n

# Or standalone
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

### 2. Access n8n UI

Open http://localhost:5678

Default credentials (change immediately):
- Username: admin
- Password: (set via N8N_BASIC_AUTH_PASSWORD)

### 3. Import PrintShop Workflows

```bash
cd services/n8n
./scripts/import-workflows.sh
```

## PrintShop-Specific Workflows

| Workflow | Trigger | Description | Integrations |
|----------|---------|-------------|--------------|
| **Quote to Invoice** | Webhook | Creates Invoice Ninja invoice when quote approved | Strapi, Invoice Ninja |
| **Payment Sync** | Schedule (5min) | Syncs payment status from Invoice Ninja to Strapi | Strapi, Invoice Ninja |
| **Customer Sync** | Schedule (hourly) | Bi-directional sync between EspoCRM and Strapi | Strapi, EspoCRM |
| **Order Notifications** | Webhook | Sends Slack/email on order status changes | Strapi, Slack, Email |
| **Document OCR** | Webhook | Extracts metadata from Paperless-ngx documents | Strapi, Paperless-ngx |

## Finding Workflows in the Collection

### Search the Database

```bash
# Search by keyword
python scripts/search-workflows.py "shopify order"

# Search by category
python scripts/search-workflows.py "email" --category "Communication"

# List all categories
python scripts/search-workflows.py --list-categories

# Show database statistics
python scripts/search-workflows.py --stats
```

### Browse Online

Visit https://zie619.github.io/n8n-workflows for a searchable web interface.

### Popular Categories

| Category | Count | Use Cases |
|----------|-------|-----------|
| Communication | 500+ | Email, Slack, SMS, Teams |
| Data Processing | 400+ | Transform, filter, aggregate |
| E-commerce | 300+ | Shopify, WooCommerce, orders |
| CRM | 200+ | Salesforce, HubSpot, EspoCRM |
| AI/Automation | 200+ | OpenAI, ChatGPT, Claude |
| Invoicing | 100+ | Invoice Ninja, Stripe, payments |

## Integration Points

### Strapi CMS (Central Data)

n8n connects to Strapi for all PrintShop data operations:

```javascript
// n8n HTTP Request node
URL: {{$env.STRAPI_URL}}/api/orders
Method: GET
Headers:
  Authorization: Bearer {{$credentials.strapiApiKey}}
```

**Webhook Setup:**

Add to Strapi lifecycle hooks (`src/api/order/content-types/order/lifecycles.ts`):

```typescript
export default {
  async afterUpdate(event) {
    const { result, params } = event;
    
    // Notify n8n of status change
    await fetch(`${process.env.N8N_WEBHOOK_URL}/webhook/order-status-changed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: result.id,
        newStatus: result.status,
        previousStatus: params.data.status
      })
    });
  }
};
```

### Invoice Ninja

n8n has native Invoice Ninja node support:

- **Credentials:** Settings → Credentials → Invoice Ninja
- **Operations:** Create invoice, get payments, update clients
- **Webhook:** Invoice Ninja → Settings → Webhooks → Add n8n URL

### EspoCRM

Connect via HTTP Request nodes:

```javascript
// EspoCRM API request
URL: {{$env.ESPOCRM_URL}}/api/v1/Contact
Method: GET
Headers:
  X-Api-Key: {{$credentials.espoCrmApiKey}}
```

### Paperless-ngx

Configure webhooks in Paperless:

1. Settings → Consumption → Post-consumption script
2. Or use the built-in webhook feature
3. Target URL: `http://n8n:5678/webhook/paperless-document-consumed`

### Milvus (Vector DB)

For AI-powered workflow search and design similarity:

```javascript
// Search similar designs
POST {{$env.MILVUS_URL}}/v1/vector/search
{
  "collection_name": "design_embeddings",
  "vector": [/* embedding from OpenAI */],
  "limit": 10
}
```

## Environment Variables

Add to your `.env`:

```env
# =============================================================================
# n8n Workflow Automation
# =============================================================================

# n8n Server
N8N_PORT=5678
N8N_HOST=0.0.0.0
N8N_PROTOCOL=http
N8N_WEBHOOK_URL=http://localhost:5678

# Authentication
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your-secure-password

# API Access
N8N_API_KEY=your-n8n-api-key

# Security
N8N_ENCRYPTION_KEY=your-32-char-encryption-key

# Webhook Secrets (for signing)
STRAPI_WEBHOOK_SECRET=your-strapi-webhook-secret

# =============================================================================
# Integration Service URLs
# =============================================================================
STRAPI_URL=http://strapi:1337
INVOICE_NINJA_URL=http://invoice-ninja:9000
ESPOCRM_URL=http://espocrm:8080
PAPERLESS_URL=http://paperless:8000
MILVUS_URL=http://milvus:19530
```

## Credential Configuration

### Required Credentials

Configure these in n8n UI (Settings → Credentials):

1. **Strapi API Key**
   - Type: Header Auth
   - Name: `Authorization`
   - Value: `Bearer your-strapi-api-token`

2. **Invoice Ninja API**
   - Type: Invoice Ninja API
   - URL: Your Invoice Ninja instance URL
   - API Token: Your API token

3. **EspoCRM API Key**
   - Type: Header Auth
   - Name: `X-Api-Key`
   - Value: Your EspoCRM API key

4. **Slack API**
   - Type: Slack API
   - Access Token: Your Slack Bot token
   - Or use OAuth2

5. **SMTP (Email)**
   - Type: SMTP
   - Host, port, username, password

6. **Paperless-ngx API Key**
   - Type: Header Auth
   - Name: `Authorization`
   - Value: `Token your-paperless-token`

## Workflow Patterns

### Webhook → Process → Update

Most PrintShop workflows follow this pattern:

```
1. Webhook receives event
2. Fetch additional data from source
3. Transform/process data
4. Update target system(s)
5. Send notifications
6. Respond to webhook
```

### Scheduled Sync

For bi-directional data sync:

```
1. Schedule trigger (cron)
2. Fetch updates from System A
3. Fetch updates from System B
4. Compare timestamps
5. Push newer records to older system
6. Log sync results
```

### Error Handling

Add error handling to production workflows:

```javascript
// n8n Error Trigger node
// Catch errors and send Slack notification

{
  "text": "⚠️ Workflow Error",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Workflow:* {{$workflow.name}}\n*Error:* {{$json.error.message}}"
      }
    }
  ]
}
```

## Backup & Version Control

### Export Workflows

```bash
# Export all workflows from n8n
./scripts/export-workflows.sh ./workflows/backup

# Commit to git
git add workflows/
git commit -m "Backup n8n workflows"
```

### Import After Restore

```bash
# Import from backup
./scripts/import-workflows.sh ./workflows/backup
```

### Best Practices

1. **Version control all workflows** - Export regularly
2. **Use environment variables** - Never hardcode URLs or credentials
3. **Document custom workflows** - Update README when adding
4. **Test in development** - Use n8n's test mode before production
5. **Monitor executions** - Check n8n execution history for failures

## Troubleshooting

### Webhook Not Receiving Data

1. Check n8n container networking
2. Verify webhook URL is accessible from source
3. Check n8n logs: `docker logs n8n`
4. Test with curl: `curl -X POST http://localhost:5678/webhook/test -d '{}'`

### Credential Errors

1. Verify credentials in n8n UI
2. Check API keys haven't expired
3. Test credentials independently

### Workflow Execution Failures

1. Check execution history in n8n
2. Review node-by-node execution data
3. Add debug nodes to inspect data flow
4. Check target API error responses

### Database Search Not Working

1. Verify submodule is initialized: `git submodule update --init`
2. Check database exists: `ls services/n8n-workflows/workflows.db`
3. Run stats to verify: `python scripts/search-workflows.py --stats`

## Related Resources

- [n8n Documentation](https://docs.n8n.io)
- [n8n Community](https://community.n8n.io)
- [Zie619/n8n-workflows](https://github.com/Zie619/n8n-workflows)
- [Invoice Ninja n8n Integration](https://docs.invoiceninja.com/integrations.html)
- [Strapi Webhooks](https://docs.strapi.io/dev-docs/backend-customization/webhooks)
