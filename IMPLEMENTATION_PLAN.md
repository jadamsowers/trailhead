# Scouting Outing Manager - Implementation Plan

## Project Structure

```
scouting-outing-manager/
├── frontend/                    # React TypeScript SPA
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── backend/                     # Python FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   └── deps.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── crud/
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── session.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   └── main.py
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── alembic.ini
├── k8s/                         # Kubernetes manifests
│   ├── base/
│   │   ├── frontend-deployment.yaml
│   │   ├── backend-deployment.yaml
│   │   ├── postgres-statefulset.yaml
│   │   ├── services.yaml
│   │   ├── configmap.yaml
│   │   └── secrets.yaml
│   ├── overlays/
│   │   ├── development/
│   │   └── production/
│   └── ingress.yaml
├── docker-compose.yml
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
└── README.md
```

## Phase 1: Backend Foundation

### 1.1 Database Models (SQLAlchemy)

**File: backend/app/models/trip.py**
```python
from sqlalchemy import Column, String, Integer, Boolean, Date, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

class Trip(Base):
    __tablename__ = "trips"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    trip_date = Column(Date, nullable=False)
    location = Column(String(255), nullable=False)
    description = Column(Text)
    max_participants = Column(Integer, nullable=False)
    is_overnight = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    signups = relationship("Signup", back_populates="trip", cascade="all, delete-orphan")
```

**File: backend/app/models/signup.py**
```python
class Signup(Base):
    __tablename__ = "signups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    family_contact_name = Column(String(255), nullable=False)
    family_contact_email = Column(String(255), nullable=False)
    family_contact_phone = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    trip = relationship("Trip", back_populates="signups")
    participants = relationship("Participant", back_populates="signup", cascade="all, delete-orphan")
```

**File: backend/app/models/participant.py**
```python
class Participant(Base):
    __tablename__ = "participants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    signup_id = Column(UUID(as_uuid=True), ForeignKey("signups.id"), nullable=False)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    participant_type = Column(String(50), nullable=False)  # 'scout' or 'adult'
    is_adult = Column(Boolean, default=False)
    has_youth_protection = Column(Boolean, default=False)
    vehicle_capacity = Column(Integer, default=0)
    medical_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    signup = relationship("Signup", back_populates="participants")
    dietary_restrictions = relationship("DietaryRestriction", back_populates="participant", cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="participant", cascade="all, delete-orphan")
```

### 1.2 Pydantic Schemas

**File: backend/app/schemas/trip.py**
```python
from pydantic import BaseModel, Field
from datetime import date
from uuid import UUID
from typing import Optional, List

class TripBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    trip_date: date
    location: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    max_participants: int = Field(..., gt=0)
    is_overnight: bool = False

class TripCreate(TripBase):
    pass

class TripUpdate(TripBase):
    pass

class TripInDB(TripBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    signup_count: int = 0
    available_spots: int = 0
    
    class Config:
        from_attributes = True
```

### 1.3 API Endpoints Structure

**File: backend/app/api/endpoints/trips.py**
- GET /api/trips - List all trips
- POST /api/trips - Create trip
- GET /api/trips/{trip_id} - Get trip details
- PUT /api/trips/{trip_id} - Update trip
- DELETE /api/trips/{trip_id} - Delete trip
- GET /api/trips/{trip_id}/signups - Get trip signups
- GET /api/trips/{trip_id}/export - Export CSV

**File: backend/app/api/endpoints/signups.py**
- GET /api/trips/available - List available trips
- POST /api/signups - Create signup
- GET /api/signups/{signup_id} - Get signup
- DELETE /api/signups/{signup_id} - Cancel signup

### 1.4 Database Configuration

**File: backend/app/core/config.py**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Scouting Outing Manager"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5432
    
    DATABASE_URL: str = None
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.DATABASE_URL = f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

## Phase 2: Frontend Enhancement

### 2.1 Updated TypeScript Types

