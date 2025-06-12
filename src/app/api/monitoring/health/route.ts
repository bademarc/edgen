import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { getSimplifiedXApiService } from '@/lib/simplified-x-api'
import { getSimplifiedTweetSubmissionService } from '@/lib/simplified-tweet-submission'
import { getSimplifiedCacheService } from '@/lib/simplified-cache'

interface EnvironmentCheck {
  twitterBearerToken: boolean
  twitterClientId: boolean
  twitterClientSecret: boolean
  supabaseUrl: boolean
  supabaseAnonKey: boolean
  databaseUrl: boolean
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

interface ManualSubmissionHealth {
  available: boolean
  status: string
  error: string | null
}

interface EngagementUpdateHealth {
  available: boolean
  isRunning: boolean
  error: string | null
}

export async function GET() {
  try {
    // Allow public access for health checks (remove auth requirement)
    console.log('🔍 Performing monitoring system health check...')

    // Check environment variables
    const envCheck: EnvironmentCheck = {
      twitterBearerToken: !!process.env.TWITTER_BEARER_TOKEN,
      twitterClientId: !!process.env.TWITTER_CLIENT_ID,
      twitterClientSecret: !!process.env.TWITTER_CLIENT_SECRET,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      databaseUrl: !!process.env.DATABASE_URL
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

    // Check Manual Submission Service health
    const manualSubmissionHealth: ManualSubmissionHealth = {
      available: false,
      status: 'unknown',
      error: null
    }

    try {
      const submissionService = getSimplifiedTweetSubmissionService()
      manualSubmissionHealth.available = true
      manualSubmissionHealth.status = 'healthy'
    } catch (error) {
      manualSubmissionHealth.error = error instanceof Error ? error.message : 'Manual submission service failed'
    }

    // Check Engagement Update Service health
    const engagementUpdateHealth: EngagementUpdateHealth = {
      available: false,
      isRunning: false,
      error: null
    }

    try {
      const engagementService = getEngagementUpdateService()
      const status = engagementService.getStatus()
      engagementUpdateHealth.available = true
      engagementUpdateHealth.isRunning = status.isRunning
    } catch (error) {
      engagementUpdateHealth.error = error instanceof Error ? error.message : 'Engagement update service failed'
    }

    // Check Simplified Fallback Service health
    const fallbackService = getSimplifiedFallbackService()
    const fallbackServiceHealth = fallbackService.getStatus()

    // Check for missing environment variables
    const missingEnvVars = Object.entries(envCheck)
      .filter(([, value]) => !value)
      .map(([key]) => key)

    // Overall system health assessment
    const systemHealth = {
      overall: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      canSubmitTweets: false,
      canUpdateEngagement: false,
      issues: [] as string[]
    }

    // Check for missing environment variables
    if (missingEnvVars.length > 0) {
      systemHealth.overall = 'degraded'
      systemHealth.issues.push(`Missing environment variables: ${missingEnvVars.join(', ')}`)
    }

    // Determine system capabilities
    systemHealth.canSubmitTweets = twitterApiHealth.healthy && manualSubmissionHealth.available
    systemHealth.canUpdateEngagement = twitterApiHealth.healthy && engagementUpdateHealth.available

    // Assess overall health
    if (!systemHealth.canSubmitTweets) {
      systemHealth.overall = 'unhealthy'
      if (!twitterApiHealth.healthy) {
        systemHealth.issues.push('Twitter API unavailable - manual tweet submission disabled')
      }
      if (!manualSubmissionHealth.available) {
        systemHealth.issues.push('Manual submission service unavailable')
      }
    } else if (!systemHealth.canUpdateEngagement) {
      systemHealth.overall = 'degraded'
      systemHealth.issues.push('Engagement update service unavailable - metrics may be stale')
    }

    // Add specific issues
    if (!twitterApiHealth.available) {
      systemHealth.issues.push('Twitter API credentials missing')
    } else if (!twitterApiHealth.healthy) {
      systemHealth.issues.push('Twitter API rate limited or unhealthy')
    }

    if (!manualSubmissionHealth.available) {
      systemHealth.issues.push('Manual submission service not available')
    }

    if (!engagementUpdateHealth.available) {
      systemHealth.issues.push('Engagement update service not available')
    } else if (!engagementUpdateHealth.isRunning) {
      systemHealth.issues.push('Engagement update service not running')
    }

    const healthReport = {
      timestamp: new Date().toISOString(),
      system: systemHealth,
      environment: envCheck,
      services: {
        twitterApi: twitterApiHealth,
        manualSubmission: manualSubmissionHealth,
        engagementUpdates: engagementUpdateHealth,
        fallbackService: fallbackServiceHealth
      },
      recommendations: [] as string[]
    }

    // Add recommendations based on issues
    if (missingEnvVars.length > 0) {
      healthReport.recommendations.push(`Set missing environment variables: ${missingEnvVars.join(', ')}`)
    }
    if (!twitterApiHealth.available) {
      healthReport.recommendations.push('Configure Twitter API credentials (TWITTER_BEARER_TOKEN, TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET)')
    }
    if (!manualSubmissionHealth.available) {
      healthReport.recommendations.push('Check manual tweet submission service configuration')
    }
    if (!engagementUpdateHealth.available) {
      healthReport.recommendations.push('Check engagement update service configuration')
    }
    if (!engagementUpdateHealth.isRunning && engagementUpdateHealth.available) {
      healthReport.recommendations.push('Start engagement update service: npm run services:start')
    }
    if (systemHealth.overall === 'unhealthy') {
      healthReport.recommendations.push('Twitter API and manual submission service must be available')
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

    // Reset simplified fallback service
    const fallbackService = getSimplifiedFallbackService()
    fallbackService.resetApiFailures()

    console.log('✅ Health status reset completed')

    return NextResponse.json({
      success: true,
      message: 'Health status reset successfully (manual submission system)',
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
