# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Scouting Outing Manager application.

## Prerequisites

- Kubernetes cluster (v1.24+)
- `kubectl` configured to access your cluster
- Nginx Ingress Controller installed
- (Optional) cert-manager for automatic TLS certificates
- Docker images built and pushed to a registry

## Architecture

The deployment consists of:
- **PostgreSQL StatefulSet**: Database with persistent storage
- **Backend Deployment**: FastAPI application (2 replicas)
- **Frontend Deployment**: React SPA served by Nginx (2 replicas)
- **Ingress**: Routes external traffic to frontend and backend
- **ConfigMaps**: Non-sensitive configuration
- **Secrets**: Sensitive data (database credentials, API keys)

## Quick Start

### 1. Build and Push Docker Images

```bash
# Build backend image
cd backend
docker build -t your-registry/scouting-outing-backend:latest .
docker push your-registry/scouting-outing-backend:latest

# Build frontend image
cd ../frontend
docker build -t your-registry/scouting-outing-frontend:latest .
docker push your-registry/scouting-outing-frontend:latest
```

### 2. Update Image References

Edit the following files to use your actual image names:
- `backend-deployment.yaml`: Update `image: scouting-outing-backend:latest`
- `frontend-deployment.yaml`: Update `image: scouting-outing-frontend:latest`

### 3. Configure Secrets

```bash
# Copy the example secrets file
cp secrets.yaml.example secrets.yaml

# Generate a secure secret key
openssl rand -hex 32

# Edit secrets.yaml and replace the base64-encoded values
# To encode a value: echo -n "your-value" | base64
vi secrets.yaml
```

**Important**: Never commit `secrets.yaml` to version control!

### 4. Update Configuration

Edit `configmap.yaml` to set:
- `cors-origins`: Your frontend domain(s)
- `api-url`: Your backend API URL (for frontend)

Edit `ingress.yaml` to set:
- `host`: Your actual domain name
- `cert-manager.io/cluster-issuer`: Your cert-manager issuer (if using TLS)

### 5. Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Create secrets and config
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml

# Deploy database
kubectl apply -f postgres-statefulset.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n scouting-outing-manager --timeout=300s

# Deploy backend
kubectl apply -f backend-deployment.yaml

# Wait for backend to be ready
kubectl wait --for=condition=ready pod -l app=backend -n scouting-outing-manager --timeout=300s

# Deploy frontend
kubectl apply -f frontend-deployment.yaml

# Deploy ingress
kubectl apply -f ingress.yaml
```

### 6. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n scouting-outing-manager

# Check services
kubectl get svc -n scouting-outing-manager

# Check ingress
kubectl get ingress -n scouting-outing-manager

# View logs
kubectl logs -f deployment/backend -n scouting-outing-manager
kubectl logs -f deployment/frontend -n scouting-outing-manager
```

## Accessing the Application

Once deployed, access the application at:
- **Frontend**: https://scouting-outings.example.com
- **Backend API**: https://scouting-outings.example.com/api
- **API Docs**: https://scouting-outings.example.com/docs

## Database Management

### Run Migrations

Migrations run automatically via init container in the backend deployment. To run manually:

```bash
kubectl exec -it deployment/backend -n scouting-outing-manager -- alembic upgrade head
```

### Create Admin User

```bash
kubectl exec -it deployment/backend -n scouting-outing-manager -- python -m app.scripts.create_admin
```

### Backup Database

```bash
# Get PostgreSQL pod name
POD=$(kubectl get pod -l app=postgres -n scouting-outing-manager -o jsonpath='{.items[0].metadata.name}')

# Create backup
kubectl exec -n scouting-outing-manager $POD -- pg_dump -U postgres scout_trips > backup.sql
```

### Restore Database

```bash
# Get PostgreSQL pod name
POD=$(kubectl get pod -l app=postgres -n scouting-outing-manager -o jsonpath='{.items[0].metadata.name}')

# Restore from backup
kubectl exec -i -n scouting-outing-manager $POD -- psql -U postgres scout_trips < backup.sql
```

## Scaling

### Scale Backend

```bash
kubectl scale deployment backend --replicas=3 -n scouting-outing-manager
```

### Scale Frontend

