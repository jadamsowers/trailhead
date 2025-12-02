#!/bin/bash

# Gather configuration from user or config files
# Creates a bootstrap_config.env file with all settings

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib_utils.sh"

CONFIG_FILE="$SCRIPT_DIR/bootstrap_config.env"

print_header "=========================================="
print_header "Configuration Gathering"
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
    COMPOSE_PROFILE="production"
    RESTART_POLICY="unless-stopped"
    DEBUG="false"
    HEALTHCHECK_INTERVAL="10s"
    BACKEND_VOLUME_MOUNT=""
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
    DOMAIN_FILE="production-host.txt"

    if [ -f "$DOMAIN_FILE" ]; then
        print_info "Found $DOMAIN_FILE. Reading saved host URI..."
        HOST_URI=$(read_config_file "$DOMAIN_FILE")
        if [ -n "$HOST_URI" ]; then
            print_success "Loaded host URI from $DOMAIN_FILE"
            print_info "Host URI: $HOST_URI"
            read -p "Use this host URI? [Y/n]: " USE_SAVED_HOST
            USE_SAVED_HOST=${USE_SAVED_HOST:-Y}
            if [[ ! "$USE_SAVED_HOST" =~ ^[Yy]$ ]]; then
                HOST_URI=""
            fi
        fi
    fi

    if [ -z "$HOST_URI" ]; then
        print_question "Enter the host URI where this will be deployed (e.g., https://outings.example.com):"
        read -p "Host URI: " HOST_URI
        if [ -z "$HOST_URI" ]; then
            print_error "Host URI is required for production mode"
            exit 1
        fi

        read -p "Save this host URI to $DOMAIN_FILE for future runs? [Y/n]: " SAVE_HOST_FILE
        SAVE_HOST_FILE=${SAVE_HOST_FILE:-Y}
        if [[ "$SAVE_HOST_FILE" =~ ^[Yy]$ ]]; then
            save_config_file "$DOMAIN_FILE" "$HOST_URI" "Production host saved by bootstrap.sh"
            print_success "Saved host URI to $DOMAIN_FILE"
            add_to_gitignore "$DOMAIN_FILE"
        fi
    fi

    DOMAIN=$(extract_domain "$HOST_URI")
    print_info "Using domain: $DOMAIN"
else
    HOST_URI="http://localhost:3000"
    DOMAIN="localhost"
    print_info "Using localhost for development"
fi
echo ""

# SSL Certificate Configuration (Production only)
SSL_CERT_PATH=""
SSL_KEY_PATH=""
if [ "$MODE" = "production" ]; then
    print_header "SSL Certificate Configuration"
    print_info "For HTTPS support, we need SSL certificates."
    print_info "If you're using Let's Encrypt, certificates are typically in:"
    print_info "  /etc/letsencrypt/live/YOUR_DOMAIN/"
    echo ""

    DEFAULT_CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
    SSL_FILE="production-ssl-cert-dir.txt"

    if [ -f "$SSL_FILE" ]; then
        print_info "Found $SSL_FILE. Reading saved certificate directory..."
        SSL_CERT_DIR=$(read_config_file "$SSL_FILE")
        if [ -n "$SSL_CERT_DIR" ]; then
            print_success "Loaded certificate directory from $SSL_FILE"
            print_info "Certificate directory: $SSL_CERT_DIR"
            read -p "Use this certificate directory? [Y/n]: " USE_SAVED_SSL
            USE_SAVED_SSL=${USE_SAVED_SSL:-Y}
            if [[ ! "$USE_SAVED_SSL" =~ ^[Yy]$ ]]; then
                SSL_CERT_DIR=""
            fi
        fi
    fi

    if [ -z "$SSL_CERT_DIR" ]; then
        print_question "Enter the directory containing your SSL certificates:"
        echo "  Expected files: fullchain.pem and privkey.pem"
        read -p "Certificate directory (default: $DEFAULT_CERT_DIR): " SSL_CERT_DIR
        SSL_CERT_DIR=${SSL_CERT_DIR:-$DEFAULT_CERT_DIR}

        read -p "Save this certificate directory to $SSL_FILE for future runs? [Y/n]: " SAVE_SSL_FILE
        SAVE_SSL_FILE=${SAVE_SSL_FILE:-Y}
        if [[ "$SAVE_SSL_FILE" =~ ^[Yy]$ ]]; then
            save_config_file "$SSL_FILE" "$SSL_CERT_DIR" "Production SSL certificate directory saved by bootstrap.sh"
            print_success "Saved certificate directory to $SSL_FILE"
            add_to_gitignore "$SSL_FILE"
        fi
    fi

    if [ -n "$SSL_CERT_DIR" ] && [ -f "$SSL_CERT_DIR/fullchain.pem" ] && [ -f "$SSL_CERT_DIR/privkey.pem" ]; then
        print_success "Found SSL certificates in $SSL_CERT_DIR"
        SSL_CERT_PATH="$SSL_CERT_DIR/fullchain.pem"
        SSL_KEY_PATH="$SSL_CERT_DIR/privkey.pem"
    else
        print_error "SSL certificate files not found in $SSL_CERT_DIR"
        print_info "Expected files: fullchain.pem, privkey.pem"
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
        fi
    fi
    echo ""
