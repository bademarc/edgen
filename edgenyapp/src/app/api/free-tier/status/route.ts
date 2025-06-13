import { NextRequest, NextResponse } from 'next/server'
import { getFreeTierService } from '@/lib/free-tier-service'

export async function GET(request: NextRequest) {
  try {
    const freeTierService = getFreeTierService()
    
    // Get resource usage
    const resourceUsage = await freeTierService.checkResourceUsage()
    
    // Get basic stats
    const stats = await freeTierService.getBasicStats()
    
    // Health check
    const isHealthy = await freeTierService.healthCheck()
    
    return NextResponse.json({
      status: resourceUsage.status,
      healthy: isHealthy,
      usage: resourceUsage.details,
      stats,
      recommendations: getRecommendations(resourceUsage.status, resourceUsage.details),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Free tier status error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get free tier status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getRecommendations(status: string, details: any): string[] {
  const recommendations: string[] = []
  
  if (status === 'critical') {
    recommendations.push('🚨 CRITICAL: Consider upgrading to paid tier')
    recommendations.push('🔧 Enable emergency mode to reduce resource usage')
    recommendations.push('📊 Increase cache TTL to reduce cache commands')
  } else if (status === 'warning') {
    recommendations.push('⚠️ WARNING: Monitor usage closely')
    recommendations.push('💾 Consider longer cache TTL')
    recommendations.push('🔄 Reduce background job frequency')
  } else {
    recommendations.push('✅ All systems operating within free tier limits')
    recommendations.push('📈 Current usage is sustainable')
  }
  
  // Specific recommendations based on usage
  const cacheUsage = parseFloat(details.cacheUsage)
  const dbUsage = parseFloat(details.dbUsage)
  
  if (cacheUsage > 80) {
    recommendations.push('🗄️ Cache usage high - consider selective caching')
  }
  
  if (dbUsage > 80) {
    recommendations.push('🗃️ Database usage high - increase cache hit rate')
  }
  
  return recommendations
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    const freeTierService = getFreeTierService()
    
    if (action === 'emergency_mode') {
      await freeTierService.enableEmergencyMode()
      
      return NextResponse.json({
        success: true,
        message: 'Emergency mode enabled',
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Free tier action error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to execute action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
