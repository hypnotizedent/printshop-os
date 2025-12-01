#!/bin/bash
# =============================================================================
# MongoDB Replica Set Initialization Script for PrintShop OS
# =============================================================================
# This script initializes MongoDB as a replica set, which is required for
# Appsmith to function properly.
#
# Usage:
#   ./scripts/init-mongo-replica.sh
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - .env file with MONGO_INITDB_ROOT_USERNAME and MONGO_INITDB_ROOT_PASSWORD
#
# What this script does:
#   1. Generates a MongoDB keyfile for replica set authentication
#   2. Sets proper permissions on the keyfile
#   3. Starts the MongoDB container
#   4. Initializes the replica set
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
KEYFILE_PATH="$PROJECT_DIR/mongo-keyfile"

echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW} MongoDB Replica Set Initialization${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
    echo -e "${GREEN}Loading environment variables from .env...${NC}"
    set -a
    source "$PROJECT_DIR/.env"
    set +a
else
    echo -e "${YELLOW}Warning: .env file not found, using defaults${NC}"
fi

MONGO_USER="${MONGO_INITDB_ROOT_USERNAME:-root}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD:-secure_password_change_this}"

# Step 2: Generate MongoDB keyfile if it doesn't exist
if [ -f "$KEYFILE_PATH" ]; then
    echo -e "${GREEN}✓ MongoDB keyfile already exists${NC}"
else
    echo -e "${YELLOW}Generating MongoDB keyfile...${NC}"
    openssl rand -base64 756 > "$KEYFILE_PATH"
    echo -e "${GREEN}✓ Keyfile generated${NC}"
fi

# Step 3: Set proper permissions on keyfile
# MongoDB requires the keyfile to be owned by the mongodb user (UID 999) and have mode 400
echo -e "${YELLOW}Setting keyfile permissions...${NC}"
chmod 400 "$KEYFILE_PATH"

# Try to set ownership (requires sudo on Linux, may fail on macOS)
# Note: UID 999 is the default MongoDB user in the official Docker image
# This may not exist on the host system, but Docker maps it correctly inside the container
if command -v sudo &> /dev/null; then
    # Attempt to set ownership - this is best effort on the host
    # The Docker container will use the file regardless, as long as permissions are 400
    if sudo chown 999:999 "$KEYFILE_PATH" 2>/dev/null; then
        echo -e "${GREEN}✓ Keyfile ownership set to mongodb user (999:999)${NC}"
    else
        echo -e "${YELLOW}⚠ Could not change keyfile ownership${NC}"
        echo -e "${YELLOW}  This is usually fine - Docker handles the file mapping internally${NC}"
        echo -e "${YELLOW}  If MongoDB fails to start, try running this script with sudo${NC}"
    fi
else
    echo -e "${YELLOW}⚠ sudo not available, skipping ownership change${NC}"
    echo -e "${YELLOW}  Docker should handle the file permissions internally${NC}"
fi

# Step 4: Start MongoDB container
echo ""
echo -e "${YELLOW}Starting MongoDB container...${NC}"
cd "$PROJECT_DIR"
docker compose up -d mongo

# Wait for MongoDB to be ready
echo -e "${YELLOW}Waiting for MongoDB to start (this may take up to 30 seconds)...${NC}"
sleep 15

# Check if container is running
if ! docker ps | grep -q printshop-mongo; then
    echo -e "${RED}✗ MongoDB container failed to start${NC}"
    echo "Checking logs..."
    docker compose logs mongo --tail 50
    exit 1
fi

echo -e "${GREEN}✓ MongoDB container is running${NC}"

# Step 5: Initialize replica set
echo ""
echo -e "${YELLOW}Initializing replica set...${NC}"

# Check if replica set is already initialized
# Using -e to pass credentials via environment variables instead of command line
RS_STATUS=$(docker exec -e MONGO_USER="$MONGO_USER" -e MONGO_PASS="$MONGO_PASS" printshop-mongo \
    mongosh --quiet \
    --eval 'try { db.getSiblingDB("admin").auth(process.env.MONGO_USER, process.env.MONGO_PASS); rs.status().ok } catch(e) { 0 }' \
    2>/dev/null || echo "0")

if [ "$RS_STATUS" = "1" ]; then
    echo -e "${GREEN}✓ Replica set is already initialized${NC}"
else
    # Initialize the replica set using environment variables for credentials
    docker exec -e MONGO_USER="$MONGO_USER" -e MONGO_PASS="$MONGO_PASS" printshop-mongo \
        mongosh --eval '
            db.getSiblingDB("admin").auth(process.env.MONGO_USER, process.env.MONGO_PASS);
            rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "localhost:27017" }] });
        '
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Replica set initialized successfully${NC}"
    else
        echo -e "${RED}✗ Failed to initialize replica set${NC}"
        echo "This may happen if MongoDB is still starting. Please wait and try again."
        exit 1
    fi
fi

# Step 6: Verify replica set status
echo ""
echo -e "${YELLOW}Verifying replica set status...${NC}"
sleep 5

docker exec -e MONGO_USER="$MONGO_USER" -e MONGO_PASS="$MONGO_PASS" printshop-mongo \
    mongosh --eval '
        db.getSiblingDB("admin").auth(process.env.MONGO_USER, process.env.MONGO_PASS);
        rs.status();
    ' | head -30

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN} MongoDB Replica Set Initialization Complete!${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Start remaining services: ${YELLOW}docker compose up -d${NC}"
echo -e "  2. Check service health: ${YELLOW}docker compose ps${NC}"
echo -e "  3. View logs: ${YELLOW}docker compose logs -f${NC}"
echo ""
