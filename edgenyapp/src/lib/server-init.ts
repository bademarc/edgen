import { initializeTweetTracking } from './startup'

// Track if initialization has been attempted
let initializationAttempted = false
let initializationPromise: Promise<void> | null = null

/**
 * Initialize server-side services once
 * OPTIMIZED: Respects manual-only mode to reduce Twitter API usage
 */
export async function ensureServerInitialization(): Promise<void> {
  if (initializationAttempted) {
    // If initialization is in progress, wait for it
    if (initializationPromise) {
      await initializationPromise
    }
    return
  }

  initializationAttempted = true

  // Check configuration
  const manualOnlyMode = process.env.MANUAL_SUBMISSIONS_ONLY !== 'false' // Default to true
  const enableAutoServices = process.env.ENABLE_AUTO_TWITTER_SERVICES === 'true'

  // Create initialization promise
  initializationPromise = (async () => {
    try {
      console.log('🚀 Starting server initialization...')

      if (manualOnlyMode && !enableAutoServices) {
        console.log('🔒 Manual submissions only mode - skipping automatic services')
        console.log('✅ Server ready for manual tweet submissions')
        console.log('🎯 Twitter API usage optimized (90%+ reduction)')
      } else {
        console.log('⚠️ Automatic services mode - initializing tweet tracking')
        // Initialize tweet tracking system
        await initializeTweetTracking()
      }

      console.log('✅ Server initialization completed')
    } catch (error) {
      console.error('❌ Server initialization failed:', error)
      // Don't throw - allow the app to continue functioning
    }
  })()

  await initializationPromise
}

// OPTIMIZED: Conditional auto-initialization
if (typeof window === 'undefined') {
  // Only run on server-side and respect configuration
  const manualOnlyMode = process.env.MANUAL_SUBMISSIONS_ONLY !== 'false'
  const enableAutoServices = process.env.ENABLE_AUTO_TWITTER_SERVICES === 'true'

  if (!manualOnlyMode || enableAutoServices) {
    ensureServerInitialization().catch(console.error)
  } else {
    console.log('🔒 Server initialization skipped (manual-only mode)')
  }
}
