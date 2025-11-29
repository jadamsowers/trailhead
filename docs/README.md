# Trailhead

A comprehensive web application for managing scout troop outings, signups, and participant information with family management capabilities.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trailhead
   ```

2. **Run the bootstrap script**
   ```bash
   ./bootstrap.sh
   ```
   
   The script will:
   - Start all services including Authentik (authentication)
   - Generate secure passwords and secrets
   - Create all necessary configuration files
   - Display instructions for completing setup

3. **Configure Authentik**
   
   After services start, access Authentik admin at http://localhost:9000 and:
   - Login with the bootstrap credentials (shown in terminal)
   - Create an OAuth2/OpenID Provider named "trailhead"
   - Create an Application using that provider
   - Copy Client ID and Secret to your .env files
   
   See [AUTHENTIK_SETUP.md](AUTHENTIK_SETUP.md) for detailed instructions.

4. **Start the frontend (development)**
   ```bash
   cd frontend && npm install && npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Authentik Admin: http://localhost:9000

## 📚 Documentation

- [Quick Start Guide](QUICK_START.md) - Get started quickly
- [Authentik Setup Guide](AUTHENTIK_SETUP.md) - Complete guide for Authentik authentication setup
- [HTTPS Setup Guide](HTTPS_SETUP.md) - Production HTTPS configuration with SSL certificates
- [Architecture](ARCHITECTURE.md) - System architecture and design
- [API Documentation](../backend/API_DOCUMENTATION.md) - Backend API reference
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

This project uses **Authentik** for authentication, providing:
- Modern, secure OAuth2/OIDC authentication
- Self-hosted identity provider
- Built-in user management
- Social login support (configurable)
- Group-based role management
- No external dependencies

See [AUTHENTIK_SETUP.md](AUTHENTIK_SETUP.md) for detailed setup instructions.

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- react-oidc-context for authentication
- Vite for build tooling
- Tailwind CSS for styling

### Backend
- FastAPI (Python)
- PostgreSQL database
- SQLAlchemy ORM
- Atlas for migrations
- JWT token verification via Authentik

### Infrastructure
- Docker & Docker Compose
- Authentik (self-hosted authentication)
- Redis (for Authentik)
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
│   ├── migrations/      # Database migrations
│   └── tests/           # Backend tests
├── frontend/            # React frontend
│   ├── src/
│   │   ├── auth/        # Authentik OIDC client
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
atlas migrate apply --env sqlalchemy

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
- Vibe-coded with ⚜️❤️﹠🤖

## 📞 Support

For issues and questions:
- Check the [documentation](AUTHENTIK_SETUP.md)
- Open an issue on GitHub
- Contact via [scouthacks.net](https://scouthacks.net)

---

**Note**: This project uses Authentik for modern, secure authentication. See [AUTHENTIK_SETUP.md](AUTHENTIK_SETUP.md) for setup details.