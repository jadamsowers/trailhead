#!/bin/bash
set -e

# Create Keycloak database and user
# Use environment variables for credentials
KEYCLOAK_USER="${KEYCLOAK_DB_USER:-keycloak}"
KEYCLOAK_PASS="${KEYCLOAK_DB_PASSWORD:-keycloak123}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create keycloak user if it doesn't exist
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$KEYCLOAK_USER') THEN
            CREATE USER $KEYCLOAK_USER WITH PASSWORD '$KEYCLOAK_PASS';
        END IF;
    END
    \$\$;

    -- Create keycloak database if it doesn't exist
    SELECT 'CREATE DATABASE keycloak OWNER $KEYCLOAK_USER'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak')\gexec

    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE keycloak TO $KEYCLOAK_USER;
EOSQL

echo "Keycloak database and user created successfully"