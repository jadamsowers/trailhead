#!/bin/bash

# Check system dependencies (Docker, Docker Compose)
# This script verifies that all required tools are installed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib_utils.sh"

print_header "=========================================="
print_header "Checking System Dependencies"
print_header "=========================================="
echo ""

# Check if Docker is installed
print_info "Checking for Docker..."
if ! check_docker; then
    exit 1
fi
print_success "Docker is installed"

# Check if Docker daemon is running
print_info "Checking if Docker daemon is running..."
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker Desktop."
    exit 1
fi
print_success "Docker daemon is running"

# Check if Docker Compose is available
print_info "Checking for Docker Compose..."
DOCKER_COMPOSE=$(get_docker_compose)
if [ $? -ne 0 ]; then
    exit 1
fi
print_success "Docker Compose is available: $DOCKER_COMPOSE"

# Export for other scripts to use
echo "export DOCKER_COMPOSE='$DOCKER_COMPOSE'" > "$SCRIPT_DIR/.docker_compose_cmd"

echo ""
print_success "All dependencies are satisfied!"
