# n8n Printavo Archive Workflows

> **Purpose**: n8n workflow templates for accessing archived Printavo data  
> **Last Updated**: December 2025  
> **n8n Version**: Compatible with v1.0+

---

## Overview

This document provides ready-to-use n8n workflows for querying and processing archived Printavo data stored in MinIO. These workflows enable automated data access, customer analytics, and integration with other systems.

**Use Cases**:
- Query orders by customer
- Search by date range
- Get artwork files for orders
- Customer analytics and reporting
- LLM/AI integration for data analysis
- Automated report generation

---

## Prerequisites

### 1. Setup MinIO Credentials in n8n

1. Open n8n at `http://docker-host:5678`
2. Navigate to **Settings** → **Credentials**
3. Click **Add Credential**
4. Select **S3** credential type
5. Configure with these settings:

```
Name: MinIO PrintShop
Access Key ID: minioadmin
Secret Access Key: [your-secret-key]
Region: us-east-1
Custom S3 Endpoint: http://docker-host:9000
Force Path Style: Yes (checked)
```

6. Click **Save**

### 2. Test Connection

Create a simple test workflow:

```json
{
  "nodes": [
    {
      "name": "List Buckets",
      "type": "n8n-nodes-base.awsS3",
      "parameters": {
        "operation": "listBuckets"
      },
      "credentials": {
        "s3": "MinIO PrintShop"
      }
    }
  ]
}
```

**Expected Output**: List including `printshop` bucket.

---

## Workflow Templates

### 1. Get Latest Orders Export

Download the most recent orders JSON file.

```json
{
  "name": "Get Latest Orders",
  "nodes": [
    {
      "name": "Start",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [250, 300]
    },
    {
      "name": "List Export Directories",
      "type": "n8n-nodes-base.awsS3",
      "parameters": {
        "operation": "list",
        "bucketName": "printshop",
        "prefix": "printavo-archive/exports/",
        "options": {
          "delimiter": "/"
        }
      },
      "credentials": {
        "s3": "MinIO PrintShop"
      },
      "position": [450, 300]
    },
    {
      "name": "Get Latest Directory",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Sort directories by timestamp (newest first)\nconst dirs = $input.all().map(item => item.json.Name).filter(n => n.includes('2025'));\ndirs.sort().reverse();\n\nreturn [{ json: { latestDir: dirs[0] } }];"
      },
      "position": [650, 300]
    },
    {
      "name": "Download Orders JSON",
      "type": "n8n-nodes-base.awsS3",
      "parameters": {
        "operation": "download",
        "bucketName": "printshop",
        "fileKey": "={{ $json.latestDir }}orders.json"
      },
      "credentials": {
        "s3": "MinIO PrintShop"
      },
      "position": [850, 300]
    },
    {
      "name": "Parse JSON",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const orders = JSON.parse($binary.data.toString());\nreturn orders.map(o => ({ json: o }));"
      },
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Start": {
      "main": [[{ "node": "List Export Directories", "type": "main", "index": 0 }]]
    },
    "List Export Directories": {
      "main": [[{ "node": "Get Latest Directory", "type": "main", "index": 0 }]]
    },
    "Get Latest Directory": {
      "main": [[{ "node": "Download Orders JSON", "type": "main", "index": 0 }]]
    },
    "Download Orders JSON": {
      "main": [[{ "node": "Parse JSON", "type": "main", "index": 0 }]]
    }
  }
}
```

**Output**: Array of all order objects.

---

### 2. Query Orders by Customer

Search for all orders from a specific customer.

```json
{
  "name": "Query Orders by Customer",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "query-customer-orders",
        "httpMethod": "GET",
        "responseMode": "onReceived"
      },
      "position": [250, 300]
    },
    {
      "name": "Download Orders",
      "type": "n8n-nodes-base.awsS3",
      "parameters": {
        "operation": "download",
        "bucketName": "printshop",
        "fileKey": "printavo-archive/exports/2025-12-03_14-30-00/orders.json"
      },
      "credentials": {
        "s3": "MinIO PrintShop"
      },
      "position": [450, 300]
    },
    {
      "name": "Filter by Customer",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const customerName = $input.first().json.query.customer;\nconst orders = JSON.parse($binary.data.toString());\n\nconst filtered = orders.filter(o => \n  o.customer?.company?.toLowerCase().includes(customerName.toLowerCase()) ||\n  o.customer?.email?.toLowerCase().includes(customerName.toLowerCase())\n);\n\nreturn filtered.map(o => ({ json: o }));"
      },
      "position": [650, 300]
    },
    {
      "name": "Return Results",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      },
      "position": [850, 300]
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [[{ "node": "Download Orders", "type": "main", "index": 0 }]]
    },
    "Download Orders": {
      "main": [[{ "node": "Filter by Customer", "type": "main", "index": 0 }]]
    },
    "Filter by Customer": {
      "main": [[{ "node": "Return Results", "type": "main", "index": 0 }]]
    }
  }
}
```

