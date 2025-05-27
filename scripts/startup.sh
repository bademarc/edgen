#!/bin/bash

echo "🚀 Starting LayerEdge Community Platform..."

# Check if we're in production
if [ "$NODE_ENV" = "production" ]; then
    echo "📦 Production environment detected"
    
    # Check if Playwright browsers are installed
    BROWSER_PATH="/home/nextjs/.cache/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell"
    
    if [ ! -f "$BROWSER_PATH" ]; then
        echo "❌ Playwright browsers not found at $BROWSER_PATH"
        echo "🔧 Attempting to install Playwright browsers..."
        
        # Try to install browsers
        npx playwright install chromium || {
            echo "❌ Failed to install Playwright browsers"
            echo "⚠️  Web scraping functionality will be unavailable"
        }
        
        # Install system dependencies if needed
        npx playwright install-deps || {
            echo "⚠️  Failed to install system dependencies"
        }
    else
        echo "✅ Playwright browsers found"
    fi
    
    # Check environment variables
    echo "🔍 Checking environment variables..."
    
    if [ -z "$TWITTER_BEARER_TOKEN" ]; then
        echo "⚠️  TWITTER_BEARER_TOKEN not set - Twitter API will be unavailable"
    else
        echo "✅ Twitter API credentials configured"
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL not set"
        exit 1
    else
        echo "✅ Database URL configured"
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        echo "❌ NEXT_PUBLIC_SUPABASE_URL not set"
        exit 1
    else
        echo "✅ Supabase URL configured"
    fi
    
    # Run database migrations
    echo "🗄️  Running database migrations..."
    npx prisma migrate deploy || {
        echo "❌ Database migration failed"
        exit 1
    }
    
    # Generate Prisma client
    echo "🔧 Generating Prisma client..."
    npx prisma generate || {
        echo "❌ Prisma client generation failed"
        exit 1
    }
    
    echo "✅ Startup checks completed successfully"
else
    echo "🔧 Development environment detected"
fi

# Start the application
echo "🌟 Starting Next.js application..."
exec "$@"
