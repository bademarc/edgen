#!/bin/bash

# LayerEdge Community Platform - Automatic Monitoring Deployment Script
# This script helps deploy the automatic monitoring system to Koyeb

set -e

echo "🚀 LayerEdge Automatic Monitoring Deployment"
echo "============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check for required environment variables
echo "🔍 Checking environment variables..."

required_vars=(
    "TWITTER_CLIENT_ID"
    "TWITTER_CLIENT_SECRET" 
    "TWITTER_BEARER_TOKEN"
    "DATABASE_URL"
    "DIRECT_URL"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '   %s\n' "${missing_vars[@]}"
    echo ""
    echo "Please set these variables before deploying:"
    echo "export TWITTER_CLIENT_ID=your_client_id"
    echo "export TWITTER_CLIENT_SECRET=your_client_secret"
    echo "export TWITTER_BEARER_TOKEN=your_bearer_token"
    echo "# ... etc"
    exit 1
fi

echo "✅ All required environment variables are set"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Run database migration
echo ""
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo ""
echo "🏗️  Building application..."
npm run build

# Test the monitoring system
echo ""
echo "🧪 Testing monitoring system..."
if command -v npx &> /dev/null; then
    echo "Running monitoring test..."
    npx tsx scripts/test-monitoring.ts || echo "⚠️  Test failed - check logs"
else
    echo "⚠️  Cannot run test - tsx not available"
fi

# Deployment instructions
echo ""
echo "🚀 Deployment Instructions"
echo "=========================="
echo ""
echo "1. Deploy to Koyeb:"
echo "   - Push your changes to your Git repository"
echo "   - Koyeb will automatically deploy the new version"
echo ""
echo "2. Set up cron job in Koyeb:"
echo "   - Go to your Koyeb service settings"
echo "   - Add a cron job with the following configuration:"
echo "   - Schedule: '0,30 * * * *' (every 30 minutes)"
echo "   - Command: curl -H \"Authorization: Bearer \${CRON_SECRET}\" \${KOYEB_PUBLIC_DOMAIN}/api/cron/monitor-tweets"
echo ""
echo "3. Environment Variables to set in Koyeb:"
echo "   CRON_SECRET=layeredge-cron-secret-2024"
echo "   ADMIN_SECRET=layeredge-admin-secret-2024"
echo ""
echo "4. Test the deployment:"
echo "   curl -X POST https://your-app.koyeb.app/api/monitoring/batch \\"
echo "        -H \"Authorization: Bearer layeredge-cron-secret-2024\""
echo ""

# Create a deployment checklist
cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# Automatic Monitoring Deployment Checklist

## Pre-Deployment
- [ ] All environment variables set
- [ ] Database migrations tested locally
- [ ] Monitoring system tested locally
- [ ] Code pushed to Git repository

## Koyeb Deployment
- [ ] Application deployed successfully
- [ ] Environment variables configured in Koyeb
- [ ] Database connection working
- [ ] API endpoints responding

## Cron Job Setup
- [ ] Cron job created in Koyeb
- [ ] Schedule set to: `0,30 * * * *`
- [ ] Cron secret configured
- [ ] Test cron endpoint manually

## Post-Deployment Testing
- [ ] User authentication working
- [ ] Automatic monitoring initializing for new users
- [ ] Manual monitoring trigger working
- [ ] Batch monitoring endpoint working
- [ ] Dashboard showing monitoring status

## User Communication
- [ ] Update documentation
- [ ] Notify users about new automatic system
- [ ] Remove references to manual submission
- [ ] Update help/FAQ sections

## Monitoring & Maintenance
- [ ] Set up monitoring alerts
- [ ] Check cron job logs regularly
- [ ] Monitor Twitter API rate limits
- [ ] Track system performance metrics
EOF

echo "📋 Created DEPLOYMENT_CHECKLIST.md for tracking deployment progress"
echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Review the deployment checklist"
echo "2. Push changes to your Git repository"
echo "3. Configure cron job in Koyeb"
echo "4. Test the automatic monitoring system"
echo ""
echo "🎉 Your LayerEdge community platform is ready for automatic monitoring!"