**Usage**:
```bash
curl "http://n8n-host:5678/webhook/query-customer-orders?customer=ABC%20Corp"
```

**Output**: JSON array of matching orders.

---

### 3. Get Artwork for Order

Retrieve all artwork files for a specific order.

```json
{
  "name": "Get Order Artwork",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "get-order-artwork",
        "httpMethod": "GET"
      },
      "position": [250, 300]
    },
    {
      "name": "Download Artwork Index",
      "type": "n8n-nodes-base.awsS3",
      "parameters": {
        "operation": "download",
        "bucketName": "printshop",
        "fileKey": "printavo-archive/index/artwork_index.json"
      },
      "credentials": {
        "s3": "MinIO PrintShop"
      },
      "position": [450, 300]
    },
    {
      "name": "Find Order Artwork",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const visualId = $input.first().json.query.visualId;\nconst index = JSON.parse($binary.data.toString());\n\nconst orderArtwork = index.filter(a => a.visualId === visualId);\n\nreturn orderArtwork.map(a => ({ json: a }));"
      },
      "position": [650, 300]
    },
    {
      "name": "Generate Presigned URLs",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const AWS = require('aws-sdk');\n\nconst s3 = new AWS.S3({\n  endpoint: 'http://docker-host:9000',\n  accessKeyId: 'minioadmin',\n  secretAccessKey: 'your-secret-key',\n  s3ForcePathStyle: true,\n  signatureVersion: 'v4'\n});\n\nconst items = [];\n\nfor (const item of $input.all()) {\n  const url = s3.getSignedUrl('getObject', {\n    Bucket: 'printshop',\n    Key: item.json.filePath,\n    Expires: 3600  // 1 hour\n  });\n  \n  items.push({\n    json: {\n      ...item.json,\n      downloadUrl: url\n    }\n  });\n}\n\nreturn items;"
      },
      "position": [850, 300]
    },
    {
      "name": "Return URLs",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json"
      },
      "position": [1050, 300]
    }
  ]
}
```

**Usage**:
```bash
curl "http://n8n-host:5678/webhook/get-order-artwork?visualId=12345"
```

**Output**:
```json
[
  {
    "filename": "artwork_0.png",
    "filePath": "printavo-archive/artwork/...",
    "downloadUrl": "http://docker-host:9000/printshop/...?X-Amz-..."
  }
]
```

---

### 4. Search Orders by Date Range

Find all orders within a specific date range.

```json
{
  "name": "Search Orders by Date",
  "nodes": [
    {
      "name": "HTTP Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "search-orders-date",
        "httpMethod": "POST"
      },
      "position": [250, 300]
    },
    {
      "name": "Download Orders",
      "type": "n8n-nodes-base.awsS3",
      "parameters": {
        "operation": "download",
        "bucketName": "printshop",
        "fileKey": "printavo-archive/exports/2025-12-03_14-30-00/orders.json"
      },
      "credentials": {
        "s3": "MinIO PrintShop"
      },
      "position": [450, 300]
    },
    {
      "name": "Filter by Date Range",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const { startDate, endDate } = $input.first().json.body;\nconst orders = JSON.parse($binary.data.toString());\n\nconst start = new Date(startDate);\nconst end = new Date(endDate);\n\nconst filtered = orders.filter(o => {\n  const orderDate = new Date(o.createdAt);\n  return orderDate >= start && orderDate <= end;\n});\n\nreturn filtered.map(o => ({ json: o }));"
      },
      "position": [650, 300]
    },
    {
      "name": "Calculate Totals",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const orders = $input.all();\nconst totalRevenue = orders.reduce((sum, o) => sum + (o.json.total || 0), 0);\nconst avgOrderValue = totalRevenue / orders.length;\n\nreturn [{\n  json: {\n    count: orders.length,\n    totalRevenue,\n    avgOrderValue,\n    orders: orders.map(o => o.json)\n  }\n}];"
      },
      "position": [850, 300]
    },
    {
      "name": "Return Summary",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1050, 300]
    }
  ]
}
```

**Usage**:
```bash
curl -X POST http://n8n-host:5678/webhook/search-orders-date \
  -H "Content-Type: application/json" \
  -d '{"startDate": "2025-01-01", "endDate": "2025-12-31"}'
```

---

### 5. Customer Analytics

