#!/bin/bash

echo "?? HybridTradeAI - Quick Setup Script"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "? .env file not found!"
    echo "Please create .env file with your database URL"
    echo "See QUICK_START.md for instructions"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=\"postgresql://" .env; then
    echo "??  DATABASE_URL not configured with PostgreSQL"
    echo ""
    echo "Quick setup options:"
    echo ""
    echo "1??  Get FREE database from Neon (fastest):"
    echo "   - Visit: https://neon.tech"
    echo "   - Sign up and create project"
    echo "   - Copy connection string"
    echo "   - Update DATABASE_URL in .env"
    echo ""
    echo "2??  Use Docker PostgreSQL:"
    echo "   docker run --name hybridtradeai-postgres \\"
    echo "     -e POSTGRES_PASSWORD=password \\"
    echo "     -e POSTGRES_DB=hybridtradeai \\"
    echo "     -p 5432:5432 -d postgres:15-alpine"
    echo ""
    echo "   Then update .env:"
    echo "   DATABASE_URL=\"postgresql://postgres:password@localhost:5432/hybridtradeai\""
    echo ""
    read -p "Press Enter after updating DATABASE_URL in .env..."
fi

echo "?? Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "? Failed to install dependencies"
    exit 1
fi

echo ""
echo "???  Setting up database..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "? Failed to set up database"
    echo "Please check your DATABASE_URL in .env"
    exit 1
fi

echo ""
echo "?? Seeding initial data..."
npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts

if [ $? -ne 0 ]; then
    echo "??  Seeding failed, but you can continue"
fi

echo ""
echo "? Setup complete!"
echo ""
echo "?? Ready to start!"
echo ""
echo "Run: npm run dev"
echo "Visit: http://localhost:3000"
echo ""
echo "Default admin login:"
echo "  Email: admin@hybridtradeai.local"
echo "  Password: Admin123!Change"
echo ""
