/**
 * Improved Circuit Breaker with Manual Override and Graceful Degradation
 * Designed for Twitter API with better failure handling
 */

import { getCacheService } from './cache'
import { getRedisDataValidator } from './redis-data-validator'

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number
  monitoringPeriod: number
  halfOpenMaxCalls: number
  degradationMode: boolean
}

interface CircuitBreakerStatus {
  state: CircuitState
  failureCount: number
  lastFailureTime: number
  nextAttemptTime: number
  isManuallyOverridden: boolean
  degradationActive: boolean
}

export class ImprovedCircuitBreaker {
  private cache = getCacheService()
  private validator = getRedisDataValidator()
  private config: CircuitBreakerConfig
  private cacheKey: string

  constructor(
    private name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: 8, // Increased from 3 to 8 for less aggressive triggering
      recoveryTimeout: 10 * 60 * 1000, // Reduced from 60 to 10 minutes
      monitoringPeriod: 5 * 60 * 1000, // 5 minutes monitoring window
      halfOpenMaxCalls: 3, // Allow 3 test calls in half-open state
      degradationMode: true, // Enable graceful degradation
      ...config
    }
    
    this.cacheKey = `circuit_breaker:${name}`
    console.log(`🔧 Circuit breaker initialized for ${name}:`, this.config)
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const status = await this.getStatus()
    
    // Check manual override first
    if (status.isManuallyOverridden) {
      console.log(`🔓 Manual override active for ${this.name}, allowing request`)
      try {
        const result = await operation()
        await this.recordSuccess()
        return result
      } catch (error) {
        // Even with override, record the failure for monitoring
        await this.recordFailure()
        throw error
      }
    }

