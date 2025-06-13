import Redis from 'ioredis'
import { Redis as UpstashRedis } from '@upstash/redis'

interface CacheConfig {
  host: string
  port: number
  password?: string
  db?: number
  retryDelayOnFailover?: number
  maxRetriesPerRequest?: number
  tls?: any
  family?: number
  connectTimeout?: number
  lazyConnect?: boolean
}

interface MemoryCacheEntry {
  value: any
  expiry: number
}

export class SimplifiedCacheService {
  private redis: Redis | null = null
  private upstashRedis: UpstashRedis | null = null
  private useUpstash: boolean = false
  private isEnabled: boolean = false
  private useMemoryFallback: boolean = false
  private memoryCache: Map<string, MemoryCacheEntry> = new Map()
  private commandCount: number = 0
  private dailyLimit: number = 10000

  constructor() {
    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      // Check for Upstash configuration first
      const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
      const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

      if (upstashUrl && upstashToken) {
        console.log('🔗 Initializing Upstash Redis')
        this.upstashRedis = new UpstashRedis({
          url: upstashUrl,
          token: upstashToken,
        })
        this.useUpstash = true
        console.log('✅ Upstash Redis initialized')
      } else {
        // Fallback to traditional Redis
        const config: CacheConfig = {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0'),
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
          family: 4,
          connectTimeout: 10000,
          lazyConnect: false
        }

        console.log('🔗 Initializing traditional Redis')
        this.redis = new Redis(config)
        console.log('✅ Traditional Redis initialized')
      }

      this.isEnabled = true

      // Set up event handlers for traditional Redis
      if (this.redis && !this.useUpstash) {
        this.redis.on('error', (error) => {
          console.error('❌ Redis connection error:', error)
          this.isEnabled = false
        })

        this.redis.on('connect', () => {
          console.log('✅ Redis cache connected')
          this.isEnabled = true
        })

        this.redis.on('ready', () => {
          console.log('✅ Redis cache ready')
          this.isEnabled = true
        })
      }

    } catch (error) {
      console.error('⚠️ Redis cache initialization failed:', error)
      console.log('🔄 Enabling memory cache fallback...')
      this.useMemoryFallback = true
      this.isEnabled = true
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isEnabled) {
      return null
    }

    // Use memory cache if fallback is enabled
    if (this.useMemoryFallback) {
      const cached = this.memoryCache.get(key)
      if (cached && cached.expiry > Date.now()) {
        return cached.value as T
      }
      return null
    }

    try {
      let value: string | null = null

      if (this.useUpstash && this.upstashRedis) {
        const rawValue = await this.upstashRedis.get(key)
        this.commandCount++
        
        if (rawValue !== null) {
          // Simple type handling - convert to string if needed
          value = typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue)
          
          // Basic corruption check
          if (value === '[object Object]' || value === 'undefined') {
            await this.upstashRedis.del(key)
            return null
          }
        }
      } else if (this.redis) {
        value = await this.redis.get(key)
      } else {
        this.useMemoryFallback = true
        return this.get(key)
      }

      if (!value) {
        return null
      }

