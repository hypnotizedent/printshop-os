# Disaster Recovery Guide - PrintShop OS

## Overview

This guide provides comprehensive disaster recovery (DR) procedures for PrintShop OS. A well-planned DR strategy ensures business continuity and minimizes data loss in case of system failures, data corruption, or catastrophic events.

**Recovery Time Objective (RTO):** 4 hours  
**Recovery Point Objective (RPO):** 24 hours  
**Backup Retention:** 30 days

---

## Table of Contents

1. [Backup Strategy](#backup-strategy)
2. [Database Backups](#database-backups)
3. [Application Backups](#application-backups)
4. [File Storage Backups](#file-storage-backups)
5. [Restore Procedures](#restore-procedures)
6. [Rollback Strategies](#rollback-strategies)
7. [Testing DR Procedures](#testing-dr-procedures)
8. [Business Continuity Planning](#business-continuity-planning)

---

## Backup Strategy

### Backup Types

**1. Full Backups (Daily)**
- Complete database dumps
- All application data
- Configuration files
- Uploaded files

**2. Incremental Backups (Hourly)**
- Database transaction logs
- Changed files only
- Application logs

**3. Configuration Backups (On Change)**
- docker-compose.yml
- .env files (encrypted)
- Nginx configurations
- SSL certificates

### Backup Schedule

```
Daily:    02:00 AM - Full backup
Hourly:   :00      - Incremental backup
Weekly:   Sunday   - Extended full backup + test restore
Monthly:  1st      - Archive to cold storage
```

### Backup Locations

**Primary:** Local backup volume (fast recovery)  
**Secondary:** Network-attached storage (NAS)  
**Tertiary:** Cloud storage (AWS S3, Google Cloud Storage, Azure Blob)

---

## Database Backups

### PostgreSQL Backup

#### Automated Daily Backup

Create `backup-postgres.sh`:

```bash
#!/bin/bash
# backup-postgres.sh - PostgreSQL backup script

set -e

# Configuration
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
RETENTION_DAYS=30
POSTGRES_CONTAINER="printshop-postgres"
POSTGRES_USER="strapi"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Full database backup
echo "Starting PostgreSQL backup..."
docker exec $POSTGRES_CONTAINER pg_dumpall -U $POSTGRES_USER | \
  gzip > "$BACKUP_DIR/full-backup-$DATE.sql.gz"

# Individual database backups
for DB in printshop botpress; do
  echo "Backing up database: $DB"
  docker exec $POSTGRES_CONTAINER pg_dump -U $POSTGRES_USER $DB | \
    gzip > "$BACKUP_DIR/${DB}-backup-$DATE.sql.gz"
done

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR/full-backup-$DATE.sql.gz" | cut -f1)
echo "Backup completed: $BACKUP_SIZE"

# Remove old backups
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Verify backup integrity
echo "Verifying backup integrity..."
gzip -t "$BACKUP_DIR/full-backup-$DATE.sql.gz"

if [ $? -eq 0 ]; then
  echo "✅ Backup successful and verified"
else
  echo "❌ Backup verification failed!"
  exit 1
fi

# Copy to secondary location (NAS)
if [ -d "/mnt/nas/backups" ]; then
  echo "Copying to NAS..."
  cp "$BACKUP_DIR/full-backup-$DATE.sql.gz" /mnt/nas/backups/
fi

# Upload to cloud (AWS S3 example)
if command -v aws &> /dev/null; then
  echo "Uploading to S3..."
  aws s3 cp "$BACKUP_DIR/full-backup-$DATE.sql.gz" \
    s3://printshop-backups/postgres/ \
    --storage-class STANDARD_IA
fi

echo "Backup process completed at $(date)"
```

**Make executable and schedule:**
```bash
chmod +x backup-postgres.sh

# Add to crontab
crontab -e

# Add line (daily at 2 AM):
0 2 * * * /path/to/backup-postgres.sh >> /var/log/postgres-backup.log 2>&1
```

#### Point-in-Time Recovery (PITR)

**Enable WAL archiving:**

Add to PostgreSQL configuration:
```sql
-- Enable WAL archiving
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /backups/postgres/wal/%f';

-- Restart required
```

**Restart PostgreSQL:**
```bash
docker compose restart postgres
```

### MongoDB Backup (Appsmith)

Create `backup-mongo.sh`:

```bash
#!/bin/bash
# backup-mongo.sh - MongoDB backup script

set -e

BACKUP_DIR="/backups/mongo"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
RETENTION_DAYS=30
MONGO_CONTAINER="printshop-mongo"

mkdir -p "$BACKUP_DIR"

echo "Starting MongoDB backup..."

# Backup using mongodump
docker exec $MONGO_CONTAINER mongodump \
  --username=root \
  --password=$MONGO_ROOT_PASSWORD \
  --authenticationDatabase=admin \
  --out=/tmp/mongodump

# Copy backup out of container
docker cp $MONGO_CONTAINER:/tmp/mongodump "$BACKUP_DIR/mongo-$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/mongo-$DATE.tar.gz" -C "$BACKUP_DIR" "mongo-$DATE"
rm -rf "$BACKUP_DIR/mongo-$DATE"

# Cleanup old backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ MongoDB backup completed"
```

---

## Application Backups

### Strapi Configuration & Content

Create `backup-strapi.sh`:

```bash
#!/bin/bash
# backup-strapi.sh - Strapi application backup

set -e

BACKUP_DIR="/backups/strapi"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

mkdir -p "$BACKUP_DIR"

echo "Backing up Strapi configuration and uploads..."

# Backup Strapi data volume
docker run --rm \
  -v printshop_strapi_data:/data \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/strapi-data-$DATE.tar.gz" /data

# Backup uploaded files
docker run --rm \
  -v printshop_strapi_uploads:/data \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/strapi-uploads-$DATE.tar.gz" /data

# Export Strapi content (if export plugin available)
# docker exec printshop-strapi npm run strapi export -- \
#   --file /tmp/export.tar.gz

echo "✅ Strapi backup completed"
```

### Appsmith Applications

Create `backup-appsmith.sh`:

```bash
#!/bin/bash
# backup-appsmith.sh - Appsmith backup

set -e

BACKUP_DIR="/backups/appsmith"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

mkdir -p "$BACKUP_DIR"

echo "Backing up Appsmith applications..."

# Backup Appsmith data volume
docker run --rm \
  -v printshop_appsmith_data:/data \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/appsmith-$DATE.tar.gz" /data

# Export applications via API (if configured)
# curl -X GET "http://localhost:8080/api/v1/applications/export" \
#   -H "Authorization: Bearer $APPSMITH_API_KEY" \
#   -o "$BACKUP_DIR/appsmith-apps-$DATE.json"

echo "✅ Appsmith backup completed"
```

### Botpress Flows and Data

Create `backup-botpress.sh`:

```bash
#!/bin/bash
# backup-botpress.sh - Botpress backup

set -e

BACKUP_DIR="/backups/botpress"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

mkdir -p "$BACKUP_DIR"

echo "Backing up Botpress bot data..."

# Backup Botpress data volume
docker run --rm \
  -v printshop_botpress_data:/data \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/botpress-$DATE.tar.gz" /data

echo "✅ Botpress backup completed"
```

---

## File Storage Backups

### Uploaded Files (Images, Documents)

**Rsync to secondary location:**

```bash
#!/bin/bash
# backup-files.sh - File storage backup

UPLOAD_DIR="/var/lib/docker/volumes/printshop_strapi_uploads/_data"
BACKUP_DIR="/mnt/nas/backups/uploads"
DATE=$(date +%Y-%m-%d)

# Sync to NAS (incremental)
rsync -avz --delete \
  "$UPLOAD_DIR/" \
  "$BACKUP_DIR/$DATE/"

echo "✅ File backup completed"
```

**Cloud sync (AWS S3):**

```bash
# Sync to S3
aws s3 sync /var/lib/docker/volumes/printshop_strapi_uploads/_data \
  s3://printshop-backups/uploads/ \
  --storage-class STANDARD_IA

# Enable versioning on S3 bucket
aws s3api put-bucket-versioning \
  --bucket printshop-backups \
  --versioning-configuration Status=Enabled
```

---

## Restore Procedures

### Full System Restore

#### 1. Prepare Environment

```bash
# On new server
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone https://github.com/hypnotizedent/printshop-os.git
cd printshop-os

# Restore .env file from backup
cp /path/to/backup/.env .env
```

#### 2. Restore Databases

**PostgreSQL:**

```bash
# Start only PostgreSQL
docker compose up -d postgres

# Wait for PostgreSQL to be ready
sleep 10

# Restore full backup
gunzip -c /backups/postgres/full-backup-2025-01-20.sql.gz | \
  docker exec -i printshop-postgres psql -U strapi

# Or restore specific database
gunzip -c /backups/postgres/printshop-backup-2025-01-20.sql.gz | \
  docker exec -i printshop-postgres psql -U strapi -d printshop

echo "✅ PostgreSQL restored"
```

**MongoDB:**

```bash
# Start MongoDB
docker compose up -d mongo

# Restore MongoDB
tar -xzf /backups/mongo/mongo-2025-01-20.tar.gz -C /tmp
docker cp /tmp/mongo-2025-01-20 printshop-mongo:/tmp/mongodump

docker exec printshop-mongo mongorestore \
  --username=root \
  --password=$MONGO_ROOT_PASSWORD \
  --authenticationDatabase=admin \
  /tmp/mongodump

echo "✅ MongoDB restored"
```

#### 3. Restore Application Data

**Strapi:**

```bash
# Restore Strapi data
docker run --rm \
  -v printshop_strapi_data:/data \
  -v /backups/strapi:/backup \
  alpine sh -c "cd /data && tar xzf /backup/strapi-data-2025-01-20.tar.gz --strip 1"

# Restore uploads
docker run --rm \
  -v printshop_strapi_uploads:/data \
  -v /backups/strapi:/backup \
  alpine sh -c "cd /data && tar xzf /backup/strapi-uploads-2025-01-20.tar.gz --strip 1"

echo "✅ Strapi data restored"
```

**Appsmith:**

```bash
docker run --rm \
  -v printshop_appsmith_data:/data \
  -v /backups/appsmith:/backup \
  alpine sh -c "cd /data && tar xzf /backup/appsmith-2025-01-20.tar.gz --strip 1"

echo "✅ Appsmith data restored"
```

**Botpress:**

```bash
docker run --rm \
  -v printshop_botpress_data:/data \
  -v /backups/botpress:/backup \
  alpine sh -c "cd /data && tar xzf /backup/botpress-2025-01-20.tar.gz --strip 1"

echo "✅ Botpress data restored"
```

#### 4. Start All Services

```bash
# Start entire stack
docker compose up -d

# Verify all services are healthy
docker compose ps

# Check logs
docker compose logs -f

# Test critical endpoints
curl http://localhost:1337/_health
curl http://localhost:8080/api/v1/health
curl http://localhost:3000/status
```

### Partial Restore (Single Database)

**Restore only one database:**

```bash
# Restore printshop database only
gunzip -c /backups/postgres/printshop-backup-2025-01-20.sql.gz | \
  docker exec -i printshop-postgres psql -U strapi -d printshop

# Restart Strapi to reload
docker compose restart strapi
```

### Point-in-Time Recovery

**Restore to specific time:**

```bash
# 1. Restore base backup
gunzip -c /backups/postgres/full-backup-2025-01-20_02-00-00.sql.gz | \
  docker exec -i printshop-postgres psql -U strapi

# 2. Replay WAL logs up to specific time
# Create recovery configuration
cat > recovery.conf << EOF
restore_command = 'cp /backups/postgres/wal/%f %p'
recovery_target_time = '2025-01-20 14:30:00'
EOF

# Copy to PostgreSQL container
docker cp recovery.conf printshop-postgres:/var/lib/postgresql/data/

# Restart to apply WAL logs
docker compose restart postgres
```

---

## Rollback Strategies

### Application Rollback

**Rollback to previous version:**

```bash
# List available backups
ls -lh /backups/strapi/

# Stop current version
docker compose stop strapi

# Restore previous version
docker run --rm \
  -v printshop_strapi_data:/data \
  -v /backups/strapi:/backup \
  alpine sh -c "rm -rf /data/* && cd /data && tar xzf /backup/strapi-data-2025-01-19.tar.gz --strip 1"

# Start previous version
docker compose up -d strapi

# Verify
docker compose logs strapi
```

### Database Rollback

**Rollback database changes:**

```bash
# Create database snapshot before changes
docker exec printshop-postgres pg_dump -U strapi printshop > snapshot-before-change.sql

# Make changes...

# If issues occur, rollback
cat snapshot-before-change.sql | \
  docker exec -i printshop-postgres psql -U strapi -d printshop
```

### Git-Based Rollback

**For configuration changes:**

```bash
# View commit history
git log --oneline

# Rollback to previous commit
git revert <commit-hash>

# Or reset (caution: data loss)
git reset --hard <commit-hash>

# Redeploy
docker compose up -d --build
```

---

## Testing DR Procedures

### Quarterly DR Test

**Procedure:**

1. **Announce test window** (staging environment recommended)
2. **Simulate failure:**
   ```bash
   docker compose down
   docker volume rm printshop_postgres_data
   ```
3. **Execute restore procedures** (documented above)
4. **Verify data integrity:**
   - Check customer count
   - Verify job records
   - Test API endpoints
5. **Document results:**
   - Time taken
   - Issues encountered
   - Lessons learned
6. **Update DR procedures** based on findings

### Automated DR Tests

Create `test-restore.sh`:

```bash
#!/bin/bash
# test-restore.sh - Automated DR test

set -e

TEST_DIR="/tmp/dr-test-$(date +%s)"
mkdir -p "$TEST_DIR"

echo "Starting DR test..."

# 1. Create test environment
cd "$TEST_DIR"
git clone https://github.com/hypnotizedent/printshop-os.git
cd printshop-os

# 2. Copy latest backups
cp /backups/postgres/full-backup-*.sql.gz latest-postgres.sql.gz

# 3. Modify docker-compose to use test ports
sed -i 's/1337:1337/11337:1337/g' docker-compose.yml
sed -i 's/8080:80/18080:80/g' docker-compose.yml
sed -i 's/3000:3000/13000:3000/g' docker-compose.yml

# 4. Start services
docker compose up -d postgres
sleep 30

# 5. Restore database
gunzip -c latest-postgres.sql.gz | \
  docker compose exec -T postgres psql -U strapi

# 6. Start remaining services
docker compose up -d

# 7. Wait for health checks
sleep 60

# 8. Test endpoints
curl -f http://localhost:11337/_health || exit 1
curl -f http://localhost:18080/api/v1/health || exit 1

# 9. Cleanup
docker compose down -v
rm -rf "$TEST_DIR"

echo "✅ DR test passed!"
```

---

## Business Continuity Planning

### Disaster Scenarios

#### Scenario 1: Server Hardware Failure

**RTO:** 4 hours  
**Procedure:**
1. Provision new server
2. Install Docker
3. Restore from backups (see above)
4. Update DNS records
5. Test functionality

#### Scenario 2: Data Corruption

**RTO:** 2 hours  
**Procedure:**
1. Identify corrupted data (database/files)
2. Stop affected services
3. Restore from most recent clean backup
4. Replay recent transactions if possible
5. Verify data integrity

#### Scenario 3: Accidental Data Deletion

**RTO:** 1 hour  
**Procedure:**
1. Stop writes to database
2. Restore from backup prior to deletion
3. Extract deleted data
4. Merge with current database
5. Verify consistency

#### Scenario 4: Complete Site Outage

**RTO:** 4 hours  
**Procedure:**
1. Activate disaster recovery site
2. Restore all services
3. Update DNS to point to DR site
4. Verify all functionality
5. Monitor closely

### Contact List

Maintain updated contact list:

```yaml
# contacts.yml

technical_lead:
  name: "Technical Lead Name"
  phone: "+1-555-0101"
  email: "tech@printshop.com"

database_admin:
  name: "DBA Name"
  phone: "+1-555-0102"
  email: "dba@printshop.com"

cloud_provider:
  support: "+1-800-xxx-xxxx"
  account: "ACCOUNT-ID"

backup_provider:
  support: "+1-800-yyy-yyyy"
  account: "BACKUP-ACCOUNT"
```

### Communication Plan

**During incident:**
1. Technical team via Slack/Email
2. Management via phone
3. Users via status page
4. Regular updates every 30 minutes

**After incident:**
1. Post-mortem report within 48 hours
2. Lessons learned meeting
3. Update DR procedures
4. Training for team

---

## Verification Checklist

After restore, verify:

- [ ] All services are running
- [ ] Health checks are passing
- [ ] Database connections working
- [ ] Customer count matches
- [ ] Job records intact
- [ ] Uploaded files accessible
- [ ] API endpoints responding
- [ ] Admin panels accessible
- [ ] Botpress conversations working
- [ ] Time clock functioning
- [ ] No error logs
- [ ] SSL certificates valid (production)
- [ ] DNS records correct (production)

---

## Automation

### Master Backup Script

Create `backup-all.sh`:

```bash
#!/bin/bash
# backup-all.sh - Master backup orchestration

set -e

LOG_FILE="/var/log/printshop-backup.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================"
echo "PrintShop OS Backup - $(date)"
echo "========================================"

# Run all backup scripts
/opt/scripts/backup-postgres.sh
/opt/scripts/backup-mongo.sh
/opt/scripts/backup-strapi.sh
/opt/scripts/backup-appsmith.sh
/opt/scripts/backup-botpress.sh
/opt/scripts/backup-files.sh

echo "========================================"
echo "All backups completed - $(date)"
echo "========================================"

# Send notification
if command -v mail &> /dev/null; then
  mail -s "PrintShop Backup Complete" admin@printshop.com < "$LOG_FILE"
fi
```

**Schedule:**
```bash
chmod +x /opt/scripts/backup-all.sh

# Add to crontab
0 2 * * * /opt/scripts/backup-all.sh
```

---

**Disaster Recovery Setup Complete! ✅**

Test your backups regularly. A backup is only as good as your ability to restore from it.
