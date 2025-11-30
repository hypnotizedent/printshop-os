#!/bin/bash
# =============================================================================
# PrintShop OS - Startup Script
# =============================================================================
# Usage: ./scripts/start-printshop.sh [command]
# Commands:
#   start     - Start all services (default)
#   stop      - Stop all services
#   restart   - Restart all services
#   logs      - Follow logs for all services
#   status    - Show service status
#   clean     - Stop and remove all volumes (WARNING: deletes data!)
#   setup     - Initial setup (copy .env, generate secrets)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_msg() {
    echo -e "${2}${1}${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_msg "Error: Docker is not running. Please start Docker first." "$RED"
        exit 1
    fi
}

# Check for Docker Compose V2
check_compose() {
    if ! docker compose version > /dev/null 2>&1; then
        print_msg "Error: Docker Compose V2 is required. Please upgrade Docker." "$RED"
        exit 1
    fi
}

# Generate a random secret
generate_secret() {
    openssl rand -base64 32 2>/dev/null || cat /dev/urandom | head -c 32 | base64
}

# Setup environment file
setup_env() {
    if [ -f .env ]; then
        print_msg "Warning: .env file already exists. Skipping..." "$YELLOW"
        return
    fi

    print_msg "Creating .env file from .env.example..." "$BLUE"
    cp .env.example .env

    # Generate secrets
    print_msg "Generating secure secrets..." "$BLUE"
    
    # Replace placeholder secrets with generated ones
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-jwt-secret-change-this/$(generate_secret | tr -d '\n')/" .env
        sed -i '' "s/your-admin-jwt-secret-change-this/$(generate_secret | tr -d '\n')/" .env
        sed -i '' "s/your-api-token-salt-change-this/$(generate_secret | tr -d '\n')/" .env
        sed -i '' "s/secure_password_change_this/$(generate_secret | tr -d '\n' | head -c 20)/" .env
    else
        # Linux
        sed -i "s/your-jwt-secret-change-this/$(generate_secret | tr -d '\n')/" .env
        sed -i "s/your-admin-jwt-secret-change-this/$(generate_secret | tr -d '\n')/" .env
        sed -i "s/your-api-token-salt-change-this/$(generate_secret | tr -d '\n')/" .env
        sed -i "s/secure_password_change_this/$(generate_secret | tr -d '\n' | head -c 20)/" .env
    fi

    print_msg "✓ .env file created with secure secrets" "$GREEN"
    print_msg "Note: Review .env and update any remaining placeholder values" "$YELLOW"
}

# Start services
start_services() {
    print_msg "🚀 Starting PrintShop OS..." "$BLUE"
    
    # Start databases first
    print_msg "Starting databases (postgres, redis, mongo)..." "$BLUE"
    docker compose up -d postgres redis mongo
    
    # Wait for databases to be healthy
    print_msg "Waiting for databases to be healthy..." "$YELLOW"
    sleep 10
    
    # Check database health
    until docker compose exec -T postgres pg_isready -U strapi > /dev/null 2>&1; do
        print_msg "Waiting for PostgreSQL..." "$YELLOW"
        sleep 2
    done
    print_msg "✓ PostgreSQL is ready" "$GREEN"
    
    until docker compose exec -T redis redis-cli ping > /dev/null 2>&1; do
        print_msg "Waiting for Redis..." "$YELLOW"
        sleep 2
    done
    print_msg "✓ Redis is ready" "$GREEN"
    
    # Start Strapi
    print_msg "Starting Strapi (this may take 1-2 minutes on first run)..." "$BLUE"
    docker compose up -d strapi
    
    # Wait for Strapi
    print_msg "Waiting for Strapi to be ready..." "$YELLOW"
    until curl -s http://localhost:1337 > /dev/null 2>&1; do
        sleep 5
        echo -n "."
    done
    echo ""
    print_msg "✓ Strapi is ready" "$GREEN"
    
    # Start remaining services
    print_msg "Starting remaining services..." "$BLUE"
    docker compose up -d
    
    print_msg "" "$NC"
    print_msg "════════════════════════════════════════════════════════" "$GREEN"
    print_msg "✓ PrintShop OS is running!" "$GREEN"
    print_msg "════════════════════════════════════════════════════════" "$GREEN"
    print_msg "" "$NC"
    print_msg "Service URLs:" "$BLUE"
    print_msg "  Frontend:       http://localhost:5173" "$NC"
    print_msg "  Strapi Admin:   http://localhost:1337/admin" "$NC"
    print_msg "  Strapi API:     http://localhost:1337/api" "$NC"
    print_msg "  API Service:    http://localhost:3001" "$NC"
    print_msg "  Pricing Engine: http://localhost:3003" "$NC"
    print_msg "  Appsmith:       http://localhost:8080" "$NC"
    print_msg "  Botpress:       http://localhost:3100" "$NC"
    print_msg "" "$NC"
    print_msg "View logs: ./scripts/start-printshop.sh logs" "$YELLOW"
}

# Stop services
stop_services() {
    print_msg "Stopping PrintShop OS..." "$BLUE"
    docker compose down
    print_msg "✓ All services stopped" "$GREEN"
}

# Show logs
show_logs() {
    docker compose logs -f
}

# Show status
show_status() {
    print_msg "PrintShop OS Service Status:" "$BLUE"
    docker compose ps
}

# Clean everything (dangerous!)
clean_all() {
    print_msg "⚠️  WARNING: This will delete ALL data!" "$RED"
    read -p "Are you sure? Type 'yes' to confirm: " confirm
    if [ "$confirm" = "yes" ]; then
        print_msg "Stopping and removing all containers and volumes..." "$RED"
        docker compose down -v
        print_msg "✓ All data removed" "$GREEN"
    else
        print_msg "Cancelled." "$YELLOW"
    fi
}

# Main
check_docker
check_compose

case "${1:-start}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        start_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    clean)
        clean_all
        ;;
    setup)
        setup_env
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|clean|setup}"
        exit 1
        ;;
esac
