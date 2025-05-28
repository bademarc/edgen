import { getTweetTrackerInstance } from './tweet-tracker'

/**
 * Initialize the enhanced tweet tracking system on application startup
 */
export async function initializeTweetTracking(): Promise<void> {
  try {
    console.log('🚀 Initializing enhanced tweet tracking system...')
    
    // Get the tweet tracker instance
    const tweetTracker = getTweetTrackerInstance()
    
    // Start the tracking system
    await tweetTracker.start()
    
    console.log('✅ Enhanced tweet tracking system initialized successfully')
    
    // Log current status
    const status = tweetTracker.getStatus()
    console.log('📊 Tracking Status:', {
      isRunning: status.isRunning,
      keywords: status.keywords,
      currentMethod: status.currentMethod,
      trackedUsers: status.trackedUsers
    })
    
  } catch (error) {
    console.error('❌ Failed to initialize tweet tracking system:', error)
    
    // Don't throw the error to prevent app startup failure
    // The system can still function without the enhanced tracking
    console.log('⚠️ Application will continue without enhanced tweet tracking')
  }
}

/**
 * Graceful shutdown of the tweet tracking system
 */
export async function shutdownTweetTracking(): Promise<void> {
  try {
    console.log('🛑 Shutting down tweet tracking system...')
    
    const tweetTracker = getTweetTrackerInstance()
    await tweetTracker.stop()
    
    console.log('✅ Tweet tracking system shut down successfully')
  } catch (error) {
    console.error('❌ Error during tweet tracking shutdown:', error)
  }
}

// Auto-initialize if this module is imported
if (typeof window === 'undefined') {
  // Only run on server-side
  initializeTweetTracking().catch(console.error)
}
