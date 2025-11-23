# Deployment Guide: Workflow Automation System

## Prerequisites

Before deploying the workflow automation system, ensure you have:

1. **Redis Server** (v5.0+)
   - Required for Bull queue
   - Can be run via Docker or installed locally
   
2. **SMTP Server** 
   - For sending email notifications
   - Gmail, SendGrid, AWS SES, or any SMTP provider

3. **Node.js** (v20.0+)
   - As specified in package.json engines

## Installation Steps

### 1. Install Dependencies

```bash
cd printshop-strapi
npm install
```

This will install:
- `bull@^4.12.0` - Queue management
- `ioredis@^5.3.0` - Redis client
- `nodemailer@^7.0.7` - Email sending (patched version)
- `socket.io@^4.6.0` - WebSocket server

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Core Strapi Configuration
HOST=0.0.0.0
PORT=1337
APP_KEYS="your-app-keys-here"
API_TOKEN_SALT=your-token-salt
ADMIN_JWT_SECRET=your-admin-secret
TRANSFER_TOKEN_SALT=your-transfer-salt
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Redis Configuration (Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                    # Optional, recommended for production

# Email/SMTP Configuration
SMTP_HOST=smtp.gmail.com           # Your SMTP host
SMTP_PORT=587                       # Usually 587 for TLS
SMTP_SECURE=false                   # true for port 465, false for 587
SMTP_USER=your-email@gmail.com     # SMTP username
SMTP_PASSWORD=your-app-password    # SMTP password or app password
SMTP_FROM="PrintShop OS" <noreply@printshop.com>

# Production Team Email
PRODUCTION_TEAM_EMAIL=production@printshop.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000  # Your frontend URL
```

### 3. Start Redis

**Using Docker:**
```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:latest
```

**Or install locally:**
```bash
# macOS
brew install redis
redis-server

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

### 4. Build Strapi

```bash
npm run build
```

### 5. Start Strapi

**Development:**
```bash
npm run develop
```

**Production:**
```bash
npm run start
```

### 6. Verify Installation

Check the logs for these messages:
```
✅ Workflow automation system initialized
✅ WebSocket server started
✅ Queue processor started
```

## Testing the Workflow

### 1. Create Test Data

Create a test customer and quote via Strapi admin panel:
- Navigate to http://localhost:1337/admin
- Create a Customer
- Create a Quote with that customer

### 2. Test Quote Approval

```bash
curl -X POST http://localhost:1337/api/quotes/{quote-id}/approve \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. Check Workflow Status

```bash
curl http://localhost:1337/api/quotes/{quote-id}/workflow-status
```

Expected response:
```json
{
  "quote": {
    "id": 1,
    "number": "QT-2311-0001",
    "status": "OrderCreated",
    "approved_at": "2023-11-23T10:00:00Z"
  },
  "order": {
    "id": 1,
    "number": "ORD-2311-0001",
    "status": "Pending",
    "created_at": "2023-11-23T10:01:00Z"
  },
  "job": {
    "id": 1,
    "number": "JOB-2311-0001",
    "status": "PendingArtwork",
    "created_at": "2023-11-23T10:02:00Z"
  }
}
```

### 4. Check Audit Logs

Via Strapi admin:
- Navigate to Audit Logs
- Filter by entityType: "quote", entityId: 1
- Should see entries for quote.approved, order.created, job.created

## Production Deployment

### 1. Use Production Redis

Configure Redis with authentication:

```bash
# In Redis config or docker-compose
requirepass your-strong-password
```

Update `.env`:
```bash
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-strong-password
```

### 2. Use Production SMTP

Configure with a reliable SMTP provider:
- **SendGrid**: Reliable, generous free tier
- **AWS SES**: Scalable, pay-as-you-go
- **Mailgun**: Good for transactional emails

### 3. Enable HTTPS

Configure nginx or load balancer for HTTPS:

```nginx
server {
  listen 443 ssl;
  server_name api.printshop.com;
  
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  location / {
    proxy_pass http://localhost:1337;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
  
  # WebSocket support
  location /socket.io/ {
    proxy_pass http://localhost:1337;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

### 4. Process Management

Use PM2 for production:

```bash
npm install -g pm2

# Start Strapi with PM2
pm2 start npm --name "strapi" -- run start

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
```

### 5. Monitoring

Monitor queue health:

```bash
# Check queue stats
curl http://localhost:1337/api/queue/stats

# Monitor Redis
redis-cli info stats

# Check PM2 logs
pm2 logs strapi
```

## Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  strapi:
    build: .
    ports:
      - "1337:1337"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    depends_on:
      - redis
    volumes:
      - ./public:/app/public
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

Deploy:

```bash
docker-compose up -d
```

## Troubleshooting

### Queue Jobs Not Processing

**Symptoms:** Jobs stuck in "waiting" state

**Solutions:**
1. Check Redis connection:
   ```bash
   redis-cli ping
   ```

2. Check Strapi logs for queue processor initialization

3. Restart Strapi:
   ```bash
   pm2 restart strapi
   # or
   npm run start
   ```

### Emails Not Sending

**Symptoms:** No emails received

**Solutions:**
1. Verify SMTP credentials in `.env`

2. Test SMTP connection:
   ```bash
   telnet smtp.gmail.com 587
   ```

3. Check Strapi logs for SMTP errors

4. For Gmail, use App Password not regular password

### WebSocket Not Connecting

**Symptoms:** Real-time notifications not working

**Solutions:**
1. Check CORS configuration in `.env`:
   ```bash
   FRONTEND_URL=http://your-frontend-url
   ```

2. Verify nginx/load balancer supports WebSocket upgrade

3. Check browser console for connection errors

### High Memory Usage

**Symptoms:** Strapi consuming excessive memory

**Solutions:**
1. Configure Bull queue cleanup:
   ```javascript
   // In queue.ts
   removeOnComplete: 100,  // Keep only last 100 completed jobs
   removeOnFail: 500,      // Keep last 500 failed for debugging
   ```

2. Monitor Redis memory:
   ```bash
   redis-cli info memory
   ```

3. Consider Redis eviction policy for production

## Scaling

### Horizontal Scaling

The workflow system supports horizontal scaling:

1. **Multiple Strapi Instances:**
   - Each instance processes queue jobs
   - Redis ensures job distribution
   - WebSocket uses sticky sessions

2. **Redis Cluster:**
   - For high availability
   - Configure in `queue.ts`:
     ```javascript
     const redis = new Redis.Cluster([
       { host: 'redis-1', port: 6379 },
       { host: 'redis-2', port: 6379 },
     ]);
     ```

3. **Load Balancer:**
   - Nginx or AWS ALB
   - Enable sticky sessions for WebSocket

### Vertical Scaling

For higher throughput:

1. **Increase Bull concurrency:**
   ```javascript
   // In queue-processor.ts
   workflowQueue.process(5, async (job) => {
     // Process 5 jobs concurrently
   });
   ```

2. **Optimize Redis:**
   - Use Redis persistence (RDB + AOF)
   - Allocate sufficient memory
   - Monitor with `redis-cli --stat`

## Security Checklist

- [ ] Redis password set in production
- [ ] SMTP credentials secured (use env vars, not hardcoded)
- [ ] CORS configured to specific frontend URLs
- [ ] HTTPS enabled for API and WebSocket
- [ ] Strapi admin panel protected (change default admin password)
- [ ] Rate limiting enabled on quote approval endpoint
- [ ] Approval tokens validated (if using email approval links)
- [ ] Logs sanitized (no passwords/tokens logged)

## Maintenance

### Regular Tasks

1. **Monitor Queue Stats** (daily)
   - Check failed jobs
   - Investigate patterns
   - Clear old completed jobs

2. **Check Audit Logs** (weekly)
   - Verify workflow completions
   - Identify bottlenecks

3. **Redis Maintenance** (monthly)
   - Review memory usage
   - Check persistence status
   - Backup if using RDB

### Backup Strategy

1. **Database Backups:**
   - Automated daily backups
   - Test restore procedures

2. **Redis Backups:**
   - RDB snapshots for persistence
   - Replicate to secondary instance

3. **Configuration Backups:**
   - Version control `.env` templates
   - Document environment-specific settings

## Support

For issues or questions:
- Check `WORKFLOW_AUTOMATION.md` for detailed system documentation
- Review Strapi logs: `pm2 logs strapi`
- Check Redis logs: `redis-cli monitor`
- Open GitHub issue with relevant logs and configuration
