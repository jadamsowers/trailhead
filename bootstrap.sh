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

# Ask if user wants quick setup with defaults
print_question "Setup mode:"
echo "  1) Quick setup (use all default values)"
echo "  2) Custom setup (configure all options)"
read -p "Enter choice [1-2] (default: 1): " SETUP_MODE
SETUP_MODE=${SETUP_MODE:-1}

if [ "$SETUP_MODE" = "1" ]; then
    print_info "Using quick setup with default values..."
    USE_DEFAULTS=true
else
    USE_DEFAULTS=false
fi
echo ""

# Ask if user wants to save credentials to a file
print_question "Save credentials to file?"
echo "  This will create a 'credentials.txt' file with all generated passwords and secrets."
echo "  The file will be automatically added to .gitignore to prevent accidental commits."
read -p "Save credentials? [Y/n]: " SAVE_CREDENTIALS
SAVE_CREDENTIALS=${SAVE_CREDENTIALS:-Y}
if [[ "$SAVE_CREDENTIALS" =~ ^[Yy]$ ]]; then
    SAVE_CREDS=true
    CREDENTIALS_FILE="credentials.txt"
else
    SAVE_CREDS=false
fi
echo ""

# Determine mode (dev or production)
if [ "$USE_DEFAULTS" = true ]; then
    MODE="development"
    MODE_CHOICE=1
    print_info "Selected mode: development"
else
    print_question "Select deployment mode:"
    echo "  1) Development (localhost, hot-reload, frontend dev server)"
    echo "  2) Production (custom domain, optimized build)"
    read -p "Enter choice [1-2] (default: 1): " MODE_CHOICE
    MODE_CHOICE=${MODE_CHOICE:-1}
fi

if [ "$MODE_CHOICE" = "2" ]; then
    MODE="production"
    COMPOSE_FILE="docker-compose.prod.yml"
else
    MODE="development"
    COMPOSE_FILE="docker-compose.yml"
fi

if [ "$MODE_CHOICE" = "2" ]; then
    MODE="production"
else
    MODE="development"
fi

if [ "$USE_DEFAULTS" = false ]; then
    print_info "Selected mode: $MODE"
fi
echo ""

# Get host URI
if [ "$MODE" = "production" ] && [ "$USE_DEFAULTS" = false ]; then
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
if [ "$USE_DEFAULTS" = true ]; then
    POSTGRES_USER="scouting_outing"
    POSTGRES_PASSWORD=$(openssl rand -hex 16)
    POSTGRES_DB="scouting_outing_manager"
    POSTGRES_PORT=5432
    print_info "Database: Using defaults (user: $POSTGRES_USER, db: $POSTGRES_DB)"
else
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
fi

# Security configuration
if [ "$USE_DEFAULTS" = true ]; then
    SECRET_KEY=$(openssl rand -hex 32)
    ACCESS_TOKEN_EXPIRE_MINUTES=15
    REFRESH_TOKEN_EXPIRE_DAYS=7
    print_info "Security: Using defaults (token expiry: 15 min / 7 days)"
else
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
fi

# Admin user configuration
if [ "$USE_DEFAULTS" = true ]; then
    print_question "Initial Admin User Configuration:"
    read -p "Admin Email (default: soadmin@scouthacks.net): " INITIAL_ADMIN_EMAIL
    INITIAL_ADMIN_EMAIL=${INITIAL_ADMIN_EMAIL:-soadmin@scouthacks.net}
    INITIAL_ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-22)
    ADMIN_PASSWORD_CHOICE=1
    print_info "Admin password will be auto-generated"
    echo ""
else
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
fi

# CORS configuration
if [ "$USE_DEFAULTS" = true ]; then
    if [ "$MODE" = "production" ]; then
        BACKEND_CORS_ORIGINS="$HOST_URI"
    else
        BACKEND_CORS_ORIGINS="http://localhost:3000,http://localhost:8000,http://localhost:8080"
    fi
    print_info "CORS: Using defaults"
