import { NextRequest, NextResponse } from 'next/server'
import { TwitterMonitoringService } from '@/lib/twitter-monitoring'

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization or cron job authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'layeredge-cron-secret-2024'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      )
    }

    console.log('Starting batch monitoring job...')
    
    const monitoringService = new TwitterMonitoringService()
    const result = await monitoringService.monitorAllUsers()

    console.log('Batch monitoring completed:', result)

    return NextResponse.json({
      success: true,
      message: 'Batch monitoring completed',
      results: {
        totalUsers: result.totalUsers,
        successfulUsers: result.successfulUsers,
        totalTweetsFound: result.totalTweetsFound,
        errorCount: result.errors.length,
        errors: result.errors.slice(0, 10) // Limit errors in response
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in batch monitoring endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    const { prisma } = await import('@/lib/db')

    // Get monitoring statistics
    const stats = await prisma.tweetMonitoring.groupBy({
      by: ['status'],
      _count: {
        userId: true
      },
      _sum: {
        tweetsFound: true
      }
    })

    const totalUsers = await prisma.user.count({
      where: {
        autoMonitoringEnabled: true,
        xUsername: {
          not: null
        }
      }
    })

    const recentActivity = await prisma.tweetMonitoring.findMany({
      take: 10,
      orderBy: {
        lastCheckAt: 'desc'
      },
      include: {
        user: {
          select: {
            xUsername: true,
            name: true
          }
        }
      }
    })

    const autoDiscoveredTweets = await prisma.tweet.count({
      where: {
        isAutoDiscovered: true
      }
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        autoDiscoveredTweets,
        statusBreakdown: stats,
        recentActivity
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching monitoring stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
