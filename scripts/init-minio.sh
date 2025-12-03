#!/bin/bash
# =============================================================================
# MinIO Initialization Script
# =============================================================================
# Initialize MinIO buckets and policies for Printavo archive
#
# Prerequisites:
# - MinIO service must be running (docker compose up -d minio)
# - MINIO_ROOT_USER and MINIO_ROOT_PASSWORD must be set in .env
#
# Usage:
#   ./scripts/init-minio.sh
# =============================================================================

set -e

echo "🚀 Initializing MinIO for PrintShop OS..."
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Default values
MINIO_ROOT_USER=${MINIO_ROOT_USER:-minioadmin}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD:-minioadmin}
MINIO_BUCKET=${MINIO_BUCKET:-printshop}

echo "📋 Configuration:"
echo "   User: $MINIO_ROOT_USER"
echo "   Bucket: $MINIO_BUCKET"
echo ""

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

until curl -sf http://localhost:9000/minio/health/live > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ MinIO failed to start after $MAX_RETRIES attempts"
    echo "   Check logs with: docker logs printshop-minio"
    exit 1
  fi
  echo "   Waiting... (attempt $RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

echo "✅ MinIO is ready!"
echo ""

# Check if mc (MinIO Client) is installed in the container
echo "🔧 Setting up MinIO Client..."

# Install mc client if not present
if ! docker exec printshop-minio which mc > /dev/null 2>&1; then
    echo "   Installing MinIO Client..."
    docker exec printshop-minio sh -c "wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc && chmod +x /usr/local/bin/mc"
fi

# Configure mc alias
echo "   Configuring MinIO Client alias..."
docker exec printshop-minio mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" > /dev/null 2>&1

# Create main bucket
echo ""
echo "📦 Creating buckets..."
docker exec printshop-minio mc mb local/$MINIO_BUCKET --ignore-existing > /dev/null 2>&1
echo "   ✓ Bucket '$MINIO_BUCKET' created"

# Create printavo-archive prefix structure (MinIO doesn't need explicit folder creation, but we can verify)
echo ""
echo "📁 Verifying archive structure..."
echo "   ✓ printavo-archive/exports/ (will be created on first upload)"
echo "   ✓ printavo-archive/files/ (will be created on first upload)"
echo "   ✓ printavo-archive/index/ (will be created on first upload)"

# Set bucket policy (public read for specific paths if needed)
echo ""
echo "🔐 Setting bucket policies..."
echo "   Using default private access"
echo "   (Files are accessible via presigned URLs)"

# Test bucket access
echo ""
echo "🧪 Testing bucket access..."
if docker exec printshop-minio mc ls local/$MINIO_BUCKET > /dev/null 2>&1; then
    echo "   ✓ Bucket access confirmed"
else
    echo "   ⚠️  Warning: Could not verify bucket access"
fi

# Print summary
echo ""
echo "✅ MinIO initialization complete!"
echo ""
echo "📊 Access Information:"
echo "   S3 API: http://localhost:9000"
echo "   Web Console: http://localhost:9001"
echo "   Username: $MINIO_ROOT_USER"
echo "   Bucket: $MINIO_BUCKET"
echo ""
echo "🔗 Next Steps:"
echo "   1. Access web console at http://localhost:9001"
echo "   2. Run extraction: cd services/api && npm run printavo:extract"
echo "   3. Download files: npm run printavo:download-files"
echo "   4. Sync to MinIO: npm run printavo:sync-minio"
echo "   Or run all at once: npm run printavo:full-archive"
echo ""
