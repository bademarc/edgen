/**
 * Redis Data Validator Service
 * 
 * Provides comprehensive validation and recovery mechanisms for Redis data
 * to prevent and fix "[object Object]" corruption and other serialization issues.
 */

import { getCacheService } from './cache'

export interface ValidationResult {
  isValid: boolean
  errorType?: string
  errorMessage?: string
  originalValue?: any
  correctedValue?: any
}

export interface DataIntegrityReport {
  totalKeys: number
  validKeys: number
  corruptedKeys: number
  fixedKeys: number
  errors: string[]
  recommendations: string[]
}

export class RedisDataValidator {
  private cache = getCacheService()
  
  // Known corruption patterns
  private readonly CORRUPTION_PATTERNS = [
    '[object Object]',
    '[object Promise]',
    '[object Function]',
    'undefined',
    'NaN',
    'Infinity',
    '[object Array]'
  ]

  /**
   * Validate a single value for corruption
   */
  validateValue(value: any, key?: string): ValidationResult {
    try {
      // Check for null/undefined (these are valid)
      if (value === null || value === undefined) {
        return { isValid: true }
      }

      // Check for corruption patterns
      const stringValue = String(value)
      for (const pattern of this.CORRUPTION_PATTERNS) {
        if (stringValue === pattern) {
          return {
            isValid: false,
            errorType: 'corruption_pattern',
            errorMessage: `Value matches corruption pattern: ${pattern}`,
            originalValue: value
          }
        }
      }

      // Test JSON serialization/deserialization
      try {
        const serialized = JSON.stringify(value)
        
        // Check if serialization produced corruption
        if (this.CORRUPTION_PATTERNS.includes(serialized)) {
          return {
            isValid: false,
            errorType: 'serialization_corruption',
            errorMessage: `JSON.stringify produced corrupted result: ${serialized}`,
            originalValue: value
          }
        }

        // Test deserialization
        const deserialized = JSON.parse(serialized)
        
        // Type validation
        if (typeof deserialized !== typeof value) {
          return {
            isValid: false,
            errorType: 'type_mismatch',
            errorMessage: `Type mismatch after serialization: ${typeof value} -> ${typeof deserialized}`,
            originalValue: value
          }
        }

        // Deep validation for objects
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value) !== Array.isArray(deserialized)) {
            return {
              isValid: false,
              errorType: 'array_type_mismatch',
              errorMessage: 'Array type lost during serialization',
              originalValue: value
            }
          }
        }