**File: frontend/src/types/index.ts**
```typescript
export interface Trip {
  id: string;
  name: string;
  trip_date: string;
  location: string;
  description?: string;
  max_participants: number;
  is_overnight: boolean;
  signup_count: number;
  available_spots: number;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  name: string;
  age: number;
  participant_type: 'scout' | 'adult';
  is_adult: boolean;
  has_youth_protection?: boolean;
  vehicle_capacity?: number;
  dietary_restrictions: string[];
  allergies: string[];
  medical_notes?: string;
}

export interface SignupRequest {
  trip_id: string;
  family_contact: {
    name: string;
    email: string;
    phone: string;
  };
  participants: Participant[];
}

export interface Signup {
  id: string;
  trip_id: string;
  family_contact_name: string;
  family_contact_email: string;
  family_contact_phone: string;
  participants: Participant[];
  created_at: string;
}

export const DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'kosher',
  'halal',
  'nut-free'
] as const;

export const ALLERGIES = [
  'peanuts',
  'tree-nuts',
  'shellfish',
  'fish',
  'eggs',
  'milk',
  'soy',
  'wheat',
  'sesame'
] as const;
```

### 2.2 API Service

**File: frontend/src/services/api.ts**
```typescript
import axios from 'axios';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const tripApi = {
  getAll: () => apiClient.get('/trips'),
  getById: (id: string) => apiClient.get(`/trips/${id}`),
  create: (data: TripCreate) => apiClient.post('/trips', data),
  update: (id: string, data: TripUpdate) => apiClient.put(`/trips/${id}`, data),
  delete: (id: string) => apiClient.delete(`/trips/${id}`),
  getSignups: (id: string) => apiClient.get(`/trips/${id}/signups`),
  exportSignups: (id: string) => apiClient.get(`/trips/${id}/export`, { responseType: 'blob' }),
};

export const signupApi = {
  getAvailableTrips: () => apiClient.get('/trips/available'),
  create: (data: SignupRequest) => apiClient.post('/signups', data),
  getById: (id: string) => apiClient.get(`/signups/${id}`),
  cancel: (id: string) => apiClient.delete(`/signups/${id}`),
};
```

## Phase 3: Containerization

### 3.1 Frontend Dockerfile

**File: frontend/Dockerfile**
```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**File: frontend/nginx.conf**
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend-service:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3.2 Backend Dockerfile

**File: backend/Dockerfile**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run migrations and start server
CMD alembic upgrade head && \
    uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Phase 4: Kubernetes Deployment

### 4.1 PostgreSQL StatefulSet

**File: k8s/base/postgres-statefulset.yaml**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: POSTGRES_DB
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: POSTGRES_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

### 4.2 Backend Deployment

**File: k8s/base/backend-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: scouting-outing-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: POSTGRES_SERVER
          value: postgres-service
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: POSTGRES_DB
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: POSTGRES_PASSWORD
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 4.3 Frontend Deployment

**File: k8s/base/frontend-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: scouting-outing-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

### 4.4 Services

**File: k8s/base/services.yaml**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  clusterIP: None
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

### 4.5 Ingress

**File: k8s/ingress.yaml**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: scouting-outing-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: scouting-outings.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

## Phase 5: Local Development

### 5.1 Docker Compose

**File: docker-compose.yml**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: scout_trips
      POSTGRES_USER: scout_admin
      POSTGRES_PASSWORD: scout_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      POSTGRES_SERVER: postgres
      POSTGRES_DB: scout_trips
      POSTGRES_USER: scout_admin
      POSTGRES_PASSWORD: scout_password
    depends_on:
      - postgres
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://localhost:8000/api

volumes:
  postgres_data:
```

## Implementation Order

1. **Backend Foundation** (Days 1-3)
   - Set up FastAPI project structure
   - Create database models
   - Implement Pydantic schemas
   - Set up Alembic migrations

2. **API Development** (Days 4-6)
   - Implement trip endpoints
   - Implement signup endpoints
   - Add validation and error handling
   - Create health check endpoints

3. **Frontend Enhancement** (Days 7-9)
   - Update TypeScript types
   - Create API service layer
   - Build enhanced signup form
   - Implement admin dashboard

4. **Containerization** (Day 10)
   - Create Dockerfiles
   - Test with docker-compose
   - Optimize images

5. **Kubernetes Setup** (Days 11-12)
   - Create all manifests
   - Test on local cluster
   - Document deployment process

6. **Testing & Documentation** (Days 13-14)
   - Integration testing
   - Update README
   - Create deployment guide

## Key Dependencies

### Backend (requirements.txt)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
asyncpg==0.29.0
alembic==1.12.1
pydantic==2.5.0
pydantic-settings==2.1.0
python-multipart==0.0.6
```

### Frontend (package.json additions)
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "react-router-dom": "^6.20.0",
    "react-hook-form": "^7.48.0"
  }
}