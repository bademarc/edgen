import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase-server'
import { getEngagementUpdateService } from '@/lib/engagement-update-service'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (optional for admin operations)
    const supabase = await createServerComponentClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // For now, allow unauthenticated access for system operations
    // In production, you might want to add admin authentication

    const engagementService = getEngagementUpdateService()

    // Check if specific tweet ID is provided
    const body = await request.json().catch(() => ({}))
    const { tweetId } = body

    if (tweetId) {
      // Update specific tweet
      const success = await engagementService.updateSpecificTweet(tweetId)
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: `Engagement metrics updated for tweet ${tweetId}`
        })
      } else {
        return NextResponse.json(
          { error: `Failed to update engagement metrics for tweet ${tweetId}` },
          { status: 500 }
        )
      }
    } else {
      // Update batch of tweets
      const result = await engagementService.updateEngagementMetrics()
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        updatedTweets: result.updatedTweets,
        errors: result.errors,
        rateLimited: result.rateLimited
      })
    }

  } catch (error) {
    console.error('Engagement update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const engagementService = getEngagementUpdateService()

    // Get service status
    const status = engagementService.getStatus()

    // Get update statistics
    const stats = await engagementService.getUpdateStats()

    return NextResponse.json({
      status: {
        isRunning: status.isRunning,
        lastUpdateTime: status.lastUpdateTime,
        nextUpdateTime: status.nextUpdateTime,
        apiAvailable: status.apiAvailable
      },
      statistics: stats
    })

  } catch (error) {
    console.error('Engagement status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
