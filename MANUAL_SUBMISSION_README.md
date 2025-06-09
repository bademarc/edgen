# LayerEdge Community Platform - Manual Tweet Submission System

## Overview

The LayerEdge community platform has been simplified to eliminate all web scraping dependencies and rely exclusively on Twitter API v1.1 with OAuth user authentication. This ensures compliance with Twitter's terms of service while maintaining all core functionality.

## Key Changes

### ✅ Removed Components
- **Scweet Python-based web scraper** - Completely removed
- **Twikit library** - Completely removed  
- **Playwright-based tweet fetching** - Completely removed
- **All web scraping fallback mechanisms** - Completely removed
- **Docker containers for scraping services** - Removed

### ✅ New Components
- **Manual Tweet Submission Interface** - User-friendly submission page
- **Tweet Ownership Verification** - Prevents point farming
- **Simplified Twitter API Integration** - Uses only official Twitter API v1.1
- **Engagement Update Service** - Periodic engagement metric updates
- **Rate Limit Management** - Respects Twitter API limits

## Architecture

### Core Services

1. **Manual Tweet Submission Service** (`src/lib/manual-tweet-submission.ts`)
   - Handles user tweet submissions
   - Verifies tweet ownership
   - Validates required mentions (@layeredge, $EDGEN)
   - Prevents point farming abuse

2. **Tweet Tracker** (`src/lib/tweet-tracker.ts`)
   - Uses Twitter API v1.1 search only
   - 15-minute intervals to respect rate limits
   - Automatic mention discovery and point awarding

3. **Engagement Update Service** (`src/lib/engagement-update-service.ts`)
   - Hourly engagement metric updates
   - Batch processing to respect rate limits
   - Real-time engagement tracking

4. **Simplified Fallback Service** (`src/lib/simplified-fallback-service.ts`)
   - Twitter API and X API only
   - No web scraping fallbacks
   - Proper error handling and rate limiting

## API Endpoints

### Tweet Submission
- `POST /api/tweets/submit` - Submit a tweet for points
- `POST /api/tweets/verify` - Verify tweet ownership
- `GET /api/tweets/submit` - Check submission status

### Engagement Updates
- `POST /api/engagement/update` - Update engagement metrics
- `GET /api/engagement/update` - Get engagement statistics

### Service Management
- `GET /api/services/status` - Get service status
- `POST /api/services/status` - Control services (start/stop/restart)

## User Interface

### Manual Tweet Submission Page (`/submit-tweet`)
- Clean, dark-themed interface with Bitcoin orange accents
- Real-time tweet verification
- Engagement metrics preview
- Submission history and status
- Clear error messages and feedback

### Features
- **Tweet URL Input** - Paste any X.com/Twitter.com tweet URL
- **Real-time Verification** - Instant ownership and mention validation
- **Engagement Preview** - Shows likes, retweets, replies
- **Submission Cooldown** - 5-minute cooldown between submissions
- **Point Calculation** - Base 5 points + engagement bonus

## Rate Limiting & API Usage

### Twitter API v1.1 Limits
- **Search API**: 180 requests per 15-minute window
- **Tweet Lookup**: 300 requests per 15-minute window
- **User Lookup**: 300 requests per 15-minute window

### Our Implementation
- **Tweet Search**: Every 15 minutes (4 requests/hour)
- **Engagement Updates**: Every hour (max 10 tweets/batch)
- **Manual Submissions**: Real-time verification with cooldowns
- **Total Usage**: ~100 API calls per day (well within free tier)

## Security Features

### Tweet Ownership Verification
```typescript
// Prevents users from submitting tweets they didn't author
const verification = await verifyTweetOwnership(tweetUrl, userId)
if (!verification.isOwnTweet) {
  return { error: 'You can only submit tweets that you authored' }
}
```

### Required Mentions Validation
```typescript
// Ensures tweets contain @layeredge or $EDGEN mentions
const containsRequiredMentions = validateTweetContent(tweetData.content)
if (!containsRequiredMentions) {
  return { error: 'Tweet must contain "@layeredge" or "$EDGEN" mentions' }
}
```

### Submission Cooldowns
- 5-minute cooldown between manual submissions per user
- Prevents spam and abuse
- Rate limit-aware API usage

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
# Note: Playwright, Scweet, and Twikit dependencies have been removed
```

### 2. Environment Variables
```bash
# Twitter API v1.1 credentials (required)
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_BEARER_TOKEN=your_bearer_token

# Database (Supabase)
DATABASE_URL=your_supabase_url
DIRECT_URL=your_supabase_direct_url

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 3. Database Migration
```bash
npm run db:migrate
```

### 4. Start Services
```bash
npm run dev
# Services will auto-initialize in production
```

## Usage

### For Users
1. Visit `/submit-tweet` page
2. Paste your tweet URL containing @layeredge or $EDGEN
3. Click "Verify" to check ownership and mentions
4. Click "Submit Tweet for Points" to earn points
5. View your submission history and engagement metrics

### For Administrators
```bash
# Check service status
npm run services:status

# Start/stop services
npm run services:start
npm run services:stop
npm run services:restart

# Check health
npm run services:health

# Update engagement metrics
npm run engagement:update
npm run engagement:status
```

## Monitoring & Debugging

### Service Status
```bash
curl http://localhost:3000/api/services/status?action=health
```

### Engagement Statistics
```bash
curl http://localhost:3000/api/engagement/update
```

### Manual Tweet Submission Test
1. Go to `/submit-tweet`
2. Use a real tweet URL from your account
3. Ensure it contains @layeredge or $EDGEN
4. Submit and verify points are awarded

## Benefits of New System

### ✅ Compliance
- Uses only official Twitter API
- No terms of service violations
- No web scraping or automation concerns

### ✅ Reliability
- No browser dependencies
- No scraping failures
- Consistent API responses

### ✅ Performance
- Faster response times
- Lower resource usage
- Better error handling

### ✅ Security
- Tweet ownership verification
- Prevents point farming
- Rate limit compliance

### ✅ User Experience
- Clear submission interface
- Real-time feedback
- Transparent point calculation

## Migration Notes

### Removed Files
- `src/lib/scweet-service.py`
- `src/lib/local-scweet-service.js`
- `src/lib/web-scraper.ts`
- `Dockerfile.scweet`
- `requirements.scweet.txt`
- `docker-compose.yml`
- `src/app/api/scrape/tweets/route.ts`

### Updated Files
- `src/lib/tweet-tracker.ts` - Simplified to Twitter API only
- `src/lib/twitter-monitoring.ts` - Removed web scraping references
- `src/lib/fallback-service.ts` - Replaced with simplified version
- `package.json` - Removed scraping dependencies and scripts

### New Files
- `src/lib/manual-tweet-submission.ts` - Core submission logic
- `src/lib/simplified-fallback-service.ts` - API-only fallback
- `src/lib/engagement-update-service.ts` - Engagement updates
- `src/lib/initialize-services.ts` - Service management
- `src/components/ManualTweetSubmission.tsx` - UI component
- `src/app/submit-tweet/page.tsx` - Submission page
- API endpoints for submission, verification, and engagement

## Support

For issues or questions about the manual tweet submission system:

1. Check service status: `npm run services:health`
2. Review API logs for errors
3. Verify Twitter API credentials
4. Test with the `/submit-tweet` interface
5. Check rate limit status in API responses

The system is designed to be self-monitoring and will provide clear error messages for common issues like rate limiting, invalid tweets, or authentication problems.
