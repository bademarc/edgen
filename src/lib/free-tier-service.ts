import { getCacheService } from './cache'
import { getBudgetDbService } from './db-budget'
import { getBudgetScrapingService } from './budget-scraper'

interface FreeTierConfig {
  maxCacheCommands: number
  maxDbConnections: number
  cacheTTL: number
  enableRealTime: boolean
  enableAnalytics: boolean
}

class FreeTierService {
  private cache = getCacheService()
  private db = getBudgetDbService()
  private scraper = getBudgetScrapingService()
  private config: FreeTierConfig
  private dailyStats = {
    cacheCommands: 0,
    dbQueries: 0,
    apiCalls: 0,
    scrapingRequests: 0
  }

  constructor() {
    this.config = {
      maxCacheCommands: parseInt(process.env.MAX_CACHE_COMMANDS_PER_DAY || '9000'),
      maxDbConnections: parseInt(process.env.MAX_DATABASE_CONNECTIONS || '10'),
      cacheTTL: parseInt(process.env.CACHE_TTL_SECONDS || '1800'), // 30 minutes
      enableRealTime: process.env.ENABLE_REAL_TIME_UPDATES === 'true',
      enableAnalytics: process.env.ENABLE_ANALYTICS === 'true'
    }

    // Reset daily stats at midnight
    this.scheduleStatsReset()
  }

  /**
   * Smart leaderboard with aggressive caching
   */
  async getLeaderboard(limit: number = 100): Promise<any[]> {
    const cacheKey = `leaderboard:${limit}`
    
    // Try cache first (30 minute TTL for free tier)
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      console.log('📋 Returning cached leaderboard (FREE TIER)')
      return cached
    }

    // If cache miss, get from database
    console.log('🔍 Fetching leaderboard from database (FREE TIER)')
    this.dailyStats.dbQueries++
    
    const leaderboard = await this.db.getLeaderboard(limit, false) // Don't double-cache
    
    // Cache for 30 minutes
    await this.cache.set(cacheKey, leaderboard, this.config.cacheTTL)
    
