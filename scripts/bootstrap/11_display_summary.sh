#!/bin/bash

# Display setup completion information and next steps
# Shows URLs, credentials, and configuration instructions

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
fi

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
    echo "🔐 Authentik Admin Interface:"
    echo "   URL: $AUTHENTIK_URL"
    echo "   Login: $AUTHENTIK_BOOTSTRAP_EMAIL"
    echo "   Password: $AUTHENTIK_BOOTSTRAP_PASSWORD"
    echo ""
    echo "🌐 Frontend:"
    echo "   To start the frontend dev server, run:"
    echo "   cd frontend && npm install && npm start"
    echo "   Then access at: http://localhost:3000"
    echo ""
else
    print_success "Production mode is active"
    echo ""
    echo "🌐 Application URL:"
    echo "   $HOST_URI"
    echo ""
    echo "📚 API Documentation:"
    echo "   $HOST_URI/docs"
    echo ""
    echo "🔐 Authentik Admin Interface:"
    echo "   URL: $AUTHENTIK_URL"
    echo "   Login: $AUTHENTIK_BOOTSTRAP_EMAIL"
    echo "   Password: $AUTHENTIK_BOOTSTRAP_PASSWORD"
    echo ""
fi

echo "🔐 Authentik Setup:"
echo ""
echo -e "${YELLOW}   ╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}   ║  NEXT STEPS:                                                  ║${NC}"
echo -e "${YELLOW}   ║                                                               ║${NC}"
echo -e "${YELLOW}   ║  1. Open Authentik Admin: $AUTHENTIK_URL"
# Pad to align
printf "${YELLOW}   ║${NC}\n"
echo -e "${YELLOW}   ║  2. Login with email: $AUTHENTIK_BOOTSTRAP_EMAIL"
printf "${YELLOW}   ║${NC}\n"
echo -e "${YELLOW}   ║  3. Create OAuth2/OpenID Provider named 'trailhead'          ║${NC}"
echo -e "${YELLOW}   ║  4. Create Application using that provider                   ║${NC}"
echo -e "${YELLOW}   ║  5. Copy Client ID and Client Secret                         ║${NC}"
echo -e "${YELLOW}   ║  6. Update .env files with these values                       ║${NC}"
if [ -n "$DOCKER_COMPOSE" ]; then
    echo -e "${YELLOW}   ║  7. Restart services: $DOCKER_COMPOSE restart"
    printf "${YELLOW}   ║${NC}\n"
else
    echo -e "${YELLOW}   ║  7. Restart services                                          ║${NC}"
fi
echo -e "${YELLOW}   ║                                                               ║${NC}"
echo -e "${YELLOW}   ║  ADMIN EMAIL: $INITIAL_ADMIN_EMAIL"
printf "${YELLOW}   ║${NC}\n"
echo -e "${YELLOW}   ║  Sign up with this email to get admin role                   ║${NC}"
echo -e "${YELLOW}   ╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ -n "$DOCKER_COMPOSE" ]; then
    echo "📊 View logs:"
    if [ "$MODE" = "development" ]; then
        echo "   Backend:    $DOCKER_COMPOSE logs -f backend"
        echo "   Authentik:  $DOCKER_COMPOSE logs -f authentik-server"
    fi
    echo "   All:        $DOCKER_COMPOSE logs -f"
    echo ""
    echo "🛑 Stop services:"
    echo "   $DOCKER_COMPOSE down"
    echo ""
fi

print_info "Configuration files saved:"
echo "   - .env (root, for docker-compose)"
echo "   - backend/.env"
echo "   - frontend/.env"

if [ "$SAVE_CREDS" = true ]; then
    echo ""
    print_success "Credentials file saved:"
    echo "   - credentials.txt"
    echo ""
    print_info "⚠️  IMPORTANT: Keep this file secure!"
    echo "   This file contains sensitive passwords and secrets."
    echo "   It has been added to .gitignore to prevent accidental commits."
fi

echo ""
