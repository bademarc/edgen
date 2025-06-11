#!/bin/bash

echo "🚀 Starting LayerEdge Community Platform..."

# Check if we're in production
if [ "$NODE_ENV" = "production" ]; then
    echo "📦 Production environment detected"

    # Check if Playwright browsers are installed
    PLAYWRIGHT_CACHE_DIR="/home/nextjs/.cache/ms-playwright"

    echo "🔍 Checking Playwright browser installation..."
    echo "   Cache directory: $PLAYWRIGHT_CACHE_DIR"

    # List contents of cache directory for debugging
    if [ -d "$PLAYWRIGHT_CACHE_DIR" ]; then
        echo "   Cache directory contents:"
        ls -la "$PLAYWRIGHT_CACHE_DIR" || echo "   Failed to list cache directory"

        # Look for any chromium installation
        CHROMIUM_DIRS=$(find "$PLAYWRIGHT_CACHE_DIR" -name "*chromium*" -type d 2>/dev/null || true)
        if [ -n "$CHROMIUM_DIRS" ]; then
            echo "   Found Chromium directories:"
            echo "$CHROMIUM_DIRS"

            # Look for executable
            CHROMIUM_EXEC=$(find "$PLAYWRIGHT_CACHE_DIR" -name "chrome" -o -name "chromium" -o -name "headless_shell" 2>/dev/null | head -1)
            if [ -n "$CHROMIUM_EXEC" ] && [ -x "$CHROMIUM_EXEC" ]; then
                echo "✅ Playwright browsers found at: $CHROMIUM_EXEC"
            else
                echo "⚠️  Chromium directories found but no executable"
            fi
        else
            echo "❌ No Chromium installation found"
        fi
    else
        echo "❌ Playwright cache directory not found"
    fi

    # Always try to install/update browsers to ensure they're available
    echo "🔧 Installing/updating Playwright browsers..."
    npx playwright install chromium --with-deps || {
        echo "❌ Failed to install Playwright browsers"
        echo "⚠️  Web scraping functionality will be unavailable"

        # Try alternative installation method
        echo "🔧 Trying alternative installation..."
        PLAYWRIGHT_BROWSERS_PATH="$PLAYWRIGHT_CACHE_DIR" npx playwright install chromium || {
            echo "❌ Alternative installation also failed"
        }
    }

    # Verify installation after attempt
    echo "🔍 Verifying browser installation..."
    if [ -d "$PLAYWRIGHT_CACHE_DIR" ]; then
        echo "   Browser files found:"
        find "$PLAYWRIGHT_CACHE_DIR" -name "*chrome*" -type f 2>/dev/null | head -5

        # PRIORITY FIX: Test browser executable
        CHROME_EXEC=$(find "$PLAYWRIGHT_CACHE_DIR" -name "chrome" -type f -executable 2>/dev/null | head -1)
        if [ -n "$CHROME_EXEC" ]; then
            echo "✅ Chrome executable found: $CHROME_EXEC"
            # Test if browser can start (quick test)
            timeout 10s "$CHROME_EXEC" --version 2>/dev/null && echo "✅ Browser test successful" || echo "⚠️ Browser test failed"
        else
            echo "❌ No executable Chrome found"
        fi
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

    # Handle database migrations with baseline support
    echo "🗄️  Setting up database schema..."

    # First, try standard migration deployment
    echo "   Attempting standard migration deployment..."
    if npx prisma migrate deploy 2>/dev/null; then
        echo "✅ Standard migrations deployed successfully"
    else
        echo "⚠️  Standard migration failed - checking for P3005 error..."

        # Check if it's the P3005 error (database not empty)
        MIGRATION_OUTPUT=$(npx prisma migrate deploy 2>&1 || true)
        if echo "$MIGRATION_OUTPUT" | grep -q "P3005"; then
            echo "🔧 Detected P3005 error - running database baseline..."

            # Use our baseline script to resolve the issue
            if node scripts/baseline-database.js; then
                echo "✅ Database baseline completed successfully"
            else
                echo "❌ Database baseline failed"
                echo "   Migration output: $MIGRATION_OUTPUT"
                exit 1
            fi
        else
            echo "❌ Migration failed with different error:"
            echo "$MIGRATION_OUTPUT"
            exit 1
        fi
    fi

    # Ensure Prisma client is generated
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
