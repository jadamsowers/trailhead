#!/bin/bash

# Clean up existing Docker containers and volumes
# Optionally removes postgres volumes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib_utils.sh"

# Source Docker Compose command
if [ -f "$SCRIPT_DIR/.docker_compose_cmd" ]; then
    source "$SCRIPT_DIR/.docker_compose_cmd"
else
    print_error "Docker Compose command not found. Run 01_check_dependencies.sh first."
    exit 1
fi

print_header "=========================================="
print_header "Cleaning Up Docker Resources"
print_header "=========================================="
echo ""

# Stop and remove containers
print_info "Stopping and removing existing containers..."
$DOCKER_COMPOSE down 2>/dev/null || true
print_success "Containers stopped and removed"
echo ""

# Check for Docker volumes related to postgres
print_info "Checking for existing PostgreSQL volumes..."
VOLUME_NAMES=$(docker volume ls -q 2>/dev/null | grep -i 'postgres' || true)

if [ -n "$VOLUME_NAMES" ]; then
    print_info "Found existing volumes:"
    echo "$VOLUME_NAMES" | while read vol; do
        echo "   - $vol"
    done
    echo ""
    
    print_question "Delete these volumes? (This will remove all database data!)"
    read -p "Delete volumes? [y/N]: " DELETE_VOLUMES
    if [[ "$DELETE_VOLUMES" =~ ^[Yy]$ ]]; then
        print_info "Removing volumes..."
        echo "$VOLUME_NAMES" | xargs -r docker volume rm || true
        print_success "Volumes removed"
    else
        print_info "Keeping existing volumes"
    fi
else
    print_info "No PostgreSQL volumes found"
fi

echo ""
print_success "Cleanup complete!"
