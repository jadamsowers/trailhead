# Authentik-Based Admin Setup Guide

This guide explains how the admin system works with Authentik authentication in the Trailhead application.

## Overview

With Authentik authentication, there are **no passwords stored in the database**. Instead, admin privileges are automatically granted to users who sign in with a pre-configured admin email address.

## How It Works

1. **Configuration**: An initial admin email is configured in the environment variables
2. **First Sign-In**: When a user signs in via Authentik with that email address, they are automatically granted admin role
3. **Automatic Role Assignment**: The system checks the email on every authentication and ensures admin users maintain their role
4. **Group-Based Roles**: Users in Authentik groups like `trailhead-admins` automatically get admin privileges

## Configuration Methods

### Method 1: Using admin-email.txt (Recommended)

Create a file named `admin-email.txt` in the project root:

```
# Initial Admin Email Configuration
# The user who signs up with this email in Authentik will automatically get admin role

your-admin@example.com
```

This file is automatically:
- Read by the bootstrap script
- Added to `.gitignore` to prevent accidental commits
- Used to set the `INITIAL_ADMIN_EMAIL` environment variable

**Example file**: See `admin-email.txt.example`

### Method 2: Environment Variables

Set the `INITIAL_ADMIN_EMAIL` environment variable directly:

```bash
# In .env or backend/.env
INITIAL_ADMIN_EMAIL=your-admin@example.com
```

### Method 3: Bootstrap Script

When running `./bootstrap.sh`, you'll be prompted to enter the admin email. The script can optionally save it to `admin-email.txt` for future use.

## Setup Steps

### 1. Configure Admin Email

Choose one of the configuration methods above to set your admin email.

### 2. Set Up Authentik

1. Run `./bootstrap.sh` to start all services including Authentik
2. Access the Authentik admin interface (default: http://localhost:9000)
3. Log in with the bootstrap credentials (shown in terminal or credentials.txt)
4. Create an OAuth2/OpenID Provider named "trailhead":
   - Go to Applications → Providers → Create
   - Select "OAuth2/OpenID Provider"
   - Name: trailhead
   - Authentication flow: default-authentication-flow
   - Authorization flow: default-provider-authorization-explicit-consent
   - Client type: Confidential
   - Redirect URIs: http://localhost:3000/callback (or your production URL)
5. Create an Application:
   - Go to Applications → Applications → Create
   - Name: Trailhead
   - Slug: trailhead
   - Provider: trailhead (the one you just created)
6. Copy the Client ID and Client Secret from the provider settings
7. Update your .env files with these values

### 3. Update Environment Variables

Add the Authentik credentials to your .env files:

```bash
# In .env and backend/.env
AUTHENTIK_CLIENT_ID=your_client_id_here
AUTHENTIK_CLIENT_SECRET=your_client_secret_here

# In frontend/.env
VITE_AUTHENTIK_CLIENT_ID=your_client_id_here
```

### 4. Restart Services

```bash
docker-compose restart
```

### 5. Create Admin Account in Authentik

1. Go to your application's sign-up page
2. Sign up using the configured admin email
3. Complete the Authentik sign-up process
4. On first sign-in, you'll automatically receive admin privileges

## How Admin Role Assignment Works

The admin role is assigned in [`backend/app/api/deps.py`](../backend/app/api/deps.py) during authentication:

```python
# When a user signs in via Authentik
if email.lower() == settings.INITIAL_ADMIN_EMAIL.lower():
    role = "admin"
else:
    # Get role from Authentik groups
    role = authentik.get_role_from_groups(groups)
```

### Key Features:

- **Case-insensitive matching**: `admin@example.com` matches `Admin@Example.com`
- **Automatic on first sign-in**: No manual database setup needed
- **Persistent**: Once granted, the role is stored in the database
- **Group-based roles**: Users in `trailhead-admins` group automatically get admin role
- **Auto-correction**: If an existing user's email matches the admin email, they're automatically upgraded to admin

## Authentik Groups for Roles

Create these groups in Authentik to manage roles:

| Authentik Group | Application Role |
|-----------------|------------------|
| `trailhead-admins` | admin |
| `trailhead-outing-admins` | outing-admin |
| `authentik Admins` | admin |

## Security Considerations

### Best Practices

1. **Use a dedicated admin email**: Don't use a personal email that might be compromised
2. **Enable 2FA in Authentik**: Add an extra layer of security to the admin account
3. **Keep admin-email.txt secure**: This file is in `.gitignore` - never commit it
4. **Use strong Authentik security settings**: Configure session timeouts and security policies
5. **Monitor admin access**: Review Authentik logs for admin sign-ins

### Changing the Admin Email

To change the admin email:

1. Update `admin-email.txt` or the `INITIAL_ADMIN_EMAIL` environment variable
2. Restart the backend service
3. The new email will automatically get admin privileges on next sign-in
4. The old admin user will retain their admin role unless manually changed

### Revoking Admin Access

To revoke admin access from a user:

1. Update their role in the database directly, or
2. Use the admin panel to change their role, or
3. Remove them from the `trailhead-admins` group in Authentik

## Troubleshooting

### Admin user not getting admin role

**Check:**
1. Email matches exactly (case-insensitive)
2. `INITIAL_ADMIN_EMAIL` is set correctly in environment
3. Backend service has been restarted after configuration changes
4. Check backend logs for authentication errors

### Multiple admins needed

**Options:**
1. Add users to the `trailhead-admins` group in Authentik
2. Update roles directly in the database
3. Create an admin management interface (future feature)

### Lost access to admin account

**Recovery:**
1. Update `INITIAL_ADMIN_EMAIL` to a new email you control
2. Restart backend
3. Sign in with the new email
4. You'll automatically get admin privileges

### Authentik connection issues

**Check:**
1. Authentik services are running: `docker-compose ps`
2. AUTHENTIK_URL is correct in backend/.env
3. Client ID and Secret are properly configured
4. Network connectivity between backend and Authentik

## Files Modified for Authentik Support

- [`backend/app/core/config.py`](../backend/app/core/config.py) - Authentik configuration
- [`backend/app/core/authentik.py`](../backend/app/core/authentik.py) - Authentik client
- [`backend/app/api/deps.py`](../backend/app/api/deps.py) - Auto-admin role assignment
- [`backend/app/db/init_db.py`](../backend/app/db/init_db.py) - Database initialization
- [`bootstrap.sh`](../bootstrap.sh) - Bootstrap script updates
- [`.gitignore`](../.gitignore) - Added admin-email.txt
- [`admin-email.txt.example`](../admin-email.txt.example) - Example configuration file

## Related Documentation

- [Authentication Flow](AUTHENTICATION_FLOW.md)
- [Quick Start Guide](QUICK_START.md)

## Support

For issues or questions:
1. Check the [Authentik Documentation](https://goauthentik.io/docs)
2. Review backend logs: `docker-compose logs backend`
3. Review Authentik logs: `docker-compose logs authentik-server`
4. Verify environment variables are set correctly