Generate customer lifetime value and order history.

```json
{
  "name": "Customer Analytics",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "customer-analytics",
        "httpMethod": "GET"
      },
      "position": [250, 300]
    },
    {
      "name": "Download Orders",
      "type": "n8n-nodes-base.awsS3",
      "parameters": {
        "operation": "download",
        "bucketName": "printshop",
        "fileKey": "printavo-archive/exports/2025-12-03_14-30-00/orders.json"
      },
      "credentials": {
        "s3": "MinIO PrintShop"
      },
      "position": [450, 300]
    },
    {
      "name": "Download Customers",
      "type": "n8n-nodes-base.awsS3",
      "parameters": {
        "operation": "download",
        "bucketName": "printshop",
        "fileKey": "printavo-archive/exports/2025-12-03_14-30-00/customers.json"
      },
      "credentials": {
        "s3": "MinIO PrintShop"
      },
      "position": [450, 450]
    },
    {
      "name": "Calculate Customer Metrics",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const orders = JSON.parse($input.first().json.binary.data.toString());\nconst customers = JSON.parse($input.all()[1].json.binary.data.toString());\n\n// Group orders by customer\nconst customerOrders = {};\norders.forEach(o => {\n  const customerId = o.customer?.id;\n  if (!customerId) return;\n  \n  if (!customerOrders[customerId]) {\n    customerOrders[customerId] = [];\n  }\n  customerOrders[customerId].push(o);\n});\n\n// Calculate metrics\nconst analytics = customers.map(c => {\n  const orders = customerOrders[c.id] || [];\n  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);\n  const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;\n  const lastOrder = orders.sort((a, b) => \n    new Date(b.createdAt) - new Date(a.createdAt)\n  )[0];\n  \n  return {\n    customerId: c.id,\n    company: c.company,\n    email: c.email,\n    totalOrders: orders.length,\n    totalSpent,\n    avgOrderValue,\n    lastOrderDate: lastOrder?.createdAt,\n    lastOrderId: lastOrder?.visualId\n  };\n});\n\n// Sort by total spent\nanalytics.sort((a, b) => b.totalSpent - a.totalSpent);\n\nreturn analytics.map(a => ({ json: a }));"
      },
      "position": [650, 300]
    },
    {
      "name": "Return Analytics",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [850, 300]
    }
  ]
}
```

**Output**:
```json
[
  {
    "customerId": "customer_123",
    "company": "ABC Corp",
    "email": "orders@abccorp.com",
    "totalOrders": 45,
    "totalSpent": 67850.25,
    "avgOrderValue": 1507.78,
    "lastOrderDate": "2025-11-15T10:30:00Z",
    "lastOrderId": "12845"
  }
]
```

---

### 6. LLM Integration - Order Query

Use an LLM to query orders in natural language.

```json
{
  "name": "LLM Order Query",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "llm-query-orders",
        "httpMethod": "POST"
      },
      "position": [250, 300]
    },
    {
      "name": "Download Orders",
      "type": "n8n-nodes-base.awsS3",
      "parameters": {
        "operation": "download",
        "bucketName": "printshop",
        "fileKey": "printavo-archive/exports/2025-12-03_14-30-00/orders.json"
      },
      "credentials": {
        "s3": "MinIO PrintShop"
      },
      "position": [450, 300]
    },
    {
      "name": "Prepare Context",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const query = $input.first().json.body.query;\nconst orders = JSON.parse($binary.data.toString());\n\n// Sample first 50 orders for context\nconst sample = orders.slice(0, 50).map(o => ({\n  visualId: o.visualId,\n  customer: o.customer?.company,\n  total: o.total,\n  date: o.createdAt,\n  status: o.status?.name\n}));\n\nreturn [{\n  json: {\n    query,\n    ordersContext: JSON.stringify(sample, null, 2),\n    fullOrders: orders\n  }\n}];"
      },
      "position": [650, 300]
    },
    {
      "name": "Query LLM",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "message",
        "model": "gpt-4",
        "messages": {\n          "values": [\n            {\n              "role": "system",\n              "content": "You are a data analyst. Given order data, answer questions about orders. Return JSON with 'answer' and 'relevantOrders' fields."\n            },\n            {\n              "role": "user",\n              "content": "Orders sample:\\n{{ $json.ordersContext }}\\n\\nQuestion: {{ $json.query }}"\n            }\n          ]\n        }\n      },
      "credentials": {
        "openAiApi": "OpenAI"
      },
      "position": [850, 300]
    },
    {
      "name": "Parse LLM Response",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const response = JSON.parse($json.message.content);\nconst fullOrders = $input.first().json.fullOrders;\n\n// Get full order details for relevant orders\nconst relevantOrders = response.relevantOrders?.map(id => \n  fullOrders.find(o => o.visualId === id)\n).filter(Boolean) || [];\n\nreturn [{\n  json: {\n    answer: response.answer,\n    relevantOrders\n  }\n}];"
      },
      "position": [1050, 300]
    },
    {
      "name": "Return Result",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1250, 300]
    }
  ]
}
```

