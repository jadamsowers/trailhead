#!/bin/bash
set -e

# Create Authentik database if credentials are provided
if [ -n "$AUTHENTIK_DB_USER" ] && [ -n "$AUTHENTIK_DB_PASSWORD" ] && [ -n "$AUTHENTIK_DB_NAME" ]; then
    echo "Creating Authentik database and user..."
    
    # Validate that variables don't contain special characters that could cause SQL injection
    if [[ "$AUTHENTIK_DB_USER" =~ [^a-zA-Z0-9_] ]]; then
        echo "ERROR: AUTHENTIK_DB_USER contains invalid characters. Only alphanumeric and underscore allowed."
        exit 1
    fi
    if [[ "$AUTHENTIK_DB_NAME" =~ [^a-zA-Z0-9_] ]]; then
        echo "ERROR: AUTHENTIK_DB_NAME contains invalid characters. Only alphanumeric and underscore allowed."
        exit 1
    fi
    
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        -- Create Authentik user if not exists
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

        -- Create Authentik database if not exists
        SELECT 'CREATE DATABASE "${AUTHENTIK_DB_NAME}" OWNER "${AUTHENTIK_DB_USER}"'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${AUTHENTIK_DB_NAME}')\gexec

        -- Grant privileges
        GRANT ALL PRIVILEGES ON DATABASE "${AUTHENTIK_DB_NAME}" TO "${AUTHENTIK_DB_USER}";
EOSQL
    echo "Authentik database setup complete"
fi

echo "PostgreSQL initialization complete"