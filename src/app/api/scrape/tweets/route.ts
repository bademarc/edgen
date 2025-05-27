import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { getFallbackService } from '@/lib/fallback-service'
import { isValidTwitterUrl, isLayerEdgeCommunityUrl, validateTweetContent } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tweetUrl, forceMethod } = body

    // Validate tweet URL
    if (!tweetUrl || typeof tweetUrl !== 'string') {
      return NextResponse.json(
        { error: 'Tweet URL is required' },
        { status: 400 }
      )
    }

    if (!isValidTwitterUrl(tweetUrl)) {
      return NextResponse.json(
        { error: 'Invalid Twitter URL' },
        { status: 400 }
      )
    }

    if (!isLayerEdgeCommunityUrl(tweetUrl)) {
      return NextResponse.json(
        { error: 'Tweet must be from the LayerEdge community' },
        { status: 400 }
      )
    }

    console.log(`Scraping tweet data for URL: ${tweetUrl}`)

    // Get fallback service with optional method forcing
    const fallbackService = getFallbackService({
      enableScraping: true,
      preferApi: forceMethod === 'api',
      apiTimeoutMs: 8000, // Shorter timeout for scraping endpoint
    })

    // If forceMethod is specified, temporarily override the service behavior
    if (forceMethod === 'scraper') {
      fallbackService.updateConfig({ preferApi: false })
    }

    // Fetch tweet data using fallback service
    const tweetData = await fallbackService.getTweetData(tweetUrl)

    if (!tweetData) {
      return NextResponse.json(
        {
          error: 'Unable to fetch tweet data. This could be due to: 1) Tweet not found or deleted, 2) Tweet is private/protected, 3) Invalid tweet URL, or 4) Both API and scraping methods failed.',
          errorType: 'TWEET_NOT_FOUND',
          fallbackStatus: fallbackService.getStatus()
        },
        { status: 404 }
      )
    }

    // Validate tweet content for required keywords
    console.log(`Validating tweet content: "${tweetData.content}"`)
    const isValidContent = validateTweetContent(tweetData.content)
    if (!isValidContent) {
      console.log(`Content validation failed for tweet: "${tweetData.content}"`)
      return NextResponse.json(
        {
          error: 'Tweet must contain either "@layeredge" or "$EDGEN" to earn points. Please make sure your tweet mentions LayerEdge or the $EDGEN token.',
          contentValidationFailed: true,
          errorType: 'CONTENT_VALIDATION_FAILED',
          tweetContent: tweetData.content.substring(0, 200), // First 200 chars for debugging
          source: tweetData.source,
          fallbackStatus: fallbackService.getStatus()
        },
        { status: 400 }
      )
    }

    // Verify community membership
    if (!tweetData.isFromLayerEdgeCommunity) {
      return NextResponse.json(
        {
          error: 'Tweet must be from the LayerEdge community',
          errorType: 'COMMUNITY_VALIDATION_FAILED',
          source: tweetData.source,
          fallbackStatus: fallbackService.getStatus()
        },
        { status: 400 }
      )
    }

    console.log(`Successfully fetched and validated tweet data via ${tweetData.source}`)

    // Return the scraped/fetched data
    return NextResponse.json({
      success: true,
      data: {
        id: tweetData.id,
        content: tweetData.content,
        likes: tweetData.likes,
        retweets: tweetData.retweets,
        replies: tweetData.replies,
        author: tweetData.author,
        createdAt: tweetData.createdAt,
        source: tweetData.source,
        isFromLayerEdgeCommunity: tweetData.isFromLayerEdgeCommunity
      },
      fallbackStatus: fallbackService.getStatus(),
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Error in scrape tweets endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error during tweet scraping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tweetUrl = searchParams.get('url')
    const method = searchParams.get('method') // 'api', 'scraper', or 'auto'

    if (!tweetUrl) {
      return NextResponse.json(
        { error: 'Tweet URL parameter is required' },
        { status: 400 }
      )
    }

    if (!isValidTwitterUrl(tweetUrl)) {
      return NextResponse.json(
        { error: 'Invalid Twitter URL' },
        { status: 400 }
      )
    }

    console.log(`Getting tweet data for URL: ${tweetUrl} using method: ${method || 'auto'}`)

    const fallbackService = getFallbackService({
      enableScraping: true,
      preferApi: method === 'api' || method !== 'scraper',
    })

    if (method === 'scraper') {
      fallbackService.updateConfig({ preferApi: false })
    }

    const tweetData = await fallbackService.getTweetData(tweetUrl)

    if (!tweetData) {
      return NextResponse.json(
        {
          error: 'Unable to fetch tweet data',
          fallbackStatus: fallbackService.getStatus()
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tweetData,
      fallbackStatus: fallbackService.getStatus(),
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Error in GET scrape tweets endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Health check endpoint for the scraping service
export async function HEAD() {
  try {
    const fallbackService = getFallbackService()
    const status = fallbackService.getStatus()

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Fallback-Status': JSON.stringify(status),
        'X-Service-Health': 'ok'
      }
    })
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Service-Health': 'error'
      }
    })
  }
}
