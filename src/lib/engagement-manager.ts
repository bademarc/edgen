/**
 * Global Engagement Manager
 * Prevents duplicate engagement update requests when multiple components
 * are using the useRealTimeEngagement hook simultaneously
 */

interface Tweet {
  id: string
  url: string
  content?: string | null
  likes: number
  retweets: number
  replies: number
  totalPoints: number
  createdAt: string
  lastEngagementUpdate?: string | null
  user: {
    id: string
    name: string | null
    xUsername: string | null
    image: string | null
  }
}



interface EngagementUpdateResult {
  success: boolean
  tweets?: Tweet[]
  error?: string
  requestId: string
}

class EngagementManager {
  private activeRequests = new Map<string, Promise<EngagementUpdateResult>>()
  private lastUpdateTimes = new Map<string, number>()
  private subscribers = new Set<(result: EngagementUpdateResult) => void>()
  private readonly MIN_UPDATE_INTERVAL = 10000 // 10 seconds minimum between updates for same tweets

  /**
   * Subscribe to engagement update results
   */
  subscribe(callback: (result: EngagementUpdateResult) => void): () => void {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Notify all subscribers of an update result
   */
  private notifySubscribers(result: EngagementUpdateResult) {
    this.subscribers.forEach(callback => {
      try {
        callback(result)
      } catch (error) {
        console.error('Error in engagement update subscriber:', error)
      }
    })
  }

  /**
   * Generate a cache key for a set of tweet IDs
   */
  private getCacheKey(tweetIds: string[]): string {
    return tweetIds.sort().join(',')
  }

  /**
   * Check if tweets were recently updated
   */
  private isRecentlyUpdated(tweetIds: string[]): boolean {
    const cacheKey = this.getCacheKey(tweetIds)
    const lastUpdate = this.lastUpdateTimes.get(cacheKey)

    if (!lastUpdate) return false

    return Date.now() - lastUpdate < this.MIN_UPDATE_INTERVAL
  }

  /**
   * Update engagement metrics for tweets with deduplication
   */
  async updateEngagementMetrics(tweetIds: string[]): Promise<EngagementUpdateResult> {
    if (tweetIds.length === 0) {
      return {
        success: false,
        error: 'No tweet IDs provided',
        requestId: 'empty'
      }
    }

    const cacheKey = this.getCacheKey(tweetIds)
    const requestId = Math.random().toString(36).substr(2, 9)

    // Check if there's already an active request for these tweets
    const existingRequest = this.activeRequests.get(cacheKey)
    if (existingRequest) {
      console.log(`[${requestId}] Reusing existing request for tweets: ${cacheKey}`)
      return existingRequest
    }

    // Check if tweets were recently updated
    if (this.isRecentlyUpdated(tweetIds)) {
      console.log(`[${requestId}] Tweets recently updated, skipping: ${cacheKey}`)
      return {
        success: false,
        error: 'Tweets were recently updated',
        requestId
      }
    }

    console.log(`[${requestId}] Starting new engagement update for ${tweetIds.length} tweets`)

    // Create the update promise
    const updatePromise = this.performUpdate(tweetIds, requestId)

    // Store the active request
    this.activeRequests.set(cacheKey, updatePromise)

    try {
      const result = await updatePromise

      // Update the last update time
      this.lastUpdateTimes.set(cacheKey, Date.now())

      // Notify subscribers
      this.notifySubscribers(result)

      return result
    } finally {
      // Clean up the active request
      this.activeRequests.delete(cacheKey)
    }
  }

  /**
   * Perform the actual engagement update
   */
  private async performUpdate(tweetIds: string[], requestId: string): Promise<EngagementUpdateResult> {
    try {
      if (tweetIds.length > 1) {
        // Batch update
        const response = await fetch('/api/tweets/engagement/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tweetIds }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`[${requestId}] Batch engagement update failed:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })

          return {
            success: false,
            error: errorData.error || `Failed to update engagement metrics (${response.status})`,
            requestId
          }
        }

        const result = await response.json()

        if (result.success && result.tweets) {
          console.log(`[${requestId}] Successfully updated ${result.tweets.length} tweets`)
          return {
            success: true,
            tweets: result.tweets,
            requestId
          }
        } else {
          console.warn(`[${requestId}] Batch update returned success but no tweets data:`, result)
          return {
            success: false,
            error: 'No tweets data returned',
            requestId
          }
        }
      } else {
        // Single tweet update
        const tweetId = tweetIds[0]
        const response = await fetch(`/api/tweets/${tweetId}/engagement`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`[${requestId}] Single engagement update failed:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            tweetId
          })

          return {
            success: false,
            error: errorData.error || `Failed to update engagement metrics (${response.status})`,
            requestId
          }
        }

        const result = await response.json()

        if (result.success && result.tweet) {
          console.log(`[${requestId}] Successfully updated tweet ${tweetId}`)
          return {
            success: true,
            tweets: [result.tweet],
            requestId
          }
        } else if (result.success && !result.changed) {
          console.log(`[${requestId}] Tweet ${tweetId} engagement unchanged`)
          return {
            success: true,
            tweets: [],
            requestId
          }
        } else {
          console.warn(`[${requestId}] Single update returned success but no tweet data:`, result)
          return {
            success: false,
            error: 'No tweet data returned',
            requestId
          }
        }
      }
    } catch (error) {
      console.error(`[${requestId}] Engagement update error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      }
    }
  }

  /**
   * Clear cache for specific tweets (useful when tweets are deleted or updated externally)
   */
  clearCache(tweetIds?: string[]) {
    if (tweetIds) {
      const cacheKey = this.getCacheKey(tweetIds)
      this.lastUpdateTimes.delete(cacheKey)
      this.activeRequests.delete(cacheKey)
    } else {
      // Clear all cache
      this.lastUpdateTimes.clear()
      this.activeRequests.clear()
    }
  }

  /**
   * Get current status of the engagement manager
   */
  getStatus() {
    return {
      activeRequests: this.activeRequests.size,
      cachedUpdates: this.lastUpdateTimes.size,
      subscribers: this.subscribers.size
    }
  }
}

// Singleton instance
export const engagementManager = new EngagementManager()

// Export types for use in components
export type { Tweet, EngagementUpdateResult }
