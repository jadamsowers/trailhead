#!/bin/bash

# Trailhead - Bootstrap Script
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
print_header "Trailhead - Bootstrap"
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
print_question "Select deployment mode:"
echo "  1) Development (localhost, hot-reload, frontend dev server)"
echo "  2) Production (custom domain, optimized build, nginx)"
read -p "Enter choice [1-2] (default: 1): " MODE_CHOICE
MODE_CHOICE=${MODE_CHOICE:-1}

if [ "$MODE_CHOICE" = "2" ]; then
    MODE="production"
    COMPOSE_PROFILE="--profile production"
    RESTART_POLICY="unless-stopped"
    DEBUG="false"
    HEALTHCHECK_INTERVAL="10s"
    BACKEND_PORT=""
else
    MODE="development"
    COMPOSE_PROFILE=""
    RESTART_POLICY="no"
    DEBUG="true"
    HEALTHCHECK_INTERVAL="5s"
    BACKEND_VOLUME_MOUNT="./backend:/app"
    BACKEND_PORT="8000"
fi

print_info "Selected mode: $MODE"
echo ""

# Get host URI (production only)
if [ "$MODE" = "production" ]; then
    # File to persist the production host between runs
    DOMAIN_FILE="production-host.txt"

    if [ -f "$DOMAIN_FILE" ]; then
        print_info "Found $DOMAIN_FILE. Reading saved host URI..."
        HOST_URI=$(cat "$DOMAIN_FILE" | grep -v '^#' | grep -v '^$' | head -n 1 | tr -d '\n\r')
        if [ -n "$HOST_URI" ]; then
            print_success "Loaded host URI from $DOMAIN_FILE"
            print_info "Host URI: $HOST_URI"
            read -p "Use this host URI? [Y/n]: " USE_SAVED_HOST
            USE_SAVED_HOST=${USE_SAVED_HOST:-Y}
            if [[ ! "$USE_SAVED_HOST" =~ ^[Yy]$ ]]; then
                HOST_URI=""
            fi
        else
            print_error "$DOMAIN_FILE exists but is empty or invalid"
            HOST_URI=""
        fi
    fi

    # If not loaded from file, prompt the user
    if [ -z "$HOST_URI" ]; then
        print_question "Enter the host URI where this will be deployed (e.g., https://outings.example.com):"
        read -p "Host URI: " HOST_URI
        if [ -z "$HOST_URI" ]; then
            print_error "Host URI is required for production mode"
            exit 1
        fi

        # Offer to save the host for next time
        echo ""
        read -p "Save this host URI to $DOMAIN_FILE for future runs? [Y/n]: " SAVE_HOST_FILE
        SAVE_HOST_FILE=${SAVE_HOST_FILE:-Y}
        if [[ "$SAVE_HOST_FILE" =~ ^[Yy]$ ]]; then
            cat > "$DOMAIN_FILE" << EOF
# Production host saved by bootstrap.sh on $(date)
# First non-comment, non-empty line is used as the host URI

$HOST_URI
EOF
            print_success "Saved host URI to $DOMAIN_FILE"
            # Add to .gitignore if not already present
            if ! grep -q "^$DOMAIN_FILE\$" .gitignore 2>/dev/null; then
                echo "$DOMAIN_FILE" >> .gitignore
                print_success "Added $DOMAIN_FILE to .gitignore"
            fi
        fi
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

