#!/bin/bash
set -e

echo "🔄 Generating TypeScript types from OpenAPI spec..."

# Ensure backend is running
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ Backend is not running. Please start it first:"
    echo "   cd backend && uvicorn app.main:app --reload"
    exit 1
fi

# Fetch OpenAPI spec
echo "📥 Fetching OpenAPI spec from backend..."
curl -s http://localhost:8000/openapi.json -o openapi.json

# Generate TypeScript types
echo "🔨 Generating TypeScript types..."
npx openapi-typescript openapi.json -o src/types/generated.ts

# Clean up
rm openapi.json

echo "✅ Types generated successfully at src/types/generated.ts"