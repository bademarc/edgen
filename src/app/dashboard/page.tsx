'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Shield,
  TrendingUp,
  Activity,
  Target,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { SubmitTweetCTA } from '@/components/ui/submit-tweet-cta'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { DateTooltip } from '@/components/ui/tooltip'


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
  createdAt: string // This is now the original tweet date from API transformation
  submittedAt?: string // When submitted to our system
  originalTweetDate?: string // Original tweet creation date
  user: {
    id: string
    name: string | null
    xUsername: string | null
    image: string | null
  }
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTweets, setRecentTweets] = useState<RecentTweet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return

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
      const tweetsResponse = await fetch(`/api/tweets?userId=${user.id}&limit=5`)
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
  }, [user?.id])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user?.id) {
      fetchDashboardData()
    }
  }, [authLoading, user, router, fetchDashboardData])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              <Skeleton className="h-8 w-1/4" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} variant="professional">
                    <CardContent className="pt-6">
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-8 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card variant="professional">
                <CardContent className="pt-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <Alert variant="destructive">
                <AlertTitle>Error Loading Dashboard</AlertTitle>
                <AlertDescription className="mt-2">
                  {error}
                </AlertDescription>
              </Alert>
              <div className="text-center mt-6">
                <Button
                  variant="layeredge"
                  onClick={fetchDashboardData}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate trust score and tier
  const trustScore = stats?.totalPoints || 0
  const getTier = (score: number) => {
    if (score >= 9000) return { name: "Diamond", color: "text-primary", progress: 100 }
    if (score >= 7000) return { name: "Platinum", color: "text-gray-300", progress: ((score - 7000) / 2000) * 100 }
    if (score >= 5000) return { name: "Gold", color: "text-yellow-400", progress: ((score - 5000) / 2000) * 100 }
    if (score >= 3000) return { name: "Silver", color: "text-gray-400", progress: ((score - 3000) / 2000) * 100 }
    return { name: "Bronze", color: "text-amber-600", progress: (score / 3000) * 100 }
  }

  const currentTier = getTier(trustScore)

  return (
    <div className="min-h-screen bg-background">
      <div className="py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome back, {user.name || user.xUsername}</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Track your LayerEdge community engagement and points</p>
          </motion.div>

          {/* Stats Grid - Mobile Optimized */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card variant="professional" className="touch-friendly">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Trust Score</CardTitle>
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{trustScore.toLocaleString()}</div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="layeredge" className="text-xs">{currentTier.name}</Badge>
                    <span className="text-xs text-muted-foreground">Tier</span>
                  </div>
                  <Progress value={currentTier.progress} className="mt-3" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card variant="professional" className="touch-friendly">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Network Rank</CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold">#{stats?.rank || 'N/A'}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Among all contributors
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card variant="professional" className="touch-friendly">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Contributions</CardTitle>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.tweetsSubmitted || 0}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total submissions
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card variant="professional" className="touch-friendly">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">This Week</CardTitle>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">+{stats?.thisWeekPoints || 0}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Points earned
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Submit Tweet CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8"
          >
            <ErrorBoundary>
              <SubmitTweetCTA variant="prominent" />
            </ErrorBoundary>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card variant="professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recent Contributions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTweets.length > 0 ? (
                  <div className="space-y-4">
                    {recentTweets.slice(0, 3).map((tweet) => {
                      // FIXED: Better date formatting and display
                      const tweetDate = new Date(tweet.createdAt)
                      const submittedDate = tweet.submittedAt ? new Date(tweet.submittedAt) : null

                      const formatDate = (date: Date) => {
                        const now = new Date()
                        const diffTime = Math.abs(now.getTime() - date.getTime())
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                        if (diffDays === 1) return 'Today'
                        if (diffDays === 2) return 'Yesterday'
                        if (diffDays <= 7) return `${diffDays - 1} days ago`

                        return date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
                        })
                      }

                      return (
                        <div key={tweet.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <DateTooltip
                                originalDate={tweetDate}
                                submittedDate={submittedDate || undefined}
                                className="text-sm text-muted-foreground"
                              >
                                {formatDate(tweetDate)}
                                {submittedDate && (
                                  <span className="ml-1 text-xs text-muted-foreground/70">
                                    ℹ️
                                  </span>
                                )}
                              </DateTooltip>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <span className="text-red-500">❤️</span>
                                {tweet.likes.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-green-500">🔄</span>
                                {tweet.retweets.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-blue-500">💬</span>
                                {tweet.replies.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="points">+{tweet.totalPoints} points</Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No contributions yet</p>
                    <ErrorBoundary>
                      <SubmitTweetCTA variant="compact" />
                    </ErrorBoundary>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

