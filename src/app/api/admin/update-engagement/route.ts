import { NextRequest, NextResponse } from 'next/server'
import { getEngagementScheduler } from '@/lib/engagement-scheduler'
import { EngagementPointsService } from '@/lib/engagement-points-service'

/**
 * Admin API endpoint to manually trigger engagement updates
 * POST /api/admin/update-engagement
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSecret = request.headers.get('x-admin-secret')
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { action, tweetUrl, engagement } = body

    switch (action) {
      case 'force-update':
        // Force update all tweets using engagement service directly
        const engagementService = new EngagementPointsService()
        const result = await engagementService.batchUpdateEngagement(20) // Update 20 tweets

        return NextResponse.json({
          success: true,
          message: 'Engagement update completed',
          result: {
            processed: result.processed,
            updated: result.updated,
            totalPointsAwarded: result.totalPointsAwarded
          }
        })

      case 'update-single':
        // Update a single tweet
        if (!tweetUrl) {
          return NextResponse.json(
            { error: 'tweetUrl is required for single update' },
            { status: 400 }
          )
        }

        const engagementService = new EngagementPointsService()
        const singleResult = await engagementService.updateTweetEngagement(tweetUrl)
        
        return NextResponse.json({
          success: singleResult.success,
          message: singleResult.success ? 'Tweet updated successfully' : 'Failed to update tweet',
          result: singleResult
        })

      case 'manual-engagement':
        // Manually set engagement metrics
        if (!tweetUrl || !engagement) {
          return NextResponse.json(
            { error: 'tweetUrl and engagement are required for manual update' },
            { status: 400 }
          )
        }

        const manualService = new EngagementPointsService()
        const manualResult = await manualService.manualEngagementUpdate(tweetUrl, engagement)
        
        return NextResponse.json({
          success: manualResult.success,
          message: manualResult.success ? 'Manual engagement update completed' : 'Failed to update engagement',
          result: manualResult
        })

      case 'scheduler-status':
        // Get scheduler status
        const statusScheduler = getEngagementScheduler()
        const status = statusScheduler.getStatus()
        
        return NextResponse.json({
          success: true,
          status
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: force-update, update-single, manual-engagement, or scheduler-status' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Admin engagement update error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check engagement update status
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSecret = request.headers.get('x-admin-secret')
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const scheduler = getEngagementScheduler()
    const status = scheduler.getStatus()

    return NextResponse.json({
      success: true,
      scheduler: status,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin engagement status error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
