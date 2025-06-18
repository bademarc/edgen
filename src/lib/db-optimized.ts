import { PrismaClient } from '@prisma/client'
import { getCacheService } from './cache'

// Enhanced Prisma configuration for high-load scenarios
const createOptimizedPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'minimal',
    // PRODUCTION FIX: Connection pool optimization for 100k users
    __internal: {
      engine: {
        connectionLimit: 100, // Increase connection pool
        poolTimeout: 10000,   // 10 second timeout
        transactionOptions: {
          maxWait: 5000,      // 5 second max wait
          timeout: 10000,     // 10 second timeout
        },
      },
    },
  })
}

class DatabaseService {
  private prisma: PrismaClient
  private cache = getCacheService()
  private connectionPool: Map<string, PrismaClient> = new Map()

  constructor() {
    this.prisma = createOptimizedPrismaClient()
    this.setupConnectionPool()
  }

  private setupConnectionPool() {
    // Create multiple Prisma instances for different operations
    this.connectionPool.set('read', createOptimizedPrismaClient())
    this.connectionPool.set('write', createOptimizedPrismaClient())
    this.connectionPool.set('analytics', createOptimizedPrismaClient())
  }

  // Get appropriate connection for operation type
  private getConnection(type: 'read' | 'write' | 'analytics' = 'read'): PrismaClient {
    return this.connectionPool.get(type) || this.prisma
  }

  // Cached leaderboard query
  async getLeaderboard(limit: number = 100, useCache: boolean = true): Promise<any[]> {
    const cacheKey = `leaderboard:${limit}`

    if (useCache) {
      const cached = await this.cache.getLeaderboard()
      if (cached && Array.isArray(cached)) {
        console.log('📋 Returning cached leaderboard')
        return cached.slice(0, limit)
      }
    }

    console.log('🔍 Fetching fresh leaderboard from database')
    const readDb = this.getConnection('read')

    const users = await readDb.user.findMany({
      where: {
        totalPoints: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        xUsername: true,
        image: true,
        totalPoints: true,
        _count: {
          select: { tweets: true },
        },
      },
      orderBy: [
        { totalPoints: 'desc' },
        { joinDate: 'asc' },
      ],
      take: limit,
    })

    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
      tweetsCount: user._count.tweets,
    }))

    // Cache for 5 minutes
    if (useCache) {
      await this.cache.cacheLeaderboard(leaderboard, 300)
    }

    return leaderboard
  }

  // Cached user lookup
  async getUserById(userId: string, useCache: boolean = true): Promise<any | null> {
    if (useCache) {
      const cached = await this.cache.getUser(userId)
      if (cached) {
        console.log(`👤 Returning cached user ${userId}`)
        return cached
      }
    }

    console.log(`🔍 Fetching user ${userId} from database`)
    const readDb = this.getConnection('read')

    const user = await readDb.user.findUnique({
      where: { id: userId },
      include: {
        tweets: {
          select: {
            id: true,
            totalPoints: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { tweets: true },
        },
      },
    })

    if (user && useCache) {
      await this.cache.cacheUser(userId, user, 600) // Cache for 10 minutes
    }

    return user
  }

  // Batch user updates for better performance
  async batchUpdateUserPoints(updates: Array<{ userId: string; points: number }>): Promise<void> {
    const writeDb = this.getConnection('write')

    // Use transaction for consistency
    await writeDb.$transaction(async (tx) => {
      const promises = updates.map(({ userId, points }) =>
        tx.user.update({
          where: { id: userId },
          data: { totalPoints: { increment: points } },
        })
      )

      await Promise.all(promises)
    })

    // Invalidate cache for updated users
    const cachePromises = updates.map(({ userId }) =>
      this.cache.del(`user:${userId}`)
    )
    await Promise.all(cachePromises)

    // Invalidate leaderboard cache
    await this.cache.del('leaderboard:top100')
  }

  // Optimized tweet creation with caching
  async createTweet(tweetData: any): Promise<any> {
    const writeDb = this.getConnection('write')

    const tweet = await writeDb.tweet.create({
      data: tweetData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            xUsername: true,
          },
        },
      },
    })

    // Update user points in the same transaction
    await writeDb.user.update({
      where: { id: tweetData.userId },
      data: { totalPoints: { increment: tweetData.totalPoints } },
    })

    // Invalidate relevant caches
    await Promise.all([
      this.cache.del(`user:${tweetData.userId}`),
      this.cache.del('leaderboard:top100'),
    ])

    return tweet
  }

  // Analytics queries with separate connection
  async getAnalytics(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    const analyticsDb = this.getConnection('analytics')
    const cacheKey = `analytics:${timeframe}`

    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    const [userCount, tweetCount, totalPoints] = await Promise.all([
      analyticsDb.user.count({
        where: { joinDate: { gte: startDate } },
      }),
      analyticsDb.tweet.count({
        where: { createdAt: { gte: startDate } },
      }),
      analyticsDb.tweet.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { totalPoints: true },
      }),
    ])

    const analytics = {
      timeframe,
      newUsers: userCount,
      newTweets: tweetCount,
      totalPointsAwarded: totalPoints._sum.totalPoints || 0,
      generatedAt: now,
    }

    // Cache analytics for appropriate duration
    const cacheDuration = timeframe === 'day' ? 300 : timeframe === 'week' ? 1800 : 3600
    await this.cache.set(cacheKey, analytics, cacheDuration)

    return analytics
  }

  // Health check for database connections
  async healthCheck(): Promise<{
    main: boolean
    read: boolean
    write: boolean
    analytics: boolean
  }> {
    const checks = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.getConnection('read').$queryRaw`SELECT 1`,
      this.getConnection('write').$queryRaw`SELECT 1`,
      this.getConnection('analytics').$queryRaw`SELECT 1`,
    ])

    return {
      main: checks[0].status === 'fulfilled',
      read: checks[1].status === 'fulfilled',
      write: checks[2].status === 'fulfilled',
      analytics: checks[3].status === 'fulfilled',
    }
  }

  // Cleanup connections
  async disconnect(): Promise<void> {
    await Promise.all([
      this.prisma.$disconnect(),
      ...Array.from(this.connectionPool.values()).map(client => client.$disconnect()),
    ])
  }
}

// Singleton instance
let dbService: DatabaseService | null = null

export function getOptimizedDbService(): DatabaseService {
  if (!dbService) {
    dbService = new DatabaseService()
  }
  return dbService
}

export { DatabaseService }
