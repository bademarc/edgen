import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Community feed API route for recent tweets page
 * Serves curated community content from our platform database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'recent'
    const search = searchParams.get('search') || ''

    // Validate and sanitize parameters
    const validatedLimit = Math.min(Math.max(limit, 1), 100) // Between 1 and 100
    const validatedOffset = Math.max(offset, 0)

    // Build order by clause
    let orderBy: any = { submittedAt: 'desc' } // Default to most recent

    switch (sortBy) {
      case 'points':
        orderBy = { totalPoints: 'desc' }
        break
      case 'engagement':
        // Order by total engagement (likes + retweets + replies)
        orderBy = [
          { likes: 'desc' },
          { retweets: 'desc' },
          { replies: 'desc' },
          { submittedAt: 'desc' } // Secondary sort by date
        ]
        break
      case 'recent':
      default:
        orderBy = { submittedAt: 'desc' }
        break
    }

    // Build where clause for search
    const whereClause: any = {}
    if (search.trim()) {
      whereClause.OR = [
        {
          content: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            xUsername: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    console.log(`🔍 Fetching recent tweets: limit=${validatedLimit}, offset=${validatedOffset}, sortBy=${sortBy}, search="${search}"`)

    // Fetch tweets with optimized query
    const [tweets, totalCount] = await Promise.all([
      prisma.tweet.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              xUsername: true,
              image: true,
            },
          },
        },
        orderBy,
        take: validatedLimit,
        skip: validatedOffset,
      }),
      // Get total count for pagination
      prisma.tweet.count({
        where: whereClause,
      })
    ])

    console.log(`📊 Found ${tweets.length} tweets (${totalCount} total)`)

    // Add computed fields for better frontend handling
    const enhancedTweets = tweets.map(tweet => ({
      ...tweet,
      totalEngagement: tweet.likes + tweet.retweets + tweet.replies,
      // Ensure dates are properly serialized
      createdAt: tweet.createdAt.toISOString(),
      submittedAt: tweet.submittedAt?.toISOString() || tweet.createdAt.toISOString(),
      lastEngagementUpdate: tweet.lastEngagementUpdate?.toISOString() || null,
      // Add display-friendly date
      displayDate: (tweet.originalTweetDate || tweet.submittedAt || tweet.createdAt).toISOString(),
    }))

    return NextResponse.json({
      success: true,
      tweets: enhancedTweets,
      pagination: {
        total: totalCount,
        limit: validatedLimit,
        offset: validatedOffset,
        hasMore: validatedOffset + validatedLimit < totalCount,
        page: Math.floor(validatedOffset / validatedLimit) + 1,
        totalPages: Math.ceil(totalCount / validatedLimit)
      },
      meta: {
        sortBy,
        search: search || null,
        timestamp: new Date().toISOString(),
        source: 'community-feed' // Indicates this is from our community database
      }
    })
  } catch (error) {
    console.error('❌ Error fetching recent tweets:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch tweets',
        message: 'An error occurred while fetching tweets from the database',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Health check endpoint for the recent tweets API
 */
export async function HEAD(request: NextRequest) {
  try {
    // Quick database connectivity check
    const count = await prisma.tweet.count()
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'X-Tweet-Count': count.toString(),
        'X-API-Status': 'healthy'
      }
    })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}
