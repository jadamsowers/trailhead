# Troubleshooting Guide

## Frontend Can't Connect to Backend

### Architecture Overview

```
Browser → Nginx (80/443) → Frontend Container (3000) [static files]
                          → Backend Container (8000) [API]
```

**Important**: The frontend serves static files that run in the browser. The browser makes API calls to `/api`, which Nginx proxies to the backend.

### Diagnostic Steps

#### 1. Verify Containers Are Running

```bash
docker-compose -f docker-compose.yml ps

# You should see:
# - -db (postgres) - healthy
# - -backend - running on port 8000
# - -frontend - running on port 3000
```

#### 2. Test Backend Directly

```bash
# Test backend health endpoint
curl http://localhost:8000/api/health

# Should return: {"status":"healthy"}

# Test backend API docs
curl http://localhost:8000/docs
```

#### 3. Test Frontend Directly

```bash
# Test frontend container
curl http://localhost:3000/

# Should return HTML content
```

#### 4. Check Nginx Configuration

```bash
# Test Nginx config syntax
sudo nginx -t

# Check if site is enabled
sudo nginx -s -manager

# View Nginx error logs
sudo tail -f /var/log/nginx/-error.log
```

#### 5. Test Nginx Proxying

```bash
# Test health endpoint through nginx
curl https://outings.ivyscouts.org/health

# Test API through nginx
curl https://outings.ivyscouts.org/api/health

# Test frontend through nginx
curl https://outings.ivyscouts.org/
```

### Common Issues

#### Issue: "Connection Refused" on localhost:8000

**Cause**: Backend container isn't running or crashed

**Solution**:
```bash
# Check backend logs
docker-compose -f docker-compose.yml logs backend

# Restart backend
docker-compose -f docker-compose.yml restart backend
```

#### Issue: "502 Bad Gateway" from nginx

**Cause**: nginx can't reach the backend/frontend containers

**Solution**:
```bash
# Verify containers are on the same network
docker network inspect -manager_-network

# Check if ports are accessible from host
netstat -tlnp | grep -E ':(8001|3001)'

# Restart nginx
sudo systemctl restart nginx
```

#### Issue: Frontend loads but API calls fail

**Cause**: nginx isn't proxying `/api` correctly

**Solution**:
```bash
# Check nginx proxy modules are enabled
sudo nginx -t
sudo nginx -s -manager

# If not enabled:
sudo a2enmod proxy proxy_http
sudo systemctl restart apache2

# Verify Apache config
sudo apache2ctl -S
```

#### Issue: CORS errors in browser

**Cause**: CORS headers not being set correctly

**Solution**:
```bash
# Ensure headers module is enabled
sudo a2enmod headers
sudo systemctl restart apache2

# Check if CORS headers are in Apache config
grep -A 5 "CORS" /etc/apache2/sites-available/-manager.conf
```

### Network Flow Test

Test the complete flow:

```bash
# 1. From your local machine, test Apache
curl -I https://outings.ivyscouts.org/

# 2. From the host, test backend directly
curl http://localhost:8001/api/health

# 3. From the host, test frontend directly  
curl -I http://localhost:3001/

# 4. Check if Apache can reach backend
sudo apache2ctl -M | grep proxy
```

### Docker Network Issues

If containers can't communicate:

```bash
# Recreate the network
docker-compose -f docker-compose.apache.yml down
docker network prune
docker-compose -f docker-compose.apache.yml up -d

# Verify network connectivity between containers
docker exec -frontend ping -c 3 backend
docker exec -backend ping -c 3 postgres
```

### Browser Developer Tools

Open browser DevTools (F12) and check:

1. **Network Tab**: 
   - Are API calls going to `/api/*`?
   - What's the response status code?
   - Check response headers for CORS

2. **Console Tab**:
   - Any JavaScript errors?
   - Any CORS errors?

### Complete Reset

If all else fails:

```bash
# Stop everything
docker-compose -f docker-compose.apache.yml down -v

# Remove old images
docker-compose -f docker-compose.apache.yml rm -f

# Rebuild from scratch
docker-compose -f docker-compose.apache.yml build --no-cache

# Start fresh
docker-compose -f docker-compose.apache.yml up -d

# Watch logs
docker-compose -f docker-compose.apache.yml logs -f
```

### Expected Behavior

When working correctly:

1. Browser loads `https://outings.ivyscouts.org/`
2. Apache serves static files from frontend container (port 3001)
3. Browser JavaScript makes API calls to `/api/*`
4. Apache proxies `/api/*` to backend container (port 8001)
5. Backend processes request and returns JSON
6. Browser receives and displays data

### Getting Help

If issues persist, collect this information:

```bash
# Container status
docker-compose -f docker-compose.apache.yml ps > debug-containers.txt

# Container logs
docker-compose -f docker-compose.apache.yml logs > debug-logs.txt

# Apache config test
sudo apache2ctl -S > debug-apache.txt

# Network info
docker network inspect -manager_-network > debug-network.txt

# Port bindings
netstat -tlnp | grep -E ':(80|443|3001|8001)' > debug-ports.txt