import { NextRequest, NextResponse } from 'next/server'
import { TwitterApiService } from '@/lib/twitter-api'
import { getWebScraperInstance } from '@/lib/web-scraper'
import { getFallbackService } from '@/lib/fallback-service'

/**
 * Public health check endpoint for monitoring system status
 * No authentication required - this is for external monitoring
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Public health check requested')

    // Check environment variables
    const envCheck = {
      twitterBearerToken: !!process.env.TWITTER_BEARER_TOKEN,
      mentionTrackerSecret: !!process.env.MENTION_TRACKER_SECRET,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL
    }

    // Check Twitter API health
    const twitterApiHealth = {
      available: false,
      healthy: false,
      rateLimitInfo: null as any,
      error: null as string | null
    }

    try {
      const twitterApi = new TwitterApiService()
      twitterApiHealth.available = true
      twitterApiHealth.healthy = await twitterApi.isApiAvailable()
      twitterApiHealth.rateLimitInfo = twitterApi.getRateLimitInfo()
    } catch (error) {
      twitterApiHealth.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Check Web Scraper health
    const webScraperHealth = {
      available: false,
      status: 'unknown',
      error: null as string | null
    }

    try {
      const webScraper = getWebScraperInstance()
      webScraperHealth.available = webScraper.isBrowserAvailable()
      webScraperHealth.status = webScraper.getBrowserStatus()
      
      // Try to initialize if not available
      if (!webScraperHealth.available) {
        await webScraper.initializeBrowser()
        webScraperHealth.available = webScraper.isBrowserAvailable()
        webScraperHealth.status = webScraper.getBrowserStatus()
      }
    } catch (error) {
      webScraperHealth.error = error instanceof Error ? error.message : 'Browser initialization failed'
    }

    // Check Fallback Service
    const fallbackService = getFallbackService()
    const fallbackServiceHealth = fallbackService.getStatus()

    // Check Supabase Edge Function
    const edgeFunctionHealth = {
      available: false,
      deployed: false,
      authenticated: false,
      error: null as string | null
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
        edgeFunctionHealth.deployed = true
        edgeFunctionHealth.error = 'Authentication failed'
      } else {
        edgeFunctionHealth.deployed = true
        edgeFunctionHealth.authenticated = true
        edgeFunctionHealth.available = true
      }
    } catch (error) {
      edgeFunctionHealth.error = error instanceof Error ? error.message : 'Edge function test failed'
    }

    // Overall system assessment
    const systemHealth = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      canTrackMentions: false,
      issues: [] as string[],
      capabilities: {
        twitterApi: twitterApiHealth.healthy,
        webScraping: webScraperHealth.available,
        edgeFunction: edgeFunctionHealth.available,
        fallbackService: true
      }
    }

    // Determine if we can track mentions
    systemHealth.canTrackMentions = (twitterApiHealth.healthy || webScraperHealth.available) && edgeFunctionHealth.available

    // Assess overall health
    if (!systemHealth.canTrackMentions) {
      systemHealth.status = 'unhealthy'
      if (!edgeFunctionHealth.available) {
        systemHealth.issues.push('Edge function not available for automated tracking')
      }
      if (!twitterApiHealth.healthy && !webScraperHealth.available) {
        systemHealth.issues.push('No data sources available (API and scraping both failed)')
      }
    } else if (!twitterApiHealth.healthy || !webScraperHealth.available) {
      systemHealth.status = 'degraded'
      if (!twitterApiHealth.healthy) {
        systemHealth.issues.push('Twitter API unavailable, using web scraping fallback')
      }
      if (!webScraperHealth.available) {
        systemHealth.issues.push('Web scraping unavailable, using Twitter API only')
      }
    }

    // Check for missing environment variables
    const missingEnvVars = Object.entries(envCheck)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key)

    if (missingEnvVars.length > 0) {
      systemHealth.status = 'unhealthy'
      systemHealth.issues.push(`Missing environment variables: ${missingEnvVars.join(', ')}`)
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

    // Add recommendations
    if (missingEnvVars.length > 0) {
      healthReport.recommendations.push(`Set missing environment variables: ${missingEnvVars.join(', ')}`)
    }
    if (!edgeFunctionHealth.deployed) {
      healthReport.recommendations.push('Deploy Supabase edge function: supabase functions deploy track-mentions')
    }
    if (!edgeFunctionHealth.authenticated && edgeFunctionHealth.deployed) {
      healthReport.recommendations.push('Check MENTION_TRACKER_SECRET environment variable')
    }
    if (!twitterApiHealth.available) {
      healthReport.recommendations.push('Configure Twitter API credentials (TWITTER_BEARER_TOKEN)')
    }
    if (!webScraperHealth.available) {
      healthReport.recommendations.push('Install Playwright browsers: npx playwright install chromium')
    }

    // Set appropriate HTTP status based on health
    const httpStatus = systemHealth.status === 'unhealthy' ? 503 : 
                      systemHealth.status === 'degraded' ? 200 : 200

    return NextResponse.json(healthReport, { status: httpStatus })

  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        system: { 
          status: 'unhealthy', 
          canTrackMentions: false,
          issues: ['Health check system failure'] 
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Reset system health status (for recovery)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Resetting system health status...')

    // Reset fallback service
    const fallbackService = getFallbackService()
    fallbackService.resetApiFailures()

    // Reset web scraper
    const webScraper = getWebScraperInstance()
    webScraper.resetBrowserHealth()

    // Try to reinitialize browser
    try {
      await webScraper.initializeBrowser()
    } catch (error) {
      console.warn('Browser reinitialization failed:', error)
    }

    console.log('✅ Health status reset completed')

    return NextResponse.json({
      success: true,
      message: 'System health status reset successfully',
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
