import { useState, useEffect, useCallback, useRef } from 'react'
import { engagementManager, type Tweet, type EngagementUpdateResult } from '@/lib/engagement-manager'

// Interface for future use in engagement update notifications
// interface EngagementUpdate {
//   tweetId: string
//   likes: number
//   retweets: number
//   replies: number
//   totalPoints: number
//   pointsDifference: number
// }

interface UseRealTimeEngagementOptions {
  tweets: Tweet[]
  enabled?: boolean
  updateInterval?: number // in milliseconds
  maxRetries?: number
}

interface UseRealTimeEngagementReturn {
  updatedTweets: Tweet[]
  isUpdating: boolean
  lastUpdateTime: Date | null
  updateCount: number
  error: string | null
  forceUpdate: () => Promise<void>
  retryCount: number
}

export function useRealTimeEngagement({
  tweets,
  enabled = true,
  updateInterval = 60000, // Increased to 60 seconds to reduce API calls
  maxRetries = 3,
}: UseRealTimeEngagementOptions): UseRealTimeEngagementReturn {
  const [updatedTweets, setUpdatedTweets] = useState<Tweet[]>(tweets)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [updateCount, setUpdateCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isComponentMounted = useRef(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Update local tweets when props change (with deep comparison to prevent unnecessary updates)
  useEffect(() => {
    const tweetsChanged = tweets.length !== updatedTweets.length ||
      tweets.some((tweet, index) => {
        const existing = updatedTweets[index]
        return !existing || tweet.id !== existing.id ||
               tweet.likes !== existing.likes ||
               tweet.retweets !== existing.retweets ||
               tweet.replies !== existing.replies
      })

    if (tweetsChanged) {
      setUpdatedTweets(tweets)
    }
  }, [tweets, updatedTweets])

  // Subscribe to engagement manager updates with throttling
  useEffect(() => {
    let updateTimeout: NodeJS.Timeout | null = null

    const handleEngagementUpdate = (result: EngagementUpdateResult) => {
      if (!isComponentMounted.current) return

      // Throttle updates to prevent excessive re-renders
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }

      updateTimeout = setTimeout(() => {
        if (result.success && result.tweets && result.tweets.length > 0) {
          setUpdatedTweets(prevTweets => {
            const hasChanges = result.tweets!.some(updatedTweet => {
              const existing = prevTweets.find(t => t.id === updatedTweet.id)
              return existing && (
                existing.likes !== updatedTweet.likes ||
                existing.retweets !== updatedTweet.retweets ||
                existing.replies !== updatedTweet.replies ||
                existing.totalPoints !== updatedTweet.totalPoints
              )
            })

            if (!hasChanges) return prevTweets

            return prevTweets.map(tweet => {
              const updatedTweet = result.tweets!.find(t => t.id === tweet.id)
              return updatedTweet || tweet
            })
          })
          setUpdateCount(prev => prev + 1)
          setRetryCount(0)
          setError(null)
        } else if (!result.success && result.error) {
          setError(result.error)
        }
      }, 100) // 100ms throttle
    }

    unsubscribeRef.current = engagementManager.subscribe(handleEngagementUpdate)

    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [])

  // Dynamic update interval calculation (for future use)
  // const getDynamicUpdateInterval = useCallback((tweet: Tweet): number => {
  //   const tweetAge = Date.now() - new Date(tweet.createdAt).getTime()
  //   const oneHour = 60 * 60 * 1000
  //   const oneDay = 24 * oneHour

  //   // Recent tweets (< 1 hour): update every 30 seconds
  //   if (tweetAge < oneHour) {
  //     return 30000
  //   }
  //   // Tweets 1-24 hours old: update every 2 minutes
  //   else if (tweetAge < oneDay) {
  //     return 120000
  //   }
  //   // Older tweets: update every 10 minutes
  //   else {
  //     return 600000
  //   }
  // }, [])

  // Update engagement metrics for tweets using the global engagement manager
  const updateEngagementMetrics = useCallback(async (tweetIds?: string[]) => {
    if (!enabled || !isComponentMounted.current) return

    const tweetsToUpdate = tweetIds
      ? updatedTweets.filter(tweet => tweetIds.includes(tweet.id))
      : updatedTweets

    if (tweetsToUpdate.length === 0) return

    setIsUpdating(true)

    try {
      const tweetIdsToUpdate = tweetsToUpdate.map(tweet => tweet.id)
      const result = await engagementManager.updateEngagementMetrics(tweetIdsToUpdate)

      // The engagement manager will notify subscribers of the result
      // The subscription handler will update the local state

      setLastUpdateTime(new Date())

      if (!result.success && result.error) {
        // Handle errors that aren't already handled by the subscription
        if (result.error.includes('recently updated')) {
          // This is not really an error, just a rate limit
          console.log('Engagement update skipped - recently updated')
        } else {
          // Increment retry count for actual errors
          setRetryCount(prev => {
            const newCount = prev + 1
            if (newCount >= maxRetries) {
              console.warn(`Max retries (${maxRetries}) reached. Temporarily disabling updates.`)
              setTimeout(() => {
                if (isComponentMounted.current) {
                  setRetryCount(0)
                  setError(null)
                }
              }, 5 * 60 * 1000)
            }
            return newCount
          })
        }
      }
    } catch (err) {
      console.error('Error in engagement update:', err)
      setError(err instanceof Error ? err.message : 'Failed to update engagement metrics')
    } finally {
      if (isComponentMounted.current) {
        setIsUpdating(false)
      }
    }
  }, [enabled, updatedTweets, maxRetries])

  // Force update function
  const forceUpdate = useCallback(async () => {
    await updateEngagementMetrics()
  }, [updateEngagementMetrics])

  // Set up polling interval
  useEffect(() => {
    if (!enabled || retryCount >= maxRetries) return

    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      intervalRef.current = setInterval(() => {
        updateEngagementMetrics()
      }, updateInterval)
    }

    // Start polling immediately if we have tweets
    if (updatedTweets.length > 0) {
      startPolling()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, updateInterval, updatedTweets.length, updateEngagementMetrics, retryCount, maxRetries])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  return {
    updatedTweets,
    isUpdating,
    lastUpdateTime,
    updateCount,
    error,
    forceUpdate,
    retryCount,
  }
}
