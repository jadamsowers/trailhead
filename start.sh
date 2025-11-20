#!/bin/bash

# Scouting Outing Manager - Quick Start Script
# This script starts the entire application using Docker Compose

set -e

echo "🚀 Scouting Outing Manager - Starting Application"
echo "=============================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is available (try both old and new syntax)
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
$DOCKER_COMPOSE down 2>/dev/null || true
echo ""

# Build and start services
echo "🔨 Building and starting services..."
echo "   This may take a few minutes on first run..."
echo ""
$DOCKER_COMPOSE up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if $DOCKER_COMPOSE ps | grep -q "Up"; then
    echo ""
    echo "✅ Application is running!"
    echo ""
    echo "📚 Access the API Documentation:"
    echo "   Swagger UI: http://localhost:8000/docs"
    echo "   ReDoc:      http://localhost:8000/redoc"
    echo ""
    echo "🔐 Default Admin Credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "📊 View logs:"
    echo "   $DOCKER_COMPOSE logs -f backend"
    echo ""
    echo "🛑 Stop the application:"
    echo "   $DOCKER_COMPOSE down"
    echo ""
    echo "🔄 Restart the application:"
    echo "   $DOCKER_COMPOSE restart"
    echo ""
else
    echo ""
    echo "❌ Failed to start services. Check logs with:"
    echo "   $DOCKER_COMPOSE logs"
    exit 1
fi