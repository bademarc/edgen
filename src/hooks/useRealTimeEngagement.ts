import { useState, useEffect, useCallback, useRef } from 'react'

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
  updateInterval = 30000, // 30 seconds default
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

  // Update local tweets when props change
  useEffect(() => {
    setUpdatedTweets(tweets)
  }, [tweets])

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

  // Update engagement metrics for tweets
  const updateEngagementMetrics = useCallback(async (tweetIds?: string[]) => {
    if (!enabled || !isComponentMounted.current) return

    const tweetsToUpdate = tweetIds
      ? updatedTweets.filter(tweet => tweetIds.includes(tweet.id))
      : updatedTweets

    if (tweetsToUpdate.length === 0) return

    setIsUpdating(true)
    setError(null)

    console.log(`Updating engagement metrics for ${tweetsToUpdate.length} tweets using fallback service`)

    try {
      // Use batch update for multiple tweets
      if (tweetsToUpdate.length > 1) {
        const response = await fetch('/api/tweets/engagement/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tweetIds: tweetsToUpdate.map(tweet => tweet.id),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update engagement metrics')
        }

        const result = await response.json()

        if (result.success && result.tweets) {
          // Update the tweets with new engagement data
          setUpdatedTweets(prevTweets =>
            prevTweets.map(tweet => {
              const updatedTweet = result.tweets.find((t: Tweet) => t.id === tweet.id)
              return updatedTweet || tweet
            })
          )
          setUpdateCount(prev => prev + 1)
          setRetryCount(0) // Reset retry count on success
        }
      } else {
        // Single tweet update
        const tweet = tweetsToUpdate[0]
        const response = await fetch(`/api/tweets/${tweet.id}/engagement`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update engagement metrics')
        }

        const result = await response.json()

        if (result.success && result.changed && result.tweet) {
          setUpdatedTweets(prevTweets =>
            prevTweets.map(t => t.id === tweet.id ? result.tweet : t)
          )
          setUpdateCount(prev => prev + 1)
          setRetryCount(0) // Reset retry count on success
        }
      }

      setLastUpdateTime(new Date())
    } catch (err) {
      console.error('Error updating engagement metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to update engagement metrics')

      // Increment retry count
      setRetryCount(prev => {
        const newCount = prev + 1
        // If we've reached max retries, disable updates temporarily
        if (newCount >= maxRetries) {
          console.warn(`Max retries (${maxRetries}) reached. Temporarily disabling updates.`)
          // Re-enable after 5 minutes
          setTimeout(() => {
            if (isComponentMounted.current) {
              setRetryCount(0)
              setError(null)
            }
          }, 5 * 60 * 1000)
        }
        return newCount
      })
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
