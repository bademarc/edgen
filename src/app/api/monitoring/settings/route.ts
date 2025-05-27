import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { autoMonitoringEnabled } = body

    if (typeof autoMonitoringEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'autoMonitoringEnabled must be a boolean' },
        { status: 400 }
      )
    }

    // Update user's monitoring preference
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        autoMonitoringEnabled
      },
      select: {
        autoMonitoringEnabled: true,
        xUsername: true,
      }
    })

    // Update monitoring status
    if (autoMonitoringEnabled) {
      await prisma.tweetMonitoring.upsert({
        where: { userId },
        update: {
          status: 'active',
          errorMessage: null,
        },
        create: {
          userId,
          status: 'active',
          tweetsFound: 0,
        },
      })
    } else {
      await prisma.tweetMonitoring.upsert({
        where: { userId },
        update: {
          status: 'paused',
        },
        create: {
          userId,
          status: 'paused',
          tweetsFound: 0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      autoMonitoringEnabled: updatedUser.autoMonitoringEnabled,
      message: autoMonitoringEnabled
        ? 'Automatic monitoring enabled'
        : 'Automatic monitoring disabled'
    })

  } catch (error) {
    console.error('Error updating monitoring settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        autoMonitoringEnabled: true,
        xUsername: true,
        lastTweetCheck: true,
        tweetCheckCount: true,
      }
    })

    const monitoring = await prisma.tweetMonitoring.findUnique({
      where: { userId },
      select: {
        status: true,
        lastCheckAt: true,
        tweetsFound: true,
        errorMessage: true,
      }
    })

    return NextResponse.json({
      autoMonitoringEnabled: user?.autoMonitoringEnabled || false,
      xUsername: user?.xUsername,
      lastTweetCheck: user?.lastTweetCheck,
      tweetCheckCount: user?.tweetCheckCount || 0,
      monitoring
    })

  } catch (error) {
    console.error('Error fetching monitoring settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
