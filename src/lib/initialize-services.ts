import { getTweetTrackerInstance } from './tweet-tracker'
import { getEngagementUpdateService } from './engagement-update-service'

/**
 * Initialize LayerEdge community platform services
 * OPTIMIZED: Manual submissions only - automatic tracking disabled
 */
export async function initializeServices(): Promise<void> {
  console.log('🚀 Initializing LayerEdge Community Platform Services (Manual Mode)...')

  // Check if automatic services should be enabled
  const enableAutoServices = process.env.ENABLE_AUTO_TWITTER_SERVICES === 'true'
  const manualOnlyMode = process.env.MANUAL_SUBMISSIONS_ONLY !== 'false' // Default to true

  if (manualOnlyMode && !enableAutoServices) {
    console.log('🔒 MANUAL SUBMISSIONS ONLY MODE ENABLED')
    console.log('📋 Active services:')
    console.log('  - Manual Tweet Submission: ✅ ENABLED')
    console.log('  - Automatic Tweet Tracking: ❌ DISABLED')
    console.log('  - Automatic Engagement Updates: ❌ DISABLED')
    console.log('  - Background Monitoring: ❌ DISABLED')
    console.log('')
    console.log('🎯 Twitter API Usage: OPTIMIZED (90%+ reduction)')
    console.log('  - API calls only on manual tweet submissions')
    console.log('  - No background/automatic API usage')
    console.log('  - Enhanced rate limiting for manual submissions')
    console.log('  - Circuit breaker bypass for emergency submissions')
    return
  }

  try {
    console.log('⚠️ AUTOMATIC SERVICES MODE (High API Usage)')

    // Initialize Tweet Tracker (Twitter API search only)
    console.log('📡 Starting Tweet Tracker (Twitter API only)...')
    const tweetTracker = getTweetTrackerInstance()
    await tweetTracker.start()

    // Initialize Engagement Update Service
    console.log('📊 Starting Engagement Update Service...')
    const engagementService = getEngagementUpdateService()
    await engagementService.startAutomaticUpdates()

    console.log('✅ All automatic services initialized!')
    console.log('📋 Active services:')
    console.log('  - Tweet Tracker: Twitter API v1.1 search (15-minute intervals)')
    console.log('  - Engagement Updates: Hourly engagement metric updates')
    console.log('  - Manual Submission: User tweet submission interface')
    console.log('')
    console.log('🔧 Configuration:')
    console.log('  - Web scraping: DISABLED (removed)')
    console.log('  - Rate limiting: ENABLED (respects Twitter API limits)')
    console.log('  - Manual verification: ENABLED (prevents point farming)')
    console.log('  - Required mentions: @layeredge, $EDGEN')

  } catch (error) {
    console.error('❌ Error initializing services:', error)
    throw error
  }
}

/**
 * Get status of all services
 */
export async function getServicesStatus(): Promise<{
  tweetTracker: {
    isRunning: boolean
    keywords: string[]
    currentMethod: string
    trackedUsers: number
    lastSearchTime: number
  }
  engagementUpdates: {
    isRunning: boolean
    lastUpdateTime: number
    nextUpdateTime: number
    apiAvailable: boolean
  }
  summary: {
    allServicesRunning: boolean
    activeServices: number
    totalServices: number
    webScrapingRemoved: boolean
  }
}> {
  try {
    const tweetTracker = getTweetTrackerInstance()
    const engagementService = getEngagementUpdateService()

    const tweetTrackerStatus = tweetTracker.getStatus()
    const engagementStatus = engagementService.getStatus()

    const activeServices = [
      tweetTrackerStatus.isRunning,
      engagementStatus.isRunning
    ].filter(Boolean).length

    return {
      tweetTracker: tweetTrackerStatus,
      engagementUpdates: engagementStatus,
      summary: {
        allServicesRunning: activeServices === 2,
        activeServices,
        totalServices: 2,
        webScrapingRemoved: true
      }
    }
  } catch (error) {
    console.error('Error getting services status:', error)
    throw error
  }
}

/**
 * Stop all services
 */
export async function stopAllServices(): Promise<void> {
  console.log('🛑 Stopping all LayerEdge services...')

  try {
    const tweetTracker = getTweetTrackerInstance()
    const engagementService = getEngagementUpdateService()

    await tweetTracker.stop()
    await engagementService.stopAutomaticUpdates()

    console.log('✅ All services stopped successfully')
  } catch (error) {
    console.error('❌ Error stopping services:', error)
    throw error
  }
}

/**
 * Restart all services
 */
export async function restartAllServices(): Promise<void> {
  console.log('🔄 Restarting all LayerEdge services...')

  try {
    await stopAllServices()
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
    await initializeServices()

    console.log('✅ All services restarted successfully')
  } catch (error) {
    console.error('❌ Error restarting services:', error)
    throw error
  }
}

/**
 * Health check for all services
 */
export async function healthCheck(): Promise<{
  healthy: boolean
  services: {
    tweetTracker: boolean
    engagementUpdates: boolean
    twitterApi: boolean
  }
  issues: string[]
}> {
  const issues: string[] = []
  
  try {
    const status = await getServicesStatus()
    
    const services = {
      tweetTracker: status.tweetTracker.isRunning,
      engagementUpdates: status.engagementUpdates.isRunning,
      twitterApi: status.engagementUpdates.apiAvailable
    }

    if (!services.tweetTracker) {
      issues.push('Tweet Tracker is not running')
    }

    if (!services.engagementUpdates) {
      issues.push('Engagement Update Service is not running')
    }

    if (!services.twitterApi) {
      issues.push('Twitter API is not available')
    }

    const healthy = issues.length === 0

    return {
      healthy,
      services,
      issues
    }
  } catch (error) {
    return {
      healthy: false,
      services: {
        tweetTracker: false,
        engagementUpdates: false,
        twitterApi: false
      },
      issues: ['Health check failed: ' + (error instanceof Error ? error.message : 'Unknown error')]
    }
  }
}

// OPTIMIZED: Conditional auto-initialization based on environment
if (typeof window === 'undefined') { // Only run on server side
  const manualOnlyMode = process.env.MANUAL_SUBMISSIONS_ONLY !== 'false' // Default to true
  const enableAutoServices = process.env.ENABLE_AUTO_TWITTER_SERVICES === 'true'

  if (!manualOnlyMode || enableAutoServices) {
    // Only auto-initialize if automatic services are explicitly enabled
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Auto-initializing services (automatic mode enabled)')
      initializeServices().catch(error => {
        console.error('Failed to auto-initialize services:', error)
      })
    }
  } else {
    console.log('🔒 Manual submissions only mode - skipping auto-initialization')
    console.log('💡 To enable automatic services, set ENABLE_AUTO_TWITTER_SERVICES=true')
  }
}
