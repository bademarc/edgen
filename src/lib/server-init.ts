import { initializeTweetTracking } from './startup'

// Track if initialization has been attempted
let initializationAttempted = false
let initializationPromise: Promise<void> | null = null

/**
 * Initialize server-side services once
 * This is called from API routes to ensure services are started
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
  
  // Create initialization promise
  initializationPromise = (async () => {
    try {
      console.log('🚀 Starting server initialization...')
      
      // Initialize tweet tracking system
      await initializeTweetTracking()
      
      console.log('✅ Server initialization completed')
    } catch (error) {
      console.error('❌ Server initialization failed:', error)
      // Don't throw - allow the app to continue functioning
    }
  })()

  await initializationPromise
}

// Auto-initialize when this module is imported on the server
if (typeof window === 'undefined') {
  // Only run on server-side
  ensureServerInitialization().catch(console.error)
}
