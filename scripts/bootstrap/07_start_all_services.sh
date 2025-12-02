#!/bin/bash

# Build and start all Docker services
# Waits for services to be ready

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
print_header "Starting All Services"
print_header "=========================================="
echo ""

print_info "Building Docker images and starting all containers..."
print_info "This may take a few minutes on first run..."
echo ""

# Build and start all services
if [ "$MODE" = "production" ]; then
    $DOCKER_COMPOSE --profile production up --build -d
else
    $DOCKER_COMPOSE up --build -d
fi

print_success "All services started!"
echo ""

print_info "Waiting for services to be ready..."
sleep 10

# Check if services are running
if $DOCKER_COMPOSE ps | grep -q "Up\|running"; then
    print_success "Services are running!"
else
    print_error "Some services failed to start. Check logs with:"
    echo "   $DOCKER_COMPOSE logs"
    exit 1
fi

echo ""
print_success "All services started successfully!"
