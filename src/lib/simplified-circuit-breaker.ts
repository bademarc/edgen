import { getSimplifiedCacheService } from './simplified-cache'

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
}

interface CircuitBreakerStatus {
  state: CircuitState
  failureCount: number
  lastFailureTime: number
  nextAttemptTime: number
  isManuallyOverridden: boolean
}

export class SimplifiedCircuitBreaker {
  private cache = getSimplifiedCacheService()
  private config: CircuitBreakerConfig
  private cacheKey: string

  constructor(
    private name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 5 * 60 * 1000, // 5 minutes
      monitoringPeriod: 5 * 60 * 1000, // 5 minutes
      halfOpenMaxCalls: 3,
      ...config
    }
    
    this.cacheKey = `circuit_breaker:${name}`
    console.log(`🔧 Simplified circuit breaker initialized for ${name}`)
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
      console.log(`🔓 Manual override active for ${this.name}`)
      try {
        const result = await operation()
        await this.recordSuccess()
        return result
      } catch (error) {
        await this.recordFailure()
        throw error
      }
    }

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
      if (status.failureCount >= this.config.failureThreshold) {
        await this.openCircuit()
        console.log(`🚫 Circuit breaker OPENED for ${this.name}`)
      }
      
      if (fallback) {
        try {
          return await fallback()
        } catch (fallbackError) {
          console.error(`❌ Fallback failed for ${this.name}:`, fallbackError)
        }
      }
      
      throw error
    }
  }

  private async executeInOpenState<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const status = await this.getStatus()
    const now = Date.now()
    
    if (now >= status.nextAttemptTime) {
      await this.halfOpenCircuit()
      return this.executeInHalfOpenState(operation, fallback)
    }
    
    if (fallback) {
      try {
        return await fallback()
      } catch (fallbackError) {
        console.error(`❌ Fallback failed for ${this.name}:`, fallbackError)
      }
    }
    
    const remainingTime = Math.ceil((status.nextAttemptTime - now) / 1000)
    throw new Error(`Circuit breaker is OPEN for ${this.name}. Try again in ${remainingTime} seconds.`)
  }

  private async executeInHalfOpenState<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await operation()
      await this.closeCircuit()
      console.log(`✅ Circuit breaker CLOSED for ${this.name} - service recovered`)
      return result
    } catch (error) {
      await this.openCircuit()
      console.log(`🚫 Circuit breaker re-OPENED for ${this.name}`)
      
      if (fallback) {
        try {
          return await fallback()
        } catch (fallbackError) {
          console.error(`❌ Fallback failed for ${this.name}:`, fallbackError)
        }
      }
      
      throw error
    }
  }

  async getStatus(): Promise<CircuitBreakerStatus> {
    try {
      const cached = await this.cache.get<CircuitBreakerStatus>(this.cacheKey)
      
      if (cached) {
        return cached
      }
      
      // Default status
      const defaultStatus: CircuitBreakerStatus = {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        isManuallyOverridden: false
      }
      
      await this.cache.set(this.cacheKey, defaultStatus, 3600)
      return defaultStatus
    } catch (error) {
      console.error(`❌ Failed to get circuit breaker status for ${this.name}:`, error)
      // Return safe default
      return {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        isManuallyOverridden: false
      }
    }
  }

  private async updateStatus(updates: Partial<CircuitBreakerStatus>): Promise<void> {
    try {
      const current = await this.getStatus()
      const updated = { ...current, ...updates }
      await this.cache.set(this.cacheKey, updated, 3600)
    } catch (error) {
      console.error(`❌ Failed to update circuit breaker status for ${this.name}:`, error)
    }
  }

  private async recordSuccess(): Promise<void> {
    await this.updateStatus({
      failureCount: 0,
      lastFailureTime: 0
    })
  }

  private async recordFailure(): Promise<void> {
    const status = await this.getStatus()
    await this.updateStatus({
      failureCount: status.failureCount + 1,
      lastFailureTime: Date.now()
    })
  }

  private async openCircuit(): Promise<void> {
    const nextAttemptTime = Date.now() + this.config.recoveryTimeout
    await this.updateStatus({
      state: CircuitState.OPEN,
      nextAttemptTime
    })
  }

  private async halfOpenCircuit(): Promise<void> {
    await this.updateStatus({
      state: CircuitState.HALF_OPEN
    })
  }

  private async closeCircuit(): Promise<void> {
    await this.updateStatus({
      state: CircuitState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    })
  }

  /**
   * Manually override the circuit breaker
   */
  async setManualOverride(enabled: boolean): Promise<void> {
    await this.updateStatus({
      isManuallyOverridden: enabled
    })
    console.log(`🔧 Manual override ${enabled ? 'enabled' : 'disabled'} for ${this.name}`)
  }

  /**
   * Get current circuit breaker state
   */
  async getState(): Promise<CircuitState> {
    const status = await this.getStatus()
    return status.state
  }

  /**
   * Reset the circuit breaker to closed state
   */
  async reset(): Promise<void> {
    await this.closeCircuit()
    console.log(`🔄 Circuit breaker reset for ${this.name}`)
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

// Circuit breaker instances cache
const circuitBreakers = new Map<string, SimplifiedCircuitBreaker>()

export function getSimplifiedCircuitBreaker(
  name: string, 
  config?: Partial<CircuitBreakerConfig>
): SimplifiedCircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new SimplifiedCircuitBreaker(name, config))
  }
  return circuitBreakers.get(name)!
}
