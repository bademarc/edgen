import { NextRequest, NextResponse } from 'next/server'
import { getTweetTrackerInstance } from '@/lib/tweet-tracker'

export async function GET() {
  try {
    const tweetTracker = getTweetTrackerInstance()

    // Get basic status
    const status = tweetTracker.getStatus()

    // Get tracking statistics
    const stats = await tweetTracker.getTrackingStats(24) // Last 24 hours

    return NextResponse.json({
      success: true,
      status: {
        ...status,
        stats,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Error getting tracking status:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET || 'layeredge-admin-secret-2024'

    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    const tweetTracker = getTweetTrackerInstance()

    switch (action) {
      case 'start':
        await tweetTracker.start()
        return NextResponse.json({
          success: true,
          message: 'Tweet tracking system started',
          status: tweetTracker.getStatus()
        })

      case 'stop':
        await tweetTracker.stop()
        return NextResponse.json({
          success: true,
          message: 'Tweet tracking system stopped',
          status: tweetTracker.getStatus()
        })

      case 'restart':
        await tweetTracker.stop()
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        await tweetTracker.start()
        return NextResponse.json({
          success: true,
          message: 'Tweet tracking system restarted',
          status: tweetTracker.getStatus()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, or restart' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error managing tracking system:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
