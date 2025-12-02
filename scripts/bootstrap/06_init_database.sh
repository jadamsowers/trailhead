#!/bin/bash

# Create Authentik database and user in Postgres
# This must happen before Authentik service starts

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
print_header "Creating Authentik Database"
print_header "=========================================="
echo ""

# Create Authentik database and user
print_question "Create Authentik database and user in Postgres?"
echo "  This will create the Authentik role and database in the running Postgres container."
read -p "Create Authentik DB/user now? [Y/n]: " CREATE_AUTH_DB
CREATE_AUTH_DB=${CREATE_AUTH_DB:-Y}

if [[ "$CREATE_AUTH_DB" =~ ^[Yy]$ ]]; then
    print_info "Creating Authentik database and user..."
    
    if $DOCKER_COMPOSE exec -T postgres psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
DO
\$\$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = '${AUTHENTIK_DB_USER}'
   ) THEN
      CREATE USER "${AUTHENTIK_DB_USER}" WITH PASSWORD '${AUTHENTIK_DB_PASSWORD}';
   END IF;
END
\$\$;

SELECT 'CREATE DATABASE "${AUTHENTIK_DB_NAME}" OWNER "${AUTHENTIK_DB_USER}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${AUTHENTIK_DB_NAME}')\gexec

GRANT ALL PRIVILEGES ON DATABASE "${AUTHENTIK_DB_NAME}" TO "${AUTHENTIK_DB_USER}";
EOSQL
    then
        print_success "Authentik database and user created successfully"
    else
        print_error "Failed to create Authentik DB/user"
        
        # Try fallback with docker exec
        print_info "Attempting fallback method (docker exec)..."
        if docker exec -i trailhead-db psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
DO
\$\$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = '${AUTHENTIK_DB_USER}'
   ) THEN
      CREATE USER "${AUTHENTIK_DB_USER}" WITH PASSWORD '${AUTHENTIK_DB_PASSWORD}';
   END IF;
END
\$\$;

SELECT 'CREATE DATABASE "${AUTHENTIK_DB_NAME}" OWNER "${AUTHENTIK_DB_USER}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${AUTHENTIK_DB_NAME}')\gexec

GRANT ALL PRIVILEGES ON DATABASE "${AUTHENTIK_DB_NAME}" TO "${AUTHENTIK_DB_USER}";
EOSQL
        then
            print_success "Authentik database and user created successfully (via fallback)"
        else
            print_error "Failed to create Authentik DB/user"
            print_info "You can create it manually later"
        fi
    fi
else
    print_info "Skipping Authentik DB/user creation"
fi

echo ""
print_success "Authentik database setup complete!"
