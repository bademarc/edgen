import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Starting leaderboard debug endpoint')
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Check environment variables
    const isFreeTier = process.env.OPTIMIZE_FOR_FREE_TIER === 'true'
    const enableCache = process.env.ENABLE_CACHE === 'true'
    const enableAggressiveCaching = process.env.ENABLE_AGGRESSIVE_CACHING === 'true'
    
    console.log('🔍 DEBUG: Environment variables:')
    console.log(`   OPTIMIZE_FOR_FREE_TIER: ${isFreeTier}`)
    console.log(`   ENABLE_CACHE: ${enableCache}`)
    console.log(`   ENABLE_AGGRESSIVE_CACHING: ${enableAggressiveCaching}`)
    
    // Test direct database query
    console.log('🔍 DEBUG: Testing direct database query...')
    const users = await prisma.user.findMany({
      where: {
        totalPoints: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        xUsername: true,
        image: true,
        totalPoints: true,
        _count: {
          select: {
            tweets: true,
          },
        },
      },
      orderBy: [
        {
          totalPoints: 'desc',
        },
        {
          joinDate: 'asc',
        },
      ],
      take: limit,
    })
    
    console.log(`🔍 DEBUG: Direct DB query returned ${users.length} users`)
    
    // Add rank and calculate average points per tweet
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
      tweetsCount: user._count.tweets,
      averagePointsPerTweet: user._count.tweets > 0 ? Math.round(user.totalPoints / user._count.tweets) : 0,
    }))
    
    console.log('🔍 DEBUG: Leaderboard processed successfully')
    
    return NextResponse.json({
      success: true,
      debug: {
        environment: {
          isFreeTier,
          enableCache,
          enableAggressiveCaching,
          nodeEnv: process.env.NODE_ENV,
          hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
          hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        },
        query: {
          limit,
          usersFound: users.length,
          directDbQuery: true,
        },
      },
      users: leaderboard,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ DEBUG: Leaderboard debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
