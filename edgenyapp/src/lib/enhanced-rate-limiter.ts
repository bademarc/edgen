/**
 * Enhanced Rate Limiter with Request Queue and Exponential Backoff
 * Designed for Twitter API v2 with proper rate limit handling
 */

import { getCacheService } from './cache'

interface QueuedRequest {
  id: string
  operation: string
  priority: number
  timestamp: number
  retries: number
  maxRetries: number
  resolve: (value: any) => void
  reject: (error: any) => void
  execute: () => Promise<any>
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  burstLimit: number
}

interface RateLimitStatus {
  remaining: number
  resetTime: number
  isLimited: boolean
}

export class EnhancedRateLimiter {
  private cache = getCacheService()
  private requestQueue: QueuedRequest[] = []
  private processing = false
  private requestId = 0

  // Twitter API v2 Rate Limits (Ultra Conservative for Free Tier)
  private readonly RATE_LIMITS: Record<string, RateLimitConfig> = {
    'tweet_lookup': { maxRequests: 1, windowMs: 15 * 60 * 1000, burstLimit: 1 },
    'user_lookup': { maxRequests: 1, windowMs: 15 * 60 * 1000, burstLimit: 1 },
    'search': { maxRequests: 1, windowMs: 15 * 60 * 1000, burstLimit: 1 },
    'tweet_submission': { maxRequests: 1, windowMs: 15 * 60 * 1000, burstLimit: 1 }
  }

  constructor() {
    this.startQueueProcessor()
  }

  /**
   * Add request to queue with priority and retry logic
   */
  async queueRequest<T>(
    operation: string,
    executeFunction: () => Promise<T>,
    priority: number = 1,
    maxRetries: number = 3
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: `req_${++this.requestId}`,
        operation,
        priority,
        timestamp: Date.now(),
        retries: 0,
        maxRetries,
        resolve,
        reject,
        execute: executeFunction
      }

      // Insert request based on priority (higher priority first)
      const insertIndex = this.requestQueue.findIndex(r => r.priority < priority)
      if (insertIndex === -1) {
        this.requestQueue.push(request)
      } else {
        this.requestQueue.splice(insertIndex, 0, request)
      }

      console.log(`📋 Queued ${operation} request (priority: ${priority}, queue size: ${this.requestQueue.length})`)
      
