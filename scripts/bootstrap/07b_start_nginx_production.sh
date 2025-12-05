#!/bin/bash

# Start nginx and frontend in production mode
# This must happen before step 8 so Authentik can be accessed via HOST_URI/auth

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib_utils.sh"

CONFIG_FILE="$SCRIPT_DIR/bootstrap_config.env"

if [ ! -f "$CONFIG_FILE" ]; then
    print_error "Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Source configuration and Docker Compose command
source "$CONFIG_FILE"

if [ -f "$SCRIPT_DIR/.docker_compose_cmd" ]; then
    source "$SCRIPT_DIR/.docker_compose_cmd"
else
    print_error "Docker Compose command not found."
    exit 1
fi

# Only start nginx in production mode
if [ "$MODE" != "production" ]; then
    print_info "Skipping nginx/frontend startup (not in production mode)"
    exit 0
fi

print_header "=========================================="
print_header "Starting Nginx and Frontend (Production)"
print_header "=========================================="
echo ""

print_info "Building and starting frontend and nginx containers..."
echo ""

# Start frontend and nginx with production profile
if $DOCKER_COMPOSE --profile production up --build -d frontend nginx; then
    print_success "Frontend and nginx containers started!"
else
    print_error "Failed to start frontend/nginx containers. Check logs with:"
    echo "   $DOCKER_COMPOSE logs frontend nginx"
    exit 1
fi

echo ""
print_info "Waiting for nginx to be ready..."

# Poll for nginx health endpoint (timeout ~30s)
NGINX_READY=false
for i in {1..30}; do
    if curl -sf http://localhost:8080/health >/dev/null 2>&1; then
        NGINX_READY=true
        break
    fi
    sleep 1
done

if [ "$NGINX_READY" = true ]; then
    print_success "Nginx is ready and responding!"
else
    print_warning "Nginx health check did not respond in time, but container may still be starting."
    print_info "You can check status with: $DOCKER_COMPOSE logs nginx"
fi

echo ""
print_success "Nginx and frontend started successfully!"
echo ""
print_info "Authentik will now be accessible at $HOST_URI/auth (via nginx proxy)"