else
    print_question "CORS Configuration:"
    if [ "$MODE" = "production" ]; then
        read -p "Allowed CORS Origins (comma-separated, default: $HOST_URI): " BACKEND_CORS_ORIGINS
        BACKEND_CORS_ORIGINS=${BACKEND_CORS_ORIGINS:-$HOST_URI}
    else
        BACKEND_CORS_ORIGINS="http://localhost:3000,http://localhost:8000,http://localhost:8080"
        print_info "Using default CORS origins for development: $BACKEND_CORS_ORIGINS"
    fi
    echo ""
fi

# Keycloak configuration
if [ "$USE_DEFAULTS" = true ]; then
    KEYCLOAK_ADMIN_USER="admin"
    KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-22)
    KEYCLOAK_CLIENT_SECRET=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-22)
    KEYCLOAK_REALM="scouting-outing"
    KEYCLOAK_DB_USER="keycloak"
    KEYCLOAK_DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-22)
    print_info "Keycloak: Using defaults (admin: $KEYCLOAK_ADMIN_USER, realm: $KEYCLOAK_REALM)"
else
    print_question "Keycloak OAuth Configuration:"
    read -p "Keycloak Admin User (default: admin): " KEYCLOAK_ADMIN_USER
    KEYCLOAK_ADMIN_USER=${KEYCLOAK_ADMIN_USER:-admin}

    read -p "Keycloak Admin Password (default: auto-generated): " KEYCLOAK_ADMIN_PASSWORD
    if [ -z "$KEYCLOAK_ADMIN_PASSWORD" ]; then
        KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-22)
        print_info "Generated Keycloak admin password: $KEYCLOAK_ADMIN_PASSWORD"
    fi

    read -p "Keycloak Client Secret (default: auto-generated): " KEYCLOAK_CLIENT_SECRET
    if [ -z "$KEYCLOAK_CLIENT_SECRET" ]; then
        KEYCLOAK_CLIENT_SECRET=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-22)
        print_info "Generated Keycloak client secret"
    fi

    read -p "Keycloak Realm Name (default: scouting-outing): " KEYCLOAK_REALM
    KEYCLOAK_REALM=${KEYCLOAK_REALM:-scouting-outing}

    read -p "Keycloak Database User (default: keycloak): " KEYCLOAK_DB_USER
    KEYCLOAK_DB_USER=${KEYCLOAK_DB_USER:-keycloak}

    read -p "Keycloak Database Password (default: auto-generated): " KEYCLOAK_DB_PASSWORD
    if [ -z "$KEYCLOAK_DB_PASSWORD" ]; then
        KEYCLOAK_DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-22)
        print_info "Generated Keycloak database password"
    fi
    echo ""
fi

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
echo "Keycloak Realm: $KEYCLOAK_REALM"
echo "Keycloak Admin User: $KEYCLOAK_ADMIN_USER"
echo ""

read -p "Continue with this configuration? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    print_info "Bootstrap cancelled"
    exit 0
fi
echo ""

# Initialize credentials file if requested
if [ "$SAVE_CREDS" = true ]; then
    print_header "Creating credentials file..."
    cat > "$CREDENTIALS_FILE" << EOF
# Scouting Outing Manager - Credentials
# Generated by bootstrap.sh on $(date)
#
# ⚠️  IMPORTANT: Keep this file secure and do not commit it to version control!
# This file is automatically added to .gitignore

========================================
DEPLOYMENT CONFIGURATION
========================================
Mode: $MODE
Host URI: $HOST_URI
Domain: $DOMAIN

========================================
DATABASE CREDENTIALS
========================================
PostgreSQL User: $POSTGRES_USER
PostgreSQL Password: $POSTGRES_PASSWORD
PostgreSQL Database: $POSTGRES_DB
PostgreSQL Port: $POSTGRES_PORT

========================================
SECURITY CONFIGURATION
========================================
Secret Key: $SECRET_KEY
Access Token Expire Minutes: $ACCESS_TOKEN_EXPIRE_MINUTES
Refresh Token Expire Days: $REFRESH_TOKEN_EXPIRE_DAYS

========================================
ADMIN USER CREDENTIALS
========================================
Admin Email: $INITIAL_ADMIN_EMAIL
Admin Password: $INITIAL_ADMIN_PASSWORD

