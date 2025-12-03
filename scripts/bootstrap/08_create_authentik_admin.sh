#!/bin/bash
# Create initial Authentik admin user if not present
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib_utils.sh"
CONFIG_FILE="$SCRIPT_DIR/bootstrap_config.env"

if [ ! -f "$CONFIG_FILE" ]; then
    print_error "Configuration file not found: $CONFIG_FILE"
    exit 1
fi
source "$CONFIG_FILE"

if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    print_error "Neither 'docker compose' nor 'docker-compose' is available. Install Docker Compose."
    exit 1
fi

# Docker executable
DOCKER_CMD="docker"

print_header "=========================================="
print_header "Starting Authentik Server"
print_header "=========================================="
echo ""

print_info "Starting Authentik server container..."
$COMPOSE_CMD up -d authentik-server

if [ $? -ne 0 ]; then
    print_error "Failed to start authentik-server. Exiting."
    exit 1
fi

# Wait for Authentik HTTP to be up (max 120s)
print_info "Waiting for Authentik HTTP service..."
AUTHENTIK_READY=false
for i in {1..60}; do
    if curl -sf "$AUTHENTIK_URL" >/dev/null 2>&1; then
        AUTHENTIK_READY=true
        break
    fi
    sleep 2
done

if [ "$AUTHENTIK_READY" = true ]; then
    print_success "Authentik server is ready!"
else
    print_error "Authentik failed to become ready. Check logs with:"
    echo "   $COMPOSE_CMD logs authentik-server"
    exit 1
fi

echo ""

print_info "Ensuring 'trailhead' application and OAuth2 provider exist in Authentik..."
LOG="$SCRIPT_DIR/authentik_bootstrap.log"
print_info "Running bootstrap inside container (logging to $LOG)..."
if $COMPOSE_CMD exec -T -e FRONTEND_URL="$FRONTEND_URL" authentik-server python manage.py shell -c "import sys; exec(sys.stdin.read()); main()" < "$SCRIPT_DIR/authentik_bootstrap.py" >"$LOG" 2>&1; then
    print_success "Authentik bootstrap completed."
    tail -n 200 "$LOG"

    # Extract Client ID and Secret
    CLIENT_ID=$(grep "Provider client_id:" "$LOG" | awk '{print $3}')
    CLIENT_SECRET=$(grep "Provider client_secret:" "$LOG" | awk '{print $3}')

    if [ -n "$CLIENT_ID" ] && [ -n "$CLIENT_SECRET" ]; then
        print_info "Extracted Client ID and Secret from log."
        
        # Update bootstrap_config.env
        # We use a temp file to safely update the config
        # Remove ALL occurrences of these keys (including empty ones)
        grep -v '^AUTHENTIK_CLIENT_ID=' "$CONFIG_FILE" | \
        grep -v '^AUTHENTIK_CLIENT_SECRET=' > "$CONFIG_FILE.tmp"

        echo "AUTHENTIK_CLIENT_ID=$CLIENT_ID" >> "$CONFIG_FILE.tmp"
        echo "AUTHENTIK_CLIENT_SECRET=$CLIENT_SECRET" >> "$CONFIG_FILE.tmp"
        mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
        print_success "Updated bootstrap_config.env with Client ID and Secret"

        # Propagate client creds to generated env files so services pick them up
        for EF in backend/.env frontend/.env .env; do
            if [ -f "$EF" ]; then
                print_info "Updating $EF with client credentials..."
                # For frontend, also update the VITE_* variable used by the web app
                if [ "$EF" = "frontend/.env" ]; then
                    grep -v '^VITE_AUTHENTIK_CLIENT_ID=' "$EF" | grep -v '^VITE_AUTHENTIK_CLIENT_SECRET=' | grep -v '^AUTHENTIK_CLIENT_ID=' | grep -v '^AUTHENTIK_CLIENT_SECRET=' > "$EF.tmp" || true
                    echo "VITE_AUTHENTIK_CLIENT_ID=$CLIENT_ID" >> "$EF.tmp"
                else
                    grep -v '^AUTHENTIK_CLIENT_ID=' "$EF" | grep -v '^AUTHENTIK_CLIENT_SECRET=' > "$EF.tmp" || true
                fi

                echo "AUTHENTIK_CLIENT_ID=$CLIENT_ID" >> "$EF.tmp"
                echo "AUTHENTIK_CLIENT_SECRET=$CLIENT_SECRET" >> "$EF.tmp"
                mv "$EF.tmp" "$EF"
                print_success "Updated $EF"
            fi
        done
        
        # Restart backend container to pick up new credentials
        print_info "Restarting backend container to load new credentials..."
        if $COMPOSE_CMD restart backend >/dev/null 2>&1; then
            print_success "Backend container restarted"
        else
            print_warning "Could not restart backend container. You may need to restart it manually."
        fi
    else
        print_warning "Could not extract Client ID/Secret from log. You may need to configure them manually."
    fi
else
    print_error "Authentik bootstrap failed. See log: $LOG"
    tail -n 200 "$LOG"
    exit 1
fi

# Verify OIDC endpoint is accessible
sleep 2
print_info "Verifying OIDC configuration endpoint..."
OIDC_URL="$AUTHENTIK_URL/application/o/trailhead/.well-known/openid-configuration"
if curl -sf "$OIDC_URL" -o /dev/null; then
    print_success "OIDC endpoint is accessible: $OIDC_URL"
else
    print_error "OIDC endpoint not accessible: $OIDC_URL"
    print_info "This may indicate the 'trailhead' application was not created successfully."
    print_info "Check the bootstrap log: $LOG"
    exit 1
fi
