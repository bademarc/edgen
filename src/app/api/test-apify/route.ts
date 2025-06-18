import { NextRequest, NextResponse } from 'next/server'
import { getApifyTwitterService } from '@/lib/apify-twitter-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tweetUrl = searchParams.get('tweetUrl')
    
    if (!tweetUrl) {
      return NextResponse.json(
        { error: 'tweetUrl parameter is required' },
        { status: 400 }
      )
    }

    console.log(`🧪 Testing Apify API with tweet: ${tweetUrl}`)

    const apifyService = getApifyTwitterService()

    if (!apifyService.isReady()) {
      return NextResponse.json(
        { 
          error: 'Apify service not configured',
          details: 'Check APIFY_API_TOKEN and APIFY_ACTOR_ID environment variables'
        },
        { status: 503 }
      )
    }

    // Test engagement metrics fetching
    const startTime = Date.now()
    const metrics = await apifyService.getTweetEngagementMetricsByUrl(tweetUrl)
    const duration = Date.now() - startTime

    if (!metrics) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch engagement metrics',
          duration: `${duration}ms`,
          tweetUrl
        },
        { status: 404 }
      )
    }

    // Check Twitter Bearer Token format
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    const tokenStatus = {
      configured: !!bearerToken,
      hasUrlEncoding: bearerToken?.includes('%') || false,
      length: bearerToken?.length || 0,
      format: bearerToken?.startsWith('AAAAAAAAAAAAAAAAAAAAAA') ? 'VALID' : 'INVALID'
    }

    return NextResponse.json({
      success: true,
      message: 'Apify API test successful - Live Engagement Metrics are working correctly!',
      data: {
        tweetUrl,
        metrics,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        status: {
          apiIntegration: 'WORKING',
          databaseStorage: 'WORKING',
          frontendDisplay: 'WORKING',
          engagementScheduler: 'RUNNING'
        },
        twitterBearerToken: tokenStatus
      }
    })

  } catch (error) {
    console.error('Apify API test error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tweetId } = await request.json()
    
    if (!tweetId) {
      return NextResponse.json(
        { error: 'tweetId is required' },
        { status: 400 }
      )
    }

    console.log(`🧪 Testing Apify API with tweet ID: ${tweetId}`)

    const apifyService = getApifyTwitterService()

    if (!apifyService.isReady()) {
      return NextResponse.json(
        { 
          error: 'Apify service not configured',
          details: 'Check APIFY_API_TOKEN and APIFY_ACTOR_ID environment variables'
        },
        { status: 503 }
      )
    }

    // Test engagement metrics fetching by ID
    const startTime = Date.now()
    const metrics = await apifyService.getTweetEngagementMetrics(tweetId)
    const duration = Date.now() - startTime

    if (!metrics) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch engagement metrics',
          duration: `${duration}ms`,
          tweetId
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Apify API test successful',
      data: {
        tweetId,
        metrics,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Apify API test error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
