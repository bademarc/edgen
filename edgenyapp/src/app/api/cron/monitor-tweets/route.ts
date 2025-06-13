import { NextRequest, NextResponse } from 'next/server'
import { TwitterMonitoringService } from '@/lib/twitter-monitoring'
import { RSSMonitoringService } from '@/lib/rss-monitoring'
import { ensureServerInitialization } from '@/lib/server-init'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // OPTIMIZED: Check if automatic monitoring is disabled
    const manualOnlyMode = process.env.MANUAL_SUBMISSIONS_ONLY !== 'false' // Default to true
    const enableAutoServices = process.env.ENABLE_AUTO_TWITTER_SERVICES === 'true'

    if (manualOnlyMode && !enableAutoServices) {
      console.log('🔒 Cron monitoring disabled - Manual submissions only mode')
      return NextResponse.json({
        success: true,
        message: 'Automatic monitoring disabled - Manual submissions only mode active',
        strategy: 'manual_only',
        optimization: 'Twitter API usage reduced by 90%+',
        manualSubmissions: 'Fully functional via /submit-tweet page',
        timestamp: new Date().toISOString()
      })
    }

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

    console.log('🚀 Starting optimized monitoring job (RSS-first strategy)...')
    console.log('⚠️ WARNING: Automatic monitoring active - high Twitter API usage')
    const startTime = Date.now()

    // Phase 1: RSS Monitoring (Primary method - 90% of monitoring)
    console.log('📡 Phase 1: RSS monitoring for LayerEdge mentions...')
    const rssService = new RSSMonitoringService()
    const rssResults = await rssService.monitorAllFeeds()

    console.log(`📊 RSS Results: ${rssResults.newTweets} new tweets from ${rssResults.totalTweets} total`)

    // Phase 2: Selective API Monitoring (Secondary method - 10% of monitoring)
    console.log('🔑 Phase 2: Selective API monitoring for critical users...')

    // Only monitor high-engagement users with API to conserve quota
    const criticalUsers = await prisma.user.findMany({
      where: {
        AND: [
          { autoMonitoringEnabled: true },
          { xUserId: { not: null } },
          { xUsername: { not: null } },
          {
            OR: [
              { totalPoints: { gte: 500 } }, // High-engagement users
              { lastTweetCheck: { lt: new Date(Date.now() - 12 * 60 * 60 * 1000) } } // Users not checked in 12 hours
            ]
          }
        ]
      },
      orderBy: [
        { totalPoints: 'desc' },
        { lastTweetCheck: 'asc' }
      ],
      take: 3 // Maximum 3 users per run to conserve API quota
    })

    let apiResults = {
      totalUsers: 0,
      successfulUsers: 0,
      totalTweetsFound: 0,
      errors: [] as any[],
      skipped: true
    }

    if (criticalUsers.length > 0) {
      console.log(`🎯 API monitoring for ${criticalUsers.length} critical users`)
      const twitterService = new TwitterMonitoringService()

      // Monitor specific users with API
      const specificResults = await twitterService.monitorSpecificUsers(criticalUsers)
      apiResults = {
        ...specificResults,
        skipped: false
      }
    } else {
      console.log('⏭️ No critical users need API monitoring at this time')
    }

    const duration = Date.now() - startTime

    // Update system monitoring status with safe user validation
    try {
      // Ensure system user exists
      const systemUser = await prisma.user.findUnique({ where: { id: 'system' } })
      if (!systemUser) {
        console.warn('System user not found, creating...')
        await prisma.user.create({
          data: {
            id: 'system',
            name: 'System Monitor',
            email: 'system@layeredge.app',
            totalPoints: 0,
            autoMonitoringEnabled: false
          }
        })
      }

      await prisma.tweetMonitoring.upsert({
        where: { userId: 'system' },
        update: {
          status: (rssResults.errors.length > 0 || apiResults.errors.length > 0) ? 'warning' : 'active',
          lastCheckAt: new Date(),
          tweetsFound: rssResults.newTweets + apiResults.totalTweetsFound,
          errorMessage: rssResults.errors.length > 0 ? `RSS errors: ${rssResults.errors.length}` : null
        },
        create: {
          userId: 'system',
          status: (rssResults.errors.length > 0 || apiResults.errors.length > 0) ? 'warning' : 'active',
          lastCheckAt: new Date(),
          tweetsFound: rssResults.newTweets + apiResults.totalTweetsFound,
          errorMessage: rssResults.errors.length > 0 ? `RSS errors: ${rssResults.errors.length}` : null
        }
      })
    } catch (dbError) {
      console.warn('Failed to update monitoring status:', dbError)
    }

    console.log(`✅ Optimized monitoring completed in ${duration}ms:`, {
      rss: {
        newTweets: rssResults.newTweets,
        totalProcessed: rssResults.totalTweets,
        feedErrors: rssResults.errors.length
      },
      api: {
        usersMonitored: apiResults.totalUsers,
        successfulUsers: apiResults.successfulUsers,
        tweetsFound: apiResults.totalTweetsFound,
        errors: apiResults.errors.length,
        skipped: apiResults.skipped
      },
      total: {
        newTweets: rssResults.newTweets + apiResults.totalTweetsFound,
        duration: `${duration}ms`
      }
    })

    return NextResponse.json({
      success: true,
      strategy: 'rss-first-optimized',
      rss: {
        newTweets: rssResults.newTweets,
        totalProcessed: rssResults.totalTweets,
        feedResults: rssResults.feedResults,
        errors: rssResults.errors
      },
      api: {
        usersMonitored: apiResults.totalUsers,
        successfulUsers: apiResults.successfulUsers,
        tweetsFound: apiResults.totalTweetsFound,
        errors: apiResults.errors,
        skipped: apiResults.skipped
      },
      summary: {
        totalNewTweets: rssResults.newTweets + apiResults.totalTweetsFound,
        apiCallsSaved: `~${90}%`, // Estimated API usage reduction
        duration: `${duration}ms`
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Optimized monitoring job failed:', error)

    return NextResponse.json(
      {
        error: 'Monitoring job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        strategy: 'rss-first-optimized',
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
