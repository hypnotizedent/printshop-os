# MinIO Storage Guide for Printavo Archive

> **Purpose**: MinIO configuration and access patterns for archived Printavo data  
> **Last Updated**: December 2025  
> **MinIO Version**: RELEASE.2024-11-07T00-52-20Z

---

## Overview

MinIO serves as the permanent object storage for all Printavo data extracted before migration. This includes JSON exports, artwork files, and production files.

**Why MinIO?**
- S3-compatible API (industry standard)
- Self-hosted (data ownership)
- Presigned URLs for secure file access
- Easy integration with n8n, LLMs, and other tools
- Scalable storage (handles 260GB+ easily)

---

## Deployment

### Docker Compose Configuration

**File**: `docker-compose.yml`

```yaml
services:
  minio:
    image: minio/minio:latest
    container_name: printshop-minio
    ports:
      - "9000:9000"     # API
      - "9001:9001"     # Web Console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - /mnt/primary/docker/volumes/printshop-os/minio/data:/data
    command: server /data --console-address ":9001"
    networks:
      - homelab-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
```

### Deploy MinIO

```bash
cd ~/stacks/printshop-os
docker compose up -d minio

# Wait for MinIO to start
docker compose logs -f minio

# Verify health
curl http://localhost:9000/minio/health/live
```

**Expected Response**: `200 OK`

---

## Initial Setup

### 1. Install MinIO Client (mc)

```bash
# Install mc inside container
docker exec -it printshop-minio sh

# Configure alias
mc alias set local http://localhost:9000 minioadmin your-secret-key

# Test connection
mc admin info local
```

### 2. Create Buckets

```bash
# Create printshop bucket
docker exec printshop-minio mc mb local/printshop

# Set public read policy (optional, for public files)
docker exec printshop-minio mc anonymous set download local/printshop/public

# Verify bucket exists
docker exec printshop-minio mc ls local/
```

### 3. Create Directory Structure

```bash
# Create base directories
docker exec printshop-minio mc mb local/printshop/printavo-archive
docker exec printshop-minio mc mb local/printshop/printavo-archive/exports
docker exec printshop-minio mc mb local/printshop/printavo-archive/artwork
docker exec printshop-minio mc mb local/printshop/printavo-archive/production-files
docker exec printshop-minio mc mb local/printshop/printavo-archive/index
```

---

## Bucket Structure

### Directory Layout

```
minio://printshop/
└── printavo-archive/
    ├── exports/                    # JSON data exports
    │   └── {timestamp}/
    │       ├── orders.json         # All orders (12,867+)
    │       ├── customers.json      # All customers (3,358+)
    │       ├── line_items.json     # All line items (49,216+)
    │       ├── tasks.json          # All tasks (1,463+)
    │       ├── payments.json       # All payments
    │       ├── expenses.json       # All expenses (297+)
    │       ├── products.json       # Product catalog
    │       ├── users.json          # User accounts
    │       ├── order_statuses.json # Status definitions
    │       └── summary.json        # Extraction metadata
    │
    ├── artwork/                    # Customer artwork files
    │   └── by_customer/
    │       └── {customer-slug}-{id}/
    │           └── {year}/
    │               └── {visual_id}_{order-slug}/
    │                   ├── artwork_0.png
    │                   ├── mockup_1.jpg
    │                   ├── proof_2.pdf
    │                   └── manifest.json
    │
    ├── production-files/           # Production-ready files
    │   └── by_order/
    │       └── {visual_id}/
    │           ├── front_logo.dst  # Embroidery
    │           ├── back_design.eps # Vector art
    │           ├── sleeve_art.ai   # Adobe Illustrator
    │           └── manifest.json   # File listing
    │
    └── index/                      # Searchable indexes
        ├── orders_index.json       # Quick order lookup
        ├── customers_index.json    # Quick customer lookup
        └── artwork_index.json      # Artwork file index
```

