import { initializeEngagementScheduler } from './engagement-scheduler'

/**
 * Initialize the engagement system
 * Call this from your main application startup
 */
export function initEngagementSystem() {
  // Only run on server side
  if (typeof window !== 'undefined') {
    return
  }

  try {
    console.log('🚀 Initializing LayerEdge Engagement System...')
    
    // Start the engagement scheduler
    initializeEngagementScheduler()
    
    console.log('✅ Engagement system initialized successfully')
    
    // Log system status
    const isSchedulerEnabled = process.env.ENABLE_ENGAGEMENT_SCHEDULER !== 'false'
    const updateInterval = process.env.ENGAGEMENT_UPDATE_INTERVAL_MINUTES || '30'
    
    console.log(`📊 Engagement System Status:`)
    console.log(`   - Scheduler Enabled: ${isSchedulerEnabled}`)
    console.log(`   - Update Interval: ${updateInterval} minutes`)
    console.log(`   - Twitter API Available: ${!!process.env.TWITTER_BEARER_TOKEN}`)
    console.log(`   - oEmbed Fallback: Enabled`)
    
  } catch (error) {
    console.error('❌ Failed to initialize engagement system:', error)
  }
}

/**
 * Health check for the engagement system
 */
export function checkEngagementSystemHealth() {
  const health = {
    schedulerEnabled: process.env.ENABLE_ENGAGEMENT_SCHEDULER !== 'false',
    twitterApiConfigured: !!process.env.TWITTER_BEARER_TOKEN,
    updateInterval: parseInt(process.env.ENGAGEMENT_UPDATE_INTERVAL_MINUTES || '30'),
    timestamp: new Date().toISOString()
  }
  
  console.log('🏥 Engagement System Health Check:', health)
  return health
}
