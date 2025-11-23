# Trailhead

A comprehensive web application for managing scout troop outings, signups, and participant information with family management capabilities.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- Clerk account (free at [clerk.com](https://clerk.com))

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trailhead
   ```

2. **Get Clerk API Keys**
   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Copy your API keys from the dashboard

3. **Configure environment variables**
   ```bash
   # Copy example files
   cp .env.example .env
   cp frontend/.env.example frontend/.env.development
   
   # Edit .env and add your Clerk keys
   CLERK_SECRET_KEY=sk_test_your_key_here
   CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   
   # Edit frontend/.env.development
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

4. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📚 Documentation

- [Quick Start Guide](QUICK_START.md) - Get started quickly
- [Clerk Migration Guide](CLERK_MIGRATION_GUIDE.md) - Complete guide for Clerk authentication setup
- [HTTPS Setup Guide](HTTPS_SETUP.md) - Production HTTPS configuration with SSL certificates
- [Architecture](ARCHITECTURE.md) - System architecture and design
- [API Documentation](backend/API_DOCUMENTATION.md) - Backend API reference
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions

## ✨ Features

### Outing Management
- Create and manage scouting outings
- Set capacity limits (youth and adult)
- Track outing dates and locations
- Export rosters to PDF

### Family Signups
- Multi-participant registration per family
- Youth and adult participant tracking
- Dietary restrictions and allergy management
- Emergency contact information

### Scouting America Compliance
- Two-deep leadership tracking
- Youth protection requirements
- Adult qualification tracking
- Transportation capacity planning

### Administration
- Role-based access control (admin, parent, user)
- CSV roster import/export
- Real-time signup tracking
- Family management dashboard

## 🔐 Authentication

This project uses **Clerk** for authentication, providing:
- Modern, secure authentication
- Built-in user management
- Social login support
- Beautiful pre-built UI components
- No infrastructure to manage

See [CLERK_MIGRATION_GUIDE.md](CLERK_MIGRATION_GUIDE.md) for detailed setup instructions.

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Clerk React for authentication
- Vite for build tooling

### Backend
- FastAPI (Python)
- PostgreSQL database
- SQLAlchemy ORM
- Alembic for migrations
- Clerk Backend API for auth

### Infrastructure
- Docker & Docker Compose
- Nginx (production)

## 📦 Project Structure

```
trailhead/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Core functionality (auth, config)
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── utils/       # Utilities
│   ├── alembic/         # Database migrations
│   └── tests/           # Backend tests
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── types/       # TypeScript types
│   └── public/          # Static assets
├── postgres/            # PostgreSQL initialization
├── nginx/               # Nginx configuration
└── docker-compose.yml   # Docker orchestration
```

## 🔧 Development

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests (if configured)
cd frontend
npm test
```

## 🚢 Deployment

### Production Deployment

For production deployment with HTTPS:

1. **Run the bootstrap script**
   ```bash
   ./bootstrap.sh
   ```
   - Select "Production" mode
   - Provide your domain name
   - Configure SSL certificates (Let's Encrypt recommended)

2. **Start the services**
   ```bash
   docker compose --profile production up -d
   ```

See [HTTPS_SETUP.md](HTTPS_SETUP.md) for detailed HTTPS configuration and [DEPLOYMENT.md](DEPLOYMENT.md) for additional deployment options.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**Adam Sowers**
- Website: [scouthacks.net](https://scouthacks.net)
- GitHub: [@jadamsowers](https://github.com/jadamsowers)

## 🙏 Acknowledgments

- Built for scout troops to simplify outing management
- Designed with Scouting America youth protection in mind
- Vibe-coded with ⚜️❤️

## 📞 Support

For issues and questions:
- Check the [documentation](CLERK_MIGRATION_GUIDE.md)
- Open an issue on GitHub
- Contact via [scouthacks.net](https://scouthacks.net)

---

**Note**: This project uses Clerk for modern, secure authentication. See [CLERK_MIGRATION_GUIDE.md](CLERK_MIGRATION_GUIDE.md) for setup details.