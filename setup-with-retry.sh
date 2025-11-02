#!/bin/bash

echo "?? HybridTradeAI - Setup with Auto-Retry"
echo "========================================"
echo ""

max_attempts=10
attempt=1

echo "?? Testing database connection..."
echo "This will retry every 30 seconds if needed."
echo ""

while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt of $max_attempts..."
    
    if npx prisma db push --skip-generate --accept-data-loss 2>&1 | grep -q "successfully"; then
        echo ""
        echo "? Database connected and schema created!"
        echo ""
        echo "?? Now seeding initial data..."
        npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts
        
        echo ""
        echo "?? Setup complete!"
        echo ""
        echo "Run: npm run dev"
        echo "Visit: http://localhost:3000"
        echo ""
        echo "Admin login:"
        echo "  Email: admin@hybridtradeai.local"
        echo "  Password: Admin123!Change"
        echo ""
        exit 0
    fi
    
    if [ $attempt -lt $max_attempts ]; then
        echo "? Database not ready yet. Waiting 30 seconds..."
        echo "   (Your Supabase project is probably still initializing)"
        echo ""
        sleep 30
    fi
    
    attempt=$((attempt + 1))
done

echo ""
echo "? Could not connect after $max_attempts attempts"
echo ""
echo "Please check:"
echo "1. Your Supabase project is 'Active' in dashboard"
echo "2. Run 'SELECT NOW();' in Supabase SQL Editor to test"
echo "3. Get the connection string from Settings ? Database"
echo ""
exit 1
