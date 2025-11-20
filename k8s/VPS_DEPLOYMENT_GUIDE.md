# Deploying Scouting Outing Manager to a Debian VPS

This guide walks you through deploying the Scouting Outing Manager application to a small Debian VPS using K3s (lightweight Kubernetes).

## Prerequisites

- A Debian VPS with at least:
  - 2 GB RAM (4 GB recommended)
  - 2 CPU cores
  - 20 GB disk space
  - Root or sudo access
- A domain name pointing to your VPS IP address
- SSH access to your VPS

## Step 1: Install K3s on Your VPS

SSH into your VPS and install K3s:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install K3s (lightweight Kubernetes)
curl -sfL https://get.k3s.io | sh -

# Verify installation
sudo k3s kubectl get nodes

# Set up kubectl alias for convenience
echo "alias kubectl='sudo k3s kubectl'" >> ~/.bashrc
source ~/.bashrc

# Make kubectl config accessible
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
```

## Step 2: Install Required Tools

```bash
# Install Docker (for building images)
sudo apt-get install -y docker.io
sudo usermod -aG docker $USER
newgrp docker

# Install docker-compose (optional, for local testing)
sudo apt-get install -y docker-compose

# Install git (if not already installed)
sudo apt-get install -y git
```

## Step 3: Clone Your Repository

```bash
cd ~
git clone <your-repo-url> scouting-outing-manager
cd scouting-outing-manager
```

## Step 4: Build Docker Images

Since you're on a small VPS, build images locally:

```bash
# Build backend image
cd backend
docker build -t scouting-outing-backend:latest .

# Build frontend image (create Dockerfile first if missing)
cd ../frontend
docker build -t scouting-outing-frontend:latest .
cd ..
```

## Step 5: Import Images to K3s

K3s uses containerd, so import your Docker images:

```bash
# Save Docker images
docker save scouting-outing-backend:latest -o backend.tar
docker save scouting-outing-frontend:latest -o frontend.tar

# Import to K3s
sudo k3s ctr images import backend.tar
sudo k3s ctr images import frontend.tar

# Clean up tar files
rm backend.tar frontend.tar
```

## Step 6: Configure Secrets

Create your secrets file from the example:

```bash
cd k8s

# Copy the example
cp secrets.yaml.example secrets.yaml

# Generate a secure secret key
SECRET_KEY=$(openssl rand -hex 32)
SECRET_KEY_B64=$(echo -n "$SECRET_KEY" | base64 -w 0)

# Generate secure database password
DB_PASSWORD=$(openssl rand -hex 16)
DB_PASSWORD_B64=$(echo -n "$DB_PASSWORD" | base64 -w 0)

# Edit secrets.yaml and replace the base64 values
# Or use sed to replace them automatically:
sed -i "s/Y2hhbmdlLXRoaXMtdG8tYS1zZWN1cmUtcmFuZG9tLXN0cmluZw==/$SECRET_KEY_B64/" secrets.yaml
sed -i "s/cG9zdGdyZXM=/$DB_PASSWORD_B64/g" secrets.yaml
```

## Step 7: Update ConfigMap

Edit [`configmap.yaml`](configmap.yaml:1) to match your domain:

```bash
# Replace example.com with your actual domain
sed -i 's/scouting-outings.example.com/your-domain.com/g' configmap.yaml
sed -i 's/http:\/\/localhost:3000/https:\/\/your-domain.com/g' configmap.yaml
```

## Step 8: Update Ingress Configuration

Edit [`ingress.yaml`](ingress.yaml:1) to use your domain:

```bash
sed -i 's/scouting-outings.example.com/your-domain.com/g' ingress.yaml
```

## Step 9: Adjust Resource Limits for Small VPS

For a small VPS, reduce resource requirements:

```bash
# Edit backend-deployment.yaml
# Reduce replicas from 2 to 1
sed -i 's/replicas: 2/replicas: 1/' backend-deployment.yaml

# Edit frontend-deployment.yaml
# Reduce replicas from 2 to 1
sed -i 's/replicas: 2/replicas: 1/' frontend-deployment.yaml

