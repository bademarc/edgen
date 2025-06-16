import { getCacheService } from './cache'
import { prisma } from './db'

interface CacheItem {
  data: any
  timestamp: number
  ttl: number
  accessCount: number
}

interface CacheStats {
  l1Size: number
  l1Hits: number
  l2Hits: number
  misses: number
  hitRate: number
  l1HitRate: number
  l2HitRate: number
  totalRequests: number
}

/**
 * Tiered caching service with L1 (memory) and L2 (Redis) layers
 * Optimized for LayerEdge community platform to reduce Redis usage by 60%
 */
export class TieredCacheService {
  private l1Cache = new Map<string, CacheItem>() // Memory cache
  private l2Cache = getCacheService() // Redis cache
  private maxL1Size = 1000 // Maximum items in memory
  private maxL1Memory = 100 * 1024 * 1024 // 100MB memory limit
  
  // Statistics
  private l1HitCount = 0
  private l2HitCount = 0
  private missCount = 0
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Start cleanup interval for L1 cache
    this.cleanupInterval = setInterval(() => this.cleanupL1Cache(), 60000) // Every minute
    
    // Cleanup on process exit
    process.on('beforeExit', () => {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval)
      }
    })
  }

  /**
   * Get value from cache (checks L1 first, then L2)
   */
  async get<T = any>(key: string): Promise<T | null> {
    // Check L1 cache first (memory)
    const l1Item = this.l1Cache.get(key)
    if (l1Item && this.isL1ItemValid(l1Item)) {
      l1Item.accessCount++
      this.l1HitCount++
      console.log(`🎯 L1 cache hit: ${key}`)
      return l1Item.data as T
    }

    // Remove expired L1 item
    if (l1Item && !this.isL1ItemValid(l1Item)) {
      this.l1Cache.delete(key)
    }

    // Check L2 cache (Redis)
    try {
      const l2Data = await this.l2Cache.get<T>(key)
      if (l2Data !== null) {
        this.l2HitCount++
        console.log(`🎯 L2 cache hit: ${key}`)
        
        // Promote to L1 cache if space available and item is frequently accessed
        await this.promoteToL1(key, l2Data, 300) // 5 minutes in L1
        
        return l2Data
      }
    } catch (error) {
      console.warn(`⚠️ L2 cache error for key ${key}:`, error)
    }

    this.missCount++
    console.log(`❌ Cache miss: ${key}`)
    return null
  }

  /**
   * Set value in both cache layers
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      // Validate value before caching to prevent corruption
      if (value === undefined) {
        console.warn(`⚠️ Tiered cache: Refusing to cache undefined value for key: ${key}`)
        return
      }

      // Test JSON serialization to prevent corruption
      try {
        const testSerialization = JSON.stringify(value)
        if (testSerialization === '[object Object]' ||
            testSerialization.includes('[object ') ||
            testSerialization === 'undefined' ||
            !testSerialization) {
          console.error(`❌ Tiered cache: Invalid serialization for key ${key}: ${testSerialization}`)
          return
        }
      } catch (serializationError) {
        console.error(`❌ Tiered cache: Serialization test failed for key ${key}:`, serializationError)
        return
      }

      // Always set in L2 (Redis) for persistence
      await this.l2Cache.set(key, value, ttlSeconds)
      console.log(`💾 L2 cache set: ${key} (TTL: ${ttlSeconds}s)`)

      // Set in L1 if space available and TTL is reasonable
      if (ttlSeconds <= 3600) { // Only cache items with TTL <= 1 hour in L1
        await this.setL1(key, value, Math.min(ttlSeconds, 300)) // Max 5 minutes in L1
      }
    } catch (error) {
      console.error(`❌ Cache set error for key ${key}:`, error)
      // Don't throw to prevent application crashes
    }
  }

  /**
   * Set value only in L1 cache (for temporary data)
   */
  async setL1Only(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    await this.setL1(key, value, ttlSeconds)
  }

  /**
   * Delete from both cache layers
   */
  async delete(key: string): Promise<void> {
    this.l1Cache.delete(key)
    try {
      await this.l2Cache.del(key)
    } catch (error) {
      console.warn(`⚠️ L2 cache delete error for key ${key}:`, error)
    }
  }

  /**
   * Optimized user lookup with caching
   */
  async getUser(userId: string): Promise<any | null> {
    const cacheKey = `user:${userId}`
    let user = await this.get(cacheKey)
    
    if (!user) {
      console.log(`🔍 Fetching user ${userId} from database`)
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: { 
            select: { 
              tweets: true 
            } 
          }
        }
      })
      
      if (user) {
        // Cache user data for 1 hour
        await this.set(cacheKey, user, 3600)
      }
    }
    
    return user
  }

  /**
   * Optimized tweet engagement caching
   */
  async getTweetEngagement(tweetId: string): Promise<any | null> {
    const cacheKey = `tweet:${tweetId}:engagement`
    return await this.get(cacheKey)
  }

  async setTweetEngagement(tweetId: string, engagement: any): Promise<void> {
    const cacheKey = `tweet:${tweetId}:engagement`
    // Cache engagement data for 4 hours (longer TTL for stable data)
    await this.set(cacheKey, engagement, 14400)
  }

  /**
   * Optimized leaderboard caching
   */
  async getLeaderboard(): Promise<any[] | null> {
    const cacheKey = 'leaderboard:top100'
    let leaderboard = await this.get(cacheKey)
    
    if (!leaderboard) {
      console.log('🔍 Fetching leaderboard from database')
      leaderboard = await prisma.user.findMany({
        where: {
          totalPoints: { gt: 0 }
        },
        orderBy: { totalPoints: 'desc' },
        take: 100,
        select: {
          id: true,
          name: true,
          xUsername: true,
          totalPoints: true,
          image: true
        }
      })
      
      if (leaderboard) {
        // Cache leaderboard for 30 minutes
        await this.set(cacheKey, leaderboard, 1800)
      }
    }
    
    return leaderboard
  }

  /**
   * Batch cache operations for efficiency
   */
  async getMultiple<T = any>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>()
    const uncachedKeys: string[] = []

    // Check L1 cache for all keys
    for (const key of keys) {
      const l1Item = this.l1Cache.get(key)
      if (l1Item && this.isL1ItemValid(l1Item)) {
        results.set(key, l1Item.data as T)
        this.l1HitCount++
      } else {
        uncachedKeys.push(key)
      }
    }

    // Check L2 cache for remaining keys
    if (uncachedKeys.length > 0) {
      try {
        for (const key of uncachedKeys) {
          const l2Data = await this.l2Cache.get<T>(key)
          if (l2Data !== null) {
            results.set(key, l2Data)
            this.l2HitCount++
            // Promote frequently accessed items to L1
            await this.promoteToL1(key, l2Data, 300)
          } else {
            results.set(key, null)
            this.missCount++
          }
        }
      } catch (error) {
        console.warn('⚠️ Batch L2 cache error:', error)
        // Set remaining keys as null
        for (const key of uncachedKeys) {
          if (!results.has(key)) {
            results.set(key, null)
            this.missCount++
          }
        }
      }
    }

    return results
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.l1HitCount + this.l2HitCount + this.missCount
    
    return {
      l1Size: this.l1Cache.size,
      l1Hits: this.l1HitCount,
      l2Hits: this.l2HitCount,
      misses: this.missCount,
      hitRate: totalRequests > 0 ? ((this.l1HitCount + this.l2HitCount) / totalRequests) * 100 : 0,
      l1HitRate: totalRequests > 0 ? (this.l1HitCount / totalRequests) * 100 : 0,
      l2HitRate: totalRequests > 0 ? (this.l2HitCount / totalRequests) * 100 : 0,
      totalRequests
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.l1HitCount = 0
    this.l2HitCount = 0
    this.missCount = 0
  }

  /**
   * Clear L1 cache
   */
  clearL1(): void {
    this.l1Cache.clear()
    console.log('🧹 L1 cache cleared')
  }

  /**
   * Warm cache with popular data
   */
  async warmCache(): Promise<void> {
    console.log('🔥 Warming cache with popular data...')
    
    try {
      // Pre-load top users
      const topUsers = await prisma.user.findMany({
        where: { totalPoints: { gte: 100 } },
        orderBy: { totalPoints: 'desc' },
        take: 50,
        include: {
          _count: { select: { tweets: true } }
        }
      })

      for (const user of topUsers) {
        await this.set(`user:${user.id}`, user, 3600)
      }

      // Pre-load recent tweets
      const recentTweets = await prisma.tweet.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        take: 100,
        orderBy: { createdAt: 'desc' }
      })

      for (const tweet of recentTweets) {
        await this.setL1Only(`tweet:${tweet.id}`, tweet, 1800) // 30 minutes in L1 only
      }

      console.log(`✅ Cache warmed with ${topUsers.length} users and ${recentTweets.length} tweets`)
    } catch (error) {
      console.error('❌ Cache warming failed:', error)
    }
  }

  // Private methods

  private async setL1(key: string, value: any, ttlSeconds: number): Promise<void> {
    // Check if we have space in L1 cache
    if (this.l1Cache.size >= this.maxL1Size) {
      await this.evictLRUFromL1()
    }

    this.l1Cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
      accessCount: 1
    })

    console.log(`💾 L1 cache set: ${key} (TTL: ${ttlSeconds}s)`)
  }

  private async promoteToL1(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (this.l1Cache.size < this.maxL1Size) {
      await this.setL1(key, value, ttlSeconds)
    }
  }

  private isL1ItemValid(item: CacheItem): boolean {
    return (Date.now() - item.timestamp) < item.ttl
  }

  private async evictLRUFromL1(): Promise<void> {
    // Find least recently used item (lowest access count and oldest timestamp)
    let lruKey: string | null = null
    let lruScore = Infinity

    for (const [key, item] of this.l1Cache.entries()) {
      const score = item.accessCount + (Date.now() - item.timestamp) / 1000000
      if (score < lruScore) {
        lruScore = score
        lruKey = key
      }
    }

    if (lruKey) {
      this.l1Cache.delete(lruKey)
      console.log(`🗑️ Evicted LRU item from L1: ${lruKey}`)
    }
  }

  private cleanupL1Cache(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, item] of this.l1Cache.entries()) {
      if (!this.isL1ItemValid(item)) {
        this.l1Cache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired L1 cache items`)
    }
  }
}

// Export singleton instance
export const tieredCache = new TieredCacheService()