        return { isValid: true }

      } catch (serializationError) {
        return {
          isValid: false,
          errorType: 'serialization_error',
          errorMessage: `JSON serialization failed: ${serializationError.message}`,
          originalValue: value
        }
      }

    } catch (error) {
      return {
        isValid: false,
        errorType: 'validation_error',
        errorMessage: `Validation failed: ${error.message}`,
        originalValue: value
      }
    }
  }

  /**
   * Validate and fix a circuit breaker status object
   */
  validateCircuitBreakerStatus(status: any): ValidationResult {
    try {
      // Check if it's a valid circuit breaker status
      if (!status || typeof status !== 'object') {
        return {
          isValid: false,
          errorType: 'invalid_structure',
          errorMessage: 'Circuit breaker status must be an object',
          originalValue: status,
          correctedValue: this.createDefaultCircuitBreakerStatus()
        }
      }

      // Required fields validation
      const requiredFields = ['state', 'failureCount', 'lastFailureTime', 'nextAttemptTime']
      const missingFields = requiredFields.filter(field => !(field in status))
      
      if (missingFields.length > 0) {
        return {
          isValid: false,
          errorType: 'missing_fields',
          errorMessage: `Missing required fields: ${missingFields.join(', ')}`,
          originalValue: status,
          correctedValue: { ...this.createDefaultCircuitBreakerStatus(), ...status }
        }
      }

      // Type validation
      if (typeof status.state !== 'string' ||
          typeof status.failureCount !== 'number' ||
          typeof status.lastFailureTime !== 'number' ||
          typeof status.nextAttemptTime !== 'number') {
        return {
          isValid: false,
          errorType: 'invalid_types',
          errorMessage: 'Circuit breaker status fields have invalid types',
          originalValue: status,
          correctedValue: this.createDefaultCircuitBreakerStatus()
        }
      }

      // State validation
      const validStates = ['CLOSED', 'OPEN', 'HALF_OPEN']
      if (!validStates.includes(status.state)) {
        return {
          isValid: false,
          errorType: 'invalid_state',
          errorMessage: `Invalid circuit breaker state: ${status.state}`,
          originalValue: status,
          correctedValue: { ...status, state: 'CLOSED' }
        }
      }

      return { isValid: true }

    } catch (error) {
      return {
        isValid: false,
        errorType: 'validation_error',
        errorMessage: `Circuit breaker validation failed: ${error.message}`,
        originalValue: status,
        correctedValue: this.createDefaultCircuitBreakerStatus()
      }
    }
  }

  /**
   * Create a default circuit breaker status
   */
  private createDefaultCircuitBreakerStatus() {
    return {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      isManuallyOverridden: false,
      degradationActive: false
    }
  }

  /**
   * Validate and fix data in Redis cache
   */
  async validateAndFixCacheData(key: string): Promise<ValidationResult> {
    try {
      console.log(`🔍 Validating cache data for key: ${key}`)
      
      // Get the raw data
      const data = await this.cache.get(key)
      
      if (data === null) {
        return { isValid: true } // Null is valid (cache miss)
      }

      // General validation
      let validation = this.validateValue(data, key)
      
      // Special validation for circuit breaker data
      if (key.includes('circuit_breaker') && validation.isValid) {
        validation = this.validateCircuitBreakerStatus(data)
      }

      // If data is invalid and we have a correction, apply it
      if (!validation.isValid && validation.correctedValue) {
        console.log(`🔧 Fixing corrupted data for key: ${key}`)
        console.log(`   Error: ${validation.errorMessage}`)
        
        try {
          await this.cache.set(key, validation.correctedValue, 3600) // 1 hour TTL
          console.log(`✅ Fixed corrupted data for key: ${key}`)
          
          return {
            ...validation,
            isValid: true // Mark as valid after fix
          }
        } catch (fixError) {
          console.error(`❌ Failed to fix data for key ${key}:`, fixError)
          return validation
        }
      }

      // If data is invalid and we can't fix it, delete it
      if (!validation.isValid) {
        console.log(`🗑️ Deleting corrupted data for key: ${key}`)
        try {
          await this.cache.delete(key)
          console.log(`✅ Deleted corrupted data for key: ${key}`)
        } catch (deleteError) {
          console.error(`❌ Failed to delete corrupted data for key ${key}:`, deleteError)
        }
      }

      return validation

    } catch (error) {
      return {
        isValid: false,
        errorType: 'cache_error',
        errorMessage: `Cache validation failed: ${error.message}`
      }
    }
  }

  /**
   * Comprehensive data integrity check
   */
  async performDataIntegrityCheck(keys: string[]): Promise<DataIntegrityReport> {
    console.log(`🔍 Starting data integrity check for ${keys.length} keys...`)
    
    const report: DataIntegrityReport = {
      totalKeys: keys.length,
      validKeys: 0,
      corruptedKeys: 0,
      fixedKeys: 0,
      errors: [],
      recommendations: []
    }

    for (const key of keys) {
      try {
        const validation = await this.validateAndFixCacheData(key)
        
        if (validation.isValid) {
          report.validKeys++
          if (validation.correctedValue) {
            report.fixedKeys++
          }
        } else {
          report.corruptedKeys++
          report.errors.push(`${key}: ${validation.errorMessage}`)
        }

      } catch (error) {
        report.corruptedKeys++
        report.errors.push(`${key}: Validation failed - ${error.message}`)
      }
    }

    // Generate recommendations
    if (report.corruptedKeys > 0) {
      report.recommendations.push('Some data corruption was detected and needs attention')
    }
    
    if (report.fixedKeys > 0) {
      report.recommendations.push(`${report.fixedKeys} corrupted entries were automatically fixed`)
    }
    
    if (report.validKeys === report.totalKeys) {
      report.recommendations.push('All cache data is valid and healthy')
    }

    console.log(`✅ Data integrity check completed`)
    console.log(`   Valid: ${report.validKeys}/${report.totalKeys}`)
    console.log(`   Fixed: ${report.fixedKeys}`)
    console.log(`   Corrupted: ${report.corruptedKeys}`)

    return report
  }

  /**
   * Emergency data recovery for circuit breakers
   */
  async emergencyCircuitBreakerRecovery(): Promise<boolean> {
    console.log('🚨 Starting emergency circuit breaker recovery...')
    
    const circuitBreakerKeys = [
      'circuit_breaker:twitter-api',
      'circuit_breaker:x-api',
      'circuit_breaker:tweet-tracker',
      'circuit_breaker:monitoring'
    ]

    let recoveredCount = 0

    for (const key of circuitBreakerKeys) {
      try {
        const validation = await this.validateAndFixCacheData(key)
        
        if (!validation.isValid) {
          // Force reset to default state
          const defaultStatus = this.createDefaultCircuitBreakerStatus()
          await this.cache.set(key, defaultStatus, 3600)
          console.log(`🔧 Emergency reset for ${key}`)
          recoveredCount++
        }

      } catch (error) {
        console.error(`❌ Emergency recovery failed for ${key}:`, error)
      }
    }

    console.log(`✅ Emergency recovery completed: ${recoveredCount} circuit breakers reset`)
    return recoveredCount > 0
  }
}

// Singleton instance
let validatorInstance: RedisDataValidator | null = null

export function getRedisDataValidator(): RedisDataValidator {
  if (!validatorInstance) {
    validatorInstance = new RedisDataValidator()
  }
  return validatorInstance
}