# Edit postgres-statefulset.yaml
# Reduce storage from 10Gi to 5Gi if needed
sed -i 's/storage: 10Gi/storage: 5Gi/' postgres-statefulset.yaml
```

## Step 10: Deploy to K3s

Deploy all components in order:

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Create secrets and configmap
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml

# Deploy PostgreSQL
kubectl apply -f postgres-statefulset.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n scouting-outing-manager --timeout=300s

# Deploy backend
kubectl apply -f backend-deployment.yaml

# Wait for backend to be ready
kubectl wait --for=condition=ready pod -l app=backend -n scouting-outing-manager --timeout=300s

# Deploy frontend
kubectl apply -f frontend-deployment.yaml

# Deploy ingress (K3s comes with Traefik by default)
kubectl apply -f ingress.yaml
```

## Step 11: Verify Deployment

Check that all pods are running:

```bash
kubectl get pods -n scouting-outing-manager
kubectl get services -n scouting-outing-manager
kubectl get ingress -n scouting-outing-manager
```

View logs if there are issues:

```bash
# Backend logs
kubectl logs -n scouting-outing-manager -l app=backend --tail=100

# Frontend logs
kubectl logs -n scouting-outing-manager -l app=frontend --tail=100

# PostgreSQL logs
kubectl logs -n scouting-outing-manager -l app=postgres --tail=100
```

## Step 12: Configure SSL/TLS (Optional but Recommended)

K3s comes with Traefik, but for Let's Encrypt SSL, install cert-manager:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=300s

# Create Let's Encrypt issuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com  # Replace with your email
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: traefik
EOF
```

## Step 13: Access Your Application

Your application should now be accessible at:
- Frontend: `https://your-domain.com`
- Backend API: `https://your-domain.com/api`
- API Docs: `https://your-domain.com/docs`

## Troubleshooting

### Pods not starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n scouting-outing-manager

# Check resource usage
kubectl top nodes
kubectl top pods -n scouting-outing-manager
```

### Database connection issues

```bash
# Check PostgreSQL is running
kubectl exec -it postgres-0 -n scouting-outing-manager -- psql -U postgres -c '\l'

# Test connection from backend pod
kubectl exec -it <backend-pod-name> -n scouting-outing-manager -- nc -zv postgres 5432
```

### Image pull issues

```bash
# List images in K3s
sudo k3s ctr images list | grep scouting-outing

# Re-import if needed
docker save scouting-outing-backend:latest | sudo k3s ctr images import -
```

## Maintenance

### Update application

```bash
# Rebuild images
docker build -t scouting-outing-backend:latest ./backend
docker build -t scouting-outing-frontend:latest ./frontend

# Import to K3s
docker save scouting-outing-backend:latest | sudo k3s ctr images import -
docker save scouting-outing-frontend:latest | sudo k3s ctr images import -

# Restart deployments
kubectl rollout restart deployment/backend -n scouting-outing-manager
kubectl rollout restart deployment/frontend -n scouting-outing-manager
```

### Backup database

```bash
# Create backup
kubectl exec postgres-0 -n scouting-outing-manager -- pg_dump -U postgres scouting_outings > backup.sql

# Restore backup
kubectl exec -i postgres-0 -n scouting-outing-manager -- psql -U postgres scouting_outings < backup.sql
```

### View logs

```bash
# Stream logs
kubectl logs -f -n scouting-outing-manager -l app=backend
kubectl logs -f -n scouting-outing-manager -l app=frontend
```

## Alternative: Docker Compose Deployment (Simpler for Small VPS)

If K3s is too resource-intensive, you can use Docker Compose instead:

```bash
# Use the existing docker-compose.yml
docker-compose up -d

# Set up Nginx as reverse proxy
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Configure Nginx (create /etc/nginx/sites-available/scouting-outings)
# Then get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Resource Optimization Tips

1. **Reduce replicas**: Set all deployments to 1 replica
2. **Lower resource limits**: Adjust memory/CPU limits in deployment files
3. **Use local storage**: K3s local-path provisioner is efficient
4. **Enable swap**: Add swap space if RAM is limited
5. **Monitor resources**: Use `kubectl top` to track usage

## Security Recommendations

1. **Firewall**: Only open ports 80, 443, and 22
2. **SSH**: Use key-based authentication, disable password auth
3. **Updates**: Regularly update system packages
4. **Secrets**: Never commit secrets.yaml to version control
5. **Backups**: Regularly backup database and persistent volumes