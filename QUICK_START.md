# Quick Start - Deploy to VPS in 5 Minutes

This is the fastest way to deploy Scouting Outing Manager to your Debian VPS.

## One-Command Deployment

SSH into your VPS and run:

```bash
# Clone the repository
git clone <your-repo-url> scouting-outing-manager
cd scouting-outing-manager

# Run the deployment script
./deploy.sh
```

That's it! The script will:
- Install Docker and Docker Compose if needed
- Generate secure passwords
- Build and start all containers (PostgreSQL, Backend, Frontend, Nginx)
- Display your application URL

## Access Your Application

After deployment completes, access your app at:
- `http://YOUR_VPS_IP`
- API docs: `http://YOUR_VPS_IP/docs`

## Create Admin User

```bash
docker exec -it scouting-outing-backend python -m scripts.create_admin
```

## What Gets Deployed?

The deployment includes:
- **PostgreSQL Database** - Stores all your data
- **Backend API** - FastAPI application on port 8000
- **Frontend** - React application 
- **Nginx** - Reverse proxy handling all traffic on port 80

## Architecture

```
Internet → Nginx (Port 80/443)
            ├─→ Frontend (React SPA)
            └─→ Backend API (/api)
                  └─→ PostgreSQL Database
```

## Common Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop everything
docker-compose -f docker-compose.prod.yml down

# Update application
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

## Next Steps

1. **Set up a domain** (optional but recommended)
   - Point your domain's A record to your VPS IP
   - Update `.env` with your domain
   - Restart: `docker-compose -f docker-compose.prod.yml restart`

2. **Enable HTTPS** (recommended for production)
   - See [DEPLOYMENT.md](DEPLOYMENT.md) Step 8 for SSL setup

3. **Configure firewall**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   ```

## Troubleshooting

**Can't access the application?**
```bash
# Check if containers are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs
```

**Need to change passwords?**
```bash
# Edit .env file
nano .env

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

## Full Documentation

For detailed instructions, troubleshooting, and advanced configuration, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

## Support

If you encounter issues:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify containers are running: `docker-compose -f docker-compose.prod.yml ps`
3. Review [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section