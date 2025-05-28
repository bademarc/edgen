import { NextRequest, NextResponse } from 'next/server'
import { getTweetTrackerInstance } from '@/lib/tweet-tracker'

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
    const { method = 'all' } = body

    const tweetTracker = getTweetTrackerInstance()
    const startTime = Date.now()

    const results: Record<string, { tweets: number; processed: number }> = {}

    try {
      if (method === 'all' || method === 'twscrape') {
        console.log('🔍 Running manual twscrape discovery...')
        const tweets = await tweetTracker.scrapeWithTwscrape()
        const processed = await tweetTracker.processTweets(tweets, 'manual-twscrape')
        results.twscrape = { tweets: tweets.length, processed }
      }

      if (method === 'all' || method === 'rss') {
        console.log('🔍 Running manual RSS discovery...')
        const tweets = await tweetTracker.scrapeWithRSS()
        const processed = await tweetTracker.processTweets(tweets, 'manual-rss')
        results.rss = { tweets: tweets.length, processed }
      }

      if (method === 'all' || method === 'nitter') {
        console.log('🔍 Running manual Nitter discovery...')
        const tweets = await tweetTracker.scrapeWithNitter()
        const processed = await tweetTracker.processTweets(tweets, 'manual-nitter')
        results.nitter = { tweets: tweets.length, processed }
      }

      const duration = Date.now() - startTime
      const totalTweets = Object.values(results).reduce((sum: number, result) => sum + result.tweets, 0)
      const totalProcessed = Object.values(results).reduce((sum: number, result) => sum + result.processed, 0)

      // Log the manual discovery
      await tweetTracker.logTrackingResult({
        method: `manual-${method}`,
        success: true,
        tweetsFound: totalProcessed,
        duration
      })

      console.log(`✅ Manual discovery completed: ${totalProcessed}/${totalTweets} tweets processed in ${duration}ms`)

      return NextResponse.json({
        success: true,
        message: 'Manual tweet discovery completed',
        results: {
          ...results,
          summary: {
            totalTweetsFound: totalTweets,
            totalProcessed: totalProcessed,
            duration: `${duration}ms`,
            method: method
          }
        }
      })

    } catch (discoveryError) {
      const duration = Date.now() - startTime

      // Log the failed discovery
      await tweetTracker.logTrackingResult({
        method: `manual-${method}`,
        success: false,
        tweetsFound: 0,
        error: discoveryError instanceof Error ? discoveryError.message : String(discoveryError),
        duration
      })

      throw discoveryError
    }

  } catch (error) {
    console.error('Error in manual tweet discovery:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const hours = parseInt(url.searchParams.get('hours') || '24')
    const method = url.searchParams.get('method')

    const tweetTracker = getTweetTrackerInstance()
    const stats = await tweetTracker.getTrackingStats(hours)

    // Filter by method if specified
    let filteredStats = stats
    if (method) {
      filteredStats = {
        ...stats,
        methodStats: stats.methodStats.filter(stat => stat.method.includes(method))
      }
    }

    return NextResponse.json({
      success: true,
      stats: filteredStats,
      period: `${hours} hours`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting discovery stats:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
