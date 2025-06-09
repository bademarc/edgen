import { NextRequest, NextResponse } from 'next/server'
import { 
  getServicesStatus, 
  healthCheck, 
  initializeServices, 
  stopAllServices, 
  restartAllServices 
} from '@/lib/initialize-services'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'health':
        const health = await healthCheck()
        return NextResponse.json(health)

      case 'detailed':
        const detailedStatus = await getServicesStatus()
        return NextResponse.json(detailedStatus)

      default:
        // Basic status
        const status = await getServicesStatus()
        return NextResponse.json({
          summary: status.summary,
          timestamp: new Date().toISOString()
        })
    }

  } catch (error) {
    console.error('Services status API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get services status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    switch (action) {
      case 'start':
        await initializeServices()
        return NextResponse.json({
          success: true,
          message: 'All services started successfully'
        })

      case 'stop':
        await stopAllServices()
        return NextResponse.json({
          success: true,
          message: 'All services stopped successfully'
        })

      case 'restart':
        await restartAllServices()
        return NextResponse.json({
          success: true,
          message: 'All services restarted successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, or restart' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Services control API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to control services',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