      // Start processing if not already running
      if (!this.processing) {
        this.processQueue()
      }
    })
  }

  /**
   * Check if operation is rate limited
   */
  async checkRateLimit(operation: string): Promise<RateLimitStatus> {
    const config = this.RATE_LIMITS[operation] || this.RATE_LIMITS['tweet_lookup']
    const cacheKey = `rate_limit:${operation}`
    
    try {
      const cached = await this.cache.get<{ count: number, resetTime: number }>(cacheKey)
      const now = Date.now()
      
      if (!cached || now >= cached.resetTime) {
        // Reset window
        await this.cache.set(cacheKey, { count: 0, resetTime: now + config.windowMs }, config.windowMs / 1000)
        return { remaining: config.maxRequests, resetTime: now + config.windowMs, isLimited: false }
      }
      
      const remaining = Math.max(0, config.maxRequests - cached.count)
      return {
        remaining,
        resetTime: cached.resetTime,
        isLimited: remaining <= 0
      }
    } catch (error) {
      console.warn('Rate limit check failed, allowing request:', error)
      return { remaining: config.maxRequests, resetTime: Date.now() + config.windowMs, isLimited: false }
    }
  }

  /**
   * Increment rate limit counter
   */
  async incrementRateLimit(operation: string): Promise<void> {
    const config = this.RATE_LIMITS[operation] || this.RATE_LIMITS['tweet_lookup']
    const cacheKey = `rate_limit:${operation}`
    
    try {
      const cached = await this.cache.get<{ count: number, resetTime: number }>(cacheKey)
      const now = Date.now()
      
      if (!cached || now >= cached.resetTime) {
        await this.cache.set(cacheKey, { count: 1, resetTime: now + config.windowMs }, config.windowMs / 1000)
      } else {
        await this.cache.set(cacheKey, { count: cached.count + 1, resetTime: cached.resetTime }, config.windowMs / 1000)
      }
    } catch (error) {
      console.warn('Failed to increment rate limit:', error)
    }
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return
    }

    this.processing = true
    console.log(`🔄 Processing request queue (${this.requestQueue.length} requests)`)

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!
      
      try {
        // Check rate limit before processing
        const rateLimitStatus = await this.checkRateLimit(request.operation)
        
        if (rateLimitStatus.isLimited) {
          const waitTime = rateLimitStatus.resetTime - Date.now()
          console.log(`⏳ Rate limited for ${request.operation}, waiting ${Math.round(waitTime / 1000)}s`)
          
          // Put request back at front of queue
          this.requestQueue.unshift(request)
          
          // Wait for rate limit reset
          await this.sleep(Math.min(waitTime, 60000)) // Max 1 minute wait
          continue
        }

        // Execute the request
        console.log(`🚀 Executing ${request.operation} request (attempt ${request.retries + 1})`)
        const result = await request.execute()
        
        // Increment rate limit counter
        await this.incrementRateLimit(request.operation)
        
        // Resolve the promise
        request.resolve(result)
        
        // Small delay between requests to be respectful
        await this.sleep(1000)
        
      } catch (error) {
        console.error(`❌ Request ${request.id} failed:`, error)
        
        // Check if we should retry
        if (request.retries < request.maxRetries && this.shouldRetry(error)) {
          request.retries++
          const backoffDelay = this.calculateBackoffDelay(request.retries)
          
          console.log(`🔄 Retrying ${request.operation} in ${backoffDelay}ms (attempt ${request.retries + 1}/${request.maxRetries + 1})`)
          
          // Wait for backoff delay then add back to queue
          setTimeout(() => {
            this.requestQueue.unshift(request)
          }, backoffDelay)
        } else {
          // Max retries exceeded or non-retryable error
          request.reject(error)
        }
      }
    }

    this.processing = false
    console.log('✅ Request queue processing completed')
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    // Process queue every 5 seconds if there are pending requests
    setInterval(() => {
      if (!this.processing && this.requestQueue.length > 0) {
        this.processQueue()
      }
    }, 5000)
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retryCount: number): number {
    const baseDelay = 1000 // 1 second
    const maxDelay = 60000 // 60 seconds
    const jitter = Math.random() * 1000 // 0-1 second jitter
    
    return Math.min(baseDelay * Math.pow(2, retryCount) + jitter, maxDelay)
  }

  /**
   * Determine if error is retryable
   */
  private shouldRetry(error: any): boolean {
    // Retry on rate limits, network errors, and temporary failures
    if (error?.status === 429) return true // Rate limited
    if (error?.status >= 500) return true // Server errors
    if (error?.name === 'AbortError') return true // Timeout
    if (error?.message?.includes('network')) return true // Network errors
    if (error?.message?.includes('timeout')) return true // Timeout errors
    
    return false
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number
    processing: boolean
    operations: Record<string, number>
  } {
    const operations: Record<string, number> = {}
    
    this.requestQueue.forEach(req => {
      operations[req.operation] = (operations[req.operation] || 0) + 1
    })

    return {
      queueLength: this.requestQueue.length,
      processing: this.processing,
      operations
    }
  }

  /**
   * Clear the queue (emergency use)
   */
  clearQueue(): void {
    console.log('🚨 Clearing request queue')
    this.requestQueue.forEach(req => {
      req.reject(new Error('Queue cleared'))
    })
    this.requestQueue = []
  }
}

// Singleton instance
let enhancedRateLimiter: EnhancedRateLimiter | null = null

export function getEnhancedRateLimiter(): EnhancedRateLimiter {
  if (!enhancedRateLimiter) {
    enhancedRateLimiter = new EnhancedRateLimiter()
  }
  return enhancedRateLimiter
}
