import { getCacheService } from './cache'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  priority: 'high' | 'medium' | 'low'
}

interface QueuedRequest {
  id: string
  priority: number
  timestamp: number
  retries: number
  data: any
}

class SmartRateLimiter {
  private cache = getCacheService()
  private requestQueue: QueuedRequest[] = []
  private processing = false
  
  // Ultra conservative limits for free Twitter API
  private readonly LIMITS = {
    search: { maxRequests: 1, windowMs: 15 * 60 * 1000 }, // 1 per 15 min
    userLookup: { maxRequests: 1, windowMs: 15 * 60 * 1000 }, // 1 per 15 min
    tweetLookup: { maxRequests: 1, windowMs: 15 * 60 * 1000 } // 1 per 15 min
  }

  constructor() {
    // Start processing queue
    this.startQueueProcessor()
  }

  /**
   * Smart batching: Group multiple user requests into single API calls
   */
  async batchUserLookup(userIds: string[]): Promise<any[]> {
    const cacheKey = `batch_users:${userIds.sort().join(',')}`
    
    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      console.log('📋 Returning cached batch user lookup')
      return cached
    }

    // Twitter API allows up to 100 users per request
    const batches = this.chunkArray(userIds, 100)
    const results: any[] = []

    for (const batch of batches) {
      const request: QueuedRequest = {
        id: `batch_${Date.now()}_${Math.random()}`,
        priority: 2, // Medium priority
        timestamp: Date.now(),
        retries: 0,
        data: { type: 'userBatch', userIds: batch }
      }

      await this.addToQueue(request)
    }

    // Cache results for 10 minutes
    await this.cache.set(cacheKey, results, 600)
    return results
  }

  /**
   * Intelligent request prioritization
   */
  async addToQueue(request: QueuedRequest): Promise<void> {
    // Check if we can make request immediately
    if (await this.canMakeRequest(request.data.type)) {
      await this.executeRequest(request)
      return
    }

    // Add to queue with priority
    this.requestQueue.push(request)
    this.requestQueue.sort((a, b) => b.priority - a.priority)
    
    console.log(`📋 Added request to queue. Queue size: ${this.requestQueue.length}`)
  }

  /**
   * Check if we can make a request without hitting rate limits
   */
  private async canMakeRequest(type: string): Promise<boolean> {
    const limit = this.LIMITS[type as keyof typeof this.LIMITS]
    if (!limit) return false

    const key = `rate_limit:${type}`
    const current = await this.cache.getRateLimit(key)
    
    return current < limit.maxRequests
  }

  /**
   * Execute API request with rate limit tracking
   */
  private async executeRequest(request: QueuedRequest): Promise<any> {
    const { type } = request.data
    const limit = this.LIMITS[type as keyof typeof this.LIMITS]
    
    try {
      // Increment rate limit counter
      const key = `rate_limit:${type}`
      await this.cache.incrementRateLimit(key, limit.windowMs / 1000)

      // Execute the actual API call
      const result = await this.makeApiCall(request.data)
      
      console.log(`✅ API request completed: ${type}`)
      return result
    } catch (error) {
      console.error(`❌ API request failed: ${type}`, error)
      
      // Retry logic
      if (request.retries < 3) {
        request.retries++
        request.timestamp = Date.now() + (1000 * Math.pow(2, request.retries)) // Exponential backoff
        this.requestQueue.unshift(request) // Add back to front of queue
      }
      
      throw error
    }
  }

  /**
   * Process queued requests
   */
  private async startQueueProcessor(): Promise<void> {
    if (this.processing) return
    this.processing = true

    setInterval(async () => {
      if (this.requestQueue.length === 0) return

      // Process requests that are ready
      const now = Date.now()
      const readyRequests = this.requestQueue.filter(req => req.timestamp <= now)
      
      for (const request of readyRequests.slice(0, 5)) { // Process max 5 at a time
        if (await this.canMakeRequest(request.data.type)) {
          // Remove from queue
          const index = this.requestQueue.indexOf(request)
          this.requestQueue.splice(index, 1)
          
          // Execute request
          try {
            await this.executeRequest(request)
          } catch (error) {
            console.error('Queue processor error:', error)
          }
        }
      }
    }, 5000) // Check every 5 seconds
  }

  /**
   * Mock API call - replace with actual Twitter API calls
   */
  private async makeApiCall(data: any): Promise<any> {
    // This would be replaced with actual Twitter API calls
    console.log('Making API call:', data.type)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return { success: true, data: data }
  }

  /**
   * Utility: Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(): Promise<Record<string, { current: number; limit: number; resetTime: number }>> {
    const status: Record<string, any> = {}
    
    for (const [type, limit] of Object.entries(this.LIMITS)) {
      const key = `rate_limit:${type}`
      const current = await this.cache.getRateLimit(key)
      
      status[type] = {
        current,
        limit: limit.maxRequests,
        resetTime: Date.now() + limit.windowMs,
        remaining: limit.maxRequests - current
      }
    }
    
    return status
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): { pending: number; processing: boolean } {
    return {
      pending: this.requestQueue.length,
      processing: this.processing
    }
  }
}

// Singleton instance
let smartRateLimiter: SmartRateLimiter | null = null

export function getSmartRateLimiter(): SmartRateLimiter {
  if (!smartRateLimiter) {
    smartRateLimiter = new SmartRateLimiter()
  }
  return smartRateLimiter
}

export { SmartRateLimiter }
