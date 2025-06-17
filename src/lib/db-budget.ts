import { PrismaClient } from '@prisma/client'
import { getCacheService } from './cache'

// Budget-friendly database optimization
class BudgetDatabaseService {
  private prisma: PrismaClient
  private cache = getCacheService()

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error'], // Minimal logging to reduce overhead
    })
  }

  /**
   * Aggressive caching for leaderboard (update every 15 minutes)
   */
  async getLeaderboard(limit: number = 100, updateRanks: boolean = true): Promise<any[]> {
    const cacheKey = `leaderboard:${limit}`

    // Try cache first (15 minute TTL)
    const cached = await this.cache.get<any[]>(cacheKey)
    if (cached) {
      console.log('📋 Returning cached leaderboard (15min cache)')
      return cached
    }

    // Optimized query with minimal data including tweet count
    const users = await this.prisma.user.findMany({
      where: { totalPoints: { gt: 0 } },
      select: {
        id: true,
        name: true,
        xUsername: true,
        image: true,
        totalPoints: true,
        _count: {
          select: { tweets: true }
        }
      },
      orderBy: { totalPoints: 'desc' },
      take: limit,
    })

    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
      tweetsCount: user._count.tweets,
      averagePointsPerTweet: user._count.tweets > 0 ? Math.round(user.totalPoints / user._count.tweets) : 0,
    }))

    // Update ranks in database for dashboard synchronization
    if (updateRanks && leaderboard.length > 0) {
      console.log('🔄 Updating user ranks in database for dashboard sync')
      try {
        // Batch update ranks efficiently
        await this.batchUpdateRanks(leaderboard)
      } catch (error) {
        console.error('❌ Failed to update ranks:', error)
        // Continue without failing the leaderboard request
      }
    }

    // Cache for 15 minutes
    await this.cache.set(cacheKey, leaderboard, 900)
    return leaderboard
  }

  /**
   * Batch operations to reduce database calls
   */
  async batchUpdatePoints(updates: Array<{ userId: string; points: number }>): Promise<void> {
    // Group updates to reduce transactions
    const chunks = this.chunkArray(updates, 50) // Process 50 at a time

    for (const chunk of chunks) {
      await this.prisma.$transaction(async (tx) => {
        const promises = chunk.map(({ userId, points }) =>
          tx.user.update({
            where: { id: userId },
            data: { totalPoints: { increment: points } },
            select: { id: true } // Minimal select to reduce data transfer
          })
        )
        await Promise.all(promises)
      })
    }

    // Invalidate leaderboard cache
    await this.cache.del('leaderboard:100')
  }

  /**
   * Batch update user ranks efficiently
   */
  async batchUpdateRanks(leaderboard: Array<{ id: string; rank: number }>): Promise<void> {
    // Group updates to reduce transactions
    const chunks = this.chunkArray(leaderboard, 50) // Process 50 at a time

    for (const chunk of chunks) {
      await this.prisma.$transaction(async (tx) => {
        const promises = chunk.map(({ id, rank }) =>
          tx.user.update({
            where: { id },
            data: { rank },
            select: { id: true } // Minimal select to reduce data transfer
          })
        )
        await Promise.all(promises)
      })
    }

    // Invalidate user cache for affected users
    const userCacheKeys = leaderboard.map(user => `user:${user.id}`)
    await Promise.allSettled(userCacheKeys.map(key => this.cache.del(key)))
  }

  /**
   * Lazy loading with pagination
   */
  async getUserTweets(userId: string, page: number = 1, limit: number = 10): Promise<any> {
    const cacheKey = `user_tweets:${userId}:${page}:${limit}`
    
    // Check cache (5 minute TTL)
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    const skip = (page - 1) * limit
    
    const [tweets, total] = await Promise.all([
      this.prisma.tweet.findMany({
        where: { userId },
        select: {
          id: true,
          url: true,
          content: true,
          likes: true,
          retweets: true,
          replies: true,
          totalPoints: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tweet.count({ where: { userId } })
    ])

    const result = {
      tweets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    }

    // Cache for 5 minutes
    await this.cache.set(cacheKey, result, 300)
    return result
  }

  /**
   * Efficient user lookup with caching
   */
  async getUserById(userId: string, useCache: boolean = true): Promise<any | null> {
    const cacheKey = `user:${userId}`

    // Check cache (10 minute TTL)
    if (useCache) {
      const cached = await this.cache.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        xUsername: true,
        image: true,
        totalPoints: true,
        rank: true, // Include rank field for dashboard
        joinDate: true,
        autoMonitoringEnabled: true,
        _count: {
          select: { tweets: true }
        }
      },
    })

    if (user && useCache) {
      // Cache for 10 minutes
      await this.cache.set(cacheKey, user, 600)
    }

    return user
  }

  /**
   * Background job for cache warming (run every hour)
   */
  async warmCache(): Promise<void> {
    console.log('🔥 Warming cache...')
    
    try {
      // Pre-load top 100 leaderboard
      await this.getLeaderboard(100)
      
      // Pre-load top users
      const topUsers = await this.prisma.user.findMany({
        where: { totalPoints: { gt: 0 } },
        select: { id: true },
        orderBy: { totalPoints: 'desc' },
        take: 50,
      })

      // Cache top users in background
      const promises = topUsers.map(user => this.getUserById(user.id))
      await Promise.allSettled(promises)
      
      console.log('✅ Cache warming completed')
    } catch (error) {
      console.error('❌ Cache warming failed:', error)
    }
  }

  /**
   * Database cleanup (run daily)
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Running database cleanup...')
    
    try {
      // Clean old verification tokens
      await this.prisma.verificationToken.deleteMany({
        where: {
          expires: { lt: new Date() }
        }
      })

      // Clean old sessions
      await this.prisma.session.deleteMany({
        where: {
          expires: { lt: new Date() }
        }
      })

      console.log('✅ Database cleanup completed')
    } catch (error) {
      console.error('❌ Database cleanup failed:', error)
    }
  }

  /**
   * Get analytics with heavy caching
   */
  async getAnalytics(): Promise<any> {
    const cacheKey = 'analytics:daily'
    
    // Check cache (1 hour TTL)
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [totalUsers, totalTweets, totalPoints, newUsers, newTweets] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.tweet.count(),
      this.prisma.tweet.aggregate({ _sum: { totalPoints: true } }),
      this.prisma.user.count({ where: { joinDate: { gte: yesterday } } }),
      this.prisma.tweet.count({ where: { createdAt: { gte: yesterday } } }),
    ])

    const analytics = {
      totalUsers,
      totalTweets,
      totalPoints: totalPoints._sum.totalPoints || 0,
      newUsers,
      newTweets,
      generatedAt: now,
    }

    // Cache for 1 hour
    await this.cache.set(cacheKey, analytics, 3600)
    return analytics
  }

  /**
   * Utility: Chunk array
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }

  /**
   * Cleanup connections
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }

  /**
   * Public method to delete cache entries
   */
  async deleteCacheEntry(key: string): Promise<void> {
    await this.cache.delete(key)
  }

  /**
   * Public method to clear leaderboard cache
   */
  async clearLeaderboardCache(limit?: number): Promise<void> {
    if (limit) {
      await this.cache.delete(`leaderboard:${limit}`)
    } else {
      await this.cache.delete('leaderboard:top100')
    }
  }
}

// Singleton instance
let budgetDbService: BudgetDatabaseService | null = null

export function getBudgetDbService(): BudgetDatabaseService {
  if (!budgetDbService) {
    budgetDbService = new BudgetDatabaseService()
  }
  return budgetDbService
}

export { BudgetDatabaseService }
