'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  TrophyIcon,
  SparklesIcon,
  CalendarIcon,
  UserIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { formatNumber } from '@/lib/utils'
import { ActivityTimeline } from './activity-timeline'

// Enhanced interface to support both leaderboard and activity feed users
interface UserProfileModalProps {
  user: {
    id: string
    name?: string | null
    xUsername?: string | null
    image?: string | null
    totalPoints: number
    rank: number
    tweetsCount: number
    joinDate?: string
    thisWeekPoints?: number
    lastActivityDate?: string
    // Additional fields for activity feed context
    tweetsSubmitted?: number
    questsCompleted?: number
    dailyStreak?: number
    weeklyPoints?: number
    monthlyPoints?: number
  } | null
  isOpen: boolean
  onClose: () => void
  // Optional context to customize the modal for different use cases
  context?: 'leaderboard' | 'activity-feed' | 'general'
}

export function UserProfileModal({ user, isOpen, onClose, context = 'general' }: UserProfileModalProps) {
  if (!user) return null

  // Calculate tier based on points
  const getTier = (score: number) => {
    if (score >= 9000) return { name: "Diamond", color: "text-primary", progress: 100, icon: "💎" }
    if (score >= 7000) return { name: "Platinum", color: "text-gray-300", progress: ((score - 7000) / 2000) * 100, icon: "🏆" }
    if (score >= 5000) return { name: "Gold", color: "text-yellow-400", progress: ((score - 5000) / 2000) * 100, icon: "🥇" }
    if (score >= 3000) return { name: "Silver", color: "text-gray-400", progress: ((score - 3000) / 2000) * 100, icon: "🥈" }
    return { name: "Bronze", color: "text-amber-600", progress: (score / 3000) * 100, icon: "🥉" }
  }

  const currentTier = getTier(user.totalPoints)
  const averagePointsPerTweet = user.tweetsCount > 0 ? Math.round(user.totalPoints / user.tweetsCount) : 0

  // Calculate achievements
  const achievements = []
  if (user.totalPoints >= 1000) achievements.push({ name: "First Milestone", icon: "🎯", description: "Reached 1,000 points" })
  if (user.tweetsCount >= 10) achievements.push({ name: "Active Contributor", icon: "📝", description: "Submitted 10+ tweets" })
  if (user.rank <= 10) achievements.push({ name: "Top 10", icon: "🏆", description: "Ranked in top 10" })
  if (user.rank <= 3) achievements.push({ name: "Podium Finisher", icon: "🥇", description: "Ranked in top 3" })
  if (averagePointsPerTweet >= 50) achievements.push({ name: "Quality Creator", icon: "⭐", description: "High engagement per tweet" })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || user.xUsername || 'User'}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <DialogTitle className="text-2xl">
                {user.name || user.xUsername || 'Anonymous User'}
              </DialogTitle>
              <DialogDescription className="flex items-center space-x-2">
                {user.xUsername && (
                  <span className="text-muted-foreground">@{user.xUsername}</span>
                )}
                <Badge variant="outline" className="ml-2">
                  Rank #{user.rank}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <SparklesIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatNumber(user.totalPoints)}
                </div>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrophyIcon className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold">#{user.rank}</div>
                <p className="text-xs text-muted-foreground">Global Rank</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <ChartBarIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{user.tweetsCount || user.tweetsSubmitted || 0}</div>
                <p className="text-xs text-muted-foreground">Contributions</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold">{averagePointsPerTweet}</div>
                <p className="text-xs text-muted-foreground">Avg/Tweet</p>
              </CardContent>
            </Card>
          </div>

          {/* Context-specific additional stats for activity feed */}
          {context === 'activity-feed' && (user.thisWeekPoints || user.weeklyPoints || user.dailyStreak) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(user.thisWeekPoints || user.weeklyPoints) && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CalendarIcon className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="text-xl font-bold text-purple-600">
                      +{formatNumber(user.thisWeekPoints || user.weeklyPoints || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </CardContent>
                </Card>
              )}

              {user.dailyStreak && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-orange-500">🔥</span>
                    </div>
                    <div className="text-xl font-bold text-orange-600">{user.dailyStreak}</div>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </CardContent>
                </Card>
              )}

              {user.questsCompleted && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-green-500">🎯</span>
                    </div>
                    <div className="text-xl font-bold text-green-600">{user.questsCompleted}</div>
                    <p className="text-xs text-muted-foreground">Quests Done</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Tier Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>{currentTier.icon}</span>
                <span>Current Tier: {currentTier.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to next tier</span>
                  <span>{Math.round(currentTier.progress)}%</span>
                </div>
                <Progress value={currentTier.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          {achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <h4 className="font-semibold text-sm">{achievement.name}</h4>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <ActivityTimeline userId={user.id} limit={8} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