### Path Conventions

**Exports**: `printavo-archive/exports/{YYYY-MM-DD_HH-MM-SS}/`  
**Artwork**: `printavo-archive/artwork/by_customer/{customer-slug}-{id}/{year}/{visual_id}_{order-slug}/`  
**Production**: `printavo-archive/production-files/by_order/{visual_id}/`  
**Index**: `printavo-archive/index/{index_name}.json`

---

## Access Patterns

### 1. Direct Download (MinIO Client)

```bash
# List files
docker exec printshop-minio mc ls local/printshop/printavo-archive/exports/

# Download file
docker exec printshop-minio mc cp \
  local/printshop/printavo-archive/exports/2025-12-03_14-30-00/orders.json \
  /tmp/orders.json

# Download entire directory
docker exec printshop-minio mc mirror \
  local/printshop/printavo-archive/artwork/ \
  /tmp/artwork/
```

### 2. S3 API (boto3/aws-sdk)

**Python Example**:
```python
from minio import Minio

# Initialize client
client = Minio(
    "docker-host:9000",
    access_key="minioadmin",
    secret_key="your-secret-key",
    secure=False  # HTTP, not HTTPS
)

# List objects
objects = client.list_objects(
    "printshop",
    prefix="printavo-archive/exports/",
    recursive=True
)

for obj in objects:
    print(f"{obj.object_name}: {obj.size} bytes")

# Download file
client.fget_object(
    "printshop",
    "printavo-archive/exports/2025-12-03_14-30-00/orders.json",
    "/tmp/orders.json"
)

# Upload file
client.fput_object(
    "printshop",
    "printavo-archive/exports/2025-12-03_14-30-00/orders.json",
    "/tmp/orders.json"
)
```

**Node.js Example**:
```typescript
import { Client } from 'minio';

const minioClient = new Client({
  endPoint: 'docker-host',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'your-secret-key'
});

// List objects
const objectsStream = minioClient.listObjectsV2(
  'printshop',
  'printavo-archive/exports/',
  true
);

objectsStream.on('data', (obj) => {
  console.log(`${obj.name}: ${obj.size} bytes`);
});

// Download file
await minioClient.fGetObject(
  'printshop',
  'printavo-archive/exports/2025-12-03_14-30-00/orders.json',
  '/tmp/orders.json'
);

// Upload file
await minioClient.fPutObject(
  'printshop',
  'printavo-archive/exports/2025-12-03_14-30-00/orders.json',
  '/tmp/orders.json'
);
```

### 3. Presigned URLs (Temporary Access)

Presigned URLs allow temporary access to private files without exposing credentials.

**Generate URL (Python)**:
```python
from minio import Minio
from datetime import timedelta

client = Minio(
    "docker-host:9000",
    access_key="minioadmin",
    secret_key="your-secret-key",
    secure=False
)

# Generate presigned URL (valid for 1 hour)
url = client.presigned_get_object(
    "printshop",
    "printavo-archive/artwork/by_customer/abc-corp-123/2025/12345_abc-corp-tshirts/artwork_0.png",
    expires=timedelta(hours=1)
)

print(f"Download URL: {url}")
```

**Generate URL (Node.js)**:
```typescript
const url = await minioClient.presignedGetObject(
  'printshop',
  'printavo-archive/artwork/by_customer/abc-corp-123/2025/12345_abc-corp-tshirts/artwork_0.png',
  60 * 60  // 1 hour in seconds
);

console.log(`Download URL: ${url}`);
```

**Result**:
```
http://docker-host:9000/printshop/printavo-archive/artwork/...png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...
```

**Usage**: Share this URL with users, n8n workflows, or LLMs for temporary file access.

---

## n8n Integration

### Setup MinIO Credentials in n8n

