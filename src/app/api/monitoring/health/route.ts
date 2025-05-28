import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { TwitterApiService } from '@/lib/twitter-api'
import { getFallbackService } from '@/lib/fallback-service'
import { getWebScraperInstance } from '@/lib/web-scraper'

interface EnvironmentCheck {
  twitterBearerToken: boolean
  mentionTrackerSecret: boolean
  supabaseUrl: boolean
  supabaseServiceKey: boolean
  siteUrl: boolean
}

interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: number
}

interface TwitterApiHealth {
  available: boolean
  healthy: boolean
  rateLimitInfo: RateLimitInfo | null
  error: string | null
}

interface WebScraperHealth {
  available: boolean
  status: string
  error: string | null
}

interface EdgeFunctionHealth {
  available: boolean
  error: string | null
}

export async function GET() {
  try {
    // Allow public access for health checks (remove auth requirement)
    console.log('🔍 Performing monitoring system health check...')

    // Check environment variables
    const envCheck: EnvironmentCheck = {
      twitterBearerToken: !!process.env.TWITTER_BEARER_TOKEN,
      mentionTrackerSecret: !!process.env.MENTION_TRACKER_SECRET,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL
    }

    // Check Twitter API health
    const twitterApiHealth: TwitterApiHealth = {
      available: false,
      healthy: false,
      rateLimitInfo: null,
      error: null
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
    const browserStatus = webScraper.getBrowserStatus()
    const webScraperHealth: WebScraperHealth = {
      available: webScraper.isBrowserAvailable(),
      status: browserStatus.isHealthy ? 'healthy' : 'unhealthy',
      error: null
    }

    // Try to initialize browser if not available
    if (!webScraperHealth.available) {
      try {
        // Note: Browser initialization is handled internally by the service
        webScraperHealth.error = 'Browser not available - initialization needed'
      } catch (error) {
        webScraperHealth.error = error instanceof Error ? error.message : 'Browser initialization failed'
      }
    }

    // Check Fallback Service health
    const fallbackService = getFallbackService()
    const fallbackServiceHealth = fallbackService.getStatus()

    // Check Supabase Edge Function
    const edgeFunctionHealth: EdgeFunctionHealth = {
      available: false,
      error: null
    }

    try {
      const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/track-mentions`
      const edgeResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MENTION_TRACKER_SECRET}`,
          'Content-Type': 'application/json'
        }
      })

      if (edgeResponse.status === 404) {
        edgeFunctionHealth.error = 'Edge function not deployed'
      } else if (edgeResponse.status === 401) {
        edgeFunctionHealth.error = 'Authentication failed'
      } else {
        edgeFunctionHealth.available = true
      }
    } catch (error) {
      edgeFunctionHealth.error = error instanceof Error ? error.message : 'Edge function test failed'
    }

    // Check for missing environment variables
    const missingEnvVars = Object.entries(envCheck)
      .filter(([, value]) => !value)
      .map(([key]) => key)

    // Overall system health assessment
    const systemHealth = {
      overall: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      canMonitorTweets: false,
      canScrapeTweets: false,
      issues: [] as string[]
    }

    // Check for missing environment variables
    if (missingEnvVars.length > 0) {
      systemHealth.overall = 'degraded'
      systemHealth.issues.push(`Missing environment variables: ${missingEnvVars.join(', ')}`)
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
      environment: envCheck,
      services: {
        twitterApi: twitterApiHealth,
        webScraper: webScraperHealth,
        fallbackService: fallbackServiceHealth,
        edgeFunction: edgeFunctionHealth
      },
      recommendations: [] as string[]
    }

    // Add recommendations based on issues
    if (missingEnvVars.length > 0) {
      healthReport.recommendations.push(`Set missing environment variables: ${missingEnvVars.join(', ')}`)
    }
    if (!twitterApiHealth.available) {
      healthReport.recommendations.push('Configure Twitter API credentials (TWITTER_BEARER_TOKEN)')
    }
    if (!webScraperHealth.available) {
      healthReport.recommendations.push('Install Playwright browsers: npx playwright install chromium')
    }
    if (!edgeFunctionHealth.available) {
      healthReport.recommendations.push('Deploy Supabase edge function: supabase functions deploy track-mentions')
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
