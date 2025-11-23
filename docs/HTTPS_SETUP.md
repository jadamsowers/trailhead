# HTTPS Setup Guide

This guide explains how to configure HTTPS for Trailhead in production mode.

## Overview

In production mode, the application uses nginx as a reverse proxy to handle HTTPS traffic. The backend runs on HTTP internally (within the Docker network), but nginx terminates SSL/TLS and forwards requests securely.

## Architecture

```
Internet → Nginx (Port 8443 HTTPS) → Frontend (Port 80) + Backend (Port 8000)
                                      ↓                      ↓
                                   Static Files          /api endpoints
```

**External Access:**
- **Port 8080**: HTTP (redirects to HTTPS)
- **Port 8443**: HTTPS (SSL/TLS) - All traffic goes through here

**Internal Docker Network:**
- **Frontend**: Port 80 (nginx container serves static files)
- **Backend**: Port 8000 (only accessible within Docker network)
- **Nginx**: Reverse proxy that routes:
  - `/` → Frontend container
  - `/api` → Backend container

**Important**: In production, the backend is NOT exposed externally. All API requests go through nginx at `https://your-domain.com:8443/api`

## Prerequisites

### 1. SSL Certificates

You need valid SSL certificates for your domain. The most common options are:

#### Option A: Let's Encrypt (Recommended)

Let's Encrypt provides free SSL certificates. Install certbot:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot

# macOS
brew install certbot
```

Obtain certificates:

```bash
sudo certbot certonly --standalone -d your-domain.com
```

Certificates will be stored in:
```
/etc/letsencrypt/live/your-domain.com/
├── fullchain.pem  (certificate + chain)
└── privkey.pem    (private key)
```

#### Option B: Custom Certificates

If you have custom certificates, ensure you have:
- `fullchain.pem` (or `cert.pem`) - The certificate file
- `privkey.pem` (or `key.pem`) - The private key file

## Setup Process

### 1. Run Bootstrap Script

When running `bootstrap.sh`, select production mode:

```bash
./bootstrap.sh
```

Choose:
1. **Setup mode**: Custom setup (option 2) or Quick setup (option 1)
2. **Deployment mode**: Production (option 2)
3. **Host URI**: Enter your domain (e.g., `https://outings.example.com`)

### 2. SSL Certificate Configuration

The bootstrap script will prompt for SSL certificate paths:

```
SSL Certificate Configuration
For HTTPS support, we need SSL certificates.
If you're using Let's Encrypt, certificates are typically in:
  /etc/letsencrypt/live/YOUR_DOMAIN/

Enter the directory containing your SSL certificates:
  Expected files: fullchain.pem and privkey.pem
Certificate directory (default: /etc/letsencrypt/live/your-domain.com):
```

**Options:**
- Press Enter to use the default Let's Encrypt path
- Enter a custom path if your certificates are elsewhere
- Choose to continue without SSL (not recommended for production)

### 3. Certificate Validation

The script will verify that the certificate files exist:
- ✓ If found: Setup continues with HTTPS enabled
- ✗ If not found: You'll be prompted to enter a different path or continue without SSL

## Docker Compose Configuration

The nginx service is automatically configured in production mode:

```yaml
nginx:
  image: nginx:alpine
  container_name: trailhead-nginx
  restart: unless-stopped
  profiles: ["production"]
  ports:
    - "8080:80"   # HTTP (redirects to HTTPS)
    - "8443:443"  # HTTPS
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ${SSL_CERT_PATH}:/etc/nginx/ssl/fullchain.pem:ro
    - ${SSL_KEY_PATH}:/etc/nginx/ssl/privkey.pem:ro
  depends_on:
    - frontend
    - backend
```

**Key Points:**
- Backend port is NOT exposed in production (no `ports:` mapping for backend service)
- All traffic flows through nginx on port 8443
- Frontend API calls use relative path `/api` which nginx proxies to backend

## Nginx Configuration

The nginx configuration (`nginx/nginx.conf`) includes:

### HTTP Server (Port 80)
- Health check endpoint at `/health`
- Redirects all traffic to HTTPS