**Usage**:
```bash
curl -X POST http://n8n-host:5678/webhook/llm-query-orders \
  -H "Content-Type: application/json" \
  -d '{"query": "What were the top 5 orders by revenue in 2025?"}'
```

---

### 7. Automated Daily Report

Generate daily order summary report.

```json
{
  "name": "Daily Order Report",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 8 * * *"
            }
          ]
        }
      },
      "position": [250, 300]
    },
    {
      "name": "Download Orders",
      "type": "n8n-nodes-base.awsS3",
      "parameters": {
        "operation": "download",
        "bucketName": "printshop",
        "fileKey": "printavo-archive/exports/2025-12-03_14-30-00/orders.json"
      },
      "credentials": {
        "s3": "MinIO PrintShop"
      },
      "position": [450, 300]
    },
    {
      "name": "Filter Yesterday's Orders",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const orders = JSON.parse($binary.data.toString());\nconst yesterday = new Date();\nyesterday.setDate(yesterday.getDate() - 1);\nyesterday.setHours(0, 0, 0, 0);\n\nconst filtered = orders.filter(o => {\n  const orderDate = new Date(o.createdAt);\n  orderDate.setHours(0, 0, 0, 0);\n  return orderDate.getTime() === yesterday.getTime();\n});\n\nconst totalRevenue = filtered.reduce((sum, o) => sum + (o.total || 0), 0);\n\nreturn [{\n  json: {\n    date: yesterday.toISOString().split('T')[0],\n    orderCount: filtered.length,\n    totalRevenue,\n    avgOrderValue: filtered.length > 0 ? totalRevenue / filtered.length : 0,\n    orders: filtered\n  }\n}];"
      },
      "position": [650, 300]
    },
    {
      "name": "Format Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "fromEmail": "reports@printshop.com",
        "toEmail": "ronny@mintprints.com",
        "subject": "Daily Order Report - {{ $json.date }}",
        "text": "Orders: {{ $json.orderCount }}\\nRevenue: ${{ $json.totalRevenue }}\\nAvg Order: ${{ $json.avgOrderValue }}",
        "html": "<h2>Daily Order Report</h2><p><strong>Date:</strong> {{ $json.date }}</p><p><strong>Orders:</strong> {{ $json.orderCount }}</p><p><strong>Revenue:</strong> ${{ $json.totalRevenue }}</p><p><strong>Avg Order Value:</strong> ${{ $json.avgOrderValue }}</p>"
      },
      "position": [850, 300]
    }
  ]
}
```

**Schedule**: Runs daily at 8:00 AM

---

## Advanced Patterns

### Caching for Performance

```javascript
// Store in n8n workflow static data
const cachedOrders = this.getWorkflowStaticData('node');

if (!cachedOrders.data || Date.now() - cachedOrders.timestamp > 3600000) {
  // Cache expired, download fresh data
  const orders = JSON.parse($binary.data.toString());
  cachedOrders.data = orders;
  cachedOrders.timestamp = Date.now();
}

return cachedOrders.data.map(o => ({ json: o }));
```

### Error Handling

```javascript
try {
  const orders = JSON.parse($binary.data.toString());
  return orders.map(o => ({ json: o }));
} catch (error) {
  return [{
    json: {
      error: true,
      message: error.message,
      fallback: []
    }
  }];
}
```

### Batch Processing

```javascript
// Process orders in batches of 100
const orders = JSON.parse($binary.data.toString());
const batchSize = 100;
const batches = [];

for (let i = 0; i < orders.length; i += batchSize) {
  batches.push(orders.slice(i, i + batchSize));
}

return batches.map(batch => ({ json: { orders: batch } }));
```

---

## Related Documentation

- [PRINTAVO_EXTRACTION_IMPLEMENTATION.md](PRINTAVO_EXTRACTION_IMPLEMENTATION.md) - Data extraction guide
- [MINIO_STORAGE_GUIDE.md](MINIO_STORAGE_GUIDE.md) - MinIO configuration
- [PRINTAVO_V2_SCHEMA_REFERENCE.md](PRINTAVO_V2_SCHEMA_REFERENCE.md) - Data schema

---

<small>Generated by PrintShop OS | December 2025</small>
