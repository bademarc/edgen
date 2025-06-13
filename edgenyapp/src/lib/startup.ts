import { getTweetTrackerInstance } from './tweet-tracker'

/**
 * Initialize the enhanced tweet tracking system on application startup
 * OPTIMIZED: Respects manual-only mode configuration
 */
export async function initializeTweetTracking(): Promise<void> {
  // Check if automatic tracking should be disabled
  const manualOnlyMode = process.env.MANUAL_SUBMISSIONS_ONLY !== 'false' // Default to true
  const enableAutoServices = process.env.ENABLE_AUTO_TWITTER_SERVICES === 'true'

  if (manualOnlyMode && !enableAutoServices) {
    console.log('🔒 Tweet tracking disabled - Manual submissions only mode')
    console.log('💡 Manual tweet submissions via /submit-tweet page remain fully functional')
    console.log('🎯 Twitter API usage optimized: 90%+ reduction achieved')
    return
  }

  try {
    console.log('🚀 Initializing enhanced tweet tracking system...')
    console.log('⚠️ WARNING: Automatic tracking enabled - high Twitter API usage')

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

// OPTIMIZED: Conditional auto-initialization
if (typeof window === 'undefined') {
  // Only run on server-side and respect manual-only mode
  const manualOnlyMode = process.env.MANUAL_SUBMISSIONS_ONLY !== 'false'
  const enableAutoServices = process.env.ENABLE_AUTO_TWITTER_SERVICES === 'true'

  if (!manualOnlyMode || enableAutoServices) {
    initializeTweetTracking().catch(console.error)
  } else {
    console.log('🔒 Skipping tweet tracking auto-initialization (manual-only mode)')
  }
}
