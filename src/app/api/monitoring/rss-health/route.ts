import { NextRequest, NextResponse } from 'next/server'
import { RSSMonitoringService } from '@/lib/rss-monitoring'

/**
 * RSS Feed Health Check API
 * Tests all RSS feeds to ensure they're accessible and returning valid data
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting RSS feed health check...')

    const rssService = new RSSMonitoringService()
    const feedStatus = rssService.getFeedStatus()
    
    // Test each feed for accessibility
    const healthResults = await Promise.allSettled(
      feedStatus.map(async (feed) => {
        const startTime = Date.now()
        
        try {
          console.log(`Testing feed: ${feed.name}`)
          
          const response = await fetch(feed.url, {
            headers: {
              'User-Agent': 'LayerEdge Community Bot 1.0 (https://edgen.koyeb.app)',
              'Accept': 'application/rss+xml, application/xml, text/xml'
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
          })

          const responseTime = Date.now() - startTime
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const xmlText = await response.text()
          
          // Basic validation - check if it contains RSS structure
          const hasRSSStructure = xmlText.includes('<rss') || xmlText.includes('<feed')
          const hasItems = xmlText.includes('<item') || xmlText.includes('<entry')
          
          if (!hasRSSStructure) {
            throw new Error('Response does not contain valid RSS/XML structure')
          }

          return {
            feedName: feed.name,
            url: feed.url,
            status: 'healthy',
            responseTime,
            hasItems,
            contentLength: xmlText.length,
            lastChecked: new Date().toISOString()
          }

        } catch (error) {
          const responseTime = Date.now() - startTime
          
          return {
            feedName: feed.name,
            url: feed.url,
            status: 'unhealthy',
            responseTime,
            error: error instanceof Error ? error.message : String(error),
            lastChecked: new Date().toISOString()
          }
        }
      })
    )

    // Process results
    const results = healthResults.map(result => 
      result.status === 'fulfilled' ? result.value : {
        feedName: 'Unknown',
        url: 'Unknown',
        status: 'error',
        error: 'Promise rejected',
        lastChecked: new Date().toISOString()
      }
    )

    const healthyFeeds = results.filter(r => r.status === 'healthy')
    const unhealthyFeeds = results.filter(r => r.status !== 'healthy')
    
    const overallHealth = healthyFeeds.length >= 2 ? 'healthy' : 'degraded'
    const averageResponseTime = results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length

    console.log(`✅ RSS health check completed: ${healthyFeeds.length}/${results.length} feeds healthy`)

    return NextResponse.json({
      success: true,
      overallHealth,
      summary: {
        totalFeeds: results.length,
        healthyFeeds: healthyFeeds.length,
        unhealthyFeeds: unhealthyFeeds.length,
        averageResponseTime: Math.round(averageResponseTime),
        healthPercentage: Math.round((healthyFeeds.length / results.length) * 100)
      },
      feeds: results,
      recommendations: generateHealthRecommendations(results),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ RSS health check failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'RSS health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

function generateHealthRecommendations(results: any[]): string[] {
  const recommendations: string[] = []
  
  const healthyCount = results.filter(r => r.status === 'healthy').length
  const totalCount = results.length
  
  if (healthyCount === 0) {
    recommendations.push('🚨 CRITICAL: All RSS feeds are down - switch to API monitoring immediately')
    recommendations.push('🔧 Check if Nitter instances are blocked or rate-limited')
    recommendations.push('🔄 Consider using alternative RSS feed providers')
  } else if (healthyCount < totalCount / 2) {
    recommendations.push('⚠️ WARNING: More than half of RSS feeds are unhealthy')
    recommendations.push('🔄 Rotate to backup feed instances')
    recommendations.push('📊 Monitor feed health more frequently')
  } else if (healthyCount < totalCount) {
    recommendations.push('ℹ️ Some RSS feeds are unhealthy but system is operational')
    recommendations.push('🔧 Investigate failing feeds for potential fixes')
  } else {
    recommendations.push('✅ All RSS feeds are healthy - optimal performance')
    recommendations.push('📈 RSS monitoring should be achieving 90% API reduction')
  }

  // Response time recommendations
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length

  if (avgResponseTime > 5000) {
    recommendations.push('🐌 RSS feeds are responding slowly - consider timeout adjustments')
  } else if (avgResponseTime > 2000) {
    recommendations.push('⏱️ RSS feed response times are acceptable but could be improved')
  }

  return recommendations
}

/**
 * POST endpoint to manually trigger RSS feed health check
 */
export async function POST(request: NextRequest) {
  return GET(request)
}
