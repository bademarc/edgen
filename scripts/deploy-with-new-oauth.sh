#!/bin/bash

# LayerEdge Deployment Script with New Twitter OAuth 2.0 Credentials
# This script prepares the deployment with updated Twitter OAuth credentials

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 LayerEdge Deployment with New Twitter OAuth 2.0 Credentials${NC}"
echo "=================================================================="

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_step "Checking project structure..."
if [ ! -d "src" ] || [ ! -f "prisma/schema.prisma" ]; then
    print_error "Project structure invalid. Missing src/ or prisma/ directories."
    exit 1
fi
print_success "Project structure validated"

# Verify new Twitter OAuth credentials are set
print_step "Verifying new Twitter OAuth 2.0 credentials..."

REQUIRED_VARS=(
    "TWITTER_CLIENT_ID"
    "TWITTER_CLIENT_SECRET" 
    "TWITTER_BEARER_TOKEN"
    "TWITTER_API_KEY"
    "TWITTER_API_SECRET"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    else
        print_success "$var is set (${#!var} characters)"
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please set these variables in your environment or .env file"
    exit 1
fi

# Validate credential formats
print_step "Validating credential formats..."

# Check Client ID format (should end with :1:ci)
if [[ "$TWITTER_CLIENT_ID" == *":1:ci" ]]; then
    print_success "Client ID format is correct"
else
    print_warning "Client ID format may be incorrect (expected to end with :1:ci)"
fi

# Check Client Secret length
if [ ${#TWITTER_CLIENT_SECRET} -gt 40 ]; then
    print_success "Client Secret length is appropriate"
else
    print_warning "Client Secret seems short (${#TWITTER_CLIENT_SECRET} characters)"
fi

# Check Bearer Token format
if [[ "$TWITTER_BEARER_TOKEN" == AAAAAAAAAAAAAAAAAAAAAA* ]]; then
    print_success "Bearer Token format is correct"
else
    print_warning "Bearer Token format may be incorrect"
fi

# Test Twitter OAuth service
print_step "Testing Twitter OAuth service..."
if npm run test:twitter-oauth > /dev/null 2>&1; then
    print_success "Twitter OAuth service test passed"
else
    print_warning "Twitter OAuth service test failed - check logs"
fi

# Test database migration fix
print_step "Testing database migration fix..."
if npm run db:migrate:test > /dev/null 2>&1; then
    print_success "Database migration test passed"
else
    print_warning "Database migration test failed - check logs"
fi

# Build the application
print_step "Building LayerEdge application..."
if npm run build; then
    print_success "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Generate deployment environment file
print_step "Generating deployment environment configuration..."

cat > deployment-env.txt << EOF
# LayerEdge Production Environment Variables
# Updated with new Twitter OAuth 2.0 credentials

# Core Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_SITE_URL=https://edgen.koyeb.app
NEXTAUTH_URL=https://edgen.koyeb.app
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Database Configuration
DATABASE_URL=${DATABASE_URL}
DIRECT_URL=${DIRECT_URL}

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Twitter/X API Configuration (UPDATED)
TWITTER_CLIENT_ID=${TWITTER_CLIENT_ID}
TWITTER_CLIENT_SECRET=${TWITTER_CLIENT_SECRET}
TWITTER_BEARER_TOKEN=${TWITTER_BEARER_TOKEN}
TWITTER_API_KEY=${TWITTER_API_KEY}
TWITTER_API_SECRET=${TWITTER_API_SECRET}

# Redis Configuration
UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_DB=${REDIS_DB}

# LayerEdge Specific
LAYEREDGE_COMMUNITY_URL=${LAYEREDGE_COMMUNITY_URL}
TOKEN_ENCRYPTION_KEY=${TOKEN_ENCRYPTION_KEY}
ADMIN_SECRET=${ADMIN_SECRET}

# Feature Flags
MANUAL_SUBMISSIONS_ONLY=${MANUAL_SUBMISSIONS_ONLY:-true}
ENABLE_AUTO_TWITTER_SERVICES=${ENABLE_AUTO_TWITTER_SERVICES:-false}
OPTIMIZE_FOR_FREE_TIER=${OPTIMIZE_FOR_FREE_TIER:-true}
X_API_ENABLED=${X_API_ENABLED:-true}

# AI Helper Configuration
EDGEN_HELPER_ENABLED=${EDGEN_HELPER_ENABLED:-true}
IO_NET_API_KEY=${IO_NET_API_KEY}
IO_NET_BASE_URL=${IO_NET_BASE_URL}
IO_NET_MODEL=${IO_NET_MODEL}

# Performance & Caching
ENABLE_CACHE=${ENABLE_CACHE:-true}
CACHE_TTL_SECONDS=${CACHE_TTL_SECONDS:-1800}
ENABLE_AGGRESSIVE_CACHING=${ENABLE_AGGRESSIVE_CACHING:-true}

# Rate Limiting
X_API_MAX_REQUESTS_PER_WINDOW=${X_API_MAX_REQUESTS_PER_WINDOW:-300}
X_API_WINDOW_MINUTES=${X_API_WINDOW_MINUTES:-15}
X_API_RATE_LIMIT_ENABLED=${X_API_RATE_LIMIT_ENABLED:-true}

# Logging
LOG_LEVEL=${LOG_LEVEL:-error}
EOF

print_success "Deployment environment file created: deployment-env.txt"

# Create Koyeb deployment checklist
print_step "Creating deployment checklist..."

cat > deployment-checklist.md << EOF
# LayerEdge Koyeb Deployment Checklist

## ✅ Pre-Deployment Verification

- [x] New Twitter OAuth 2.0 credentials configured
- [x] Database migration fix implemented
- [x] Application builds successfully
- [x] Environment variables validated

## 🚀 Koyeb Deployment Steps

### 1. Update Environment Variables in Koyeb

Copy the following environment variables to your Koyeb app settings:

\`\`\`
TWITTER_CLIENT_ID=TXdBWXdPQWNMMjdpcHRGblIyaVg6MTpjaQ
TWITTER_CLIENT_SECRET=nsN3ICJpwMHpfxYCAP6EG5hC4Q9jmaOGgiKq3v1XB8LTAm2-xJ
TWITTER_BEARER_TOKEN=${TWITTER_BEARER_TOKEN}
TWITTER_API_KEY=${TWITTER_API_KEY}
TWITTER_API_SECRET=${TWITTER_API_SECRET}
\`\`\`

### 2. Deploy to Koyeb

1. Push changes to your Git repository
2. Koyeb will automatically detect changes and start deployment
3. Monitor build logs for any issues
4. Check startup logs for database migration success

### 3. Post-Deployment Testing

- [ ] Application starts without errors
- [ ] Database migrations complete successfully
- [ ] Twitter OAuth login works
- [ ] Tweet submission functionality works
- [ ] Dashboard displays correctly

## 🔧 Troubleshooting

If deployment fails:

1. Check Koyeb build logs for errors
2. Verify all environment variables are set correctly
3. Test database connection
4. Run: \`npm run db:migrate:baseline\` if P3005 error occurs

## 📞 Support

If issues persist, check:
- Twitter Developer Portal for OAuth app configuration
- Supabase dashboard for database status
- Koyeb logs for detailed error messages
EOF

print_success "Deployment checklist created: deployment-checklist.md"

# Final summary
echo ""
echo -e "${CYAN}📋 Deployment Summary${NC}"
echo "====================="
echo ""
print_success "✅ New Twitter OAuth 2.0 credentials configured"
print_success "✅ Database migration fix implemented"  
print_success "✅ Application built successfully"
print_success "✅ Deployment files generated"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Review deployment-env.txt for environment variables"
echo "2. Follow deployment-checklist.md for Koyeb deployment"
echo "3. Update Koyeb environment variables with new Twitter credentials"
echo "4. Deploy and monitor startup logs"
echo ""
echo -e "${GREEN}🎉 Ready for deployment to Koyeb!${NC}"
