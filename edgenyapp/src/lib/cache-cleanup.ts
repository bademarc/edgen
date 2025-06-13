/**
 * Cache Cleanup Utility for LayerEdge Platform
 * Fixes corrupted Redis cache entries and provides maintenance functions
 */

import { getCacheService } from './cache'

export class CacheCleanupService {
  private cache = getCacheService()

  /**
   * Clean up corrupted circuit breaker entries
   */
  async cleanupCircuitBreakerCache(): Promise<{
    cleaned: number
    errors: string[]
  }> {
    const results = {
      cleaned: 0,
      errors: [] as string[]
    }

    const circuitBreakerKeys = [
      'circuit_breaker:manual-tweet-submission',
      'circuit_breaker:twitter-api',
      'circuit_breaker:tweet-tracker',
      'circuit_breaker:fallback-service'
    ]

    for (const key of circuitBreakerKeys) {
      try {
        console.log(`🔍 Checking circuit breaker cache: ${key}`)
        
        const cached = await this.cache.get(key)
        
        if (cached === null) {
          console.log(`✅ ${key} - No cached data (clean)`)
          continue
        }

        // Check if the cached data is corrupted
        if (typeof cached === 'object' && cached !== null && (cached as any).error === 'serialization_failed') {
          console.log(`🚨 Found corrupted entry: ${key}`)
          await this.cache.delete(key)
          results.cleaned++
          console.log(`✅ Cleaned corrupted entry: ${key}`)
        } else if (typeof cached === 'object' && cached !== null && (cached as any).state) {
          console.log(`✅ ${key} - Valid circuit breaker state: ${(cached as any).state}`)
        } else {
          console.log(`⚠️ ${key} - Unexpected data structure, cleaning...`)
          await this.cache.delete(key)
          results.cleaned++
        }
        
      } catch (error) {
        const errorMsg = `Failed to clean ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(`❌ ${errorMsg}`)
        results.errors.push(errorMsg)
      }
    }

    return results
  }

  /**
   * Clean up all rate limiting cache entries
   */
  async cleanupRateLimitCache(): Promise<{
    cleaned: number
    errors: string[]
  }> {
    const results = {
      cleaned: 0,
      errors: [] as string[]
    }

    const rateLimitKeys = [
      'rate_limit:tweet_lookup',
      'rate_limit:tweet_submission',
      'rate_limit:user_lookup',
      'rate_limit:search_tweets'
    ]

    for (const key of rateLimitKeys) {
      try {
        console.log(`🔍 Checking rate limit cache: ${key}`)
        
        const cached = await this.cache.get(key)
        
        if (cached === null) {
          console.log(`✅ ${key} - No cached data (clean)`)
          continue
        }

        // Validate rate limit data structure
        if (typeof cached === 'object' && cached !== null &&
            typeof (cached as any).count === 'number' &&
            typeof (cached as any).resetTime === 'number') {
          console.log(`✅ ${key} - Valid rate limit data`)
        } else {
          console.log(`⚠️ ${key} - Invalid rate limit data, cleaning...`)
          await this.cache.delete(key)
          results.cleaned++
        }
        
      } catch (error) {
        const errorMsg = `Failed to clean ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(`❌ ${errorMsg}`)
        results.errors.push(errorMsg)
      }
    }

    return results
  }

  /**
   * Comprehensive cache cleanup
   */
  async performFullCleanup(): Promise<{
    circuitBreakers: { cleaned: number, errors: string[] }
    rateLimits: { cleaned: number, errors: string[] }
    totalCleaned: number
    totalErrors: number
  }> {
    console.log('🧹 Starting comprehensive cache cleanup...')
    
    const circuitBreakers = await this.cleanupCircuitBreakerCache()
    const rateLimits = await this.cleanupRateLimitCache()
    
    const totalCleaned = circuitBreakers.cleaned + rateLimits.cleaned
    const totalErrors = circuitBreakers.errors.length + rateLimits.errors.length
    
    console.log(`🎉 Cache cleanup completed:`)
    console.log(`   - Circuit breakers cleaned: ${circuitBreakers.cleaned}`)
    console.log(`   - Rate limits cleaned: ${rateLimits.cleaned}`)
    console.log(`   - Total cleaned: ${totalCleaned}`)
    console.log(`   - Total errors: ${totalErrors}`)
    
    return {
      circuitBreakers,
      rateLimits,
      totalCleaned,
      totalErrors
    }
  }

  /**
   * Reset all circuit breakers to closed state
   */
  async resetAllCircuitBreakers(): Promise<void> {
    console.log('🔄 Resetting all circuit breakers...')
    
    const circuitBreakerKeys = [
      'circuit_breaker:manual-tweet-submission',
      'circuit_breaker:twitter-api',
      'circuit_breaker:tweet-tracker',
      'circuit_breaker:fallback-service'
    ]

    const defaultStatus = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      isManuallyOverridden: false,
      degradationActive: false
    }

    for (const key of circuitBreakerKeys) {
      try {
        await this.cache.set(key, defaultStatus, 3600) // 1 hour TTL
        console.log(`✅ Reset circuit breaker: ${key}`)
      } catch (error) {
        console.error(`❌ Failed to reset ${key}:`, error)
      }
    }
    
    console.log('🎉 All circuit breakers reset to CLOSED state')
  }

  /**
   * Clear all rate limiting counters
   */
  async clearAllRateLimits(): Promise<void> {
    console.log('🔄 Clearing all rate limit counters...')
    
    const rateLimitKeys = [
      'rate_limit:tweet_lookup',
      'rate_limit:tweet_submission',
      'rate_limit:user_lookup',
      'rate_limit:search_tweets'
    ]

    for (const key of rateLimitKeys) {
      try {
        await this.cache.delete(key)
        console.log(`✅ Cleared rate limit: ${key}`)
      } catch (error) {
        console.error(`❌ Failed to clear ${key}:`, error)
      }
    }
    
    console.log('🎉 All rate limits cleared')
  }
}

// Singleton instance
let cacheCleanupServiceInstance: CacheCleanupService | null = null

export function getCacheCleanupService(): CacheCleanupService {
  if (!cacheCleanupServiceInstance) {
    cacheCleanupServiceInstance = new CacheCleanupService()
  }
  return cacheCleanupServiceInstance
}

// Utility function for emergency cleanup
export async function emergencyCleanup(): Promise<void> {
  console.log('🚨 EMERGENCY CACHE CLEANUP INITIATED')
  
  const cleanupService = getCacheCleanupService()
  
  try {
    // Reset all circuit breakers
    await cleanupService.resetAllCircuitBreakers()
    
    // Clear all rate limits
    await cleanupService.clearAllRateLimits()
    
    // Perform full cleanup
    await cleanupService.performFullCleanup()
    
    console.log('✅ Emergency cleanup completed successfully')
  } catch (error) {
    console.error('❌ Emergency cleanup failed:', error)
    throw error
  }
}
