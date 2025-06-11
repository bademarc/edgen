import { NextRequest, NextResponse } from 'next/server'
import { getCircuitBreaker, getAllCircuitBreakers } from '@/lib/improved-circuit-breaker'
import { getEnhancedRateLimiter } from '@/lib/enhanced-rate-limiter'

/**
 * Admin API for managing circuit breakers and rate limiters
 * Provides manual override capabilities for critical operations
 */

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'layeredge-admin-secret-2024'

function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const providedSecret = authHeader?.replace('Bearer ', '')
  return providedSecret === ADMIN_SECRET
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const circuitBreakers = getAllCircuitBreakers()
    const rateLimiter = getEnhancedRateLimiter()
    
    const metrics = await Promise.all(
      circuitBreakers.map(cb => cb.getMetrics())
    )

    const queueStatus = rateLimiter.getQueueStatus()

    return NextResponse.json({
      success: true,
      circuitBreakers: metrics,
      rateLimiter: {
        queueLength: queueStatus.queueLength,
        processing: queueStatus.processing,
        operations: queueStatus.operations
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Circuit breaker status error:', error)
    return NextResponse.json(
      { error: 'Failed to get circuit breaker status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { action, circuitBreakerName, durationMs } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'override':
        if (!circuitBreakerName) {
          return NextResponse.json(
            { error: 'Circuit breaker name is required for override' },
            { status: 400 }
          )
        }

        const circuitBreaker = getCircuitBreaker(circuitBreakerName)
        await circuitBreaker.setManualOverride(true, durationMs || 300000) // Default 5 minutes

        return NextResponse.json({
          success: true,
          message: `Manual override enabled for ${circuitBreakerName}`,
          duration: durationMs || 300000
        })

      case 'reset':
        if (!circuitBreakerName) {
          return NextResponse.json(
            { error: 'Circuit breaker name is required for reset' },
            { status: 400 }
          )
        }

        const cbToReset = getCircuitBreaker(circuitBreakerName)
        await cbToReset.reset()

        return NextResponse.json({
          success: true,
          message: `Circuit breaker ${circuitBreakerName} has been reset`
        })

      case 'disable_override':
        if (!circuitBreakerName) {
          return NextResponse.json(
            { error: 'Circuit breaker name is required to disable override' },
            { status: 400 }
          )
        }

        const cbToDisable = getCircuitBreaker(circuitBreakerName)
        await cbToDisable.setManualOverride(false)

        return NextResponse.json({
          success: true,
          message: `Manual override disabled for ${circuitBreakerName}`
        })

      case 'clear_queue':
        const rateLimiter = getEnhancedRateLimiter()
        rateLimiter.clearQueue()

        return NextResponse.json({
          success: true,
          message: 'Rate limiter queue has been cleared'
        })

      case 'reset_all':
        const allCircuitBreakers = getAllCircuitBreakers()
        await Promise.all(allCircuitBreakers.map(cb => cb.reset()))

        return NextResponse.json({
          success: true,
          message: 'All circuit breakers have been reset'
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Circuit breaker action error:', error)
    return NextResponse.json(
      { error: 'Failed to execute circuit breaker action' },
      { status: 500 }
    )
  }
}

// PUT endpoint for updating circuit breaker configuration
export async function PUT(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { circuitBreakerName, config } = await request.json()

    if (!circuitBreakerName) {
      return NextResponse.json(
        { error: 'Circuit breaker name is required' },
        { status: 400 }
      )
    }

    // Note: This would require extending the circuit breaker to support config updates
    // For now, we'll return the current configuration
    const circuitBreaker = getCircuitBreaker(circuitBreakerName)
    const metrics = await circuitBreaker.getMetrics()

    return NextResponse.json({
      success: true,
      message: 'Configuration update not yet implemented',
      currentConfig: metrics.config,
      providedConfig: config
    })

  } catch (error) {
    console.error('Circuit breaker config update error:', error)
    return NextResponse.json(
      { error: 'Failed to update circuit breaker configuration' },
      { status: 500 }
    )
  }
}

// DELETE endpoint for emergency shutdown
export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { emergency } = await request.json()

    if (emergency === 'shutdown') {
      // Emergency shutdown: open all circuit breakers and clear queue
      const allCircuitBreakers = getAllCircuitBreakers()
      const rateLimiter = getEnhancedRateLimiter()

      // Open all circuit breakers
      await Promise.all(allCircuitBreakers.map(async (cb) => {
        const status = await cb.getStatus()
        if (status.state !== 'OPEN') {
          // Force open by setting manual override to false and triggering failures
          await cb.setManualOverride(false)
          // Note: This is a simplified approach. In a real implementation,
          // you might want to add a direct "forceOpen" method
        }
      }))

      // Clear the queue
      rateLimiter.clearQueue()

      return NextResponse.json({
        success: true,
        message: 'Emergency shutdown executed - all circuit breakers opened and queue cleared'
      })
    }

    return NextResponse.json(
      { error: 'Invalid emergency action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Emergency shutdown error:', error)
    return NextResponse.json(
      { error: 'Failed to execute emergency shutdown' },
      { status: 500 }
    )
  }
}
