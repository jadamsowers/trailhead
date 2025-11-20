#!/bin/bash

# Keycloak initialization script
# This script sets up the Keycloak realm and client configuration

set -e

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin123}"
REALM_NAME="${REALM_NAME:-scouting-outing}"
CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET:-dev-client-secret-change-in-production}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"

echo "Waiting for Keycloak to be ready..."
until curl -f -s "${KEYCLOAK_URL}/realms/master" > /dev/null 2>&1; do
    echo "Keycloak is not ready yet. Waiting..."
    sleep 5
done

echo "Keycloak is ready. Getting admin token..."

# Get admin token
ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${KEYCLOAK_ADMIN}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" == "null" ]; then
    echo "Failed to get admin token"
    exit 1
fi

echo "Admin token obtained. Creating realm..."

# Check if realm exists
REALM_EXISTS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -o /dev/null -w "%{http_code}")

if [ "$REALM_EXISTS" == "200" ]; then
    echo "Realm ${REALM_NAME} already exists. Skipping creation."
else
    echo "Creating realm ${REALM_NAME}..."
    
    # Create realm
    curl -X POST "${KEYCLOAK_URL}/admin/realms" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d @- <<EOF
{
  "realm": "${REALM_NAME}",
  "enabled": true,
  "displayName": "Scouting Outing Manager",
  "registrationAllowed": true,
  "registrationEmailAsUsername": true,
  "rememberMe": true,
  "verifyEmail": false,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false
}
EOF

    echo "Realm created successfully."
fi

# Create roles
echo "Creating roles..."
for role in parent admin; do
    ROLE_EXISTS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/${role}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -o /dev/null -w "%{http_code}")
    
    if [ "$ROLE_EXISTS" != "200" ]; then
        echo "Creating role: ${role}"
        # Capitalize first letter for description
        role_desc=$(echo "${role}" | sed 's/./\U&/')
        curl -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles" \
          -H "Authorization: Bearer ${ADMIN_TOKEN}" \
          -H "Content-Type: application/json" \
          -d "{\"name\": \"${role}\", \"description\": \"${role_desc} role\"}"
    fi
done

# Create backend client
echo "Creating backend client..."
BACKEND_CLIENT_EXISTS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=scouting-outing-backend" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id // empty')

if [ -z "$BACKEND_CLIENT_EXISTS" ]; then
    echo "Creating new backend client with secret: ${CLIENT_SECRET:0:10}..."
    curl -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d @- <<EOF
{
  "clientId": "scouting-outing-backend",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "secret": "${CLIENT_SECRET}",
  "redirectUris": ["${BACKEND_URL}/*", "${FRONTEND_URL}/*"],
  "webOrigins": ["${BACKEND_URL}", "${FRONTEND_URL}"],
  "protocol": "openid-connect",
  "publicClient": false,
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": true,
  "serviceAccountsEnabled": true,
  "attributes": {
    "oauth2.device.authorization.grant.enabled": "false",
    "oidc.ciba.grant.enabled": "false"
  }
}
EOF
    echo "Backend client created."
else
    echo "Backend client already exists. Updating configuration..."
    # Update existing client
    curl -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${BACKEND_CLIENT_EXISTS}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d @- <<EOF
{
  "id": "${BACKEND_CLIENT_EXISTS}",
  "clientId": "scouting-outing-backend",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "secret": "${CLIENT_SECRET}",
  "redirectUris": ["${BACKEND_URL}/*", "${FRONTEND_URL}/*"],
  "webOrigins": ["${BACKEND_URL}", "${FRONTEND_URL}"],
  "protocol": "openid-connect",
  "publicClient": false,
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": true,
  "serviceAccountsEnabled": true
}
EOF
    echo "Backend client updated."
fi

# Create frontend client
echo "Creating frontend client..."
FRONTEND_CLIENT_EXISTS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=scouting-outing-frontend" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id // empty')

if [ -z "$FRONTEND_CLIENT_EXISTS" ]; then
    curl -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d @- <<EOF
{
  "clientId": "scouting-outing-frontend",
  "enabled": true,
  "publicClient": true,
  "redirectUris": ["${FRONTEND_URL}/*", "${FRONTEND_URL}/auth/callback"],
  "webOrigins": ["${FRONTEND_URL}", "${BACKEND_URL}"],
  "protocol": "openid-connect",
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  "attributes": {
    "pkce.code.challenge.method": "S256"
  }
}
EOF
    echo "Frontend client created."
else
    echo "Frontend client already exists. Updating configuration..."
    # Update existing client
    curl -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${FRONTEND_CLIENT_EXISTS}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d @- <<EOF
{
  "id": "${FRONTEND_CLIENT_EXISTS}",
  "clientId": "scouting-outing-frontend",
  "enabled": true,
  "publicClient": true,
  "redirectUris": ["${FRONTEND_URL}/*", "${FRONTEND_URL}/auth/callback"],
  "webOrigins": ["${FRONTEND_URL}", "${BACKEND_URL}"],
  "protocol": "openid-connect",
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  "attributes": {
    "pkce.code.challenge.method": "S256"
  }
}
EOF
    echo "Frontend client updated."
fi

echo "Keycloak initialization complete!"

