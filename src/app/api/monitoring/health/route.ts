import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { TwitterApiService } from '@/lib/twitter-api'
import { getFallbackService } from '@/lib/fallback-service'
import { getWebScraperInstance } from '@/lib/web-scraper'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔍 Performing monitoring system health check...')

    // Check Twitter API health
    const twitterApiHealth = {
      available: false,
      healthy: false,
      rateLimitInfo: null as {
        limit: number
        remaining: number
        resetTime: number
      } | null,
      error: null as string | null
    }

    try {
      const twitterApi = new TwitterApiService()
      twitterApiHealth.available = true
      twitterApiHealth.healthy = await twitterApi.isApiAvailable()
      twitterApiHealth.rateLimitInfo = twitterApi.getRateLimitInfo()
    } catch (error) {
      twitterApiHealth.error = error instanceof Error ? error.message : 'Unknown error'
      console.warn('Twitter API not available:', twitterApiHealth.error)
    }

    // Check Web Scraper health
    const webScraper = getWebScraperInstance()
    const webScraperHealth = {
      available: webScraper.isBrowserAvailable(),
      status: webScraper.getBrowserStatus()
    }

    // Check Fallback Service health
    const fallbackService = getFallbackService()
    const fallbackServiceHealth = fallbackService.getStatus()

    // Overall system health assessment
    const systemHealth = {
      overall: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      canMonitorTweets: false,
      canScrapeTweets: false,
      issues: [] as string[]
    }

    // Determine if we can monitor tweets
    if (twitterApiHealth.healthy) {
      systemHealth.canMonitorTweets = true
    } else if (webScraperHealth.available) {
      systemHealth.canMonitorTweets = true
      systemHealth.canScrapeTweets = true
    }

    // Assess overall health
    if (!systemHealth.canMonitorTweets) {
      systemHealth.overall = 'unhealthy'
      systemHealth.issues.push('No monitoring methods available')
    } else if (!twitterApiHealth.healthy && webScraperHealth.available) {
      systemHealth.overall = 'degraded'
      systemHealth.issues.push('Twitter API unavailable, using web scraping fallback')
    } else if (twitterApiHealth.healthy && !webScraperHealth.available) {
      systemHealth.overall = 'degraded'
      systemHealth.issues.push('Web scraping unavailable, using Twitter API only')
    }

    // Add specific issues
    if (!twitterApiHealth.available) {
      systemHealth.issues.push('Twitter API credentials missing')
    } else if (!twitterApiHealth.healthy) {
      systemHealth.issues.push('Twitter API rate limited or unhealthy')
    }

    if (!webScraperHealth.available) {
      systemHealth.issues.push('Browser not available for web scraping')
    }

    const healthReport = {
      timestamp: new Date().toISOString(),
      system: systemHealth,
      services: {
        twitterApi: twitterApiHealth,
        webScraper: webScraperHealth,
        fallbackService: fallbackServiceHealth
      },
      recommendations: [] as string[]
    }

    // Add recommendations based on issues
    if (!twitterApiHealth.available) {
      healthReport.recommendations.push('Configure Twitter API credentials (TWITTER_BEARER_TOKEN)')
    }
    if (!webScraperHealth.available) {
      healthReport.recommendations.push('Install Playwright browsers: npx playwright install chromium')
    }
    if (systemHealth.overall === 'unhealthy') {
      healthReport.recommendations.push('At least one monitoring method must be available')
    }

    console.log(`Health check completed. Overall status: ${systemHealth.overall}`)

    return NextResponse.json(healthReport)

  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Reset health status for recovery
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Resetting monitoring system health status...')

    // Reset fallback service
    const fallbackService = getFallbackService()
    fallbackService.resetApiFailures()

    // Reset web scraper
    const webScraper = getWebScraperInstance()
    webScraper.resetBrowserHealth()

    console.log('✅ Health status reset completed')

    return NextResponse.json({
      success: true,
      message: 'Health status reset successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Health reset failed:', error)
    return NextResponse.json(
      {
        error: 'Health reset failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