========================================
KEYCLOAK CONFIGURATION
========================================
Keycloak Admin User: $KEYCLOAK_ADMIN_USER
Keycloak Admin Password: $KEYCLOAK_ADMIN_PASSWORD
Keycloak Realm: $KEYCLOAK_REALM
Keycloak Client Secret: $KEYCLOAK_CLIENT_SECRET
Keycloak Database User: $KEYCLOAK_DB_USER
Keycloak Database Password: $KEYCLOAK_DB_PASSWORD

========================================
ACCESS URLS
========================================
EOF

    if [ "$MODE" = "development" ]; then
        cat >> "$CREDENTIALS_FILE" << EOF
Frontend: http://localhost:3000
Backend API: http://localhost:8000
API Docs (Swagger): http://localhost:8000/docs
API Docs (ReDoc): http://localhost:8000/redoc
Keycloak Admin: http://localhost:8080
EOF
    else
        cat >> "$CREDENTIALS_FILE" << EOF
Application: $HOST_URI
API Docs: $HOST_URI/docs
Keycloak Admin: ${HOST_URI%/*}:8080
EOF
    fi

    print_success "Credentials saved to $CREDENTIALS_FILE"
    echo ""
fi

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

# Keycloak OAuth/OIDC Configuration
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=$KEYCLOAK_REALM
KEYCLOAK_CLIENT_ID=scouting-outing-backend
KEYCLOAK_CLIENT_SECRET=$KEYCLOAK_CLIENT_SECRET
KEYCLOAK_ADMIN_USER=$KEYCLOAK_ADMIN_USER
KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_ADMIN_PASSWORD
FRONTEND_URL=$([ "$MODE" = "development" ] && echo "http://localhost:3000" || echo "$HOST_URI")
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

# Create root .env file for docker-compose
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

# Keycloak Configuration
KEYCLOAK_ADMIN_USER=$KEYCLOAK_ADMIN_USER
KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_ADMIN_PASSWORD
KEYCLOAK_DB_USER=$KEYCLOAK_DB_USER
KEYCLOAK_DB_PASSWORD=$KEYCLOAK_DB_PASSWORD
KC_DB_USERNAME=$KEYCLOAK_DB_USER
KC_DB_PASSWORD=$KEYCLOAK_DB_PASSWORD
KEYCLOAK_REALM=$KEYCLOAK_REALM
KEYCLOAK_CLIENT_SECRET=$KEYCLOAK_CLIENT_SECRET
FRONTEND_URL=$([ "$MODE" = "development" ] && echo "http://localhost:3000" || echo "$HOST_URI")
EOF

if [ "$MODE" = "production" ]; then
    cat >> .env << EOF

# Frontend Build
VITE_API_URL=$VITE_API_URL_FOR_BUILD
EOF
fi

print_success "Root .env file created"
echo ""

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
    
    # Wait for Keycloak to be ready
    print_info "Waiting for Keycloak to be ready..."
    sleep 10  # Keycloak takes longer to start
    
    # Initialize Keycloak
    print_header "Initializing Keycloak..."
    if command -v jq &> /dev/null; then
        # Use the init script if jq is available
        export KEYCLOAK_URL="http://localhost:8080"
        export KEYCLOAK_ADMIN="$KEYCLOAK_ADMIN_USER"
        export KEYCLOAK_ADMIN_PASSWORD="$KEYCLOAK_ADMIN_PASSWORD"
        export REALM_NAME="$KEYCLOAK_REALM"
        export KEYCLOAK_CLIENT_SECRET="$KEYCLOAK_CLIENT_SECRET"
        export FRONTEND_URL="$([ "$MODE" = "development" ] && echo "http://localhost:3000" || echo "$HOST_URI")"
        export BACKEND_URL="$([ "$MODE" = "development" ] && echo "http://localhost:8000" || echo "${HOST_URI%/*}:8000")"
        
        # Wait a bit more for Keycloak to be fully ready
        print_info "Waiting for Keycloak to be fully ready..."
        for i in {1..30}; do
            if curl -f -s "${KEYCLOAK_URL}/realms/master" > /dev/null 2>&1; then
                print_success "Keycloak is ready!"
                break
            fi
            echo -n "."
            sleep 2
        done
        echo ""
        
        if [ -f "./keycloak/init-keycloak.sh" ]; then
            chmod +x ./keycloak/init-keycloak.sh
            ./keycloak/init-keycloak.sh && {
                print_success "Keycloak configured successfully!"
                print_info "Realm: $KEYCLOAK_REALM"
                print_info "Backend Client: scouting-outing-backend"
                print_info "Frontend Client: scouting-outing-frontend"
            } || {
                print_error "Keycloak initialization script failed."
                print_info "You may need to configure Keycloak manually."
                print_info "Access Keycloak Admin Console at: http://localhost:8080"
                print_info "Login with: $KEYCLOAK_ADMIN_USER / $KEYCLOAK_ADMIN_PASSWORD"
            }
        else
            print_error "Keycloak initialization script not found at ./keycloak/init-keycloak.sh"
            print_info "Please configure Keycloak manually."
            print_info "Access Keycloak Admin Console at: http://localhost:8080"
        fi
    else
        print_error "jq is not installed. Skipping automatic Keycloak initialization."
        print_info "Please install jq (brew install jq on macOS) or configure Keycloak manually:"
        print_info "  Access Keycloak Admin Console at: http://localhost:8080"
        print_info "  Login with: $KEYCLOAK_ADMIN_USER / $KEYCLOAK_ADMIN_PASSWORD"
        print_info ""
        print_info "Manual configuration steps:"
        print_info "  1. Create realm: $KEYCLOAK_REALM"
        print_info "  2. Create backend client: scouting-outing-backend (confidential)"
        print_info "  3. Create frontend client: scouting-outing-frontend (public)"
        print_info "  4. Create roles: parent, admin"
    fi
    echo ""
    
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
        echo "🔐 Keycloak Admin Console:"
        echo "   URL: http://localhost:8080"
        echo "   Username: $KEYCLOAK_ADMIN_USER"
        echo "   Password: $KEYCLOAK_ADMIN_PASSWORD"
        echo ""
        echo "🌐 Frontend:"
        echo "   To start the frontend dev server, run:"
        echo "   cd frontend && npm install && npm start"
        echo "   Then access at: http://localhost:3000"
        echo ""
        echo "🔐 Admin Credentials:"
        if [ "$ADMIN_PASSWORD_CHOICE" = "2" ]; then
            echo "   Email: $INITIAL_ADMIN_EMAIL"
            echo "   Password: [As configured]"
        else
            echo ""
            echo -e "${YELLOW}   ╔════════════════════════════════════════════════════════╗${NC}"
            echo -e "${YELLOW}   ║  ADMIN CREDENTIALS (SAVE THESE!):                       ║${NC}"
            echo -e "${YELLOW}   ║  Email:    $INITIAL_ADMIN_EMAIL${NC}"
            echo -e "${YELLOW}   ║  Password: $INITIAL_ADMIN_PASSWORD${NC}"
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
        echo "🔐 Keycloak Admin Console:"
        echo "   URL: ${HOST_URI%/*}:8080"  # Remove path, add :8080
        echo "   Username: $KEYCLOAK_ADMIN_USER"
        echo "   Password: $KEYCLOAK_ADMIN_PASSWORD"
        echo ""
        echo "🔐 Admin Credentials:"
        if [ "$ADMIN_PASSWORD_CHOICE" = "2" ]; then
            echo "   Email: $INITIAL_ADMIN_EMAIL"
            echo "   Password: [As configured]"
        else
            echo ""
            echo -e "${YELLOW}   ╔════════════════════════════════════════════════════════╗${NC}"
            echo -e "${YELLOW}   ║  ADMIN CREDENTIALS (SAVE THESE!):                       ║${NC}"
            echo -e "${YELLOW}   ║  Email:    $INITIAL_ADMIN_EMAIL${NC}"
            echo -e "${YELLOW}   ║  Password: $INITIAL_ADMIN_PASSWORD${NC}"
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
    
    if [ "$SAVE_CREDS" = true ]; then
        echo ""
        print_success "Credentials file saved:"
        echo "   - $CREDENTIALS_FILE"
        echo ""
        print_info "⚠️  IMPORTANT: Keep this file secure!"
        echo "   This file contains sensitive passwords and secrets."
        echo "   It has been added to .gitignore to prevent accidental commits."
    fi
    
else
    print_error "Failed to start services. Check logs with:"
    echo "   $DOCKER_COMPOSE -f $COMPOSE_FILE logs"
    exit 1
fi

