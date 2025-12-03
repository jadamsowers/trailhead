#!/bin/bash

# Initialize backend database
# Runs after all services are started

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
print_header "Initializing Backend Database"
print_header "=========================================="
echo ""

print_info "Waiting for database to be ready..."
sleep 5

print_info "Verifying backend database connection..."

if [ "$MODE" = "production" ]; then
    BACKEND_CONTAINER="trailhead-backend"
    if docker exec "$BACKEND_CONTAINER" python -m app.db.init_db; then
        print_success "Backend database initialized successfully"
    else
        print_error "Database verification failed. Check logs with:"
        echo "   $DOCKER_COMPOSE logs backend"
        exit 1
    fi
else
    if $DOCKER_COMPOSE exec -T backend python -m app.db.init_db; then
        print_success "Backend database initialized successfully"
    else
        print_error "Database verification failed. Check logs with:"
        echo "   $DOCKER_COMPOSE logs backend"
        exit 1
    fi
fi

echo ""
print_success "Backend database initialization complete!"
