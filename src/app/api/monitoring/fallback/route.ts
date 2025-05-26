import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { TwitterMonitoringService } from '@/lib/twitter-monitoring'
import { getFallbackService } from '@/lib/fallback-service'
import { prisma } from '@/lib/db'

/**
 * Enhanced monitoring endpoint that uses fallback methods
 * POST /api/monitoring/fallback - Trigger fallback monitoring for current user
 * GET /api/monitoring/fallback - Get fallback system status
 */

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

    const { searchParams } = new URL(request.url)
    const forceMethod = searchParams.get('method') // 'api', 'scraper', or 'auto'
    const userId = user.id

    console.log(`🔄 Starting fallback monitoring for user ${userId} with method: ${forceMethod || 'auto'}`)

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        xUsername: true,
        xUserId: true,
        autoMonitoringEnabled: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.xUsername) {
      return NextResponse.json(
        { error: 'Twitter username not set. Please re-authenticate with Twitter.' },
        { status: 400 }
      )
    }

    // Initialize monitoring service
    const monitoringService = new TwitterMonitoringService()

    let result
    let method = 'unknown'

    if (forceMethod === 'scraper') {
      // Force web scraping only
      console.log('🕷️ Forcing web scraping method')
      try {
        const scrapedTweets = await monitoringService.searchUserTweetsWithFallback(
          user.xUsername,
          undefined
        )

        if (scrapedTweets.length > 0) {
          const processedCount = await monitoringService['processScrapedTweets'](userId, scrapedTweets)
          result = { success: true, tweetsFound: processedCount }
          method = 'scraper'
        } else {
          result = { success: false, tweetsFound: 0, error: 'No tweets found via scraping' }
        }
      } catch (error) {
        result = {
          success: false,
          tweetsFound: 0,
          error: error instanceof Error ? error.message : 'Scraping failed'
        }
      }
    } else if (forceMethod === 'api') {
      // Force API only
      console.log('🔌 Forcing API method')
      try {
        result = await monitoringService.monitorUserTweets(userId)
        method = 'api'
      } catch (error) {
        result = {
          success: false,
          tweetsFound: 0,
          error: error instanceof Error ? error.message : 'API failed'
        }
      }
    } else {
      // Auto fallback (default)
      console.log('🔄 Using automatic fallback')
      result = await monitoringService.monitorUserTweets(userId)
      method = 'auto'
    }

    // Update monitoring status
    await prisma.tweetMonitoring.upsert({
      where: { userId },
      update: {
        lastCheckAt: new Date(),
        status: result.success ? 'active' : 'error',
        errorMessage: result.success ? null : result.error,
        tweetsFound: result.success ? { increment: result.tweetsFound } : undefined
      },
      create: {
        userId,
        lastCheckAt: new Date(),
        status: result.success ? 'active' : 'error',
        errorMessage: result.success ? null : result.error,
        tweetsFound: result.success ? result.tweetsFound : 0
      }
    })

    return NextResponse.json({
      success: result.success,
      method: method,
      tweetsFound: result.tweetsFound,
      error: result.error,
      user: {
        name: user.name,
        username: user.xUsername
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in fallback monitoring:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get fallback system status
    const fallbackService = getFallbackService()
    const fallbackStatus = fallbackService.getStatus()

    console.log('Fallback system status:', fallbackStatus)

    // Check API availability
    let apiStatus = 'unknown'
    try {
      // Simple test to check if Twitter API is accessible
      const testResponse = await fetch('https://api.twitter.com/2/tweets/search/recent?query=test&max_results=10', {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
        signal: AbortSignal.timeout(5000)
      })
      apiStatus = testResponse.ok ? 'available' : 'error'
    } catch {
      apiStatus = 'unavailable'
    }

    // Get monitoring statistics
    const monitoringStats = await prisma.tweetMonitoring.groupBy({
      by: ['status'],
      _count: { userId: true }
    })

    const recentActivity = await prisma.tweetMonitoring.findMany({
      take: 5,
      orderBy: { lastCheckAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            xUsername: true
          }
        }
      }
    })

    const autoDiscoveredCount = await prisma.tweet.count({
      where: { isAutoDiscovered: true }
    })

    return NextResponse.json({
      status: 'operational',
      fallbackSystem: {
        apiStatus,
        scrapingEnabled: process.env.ENABLE_WEB_SCRAPING === 'true',
        preferApi: process.env.FALLBACK_PREFER_API === 'true'
      },
      statistics: {
        monitoringStats,
        autoDiscoveredTweets: autoDiscoveredCount,
        recentActivity: recentActivity.map(activity => ({
          username: activity.user.xUsername,
          name: activity.user.name,
          status: activity.status,
          lastCheck: activity.lastCheckAt,
          tweetsFound: activity.tweetsFound,
          error: activity.errorMessage
        }))
      },
      configuration: {
        enableScraping: process.env.ENABLE_WEB_SCRAPING,
        scrapingTimeout: process.env.SCRAPING_TIMEOUT_MS,
        maxBrowserInstances: process.env.MAX_BROWSER_INSTANCES,
        rateLimitCooldown: process.env.RATE_LIMIT_COOLDOWN_MS,
        apiTimeout: process.env.API_TIMEOUT_MS
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting fallback status:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
