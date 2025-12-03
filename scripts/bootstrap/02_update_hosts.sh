#!/bin/bash

# Update /etc/hosts for development
# This script adds local hostname entries for Docker services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib_utils.sh"

print_header "=========================================="
print_header "Updating /etc/hosts for Development"
print_header "=========================================="
echo ""

HOSTS_ENTRIES=(
    "127.0.0.1    authentik authentik-server authentik.local"
    "127.0.0.1    trailhead-backend backend.local"
    "127.0.0.1    trailhead trailhead-frontend frontend.local"
    "127.0.0.1    trailhead-db db.local"
    "127.0.0.1    trailhead-redis redis.local"
    "127.0.0.1    trailhead-nginx nginx.local"
)

HOSTS_FILE="/etc/hosts"
BACKUP_FILE="/etc/hosts.trailhead.backup.$(date +%Y%m%d_%H%M%S)"
NEEDS_UPDATE=false

print_info "Checking current /etc/hosts entries..."

# Check if any entries are missing
for ENTRY in "${HOSTS_ENTRIES[@]}"; do
    HOSTNAME=$(echo "$ENTRY" | awk '{print $2}')
    if ! grep -q "$HOSTNAME" "$HOSTS_FILE" 2>/dev/null; then
        NEEDS_UPDATE=true
        print_info "Missing entry for: $HOSTNAME"
    else
        print_success "Entry exists for: $HOSTNAME"
    fi
done

if [ "$NEEDS_UPDATE" = false ]; then
    echo ""
    print_success "All required /etc/hosts entries are already present!"
    exit 0
fi

echo ""
print_info "Some entries are missing from /etc/hosts"
print_info "The following entries will be added:"
echo ""
for ENTRY in "${HOSTS_ENTRIES[@]}"; do
    HOSTNAME=$(echo "$ENTRY" | awk '{print $2}')
    if ! grep -q "$HOSTNAME" "$HOSTS_FILE" 2>/dev/null; then
        echo "  $ENTRY"
    fi
done
echo ""

# Prompt for confirmation
read -p "$(echo -e "${YELLOW}Add these entries to /etc/hosts? This requires sudo privileges. (y/n): ${NC}")" -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "User declined to update /etc/hosts"
    print_info "You can manually add these entries later, or re-run the bootstrap script"
    exit 1
fi

# Create backup
print_info "Creating backup of /etc/hosts..."
if sudo cp "$HOSTS_FILE" "$BACKUP_FILE"; then
    print_success "Backup created: $BACKUP_FILE"
else
    print_error "Failed to create backup"
    exit 1
fi

# Add missing entries
print_info "Adding entries to /etc/hosts..."
ADDED_COUNT=0
for ENTRY in "${HOSTS_ENTRIES[@]}"; do
    HOSTNAME=$(echo "$ENTRY" | awk '{print $2}')
    if ! grep -q "$HOSTNAME" "$HOSTS_FILE" 2>/dev/null; then
        if echo "$ENTRY" | sudo tee -a "$HOSTS_FILE" > /dev/null; then
            print_success "Added: $ENTRY"
            ADDED_COUNT=$((ADDED_COUNT + 1))
        else
            print_error "Failed to add: $ENTRY"
            exit 1
        fi
    fi
done

echo ""
print_success "Successfully added $ADDED_COUNT entries to /etc/hosts"
print_info "Backup saved to: $BACKUP_FILE"