### HTTPS Server (Port 443)
- SSL/TLS termination with modern protocols (TLSv1.2, TLSv1.3)
- Security headers (HSTS, X-Frame-Options, etc.)
- Reverse proxy to frontend and backend
- Rate limiting for API endpoints
- CORS headers for API requests

## Starting the Application

After bootstrap completes, start the services:

```bash
docker compose --profile production up -d
```

Or use the deploy script:

```bash
./deploy.sh
```

## Accessing the Application

- **Application**: `https://your-domain.com:8443`
- **API Endpoints**: `https://your-domain.com:8443/api/*`
- **API Documentation**: `https://your-domain.com:8443/docs`
- **Health Check**: `http://your-domain.com:8080/health` (or HTTPS)

**Note**: The backend is only accessible through nginx. Direct access to backend:8000 is not available from outside the Docker network.

## Certificate Renewal

### Let's Encrypt Auto-Renewal

Let's Encrypt certificates expire after 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up automatic renewal (cron job)
sudo crontab -e
```

Add this line to renew certificates daily:
```
0 0 * * * certbot renew --quiet --post-hook "docker compose restart nginx"
```

### Manual Renewal

```bash
# Renew certificates
sudo certbot renew

# Restart nginx to load new certificates
docker compose restart nginx
```

## Troubleshooting

### Certificate Not Found

**Error**: `SSL certificate files not found in /etc/letsencrypt/live/your-domain.com`

**Solutions**:
1. Verify the certificate path exists:
   ```bash
   ls -la /etc/letsencrypt/live/your-domain.com/
   ```

2. Check certificate permissions:
   ```bash
   sudo chmod 644 /etc/letsencrypt/live/your-domain.com/fullchain.pem
   sudo chmod 600 /etc/letsencrypt/live/your-domain.com/privkey.pem
   ```

3. Ensure Docker has access to the certificate directory

### Nginx Won't Start

**Check nginx logs**:
```bash
docker compose logs nginx
```

**Common issues**:
- Invalid certificate paths in `.env` file
- Certificate files not readable by Docker
- Port conflicts (8080 or 8443 already in use)

### SSL Certificate Errors in Browser

**Symptoms**: Browser shows "Your connection is not private" or similar

**Solutions**:
1. Verify certificate is valid:
   ```bash
   openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout
   ```

2. Check certificate matches domain:
   ```bash
   openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -noout -subject
   ```

3. Ensure certificate hasn't expired:
   ```bash
   openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -noout -dates
   ```

### Backend Connection Issues

**Check backend is accessible from nginx**:
```bash
docker compose exec nginx wget -O- http://backend:8000/api/health
```

**Verify network connectivity**:
```bash
docker compose exec nginx ping backend
```

## Security Best Practices

1. **Keep Certificates Secure**
   - Restrict access to private keys (chmod 600)
   - Never commit certificates to version control
   - Rotate certificates regularly

2. **Monitor Certificate Expiration**
   - Set up alerts for certificate expiration
   - Test renewal process regularly

3. **Use Strong SSL Configuration**
   - The default configuration uses TLSv1.2 and TLSv1.3
   - Weak ciphers are disabled
   - HSTS is enabled for 1 year

4. **Regular Updates**
   - Keep nginx updated: `docker compose pull nginx`
   - Update SSL configuration as needed

## Environment Variables

The following environment variables are set in `.env` for SSL:

```bash
# SSL Configuration
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
```

## Testing HTTPS Setup

### 1. Test SSL Configuration

```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:8443 -servername your-domain.com

# Check SSL grade (requires ssllabs-scan tool)
ssllabs-scan your-domain.com
```

### 2. Test HTTP to HTTPS Redirect

```bash
curl -I http://your-domain.com:8080
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://your-domain.com/
```

### 3. Test Backend API

```bash
curl -k https://your-domain.com:8443/api/health
# Should return: {"status":"healthy"}
```

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review nginx logs: `docker compose logs nginx`
3. Review backend logs: `docker compose logs backend`
4. Consult the main [README.md](../README.md) and [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)