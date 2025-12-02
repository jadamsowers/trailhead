#!/bin/bash

# Start Postgres container only
# This allows us to create the Authentik database before starting Authentik

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

print_header "=========================================="
print_header "Starting Postgres Database"
print_header "=========================================="
echo ""

print_info "Starting Postgres container..."
echo ""

# Start only postgres
$DOCKER_COMPOSE up -d postgres

print_success "Postgres container started!"
echo ""

print_info "Waiting for Postgres to be ready..."

# Poll for readiness (timeout ~60s)
READY=false
for i in {1..60}; do
    if $DOCKER_COMPOSE exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
        READY=true
        break
    fi
    sleep 1
done

if [ "$READY" = true ]; then
    print_success "Postgres is ready!"
else
    print_error "Postgres failed to become ready. Check logs with:"
    echo "   $DOCKER_COMPOSE logs postgres"
    exit 1
fi

echo ""
print_success "Postgres started successfully!"
