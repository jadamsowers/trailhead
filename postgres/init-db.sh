#!/bin/bash
set -e

# Create Stack Auth database if credentials are provided
if [ -n "$STACKAUTH_DB_USER" ] && [ -n "$STACKAUTH_DB_PASSWORD" ] && [ -n "$STACKAUTH_DB_NAME" ]; then
    echo "Creating Stack Auth database and user..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        -- Create Stack Auth user if not exists
        DO
        \$\$
        BEGIN
           IF NOT EXISTS (
              SELECT FROM pg_catalog.pg_roles WHERE rolname = '$STACKAUTH_DB_USER'
           ) THEN
              CREATE USER $STACKAUTH_DB_USER WITH PASSWORD '$STACKAUTH_DB_PASSWORD';
           END IF;
        END
        \$\$;

        -- Create Stack Auth database if not exists
        SELECT 'CREATE DATABASE $STACKAUTH_DB_NAME OWNER $STACKAUTH_DB_USER'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$STACKAUTH_DB_NAME')\gexec

        -- Grant privileges
        GRANT ALL PRIVILEGES ON DATABASE $STACKAUTH_DB_NAME TO $STACKAUTH_DB_USER;
EOSQL
    echo "Stack Auth database setup complete"
fi

echo "PostgreSQL initialization complete"