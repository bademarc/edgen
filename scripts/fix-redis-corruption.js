#!/usr/bin/env node

/**
 * Redis Data Corruption Fix Script
 * 
 * This script identifies and fixes corrupted Redis data that's causing
 * the Twitter API circuit breaker to malfunction. It specifically targets
 * "[object Object]" corruption and other serialization issues.
 */

import { getCacheService } from '../src/lib/cache.js'
import { getCircuitBreaker } from '../src/lib/improved-circuit-breaker.js'

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message) {
  console.log(message)
}

function logStep(step, message) {
  log(`${colors.blue}[${step}]${colors.reset} ${message}`)
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`)
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`)
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`)
}

// Known corrupted data patterns
const CORRUPTED_PATTERNS = [
  '[object Object]',
  'undefined',
  'null',
  '[object Promise]',
  '[object Function]',
  'NaN',
  'Infinity'
]

// Circuit breaker keys to check
const CIRCUIT_BREAKER_KEYS = [
  'circuit_breaker:twitter-api',
  'circuit_breaker:x-api',
  'circuit_breaker:tweet-tracker',
  'circuit_breaker:monitoring'
]

async function testRedisConnection() {
  logStep('CONNECTION', 'Testing Redis connection...')
  
  const cache = getCacheService()
  
  try {
    // Test basic connectivity
    const testKey = 'redis_health_test'
    const testValue = { test: true, timestamp: Date.now() }
    
    await cache.set(testKey, testValue, 60)
    const retrieved = await cache.get(testKey)
    
    if (retrieved && retrieved.test === true) {
      logSuccess('Redis connection is working')
      await cache.delete(testKey)
      return true
    } else {
      logError('Redis connection test failed - data mismatch')
      return false
    }
  } catch (error) {
    logError(`Redis connection test failed: ${error.message}`)
    return false
  }
}

async function scanForCorruptedData() {
  logStep('SCAN', 'Scanning for corrupted data patterns...')
  
  const cache = getCacheService()
  const corruptedKeys = []
  
  // Check circuit breaker keys specifically
  for (const key of CIRCUIT_BREAKER_KEYS) {
    try {
      const rawValue = await cache.get(key)
      
      if (rawValue === null) {
        log(`   ${key}: not found (OK)`)
        continue
      }
      
      // Check if the value is corrupted
      const stringValue = String(rawValue)
      const isCorrupted = CORRUPTED_PATTERNS.some(pattern => 
        stringValue === pattern || stringValue.includes(pattern)
      )
      
      if (isCorrupted) {
        logWarning(`Found corrupted data in ${key}: ${stringValue}`)
        corruptedKeys.push(key)
      } else {
        logSuccess(`${key}: data looks valid`)
      }
      
    } catch (error) {
      logError(`Error checking ${key}: ${error.message}`)
      corruptedKeys.push(key)
    }
  }
  
  return corruptedKeys
}

async function cleanCorruptedData(corruptedKeys) {
  logStep('CLEAN', 'Cleaning corrupted data...')
  
  const cache = getCacheService()
  let cleanedCount = 0
  
  for (const key of corruptedKeys) {
    try {
      await cache.delete(key)
      logSuccess(`Cleaned corrupted data from ${key}`)
      cleanedCount++
    } catch (error) {
      logError(`Failed to clean ${key}: ${error.message}`)
    }
  }
  
  return cleanedCount
}

async function resetCircuitBreakers() {
  logStep('RESET', 'Resetting circuit breakers...')
  
  const circuitBreakerNames = ['twitter-api', 'x-api', 'tweet-tracker', 'monitoring']
  let resetCount = 0
  
  for (const name of circuitBreakerNames) {
    try {
      const circuitBreaker = getCircuitBreaker(name)
      await circuitBreaker.reset()
      logSuccess(`Reset circuit breaker: ${name}`)
      resetCount++
    } catch (error) {
      logError(`Failed to reset circuit breaker ${name}: ${error.message}`)
    }
  }
  
  return resetCount
}

async function validateCircuitBreakerData() {
  logStep('VALIDATE', 'Validating circuit breaker data integrity...')
  
  const cache = getCacheService()
  const validationResults = []
  
  for (const key of CIRCUIT_BREAKER_KEYS) {
    try {
      const data = await cache.get(key)
      
      if (data === null) {
        validationResults.push({ key, status: 'empty', valid: true })
        continue
      }
      
      // Validate circuit breaker data structure
      const isValid = data && 
                     typeof data === 'object' &&
                     typeof data.state === 'string' &&
                     typeof data.failureCount === 'number' &&
                     typeof data.lastFailureTime === 'number'
      
      if (isValid) {
        logSuccess(`${key}: valid circuit breaker data`)
        validationResults.push({ key, status: 'valid', valid: true, data })
      } else {
        logWarning(`${key}: invalid circuit breaker data structure`)
        validationResults.push({ key, status: 'invalid', valid: false, data })
      }
      
    } catch (error) {
      logError(`Validation error for ${key}: ${error.message}`)
      validationResults.push({ key, status: 'error', valid: false, error: error.message })
    }
  }
  
  return validationResults
}

async function testTwitterApiCircuitBreaker() {
  logStep('TEST', 'Testing Twitter API circuit breaker functionality...')
  
  try {
    const twitterCircuitBreaker = getCircuitBreaker('twitter-api')
    
    // Get current status
    const status = await twitterCircuitBreaker.getStatus()
    logSuccess(`Twitter API circuit breaker status: ${status.state}`)
    logSuccess(`Failure count: ${status.failureCount}`)
    logSuccess(`Manual override: ${status.isManuallyOverridden}`)
    
    // Test a simple operation
    const testOperation = async () => {
      // Simulate a successful operation
      return { success: true, timestamp: Date.now() }
    }
    
    const result = await twitterCircuitBreaker.execute(testOperation)
    
    if (result && result.success) {
      logSuccess('Circuit breaker test operation successful')
      return true
    } else {
      logError('Circuit breaker test operation failed')
      return false
    }
    
  } catch (error) {
    logError(`Circuit breaker test failed: ${error.message}`)
    return false
  }
}

async function generateHealthReport() {
  logStep('REPORT', 'Generating Redis health report...')
  
  const cache = getCacheService()
  
  const report = {
    timestamp: new Date().toISOString(),
    redisConnection: false,
    corruptedDataFound: 0,
    circuitBreakersHealthy: 0,
    totalCircuitBreakers: CIRCUIT_BREAKER_KEYS.length,
    recommendations: []
  }
  
  try {
    // Test connection
    report.redisConnection = await testRedisConnection()
    
    // Scan for corruption
    const corruptedKeys = await scanForCorruptedData()
    report.corruptedDataFound = corruptedKeys.length
    
    // Validate circuit breakers
    const validationResults = await validateCircuitBreakerData()
    report.circuitBreakersHealthy = validationResults.filter(r => r.valid).length
    
    // Generate recommendations
    if (!report.redisConnection) {
      report.recommendations.push('Fix Redis connection issues')
    }
    
    if (report.corruptedDataFound > 0) {
      report.recommendations.push('Clean corrupted data from Redis')
    }
    
    if (report.circuitBreakersHealthy < report.totalCircuitBreakers) {
      report.recommendations.push('Reset and reconfigure circuit breakers')
    }
    
    if (report.recommendations.length === 0) {
      report.recommendations.push('Redis health looks good!')
    }
    
    return report
    
  } catch (error) {
    logError(`Health report generation failed: ${error.message}`)
    report.error = error.message
    return report
  }
}

async function main() {
  log(`${colors.bright}🔧 LayerEdge Redis Data Corruption Fix${colors.reset}\n`)
  
  const operations = [
    { name: 'Redis Connection Test', fn: testRedisConnection },
    { name: 'Corrupted Data Scan', fn: scanForCorruptedData },
    { name: 'Circuit Breaker Validation', fn: validateCircuitBreakerData },
    { name: 'Twitter API Circuit Breaker Test', fn: testTwitterApiCircuitBreaker }
  ]
  
  const results = []
  let corruptedKeys = []
  
  for (const operation of operations) {
    try {
      log(`\n${colors.cyan}Running: ${operation.name}${colors.reset}`)
      const result = await operation.fn()
      
      if (operation.name === 'Corrupted Data Scan') {
        corruptedKeys = result || []
      }
      
      results.push({ name: operation.name, success: !!result, result })
    } catch (error) {
      logError(`${operation.name} failed: ${error.message}`)
      results.push({ name: operation.name, success: false, error: error.message })
    }
  }
  
  // Clean corrupted data if found
  if (corruptedKeys.length > 0) {
    log(`\n${colors.cyan}Cleaning corrupted data...${colors.reset}`)
    const cleanedCount = await cleanCorruptedData(corruptedKeys)
    logSuccess(`Cleaned ${cleanedCount} corrupted entries`)
    
    // Reset circuit breakers after cleaning
    log(`\n${colors.cyan}Resetting circuit breakers...${colors.reset}`)
    const resetCount = await resetCircuitBreakers()
    logSuccess(`Reset ${resetCount} circuit breakers`)
  }
  
  // Generate final health report
  log(`\n${colors.cyan}Generating health report...${colors.reset}`)
  const healthReport = await generateHealthReport()
  
  // Summary
  log(`\n${colors.bright}📊 Fix Results Summary${colors.reset}`)
  log('─'.repeat(50))
  
  let successCount = 0
  for (const result of results) {
    const status = result.success ? 
      `${colors.green}✅ PASS${colors.reset}` : 
      `${colors.red}❌ FAIL${colors.reset}`
    
    log(`${result.name.padEnd(30)} ${status}`)
    
    if (result.success) {
      successCount++
    }
  }
  
  log('─'.repeat(50))
  log(`Total: ${results.length} | Passed: ${successCount} | Failed: ${results.length - successCount}`)
  
  // Health report summary
  log(`\n${colors.blue}🏥 Health Report:${colors.reset}`)
  log(`Redis Connection: ${healthReport.redisConnection ? '✅ OK' : '❌ FAILED'}`)
  log(`Corrupted Data: ${healthReport.corruptedDataFound} entries`)
  log(`Circuit Breakers: ${healthReport.circuitBreakersHealthy}/${healthReport.totalCircuitBreakers} healthy`)
  
  log(`\n${colors.blue}📋 Recommendations:${colors.reset}`)
  for (const rec of healthReport.recommendations) {
    log(`• ${rec}`)
  }
  
  if (successCount === results.length && healthReport.corruptedDataFound === 0) {
    log(`\n${colors.green}${colors.bright}🎉 Redis corruption fix completed successfully!${colors.reset}`)
    log(`${colors.green}✅ Twitter API circuit breaker should now work correctly${colors.reset}`)
  } else {
    log(`\n${colors.yellow}${colors.bright}⚠️  Some issues remain. Check the output above for details.${colors.reset}`)
  }
}

// Handle async execution
main().catch(error => {
  logError(`Fix script failed: ${error.message}`)
  process.exit(1)
});
