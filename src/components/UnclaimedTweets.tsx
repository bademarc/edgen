'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowTopRightOnSquareIcon,
  TrophyIcon,
  ClockIcon,
  UserIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'

interface UnclaimedTweet {
  id: string
  tweetId: string
  content: string
  authorUsername: string
  authorId: string
  likes: number
  retweets: number
  replies: number
  createdAt: string
  discoveredAt: string
  source: string
  potentialPoints: number
}

interface UnclaimedTweetsResponse {
  success: boolean
  unclaimedTweets: UnclaimedTweet[]
  totalUnclaimed: number
  totalPotentialPoints: number
}

export default function UnclaimedTweets() {
  const [unclaimedTweets, setUnclaimedTweets] = useState<UnclaimedTweet[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [totalPotentialPoints, setTotalPotentialPoints] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUnclaimedTweets()
  }, [])

  const fetchUnclaimedTweets = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/tweets/claim')
      const data: UnclaimedTweetsResponse = await response.json()

      if (data.success) {
        setUnclaimedTweets(data.unclaimedTweets)
        setTotalPotentialPoints(data.totalPotentialPoints)
      } else {
        setError('Failed to fetch unclaimed tweets')
      }
    } catch (err) {
      setError('Error fetching unclaimed tweets')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const claimTweet = async (tweetId: string) => {
    try {
      setClaiming(tweetId)
      setError(null)

      const response = await fetch('/api/tweets/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tweetId }),
      })

      const data = await response.json()

      if (data.success) {
        // Remove the claimed tweet from the list
        setUnclaimedTweets(prev => prev.filter(tweet => tweet.tweetId !== tweetId))
        setTotalPotentialPoints(prev => prev - (unclaimedTweets.find(t => t.tweetId === tweetId)?.potentialPoints || 0))

        // Show success message (you might want to use a toast notification)
        alert(`Successfully claimed tweet for ${data.pointsAwarded} points!`)
      } else {
        setError(data.error || 'Failed to claim tweet')
      }
    } catch (err) {
      setError('Error claiming tweet')
      console.error('Error:', err)
    } finally {
      setClaiming(null)
    }
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'twscrape': return 'bg-blue-500'
      case 'rss': return 'bg-green-500'
      case 'nitter': return 'bg-purple-500'
      case 'scraper': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="card-layeredge p-8">
        <div className="flex items-center justify-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-layeredge-orange" />
          <span className="ml-2 text-foreground">Loading unclaimed tweets...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="card-layeredge hover-glow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
            <TrophyIcon className="h-5 w-5 text-layeredge-orange" />
            Unclaimed Tweets
          </h2>
          <p className="text-muted-foreground mb-6">
            These are your tweets that were automatically discovered but not yet claimed.
            Claim them to earn points retroactively!
          </p>
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {unclaimedTweets.length === 0 ? (
            <div className="text-center py-8">
              <TrophyIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No unclaimed tweets</h3>
              <p className="text-muted-foreground">
                All your discovered tweets have been claimed, or none have been found yet.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-layeredge-blue/20 border border-layeredge-blue/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-layeredge-blue">
                      {unclaimedTweets.length} unclaimed tweets found
                    </h4>
                    <p className="text-layeredge-blue/80">
                      Total potential points: {totalPotentialPoints}
                    </p>
                  </div>
                  <button onClick={fetchUnclaimedTweets} className="btn-layeredge-ghost px-3 py-1 text-sm">
                    Refresh
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {unclaimedTweets.map((tweet) => (
                  <div key={tweet.id} className="card-layeredge border-l-4 border-l-blue-500">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">@{tweet.authorUsername}</span>
                            <div
                              className={`badge-layeredge text-white ${getSourceBadgeColor(tweet.source)}`}
                            >
                              {tweet.source}
                            </div>
                            <div className="badge-layeredge-secondary">
                              {tweet.potentialPoints} points
                            </div>
                          </div>

                          <p className="text-foreground mb-3 line-clamp-3">
                            {tweet.content}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span>❤️ {tweet.likes}</span>
                            <span>🔄 {tweet.retweets}</span>
                            <span>💬 {tweet.replies}</span>
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              {formatDistanceToNow(new Date(tweet.createdAt), { addSuffix: true })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => claimTweet(tweet.tweetId)}
                              disabled={claiming === tweet.tweetId}
                              className="btn-layeredge-primary px-4 py-2 rounded-lg text-sm font-medium hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {claiming === tweet.tweetId ? (
                                <>
                                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                                  Claiming...
                                </>
                              ) : (
                                <>
                                  <TrophyIcon className="h-4 w-4 mr-2" />
                                  Claim {tweet.potentialPoints} Points
                                </>
                              )}
                            </button>

                            <button
                              className="btn-layeredge-ghost px-4 py-2 rounded-lg text-sm font-medium hover-lift border border-border"
                              onClick={() => window.open(`https://x.com/i/web/status/${tweet.tweetId}`, '_blank')}
                            >
                              <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                              View Tweet
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
