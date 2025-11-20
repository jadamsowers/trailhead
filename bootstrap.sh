#!/bin/bash

# Scouting Outing Manager - Bootstrap Script
# This script helps you set up the project for first-time use or reset everything

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_header() {
    echo -e "${CYAN}$1${NC}"
}

print_question() {
    echo -e "${BLUE}? $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop first:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

print_header "=========================================="
print_header "Scouting Outing Manager - Bootstrap"
print_header "=========================================="
echo ""

# Determine mode (dev or production)
print_question "Select deployment mode:"
echo "  1) Development (localhost, hot-reload, frontend dev server)"
echo "  2) Production (custom domain, optimized build)"
read -p "Enter choice [1-2] (default: 1): " MODE_CHOICE
MODE_CHOICE=${MODE_CHOICE:-1}

if [ "$MODE_CHOICE" = "2" ]; then
    MODE="production"
    COMPOSE_FILE="docker-compose.prod.yml"
else
    MODE="development"
    COMPOSE_FILE="docker-compose.yml"
fi

print_info "Selected mode: $MODE"
echo ""

# Get host URI
if [ "$MODE" = "production" ]; then
    print_question "Enter the host URI where this will be deployed (e.g., https://outings.example.com):"
    read -p "Host URI: " HOST_URI
    
    if [ -z "$HOST_URI" ]; then
        print_error "Host URI is required for production mode"
        exit 1
    fi
    
    # Extract domain from URI (remove protocol)
    DOMAIN=$(echo "$HOST_URI" | sed -e 's|^[^/]*//||' -e 's|/.*$||')
    print_info "Using domain: $DOMAIN"
else
    HOST_URI="http://localhost:3000"
    DOMAIN="localhost"
    print_info "Using localhost for development"
fi
echo ""

# Database configuration
print_question "Database Configuration:"
read -p "PostgreSQL User (default: scouting_outing): " POSTGRES_USER
POSTGRES_USER=${POSTGRES_USER:-scouting_outing}

read -p "PostgreSQL Password (default: auto-generated): " POSTGRES_PASSWORD
if [ -z "$POSTGRES_PASSWORD" ]; then
    POSTGRES_PASSWORD=$(openssl rand -hex 16)
    print_info "Generated PostgreSQL password: $POSTGRES_PASSWORD"
fi

read -p "PostgreSQL Database Name (default: scouting_outing_manager): " POSTGRES_DB
POSTGRES_DB=${POSTGRES_DB:-scouting_outing_manager}

read -p "PostgreSQL Port (default: 5432): " POSTGRES_PORT
POSTGRES_PORT=${POSTGRES_PORT:-5432}
echo ""

# Security configuration
print_question "Security Configuration:"
read -p "Secret Key (default: auto-generated): " SECRET_KEY
if [ -z "$SECRET_KEY" ]; then
    SECRET_KEY=$(openssl rand -hex 32)
    print_info "Generated secret key"
fi

read -p "Access Token Expire Minutes (default: 15): " ACCESS_TOKEN_EXPIRE_MINUTES
ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES:-15}

read -p "Refresh Token Expire Days (default: 7): " REFRESH_TOKEN_EXPIRE_DAYS
REFRESH_TOKEN_EXPIRE_DAYS=${REFRESH_TOKEN_EXPIRE_DAYS:-7}
echo ""

# Admin user configuration
print_question "Initial Admin User Configuration:"
read -p "Admin Email (default: soadmin@scouthacks.net): " INITIAL_ADMIN_EMAIL
INITIAL_ADMIN_EMAIL=${INITIAL_ADMIN_EMAIL:-soadmin@scouthacks.net}

print_question "Admin Password:"
echo "  1) Auto-generate (recommended)"
echo "  2) Set manually"
read -p "Enter choice [1-2] (default: 1): " ADMIN_PASSWORD_CHOICE
ADMIN_PASSWORD_CHOICE=${ADMIN_PASSWORD_CHOICE:-1}

if [ "$ADMIN_PASSWORD_CHOICE" = "2" ]; then
    read -sp "Enter admin password: " INITIAL_ADMIN_PASSWORD
    echo ""
    if [ -z "$INITIAL_ADMIN_PASSWORD" ]; then
        print_error "Password cannot be empty"
        exit 1
    fi
    print_info "Using manually set password"
else
    # Generate a secure random password (URL-safe base64, 16 bytes = 22 characters)
    INITIAL_ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-22)
    print_success "Generated secure admin password"
fi
echo ""

# CORS configuration
print_question "CORS Configuration:"
if [ "$MODE" = "production" ]; then
    read -p "Allowed CORS Origins (comma-separated, default: $HOST_URI): " BACKEND_CORS_ORIGINS
    BACKEND_CORS_ORIGINS=${BACKEND_CORS_ORIGINS:-$HOST_URI}