# SSL Certificate Configuration (Production only)
if [ "$MODE" = "production" ]; then
    print_header "SSL Certificate Configuration"
    print_info "For HTTPS support, we need SSL certificates."
    print_info "If you're using Let's Encrypt, certificates are typically in:"
    print_info "  /etc/letsencrypt/live/YOUR_DOMAIN/"
    echo ""

    # Default Let's Encrypt path
    DEFAULT_CERT_DIR="/etc/letsencrypt/live/$DOMAIN"

    # File to persist the SSL certificate directory between runs
    SSL_FILE="production-ssl-cert-dir.txt"

    if [ -f "$SSL_FILE" ]; then
        print_info "Found $SSL_FILE. Reading saved certificate directory..."
        SSL_CERT_DIR=$(cat "$SSL_FILE" | grep -v '^#' | grep -v '^$' | head -n 1 | tr -d '\n\r')
        if [ -n "$SSL_CERT_DIR" ]; then
            print_success "Loaded certificate directory from $SSL_FILE"
            print_info "Certificate directory: $SSL_CERT_DIR"
            read -p "Use this certificate directory? [Y/n]: " USE_SAVED_SSL
            USE_SAVED_SSL=${USE_SAVED_SSL:-Y}
            if [[ ! "$USE_SAVED_SSL" =~ ^[Yy]$ ]]; then
                SSL_CERT_DIR=""
            fi
        else
            print_error "$SSL_FILE exists but is empty or invalid"
            SSL_CERT_DIR=""
        fi
    fi

    # Prompt if not loaded from file
    if [ -z "$SSL_CERT_DIR" ]; then
        print_question "Enter the directory containing your SSL certificates:"
        echo "  Expected files: fullchain.pem and privkey.pem"
        read -p "Certificate directory (default: $DEFAULT_CERT_DIR): " SSL_CERT_DIR
        SSL_CERT_DIR=${SSL_CERT_DIR:-$DEFAULT_CERT_DIR}

        # Offer to save the directory for future runs
        echo ""
        read -p "Save this certificate directory to $SSL_FILE for future runs? [Y/n]: " SAVE_SSL_FILE
        SAVE_SSL_FILE=${SAVE_SSL_FILE:-Y}
        if [[ "$SAVE_SSL_FILE" =~ ^[Yy]$ ]]; then
            cat > "$SSL_FILE" << EOF
# Production SSL certificate directory saved by bootstrap.sh on $(date)
# First non-comment, non-empty line is used as the path

$SSL_CERT_DIR
EOF
            print_success "Saved certificate directory to $SSL_FILE"
            # Add to .gitignore if not already present
            if ! grep -q "^$SSL_FILE\$" .gitignore 2>/dev/null; then
                echo "$SSL_FILE" >> .gitignore
                print_success "Added $SSL_FILE to .gitignore"
            fi
        fi
    fi

    # Validate certificate files exist
    if [ -n "$SSL_CERT_DIR" ] && [ -f "$SSL_CERT_DIR/fullchain.pem" ] && [ -f "$SSL_CERT_DIR/privkey.pem" ]; then
        print_success "Found SSL certificates in $SSL_CERT_DIR"
        SSL_CERT_PATH="$SSL_CERT_DIR/fullchain.pem"
        SSL_KEY_PATH="$SSL_CERT_DIR/privkey.pem"
    else
        print_error "SSL certificate files not found in $SSL_CERT_DIR"
        print_info "Expected files:"
        echo "  - fullchain.pem (or cert.pem)"
        echo "  - privkey.pem (or key.pem)"
        echo ""
        print_question "Do you want to:"
        echo "  1) Enter a different certificate directory"
        echo "  2) Continue without SSL (HTTP only - not recommended for production)"
        read -p "Enter choice [1-2]: " SSL_CHOICE

        if [ "$SSL_CHOICE" = "1" ]; then
            read -p "Certificate directory: " SSL_CERT_DIR
            if [ -f "$SSL_CERT_DIR/fullchain.pem" ] && [ -f "$SSL_CERT_DIR/privkey.pem" ]; then
                print_success "Found SSL certificates"
                SSL_CERT_PATH="$SSL_CERT_DIR/fullchain.pem"
                SSL_KEY_PATH="$SSL_CERT_DIR/privkey.pem"
            else
                print_error "Certificates still not found. Exiting."
                exit 1
            fi
        else
            print_info "Continuing without SSL (HTTP only)"
            SSL_CERT_PATH=""
            SSL_KEY_PATH=""
        fi
    fi
    echo ""
fi

# Database configuration
if [ "$USE_DEFAULTS" = true ]; then
    POSTGRES_USER="trailhead"
    POSTGRES_PASSWORD=$(openssl rand -hex 16)
    POSTGRES_DB="trailhead"
    POSTGRES_PORT=5432
    print_info "Database: Using defaults (user: $POSTGRES_USER, db: $POSTGRES_DB)"
