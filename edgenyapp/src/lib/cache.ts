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

class CacheService {
  private redis: Redis | null = null
  private upstashRedis: UpstashRedis | null = null
  private isEnabled: boolean = false
  private useUpstash: boolean = false
  private commandCount: number = 0
  private dailyLimit: number = 10000 // Upstash free tier limit

  // In-memory cache fallback for when Redis fails
  private memoryCache: Map<string, { value: any, expiry: number }> = new Map()
  private useMemoryFallback: boolean = false

  constructor() {
    this.initializeRedis()
  }

  private initializeRedis() {
    try {
      // Support both traditional Redis and Upstash Redis
      const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
      const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

      console.log('🔍 Redis configuration check:')
      console.log('- Upstash URL:', upstashUrl ? 'configured' : 'missing')
      console.log('- Upstash Token:', upstashToken ? 'configured' : 'missing')
      console.log('- Redis Host:', process.env.REDIS_HOST || 'localhost')
      console.log('- Redis Port:', process.env.REDIS_PORT || '6379')
      console.log('- Redis Password:', process.env.REDIS_PASSWORD ? 'configured' : 'missing')

      if (upstashUrl && upstashToken) {
        try {
          // Use Upstash Redis REST API (free tier friendly)
          this.upstashRedis = new UpstashRedis({
            url: upstashUrl,
            token: upstashToken,
          })
          this.useUpstash = true
          this.isEnabled = true
          console.log('🔗 Using Upstash Redis FREE tier (10k commands/day)')
          console.log('✅ Upstash Redis client initialized successfully')

          // Note: Connection testing is done asynchronously via testConnection() method
          // to avoid blocking the constructor with await statements

          // Note: Upstash uses REST API, not traditional Redis protocol
          // So we don't set up a traditional Redis connection here
          return // CRITICAL: Return here to prevent fallback to traditional Redis
        } catch (upstashError) {
          console.error('❌ Upstash Redis initialization failed:', upstashError)
          console.log('🔄 Falling back to traditional Redis...')
          this.useUpstash = false
          this.upstashRedis = null
        }
      }

      if (!this.useUpstash) {
        // Fallback to traditional Redis
        const config: CacheConfig = {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0'),
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          // Add TLS support for Upstash
          tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
          family: 4, // Force IPv4
          connectTimeout: 10000,
          lazyConnect: false
        }

        console.log('🔗 Initializing traditional Redis with config:', {
          host: config.host,
          port: config.port,
          hasPassword: !!config.password,
          db: config.db
        })

        this.redis = new Redis(config)
        console.log('🔗 Using traditional Redis')
      }

      this.isEnabled = true

      // Set up event handlers only for traditional Redis connections
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
      console.log('🔄 Enabling in-memory cache fallback...')
      this.useMemoryFallback = true
      this.isEnabled = true // Enable cache with memory fallback
    }
  }

