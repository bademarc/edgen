import { EngagementPointsService } from './engagement-points-service'
import { prisma } from './db'

/**
 * Engagement Scheduler
 * Handles periodic updates of tweet engagement metrics
 */
export class EngagementScheduler {
  private engagementService: EngagementPointsService
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null

  constructor() {
    this.engagementService = new EngagementPointsService()
  }

  /**
   * Start the engagement update scheduler
   */
  start(intervalMinutes = 30): void {
    if (this.isRunning) {
      console.log('⚠️ Engagement scheduler is already running')
      return
    }

    console.log(`🚀 Starting engagement scheduler (every ${intervalMinutes} minutes)`)
    
    // Run immediately
    this.runUpdate()

    // Schedule periodic updates
    this.intervalId = setInterval(() => {
      this.runUpdate()
    }, intervalMinutes * 60 * 1000)

    this.isRunning = true
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('🛑 Engagement scheduler stopped')
  }

  /**
   * Run a single update cycle
   */
  private async runUpdate(): Promise<void> {
    try {
      console.log('🔄 Running scheduled engagement update...')

      // Get tweets that need engagement updates (prioritize recent ones)
      const { prisma } = await import('@/lib/db')
      const tweetsToUpdate = await prisma.tweet.findMany({
        where: {
          OR: [
            { lastEngagementUpdate: null },
            {
              lastEngagementUpdate: {
                lt: new Date(Date.now() - 2 * 60 * 60 * 1000) // Older than 2 hours
              }
            }
          ]
        },
        orderBy: { submittedAt: 'desc' },
        take: 50 // Process 50 tweets at a time
      })

      console.log(`📊 Found ${tweetsToUpdate.length} tweets needing engagement updates`)

      if (tweetsToUpdate.length === 0) {
        console.log('✅ All tweets are up to date')
        return
      }

      const result = await this.engagementService.batchUpdateEngagement(tweetsToUpdate.length)

      // Log results to database for monitoring
      await this.logUpdateResults(result)

      console.log(`✅ Scheduled update complete: ${result.updated} tweets updated, ${result.totalPointsAwarded} points awarded`)

    } catch (error) {
      console.error('❌ Scheduled engagement update failed:', error)

      // Log error to database
      await this.logError(error)
    }
  }

  /**
   * Log update results for monitoring
   */
  private async logUpdateResults(result: {
    processed: number
    updated: number
    totalPointsAwarded: number
  }): Promise<void> {
    try {
      await prisma.trackingLog.create({
        data: {
          method: 'engagement_scheduler',
          success: true,
          tweetsFound: result.processed,
          metadata: {
            updated: result.updated,
            totalPointsAwarded: result.totalPointsAwarded,
            timestamp: new Date().toISOString()
          }
        }
      })
    } catch (error) {
      console.error('Failed to log update results:', error)
    }
  }

  /**
   * Log errors for monitoring
   */
  private async logError(error: any): Promise<void> {
    try {
      await prisma.trackingLog.create({
        data: {
          method: 'engagement_scheduler',
          success: false,
          tweetsFound: 0,
          error: error instanceof Error ? error.message : String(error),
          metadata: {
            timestamp: new Date().toISOString()
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean
    nextUpdate?: Date
  } {
    return {
      isRunning: this.isRunning,
      nextUpdate: this.intervalId ? new Date(Date.now() + 30 * 60 * 1000) : undefined
    }
  }

  /**
   * Force an immediate update
   */
  async forceUpdate(): Promise<{
    processed: number
    updated: number
    totalPointsAwarded: number
  }> {
    console.log('🔧 Force running engagement update...')
    return await this.engagementService.batchUpdateEngagement(200)
  }
}

// Global scheduler instance
let globalScheduler: EngagementScheduler | null = null

/**
 * Get or create the global scheduler instance
 */
export function getEngagementScheduler(): EngagementScheduler {
  if (!globalScheduler) {
    globalScheduler = new EngagementScheduler()
  }
  return globalScheduler
}

/**
 * Initialize engagement scheduler if enabled
 */
export function initializeEngagementScheduler(): void {
  const isEnabled = process.env.ENABLE_ENGAGEMENT_SCHEDULER !== 'false'
  
  if (!isEnabled) {
    console.log('📴 Engagement scheduler disabled via environment variable')
    return
  }

  const scheduler = getEngagementScheduler()
  
  // Start with 30-minute intervals by default
  const intervalMinutes = parseInt(process.env.ENGAGEMENT_UPDATE_INTERVAL_MINUTES || '30')
  
  scheduler.start(intervalMinutes)
  
  console.log('✅ Engagement scheduler initialized')
}