1. Open n8n: `http://docker-host:5678`
2. Go to **Credentials** → **New**
3. Select **S3** credential type
4. Configure:
   ```
   Access Key ID: minioadmin
   Secret Access Key: your-secret-key
   Region: us-east-1 (default)
   Custom S3 Endpoint: http://docker-host:9000
   Force Path Style: Yes
   ```

### n8n Workflow: Get Order JSON

```json
{
  "nodes": [
    {
      "name": "Get Order",
      "type": "n8n-nodes-base.awsS3",
      "parameters": {
        "operation": "download",
        "bucketName": "printshop",
        "fileKey": "printavo-archive/exports/2025-12-03_14-30-00/orders.json",
        "options": {}
      },
      "credentials": {
        "s3": "MinIO PrintShop"
      }
    },
    {
      "name": "Parse JSON",
      "type": "n8n-nodes-base.Set",
      "parameters": {
        "values": {
          "string": [
            {
              "name": "orders",
              "value": "={{ JSON.parse($binary.data.toString()) }}"
            }
          ]
        }
      }
    }
  ]
}
```

### n8n Workflow: Search Orders by Customer

```json
{
  "nodes": [
    {
      "name": "Download Orders",
      "type": "n8n-nodes-base.awsS3",
      "parameters": {
        "operation": "download",
        "bucketName": "printshop",
        "fileKey": "printavo-archive/exports/2025-12-03_14-30-00/orders.json"
      }
    },
    {
      "name": "Filter by Customer",
      "type": "n8n-nodes-base.Set",
      "parameters": {
        "values": {
          "string": [
            {
              "name": "filtered",
              "value": "={{ JSON.parse($binary.data.toString()).filter(o => o.customer?.company?.includes('ABC Corp')) }}"
            }
          ]
        }
      }
    }
  ]
}
```

---

## Performance Optimization

### Caching

**Problem**: Downloading large JSON files repeatedly is slow.

**Solution**: Cache frequently accessed files locally.

```python
import json
import os
from pathlib import Path

CACHE_DIR = Path('/tmp/minio-cache')
CACHE_TTL = 3600  # 1 hour

def get_cached_json(client, bucket, key):
    cache_file = CACHE_DIR / key.replace('/', '_')
    
    # Check cache
    if cache_file.exists():
        age = time.time() - cache_file.stat().st_mtime
        if age < CACHE_TTL:
            with open(cache_file) as f:
                return json.load(f)
    
    # Download and cache
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    client.fget_object(bucket, key, str(cache_file))
    
    with open(cache_file) as f:
        return json.load(f)
```

### Parallel Downloads

```python
from concurrent.futures import ThreadPoolExecutor

def download_file(obj_info):
    client.fget_object(
        "printshop",
        obj_info.object_name,
        f"/tmp/{obj_info.object_name.split('/')[-1]}"
    )
    return obj_info.object_name

objects = list(client.list_objects(
    "printshop",
    prefix="printavo-archive/artwork/",
    recursive=True
))

# Download 10 files in parallel
with ThreadPoolExecutor(max_workers=10) as executor:
    results = executor.map(download_file, objects[:100])
```

### Streaming Large Files

For files too large to fit in memory:

```python
# Stream file instead of loading into memory
response = client.get_object("printshop", "large-file.json")

for chunk in response.stream(1024 * 1024):  # 1MB chunks
    # Process chunk
    process_chunk(chunk)

response.close()
response.release_conn()
```

---

## Backup & Recovery

### Backup MinIO Data

```bash
# Backup to external drive
docker exec printshop-minio mc mirror \
  local/printshop/printavo-archive/ \
  /mnt/backup/printavo-archive/

# Verify backup
docker exec printshop-minio mc diff \
  local/printshop/printavo-archive/ \
  /mnt/backup/printavo-archive/
```

### Restore from Backup

```bash
# Restore from external drive
docker exec printshop-minio mc mirror \
  /mnt/backup/printavo-archive/ \
  local/printshop/printavo-archive/
```

