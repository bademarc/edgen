'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  SparklesIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  HeartIcon,
  ArrowPathRoundedSquareIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'
import { formatNumber, formatDate } from '@/lib/utils'
import { useRealTimeEngagement } from '@/hooks/useRealTimeEngagement'

interface DashboardStats {
  totalPoints: number
  rank: number | null
  tweetsSubmitted: number
  thisWeekPoints: number
}

interface RecentTweet {
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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTweets, setRecentTweets] = useState<RecentTweet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    tweets: recentTweets,
    enabled: recentTweets.length > 0,
    updateInterval: 30000, // 30 seconds
  })

  const fetchDashboardData = useCallback(async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch user stats
      const statsResponse = await fetch('/api/user/stats')
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch user stats')
      }
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch user's recent tweets
      const tweetsResponse = await fetch(`/api/tweets?userId=${session.user.id}&limit=5`)
      if (!tweetsResponse.ok) {
        throw new Error('Failed to fetch recent tweets')
      }
      const tweetsData = await tweetsResponse.json()
      setRecentTweets(tweetsData)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      fetchDashboardData()
    }
  }, [status, router, session?.user?.id, fetchDashboardData])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6">
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  if (error) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Error Loading Dashboard</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors"
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {session.user?.name || session.user?.xUsername}!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Here&apos;s your community engagement overview
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          <div className="card-layeredge p-6 hover-lift">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-xl bg-layeredge-orange/10">
                  <SparklesIcon className="h-8 w-8 text-layeredge-orange" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-layeredge-gradient">
                  {stats ? formatNumber(stats.totalPoints) : '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="card-layeredge p-6 hover-lift">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-xl bg-layeredge-blue/10">
                  <TrophyIcon className="h-8 w-8 text-layeredge-blue" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold text-gradient-blue">
                  #{stats?.rank || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="card-layeredge p-6 hover-lift">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-xl bg-success/10">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-success" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Tweets Submitted</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.tweetsSubmitted || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card-layeredge p-6 hover-lift">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-xl bg-success/10">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-success" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-success">
                  +{stats?.thisWeekPoints || 0}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="card-layeredge-elevated p-6 bg-gradient-to-r from-layeredge-orange/5 to-layeredge-blue/5">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-layeredge-orange/10">
                <SparklesIcon className="h-5 w-5 text-layeredge-orange" />
              </div>
              Quick Actions
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/submit"
                className="btn-layeredge-primary px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-lift"
              >
                <PlusIcon className="h-5 w-5" />
                Submit New Tweet
              </Link>
              <Link
                href="/leaderboard"
                className="btn-layeredge-secondary px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-lift"
              >
                <TrophyIcon className="h-5 w-5" />
                View Leaderboard
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="card-layeredge p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <div className="p-2 rounded-lg bg-layeredge-blue/10">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-layeredge-blue" />
                </div>
                Recent Submissions
              </h2>
              <div className="flex items-center space-x-3">
                {lastUpdateTime && (
                  <div className="text-xs text-muted-foreground">
                    Last updated: {lastUpdateTime.toLocaleTimeString()}
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
                  title="Update engagement metrics"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {engagementError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">
                  Error updating engagement metrics: {engagementError}
                  {retryCount > 0 && ` (Retry ${retryCount}/3)`}
                </p>
              </div>
            )}

            {updatedTweets.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No tweets submitted yet</p>
                <Link
                  href="/submit"
                  className="btn-layeredge-primary px-6 py-3 rounded-lg font-semibold hover-lift"
                >
                  Submit Your First Tweet
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {updatedTweets.map((tweet, index) => (
                  <motion.div
                    key={tweet.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="card-layeredge-interactive p-4 hover-lift"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(tweet.createdAt)}</span>
                      </div>
                      <div className="badge-layeredge-primary">
                        <SparklesIcon className="h-3 w-3 mr-1" />
                        {tweet.totalPoints} points
                      </div>
                    </div>

                    <p className="text-foreground mb-3 line-clamp-2">
                      {tweet.content}
                    </p>

                    <div className="divider-layeredge my-3"></div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors group">
                          <HeartIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">{formatNumber(tweet.likes)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors group">
                          <ArrowPathRoundedSquareIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">{formatNumber(tweet.retweets)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors group">
                          <ChatBubbleLeftIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">{formatNumber(tweet.replies)}</span>
                        </div>
                      </div>
                      <a
                        href={tweet.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-layeredge-orange hover:text-layeredge-orange-light text-sm font-medium transition-colors flex items-center gap-1 hover-lift"
                      >
                        View Tweet
                        <ArrowRightIcon className="h-4 w-4" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
