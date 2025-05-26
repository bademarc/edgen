'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { TweetCard } from '@/components/TweetCard'
import { useRealTimeEngagement } from '@/hooks/useRealTimeEngagement'
import { formatNumber } from '@/lib/utils'

interface Tweet {
  id: string
  url: string
  content?: string | null
  likes: number
  retweets: number
  replies: number
  totalPoints: number
  createdAt: string
  user: {
    id: string
    name: string | null
    xUsername: string | null
    image: string | null
  }
}

export default function RecentSubmissionsPage() {
  const [allTweets, setAllTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'points' | 'engagement'>('recent')
  const [limit, setLimit] = useState(20)

  // Real-time engagement updates
  const {
    updatedTweets,
    isUpdating,
    lastUpdateTime,
    updateCount,
    error: engagementError,
    forceUpdate,
    retryCount
  } = useRealTimeEngagement({
    tweets: allTweets,
    enabled: allTweets.length > 0,
    updateInterval: 45000, // 45 seconds for all tweets
  })

  const fetchTweets = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tweets?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tweets')
      }
      const data = await response.json()
      setAllTweets(data)
    } catch (err) {
      console.error('Error fetching tweets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tweets')
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchTweets()
  }, [fetchTweets])

  // Filter and sort tweets
  const filteredAndSortedTweets = updatedTweets
    .filter(tweet => {
      if (!searchTerm) return true
      const searchLower = searchTerm.toLowerCase()
      return (
        tweet.content?.toLowerCase().includes(searchLower) ||
        tweet.user.name?.toLowerCase().includes(searchLower) ||
        tweet.user.xUsername?.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return b.totalPoints - a.totalPoints
        case 'engagement':
          return (b.likes + b.retweets + b.replies) - (a.likes + a.retweets + a.replies)
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  const handleUpdateSingleTweet = async (tweetId: string) => {
    try {
      const response = await fetch(`/api/tweets/${tweetId}/engagement`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.changed && result.tweet) {
          setAllTweets(prevTweets =>
            prevTweets.map(t => t.id === tweetId ? result.tweet : t)
          )
        }
      }
    } catch (error) {
      console.error('Error updating single tweet:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                  <div className="h-16 bg-muted rounded mb-4"></div>
                  <div className="flex space-x-4">
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Error Loading Tweets</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={fetchTweets}
              className="btn-layeredge-primary px-6 py-3 rounded-lg font-semibold hover-lift"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Recent Submissions</h1>
          <p className="text-muted-foreground">
            Latest community tweets with real-time engagement metrics
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card-layeredge p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tweets or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-layeredge w-full pl-10 pr-4 py-2 text-sm"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'points' | 'engagement')}
                  className="input-layeredge pl-10 pr-8 py-2 text-sm appearance-none bg-card"
                >
                  <option value="recent">Most Recent</option>
                  <option value="points">Highest Points</option>
                  <option value="engagement">Most Engagement</option>
                </select>
              </div>
            </div>

            {/* Update Controls */}
            <div className="flex items-center space-x-3">
              {lastUpdateTime && (
                <div className="text-xs text-muted-foreground">
                  Updated: {lastUpdateTime.toLocaleTimeString()}
                </div>
              )}
              {updateCount > 0 && (
                <div className="text-xs text-layeredge-blue">
                  {updateCount} updates
                </div>
              )}
              <button
                onClick={forceUpdate}
                disabled={isUpdating}
                className="btn-layeredge-ghost p-2 rounded-lg hover-lift disabled:opacity-50"
                title="Update all engagement metrics"
              >
                <ArrowPathIcon className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredAndSortedTweets.length} of {formatNumber(updatedTweets.length)} tweets
              </span>
              {engagementError && (
                <span className="text-destructive">
                  Update error: {engagementError}
                  {retryCount > 0 && ` (Retry ${retryCount}/3)`}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tweets List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {filteredAndSortedTweets.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {searchTerm ? 'No tweets found matching your search.' : 'No tweets available.'}
              </p>
            </div>
          ) : (
            filteredAndSortedTweets.map((tweet, index) => (
              <motion.div
                key={tweet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <TweetCard
                  tweet={{
                    ...tweet,
                    createdAt: new Date(tweet.createdAt)
                  }}
                  showUser={true}
                  isUpdating={isUpdating}
                  onUpdateEngagement={handleUpdateSingleTweet}
                  showUpdateButton={true}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Load More */}
        {filteredAndSortedTweets.length >= limit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-8"
          >
            <button
              onClick={() => setLimit(prev => prev + 20)}
              className="btn-layeredge-secondary px-6 py-3 rounded-lg font-semibold hover-lift"
            >
              Load More Tweets
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
