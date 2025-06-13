import { NextRequest, NextResponse } from 'next/server'
import { getSimplifiedCacheService } from '@/lib/simplified-cache'

/**
 * Redis Health Check API
 * Tests Redis connection and tiered caching functionality
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting Redis health check...')

    const cache = getSimplifiedCacheService()

    // Test basic Redis connection
    const redisTest = await cache.testRedisConnection()

    // Test tiered cache functionality
    const tieredTest = await cache.testTieredCache()

    // Get current cache statistics
    const stats = cache.getStats()
    
    // Test environment variables
    const envCheck = {
      redisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      redisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      redisUrlFormat: process.env.UPSTASH_REDIS_REST_URL?.startsWith('https://'),
      redisTokenLength: process.env.UPSTASH_REDIS_REST_TOKEN?.length || 0
    }

    // Determine overall health
    const overallHealth = redisTest.success && tieredTest.success ? 'healthy' : 'unhealthy'
    
    // Generate recommendations
    const recommendations = generateRedisRecommendations(redisTest, tieredTest, envCheck, stats)

    console.log(`✅ Redis health check completed: ${overallHealth}`)

    return NextResponse.json({
      success: true,
      overallHealth,
      redis: {
        connection: redisTest.success ? 'healthy' : 'unhealthy',
        responseTime: redisTest.latency || 0,
        error: redisTest.error
      },
      tieredCache: {
        overall: tieredTest.success ? 'healthy' : 'unhealthy',
        l1Cache: tieredTest.memoryWorking ? 'working' : 'not working',
        l2Cache: tieredTest.redisWorking ? 'working' : 'not working',
        error: tieredTest.error
      },
      statistics: {
        l1Size: stats.memoryEntries,
        totalRequests: stats.commandCount,
        hitRate: 0, // Not available in simplified stats
        l1HitRate: 0, // Not available in simplified stats
        l2HitRate: 0, // Not available in simplified stats
        performance: getPerformanceRating(0)
      },
      environment: {
        redisConfigured: envCheck.redisUrl && envCheck.redisToken,
        redisUrl: envCheck.redisUrl ? 'configured' : 'missing',
        redisToken: envCheck.redisToken ? 'configured' : 'missing',
        urlFormat: envCheck.redisUrlFormat ? 'valid' : 'invalid',
        tokenLength: envCheck.redisTokenLength
      },
      recommendations,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Redis health check failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        overallHealth: 'error',
        error: 'Redis health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

function generateRedisRecommendations(
  redisTest: any, 
  tieredTest: any, 
  envCheck: any, 
  stats: any
): string[] {
  const recommendations: string[] = []

  // Redis connection issues
  if (!redisTest.success) {
    if (!envCheck.redisUrl || !envCheck.redisToken) {
      recommendations.push('🚨 CRITICAL: Redis environment variables not configured')
      recommendations.push('🔧 Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Koyeb')
    } else if (!envCheck.redisUrlFormat) {
      recommendations.push('🚨 CRITICAL: Redis URL format is invalid - should start with https://')
    } else if (envCheck.redisTokenLength < 30) {
      recommendations.push('🚨 CRITICAL: Redis token appears to be invalid - check token format')
    } else if (redisTest.error?.includes('WRONGPASS')) {
      recommendations.push('🚨 CRITICAL: Redis authentication failed - verify token is correct')
      recommendations.push('🔧 Expected token: acd4b50ce33b4436b09f6f278848dfb7')
    } else if (redisTest.error?.includes('timeout')) {
      recommendations.push('⚠️ Redis connection timeout - check network connectivity')
    } else {
      recommendations.push('🚨 Redis connection failed - check Upstash service status')
    }
  }

  // Tiered cache issues
  if (!tieredTest.l1Working) {
    recommendations.push('⚠️ L1 (memory) cache not working - check memory limits')
  }
  
  if (!tieredTest.l2Working) {
    recommendations.push('🚨 L2 (Redis) cache not working - 60% optimization not achieved')
  }

  // Performance recommendations
  if (stats.hitRate < 50 && stats.totalRequests > 100) {
    recommendations.push('📈 Cache hit rate is low - consider increasing TTL values')
  } else if (stats.hitRate > 80) {
    recommendations.push('✅ Excellent cache performance - 60% Redis optimization likely achieved')
  }

  if (stats.l1HitRate < 20 && stats.totalRequests > 100) {
    recommendations.push('🔧 L1 cache underutilized - adjust cache promotion strategy')
  }

  // Success recommendations
  if (redisTest.success && tieredTest.success) {
    recommendations.push('✅ Redis and tiered caching are working correctly')
    recommendations.push('📊 60% Redis optimization should be active')
    
    if (redisTest.responseTime < 100) {
      recommendations.push('⚡ Excellent Redis response time - optimal performance')
    } else if (redisTest.responseTime > 500) {
      recommendations.push('🐌 Redis response time is slow - monitor network latency')
    }
  }

  return recommendations
}

function getPerformanceRating(hitRate: number): string {
  if (hitRate >= 80) return 'excellent'
  if (hitRate >= 70) return 'good'
  if (hitRate >= 50) return 'fair'
  if (hitRate >= 30) return 'poor'
  return 'critical'
}

/**
 * POST endpoint to reset cache statistics
 */
export async function POST(request: NextRequest) {
  try {
    const cache = getSimplifiedCacheService()
    cache.resetStats()
    
    return NextResponse.json({
      success: true,
      message: 'Cache statistics reset successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset cache statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
