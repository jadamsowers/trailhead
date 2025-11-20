#!/bin/bash
# Setup script for pre-commit hooks
# This script installs pre-commit and sets up the hooks for type synchronization

set -e

echo "🔧 Setting up pre-commit hooks for type synchronization..."

# Check if pre-commit is installed
if ! command -v pre-commit &> /dev/null; then
    echo "📦 Installing pre-commit..."
    pip install pre-commit
else
    echo "✅ pre-commit is already installed"
fi

# Install the git hooks
echo "🪝 Installing git hooks..."
pre-commit install

# Optionally install hooks for commit-msg and pre-push stages
pre-commit install --hook-type commit-msg
pre-commit install --hook-type pre-push

echo ""
echo "✅ Pre-commit hooks installed successfully!"
echo ""
echo "📝 What happens now:"
echo "   • When you commit changes to backend/app/schemas/*.py files:"
echo "     1. TypeScript types will be automatically regenerated"
echo "     2. Contract tests will run to verify type compatibility"
echo "     3. Generated types will be staged for commit"
echo ""
echo "🧪 To test the hooks manually, run:"
echo "   pre-commit run --all-files"
echo ""
echo "⚙️  To skip hooks for a specific commit (not recommended), use:"
echo "   git commit --no-verify"
echo ""