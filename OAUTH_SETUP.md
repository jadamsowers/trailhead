# OAuth/OIDC Setup with Keycloak

This document describes the OAuth/OIDC authentication setup using Keycloak for the Scouting Outing Manager application.

## Overview

The application uses Keycloak as an OAuth 2.0 / OpenID Connect (OIDC) identity provider. This allows:

- **Parent Account Management**: Parents can create accounts and manage their family information
- **Secure Authentication**: Industry-standard OAuth/OIDC flow
- **Role-Based Access**: Support for different user roles (admin, parent)
- **Self-Service Registration**: Parents can register themselves
- **Token Management**: Access and refresh tokens for secure API access

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Backend    │────────▶│  Keycloak   │
│   (React)   │◀────────│   (FastAPI)  │◀────────│  (OAuth)    │
└─────────────┘         └──────────────┘         └─────────────┘
```

## Components

### Keycloak Service

Keycloak runs as a Docker container and provides:
- User authentication
- User registration
- Token issuance and validation
- Role management

### Backend Integration

The backend integrates with Keycloak using:
- `python-keycloak` library for OAuth operations
- Token introspection for validation
- User synchronization with local database

### Frontend Integration

The frontend will use OAuth authorization code flow:
1. Redirect to Keycloak login
2. User authenticates
3. Redirect back with authorization code
4. Exchange code for tokens
5. Use access token for API calls

## Setup Instructions

### 1. Start Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL (for both app and Keycloak)
- Keycloak (on port 8080)
- Backend API (on port 8000)
- Frontend (on port 3000)

### 2. Initialize Keycloak

Wait for Keycloak to be ready (about 60 seconds), then run:

```bash
./keycloak/init-keycloak.sh
```

Or manually configure:
1. Access Keycloak Admin Console: http://localhost:8080
2. Login with: `admin` / `admin123`
3. Create realm: `scouting-outing`
4. Create clients:
   - `scouting-outing-backend` (confidential client)
   - `scouting-outing-frontend` (public client)
5. Create roles: `parent`, `admin`

### 3. Configure Environment Variables

Update `backend/.env`:

```env
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=scouting-outing
KEYCLOAK_CLIENT_ID=scouting-outing-backend
KEYCLOAK_CLIENT_SECRET=dev-client-secret-change-in-production
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### OAuth Endpoints

- `GET /api/oauth/authorize` - Initiate OAuth flow
- `GET /api/oauth/callback` - OAuth callback handler
- `POST /api/oauth/token` - Exchange code for tokens
- `POST /api/oauth/refresh` - Refresh access token
- `POST /api/oauth/logout` - Logout user
- `GET /api/oauth/me` - Get current user info

### Registration Endpoints

- `POST /api/register/register` - Register new parent account

## User Roles

### Parent Role
- Can manage their family information
- Can view and sign up for trips
- Can manage their children's information

### Admin Role
- Full access to all features
- Can manage trips
- Can view all signups
- Can export rosters

## Development vs Production

### Development
- Keycloak runs in `start-dev` mode
- No email verification required
- Simple password requirements
- HTTP enabled (no SSL)

### Production
- Keycloak should run in production mode
- Enable email verification
- Strong password policies
- HTTPS required
- Use proper secrets management

## Troubleshooting

### Keycloak Not Starting
- Check PostgreSQL is running
- Check port 8080 is available
- Review Keycloak logs: `docker logs scouting-outing-keycloak`

### Authentication Fails
- Verify Keycloak realm and clients are configured
- Check client secret matches in backend config
- Verify redirect URIs are correct

### Token Validation Fails
- Check Keycloak URL is accessible from backend
- Verify realm name matches
- Check token hasn't expired

## Security Considerations

1. **Change Default Passwords**: Update Keycloak admin password and client secrets
2. **Use HTTPS**: In production, enable HTTPS for all services
3. **Token Expiration**: Configure appropriate token lifetimes
4. **CORS**: Configure CORS properly for your frontend domain
5. **Secrets Management**: Use environment variables or secrets management for sensitive data

## Next Steps

1. Update frontend to use OAuth flow
2. Implement family management features
3. Add user profile management
4. Configure email verification (production)
5. Set up password reset flow

