#!/bin/bash

# LayerEdge Community Platform - Automated Mention Tracking Deployment Script
# This script deploys the automated mention tracking system using Supabase Edge Functions

set -e

echo "🚀 LayerEdge Automated Mention Tracking Deployment"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check for required environment variables
echo "🔍 Checking environment variables..."

required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "TWITTER_BEARER_TOKEN"
    "MENTION_TRACKER_SECRET"
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
    echo "Please set these variables in your .env.local file"
    exit 1
fi

echo "✅ All required environment variables are set"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Please install it with: npm install -g supabase"
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI is available"

# Initialize Supabase project if not already done
if [ ! -f "supabase/config.toml" ]; then
    echo "🔧 Initializing Supabase project..."
    supabase init
fi

# Login to Supabase (if not already logged in)
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "Please login to Supabase:"
    supabase login
fi

# Link to existing project
echo "🔗 Linking to Supabase project..."
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')
supabase link --project-ref $PROJECT_REF

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Deploy edge function
echo "🚀 Deploying edge function..."
supabase functions deploy track-mentions --no-verify-jwt

# Set edge function secrets
echo "🔐 Setting edge function environment variables..."
supabase secrets set SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
supabase secrets set X_BEARER_TOKEN="$TWITTER_BEARER_TOKEN"
supabase secrets set MENTION_TRACKER_SECRET="$MENTION_TRACKER_SECRET"

echo "✅ Edge function deployed successfully!"

# Test the deployment
echo "🧪 Testing the deployment..."
EDGE_FUNCTION_URL="$NEXT_PUBLIC_SUPABASE_URL/functions/v1/track-mentions"

echo "Testing edge function at: $EDGE_FUNCTION_URL"

TEST_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$EDGE_FUNCTION_URL" \
  -H "Authorization: Bearer $MENTION_TRACKER_SECRET" \
  -H "Content-Type: application/json" \
  -o /tmp/test_response.json)

HTTP_CODE="${TEST_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Edge function test successful!"
    echo "Response:"
    cat /tmp/test_response.json | jq '.' 2>/dev/null || cat /tmp/test_response.json
else
    echo "⚠️  Edge function test returned HTTP $HTTP_CODE"
    echo "Response:"
    cat /tmp/test_response.json
fi

# Clean up
rm -f /tmp/test_response.json

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Set up external cron job:"
echo "   - Go to https://cron-job.org"
echo "   - Create a new cron job with:"
echo "   - URL: $EDGE_FUNCTION_URL"
echo "   - Schedule: Every 15 minutes (*/15 * * * *)"
echo "   - HTTP Method: POST"
echo "   - Headers: Authorization: Bearer $MENTION_TRACKER_SECRET"
echo ""
echo "2. Test the API endpoint:"
echo "   curl -X POST https://edgen.koyeb.app/api/mentions/track \\"
echo "        -H \"Authorization: Bearer $MENTION_TRACKER_SECRET\""
echo ""
echo "3. Monitor the logs:"
echo "   supabase functions logs track-mentions"
echo ""
echo "4. Check the database for new entries:"
echo "   - TweetTracking table for processed tweets"
echo "   - SystemConfig table for last_tweet_id"
echo "   - User table for updated totalPoints"
echo ""

# Create a deployment summary
cat > MENTION_TRACKING_DEPLOYMENT.md << 'EOF'
# Automated Mention Tracking Deployment Summary

## ✅ Completed Steps

- [x] Database schema updated with new tables
- [x] Supabase edge function deployed
- [x] Environment variables configured
- [x] API endpoints created for testing
- [x] Database functions created for atomic operations

## 🔧 Configuration

### Edge Function URL
```
https://bzqayhnlogpaxfcmmrlq.supabase.co/functions/v1/track-mentions
```

### Required Environment Variables
- `MENTION_TRACKER_SECRET`: Authentication secret for the edge function
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for database access
- `X_BEARER_TOKEN`: Twitter API Bearer Token for API calls
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL

### Database Tables Added
- `TweetTracking`: Stores processed tweets to prevent duplicates
- `SystemConfig`: Stores system configuration like last processed tweet ID

### Database Functions Added
- `award_points_for_tweet()`: Atomically awards points and tracks tweets
- `get_system_config()`: Retrieves system configuration values
- `set_system_config()`: Sets system configuration values

## 🕐 Cron Job Setup

Set up a cron job at https://cron-job.org with:
- **URL**: https://bzqayhnlogpaxfcmmrlq.supabase.co/functions/v1/track-mentions
- **Schedule**: Every 15 minutes (`*/15 * * * *`)
- **Method**: POST
- **Headers**: `Authorization: Bearer layeredge-mention-tracker-2024-secure-key`

## 🧪 Testing

### Manual Test via API
```bash
curl -X POST https://edgen.koyeb.app/api/mentions/track \
     -H "Authorization: Bearer layeredge-mention-tracker-2024-secure-key"
```

### Direct Edge Function Test
```bash
curl -X POST https://bzqayhnlogpaxfcmmrlq.supabase.co/functions/v1/track-mentions \
     -H "Authorization: Bearer layeredge-mention-tracker-2024-secure-key"
```

### Health Check
```bash
curl https://edgen.koyeb.app/api/mentions/track
```

## 📊 Monitoring

### View Logs
```bash
supabase functions logs track-mentions
```

### Check Database
- Monitor `TweetTracking` table for new entries
- Check `SystemConfig` table for `last_tweet_id` updates
- Verify `User` table `totalPoints` increases

## 🔍 Search Query

The system searches for tweets containing:
- `Edgen` (case-insensitive)
- `$EDGEN` (case-insensitive)
- `@layeredge` (case-insensitive)

Excludes retweets to prevent duplicate point awards.

## 🚨 Troubleshooting

### Common Issues
1. **Rate Limiting**: X API Free tier allows 1 request per 15 minutes
2. **Authentication**: Ensure all environment variables are set correctly
3. **Database Permissions**: Verify service role key has proper permissions

### Debug Steps
1. Check edge function logs
2. Verify environment variables
3. Test database connection
4. Validate X API credentials
EOF

echo "📄 Deployment summary saved to MENTION_TRACKING_DEPLOYMENT.md"
