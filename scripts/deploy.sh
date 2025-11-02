#!/bin/bash

# HybridTradeAI Deployment Script
# This script helps with deployment preparation

set -e

echo "?? HybridTradeAI Deployment Script"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "??  Warning: .env.local not found"
    echo "   Please copy .env.example to .env.local and fill in your values"
    echo ""
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "? Error: Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "? Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "?? Installing dependencies..."
npm install

# Generate Prisma Client
echo "?? Generating Prisma Client..."
npx prisma generate

# Check database connection
echo "?? Checking database connection..."
if npx prisma db pull > /dev/null 2>&1; then
    echo "? Database connection successful"
else
    echo "??  Warning: Could not connect to database"
    echo "   Make sure DATABASE_URL is set correctly"
fi

# Run migrations
echo "???  Running database migrations..."
npx prisma migrate deploy || echo "??  No migrations to run or migration failed"

# Seed database (optional)
read -p "?? Do you want to seed the database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding database..."
    npm run db:seed
fi

# Build the application
echo "???  Building application..."
npm run build

echo ""
echo "? Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Verify all environment variables are set"
echo "2. Run 'npm start' to start the production server"
echo "3. Or deploy to your hosting platform (Vercel, Railway, etc.)"
echo ""
