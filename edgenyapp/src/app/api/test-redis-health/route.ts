import { NextResponse } from 'next/server'
import { getSimplifiedCircuitBreaker } from '@/lib/simplified-circuit-breaker'
import { getSimplifiedCacheService } from '@/lib/simplified-cache'
import { getRedisDataValidator } from '@/lib/redis-data-validator'

/**
 * API endpoint to test Redis health and data integrity
 * This helps diagnose and fix Redis data corruption issues
 */
export async function GET() {
  try {
    const cache = getSimplifiedCacheService()
    
    // Test basic Redis connectivity
    const connectivityTest = {
      canConnect: false,
      canWrite: false,
      canRead: false,
      error: null as string | null
    }
    
    try {
      const testKey = 'redis_health_test'
      const testValue = { test: true, timestamp: Date.now() }
      
      // Test write
      await cache.set(testKey, testValue, 60)
      connectivityTest.canWrite = true
      
      // Test read
      const retrieved = await cache.get(testKey) as any
      connectivityTest.canRead = retrieved && retrieved.test === true
      connectivityTest.canConnect = connectivityTest.canWrite && connectivityTest.canRead
      
      // Cleanup
      await cache.delete(testKey)
      
    } catch (error) {
      connectivityTest.error = error instanceof Error ? error.message : 'Unknown error'
    }
    
    // Test circuit breaker data integrity
    const circuitBreakerTests = []
    const circuitBreakerNames = ['twitter-api', 'x-api', 'tweet-tracker', 'monitoring']
    
    for (const name of circuitBreakerNames) {
      try {
        const circuitBreaker = getSimplifiedCircuitBreaker(name)
        const state = await circuitBreaker.getState()
        
        circuitBreakerTests.push({
          name,
          status: 'healthy',
          state: state
        })
        
      } catch (error) {
        circuitBreakerTests.push({
          name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Perform data integrity check on critical keys
    const criticalKeys = [
      'circuit_breaker:twitter-api',
      'circuit_breaker:x-api',
      'circuit_breaker:tweet-tracker',
      'circuit_breaker:monitoring'
    ]
    
    const validator = getRedisDataValidator()
    const integrityReport = await validator.performDataIntegrityCheck(criticalKeys)

    // Overall health assessment
    const overallHealth = {
      status: 'healthy' as 'healthy' | 'warning' | 'critical',
      issues: [] as string[],
      recommendations: [] as string[]
    }
    
    if (!connectivityTest.canConnect) {
      overallHealth.status = 'critical'
      overallHealth.issues.push('Redis connectivity failed')
      overallHealth.recommendations.push('Check Redis connection and credentials')
    }
    
    if (integrityReport.corruptedKeys > 0) {
      overallHealth.status = overallHealth.status === 'critical' ? 'critical' : 'warning'
      overallHealth.issues.push(`${integrityReport.corruptedKeys} corrupted cache entries found`)
      overallHealth.recommendations.push('Run Redis corruption fix script')
    }
    
    const unhealthyCircuitBreakers = circuitBreakerTests.filter(cb => cb.status === 'error').length
    if (unhealthyCircuitBreakers > 0) {
      overallHealth.status = overallHealth.status === 'critical' ? 'critical' : 'warning'
      overallHealth.issues.push(`${unhealthyCircuitBreakers} circuit breakers have errors`)
      overallHealth.recommendations.push('Reset circuit breakers and check underlying services')
    }
    
    if (overallHealth.issues.length === 0) {
      overallHealth.recommendations.push('Redis health looks good!')
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      
      // Connectivity test results
      connectivity: connectivityTest,
      
      // Circuit breaker health
      circuitBreakers: circuitBreakerTests,
      
      // Data integrity report
      dataIntegrity: integrityReport,
      
      // Overall assessment
      health: overallHealth,
      
      // Environment info
      environment: {
        nodeEnv: process.env.NODE_ENV,
        redisHost: process.env.REDIS_HOST,
        hasUpstashConfig: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
        cacheEnabled: process.env.ENABLE_CACHE === 'true'
      }
    })
    
  } catch (error) {
    console.error('Redis health check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      message: 'Redis health check failed'
    }, { status: 500 })
  }
}

/**
 * POST endpoint to perform emergency Redis recovery
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, adminSecret } = body
    
    // Simple admin verification
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const validator = getRedisDataValidator()
    let result = null
    
    switch (action) {
      case 'emergency_recovery':
        result = await validator.emergencyCircuitBreakerRecovery()
        break
        
      case 'validate_and_fix':
        const criticalKeys = [
          'circuit_breaker:twitter-api',
          'circuit_breaker:x-api',
          'circuit_breaker:tweet-tracker',
          'circuit_breaker:monitoring'
        ]
        result = await validator.performDataIntegrityCheck(criticalKeys)
        break
        
      case 'reset_circuit_breakers':
        const circuitBreakerNames = ['twitter-api', 'x-api', 'tweet-tracker', 'monitoring']
        const resetResults = []
        
        for (const name of circuitBreakerNames) {
          try {
            const circuitBreaker = getSimplifiedCircuitBreaker(name)
            await circuitBreaker.reset()
            resetResults.push({ name, status: 'reset' })
          } catch (error) {
            resetResults.push({ 
              name, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          }
        }
        
        result = resetResults
        break
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Redis recovery operation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