  /**
   * Test Redis connection asynchronously
   * This method can be called after initialization to verify connectivity
   */
  async testConnection(): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('🚫 Cache disabled, skipping connection test')
      return false
    }

    try {
      if (this.useUpstash && this.upstashRedis) {
        console.log('🧪 Testing Upstash Redis connection...')

        // Test ping
        await this.upstashRedis.ping()
        console.log('🎯 Upstash Redis connection test successful - WRONGPASS errors should be resolved')

        // Additional test: set and get a test value
        await this.upstashRedis.set('test:connection', 'success', { ex: 60 })
        const testValue = await this.upstashRedis.get('test:connection')
        if (testValue === 'success') {
          console.log('✅ Upstash Redis read/write operations verified')
          await this.upstashRedis.del('test:connection')
          return true
        } else {
          console.warn('⚠️ Upstash Redis read/write test failed')
          return false
        }
      } else if (this.redis) {
        console.log('🧪 Testing traditional Redis connection...')
        const result = await this.redis.ping()
        const success = result === 'PONG'
        console.log(success ? '✅ Traditional Redis connection test successful' : '❌ Traditional Redis connection test failed')
        return success
      } else {
        console.log('🧠 Using memory cache fallback - no Redis connection to test')
        return this.useMemoryFallback
      }
    } catch (error) {
      console.error('❌ Redis connection test failed:', error)
      console.log('🔄 Falling back to memory cache due to connection test failure')
      this.useMemoryFallback = true
      this.isEnabled = true // Keep cache enabled with memory fallback
      return false
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled) {
      console.log('🚫 Cache disabled, skipping get for key:', key)
      return null
    }

    // Check memory cache first if using fallback
    if (this.useMemoryFallback) {
      const cached = this.memoryCache.get(key)
      if (cached) {
        if (Date.now() < cached.expiry) {
          console.log('🧠 Memory cache hit for key:', key)
          return cached.value
        } else {
          this.memoryCache.delete(key)
        }
      }
      console.log('🧠 Memory cache miss for key:', key)
      return null
    }

    // Check daily limit for Upstash
    if (this.useUpstash && this.commandCount >= this.dailyLimit) {
      console.warn('⚠️ Upstash daily limit reached, falling back to memory cache')
      this.useMemoryFallback = true
      return this.get(key) // Retry with memory cache
    }

    try {
      let value: string | null = null

      if (this.useUpstash && this.upstashRedis) {
        console.log('🔍 Getting from Upstash Redis:', key)
        const rawValue = await this.upstashRedis.get(key)
        this.commandCount++

        // Enhanced Upstash data validation
        if (rawValue !== null) {
          // Ensure we have a string value
          if (typeof rawValue === 'object') {
            console.warn(`🚨 Upstash returned object instead of string for key ${key}:`, rawValue)
            // Try to extract string value if it's wrapped
            value = rawValue.toString()
          } else {
            value = rawValue as string
          }

          // Additional validation for corrupted data
          if (value === '[object Object]' || value === 'undefined' || value === 'null') {
            console.warn(`🚨 Corrupted data detected from Upstash for key ${key}: ${value}`)
            await this.upstashRedis.del(key) // Clean up corrupted data
            value = null
          }
        } else {
          value = null
        }

        console.log('✅ Upstash get result:', value ? 'found' : 'not found')
      } else if (this.redis) {
        console.log('🔍 Getting from traditional Redis:', key)
        value = await this.redis.get(key)
        console.log('✅ Redis get result:', value ? 'found' : 'not found')
      } else {
        console.warn('⚠️ No Redis client available, using memory fallback')
        this.useMemoryFallback = true
        return this.get(key) // Retry with memory cache
      }

      // Enhanced JSON parsing with corruption detection
      if (!value) {
        console.log('❌ Cache miss for key:', key)
        return null
      }

      try {
        // Check for corrupted data patterns
        if (value === '[object Object]' || value === 'undefined' || value === 'null') {
          console.warn(`🚨 Corrupted cache data detected for key ${key}: ${value}`)
          // Delete the corrupted entry
          await this.delete(key)
          return null
        }

        const parsed = JSON.parse(value)

        // Additional validation for circuit breaker status objects
        if (key.includes('circuit_breaker') && parsed && typeof parsed === 'object') {
          const status = parsed as any
          if (status.error === 'serialization_failed') {
            console.warn(`🚨 Found serialization error marker for key ${key}, removing corrupted entry`)
            await this.delete(key)
            return null
          }
        }

        console.log('✅ Cache hit for key:', key)
        return parsed
      } catch (parseError) {
        console.error(`❌ JSON parse error for key ${key}:`, parseError)
        console.error(`❌ Corrupted data: ${value}`)

        // Delete the corrupted entry
        await this.delete(key)
        return null
      }
    } catch (error) {
      console.error('❌ Cache get error for key:', key, 'Error:', error)
      console.log('🔄 Falling back to memory cache due to Redis error')
      this.useMemoryFallback = true
      return this.get(key) // Retry with memory cache
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('🚫 Cache disabled, skipping set for key:', key)
      return false
    }

    // Use memory cache if fallback is enabled
    if (this.useMemoryFallback) {
      const expiry = Date.now() + (ttlSeconds * 1000)
      this.memoryCache.set(key, { value, expiry })
      console.log('🧠 Memory cache set for key:', key, 'TTL:', ttlSeconds)

      // Clean up expired entries periodically
      if (this.memoryCache.size > 1000) {
        this.cleanupMemoryCache()
      }

      return true
    }

    // Check daily limit for Upstash
    if (this.useUpstash && this.commandCount >= this.dailyLimit) {
      console.warn('⚠️ Upstash daily limit reached, falling back to memory cache')
      this.useMemoryFallback = true
      return this.set(key, value, ttlSeconds) // Retry with memory cache
    }

    try {
      // Enhanced JSON serialization with comprehensive validation
      let serializedValue: string
      try {
        // Pre-serialization validation
        if (value === undefined) {
          console.warn(`⚠️ Attempting to cache undefined value for key: ${key}`)
          return false
        }

        // Handle null values explicitly
        if (value === null) {
          serializedValue = 'null'
        } else {
          // Perform JSON serialization
          serializedValue = JSON.stringify(value)
        }

        // Comprehensive validation of serialization result
        if (!serializedValue ||
            serializedValue === '[object Object]' ||
            serializedValue === 'undefined' ||
            serializedValue === '[object Promise]' ||
            serializedValue === '[object Function]') {
          throw new Error(`Invalid serialization result: ${serializedValue}`)
        }

        // Test deserialization to ensure data integrity
        try {
          const testParse = JSON.parse(serializedValue)

          // Type validation
          if (value !== null && typeof testParse !== typeof value) {
            throw new Error(`Serialization type mismatch: original=${typeof value}, parsed=${typeof testParse}`)
          }

          // Deep validation for objects
          if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value) !== Array.isArray(testParse)) {
              throw new Error('Array type mismatch after serialization')
            }
          }

        } catch (parseError) {
          throw new Error(`Deserialization test failed: ${parseError.message}`)
        }

      } catch (serializationError) {
        console.error('❌ JSON serialization failed for key:', key, 'Error:', serializationError)
        console.error('❌ Value that failed to serialize:', {
          value,
          type: typeof value,
          isArray: Array.isArray(value),
          constructor: value?.constructor?.name,
          keys: typeof value === 'object' && value !== null ? Object.keys(value) : 'N/A'
        })

        // Create a safe fallback representation with more details
        serializedValue = JSON.stringify({
          error: 'serialization_failed',
          originalType: typeof value,
          isArray: Array.isArray(value),
          constructor: value?.constructor?.name,
          timestamp: Date.now(),
          key: key,
          errorMessage: serializationError.message
        })

        console.warn(`⚠️ Using fallback serialization for key: ${key}`)
      }

      if (this.useUpstash && this.upstashRedis) {
        console.log('💾 Setting in Upstash Redis:', key, 'TTL:', ttlSeconds)

        // Enhanced Upstash Redis operation with validation
        try {
          // Ensure we're passing a string to Upstash
          if (typeof serializedValue !== 'string') {
            console.error(`❌ Upstash requires string value, got ${typeof serializedValue} for key: ${key}`)
            serializedValue = String(serializedValue)
          }

          // Final validation before storing
          if (serializedValue === '[object Object]') {
            throw new Error('Refusing to store corrupted "[object Object]" data')
          }

          await this.upstashRedis.setex(key, ttlSeconds, serializedValue)
          this.commandCount++
          console.log('✅ Upstash set successful')

          // Verification read to ensure data integrity
          const verifyValue = await this.upstashRedis.get(key)
          if (verifyValue !== serializedValue) {
            console.warn(`⚠️ Data integrity check failed for key ${key}`)
            console.warn(`Expected: ${serializedValue.substring(0, 100)}...`)
            console.warn(`Got: ${verifyValue?.toString().substring(0, 100)}...`)
          }

        } catch (upstashError) {
          console.error(`❌ Upstash set operation failed for key ${key}:`, upstashError)
          throw upstashError
        }
      } else if (this.redis) {
        console.log('💾 Setting in traditional Redis:', key, 'TTL:', ttlSeconds)
        await this.redis.setex(key, ttlSeconds, serializedValue)
        console.log('✅ Redis set successful')
      } else {
        console.warn('⚠️ No Redis client available, using memory fallback')
        this.useMemoryFallback = true
        return this.set(key, value, ttlSeconds) // Retry with memory cache
      }
      return true
    } catch (error) {
      console.error('❌ Cache set error for key:', key, 'Error:', error)
      console.log('🔄 Falling back to memory cache due to Redis error')
      this.useMemoryFallback = true
      return this.set(key, value, ttlSeconds) // Retry with memory cache
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('🚫 Cache disabled, skipping delete for key:', key)
      return false
    }

    // Delete from memory cache if using fallback
    if (this.useMemoryFallback) {
      const deleted = this.memoryCache.delete(key)
      console.log(`🧠 Memory cache delete for key: ${key} - ${deleted ? 'found' : 'not found'}`)
      return deleted
    }

    try {
      if (this.useUpstash && this.upstashRedis) {
        console.log('🗑️ Deleting from Upstash Redis:', key)
        await this.upstashRedis.del(key)
        this.commandCount++
        console.log('✅ Upstash delete successful')
      } else if (this.redis) {
        console.log('🗑️ Deleting from traditional Redis:', key)
        await this.redis.del(key)
        console.log('✅ Redis delete successful')
      } else {
        console.warn('⚠️ No Redis client available, using memory fallback')
        this.useMemoryFallback = true
        return this.delete(key) // Retry with memory cache
      }
      return true
    } catch (error) {
      console.error('❌ Cache delete error for key:', key, 'Error:', error)
      console.log('🔄 Falling back to memory cache due to Redis error')
      this.useMemoryFallback = true
      return this.delete(key) // Retry with memory cache
    }
  }

  // Clean up expired memory cache entries
  private cleanupMemoryCache(): void {
    const now = Date.now()
    let cleaned = 0

    // Convert to array to avoid iterator issues
    const entries = Array.from(this.memoryCache.entries())

    for (const [key, cached] of entries) {
      if (now >= cached.expiry) {
        this.memoryCache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired memory cache entries`)
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.redis) return false

    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.redis) return false

    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  // Cache leaderboard data
  async cacheLeaderboard(data: any[], ttlSeconds: number = 300): Promise<void> {
    await this.set('leaderboard:top100', data, ttlSeconds)
  }

  async getLeaderboard(): Promise<any[] | null> {
    return await this.get<any[]>('leaderboard:top100')
  }

  // Cache user data
  async cacheUser(userId: string, userData: any, ttlSeconds: number = 600): Promise<void> {
    await this.set(`user:${userId}`, userData, ttlSeconds)
  }

  async getUser(userId: string): Promise<any | null> {
    return await this.get(`user:${userId}`)
  }

  // Cache tweet engagement data
  async cacheTweetEngagement(tweetId: string, engagement: any, ttlSeconds: number = 300): Promise<void> {
    await this.set(`tweet:${tweetId}:engagement`, engagement, ttlSeconds)
  }

  async getTweetEngagement(tweetId: string): Promise<any | null> {
    return await this.get(`tweet:${tweetId}:engagement`)
  }

  // Rate limiting cache
  async incrementRateLimit(key: string, windowSeconds: number = 60): Promise<number> {
    if (!this.isEnabled || !this.redis) return 0

    try {
      const multi = this.redis.multi()
      multi.incr(key)
      multi.expire(key, windowSeconds)
      const results = await multi.exec()
      return results?.[0]?.[1] as number || 0
    } catch (error) {
      console.error('Rate limit increment error:', error)
      return 0
    }
  }

  async getRateLimit(key: string): Promise<number> {
    if (!this.isEnabled || !this.redis) return 0

    try {
      const value = await this.redis.get(key)
      return value ? parseInt(value) : 0
    } catch (error) {
      console.error('Rate limit get error:', error)
      return 0
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    if (!this.isEnabled) return false

    try {
      // Use the new testConnection method for both Upstash and traditional Redis
      return await this.testConnection()
    } catch (error) {
      console.error('Cache health check failed:', error)
      return false
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect()
    }
  }
}

// Singleton instance
let cacheService: CacheService | null = null

export function getCacheService(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService()
  }
  return cacheService
}

export { CacheService }
