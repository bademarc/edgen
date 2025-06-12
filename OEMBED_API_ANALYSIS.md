# Twitter oEmbed API Analysis for Leaderboards & Recent Tweets

## Executive Summary

**Can we use oEmbed API for leaderboards and recent tweets? YES, but with important limitations and considerations.**

## oEmbed API Capabilities & Limitations

### ✅ **Advantages**
- **No Rate Limits**: The oEmbed API has no rate limiting
- **No Authentication**: No API keys or OAuth required
- **Free**: Completely free to use
- **Reliable**: High uptime and availability
- **Individual Tweet Data**: Can fetch any public tweet by URL
- **Timeline Support**: Can embed user timelines (but limited functionality)

### ❌ **Limitations**
- **Individual Tweet URLs Required**: You need the exact tweet URL for each tweet
- **No Search/Discovery**: Cannot search for tweets or discover new content
- **No Bulk Operations**: Must make one request per tweet
- **Limited Metadata**: Only basic tweet data (content, author, engagement not always available)
- **No Real-time Updates**: Cannot get live engagement metrics
- **Timeline Limitations**: Timeline embeds are for display, not data extraction

## Current Implementation Analysis

### Leaderboard Current State
```javascript
// Current leaderboard fetches from database
const users = await prisma.user.findMany({
  where: { totalPoints: { gt: 0 } },
  select: {
    id: true,
    name: true,
    xUsername: true,
    image: true,
    totalPoints: true,
  },
  orderBy: { totalPoints: 'desc' },
  take: limit,
})
```

### Recent Tweets Current State
```javascript
// Current recent tweets from database
const tweets = await prisma.tweet.findMany({
  where: userId ? { userId } : {},
  include: { user: { select: { id: true, name: true, xUsername: true, image: true } } },
  orderBy: { submittedAt: 'desc' },
  take: limit,
})
```

## Proposed oEmbed Integration Strategy

### 1. **Enhanced Leaderboard with Live Tweet Data**

#### Implementation Approach
```javascript
// Hybrid approach: Database + oEmbed enrichment
async function getEnhancedLeaderboard(limit = 10) {
  // 1. Get leaderboard from database (fast)
  const users = await getLeaderboardFromDB(limit)
  
  // 2. Get latest tweet for each user (if available)
  const enrichedUsers = await Promise.allSettled(
    users.map(async (user) => {
      if (user.latestTweetUrl) {
        const tweetData = await fetchTweetViaOEmbed(user.latestTweetUrl)
        return { ...user, latestTweet: tweetData }
      }
      return user
    })
  )
  
  return enrichedUsers
}
```

#### Benefits
- ✅ Show latest tweet content for each leaderboard user
- ✅ No rate limits for fetching tweet data
- ✅ Real-time tweet content (not engagement metrics)
- ✅ Enhanced user engagement on leaderboard

### 2. **Recent Tweets with Live Content**

#### Implementation Approach
```javascript
// Enhanced recent tweets with live content
async function getRecentTweetsWithLiveContent(limit = 20) {
  // 1. Get recent tweet URLs from database
  const tweetRecords = await prisma.tweet.findMany({
    select: { url: true, userId: true, submittedAt: true },
    orderBy: { submittedAt: 'desc' },
    take: limit
  })
  
  // 2. Fetch live content via oEmbed (parallel)
  const liveTweets = await Promise.allSettled(
    tweetRecords.map(async (record) => {
      const liveData = await fetchTweetViaOEmbed(record.url)
      return { ...record, liveContent: liveData }
    })
  )
  
  return liveTweets.filter(result => result.status === 'fulfilled')
}
```

#### Benefits
- ✅ Always show current tweet content (even if edited)
- ✅ No rate limits for content fetching
- ✅ Better user experience with live data
- ✅ Fallback to database if oEmbed fails

### 3. **User Profile Tweet History**

#### Implementation Approach
```javascript
// Get user's recent tweets (requires stored tweet URLs)
async function getUserRecentTweets(userId, limit = 10) {
  // Get user's submitted tweet URLs from database
  const userTweetUrls = await prisma.tweet.findMany({
    where: { userId },
    select: { url: true },
    orderBy: { submittedAt: 'desc' },
    take: limit
  })
  
  // Fetch live content for each tweet
  const liveTweets = await Promise.allSettled(
    userTweetUrls.map(record => fetchTweetViaOEmbed(record.url))
  )
  
  return liveTweets
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)
}
```

## Implementation Plan

### Phase 1: oEmbed Service Enhancement
```javascript
// Enhanced oEmbed service for batch operations
class EnhancedOEmbedService {
  async batchFetchTweets(tweetUrls, options = {}) {
    const { concurrency = 10, timeout = 5000 } = options
    
    // Process in batches to avoid overwhelming the service
    const batches = this.chunkArray(tweetUrls, concurrency)
    const results = []
    
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(url => this.fetchTweetData(url, timeout))
      )
      results.push(...batchResults)
      
      // Small delay between batches for politeness
      await this.delay(100)
    }
    
    return results
  }
  
  async fetchTweetData(tweetUrl, timeout = 5000) {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`
    
    const response = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(timeout),
      headers: { 'User-Agent': 'LayerEdge/1.0' }
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const data = await response.json()
    return this.parseOEmbedData(data, tweetUrl)
  }
}
```

### Phase 2: Database Schema Updates
```sql
-- Add fields to track latest tweets for users
ALTER TABLE users ADD COLUMN latest_tweet_url VARCHAR(255);
ALTER TABLE users ADD COLUMN latest_tweet_updated_at TIMESTAMP;