      // Simple JSON parsing with error handling
      try {
        return JSON.parse(value)
      } catch (parseError) {
        console.error(`❌ JSON parse error for key ${key}:`, parseError)
        await this.delete(key)
        return null
      }
    } catch (error) {
      console.error('❌ Cache get error for key:', key, 'Error:', error)
      this.useMemoryFallback = true
      return this.get(key)
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.isEnabled) {
      return false
    }

    // Use memory cache if fallback is enabled
    if (this.useMemoryFallback) {
      const expiry = Date.now() + (ttlSeconds * 1000)
      this.memoryCache.set(key, { value, expiry })
      
      // Clean up if cache gets too large
      if (this.memoryCache.size > 1000) {
        this.cleanupMemoryCache()
      }
      
      return true
    }

    // Check daily limit for Upstash
    if (this.useUpstash && this.commandCount >= this.dailyLimit) {
      this.useMemoryFallback = true
      return this.set(key, value, ttlSeconds)
    }

    try {
      // Simple serialization
      let serializedValue: string
      
      if (value === null) {
        serializedValue = 'null'
      } else if (value === undefined) {
        return false // Don't cache undefined values
      } else {
        serializedValue = JSON.stringify(value)
      }

      // Basic validation
      if (serializedValue === '[object Object]' || serializedValue === 'undefined') {
        console.error(`❌ Invalid serialization for key ${key}: ${serializedValue}`)
        return false
      }

      if (this.useUpstash && this.upstashRedis) {
        await this.upstashRedis.setex(key, ttlSeconds, serializedValue)
        this.commandCount++
      } else if (this.redis) {
        await this.redis.setex(key, ttlSeconds, serializedValue)
      } else {
        this.useMemoryFallback = true
        return this.set(key, value, ttlSeconds)
      }
      
      return true
    } catch (error) {
      console.error('❌ Cache set error for key:', key, 'Error:', error)
      this.useMemoryFallback = true
      return this.set(key, value, ttlSeconds)
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isEnabled) {
      return false
    }

    if (this.useMemoryFallback) {
      return this.memoryCache.delete(key)
    }

    try {
      if (this.useUpstash && this.upstashRedis) {
        await this.upstashRedis.del(key)
        this.commandCount++
      } else if (this.redis) {
        await this.redis.del(key)
      } else {
        this.useMemoryFallback = true
        return this.delete(key)
      }
      return true
    } catch (error) {
      console.error('❌ Cache delete error for key:', key, 'Error:', error)
      this.useMemoryFallback = true
      return this.delete(key)
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, cached] of this.memoryCache.entries()) {
      if (now >= cached.expiry) {
        this.memoryCache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired memory cache entries`)
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isEnabled) return false

    try {
      const testKey = 'health_check_test'
      const testValue = { timestamp: Date.now() }
      
      await this.set(testKey, testValue, 10)
      const retrieved = await this.get(testKey)
      await this.delete(testKey)
      
      return retrieved !== null
    } catch (error) {
      console.error('Cache health check failed:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect()
    }
  }

  /**
   * Test Redis connection
   */
  async testRedisConnection(): Promise<{
    success: boolean
    error?: string
    latency?: number
  }> {
    try {
      const start = Date.now()
      const testKey = 'redis_test_' + Date.now()
      const testValue = { test: true }

      await this.set(testKey, testValue, 10)
      const retrieved = await this.get(testKey)
      await this.delete(testKey)

      const latency = Date.now() - start

      return {
        success: retrieved?.test === true,
        latency
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test tiered cache functionality
   */
  async testTieredCache(): Promise<{
    success: boolean
    memoryWorking: boolean
    redisWorking: boolean
    error?: string
  }> {
    try {
      const testKey = 'tiered_test_' + Date.now()
      const testValue = { test: true, timestamp: Date.now() }

      // Test set/get
      await this.set(testKey, testValue, 60)
      const retrieved = await this.get(testKey)

      // Test Redis connection
      const redisTest = await this.testRedisConnection()

      // Cleanup
      await this.delete(testKey)

      return {
        success: retrieved?.test === true,
        memoryWorking: this.useMemoryFallback || retrieved?.test === true,
        redisWorking: redisTest.success
      }
    } catch (error) {
      return {
        success: false,
        memoryWorking: false,
        redisWorking: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryEntries: number
    commandCount: number
    dailyLimit: number
    useMemoryFallback: boolean
    useUpstash: boolean
    isEnabled: boolean
  } {
    return {
      memoryEntries: this.memoryCache.size,
      commandCount: this.commandCount,
      dailyLimit: this.dailyLimit,
      useMemoryFallback: this.useMemoryFallback,
      useUpstash: this.useUpstash,
      isEnabled: this.isEnabled
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.commandCount = 0
    console.log('📊 Cache statistics reset')
  }
}

// Singleton instance
let simplifiedCacheService: SimplifiedCacheService | null = null

export function getSimplifiedCacheService(): SimplifiedCacheService {
  if (!simplifiedCacheService) {
    simplifiedCacheService = new SimplifiedCacheService()
  }
  return simplifiedCacheService
}
