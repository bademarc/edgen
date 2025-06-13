import { NextRequest, NextResponse } from 'next/server'
import { TwitterMonitoringService } from '@/lib/twitter-monitoring'
import { prisma } from '@/lib/db'

/**
 * Manual trigger endpoint for mention tracking
 * This endpoint allows manual triggering of the mention tracking system
 * for testing and recovery purposes
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual mention tracking trigger requested')

    // Check for admin authorization (optional - can be made public for testing)
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.MENTION_TRACKER_SECRET || 'layeredge-mention-tracker-2024-secure-key'

    // Allow both authenticated and unauthenticated requests for testing
    const isAuthenticated = authHeader === `Bearer ${expectedSecret}`

    if (!isAuthenticated) {
      console.log('⚠️ Unauthenticated request - running in test mode with limited scope')
    }

    // Initialize monitoring service
    const monitoringService = new TwitterMonitoringService()

    // Get users ready for monitoring
    const usersToMonitor = await prisma.user.findMany({
      where: {
        AND: [
          { xUserId: { not: null } },
          { xUsername: { not: null } },
          { autoMonitoringEnabled: true }
        ]
      },
      select: {
        id: true,
        xUsername: true,
        xUserId: true,
        name: true
      },
      take: isAuthenticated ? 100 : 5 // Limit to 5 users for unauthenticated requests
    })

    console.log(`📊 Found ${usersToMonitor.length} users ready for monitoring`)

    if (usersToMonitor.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found with X credentials and monitoring enabled',
        processed: 0,
        users: 0,
        timestamp: new Date().toISOString()
      })
    }

    // Process each user
    let totalProcessed = 0
    let totalErrors = 0
    const results = []

    for (const user of usersToMonitor) {
      try {
        console.log(`🔍 Processing user: @${user.xUsername} (${user.name})`)

        const result = await monitoringService.monitorUserTweets(user.id)

        results.push({
          userId: user.id,
          username: user.xUsername,
          name: user.name,
          processed: result.tweetsFound,
          method: 'api', // Default method
          success: result.success
        })

        totalProcessed += result.tweetsFound
        console.log(`✅ Processed ${result.tweetsFound} tweets for @${user.xUsername}`)

      } catch (error) {
        console.error(`❌ Error processing user @${user.xUsername}:`, error)

        results.push({
          userId: user.id,
          username: user.xUsername,
          name: user.name,
          processed: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        })

        totalErrors++
      }
    }

    // Update monitoring status
    try {
      await prisma.tweetMonitoring.upsert({
        where: { userId: 'system' },
        update: {
          status: totalErrors === usersToMonitor.length ? 'error' : 'active',
          lastCheckAt: new Date(),
          tweetsFound: totalProcessed,
          errorMessage: totalErrors > 0 ? `${totalErrors} users failed processing` : null
        },
        create: {
          userId: 'system',
          status: totalErrors === usersToMonitor.length ? 'error' : 'active',
          lastCheckAt: new Date(),
          tweetsFound: totalProcessed,
          errorMessage: totalErrors > 0 ? `${totalErrors} users failed processing` : null
        }
      })
    } catch (dbError) {
      console.warn('Failed to update monitoring status:', dbError)
    }

    const response = {
      success: true,
      message: 'Manual mention tracking completed',
      summary: {
        usersProcessed: usersToMonitor.length,
        tweetsProcessed: totalProcessed,
        errors: totalErrors,
        successRate: ((usersToMonitor.length - totalErrors) / usersToMonitor.length * 100).toFixed(1) + '%'
      },
      results: results,
      authenticated: isAuthenticated,
      timestamp: new Date().toISOString()
    }

    console.log('🎉 Manual tracking completed:', response.summary)

    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 Fatal error in manual mention tracking:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Get status of the mention tracking system
 */
export async function GET() {
  try {
    // Check system configuration
    const config = {
      twitterBearerToken: !!process.env.TWITTER_BEARER_TOKEN,
      mentionTrackerSecret: !!process.env.MENTION_TRACKER_SECRET,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }

    // Get monitoring statistics
    const stats = await prisma.user.aggregate({
      where: {
        AND: [
          { xUserId: { not: null } },
          { xUsername: { not: null } },
          { autoMonitoringEnabled: true }
        ]
      },
      _count: true
    })

    const recentTweets = await prisma.tweet.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    // Get last monitoring status
    const lastMonitoring = await prisma.tweetMonitoring.findUnique({
      where: { userId: 'system' }
    })

    return NextResponse.json({
      status: 'operational',
      configuration: config,
      statistics: {
        usersWithMonitoring: stats._count,
        tweetsLast24h: recentTweets,
        lastCheck: lastMonitoring?.lastCheckAt,
        lastStatus: lastMonitoring?.status,
        lastError: lastMonitoring?.errorMessage
      },
      endpoints: {
        manualTrigger: '/api/mentions/trigger (POST)',
        healthCheck: '/api/mentions/track (GET)',
        edgeFunction: process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/track-mentions'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
