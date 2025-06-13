import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { TwitterMonitoringService } from '@/lib/twitter-monitoring'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`🔄 Manual monitoring triggered for user ${userId}`)

    const monitoringService = new TwitterMonitoringService()
    const result = await monitoringService.monitorUserTweets(userId)

    console.log(`📊 Monitoring result for user ${userId}:`, {
      success: result.success,
      tweetsFound: result.tweetsFound,
      error: result.error
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Monitoring completed successfully. Found ${result.tweetsFound} new tweets.`,
        tweetsFound: result.tweetsFound
      })
    } else {
      // Provide more specific error handling
      const errorMessage = result.error || 'Unknown monitoring error'
      const statusCode = errorMessage.includes('re-authenticate') ? 401 :
                        errorMessage.includes('Invalid') ? 400 :
                        errorMessage.includes('rate limit') ? 429 : 400

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          tweetsFound: result.tweetsFound,
          suggestion: errorMessage.includes('re-authenticate')
            ? 'Please sign out and sign in again with Twitter to refresh your credentials.'
            : errorMessage.includes('rate limit')
            ? 'Twitter API is rate limited. The system will automatically retry using web scraping.'
            : 'Please try again later or contact support if the issue persists.'
        },
        { status: statusCode }
      )
    }

  } catch (error) {
    console.error('Error in user monitoring endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please try again later or contact support if the issue persists.'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get monitoring status for the current user
    const { prisma } = await import('@/lib/db')

    const monitoring = await prisma.tweetMonitoring.findUnique({
      where: { userId },
      select: {
        lastCheckAt: true,
        tweetsFound: true,
        status: true,
        errorMessage: true,
        createdAt: true,
      }
    })

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        autoMonitoringEnabled: true,
        lastTweetCheck: true,
        tweetCheckCount: true,
      }
    })

    return NextResponse.json({
      monitoring,
      user: userData,
      isEnabled: userData?.autoMonitoringEnabled || false
    })

  } catch (error) {
    console.error('Error fetching monitoring status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
