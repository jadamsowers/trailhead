# Scouting Outing Manager

A comprehensive web application for managing scout troop trips, participant signups, and Scouting America compliance requirements.

## 🎯 Features

### For Participants
- **Multi-Participant Signups** - Register multiple scouts and adults per family
- **Dietary Tracking** - Manage dietary restrictions and allergies with severity levels
- **Scouting America Compliance** - Track youth protection training and two-deep leadership requirements
- **Transportation Planning** - Record vehicle capacity for trip logistics

### For Administrators
- **Trip Management** - Create and manage trips with capacity tracking
- **Signup Oversight** - View all signups with detailed participant information
- **CSV Import/Export** - Bulk roster management capabilities
- **Real-time Capacity** - Monitor trip capacity and prevent overbooking

## 🏗️ Architecture

### Backend (FastAPI + PostgreSQL)
- **FastAPI** - Modern async Python web framework
- **PostgreSQL** - Relational database with UUID primary keys
- **SQLAlchemy 2.0** - Async ORM with type hints
- **Alembic** - Database migration management
- **Pydantic v2** - Data validation and serialization

### Frontend (React + TypeScript)
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **React Router** - Client-side routing
- **Fetch API** - RESTful API integration

### Database Schema
- **users** - Admin and user accounts
- **trips** - Trip information with capacity tracking
- **signups** - Family signup records
- **participants** - Individual participant details
- **dietary_restrictions** - Dietary preferences
- **allergies** - Allergy information with severity
- **refresh_tokens** - JWT token management

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 16+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Using Docker Compose (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd scouting-outing-manager
```

2. **Start the backend services**
```bash
cd backend
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- FastAPI backend on port 8000

3. **Install frontend dependencies**
```bash
npm install
```

4. **Create environment file**
```bash
cp .env.example .env
```

5. **Start the frontend**
```bash
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Default Admin Credentials
- **Email**: admin@scouttrips.local
- **Password**: admin123

## 📚 API Documentation

### Interactive Documentation
Visit http://localhost:8000/docs for interactive Swagger UI documentation with:
- All API endpoints
- Request/response schemas
- Try-it-out functionality
- Authentication flows

### Key Endpoints

#### Trips
- `GET /api/trips` - List all trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/{id}` - Get trip details
- `PUT /api/trips/{id}` - Update trip
- `DELETE /api/trips/{id}` - Delete trip

#### Signups
- `POST /api/signups` - Create family signup
- `GET /api/signups/{id}` - Get signup details
- `GET /api/signups/trip/{trip_id}` - List signups for a trip

#### CSV Operations
- `POST /api/csv/import` - Bulk import participants
- `GET /api/csv/export/{trip_id}` - Export roster

## 🗄️ Database Management

### Migrations

```bash
# Create a new migration
cd backend
docker-compose exec backend alembic revision --autogenerate -m "Description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback one migration
docker-compose exec backend alembic downgrade -1
```

### Initialize Database
```bash
docker-compose exec backend python -m app.db.init_db
```

## 🧪 Development

### Backend Development

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Environment Variables

#### Backend (.env)
```env
# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=scout_trips

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

## 📋 Scouting America-Specific Features

### Two-Deep Leadership
- Automatically tracks male/female participant ratios
- Enforces two-deep leadership requirements for overnight trips
- Validates adult supervision requirements

### Youth Protection Training
- Tracks Scouting America youth protection training status for adults
- Required for overnight trip participation
- Validates training requirements during signup

### Participant Types
- **Scouts** - Requires age, troop number, optional patrol
- **Adults** - Requires youth protection training status, optional vehicle capacity

### Dietary & Medical
- Common dietary restrictions (vegetarian, vegan, gluten-free, etc.)
- Allergy tracking with severity levels (mild, moderate, severe)
- Additional notes for special requirements

## 🐳 Docker Deployment

### Backend Dockerfile
```bash
cd backend
docker build -t scouting-outing-backend .
docker run -p 8000:8000 scouting-outing-backend
```

### Frontend Dockerfile
```bash
docker build -t scouting-outing-frontend .
docker run -p 3000:80 scouting-outing-frontend
```

## ☸️ Kubernetes Deployment

Kubernetes manifests are available in the `k8s/` directory (coming soon):
- Deployments for frontend and backend
- StatefulSet for PostgreSQL
- Services for internal communication
- Ingress for external access
- ConfigMaps and Secrets

## 📖 Additional Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design decisions
- **[SECURITY_AUTH.md](SECURITY_AUTH.md)** - Authentication and authorization design
- **[TYPE_SYNC_IMPLEMENTATION.md](TYPE_SYNC_IMPLEMENTATION.md)** - Type synchronization between backend and frontend
- **[PRE_COMMIT_SETUP.md](PRE_COMMIT_SETUP.md)** - Pre-commit hooks for automatic type regeneration
- **[backend/MIGRATIONS.md](backend/MIGRATIONS.md)** - Database migration guide
- **[backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)** - Comprehensive API reference
- **[backend/QUICKSTART.md](backend/QUICKSTART.md)** - 5-minute setup guide

## 🔒 Security

- JWT-based authentication (models ready, endpoints pending)
- Password hashing with bcrypt
- CORS protection
- SQL injection prevention via SQLAlchemy ORM
- Input validation with Pydantic

## 🧩 Technology Stack

### Backend
- Python 3.11
- FastAPI 0.104.1
- SQLAlchemy 2.0.23
- PostgreSQL 15
- Alembic 1.12.1
- Pydantic 2.5.0
- python-jose (JWT)
- passlib (password hashing)

### Frontend
- React 18
- TypeScript 4.9+
- React Router 6
- Modern CSS (no framework)

### DevOps
- Docker & Docker Compose
- Kubernetes (manifests pending)
- GitHub Actions (CI/CD pending)

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue]
- API Documentation: http://localhost:8000/docs
- Email: support@scouttrips.local

## 🎯 Roadmap

### Completed ✅
- [x] Database schema and migrations
- [x] Core API endpoints (trips, signups, CSV)
- [x] React frontend with TypeScript
- [x] Participant signup form with Scouting America features
- [x] Admin dashboard
- [x] Docker Compose setup
- [x] Comprehensive documentation

### In Progress 🚧
- [ ] JWT authentication endpoints
- [ ] Protected routes in frontend
- [ ] Login/logout UI

### Planned 📋
- [ ] Email notifications
- [ ] Payment integration
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Calendar integration
- [ ] Weather API integration
- [ ] Equipment tracking
- [ ] Permission slips
- [ ] Medical forms management

## 🙏 Acknowledgments

Built for Scouting America troops to simplify trip management and ensure compliance with youth protection requirements.

---

**Version**: 1.0.0  
**Last Updated**: 2024