else
    print_question "Database Configuration:"
    read -p "PostgreSQL User (default: trailhead): " POSTGRES_USER
    POSTGRES_USER=${POSTGRES_USER:-trailhead}

    read -p "PostgreSQL Password (default: auto-generated): " POSTGRES_PASSWORD
    if [ -z "$POSTGRES_PASSWORD" ]; then
        POSTGRES_PASSWORD=$(openssl rand -hex 16)
        print_info "Generated PostgreSQL password: $POSTGRES_PASSWORD"
    fi

    read -p "PostgreSQL Database Name (default: trailhead): " POSTGRES_DB
    POSTGRES_DB=${POSTGRES_DB:-trailhead}

    read -p "PostgreSQL Port (default: 5432): " POSTGRES_PORT
    POSTGRES_PORT=${POSTGRES_PORT:-5432}
    echo ""
fi

# Set BACKEND_COMMAND now that database variables are defined
if [ "$MODE" = "production" ]; then
    BACKEND_COMMAND="sh -c 'echo \"Waiting for database...\" && sleep 5 && echo \"Applying migrations with Atlas...\" && export DATABASE_URL=postgresql+asyncpg://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:$POSTGRES_PORT/$POSTGRES_DB && atlas migrate apply --url \$DATABASE_URL && echo \"Initializing database...\" && python -m app.db.init_db || echo \"Database already initialized\" && echo \"Starting server...\" && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload'"
else
    BACKEND_COMMAND="sh -c 'echo \"Waiting for database...\" && sleep 5 && echo \"Applying migrations with Atlas...\" && export DATABASE_URL=postgresql+asyncpg://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:$POSTGRES_PORT/$POSTGRES_DB && atlas migrate apply --url \$DATABASE_URL && echo \"Initializing database...\" && python -m app.db.init_db || echo \"Database already initialized\" && echo \"Starting server...\" && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload'"
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

# Admin user configuration (Clerk-based)
print_header "Initial Admin User Configuration (Clerk-based)"
print_info "The user who signs up with this email in Clerk will automatically get admin role."
echo ""

# Check if admin-email.txt exists
if [ -f "admin-email.txt" ]; then
    print_info "Found admin-email.txt file. Reading admin email..."
    INITIAL_ADMIN_EMAIL=$(cat admin-email.txt | grep -v '^#' | grep -v '^$' | head -n 1 | tr -d '\n\r')
    if [ -n "$INITIAL_ADMIN_EMAIL" ]; then
        print_success "Loaded admin email from admin-email.txt"
        print_info "Admin Email: $INITIAL_ADMIN_EMAIL"
        echo ""
        read -p "Use this email? [Y/n]: " USE_ADMIN_FILE
        USE_ADMIN_FILE=${USE_ADMIN_FILE:-Y}
        if [[ ! "$USE_ADMIN_FILE" =~ ^[Yy]$ ]]; then
            INITIAL_ADMIN_EMAIL=""
        fi
    else
        print_error "admin-email.txt exists but email is missing or invalid"
        INITIAL_ADMIN_EMAIL=""
    fi
fi

# If email not loaded from file, ask user
if [ -z "$INITIAL_ADMIN_EMAIL" ]; then
    print_question "Enter the admin email address:"
    echo "  This email will automatically get admin role when signing in via Clerk"
    echo "  Or press Enter to use default (soadmin@scouthacks.net)"
    echo ""
    
    read -p "Admin Email: " INITIAL_ADMIN_EMAIL
    if [ -z "$INITIAL_ADMIN_EMAIL" ]; then
        INITIAL_ADMIN_EMAIL="soadmin@scouthacks.net"
        print_info "Using default admin email"
    fi
    
    # Offer to save email to file
    echo ""
    print_question "Save admin email to admin-email.txt for future use?"
    echo "  This file will be automatically added to .gitignore"
    read -p "Save email? [Y/n]: " SAVE_ADMIN_EMAIL
    SAVE_ADMIN_EMAIL=${SAVE_ADMIN_EMAIL:-Y}
    if [[ "$SAVE_ADMIN_EMAIL" =~ ^[Yy]$ ]]; then
        cat > admin-email.txt << EOF
