import { NextRequest, NextResponse } from 'next/server'
import { TwitterMonitoringService } from '@/lib/twitter-monitoring'
import { ensureServerInitialization } from '@/lib/server-init'

export async function GET(request: NextRequest) {
  try {
    // Ensure server initialization (including enhanced tracking)
    await ensureServerInitialization()

    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'layeredge-cron-secret-2024-auto-monitoring'

    // Allow requests from Koyeb cron or with proper authorization
    const isKoyebCron = request.headers.get('user-agent')?.includes('Koyeb')
    const hasValidAuth = authHeader === `Bearer ${cronSecret}`

    if (!isKoyebCron && !hasValidAuth) {
      console.log('Unauthorized cron request:', {
        userAgent: request.headers.get('user-agent'),
        hasAuth: !!authHeader,
        isKoyeb: isKoyebCron
      })

      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron request' },
        { status: 401 }
      )
    }

    console.log('Starting scheduled tweet monitoring job...')

    const monitoringService = new TwitterMonitoringService()
    const startTime = Date.now()

    const result = await monitoringService.monitorAllUsers()

    const duration = Date.now() - startTime

    console.log(`Scheduled monitoring completed in ${duration}ms:`, {
      totalUsers: result.totalUsers,
      successfulUsers: result.successfulUsers,
      totalTweetsFound: result.totalTweetsFound,
      errorCount: result.errors.length
    })

    // Log any errors for debugging
    if (result.errors.length > 0) {
      console.error('Monitoring errors:', result.errors.slice(0, 5)) // Log first 5 errors
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled tweet monitoring completed',
      results: {
        totalUsers: result.totalUsers,
        successfulUsers: result.successfulUsers,
        totalTweetsFound: result.totalTweetsFound,
        errorCount: result.errors.length,
        duration: `${duration}ms`,
        errors: result.errors.slice(0, 3) // Include first 3 errors in response
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in scheduled monitoring job:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during scheduled monitoring',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
