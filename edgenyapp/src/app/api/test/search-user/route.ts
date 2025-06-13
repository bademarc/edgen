import { NextRequest, NextResponse } from 'next/server'
import { TwitterMonitoringService } from '@/lib/twitter-monitoring'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({
        success: false,
        error: 'Username parameter is required',
        usage: 'GET /api/test/search-user?username=layeredge'
      }, { status: 400 })
    }

    console.log(`🧪 Testing search for user: @${username}`)

    const monitoringService = new TwitterMonitoringService()
    const searchResult = await monitoringService.searchUserTweets(username)

    return NextResponse.json({
      success: true,
      username: username,
      query: `from:${username} (@layeredge OR $EDGEN)`,
      result: {
        searchSuccess: searchResult.success,
        tweetsFound: searchResult.data?.data?.length || 0,
        error: searchResult.error,
        rateLimited: searchResult.rateLimited,
        tweets: searchResult.data?.data?.map(tweet => ({
          id: tweet.id,
          text: tweet.text.substring(0, 100) + (tweet.text.length > 100 ? '...' : ''),
          created_at: tweet.created_at,
          public_metrics: tweet.public_metrics
        })) || []
      },
      meta: searchResult.data?.meta || null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in search user test:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
