# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Trailhead application.

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
kubectl wait --for=condition=ready pod -l app=postgres -n  --timeout=300s

# Deploy backend
kubectl apply -f backend-deployment.yaml

# Wait for backend to be ready
kubectl wait --for=condition=ready pod -l app=backend -n  --timeout=300s

# Deploy frontend
kubectl apply -f frontend-deployment.yaml

# Deploy ingress
kubectl apply -f ingress.yaml
```

### 6. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n 

# Check services
kubectl get svc -n 

# Check ingress
kubectl get ingress -n 

# View logs
kubectl logs -f deployment/backend -n 
kubectl logs -f deployment/frontend -n 
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
kubectl exec -it deployment/backend -n  -- atlas migrate apply --env sqlalchemy
```

### Create Admin User

```bash
kubectl exec -it deployment/backend -n  -- python -m app.db.init_db
```

**Note:** The admin user email and password can be configured via environment variables in your ConfigMap or Secrets:
- `INITIAL_ADMIN_EMAIL` (default: `soadmin@scouthacks.net`)
- `INITIAL_ADMIN_PASSWORD` (optional; if not set, a random password will be generated and displayed in the pod logs)

To view the generated password, check the pod logs:
```bash
kubectl logs deployment/backend -n  | grep -A 10 "Admin User Created"
```

### Backup Database

```bash
# Get PostgreSQL pod name
POD=$(kubectl get pod -l app=postgres -n  -o jsonpath='{.items[0].metadata.name}')

# Create backup
kubectl exec -n  $POD -- pg_dump -U postgres scouting_outings > backup.sql
```

### Restore Database

```bash
# Get PostgreSQL pod name
POD=$(kubectl get pod -l app=postgres -n  -o jsonpath='{.items[0].metadata.name}')

# Restore from backup
kubectl exec -i -n  $POD -- psql -U postgres scouting_outings < backup.sql
```

## Scaling

### Scale Backend

```bash
kubectl scale deployment backend --replicas=3 -n 
```

### Scale Frontend

```bash
kubectl scale deployment frontend --replicas=3 -n 
```

## Monitoring

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n 

# Frontend logs
kubectl logs -f deployment/frontend -n 

# PostgreSQL logs
kubectl logs -f statefulset/postgres -n 

# All logs
kubectl logs -f -l app= -n 
```

### Check Resource Usage

```bash
kubectl top pods -n 
kubectl top nodes
```

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n 

# Check pod logs
kubectl logs <pod-name> -n 

# Check previous container logs (if pod restarted)
kubectl logs <pod-name> -n  --previous
```

### Database Connection Issues

```bash
# Test database connectivity from backend pod
kubectl exec -it deployment/backend -n  -- nc -zv postgres 5432

# Check PostgreSQL logs
kubectl logs statefulset/postgres -n 
```

### Ingress Not Working

```bash
# Check ingress status
kubectl describe ingress -ingress -n 

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
kubectl set image deployment/backend backend=your-registry/scouting-outing-backend:v2 -n 

# Or edit the deployment file and apply
kubectl apply -f backend-deployment.yaml
```

### Update Frontend

```bash
# Build and push new image
docker build -t your-registry/scouting-outing-frontend:v2 frontend/
docker push your-registry/scouting-outing-backend:v2

# Update deployment
kubectl set image deployment/frontend frontend=your-registry/scouting-outing-frontend:v2 -n 
```

## Cleanup

To remove the entire deployment:

```bash
kubectl delete namespace 
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