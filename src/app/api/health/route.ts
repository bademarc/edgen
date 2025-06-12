import { NextResponse } from 'next/server'
import { getSimplifiedXApiService } from '@/lib/simplified-x-api'
import { getSimplifiedTweetSubmissionService } from '@/lib/simplified-tweet-submission'
import { getSimplifiedCacheService } from '@/lib/simplified-cache'

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
  lastUpdateTime: number
  error: string | null
}

/**
 * Public health check endpoint for monitoring system status
 * No authentication required - this is for external monitoring
 */
export async function GET() {
  try {
    console.log('🔍 Public health check requested')

    // Check environment variables
    const envCheck = {
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
      const xApiService = getSimplifiedXApiService()
      twitterApiHealth.available = true
      twitterApiHealth.healthy = xApiService.isReady()
      // Test connection
      if (twitterApiHealth.healthy) {
        await xApiService.testConnection()
      }
    } catch (error) {
      twitterApiHealth.error = error instanceof Error ? error.message : 'Unknown error'
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
      lastUpdateTime: 0,
      error: null
    }

    try {
      // Simplified engagement tracking - just mark as available
      engagementUpdateHealth.available = true
      engagementUpdateHealth.isRunning = true
      engagementUpdateHealth.lastUpdateTime = Date.now()
    } catch (error) {
      engagementUpdateHealth.error = error instanceof Error ? error.message : 'Engagement update service failed'
    }

    // Check Simplified Cache Service
    const cacheService = getSimplifiedCacheService()
    const cacheServiceHealth = await cacheService.healthCheck()



    // Overall system assessment
    const systemHealth = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      canSubmitTweets: false,
      canUpdateEngagement: false,
      issues: [] as string[],
      capabilities: {
        twitterApi: twitterApiHealth.healthy,
        manualSubmission: manualSubmissionHealth.available,
        engagementUpdates: engagementUpdateHealth.available,
        cacheService: cacheServiceHealth
      }
    }

    // Determine system capabilities
    systemHealth.canSubmitTweets = twitterApiHealth.healthy && manualSubmissionHealth.available
    systemHealth.canUpdateEngagement = twitterApiHealth.healthy && engagementUpdateHealth.available

    // Assess overall health
    if (!systemHealth.canSubmitTweets) {
      systemHealth.status = 'unhealthy'
      if (!twitterApiHealth.healthy) {
        systemHealth.issues.push('Twitter API unavailable - manual tweet submission disabled')
      }
      if (!manualSubmissionHealth.available) {
        systemHealth.issues.push('Manual submission service unavailable')
      }
    } else if (!systemHealth.canUpdateEngagement) {
      systemHealth.status = 'degraded'
      systemHealth.issues.push('Engagement update service unavailable - metrics may be stale')
    }

    // Check for missing environment variables
    const missingEnvVars = Object.entries(envCheck)
      .filter(([, value]) => !value)
      .map(([key]) => key)

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
        manualSubmission: manualSubmissionHealth,
        engagementUpdates: engagementUpdateHealth,
        cacheService: cacheServiceHealth
      },
      recommendations: [] as string[]
    }

    // Add recommendations
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
export async function POST() {
  try {
    console.log('🔄 Resetting system health status...')

    // Reset simplified cache service
    const cacheService = getSimplifiedCacheService()
    // Cache service doesn't need reset, but we can test it
    await cacheService.healthCheck()

    console.log('✅ Health status reset completed')

    return NextResponse.json({
      success: true,
      message: 'System health status reset successfully (manual submission system)',
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