# Initial Admin Email Configuration
# Generated by bootstrap.sh on $(date)
# The user who signs up with this email in Clerk will automatically get admin role

$INITIAL_ADMIN_EMAIL
EOF
        print_success "Admin email saved to admin-email.txt"
        
        # Add to .gitignore if not already there
        if ! grep -q "admin-email.txt" .gitignore 2>/dev/null; then
            echo "admin-email.txt" >> .gitignore
            print_success "Added admin-email.txt to .gitignore"
        fi
    fi
fi

print_info "Admin email set to: $INITIAL_ADMIN_EMAIL"
print_info "This user will be granted admin role on first Clerk sign-in"
echo ""

# CORS configuration
print_question "CORS Configuration:"
if [ "$MODE" = "production" ]; then
    read -p "Allowed CORS Origins (comma-separated, default: $HOST_URI): " BACKEND_CORS_ORIGINS
    BACKEND_CORS_ORIGINS=${BACKEND_CORS_ORIGINS:-$HOST_URI}
else
    if [ "$USE_DEFAULTS" = false ]; then
        read -p "Allowed CORS Origins (comma-separated, default: http://localhost:3000,http://localhost:8000): " BACKEND_CORS_ORIGINS
    fi
    BACKEND_CORS_ORIGINS=${BACKEND_CORS_ORIGINS:-http://localhost:3000,http://localhost:8000}
    print_info "Using CORS origins: $BACKEND_CORS_ORIGINS"
fi
echo ""

# Clerk configuration
print_header "Clerk Authentication Configuration"
print_info "Clerk provides modern, secure authentication for your application."
print_info "Get your API keys from: https://dashboard.clerk.com"
echo ""

# Check if clerk-keys.txt exists
if [ -f "clerk-keys.txt" ]; then
    print_info "Found clerk-keys.txt file. Reading Clerk keys..."
    source clerk-keys.txt
    if [ -n "$CLERK_SECRET_KEY" ] && [ -n "$CLERK_PUBLISHABLE_KEY" ]; then
        print_success "Loaded Clerk keys from clerk-keys.txt"
        MASKED_SECRET="${CLERK_SECRET_KEY:0:10}...${CLERK_SECRET_KEY: -4}"
        MASKED_PUBLIC="${CLERK_PUBLISHABLE_KEY:0:10}...${CLERK_PUBLISHABLE_KEY: -4}"
        print_info "Secret Key: $MASKED_SECRET"
        print_info "Publishable Key: $MASKED_PUBLIC"
        echo ""
        read -p "Use these keys? [Y/n]: " USE_CLERK_FILE
        USE_CLERK_FILE=${USE_CLERK_FILE:-Y}
        if [[ ! "$USE_CLERK_FILE" =~ ^[Yy]$ ]]; then
            CLERK_SECRET_KEY=""
            CLERK_PUBLISHABLE_KEY=""
        fi
    else
        print_error "clerk-keys.txt exists but keys are missing or invalid"
        CLERK_SECRET_KEY=""
        CLERK_PUBLISHABLE_KEY=""
    fi
fi

# If keys not loaded from file, ask user
if [ -z "$CLERK_SECRET_KEY" ] || [ -z "$CLERK_PUBLISHABLE_KEY" ]; then
    print_question "Enter your Clerk API keys:"
    echo "  You can get these from https://dashboard.clerk.com"
    echo "  Or press Enter to use placeholder values (you'll need to update them later)"
            echo ""
    
    read -p "Clerk Secret Key (starts with sk_): " CLERK_SECRET_KEY
    if [ -z "$CLERK_SECRET_KEY" ]; then
        CLERK_SECRET_KEY="sk_test_your_clerk_secret_key_here"
        print_info "Using placeholder secret key - update this before running!"
    fi
    
    read -p "Clerk Publishable Key (starts with pk_): " CLERK_PUBLISHABLE_KEY
    if [ -z "$CLERK_PUBLISHABLE_KEY" ]; then
        CLERK_PUBLISHABLE_KEY="pk_test_your_clerk_publishable_key_here"
        print_info "Using placeholder publishable key - update this before running!"
    fi
    
    # Offer to save keys to file
    echo ""
    print_question "Save Clerk keys to clerk-keys.txt for future use?"
    echo "  This file will be automatically added to .gitignore"
    read -p "Save keys? [Y/n]: " SAVE_CLERK_KEYS
    SAVE_CLERK_KEYS=${SAVE_CLERK_KEYS:-Y}
    if [[ "$SAVE_CLERK_KEYS" =~ ^[Yy]$ ]]; then
        cat > clerk-keys.txt << EOF
# Clerk API Keys
# Generated by bootstrap.sh on $(date)
# Get your keys from https://dashboard.clerk.com

CLERK_SECRET_KEY=$CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY
EOF
        print_success "Clerk keys saved to clerk-keys.txt"
    fi
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
echo "Admin Email: $INITIAL_ADMIN_EMAIL (Clerk-based, no password needed)"
echo "Clerk Secret Key: ${CLERK_SECRET_KEY:0:10}...${CLERK_SECRET_KEY: -4}"
echo "Clerk Publishable Key: ${CLERK_PUBLISHABLE_KEY:0:10}...${CLERK_PUBLISHABLE_KEY: -4}"
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
# Trailhead - Credentials
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
ADMIN USER CONFIGURATION (CLERK-BASED)
========================================
Admin Email: $INITIAL_ADMIN_EMAIL

NOTE: Create a Clerk account with this email address.
On first sign-in, you will automatically be granted admin role.
No password is stored in the database - authentication is handled by Clerk.

========================================
CLERK CONFIGURATION
========================================
Clerk Secret Key: $CLERK_SECRET_KEY
Clerk Publishable Key: $CLERK_PUBLISHABLE_KEY

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
Clerk Dashboard: https://dashboard.clerk.com
EOF
    else
        cat >> "$CREDENTIALS_FILE" << EOF
Application: $HOST_URI
API Docs: $HOST_URI/docs
Clerk Dashboard: https://dashboard.clerk.com
EOF
    fi

    print_success "Credentials saved to $CREDENTIALS_FILE"
    echo ""
fi

# Cleanup existing containers and volumes
print_header "Cleaning up existing containers..."
$DOCKER_COMPOSE down 2>/dev/null || true


# Check for Docker volumes related to postgres
VOLUMES_EXIST=false
# More flexible pattern: matches any volume with 'postgres' in the name
# Silence docker errors to avoid accidental output injection
VOLUME_NAMES=$(docker volume ls -q 2>/dev/null | grep -i 'postgres' || true)

print_info "Debug: Detected Docker volumes matching 'postgres':"
echo "$VOLUME_NAMES"

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
# Precompute FRONTEND_URL to avoid subshells inside heredocs
FRONTEND_URL_VALUE=$([ "$MODE" = "development" ] && echo "http://localhost:3000" || echo "$HOST_URI")
cat > backend/.env << EOF
# Trailhead - Environment Configuration
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
PROJECT_NAME=Trailhead
VERSION=1.0.0
API_V1_STR=/api
DEBUG=$DEBUG

# CORS Configuration
BACKEND_CORS_ORIGINS=$BACKEND_CORS_ORIGINS

# Initial Admin User Configuration (Clerk-based)
INITIAL_ADMIN_EMAIL=$INITIAL_ADMIN_EMAIL

# Clerk Configuration
CLERK_SECRET_KEY=$CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY
FRONTEND_URL=$FRONTEND_URL_VALUE
EOF

print_success "Backend .env file created"
echo ""

# Create frontend .env file
print_header "Creating frontend .env file..."

# Determine API URL based on mode
if [ "$MODE" = "production" ]; then
    # In production, frontend accesses backend through nginx at /api
    API_URL="/api"
else
    API_URL="http://localhost:8000/api"
fi

cat > frontend/.env << EOF
# Frontend Environment Configuration
# Generated by bootstrap.sh on $(date)

# Backend API URL
VITE_API_URL=$API_URL

# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY
EOF

print_success "Frontend .env file created"
echo ""

# Create root .env file for docker-compose
print_header "Creating root .env file for docker-compose..."
# Precompute values to avoid subshells inside heredocs (prevents unexpected command output)
COMPOSE_PROFILES_VALUE=$([ "$MODE" = "production" ] && echo "production" || echo "")
FRONTEND_URL_VALUE=$FRONTEND_URL_VALUE
cat > .env << EOF
# Docker Compose Environment Variables
# Generated by bootstrap.sh on $(date)

# Deployment Mode
RESTART_POLICY=$RESTART_POLICY
DEBUG=$DEBUG
HEALTHCHECK_INTERVAL=$HEALTHCHECK_INTERVAL

# Compose profiles (useful for docker compose v2 profiles)
# Will be set to 'production' when running in production mode
COMPOSE_PROFILES=$COMPOSE_PROFILES_VALUE

# Database Configuration
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
POSTGRES_PORT=$POSTGRES_PORT

# Security
SECRET_KEY=$SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES=$ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS=$REFRESH_TOKEN_EXPIRE_DAYS

# CORS
BACKEND_CORS_ORIGINS=$BACKEND_CORS_ORIGINS

# Initial Admin User (Clerk-based)
INITIAL_ADMIN_EMAIL=$INITIAL_ADMIN_EMAIL

# Clerk Configuration
CLERK_SECRET_KEY=$CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY
FRONTEND_URL=$FRONTEND_URL_VALUE

# Backend Configuration
BACKEND_COMMAND=sh -c 'echo "Waiting for database..." && sleep 5 && echo "Applying migrations with Atlas..." && atlas migrate apply --url "postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:$POSTGRES_PORT/$POSTGRES_DB?sslmode=disable" && echo "Initializing database..." && python -m app.db.init_db || echo "Database already initialized" && echo "Starting server..." && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload'
BACKEND_VOLUME_MOUNT=$BACKEND_VOLUME_MOUNT
BACKEND_PORT=$BACKEND_PORT
EOF

if [ "$MODE" = "production" ]; then
    cat >> .env << EOF

# Frontend Build
VITE_API_URL=$API_URL

# SSL Configuration
SSL_CERT_PATH=$SSL_CERT_PATH
SSL_KEY_PATH=$SSL_KEY_PATH
EOF
fi

print_success "Root .env file created"
echo ""

# Validate .env for malformed keys (keys containing spaces or missing '=')
print_info "Validating generated .env for malformed keys..."
OFFENDING_KEYS=$(awk '
    /^[[:space:]]*#/ {next}
    /^[[:space:]]*$/ {next}
    { i = index($0, "=");
      if (i == 0) { print "MISSING_EQUALS: "$0; next }
      key = substr($0, 1, i-1);
      gsub(/^[ \t]+|[ \t]+$/, "", key);
      if (key ~ / /) print key
    }' .env || true)

if [ -n "$OFFENDING_KEYS" ]; then
    print_error "Detected malformed .env keys (contain spaces or invalid lines):"
    echo "$OFFENDING_KEYS"
    echo ""
    read -p "Attempt to auto-sanitize keys by replacing spaces with underscores? [Y/n]: " SANITIZE_CHOICE
    SANITIZE_CHOICE=${SANITIZE_CHOICE:-Y}
    if [[ "$SANITIZE_CHOICE" =~ ^[Yy]$ ]]; then
        cp .env .env.bak
        awk '
            /^[[:space:]]*#/ {print; next}
            /^[[:space:]]*$/ {print; next}
            { i = index($0, "=");
              if (i == 0) { print $0; next }
              key = substr($0, 1, i-1);
              val = substr($0, i+1);
              gsub(/^[ \t]+|[ \t]+$/, "", key);
              gsub(/^[ \t]+|[ \t]+$/, "", val);
              gsub(/[ \t]+/, "_", key);
              print key "=" val
            }' .env.bak > .env
        print_success "Sanitized .env saved (original backed up to .env.bak)"
        echo ""
    else
        print_error "Please fix .env (remove spaces in keys) and re-run bootstrap. Aborting."
        exit 1
    fi
else
    print_success ".env validation passed"
    echo ""
fi

# Build and start services
print_header "Building and starting services..."
print_info "This may take a few minutes on first run..."
echo ""

$DOCKER_COMPOSE $COMPOSE_PROFILE up --build -d

print_info "Waiting for services to be ready..."
sleep 10

# Check if services are running
if $DOCKER_COMPOSE ps | grep -q "Up\|running"; then
    print_success "Services are running!"
    echo ""
    
    # Wait for database to be ready and initialize
    print_info "Waiting for database to be ready..."
    sleep 5
    
    # Run database initialization (just verifies connection with Clerk)
    print_header "Verifying database connection..."
    
    if [ "$MODE" = "production" ]; then
        docker exec trailhead-backend python -m app.db.init_db || {
            print_error "Database verification failed. Check logs with:"
            echo "   $DOCKER_COMPOSE logs backend"
            exit 1
        }
    else
        $DOCKER_COMPOSE exec -T backend python -m app.db.init_db || {
            print_error "Database verification failed. Check logs with:"
            echo "   $DOCKER_COMPOSE logs backend"
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
        echo "🔐 Clerk Dashboard:"
        echo "   URL: https://dashboard.clerk.com"
        echo ""
        echo "🌐 Frontend:"
        echo "   To start the frontend dev server, run:"
        echo "   cd frontend && npm install && npm start"
        echo "   Then access at: http://localhost:3000"
        echo ""
        echo "🔐 Admin Setup (Clerk-based):"
        echo ""
        echo -e "${YELLOW}   ╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}   ║  ADMIN EMAIL: $INITIAL_ADMIN_EMAIL${NC}"
        echo -e "${YELLOW}   ║                                                         ║${NC}"
        echo -e "${YELLOW}   ║  To become admin:                                       ║${NC}"
        echo -e "${YELLOW}   ║  1. Go to https://dashboard.clerk.com                   ║${NC}"
        echo -e "${YELLOW}   ║  2. Create account with the email above                 ║${NC}"
        echo -e "${YELLOW}   ║  3. Sign in to the app - you'll auto-get admin role     ║${NC}"
        echo -e "${YELLOW}   ╚════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo ""
        echo "📊 View logs:"
        echo "   Backend:  $DOCKER_COMPOSE logs -f backend"
        echo "   All:      $DOCKER_COMPOSE logs -f"
        echo ""
        echo "🛑 Stop services:"
        echo "   $DOCKER_COMPOSE down"
    else
        print_success "Production mode is active"
        echo ""
        echo "🌐 Application URL:"
        echo "   $HOST_URI"
        echo ""
        echo "📚 API Documentation:"
        echo "   $HOST_URI/docs"
        echo ""
        echo "🔐 Clerk Dashboard:"
        echo "   URL: https://dashboard.clerk.com"
        echo ""
        echo "🔐 Admin Setup (Clerk-based):"
        echo ""
        echo -e "${YELLOW}   ╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}   ║  ADMIN EMAIL: $INITIAL_ADMIN_EMAIL${NC}"
        echo -e "${YELLOW}   ║                                                         ║${NC}"
        echo -e "${YELLOW}   ║  To become admin:                                       ║${NC}"
        echo -e "${YELLOW}   ║  1. Go to https://dashboard.clerk.com                   ║${NC}"
        echo -e "${YELLOW}   ║  2. Create account with the email above                 ║${NC}"
        echo -e "${YELLOW}   ║  3. Sign in to the app - you'll auto-get admin role     ║${NC}"
        echo -e "${YELLOW}   ╚════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo ""
        echo "📊 View logs:"
        echo "   $DOCKER_COMPOSE logs -f"
        echo ""
        echo "🛑 Stop services:"
        echo "   $DOCKER_COMPOSE down"
    fi
    
    echo ""
    print_info "Configuration files saved:"
    echo "   - .env (root, for docker-compose)"
    echo "   - backend/.env"
    echo "   - frontend/.env"
    
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
    echo "   $DOCKER_COMPOSE logs"
    exit 1
fi
