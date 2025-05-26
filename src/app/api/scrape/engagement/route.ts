import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getFallbackService } from '@/lib/fallback-service'
import { isValidTwitterUrl } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tweetUrl, tweetUrls, forceMethod } = body

    // Handle single tweet engagement update
    if (tweetUrl) {
      if (!isValidTwitterUrl(tweetUrl)) {
        return NextResponse.json(
          { error: 'Invalid Twitter URL' },
          { status: 400 }
        )
      }

      console.log(`Scraping engagement metrics for URL: ${tweetUrl}`)

      const fallbackService = getFallbackService({
        enableScraping: true,
        preferApi: forceMethod === 'api',
        apiTimeoutMs: 6000, // Shorter timeout for engagement updates
      })

      if (forceMethod === 'scraper') {
        fallbackService.updateConfig({ preferApi: false })
      }

      const metrics = await fallbackService.getEngagementMetrics(tweetUrl)

      if (!metrics) {
        return NextResponse.json(
          {
            error: 'Unable to fetch engagement metrics',
            fallbackStatus: fallbackService.getStatus()
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          url: tweetUrl,
          metrics: {
            likes: metrics.likes,
            retweets: metrics.retweets,
            replies: metrics.replies,
            source: metrics.source,
            timestamp: metrics.timestamp
          }
        },
        fallbackStatus: fallbackService.getStatus(),
        timestamp: new Date()
      })
    }

    // Handle batch engagement updates
    if (tweetUrls && Array.isArray(tweetUrls)) {
      if (tweetUrls.length === 0) {
        return NextResponse.json(
          { error: 'Tweet URLs array cannot be empty' },
          { status: 400 }
        )
      }

      if (tweetUrls.length > 50) {
        return NextResponse.json(
          { error: 'Maximum 50 tweets per batch request' },
          { status: 400 }
        )
      }

      // Validate all URLs
      const invalidUrls = tweetUrls.filter(url => !isValidTwitterUrl(url))
      if (invalidUrls.length > 0) {
        return NextResponse.json(
          { 
            error: 'Invalid Twitter URLs found',
            invalidUrls: invalidUrls.slice(0, 5) // Show first 5 invalid URLs
          },
          { status: 400 }
        )
      }

      console.log(`Scraping engagement metrics for ${tweetUrls.length} tweets`)

      const fallbackService = getFallbackService({
        enableScraping: true,
        preferApi: forceMethod === 'api',
        apiTimeoutMs: 8000, // Longer timeout for batch requests
      })

      if (forceMethod === 'scraper') {
        fallbackService.updateConfig({ preferApi: false })
      }

      const results = await fallbackService.getBatchEngagementMetrics(tweetUrls)

      const successfulResults = results.filter(result => result.metrics !== null)
      const failedResults = results.filter(result => result.metrics === null)

      return NextResponse.json({
        success: true,
        data: {
          results: results.map(result => ({
            url: result.url,
            metrics: result.metrics ? {
              likes: result.metrics.likes,
              retweets: result.metrics.retweets,
              replies: result.metrics.replies,
              source: result.metrics.source,
              timestamp: result.metrics.timestamp
            } : null
          })),
          summary: {
            total: tweetUrls.length,
            successful: successfulResults.length,
            failed: failedResults.length,
            successRate: successfulResults.length / tweetUrls.length
          }
        },
        fallbackStatus: fallbackService.getStatus(),
        timestamp: new Date()
      })
    }

    return NextResponse.json(
      { error: 'Either tweetUrl or tweetUrls must be provided' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in scrape engagement endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during engagement scraping',
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

    console.log(`Getting engagement metrics for URL: ${tweetUrl} using method: ${method || 'auto'}`)

    const fallbackService = getFallbackService({
      enableScraping: true,
      preferApi: method === 'api' || method !== 'scraper',
    })

    if (method === 'scraper') {
      fallbackService.updateConfig({ preferApi: false })
    }

    const metrics = await fallbackService.getEngagementMetrics(tweetUrl)

    if (!metrics) {
      return NextResponse.json(
        {
          error: 'Unable to fetch engagement metrics',
          fallbackStatus: fallbackService.getStatus()
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        url: tweetUrl,
        metrics: {
          likes: metrics.likes,
          retweets: metrics.retweets,
          replies: metrics.replies,
          source: metrics.source,
          timestamp: metrics.timestamp
        }
      },
      fallbackStatus: fallbackService.getStatus(),
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Error in GET scrape engagement endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Status endpoint for monitoring the scraping service
export async function HEAD(request: NextRequest) {
  try {
    const fallbackService = getFallbackService()
    const status = fallbackService.getStatus()
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Fallback-Status': JSON.stringify(status),
        'X-Service-Health': 'ok',
        'X-Preferred-Source': status.preferredSource,
        'X-API-Failures': status.apiFailureCount.toString(),
        'X-Rate-Limited': status.isApiRateLimited.toString()
      }
    })
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Service-Health': 'error'
      }
    })
  }
}