    return leaderboard
  }

  /**
   * Ultra-efficient user lookup
   */
  async getUser(userId: string): Promise<any | null> {
    const cacheKey = `user:${userId}`
    
    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      console.log(`👤 Returning cached user ${userId} (FREE TIER)`)
      return cached
    }

    // Database lookup with minimal data
    console.log(`🔍 Fetching user ${userId} from database (FREE TIER)`)
    this.dailyStats.dbQueries++
    
    const user = await this.db.getUserById(userId, false) // Don't double-cache
    
    if (user) {
      // Cache for 30 minutes
      await this.cache.set(cacheKey, user, this.config.cacheTTL)
    }
    
    return user
  }

  /**
   * Batch tweet processing for efficiency
   */
  async processTweetBatch(tweetUrls: string[]): Promise<any[]> {
    console.log(`🔄 Processing ${tweetUrls.length} tweets in batch (FREE TIER)`)
    
    const results: any[] = []
    
    // Process in smaller chunks for free tier
    const chunkSize = 3 // Smaller chunks to avoid overwhelming free services
    const chunks = this.chunkArray(tweetUrls, chunkSize)
    
    for (const chunk of chunks) {
      // Check cache for each tweet first
      const cachedResults = await Promise.all(
        chunk.map(url => this.cache.get(`tweet:${this.hashUrl(url)}`))
      )
      
      // Only scrape uncached tweets
      const uncachedUrls = chunk.filter((url, index) => !cachedResults[index])
      
      if (uncachedUrls.length > 0) {
        console.log(`🕷️ Scraping ${uncachedUrls.length} uncached tweets`)
        this.dailyStats.scrapingRequests += uncachedUrls.length
        
        const scrapedResults = await this.scraper.batchScrape(uncachedUrls)
        
        // Cache scraped results
        for (let i = 0; i < uncachedUrls.length; i++) {
          const url = uncachedUrls[i]
          const result = scrapedResults[i]
          
          if (result.success) {
            await this.cache.set(`tweet:${this.hashUrl(url)}`, result.data, this.config.cacheTTL)
          }
        }
        
        // Merge cached and scraped results
        let scrapedIndex = 0
        for (let i = 0; i < chunk.length; i++) {
          if (cachedResults[i]) {
            results.push(cachedResults[i])
          } else {
            results.push(scrapedResults[scrapedIndex]?.data || null)
            scrapedIndex++
          }
        }
      } else {
        // All tweets were cached
        results.push(...cachedResults)
      }
      
      // Delay between chunks to avoid rate limiting
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay
      }
    }
    
    return results
  }

  /**
   * Minimal analytics for free tier
   */
  async getBasicStats(): Promise<any> {
    if (!this.config.enableAnalytics) {
      return { message: 'Analytics disabled for free tier' }
    }

    const cacheKey = 'basic_stats'
    
    // Check cache (1 hour TTL)
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Very basic stats to minimize DB load
    this.dailyStats.dbQueries++
    
    const stats = {
      dailyUsage: this.dailyStats,
      cacheEfficiency: this.calculateCacheEfficiency(),
      timestamp: new Date().toISOString()
    }
    
    // Cache for 1 hour
    await this.cache.set(cacheKey, stats, 3600)
    
    return stats
  }

  /**
   * Resource monitoring for free tier
   */
  async checkResourceUsage(): Promise<{
    status: 'ok' | 'warning' | 'critical'
    details: any
  }> {
    const cacheUsage = (this.dailyStats.cacheCommands / this.config.maxCacheCommands) * 100
    const dbUsage = (this.dailyStats.dbQueries / 1000) * 100 // Assume 1000 queries/day limit
    
    let status: 'ok' | 'warning' | 'critical' = 'ok'
    
    if (cacheUsage > 90 || dbUsage > 90) {
      status = 'critical'
    } else if (cacheUsage > 70 || dbUsage > 70) {
      status = 'warning'
    }
    
    return {
      status,
      details: {
        cacheUsage: `${cacheUsage.toFixed(1)}%`,
        dbUsage: `${dbUsage.toFixed(1)}%`,
        dailyStats: this.dailyStats,
        limits: {
          maxCacheCommands: this.config.maxCacheCommands,
          estimatedDbLimit: 1000
        }
      }
    }
  }

  /**
   * Emergency mode - disable non-essential features
   */
  async enableEmergencyMode(): Promise<void> {
    console.log('🚨 Enabling emergency mode for free tier')
    
    // Disable real-time features
    this.config.enableRealTime = false
    this.config.enableAnalytics = false
    
    // Increase cache TTL to reduce cache commands
    this.config.cacheTTL = 3600 // 1 hour
    
    // Clear non-essential cache entries
    // Note: This would require implementing cache pattern matching
    console.log('🧹 Emergency mode enabled - non-essential features disabled')
  }

  /**
   * Utility functions
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private hashUrl(url: string): string {
    let hash = 0
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString()
  }

  private calculateCacheEfficiency(): number {
    // Simple cache hit rate calculation
    const totalRequests = this.dailyStats.cacheCommands + this.dailyStats.dbQueries
    if (totalRequests === 0) return 0
    
    return ((this.dailyStats.cacheCommands / totalRequests) * 100)
  }

  private scheduleStatsReset(): void {
    // Reset stats at midnight
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime()
    
    setTimeout(() => {
      this.dailyStats = {
        cacheCommands: 0,
        dbQueries: 0,
        apiCalls: 0,
        scrapingRequests: 0
      }
      
      console.log('📊 Daily stats reset for free tier')
      
      // Schedule next reset
      setInterval(() => {
        this.dailyStats = {
          cacheCommands: 0,
          dbQueries: 0,
          apiCalls: 0,
          scrapingRequests: 0
        }
      }, 24 * 60 * 60 * 1000) // Every 24 hours
      
    }, msUntilMidnight)
  }

  /**
   * Health check for free tier
   */
  async healthCheck(): Promise<boolean> {
    try {
      const [cacheHealth, dbHealth, scraperHealth] = await Promise.all([
        this.cache.healthCheck(),
        this.db.healthCheck(),
        this.scraper.healthCheck()
      ])
      
      return cacheHealth && dbHealth && scraperHealth
    } catch {
      return false
    }
  }
}

// Singleton instance
let freeTierService: FreeTierService | null = null

export function getFreeTierService(): FreeTierService {
  if (!freeTierService) {
    freeTierService = new FreeTierService()
  }
  return freeTierService
}

export { FreeTierService }
