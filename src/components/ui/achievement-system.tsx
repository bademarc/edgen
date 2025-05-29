'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Progress } from './progress'
import { Button } from './button'
import { Separator } from './separator'
import {
  TrophyIcon,
  SparklesIcon,
  LockClosedIcon,
  ShareIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
  requirement: {
    type: 'tweets' | 'points' | 'engagement' | 'streak' | 'referrals'
    target: number
    current: number
  }
  unlocked: boolean
  unlockedAt?: Date
  category: 'engagement' | 'community' | 'milestone' | 'special'
}

interface AchievementSystemProps {
  className?: string
  userStats?: {
    totalTweets: number
    totalPoints: number
    totalEngagement: number
    currentStreak: number
    referrals: number
  }
}

const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: 'First Tweet',
    description: 'Submit your first tweet about LayerEdge',
    icon: '🎯',
    rarity: 'common',
    points: 25,
    requirement: { type: 'tweets', target: 1, current: 1 },
    unlocked: true,
    unlockedAt: new Date('2024-01-15'),
    category: 'engagement'
  },
  {
    id: '2',
    name: 'Bitcoin Advocate',
    description: 'Earn 1,000 points from LayerEdge engagement',
    icon: '🏆',
    rarity: 'rare',
    points: 100,
    requirement: { type: 'points', target: 1000, current: 750 },
    unlocked: false,
    category: 'milestone'
  },
  {
    id: '3',
    name: 'Viral Tweet',
    description: 'Get 100+ likes on a LayerEdge tweet',
    icon: '🚀',
    rarity: 'epic',
    points: 200,
    requirement: { type: 'engagement', target: 100, current: 67 },
    unlocked: false,
    category: 'engagement'
  },
  {
    id: '4',
    name: 'Community Builder',
    description: 'Refer 10 new members to the community',
    icon: '👥',
    rarity: 'epic',
    points: 300,
    requirement: { type: 'referrals', target: 10, current: 3 },
    unlocked: false,
    category: 'community'
  },
  {
    id: '5',
    name: 'Legend',
    description: 'Reach 10,000 total points',
    icon: '⭐',
    rarity: 'legendary',
    points: 500,
    requirement: { type: 'points', target: 10000, current: 750 },
    unlocked: false,
    category: 'milestone'
  },
  {
    id: '6',
    name: 'Streak Master',
    description: 'Tweet about LayerEdge for 7 consecutive days',
    icon: '🔥',
    rarity: 'rare',
    points: 150,
    requirement: { type: 'streak', target: 7, current: 4 },
    unlocked: false,
    category: 'engagement'
  }
]

function getRarityColor(rarity: Achievement['rarity']) {
  switch (rarity) {
    case 'common': return 'text-gray-400 border-gray-400/30 bg-gray-400/10'
    case 'rare': return 'text-blue-400 border-blue-400/30 bg-blue-400/10'
    case 'epic': return 'text-purple-400 border-purple-400/30 bg-purple-400/10'
    case 'legendary': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
  }
}

function getRarityGlow(rarity: Achievement['rarity']) {
  switch (rarity) {
    case 'common': return 'shadow-gray-400/20'
    case 'rare': return 'shadow-blue-400/20'
    case 'epic': return 'shadow-purple-400/20'
    case 'legendary': return 'shadow-yellow-400/20'
  }
}

function AchievementCard({ achievement, onShare }: { achievement: Achievement, onShare: (achievement: Achievement) => void }) {
  const progress = (achievement.requirement.current / achievement.requirement.target) * 100
  const isCompleted = achievement.unlocked

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        isCompleted ? "ring-2 ring-success/30 shadow-lg" : "hover:shadow-md",
        isCompleted && getRarityGlow(achievement.rarity)
      )}>
        {isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 z-10"
          >
            <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
              <CheckIcon className="h-5 w-5 text-white" />
            </div>
          </motion.div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "text-3xl p-3 rounded-xl border",
                isCompleted ? getRarityColor(achievement.rarity) : "text-muted-foreground border-muted bg-muted/20",
                !isCompleted && "grayscale"
              )}>
                {isCompleted ? achievement.icon : <LockClosedIcon className="h-6 w-6" />}
              </div>
              <div>
                <CardTitle className={cn(
                  "text-lg",
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                )}>
                  {achievement.name}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge
                    variant="outline"
                    size="sm"
                    className={cn(
                      "capitalize",
                      isCompleted ? getRarityColor(achievement.rarity) : "text-muted-foreground border-muted"
                    )}
                  >
                    {achievement.rarity}
                  </Badge>
                  <Badge variant="points" size="sm">
                    <SparklesIcon className="h-3 w-3 mr-1" />
                    {achievement.points}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className={cn(
            "text-sm mb-4",
            isCompleted ? "text-muted-foreground" : "text-muted-foreground/70"
          )}>
            {achievement.description}
          </p>

          {!isCompleted && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground font-medium">
                  {achievement.requirement.current} / {achievement.requirement.target}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {isCompleted && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Unlocked</span>
                <span className="text-success font-medium">
                  {achievement.unlockedAt?.toLocaleDateString()}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShare(achievement)}
                className="w-full"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Share Achievement
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AchievementSystem({ className, _userStats }: AchievementSystemProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [achievements, _setAchievements] = useState<Achievement[]>(mockAchievements)
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')
  const [category, setCategory] = useState<'all' | Achievement['category']>('all')

  const filteredAchievements = achievements.filter(achievement => {
    const matchesFilter = filter === 'all' ||
      (filter === 'unlocked' && achievement.unlocked) ||
      (filter === 'locked' && !achievement.unlocked)

    const matchesCategory = category === 'all' || achievement.category === category

    return matchesFilter && matchesCategory
  })

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0)

  const handleShare = (achievement: Achievement) => {
    const text = `🎉 Just unlocked the "${achievement.name}" achievement on LayerEdge! ${achievement.icon}\n\n${achievement.description}\n\n+${achievement.points} points earned! 🚀\n\n#LayerEdge #Bitcoin #Achievement`

    if (navigator.share) {
      navigator.share({
        title: `Achievement Unlocked: ${achievement.name}`,
        text,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(text)
      // You could show a toast here
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrophyIcon className="h-6 w-6 text-bitcoin-orange" />
            <span>Achievement Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{unlockedCount}</div>
              <div className="text-sm text-muted-foreground">Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{achievements.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-bitcoin-orange">{totalPoints}</div>
              <div className="text-sm text-muted-foreground">Points Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-layeredge-blue">
                {Math.round((unlockedCount / achievements.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex space-x-1">
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'layeredge' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <Separator orientation="vertical" className="h-8" />
        <div className="flex space-x-1">
          {(['all', 'engagement', 'community', 'milestone', 'special'] as const).map((c) => (
            <Button
              key={c}
              variant={category === c ? 'layeredgeSecondary' : 'ghost'}
              size="sm"
              onClick={() => setCategory(c)}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onShare={handleShare}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <TrophyIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No achievements found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters to see more achievements.
          </p>
        </div>
      )}
    </div>
  )
}
