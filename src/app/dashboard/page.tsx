'use client'

import { useEffect, useState } from 'react'
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
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { formatNumber, formatDate } from '@/lib/utils'

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

  const fetchDashboardData = async () => {
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
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      fetchDashboardData()
    }
  }, [status, router, session?.user?.id])

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
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <SparklesIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats ? formatNumber(stats.totalPoints) : '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-8 w-8 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold text-foreground">
                  #{stats?.rank || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Tweets Submitted</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.tweetsSubmitted || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-foreground">
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
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Submit New Tweet
              </Link>
              <Link
                href="/leaderboard"
                className="border border-border hover:border-primary text-foreground hover:text-primary px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Recent Submissions</h2>

            {recentTweets.length === 0 ? (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No tweets submitted yet</p>
                <Link
                  href="/submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Submit Your First Tweet
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTweets.map((tweet, index) => (
                  <motion.div
                    key={tweet.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(tweet.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <SparklesIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          {tweet.totalPoints} points
                        </span>
                      </div>
                    </div>

                    <p className="text-foreground mb-3 line-clamp-2">
                      {tweet.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>❤️ {tweet.likes}</span>
                        <span>🔄 {tweet.retweets}</span>
                        <span>💬 {tweet.replies}</span>
                      </div>
                      <a
                        href={tweet.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                      >
                        View Tweet →
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
