# Simple VPS Deployment Guide

This guide shows you how to deploy Scouting Outing Manager to a Debian VPS using Docker Compose.

## Prerequisites

- A Debian VPS with at least 2GB RAM
- Root or sudo access
- A domain name pointing to your VPS IP (optional but recommended)

## Step 1: Prepare Your VPS

SSH into your VPS and run these commands:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose git

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, to run docker without sudo)
sudo usermod -aG docker $USER
newgrp docker
```

## Step 2: Clone Your Repository

```bash
# Clone your repository
cd ~
git clone <your-repo-url> scouting-outing-manager
cd scouting-outing-manager
```

## Step 3: Configure Environment Variables

```bash
# Copy the production environment template
cp .env.production .env

# Generate secure passwords
SECRET_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)

# Update .env file with secure values
sed -i "s/CHANGE_THIS_TO_A_SECURE_RANDOM_STRING/$SECRET_KEY/" .env
sed -i "s/CHANGE_THIS_TO_A_SECURE_PASSWORD/$DB_PASSWORD/" .env

# If you have a domain, update it (replace your-domain.com with your actual domain)
sed -i "s/your-domain.com/yourdomain.com/g" .env

# View your configuration
cat .env
```

## Step 4: Create Required Directories

```bash
# Create nginx directories
mkdir -p nginx/ssl nginx/logs

# Set proper permissions
chmod 755 nginx
```

## Step 5: Deploy the Application

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# This will:
# - Build the backend and frontend images
# - Start PostgreSQL database
# - Run database migrations
# - Start the backend API
# - Start the frontend
# - Start Nginx reverse proxy
```

## Step 6: Verify Deployment

```bash
# Check that all containers are running
docker-compose -f docker-compose.prod.yml ps

# You should see 4 containers running:
# - scouting-outing-db (postgres)
# - scouting-outing-backend
# - scouting-outing-frontend
# - scouting-outing-nginx

# Check logs if there are any issues
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs nginx
```

## Step 7: Access Your Application

Your application is now running!

- **Without domain**: Access via `http://YOUR_VPS_IP`
- **With domain**: Access via `http://your-domain.com`

The Nginx reverse proxy routes:
- `/` → Frontend
- `/api` → Backend API
- `/docs` → API Documentation

## Step 8: Set Up SSL/HTTPS (Recommended)

If you have a domain name, set up free SSL certificates with Let's Encrypt:

```bash
# Install Certbot
sudo apt-get install -y certbot

# Stop nginx temporarily
docker-compose -f docker-compose.prod.yml stop nginx

# Get SSL certificate (replace your-domain.com with your actual domain)
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem

# Edit nginx/nginx.conf and uncomment the HTTPS server block (lines 125-195)
# Also comment out the HTTP location block (lines 66-72) and uncomment the redirect (line 63)

# Restart nginx
docker-compose -f docker-compose.prod.yml start nginx
```

## Step 9: Create Admin User

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

## Maintenance Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Restart Services
```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Update Application
```bash
# Pull latest code
cd ~/scouting-outing-manager
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run any new migrations
docker exec -it scouting-outing-backend alembic upgrade head
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
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: This deletes your database!)
docker-compose -f docker-compose.prod.yml down -v
```

## Troubleshooting

### Containers won't start
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View detailed logs
docker-compose -f docker-compose.prod.yml logs

# Check system resources
docker stats
```

### Can't access the application
```bash
# Check if nginx is running
docker-compose -f docker-compose.prod.yml ps nginx

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Verify firewall allows HTTP/HTTPS
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Database connection errors
```bash
# Check if postgres is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check postgres logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test database connection
docker exec -it scouting-outing-db psql -U scouttrips -d scouting_outing_manager -c '\l'
```

### Frontend not loading
```bash
# Check frontend logs
docker-compose -f docker-compose.prod.yml logs frontend

# Rebuild frontend
docker-compose -f docker-compose.prod.yml up -d --build frontend
```

### Backend API errors
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Check if migrations are up to date
docker exec -it scouting-outing-backend alembic current
docker exec -it scouting-outing-backend alembic upgrade head
```

## Security Recommendations

1. **Change default passwords**: Update all passwords in `.env`
2. **Enable firewall**: Only allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```
3. **Use SSH keys**: Disable password authentication for SSH
4. **Regular updates**: Keep system and Docker images updated
5. **Backup regularly**: Set up automated database backups
6. **Monitor logs**: Regularly check application logs for issues
7. **Use HTTPS**: Always use SSL/TLS in production

## Performance Optimization

For small VPS with limited resources:

1. **Reduce container resources**: Edit `docker-compose.prod.yml` to add resource limits
2. **Enable swap**: Add swap space if RAM is limited
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
3. **Monitor resources**: Use `docker stats` to track container resource usage

## Getting Help

If you encounter issues:

1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify all containers are running: `docker-compose -f docker-compose.prod.yml ps`
3. Check system resources: `docker stats`
4. Review the troubleshooting section above