else
    BACKEND_CORS_ORIGINS="http://localhost:3000,http://localhost:8000"
    print_info "Using default CORS origins for development: $BACKEND_CORS_ORIGINS"
fi
echo ""

# Summary
print_header "=========================================="
print_header "Configuration Summary"
print_header "=========================================="
echo "Mode: $MODE"
echo "Host URI: $HOST_URI"
echo "PostgreSQL User: $POSTGRES_USER"
echo "PostgreSQL Database: $POSTGRES_DB"
echo "PostgreSQL Port: $POSTGRES_PORT"
echo "Admin Email: $INITIAL_ADMIN_EMAIL"
if [ "$ADMIN_PASSWORD_CHOICE" = "2" ]; then
    echo "Admin Password: [MANUALLY SET]"
else
    echo "Admin Password: [AUTO-GENERATED]"
fi
echo ""

read -p "Continue with this configuration? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    print_info "Bootstrap cancelled"
    exit 0
fi
echo ""

# Cleanup existing containers and volumes
print_header "Cleaning up existing containers..."
$DOCKER_COMPOSE -f $COMPOSE_FILE down 2>/dev/null || true

# Check for volumes
VOLUMES_EXIST=false
VOLUME_NAMES=$(docker volume ls -q | grep -E "postgres_data|scouting.*postgres" || true)

if [ -n "$VOLUME_NAMES" ]; then
    VOLUMES_EXIST=true
    print_info "Found existing volumes:"
    echo "$VOLUME_NAMES" | while read vol; do
        echo "   - $vol"
    done
fi

if [ "$VOLUMES_EXIST" = true ]; then
    print_question "Delete these volumes? (This will remove all database data!)"
    read -p "Delete volumes? [y/N]: " DELETE_VOLUMES
    if [[ "$DELETE_VOLUMES" =~ ^[Yy]$ ]]; then
        print_info "Removing volumes..."
        echo "$VOLUME_NAMES" | xargs -r docker volume rm || true
        print_success "Volumes removed"
    else
        print_info "Keeping existing volumes"
    fi
fi
echo ""

# Create backend .env file
print_header "Creating backend .env file..."
cat > backend/.env << EOF
# Scouting Outing Manager - Environment Configuration
# Generated by bootstrap.sh on $(date)

# Database Configuration
POSTGRES_SERVER=postgres
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
POSTGRES_PORT=$POSTGRES_PORT

# Security Configuration
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=$ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS=$REFRESH_TOKEN_EXPIRE_DAYS

# Application Configuration
PROJECT_NAME=Scouting Outing Manager
VERSION=1.0.0
API_V1_STR=/api
DEBUG=$([ "$MODE" = "development" ] && echo "true" || echo "false")

# CORS Configuration
BACKEND_CORS_ORIGINS=$BACKEND_CORS_ORIGINS

# Initial Admin User Configuration
INITIAL_ADMIN_EMAIL=$INITIAL_ADMIN_EMAIL
INITIAL_ADMIN_PASSWORD=$INITIAL_ADMIN_PASSWORD
EOF

print_success "Backend .env file created"
echo ""

# Create frontend .env file
print_header "Creating frontend .env file..."

# Determine API URL based on mode
if [ "$MODE" = "production" ]; then
    # For production with nginx proxy, use relative path
    # The frontend will be served from the same domain, so /api is correct
    API_URL="/api"
    VITE_API_URL_FOR_BUILD="/api"
else
    API_URL="http://localhost:8000/api"
    VITE_API_URL_FOR_BUILD="http://localhost:8000/api"
fi

cat > frontend/.env << EOF
# Backend API URL
# Generated by bootstrap.sh on $(date)
VITE_API_URL=$API_URL
EOF

print_success "Frontend .env file created"
echo ""

# Create root .env file for docker-compose (for production build args)
if [ "$MODE" = "production" ]; then
    print_header "Creating root .env file for docker-compose..."
    cat > .env << EOF
# Docker Compose Environment Variables
# Generated by bootstrap.sh on $(date)

# Database Configuration
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB

# Security
SECRET_KEY=$SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES=$ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS=$REFRESH_TOKEN_EXPIRE_DAYS

# CORS
BACKEND_CORS_ORIGINS=$BACKEND_CORS_ORIGINS

# Initial Admin User (for database initialization)
INITIAL_ADMIN_EMAIL=$INITIAL_ADMIN_EMAIL
INITIAL_ADMIN_PASSWORD=$INITIAL_ADMIN_PASSWORD
EOF
    cat >> .env << EOF

# Frontend Build
VITE_API_URL=$VITE_API_URL_FOR_BUILD
EOF
    print_success "Root .env file created"
    echo ""
fi

# Build and start services
print_header "Building and starting services..."
print_info "This may take a few minutes on first run..."
echo ""