```bash
kubectl scale deployment frontend --replicas=3 -n scouting-outing-manager
```

## Monitoring

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n scouting-outing-manager

# Frontend logs
kubectl logs -f deployment/frontend -n scouting-outing-manager

# PostgreSQL logs
kubectl logs -f statefulset/postgres -n scouting-outing-manager

# All logs
kubectl logs -f -l app=scouting-outing-manager -n scouting-outing-manager
```

### Check Resource Usage

```bash
kubectl top pods -n scouting-outing-manager
kubectl top nodes
```

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n scouting-outing-manager

# Check pod logs
kubectl logs <pod-name> -n scouting-outing-manager

# Check previous container logs (if pod restarted)
kubectl logs <pod-name> -n scouting-outing-manager --previous
```

### Database Connection Issues

```bash
# Test database connectivity from backend pod
kubectl exec -it deployment/backend -n scouting-outing-manager -- nc -zv postgres 5432

# Check PostgreSQL logs
kubectl logs statefulset/postgres -n scouting-outing-manager
```

### Ingress Not Working

```bash
# Check ingress status
kubectl describe ingress scouting-outing-manager-ingress -n scouting-outing-manager

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

## Updating the Application

### Update Backend

```bash
# Build and push new image
docker build -t your-registry/scouting-outing-backend:v2 backend/
docker push your-registry/scouting-outing-backend:v2

# Update deployment
kubectl set image deployment/backend backend=your-registry/scouting-outing-backend:v2 -n scouting-outing-manager

# Or edit the deployment file and apply
kubectl apply -f backend-deployment.yaml
```

### Update Frontend

```bash
# Build and push new image
docker build -t your-registry/scouting-outing-frontend:v2 frontend/
docker push your-registry/scouting-outing-backend:v2

# Update deployment
kubectl set image deployment/frontend frontend=your-registry/scouting-outing-frontend:v2 -n scouting-outing-manager
```

## Cleanup

To remove the entire deployment:

```bash
kubectl delete namespace scouting-outing-manager
```

To remove specific components:

```bash
kubectl delete -f ingress.yaml
kubectl delete -f frontend-deployment.yaml
kubectl delete -f backend-deployment.yaml
kubectl delete -f postgres-statefulset.yaml
kubectl delete -f configmap.yaml
kubectl delete -f secrets.yaml
kubectl delete -f namespace.yaml
```

## Security Best Practices

1. **Secrets Management**: Use a secrets management solution like:
   - Sealed Secrets
   - External Secrets Operator
   - HashiCorp Vault
   - Cloud provider secret managers (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)

2. **Network Policies**: Implement network policies to restrict pod-to-pod communication

3. **RBAC**: Configure Role-Based Access Control for service accounts

4. **Pod Security**: Use Pod Security Standards/Policies

5. **Image Security**: 
   - Use specific image tags (not `latest`)
   - Scan images for vulnerabilities
   - Use private registries

6. **TLS**: Always use TLS in production (configure cert-manager)

7. **Resource Limits**: Set appropriate resource requests and limits

8. **Regular Updates**: Keep Kubernetes and all components updated

## Production Considerations

1. **High Availability**:
   - Use multiple replicas for backend and frontend
   - Consider PostgreSQL replication or managed database service
   - Deploy across multiple availability zones

2. **Monitoring**:
   - Set up Prometheus and Grafana
   - Configure alerts for critical metrics
   - Use distributed tracing (Jaeger, Zipkin)

3. **Logging**:
   - Centralized logging (ELK stack, Loki)
   - Log aggregation and analysis

4. **Backup Strategy**:
   - Automated database backups
   - Backup retention policy
   - Test restore procedures

5. **Disaster Recovery**:
   - Document recovery procedures
   - Regular DR drills
   - Off-site backups

6. **Performance**:
   - Use CDN for static assets
   - Implement caching (Redis)
   - Database connection pooling
   - Horizontal Pod Autoscaling

## Support

For issues or questions:
- Check the main [README.md](../README.md)
- Review [ARCHITECTURE.md](../ARCHITECTURE.md)
- Open an issue on GitHub

## License

MIT License - See [LICENSE](../LICENSE) file for details