#!/bin/bash

# Scouting Outing Manager - Simple Deployment Script for Debian VPS
# This script automates the deployment process

set -e  # Exit on any error

echo "=================================="
echo "Scouting Outing Manager Deployment"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_info "Creating .env file from template..."
    cp .env.production .env
    
    # Generate secure passwords
    SECRET_KEY=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -hex 16)
    
    # Update .env file
    sed -i "s/CHANGE_THIS_TO_A_SECURE_RANDOM_STRING/$SECRET_KEY/" .env
    sed -i "s/CHANGE_THIS_TO_A_SECURE_PASSWORD/$DB_PASSWORD/" .env
    
    print_success ".env file created with secure passwords"
    print_info "Please edit .env file to update your domain name if you have one"
    
    read -p "Press Enter to continue or Ctrl+C to exit and edit .env first..."
fi

# Create required directories
print_info "Creating required directories..."
mkdir -p nginx/ssl nginx/logs
chmod 755 nginx
print_success "Directories created"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    print_success "Docker installed successfully"
    print_info "You may need to log out and back in for docker group changes to take effect"
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Installing..."
    sudo apt-get install -y docker-compose
    print_success "docker-compose installed successfully"
fi

# Stop existing containers if running
if [ "$(docker ps -q -f name=)" ]; then
    print_info "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down
    print_success "Existing containers stopped"
fi

# Build and start containers
print_info "Building and starting containers (this may take a few minutes)..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
print_info "Waiting for services to start..."
sleep 10

# Check if containers are running
if [ "$(docker ps -q -f name=-db)" ] && \
   [ "$(docker ps -q -f name=-backend)" ] && \
   [ "$(docker ps -q -f name=-frontend)" ] && \
   [ "$(docker ps -q -f name=-nginx)" ]; then
    print_success "All containers are running!"
else
    print_error "Some containers failed to start. Checking logs..."
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Display container status
echo ""
print_info "Container Status:"
docker-compose -f docker-compose.prod.yml ps

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=================================="
print_success "Deployment Complete!"
echo "=================================="
echo ""
print_info "Your application is now running at:"
echo "  → http://$SERVER_IP"
echo "  → http://localhost (if accessing from the server)"
echo ""
print_info "API Documentation available at:"
echo "  → http://$SERVER_IP/docs"
echo ""
print_info "Next steps:"
echo "  1. Create an admin user:"
echo "     docker exec -it scouting-outing-backend python -m scripts.create_admin"
echo ""
echo "  2. If you have a domain, update .env with your domain and restart:"
echo "     docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "  3. Set up SSL/HTTPS (recommended):"
echo "     See DEPLOYMENT.md for instructions"
echo ""
print_info "Useful commands:"
echo "  • View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  • Stop: docker-compose -f docker-compose.prod.yml down"
echo "  • Restart: docker-compose -f docker-compose.prod.yml restart"
echo ""
print_info "For more information, see DEPLOYMENT.md"
echo ""