fi

# Database configuration
if [ "$USE_DEFAULTS" = true ]; then
    POSTGRES_USER="trailhead"
    POSTGRES_PASSWORD=$(generate_password)
    POSTGRES_DB="trailhead"
    POSTGRES_PORT=5432
    print_info "Database: Using defaults (user: $POSTGRES_USER, db: $POSTGRES_DB)"
else
    print_question "Database Configuration:"
    read -p "PostgreSQL User (default: trailhead): " POSTGRES_USER
    POSTGRES_USER=${POSTGRES_USER:-trailhead}

    read -p "PostgreSQL Password (default: auto-generated): " POSTGRES_PASSWORD
    if [ -z "$POSTGRES_PASSWORD" ]; then
        POSTGRES_PASSWORD=$(generate_password)
        print_info "Generated PostgreSQL password"
    fi

    read -p "PostgreSQL Database Name (default: trailhead): " POSTGRES_DB
    POSTGRES_DB=${POSTGRES_DB:-trailhead}

    read -p "PostgreSQL Port (default: 5432): " POSTGRES_PORT
    POSTGRES_PORT=${POSTGRES_PORT:-5432}
    echo ""
fi

# Security configuration
if [ "$USE_DEFAULTS" = true ]; then
    SECRET_KEY=$(generate_secret)
    ACCESS_TOKEN_EXPIRE_MINUTES=15
    REFRESH_TOKEN_EXPIRE_DAYS=7
    print_info "Security: Using defaults (token expiry: 15 min / 7 days)"
else
    print_question "Security Configuration:"
    read -p "Secret Key (default: auto-generated): " SECRET_KEY
    if [ -z "$SECRET_KEY" ]; then
        SECRET_KEY=$(generate_secret)
        print_info "Generated secret key"
    fi

    read -p "Access Token Expire Minutes (default: 15): " ACCESS_TOKEN_EXPIRE_MINUTES
    ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES:-15}

    read -p "Refresh Token Expire Days (default: 7): " REFRESH_TOKEN_EXPIRE_DAYS
    REFRESH_TOKEN_EXPIRE_DAYS=${REFRESH_TOKEN_EXPIRE_DAYS:-7}
    echo ""
fi

# Admin user configuration
print_header "Initial Admin User Configuration"
print_info "The user who signs up with this email will automatically get admin role."
echo ""

if [ -f "admin-email.txt" ]; then
    print_info "Found admin-email.txt file. Reading admin email..."
    INITIAL_ADMIN_EMAIL=$(read_config_file "admin-email.txt")
    if [ -n "$INITIAL_ADMIN_EMAIL" ]; then
        print_success "Loaded admin email from admin-email.txt"
        print_info "Admin Email: $INITIAL_ADMIN_EMAIL"
        echo ""
        read -p "Use this email? [Y/n]: " USE_ADMIN_FILE
        USE_ADMIN_FILE=${USE_ADMIN_FILE:-Y}
        if [[ ! "$USE_ADMIN_FILE" =~ ^[Yy]$ ]]; then
            INITIAL_ADMIN_EMAIL=""
        fi
    fi
fi

if [ -z "$INITIAL_ADMIN_EMAIL" ]; then
    print_question "Enter the admin email address:"
    echo "  This email will automatically get admin role when signing in via Authentik"
    echo "  Or press Enter to use default (soadmin@scouthacks.net)"
    echo ""
    
    read -p "Admin Email: " INITIAL_ADMIN_EMAIL
    if [ -z "$INITIAL_ADMIN_EMAIL" ]; then
        INITIAL_ADMIN_EMAIL="soadmin@scouthacks.net"
        print_info "Using default admin email"
    fi
    
    read -p "Save admin email to admin-email.txt for future use? [Y/n]: " SAVE_ADMIN_EMAIL
    SAVE_ADMIN_EMAIL=${SAVE_ADMIN_EMAIL:-Y}
    if [[ "$SAVE_ADMIN_EMAIL" =~ ^[Yy]$ ]]; then
        save_config_file "admin-email.txt" "$INITIAL_ADMIN_EMAIL" "Initial Admin Email Configuration"
        print_success "Admin email saved to admin-email.txt"
        add_to_gitignore "admin-email.txt"
    fi
fi

print_info "Admin email set to: $INITIAL_ADMIN_EMAIL"
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

# Authentik configuration
print_header "Authentik Configuration"
print_info "Authentik provides open-source, self-hosted authentication."
echo ""