    // Handle different circuit states
    switch (status.state) {
      case CircuitState.CLOSED:
        return this.executeInClosedState(operation, fallback)
      
      case CircuitState.OPEN:
        return this.executeInOpenState(operation, fallback)
      
      case CircuitState.HALF_OPEN:
        return this.executeInHalfOpenState(operation, fallback)
      
      default:
        throw new Error(`Unknown circuit state: ${status.state}`)
    }
  }

  /**
   * Execute in CLOSED state (normal operation)
   */
  private async executeInClosedState<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await operation()
      await this.recordSuccess()
      return result
    } catch (error) {
      await this.recordFailure()
      
      const status = await this.getStatus()
      
      // If we've hit the failure threshold, open the circuit
      if (status.failureCount >= this.config.failureThreshold) {
        await this.openCircuit()
        console.log(`🚫 Circuit breaker OPENED for ${this.name} after ${status.failureCount} failures`)
      }
      
      // Try fallback if available and degradation is enabled
      if (fallback && this.config.degradationMode) {
        console.log(`🔄 Attempting fallback for ${this.name}`)
        try {
          return await fallback()
        } catch (fallbackError) {
          console.error(`❌ Fallback also failed for ${this.name}:`, fallbackError)
        }
      }
      
      throw error
    }
  }

  /**
   * Execute in OPEN state (circuit is open)
   */
  private async executeInOpenState<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const status = await this.getStatus()
    const now = Date.now()
    
    // Check if recovery timeout has passed
    if (now >= status.nextAttemptTime) {
      console.log(`🔄 Recovery timeout passed for ${this.name}, transitioning to HALF_OPEN`)
      await this.transitionToHalfOpen()
      return this.executeInHalfOpenState(operation, fallback)
    }
    
    // Circuit is still open, try fallback if available
    if (fallback && this.config.degradationMode) {
      console.log(`🔄 Circuit open for ${this.name}, using fallback`)
      try {
        const result = await fallback()
        await this.updateStatus({ degradationActive: true })
        return result
      } catch (fallbackError) {
        console.error(`❌ Fallback failed for ${this.name}:`, fallbackError)
      }
    }
    
    const remainingTime = Math.ceil((status.nextAttemptTime - now) / 1000)
    throw new Error(`Circuit breaker is OPEN for ${this.name}. Try again in ${remainingTime} seconds.`)
  }

  /**
   * Execute in HALF_OPEN state (testing recovery)
   */
  private async executeInHalfOpenState<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    try {
      console.log(`🧪 Testing recovery for ${this.name} in HALF_OPEN state`)
      const result = await operation()
      
      // Success! Close the circuit
      await this.closeCircuit()
      console.log(`✅ Circuit breaker CLOSED for ${this.name} - recovery successful`)
      
      return result
    } catch (error) {
      // Failure in half-open state, go back to open
      await this.openCircuit()
      console.log(`❌ Recovery failed for ${this.name}, returning to OPEN state`)
      
      // Try fallback if available
      if (fallback && this.config.degradationMode) {
        console.log(`🔄 Using fallback after recovery failure for ${this.name}`)
        try {
          return await fallback()
        } catch (fallbackError) {
          console.error(`❌ Fallback also failed for ${this.name}:`, fallbackError)
        }
      }
      
      throw error
    }
  }

  /**
   * Record successful operation
   */
  private async recordSuccess(): Promise<void> {
    const status = await this.getStatus()
    await this.updateStatus({
      failureCount: 0,
      degradationActive: false
    })
  }

  /**
   * Record failed operation
   */
  private async recordFailure(): Promise<void> {
    const status = await this.getStatus()
    const now = Date.now()
    
    // Reset failure count if outside monitoring period
    const timeSinceLastFailure = now - status.lastFailureTime
    const newFailureCount = timeSinceLastFailure > this.config.monitoringPeriod 
      ? 1 
      : status.failureCount + 1
    
    await this.updateStatus({
      failureCount: newFailureCount,
      lastFailureTime: now
    })
  }

  /**
   * Open the circuit
   */
  private async openCircuit(): Promise<void> {
    const now = Date.now()
    await this.updateStatus({
      state: CircuitState.OPEN,
      nextAttemptTime: now + this.config.recoveryTimeout
    })
  }

  /**
   * Close the circuit
   */
  private async closeCircuit(): Promise<void> {
    await this.updateStatus({
      state: CircuitState.CLOSED,
      failureCount: 0,
      degradationActive: false
    })
  }

  /**
   * Transition to half-open state
   */
  private async transitionToHalfOpen(): Promise<void> {
    await this.updateStatus({
      state: CircuitState.HALF_OPEN
    })
  }

  /**
   * Get current circuit breaker status
   */
  async getStatus(): Promise<CircuitBreakerStatus> {
    try {
      const cached = await this.cache.get<CircuitBreakerStatus>(this.cacheKey)

      if (!cached) {
        // Initialize with default status
        const defaultStatus: CircuitBreakerStatus = {
          state: CircuitState.CLOSED,
          failureCount: 0,
          lastFailureTime: 0,
          nextAttemptTime: 0,
          isManuallyOverridden: false,
          degradationActive: false
        }

        await this.cache.set(this.cacheKey, defaultStatus, 3600) // 1 hour TTL
        return defaultStatus
      }

      // Validate the cached data for corruption
      const validation = this.validator.validateCircuitBreakerStatus(cached)

      if (!validation.isValid) {
        console.warn(`🚨 Corrupted circuit breaker data detected for ${this.name}:`, validation.errorMessage)
        console.warn(`🚨 Original corrupted data:`, cached)

        // Use corrected value if available, otherwise use default
        const correctedStatus = validation.correctedValue || {
          state: CircuitState.CLOSED,
          failureCount: 0,
          lastFailureTime: 0,
          nextAttemptTime: 0,
          isManuallyOverridden: false,
          degradationActive: false
        }

        // Update cache with corrected data
        await this.cache.set(this.cacheKey, correctedStatus, 3600)
        console.log(`✅ Fixed corrupted circuit breaker data for ${this.name}`)

        return correctedStatus
      }

      return cached
    } catch (error) {
      console.warn(`Failed to get circuit breaker status for ${this.name}:`, error)

      // Emergency recovery - validate and fix if needed
      try {
        console.log(`🚨 Attempting emergency recovery for circuit breaker ${this.name}`)
        await this.validator.validateAndFixCacheData(this.cacheKey)
      } catch (validationError) {
        console.error(`Emergency validation failed for ${this.name}:`, validationError)
      }

      // Return safe default
      return {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        isManuallyOverridden: false,
        degradationActive: false
      }
    }
  }

  /**
   * Update circuit breaker status
   */
  private async updateStatus(updates: Partial<CircuitBreakerStatus>): Promise<void> {
    try {
      const current = await this.getStatus()
      const updated = { ...current, ...updates }
      await this.cache.set(this.cacheKey, updated, 3600) // 1 hour TTL
    } catch (error) {
      console.warn(`Failed to update circuit breaker status for ${this.name}:`, error)
    }
  }

  /**
   * Manually override the circuit breaker (admin function)
   */
  async setManualOverride(enabled: boolean, durationMs?: number): Promise<void> {
    console.log(`🔧 Manual override ${enabled ? 'ENABLED' : 'DISABLED'} for ${this.name}`)
    
    await this.updateStatus({
      isManuallyOverridden: enabled
    })
    
    // If enabling override with duration, set timeout to disable it
    if (enabled && durationMs) {
      setTimeout(async () => {
        console.log(`⏰ Manual override timeout for ${this.name}`)
        await this.updateStatus({ isManuallyOverridden: false })
      }, durationMs)
    }
  }

  /**
   * Reset the circuit breaker (admin function)
   */
  async reset(): Promise<void> {
    console.log(`🔄 Resetting circuit breaker for ${this.name}`)
    await this.closeCircuit()
  }

  /**
   * Get circuit breaker metrics
   */
  async getMetrics(): Promise<{
    name: string
    status: CircuitBreakerStatus
    config: CircuitBreakerConfig
    healthScore: number
  }> {
    const status = await this.getStatus()
    
    // Calculate health score (0-100)
    let healthScore = 100
    if (status.state === CircuitState.OPEN) {
      healthScore = 0
    } else if (status.state === CircuitState.HALF_OPEN) {
      healthScore = 50
    } else if (status.failureCount > 0) {
      healthScore = Math.max(0, 100 - (status.failureCount / this.config.failureThreshold) * 100)
    }
    
    return {
      name: this.name,
      status,
      config: this.config,
      healthScore
    }
  }
}

// Circuit breaker instances for different services
const circuitBreakers = new Map<string, ImprovedCircuitBreaker>()

export function getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): ImprovedCircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new ImprovedCircuitBreaker(name, config))
  }
  return circuitBreakers.get(name)!
}

export function getAllCircuitBreakers(): ImprovedCircuitBreaker[] {
  return Array.from(circuitBreakers.values())
}