$DOCKER_COMPOSE -f $COMPOSE_FILE up --build -d

print_info "Waiting for services to be ready..."
sleep 10

# Check if services are running
if $DOCKER_COMPOSE -f $COMPOSE_FILE ps | grep -q "Up\|running"; then
    print_success "Services are running!"
    echo ""
    
    # Wait for database to be ready and initialize
    print_info "Waiting for database to be ready..."
    sleep 5
    
    # Run database initialization
    print_header "Initializing database..."
    
    # For production, we need to pass env vars since .env file isn't mounted
    if [ "$MODE" = "production" ]; then
        docker exec -e INITIAL_ADMIN_EMAIL="$INITIAL_ADMIN_EMAIL" \
                   -e INITIAL_ADMIN_PASSWORD="$INITIAL_ADMIN_PASSWORD" \
                   scouting-outing-backend python -m app.db.init_db || {
            print_error "Database initialization failed. Check logs with:"
            echo "   $DOCKER_COMPOSE -f $COMPOSE_FILE logs backend"
            exit 1
        }
    else
        # For development, the .env file is mounted, so it will be read automatically
        $DOCKER_COMPOSE -f $COMPOSE_FILE exec -T backend python -m app.db.init_db || {
            print_error "Database initialization failed. Check logs with:"
            echo "   $DOCKER_COMPOSE -f $COMPOSE_FILE logs backend"
            exit 1
        }
    fi
    
    echo ""
    
    # Display access information
    print_header "=========================================="
    print_header "Setup Complete!"
    print_header "=========================================="
    echo ""
    
    if [ "$MODE" = "development" ]; then
        print_success "Development mode is active"
        echo ""
        echo "📚 API Documentation:"
        echo "   Swagger UI: http://localhost:8000/docs"
        echo "   ReDoc:      http://localhost:8000/redoc"
        echo ""
        echo "🌐 Frontend:"
        echo "   To start the frontend dev server, run:"
        echo "   cd frontend && npm install && npm start"
        echo "   Then access at: http://localhost:3000"
        echo ""
        echo "🔐 Admin Credentials:"
        echo "   Email: $INITIAL_ADMIN_EMAIL"
        if [ "$ADMIN_PASSWORD_CHOICE" = "2" ]; then
            echo "   Password: [As configured]"
        else
            echo ""
            echo -e "${YELLOW}   ╔════════════════════════════════════════════════════════╗${NC}"
            echo -e "${YELLOW}   ║  GENERATED ADMIN PASSWORD (SAVE THIS!):                 ║${NC}"
            echo -e "${YELLOW}   ║  $INITIAL_ADMIN_PASSWORD${NC}"
            echo -e "${YELLOW}   ╚════════════════════════════════════════════════════════╝${NC}"
            echo ""
        fi
        echo ""
        echo "📊 View logs:"
        echo "   Backend:  $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f backend"
        echo "   Frontend: $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f frontend"
        echo "   All:      $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f"
        echo ""
        echo "🛑 Stop services:"
        echo "   $DOCKER_COMPOSE -f $COMPOSE_FILE down"
    else
        print_success "Production mode is active"
        echo ""
        echo "🌐 Application URL:"
        echo "   $HOST_URI"
        echo ""
        echo "📚 API Documentation:"
        echo "   $HOST_URI/docs"
        echo ""
        echo "🔐 Admin Credentials:"
        echo "   Email: $INITIAL_ADMIN_EMAIL"
        if [ "$ADMIN_PASSWORD_CHOICE" = "2" ]; then
            echo "   Password: [As configured]"
        else
            echo ""
            echo -e "${YELLOW}   ╔════════════════════════════════════════════════════════╗${NC}"
            echo -e "${YELLOW}   ║  GENERATED ADMIN PASSWORD (SAVE THIS!):                 ║${NC}"
            echo -e "${YELLOW}   ║  $INITIAL_ADMIN_PASSWORD${NC}"
            echo -e "${YELLOW}   ╚════════════════════════════════════════════════════════╝${NC}"
            echo ""
        fi
        echo ""
        echo "📊 View logs:"
        echo "   $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f"
        echo ""
        echo "🛑 Stop services:"
        echo "   $DOCKER_COMPOSE -f $COMPOSE_FILE down"
    fi
    
    echo ""
    print_info "Configuration files saved:"
    if [ "$MODE" = "production" ]; then
        echo "   - .env (root, for docker-compose)"
        echo "   - backend/.env"
        echo "   - frontend/.env"
    else
        echo "   - backend/.env"
        echo "   - frontend/.env"
    fi
    echo ""
    print_info "⚠️  IMPORTANT: Change the admin password after first login!"
    
else
    print_error "Failed to start services. Check logs with:"
    echo "   $DOCKER_COMPOSE -f $COMPOSE_FILE logs"
    exit 1
fi