if [ "$USE_DEFAULTS" = true ]; then
    AUTHENTIK_SECRET_KEY=$(generate_base64_secret)
    print_info "Generated Authentik secret key"
else
    read -p "Authentik Secret Key (default: auto-generated): " AUTHENTIK_SECRET_KEY
    if [ -z "$AUTHENTIK_SECRET_KEY" ]; then
        AUTHENTIK_SECRET_KEY=$(generate_base64_secret)
        print_info "Generated Authentik secret key"
    fi
fi

AUTHENTIK_DB_USER="authentik"
AUTHENTIK_DB_PASSWORD=$(generate_password)
AUTHENTIK_DB_NAME="authentik"
AUTHENTIK_BOOTSTRAP_PASSWORD=$(generate_password)
AUTHENTIK_BOOTSTRAP_EMAIL=$INITIAL_ADMIN_EMAIL
AUTHENTIK_BOOTSTRAP_TOKEN=$(generate_secret)

if [ "$MODE" = "production" ]; then
    AUTHENTIK_URL="$HOST_URI/auth"
    AUTHENTIK_EXTERNAL_URL="$HOST_URI"
else
    AUTHENTIK_URL="http://authentik-server:9000"
    AUTHENTIK_EXTERNAL_URL="http://localhost:9000"
fi

print_info "Authentik URL: $AUTHENTIK_URL"
print_info "Authentik Bootstrap Email: $AUTHENTIK_BOOTSTRAP_EMAIL"

AUTHENTIK_CLIENT_ID=""
AUTHENTIK_CLIENT_SECRET=""

# Determine API URL based on mode
if [ "$MODE" = "production" ]; then
    API_URL="/api"
    FRONTEND_URL="$HOST_URI"
else
    API_URL="http://localhost:8000/api"
    FRONTEND_URL="http://localhost:3000"
fi

# Summary
echo ""
print_header "=========================================="
print_header "Configuration Summary"
print_header "=========================================="
echo "Mode: $MODE"
echo "Host URI: $HOST_URI"
echo "PostgreSQL User: $POSTGRES_USER"
echo "PostgreSQL Database: $POSTGRES_DB"
echo "PostgreSQL Port: $POSTGRES_PORT"
echo "Admin Email: $INITIAL_ADMIN_EMAIL"
echo "Authentik URL: $AUTHENTIK_URL"
echo ""
    
read -p "Continue with this configuration? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    print_info "Bootstrap cancelled"
    exit 1
fi
echo ""

# Save configuration to file for use by other scripts
cat > "$CONFIG_FILE" << EOF
# Bootstrap configuration generated on $(date)
MODE=$MODE
COMPOSE_PROFILE=$COMPOSE_PROFILE
RESTART_POLICY=$RESTART_POLICY
DEBUG=$DEBUG
HEALTHCHECK_INTERVAL=$HEALTHCHECK_INTERVAL
BACKEND_VOLUME_MOUNT=$BACKEND_VOLUME_MOUNT
BACKEND_PORT=$BACKEND_PORT
HOST_URI=$HOST_URI
DOMAIN=$DOMAIN
SSL_CERT_PATH=$SSL_CERT_PATH
SSL_KEY_PATH=$SSL_KEY_PATH
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
POSTGRES_PORT=$POSTGRES_PORT
SECRET_KEY=$SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES=$ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS=$REFRESH_TOKEN_EXPIRE_DAYS
INITIAL_ADMIN_EMAIL=$INITIAL_ADMIN_EMAIL
BACKEND_CORS_ORIGINS=$BACKEND_CORS_ORIGINS
AUTHENTIK_SECRET_KEY=$AUTHENTIK_SECRET_KEY
AUTHENTIK_DB_USER=$AUTHENTIK_DB_USER
AUTHENTIK_DB_PASSWORD=$AUTHENTIK_DB_PASSWORD
AUTHENTIK_DB_NAME=$AUTHENTIK_DB_NAME
AUTHENTIK_BOOTSTRAP_PASSWORD=$AUTHENTIK_BOOTSTRAP_PASSWORD
AUTHENTIK_BOOTSTRAP_EMAIL=$AUTHENTIK_BOOTSTRAP_EMAIL
AUTHENTIK_BOOTSTRAP_TOKEN=$AUTHENTIK_BOOTSTRAP_TOKEN
AUTHENTIK_URL=$AUTHENTIK_URL
AUTHENTIK_EXTERNAL_URL=$AUTHENTIK_EXTERNAL_URL
AUTHENTIK_CLIENT_ID=$AUTHENTIK_CLIENT_ID
AUTHENTIK_CLIENT_SECRET=$AUTHENTIK_CLIENT_SECRET
API_URL=$API_URL
FRONTEND_URL=$FRONTEND_URL
SAVE_CREDS=$SAVE_CREDS
EOF

print_success "Configuration saved to $CONFIG_FILE"
