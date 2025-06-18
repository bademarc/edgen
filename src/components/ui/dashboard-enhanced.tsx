'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Trophy,
  BarChart3,
  Plus,
  RotateCw,
  RotateCcw,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Progress } from './progress'
import { Input } from './input'
import { Label } from './label'
import { TweetCardEnhanced } from './tweet-card-enhanced'
import { formatNumber, formatPoints } from '@/lib/utils'

interface DashboardEnhancedProps {
  user: {
    id: string
    name?: string | null
    xUsername?: string | null
    image?: string | null
    totalPoints: number
    rank?: number
  }
  tweets: Array<{
    id: string
    url: string
    content?: string | null
    likes: number
    retweets: number
    replies: number
    totalPoints: number
    createdAt: Date
    user: {
      id: string
      name?: string | null
      xUsername?: string | null
      image?: string | null
    }
  }>
  stats: {
    totalTweets: number
    totalEngagement: number
    averagePoints: number
    weeklyGrowth: number
  }
  onSubmitTweet?: (url: string) => Promise<void>
  onUpdateEngagement?: (tweetId: string) => Promise<void>
  isSubmitting?: boolean
  isUpdating?: boolean
}

export function DashboardEnhanced({
  user,
  tweets,
  stats,
  onSubmitTweet,
  onUpdateEngagement,
  isSubmitting = false,
  isUpdating = false
}: DashboardEnhancedProps) {
  const [tweetUrl, setTweetUrl] = useState('')
  const [showSubmitForm, setShowSubmitForm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmitTweet && tweetUrl.trim()) {
      await onSubmitTweet(tweetUrl.trim())
      setTweetUrl('')
      setShowSubmitForm(false)
    }
  }

  const progressToNextLevel = ((user.totalPoints % 1000) / 1000) * 100
  const currentLevel = Math.floor(user.totalPoints / 1000) + 1

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user.name || user.xUsername}!
        </h1>
        <p className="text-muted-foreground">
          Track your engagement and climb the leaderboard
        </p>
      </motion.div>

      {/* Stats overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card variant="layeredge" className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Sparkles className="h-4 w-4 text-layeredge-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-layeredge-orange">
              {formatPoints(user.totalPoints)}
            </div>
            <p className="text-xs text-muted-foreground">
              Level {currentLevel}
            </p>
          </CardContent>
        </Card>

        <Card variant="layeredge" className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rank</CardTitle>
            <Trophy className="h-4 w-4 text-layeredge-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-layeredge-blue">
              #{user.rank || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Community ranking
            </p>
          </CardContent>
        </Card>

        <Card variant="layeredge" className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tweets</CardTitle>
            <BarChart3 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatNumber(stats.totalTweets)}
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted tweets
            </p>
          </CardContent>
        </Card>

        <Card variant="layeredge" className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Points</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatNumber(stats.averagePoints)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per tweet
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-layeredge-orange" />
              <span>Level Progress</span>
            </CardTitle>
            <CardDescription>
              {1000 - (user.totalPoints % 1000)} points to reach Level {currentLevel + 1}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress variant="layeredge" value={progressToNextLevel} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>Level {currentLevel}</span>
              <span>Level {currentLevel + 1}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Submit tweet section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Submit New Tweet</CardTitle>
                <CardDescription>
                  Share a tweet mentioning @layeredge or $EDGEN to earn points
                </CardDescription>
              </div>
              <Button
                variant="layeredge"
                size="sm"
                onClick={() => setShowSubmitForm(!showSubmitForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tweet
              </Button>
            </div>
          </CardHeader>

          {showSubmitForm && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="tweetUrl" variant="layeredge">
                    Tweet URL
                  </Label>
                  <Input
                    id="tweetUrl"
                    variant="layeredge"
                    placeholder="https://x.com/username/status/..."
                    value={tweetUrl}
                    onChange={(e) => setTweetUrl(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    variant="layeredge"
                    disabled={isSubmitting || !tweetUrl.trim()}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Tweet'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowSubmitForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Recent tweets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Your Recent Tweets</h2>
          {onUpdateEngagement && (
            <Button
              variant="layeredgeSecondary"
              size="sm"
              onClick={() => tweets.forEach(tweet => onUpdateEngagement(tweet.id))}
              disabled={isUpdating}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Update All
            </Button>
          )}
        </div>

        {tweets.length === 0 ? (
          <Card variant="glass">
            <CardContent className="text-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No tweets yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Submit your first tweet to start earning points!
              </p>
              <Button
                variant="layeredge"
                onClick={() => setShowSubmitForm(true)}
              >
                Submit Your First Tweet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tweets.map((tweet) => (
              <TweetCardEnhanced
                key={tweet.id}
                tweet={tweet}
                showUser={false}
                variant="elevated"
                isUpdating={isUpdating}
                onUpdateEngagement={onUpdateEngagement}
                showUpdateButton={true}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
