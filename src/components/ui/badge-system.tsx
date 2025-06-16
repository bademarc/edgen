'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrophyIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
  BoltIcon,
  HeartIcon,
  RocketLaunchIcon,
  CrownIcon
} from '@heroicons/react/24/outline'

export interface UserBadge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earnedAt?: Date
  progress?: number
  maxProgress?: number
  category: 'engagement' | 'milestone' | 'social' | 'achievement' | 'special'
}

interface BadgeSystemProps {
  userBadges: UserBadge[]
  totalPoints: number
  tweetsCount: number
  rank: number
  className?: string
}

// Predefined badge definitions
export const BADGE_DEFINITIONS: UserBadge[] = [
  // Milestone Badges
  {
    id: 'first_tweet',
    name: 'First Steps',
    description: 'Submitted your first tweet to LayerEdge',
    icon: '🎯',
    color: 'bg-green-500/10 text-green-600',
    rarity: 'common',
    category: 'milestone'
  },
  {
    id: 'hundred_points',
    name: 'Century Club',
    description: 'Earned your first 100 points',
    icon: '💯',
    color: 'bg-blue-500/10 text-blue-600',
    rarity: 'common',
    category: 'milestone'
  },
  {
    id: 'thousand_points',
    name: 'Point Master',
    description: 'Accumulated 1,000 total points',
    icon: '⭐',
    color: 'bg-yellow-500/10 text-yellow-600',
    rarity: 'rare',
    category: 'milestone'
  },
  {
    id: 'five_thousand_points',
    name: 'Elite Contributor',
    description: 'Reached 5,000 total points',
    icon: '🏆',
    color: 'bg-purple-500/10 text-purple-600',
    rarity: 'epic',
    category: 'milestone'
  },

  // Engagement Badges
  {
    id: 'viral_tweet',
    name: 'Viral Sensation',
    description: 'One of your tweets got 50+ likes',
    icon: '🔥',
    color: 'bg-red-500/10 text-red-600',
    rarity: 'rare',
    category: 'engagement'
  },
  {
    id: 'engagement_king',
    name: 'Engagement King',
    description: 'Average 25+ points per tweet',
    icon: '👑',
    color: 'bg-yellow-500/10 text-yellow-600',
    rarity: 'epic',
    category: 'engagement'
  },
  {
    id: 'consistent_poster',
    name: 'Consistent Creator',
    description: 'Posted tweets 7 days in a row',
    icon: '📅',
    color: 'bg-green-500/10 text-green-600',
    rarity: 'rare',
    category: 'engagement'
  },

  // Social Badges
  {
    id: 'community_champion',
    name: 'Community Champion',
    description: 'Helped grow the LayerEdge community',
    icon: '🤝',
    color: 'bg-blue-500/10 text-blue-600',
    rarity: 'rare',
    category: 'social'
  },
  {
    id: 'influencer',
    name: 'Micro-Influencer',
    description: 'Your content was retweeted 100+ times',
    icon: '📢',
    color: 'bg-purple-500/10 text-purple-600',
    rarity: 'epic',
    category: 'social'
  },

  // Achievement Badges
  {
    id: 'top_ten',
    name: 'Top 10',
    description: 'Ranked in the top 10 on the leaderboard',
    icon: '🥇',
    color: 'bg-yellow-500/10 text-yellow-600',
    rarity: 'epic',
    category: 'achievement'
  },
  {
    id: 'podium_finisher',
    name: 'Podium Finisher',
    description: 'Ranked in the top 3 on the leaderboard',
    icon: '🏅',
    color: 'bg-gold-500/10 text-gold-600',
    rarity: 'legendary',
    category: 'achievement'
  },

  // Special Badges
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined LayerEdge in the first month',
    icon: '🚀',
    color: 'bg-indigo-500/10 text-indigo-600',
    rarity: 'legendary',
    category: 'special'
  },
  {
    id: 'beta_tester',
    name: 'Beta Tester',
    description: 'Helped test LayerEdge features',
    icon: '🧪',
    color: 'bg-cyan-500/10 text-cyan-600',
    rarity: 'epic',
    category: 'special'
  }
]

const getRarityConfig = (rarity: UserBadge['rarity']) => {
  switch (rarity) {
    case 'common':
      return { border: 'border-gray-300', glow: 'shadow-gray-200/50' }
    case 'rare':
      return { border: 'border-blue-400', glow: 'shadow-blue-200/50' }
    case 'epic':
      return { border: 'border-purple-400', glow: 'shadow-purple-200/50' }
    case 'legendary':
      return { border: 'border-yellow-400', glow: 'shadow-yellow-200/50' }
    default:
      return { border: 'border-gray-300', glow: 'shadow-gray-200/50' }
  }
}

export function BadgeSystem({ userBadges, totalPoints, tweetsCount, rank, className }: BadgeSystemProps) {
  // Calculate which badges the user should have earned
  const earnedBadges = BADGE_DEFINITIONS.filter(badge => {
    switch (badge.id) {
      case 'first_tweet':
        return tweetsCount >= 1
      case 'hundred_points':
        return totalPoints >= 100
      case 'thousand_points':
        return totalPoints >= 1000
      case 'five_thousand_points':
        return totalPoints >= 5000
      case 'top_ten':
        return rank <= 10
      case 'podium_finisher':
        return rank <= 3
      // Add more badge logic here
      default:
        return userBadges.some(ub => ub.id === badge.id)
    }
  })

  const categories = ['milestone', 'engagement', 'social', 'achievement', 'special'] as const

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrophyIcon className="h-5 w-5" />
            <span>Achievements & Badges</span>
            <Badge variant="secondary">{earnedBadges.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map(category => {
            const categoryBadges = earnedBadges.filter(badge => badge.category === category)
            if (categoryBadges.length === 0) return null

            return (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categoryBadges.map((badge, index) => {
                    const rarityConfig = getRarityConfig(badge.rarity)
                    
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative p-4 rounded-lg border-2 ${rarityConfig.border} ${badge.color} hover:shadow-lg ${rarityConfig.glow} transition-all duration-200 cursor-pointer group`}
                      >
                        <div className="text-center space-y-2">
                          <div className="text-2xl">{badge.icon}</div>
                          <div>
                            <h5 className="font-semibold text-sm">{badge.name}</h5>
                            <p className="text-xs text-muted-foreground">{badge.description}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              badge.rarity === 'legendary' ? 'border-yellow-400 text-yellow-600' :
                              badge.rarity === 'epic' ? 'border-purple-400 text-purple-600' :
                              badge.rarity === 'rare' ? 'border-blue-400 text-blue-600' :
                              'border-gray-400 text-gray-600'
                            }`}
                          >
                            {badge.rarity}
                          </Badge>
                        </div>

                        {/* Progress bar for badges in progress */}
                        {badge.progress !== undefined && badge.maxProgress && (
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{badge.progress}/{badge.maxProgress}</span>
                            </div>
                            <Progress 
                              value={(badge.progress / badge.maxProgress) * 100} 
                              className="h-1"
                            />
                          </div>
                        )}

                        {/* Earned date */}
                        {badge.earnedAt && (
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {earnedBadges.length === 0 && (
            <div className="text-center py-8">
              <SparklesIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Badges Yet</h3>
              <p className="text-muted-foreground">
                Start engaging with the community to earn your first badges!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
