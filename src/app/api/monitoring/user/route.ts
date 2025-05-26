import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { TwitterMonitoringService } from '@/lib/twitter-monitoring'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const monitoringService = new TwitterMonitoringService()
    const result = await monitoringService.monitorUserTweets(session.user.id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Monitoring completed successfully. Found ${result.tweetsFound} new tweets.`,
        tweetsFound: result.tweetsFound
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          tweetsFound: result.tweetsFound
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in user monitoring endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get monitoring status for the current user
    const { prisma } = await import('@/lib/db')

    const monitoring = await prisma.tweetMonitoring.findUnique({
      where: { userId: session.user.id },
      select: {
        lastCheckAt: true,
        tweetsFound: true,
        status: true,
        errorMessage: true,
        createdAt: true,
      }
    })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        autoMonitoringEnabled: true,
        lastTweetCheck: true,
        tweetCheckCount: true,
      }
    })

    return NextResponse.json({
      monitoring,
      user,
      isEnabled: user?.autoMonitoringEnabled || false
    })

  } catch (error) {
    console.error('Error fetching monitoring status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