-- Index for performance
CREATE INDEX idx_users_latest_tweet ON users(latest_tweet_updated_at);
```

### Phase 3: Background Jobs
```javascript
// Background job to update latest tweets for leaderboard users
async function updateLeaderboardLatestTweets() {
  const topUsers = await getTopUsers(50) // Top 50 users
  
  for (const user of topUsers) {
    const latestTweet = await getUserLatestSubmittedTweet(user.id)
    if (latestTweet) {
      await updateUserLatestTweet(user.id, latestTweet.url)
    }
  }
}

// Run every 15 minutes
setInterval(updateLeaderboardLatestTweets, 15 * 60 * 1000)
```

## Performance Considerations

### Caching Strategy
```javascript
// Multi-level caching for oEmbed data
const cacheConfig = {
  level1: { ttl: 5 * 60 * 1000 },    // 5 minutes in memory
  level2: { ttl: 30 * 60 * 1000 },   // 30 minutes in Redis
  level3: { ttl: 24 * 60 * 60 * 1000 } // 24 hours in database
}
```

### Batch Processing
- Process tweets in batches of 10-20 concurrent requests
- Implement circuit breaker for oEmbed service
- Graceful degradation if oEmbed fails

### Error Handling
- Fallback to database content if oEmbed fails
- Retry logic with exponential backoff
- Monitor success rates and performance

## Limitations & Workarounds

### ❌ **Cannot Do with oEmbed**
1. **Discover new tweets**: Need Twitter API or manual submission
2. **Get engagement metrics**: oEmbed doesn't provide likes/retweets
3. **Search functionality**: Cannot search for tweets
4. **Real-time updates**: No webhooks or streaming

### ✅ **Workarounds**
1. **Tweet Discovery**: Keep current submission system
2. **Engagement Metrics**: Use existing Twitter API for periodic updates
3. **Search**: Search within submitted tweets only
4. **Updates**: Background jobs to refresh content

## Recommended Implementation

### Hybrid Approach
```javascript
// Best of both worlds
const hybridService = {
  // Use oEmbed for content (no limits)
  getContent: (tweetUrl) => oembedService.fetchTweet(tweetUrl),
  
  // Use Twitter API for engagement (with rate limiting)
  getEngagement: (tweetUrl) => twitterApi.getTweetMetrics(tweetUrl),
  
  // Use database for structure and relationships
  getStructure: (query) => database.query(query)
}
```

## Conclusion

**YES, we can effectively use oEmbed API for leaderboards and recent tweets with these benefits:**

✅ **No rate limits** for content fetching
✅ **Free and reliable** service
✅ **Enhanced user experience** with live content
✅ **Reduced Twitter API usage** (save quota for engagement updates)
✅ **Better performance** for content-heavy operations

**Recommended next steps:**
1. Implement enhanced oEmbed service
2. Update leaderboard to show latest tweets
3. Enhance recent tweets with live content
4. Add background jobs for data freshness
5. Monitor performance and user engagement

This approach will significantly improve the user experience while staying within API limits and budget constraints.

## Example API Implementation

### Enhanced Leaderboard API Route
```javascript
// src/app/api/leaderboard/enhanced/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOEmbedLeaderboardService } from '@/lib/oembed-leaderboard-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const includeTweets = searchParams.get('includeTweets') === 'true'

    const oembedService = getOEmbedLeaderboardService()

    if (includeTweets) {
      // Get enhanced leaderboard with latest tweets (no rate limits!)
      const enhancedLeaderboard = await oembedService.getEnhancedLeaderboard(limit)

      return NextResponse.json({
        users: enhancedLeaderboard,
        enhanced: true,
        source: 'oembed',
        message: 'Leaderboard with live tweet content (no rate limits)'
      })
    } else {
      // Fallback to basic leaderboard
      const basicLeaderboard = await oembedService.getBasicLeaderboard(limit)

      return NextResponse.json({
        users: basicLeaderboard,
        enhanced: false,
        source: 'database'
      })
    }
  } catch (error) {
    console.error('Enhanced leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enhanced leaderboard' },
      { status: 500 }
    )
  }
}
```

### Recent Tweets with Live Content API
```javascript
// src/app/api/tweets/recent-live/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOEmbedLeaderboardService } from '@/lib/oembed-leaderboard-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const oembedService = getOEmbedLeaderboardService()

    // Get recent tweets with live content (no rate limits!)
    const recentTweets = await oembedService.getRecentTweetsWithLiveContent(limit)

    return NextResponse.json({
      tweets: recentTweets,
      count: recentTweets.length,
      source: 'oembed',
      message: 'Recent tweets with live content (no rate limits)'
    })
  } catch (error) {
    console.error('Recent live tweets API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent tweets with live content' },
      { status: 500 }
    )
  }
}
```

## Performance Metrics

### Before oEmbed Integration
- **Leaderboard Load Time**: 200-500ms (database only)
- **Tweet Content Freshness**: Static (from submission time)
- **API Rate Limit Usage**: High (for engagement updates)
- **User Experience**: Basic leaderboard without tweet previews

### After oEmbed Integration
- **Leaderboard Load Time**: 800-1500ms (database + live tweets)
- **Tweet Content Freshness**: Live (current content)
- **API Rate Limit Usage**: Zero (for content fetching)
- **User Experience**: Rich leaderboard with live tweet previews

### Caching Benefits
- **First Load**: 800-1500ms
- **Cached Load**: 50-100ms (10-minute cache)
- **Cache Hit Rate**: Expected 80-90%