### Replicate to Remote MinIO

```bash
# Add remote MinIO alias
docker exec printshop-minio mc alias set remote \
  https://remote-minio.example.com \
  remote-access-key \
  remote-secret-key

# Mirror to remote
docker exec printshop-minio mc mirror \
  local/printshop/printavo-archive/ \
  remote/printshop/printavo-archive/
```

---

## Security

### Access Policies

Create read-only policy for n8n:

```bash
# Create policy file
cat > /tmp/readonly-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::printshop/printavo-archive/*",
        "arn:aws:s3:::printshop"
      ]
    }
  ]
}
EOF

# Create user
docker exec printshop-minio mc admin user add local n8n-readonly n8n-secret

# Attach policy
docker exec printshop-minio mc admin policy set local readonly-policy user=n8n-readonly
```

### Encryption at Rest

Enable server-side encryption:

```bash
docker exec printshop-minio mc encrypt set sse-s3 local/printshop/
```

### Access Logs

Enable access logging:

```bash
# Create audit log bucket
docker exec printshop-minio mc mb local/audit-logs

# Enable logging
docker exec printshop-minio mc admin config set local audit_webhook:1 \
  endpoint=http://logserver:9200/minio-audit \
  enable=on
```

---

## Monitoring

### Check Bucket Size

```bash
docker exec printshop-minio mc du local/printshop/printavo-archive/
```

**Expected Output**:
```
260.5 GB    printavo-archive/
  52.3 MB     exports/
 215.2 GB     artwork/
  45.0 GB     production-files/
   5.0 MB     index/
```

### Check Object Count

```bash
docker exec printshop-minio mc ls --recursive local/printshop/printavo-archive/ | wc -l
```

### Monitor Disk Usage

```bash
# Check MinIO volume usage
docker exec docker-host df -h /mnt/primary/docker/volumes/printshop-os/minio/
```

---

## Troubleshooting

### Cannot Connect to MinIO

```bash
# Check container is running
docker ps | grep minio

# Check logs
docker compose logs minio

# Test health endpoint
curl http://docker-host:9000/minio/health/live
```

### Access Denied Errors

```bash
# Verify credentials
docker exec printshop-minio mc admin user info local minioadmin

# Check bucket permissions
docker exec printshop-minio mc admin policy info local readwrite
```

### Slow Downloads

**Causes**:
- Network latency (Tailscale overhead)
- Large file sizes
- Disk I/O bottleneck

**Solutions**:
- Use local cache
- Download to local disk first
- Enable parallel downloads
- Check network with: `iperf3 -c docker-host`

---

## API Reference

### Common Operations

```python
from minio import Minio

client = Minio("docker-host:9000", "minioadmin", "secret", secure=False)

# List buckets
buckets = client.list_buckets()

# List objects
objects = client.list_objects("printshop", prefix="printavo-archive/")

# Check if object exists
try:
    client.stat_object("printshop", "path/to/file.json")
    exists = True
except:
    exists = False

# Get object metadata
stat = client.stat_object("printshop", "path/to/file.json")
print(f"Size: {stat.size}, Modified: {stat.last_modified}")

# Copy object
client.copy_object(
    "printshop", "destination/path.json",
    CopySource("printshop", "source/path.json")
)

# Delete object
client.remove_object("printshop", "path/to/file.json")
```

---

## Related Documentation

- [PRINTAVO_EXTRACTION_IMPLEMENTATION.md](PRINTAVO_EXTRACTION_IMPLEMENTATION.md) - Extraction guide
- [N8N_PRINTAVO_WORKFLOWS.md](N8N_PRINTAVO_WORKFLOWS.md) - n8n integration patterns
- [PRINTAVO_V2_SCHEMA_REFERENCE.md](PRINTAVO_V2_SCHEMA_REFERENCE.md) - Data schema

---

<small>Generated by PrintShop OS | December 2025</small>
