import { NextRequest, NextResponse } from 'next/server'
import { getCacheCleanupService, emergencyCleanup } from '@/lib/cache-cleanup'

export async function POST(request: NextRequest) {
  try {
    // Basic admin authentication
    const adminSecret = request.headers.get('x-admin-secret')
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action } = await request.json()
    const cleanupService = getCacheCleanupService()

    switch (action) {
      case 'full-cleanup':
        const fullResults = await cleanupService.performFullCleanup()
        return NextResponse.json({
          success: true,
          message: 'Full cache cleanup completed',
          results: fullResults
        })

      case 'reset-circuit-breakers':
        await cleanupService.resetAllCircuitBreakers()
        return NextResponse.json({
          success: true,
          message: 'All circuit breakers reset to CLOSED state'
        })

      case 'clear-rate-limits':
        await cleanupService.clearAllRateLimits()
        return NextResponse.json({
          success: true,
          message: 'All rate limits cleared'
        })

      case 'emergency-cleanup':
        await emergencyCleanup()
        return NextResponse.json({
          success: true,
          message: 'Emergency cleanup completed - all systems reset'
        })

      case 'circuit-breakers-only':
        const cbResults = await cleanupService.cleanupCircuitBreakerCache()
        return NextResponse.json({
          success: true,
          message: 'Circuit breaker cache cleanup completed',
          results: cbResults
        })

      case 'rate-limits-only':
        const rlResults = await cleanupService.cleanupRateLimitCache()
        return NextResponse.json({
          success: true,
          message: 'Rate limit cache cleanup completed',
          results: rlResults
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: full-cleanup, reset-circuit-breakers, clear-rate-limits, emergency-cleanup, circuit-breakers-only, rate-limits-only' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Cache cleanup API error:', error)
    return NextResponse.json(
      {
        error: 'Cache cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Basic admin authentication
    const adminSecret = request.headers.get('x-admin-secret')
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: 'Cache Cleanup API',
      availableActions: [
        'full-cleanup - Comprehensive cleanup of all cache entries',
        'reset-circuit-breakers - Reset all circuit breakers to CLOSED state',
        'clear-rate-limits - Clear all rate limiting counters',
        'emergency-cleanup - Complete system reset (circuit breakers + rate limits + cleanup)',
        'circuit-breakers-only - Clean only circuit breaker cache entries',
        'rate-limits-only - Clean only rate limit cache entries'
      ],
      usage: {
        method: 'POST',
        headers: {
          'x-admin-secret': 'Your admin secret from environment variables',
          'Content-Type': 'application/json'
        },
        body: {
          action: 'One of the available actions above'
        }
      },
      examples: [
        {
          description: 'Emergency cleanup (recommended for fixing submission issues)',
          curl: `curl -X POST ${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/cache-cleanup \\
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "emergency-cleanup"}'`
        },
        {
          description: 'Full cleanup with detailed results',
          curl: `curl -X POST ${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/cache-cleanup \\
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "full-cleanup"}'`
        }
      ]
    })

  } catch (error) {
    console.error('❌ Cache cleanup API GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get cache cleanup info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
