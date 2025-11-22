# Clerk Migration Guide

## Overview

This project has been migrated from Keycloak to Clerk for authentication. Clerk provides a simpler, more modern authentication solution with excellent React integration and a generous free tier.

## Why Clerk?

- **Simpler Setup**: No complex infrastructure to manage
- **Better Developer Experience**: Beautiful pre-built UI components
- **Excellent React Integration**: First-class React support with hooks
- **Generous Free Tier**: 10,000 monthly active users
- **Modern Features**: Built-in social login, MFA, and user management
- **No Infrastructure**: Fully managed service, no servers to maintain

## Setup Instructions

### 1. Create a Clerk Account

1. Go to [https://clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Get your API keys from the dashboard

### 2. Configure Environment Variables

#### Backend (.env)
```bash
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
```

#### Frontend (.env.development)
```bash
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
```

### 3. Install Dependencies

#### Backend
```bash
cd backend
pip install -r requirements.txt
```

The backend now uses `clerk-backend-api` instead of `python-keycloak`.

#### Frontend
```bash
cd frontend
npm install
```

The frontend now uses `@clerk/clerk-react` for authentication.

### 4. Configure Clerk Dashboard

1. **Add Allowed Redirect URLs**:
   - Development: `http://localhost:3000`
   - Production: Your production URL

2. **Configure User Metadata** (Optional):
   - Go to "User & Authentication" → "Metadata"
   - Add custom fields for roles if needed

3. **Set up Social Providers** (Optional):
   - Go to "User & Authentication" → "Social Connections"
   - Enable Google, GitHub, or other providers

### 5. Start the Application

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Start frontend (in another terminal)
cd frontend
npm run dev
```

## Key Changes

### Backend Changes

1. **New Clerk Client** ([`backend/app/core/clerk.py`](backend/app/core/clerk.py)):
   - Replaces Keycloak client
   - Handles token verification
   - Manages user metadata

2. **Updated Dependencies** ([`backend/app/api/deps.py`](backend/app/api/deps.py)):
   - Uses Clerk for token verification
   - Falls back to legacy JWT for admin accounts

3. **New Endpoints** ([`backend/app/api/endpoints/clerk_auth.py`](backend/app/api/endpoints/clerk_auth.py)):
   - `/api/clerk/me` - Get current user
   - `/api/clerk/sync-role` - Sync role from Clerk metadata

4. **Removed**:
   - Keycloak OAuth endpoints
   - Keycloak configuration
   - Keycloak Docker container

### Frontend Changes

1. **Clerk Provider** ([`frontend/src/App.tsx`](frontend/src/App.tsx)):
   - Wraps app with `ClerkProvider`
   - Uses Clerk's built-in components (`SignedIn`, `SignedOut`, `UserButton`)

2. **Simplified Login** ([`frontend/src/pages/LoginPage.tsx`](frontend/src/pages/LoginPage.tsx)):
   - Uses Clerk's `<SignIn />` component
   - No custom OAuth flow needed

3. **Removed**:
   - Custom OAuth context
   - OAuth callback handling
   - Token management code

### Docker Changes

1. **Removed Keycloak Service**:
   - No more Keycloak container
   - Simplified docker-compose.yml
   - Faster startup times

2. **Updated Environment Variables**:
   - Removed Keycloak-specific variables
   - Added Clerk configuration

## User Management

### Roles

Roles are managed through Clerk's public metadata:

1. **In Clerk Dashboard**:
   - Go to Users → Select User → Metadata
   - Add to public metadata: `{ "role": "admin" }`

2. **Via API**:
   ```bash
   POST /api/clerk/sync-role
   {
     "role": "admin"
   }
   ```

### Available Roles

- `admin` - Full access to all features
- `parent` - Can manage family signups
- `user` - Basic participant access

## Migration from Keycloak

If you have existing users in Keycloak:

1. **Export Users**: Export user data from Keycloak
2. **Create in Clerk**: Use Clerk's API or dashboard to create users
3. **Set Roles**: Add role metadata to each user
4. **Notify Users**: Users will need to set new passwords in Clerk

## Troubleshooting

### "Cannot find module '@clerk/clerk-react'"

Run `npm install` in the frontend directory to install Clerk dependencies.

### "Invalid Clerk API key"

1. Check that your API keys are correct in `.env` files
2. Ensure you're using the correct environment (test vs production)
3. Verify keys in Clerk dashboard

### "Token verification failed"

1. Ensure Clerk publishable key matches between frontend and backend
2. Check that the token is being sent in the Authorization header
3. Verify the Clerk secret key is correct

### Users can't sign in

1. Check allowed redirect URLs in Clerk dashboard
2. Verify CORS settings in backend
3. Check browser console for errors

## Benefits of Migration

1. **Simplified Infrastructure**: No Keycloak server to manage
2. **Faster Development**: Pre-built UI components
3. **Better UX**: Modern, polished authentication flows
4. **Lower Costs**: Free tier covers most use cases
5. **Less Maintenance**: Fully managed service
6. **Better Documentation**: Excellent docs and examples

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Clerk Backend API](https://clerk.com/docs/reference/backend-api)
- [Clerk Dashboard](https://dashboard.clerk.com)

## Support

For issues specific to Clerk integration, check:
- [Clerk Discord](https://clerk.com/discord)
- [Clerk GitHub](https://github.com/clerkinc/javascript)
- Project issues on GitHub