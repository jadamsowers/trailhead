# Apache Deployment Guide

This guide shows how to deploy Scouting Outing Manager on a Debian VPS with Apache already running on ports 80/443.

## Architecture

- **Apache** (ports 80/443) - Reverse proxy handling SSL and routing
- **Frontend Container** (port 3001) - Nginx serving Vite-built static files
- **Backend Container** (port 8000) - FastAPI application
- **PostgreSQL Container** (internal) - Database

## Prerequisites

- Debian VPS with Apache2 installed and running
- Docker and Docker Compose installed
- Domain name (outings.ivyscouts.org) pointing to your VPS
- SSL certificate for your domain

## Step 1: Enable Required Apache Modules

```bash
# Enable proxy modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
sudo a2enmod headers
sudo a2enmod rewrite

# Restart Apache
sudo systemctl restart apache2
```

## Step 2: Clone and Configure

```bash
# Clone repository
cd ~
git clone <your-repo-url> scouting-outing-manager
cd scouting-outing-manager

# Copy and configure environment
cp .env.production .env

# Generate secure passwords
SECRET_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)

# Update .env file
sed -i "s/CHANGE_THIS_TO_A_SECURE_RANDOM_STRING/$SECRET_KEY/" .env
sed -i "s/CHANGE_THIS_TO_A_SECURE_PASSWORD/$DB_PASSWORD/" .env
```

## Step 3: Deploy Docker Containers

```bash
# Build and start containers (without nginx)
docker-compose -f docker-compose.apache.yml up -d --build

# Verify containers are running
docker-compose -f docker-compose.apache.yml ps

# You should see:
# - scouting-outing-db (postgres)
# - scouting-outing-backend (port 8000)
# - scouting-outing-frontend (port 3001)
```

## Step 4: Configure Apache Virtual Host

```bash
# Copy the Apache configuration
sudo cp apache/scouting-outing-manager.conf /etc/apache2/sites-available/

# Update SSL certificate paths in the config if needed
sudo nano /etc/apache2/sites-available/scouting-outing-manager.conf

# Enable the site
sudo a2ensite scouting-outing-manager.conf

# Test Apache configuration
sudo apache2ctl configtest

# Reload Apache
sudo systemctl reload apache2
```

## Step 5: Set Up SSL Certificate (if not already done)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-apache

# Get SSL certificate
sudo certbot --apache -d outings.ivyscouts.org

# Certbot will automatically configure Apache for HTTPS
```

## Step 6: Create Admin User

```bash
# Create the initial admin user
docker exec -it scouting-outing-backend python -m app.db.init_db
```

**Admin User Configuration:**

The initial admin user can be configured via environment variables in your `.env` file:

- `INITIAL_ADMIN_EMAIL` - Email address (default: `soadmin@scouthacks.net`)
- `INITIAL_ADMIN_PASSWORD` - Password (optional; if not set, a random password will be generated)

**Important:**
- If `INITIAL_ADMIN_PASSWORD` is not set, a random password will be generated and displayed in the terminal
- **Save the generated password** - it will be shown in the command output!
- Change the admin password immediately after first login

**Example configuration in `.env`:**
```env
INITIAL_ADMIN_EMAIL=admin@yourdomain.com
INITIAL_ADMIN_PASSWORD=your_secure_password_here
```

## Step 7: Verify Deployment

Visit your domain:

- **Frontend**: <https://outings.ivyscouts.org>
- **API Docs**: <https://outings.ivyscouts.org/docs>
- **Health Check**: <https://outings.ivyscouts.org/health>

## Port Mapping

| Service | Container Port | Host Port | Access |
|---------|---------------|-----------|---------|
| Frontend | 80 | 3001 | Apache proxies from 443 |
| Backend | 8000 | 8000 | Apache proxies /api to 8000 |
| PostgreSQL | 5432 | - | Internal only |

## Maintenance Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.apache.yml logs -f

# Specific service
docker-compose -f docker-compose.apache.yml logs -f backend
docker-compose -f docker-compose.apache.yml logs -f frontend

# Apache logs
sudo tail -f /var/log/apache2/scouting-outing-access.log
sudo tail -f /var/log/apache2/scouting-outing-error.log
```

### Restart Services

```bash
# Restart Docker containers
docker-compose -f docker-compose.apache.yml restart

# Restart Apache
sudo systemctl restart apache2
```

### Update Application

```bash
cd ~/scouting-outing-manager
git pull

# Rebuild and restart containers
docker-compose -f docker-compose.apache.yml up -d --build

# Run migrations
docker exec -it scouting-outing-backend alembic upgrade head

# Reload Apache (if config changed)
sudo systemctl reload apache2
```

### Backup Database

```bash
# Create backup
docker exec scouting-outing-db pg_dump -U scouttrips scouting_outing_manager > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker exec -i scouting-outing-db psql -U scouttrips scouting_outing_manager < backup_20240101_120000.sql
```

### Stop Application

```bash
# Stop Docker containers
docker-compose -f docker-compose.apache.yml down

# Stop and remove volumes (WARNING: This deletes your database!)
docker-compose -f docker-compose.apache.yml down -v
```

## Troubleshooting

### Apache Can't Connect to Backend

```bash
# Check if backend is running
docker-compose -f docker-compose.apache.yml ps backend

# Check backend logs
docker-compose -f docker-compose.apache.yml logs backend

# Test backend directly
curl http://localhost:8000/api/health
```

### Apache Can't Connect to Frontend

```bash
# Check if frontend is running
docker-compose -f docker-compose.apache.yml ps frontend

# Test frontend directly
curl http://localhost:3001/
```

### 502 Bad Gateway

```bash
# Check if containers are running
docker-compose -f docker-compose.apache.yml ps

# Check Apache error logs
sudo tail -f /var/log/apache2/scouting-outing-error.log

# Verify ports are not blocked
sudo netstat -tlnp | grep -E ':(3001|8000)'
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Test certificate
sudo certbot certificates
```

## Security Recommendations

1. **Firewall Configuration**:

   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   ```

2. **Restrict Docker Ports**: The docker-compose.apache.yml only exposes ports to localhost by default. If you need to restrict further:

   ```yaml
   ports:
     - "127.0.0.1:8000:8000"  # Only accessible from localhost
     - "127.0.0.1:3001:80"
   ```

3. **Regular Updates**:

   ```bash
   # Update system
   sudo apt-get update && sudo apt-get upgrade -y
   
   # Update Docker images
   docker-compose -f docker-compose.apache.yml pull
   docker-compose -f docker-compose.apache.yml up -d
   ```

4. **Monitor Logs**: Set up log rotation and monitoring for both Apache and Docker containers

5. **Backup Automation**: Set up a cron job for regular database backups

## Performance Optimization

### Apache Configuration

Add to your Apache config for better performance:

```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Enable caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Docker Resource Limits

Add to docker-compose.apache.yml if needed:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

## Getting Help

If you encounter issues:

1. Check Docker logs: `docker-compose -f docker-compose.apache.yml logs`
2. Check Apache logs: `sudo tail -f /var/log/apache2/scouting-outing-error.log`
3. Verify all containers are running: `docker-compose -f docker-compose.apache.yml ps`
4. Test direct access to containers: `curl http://localhost:8000/api/health`
