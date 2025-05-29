'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Badge } from './badge'
import { Card, CardContent } from './card'
import { Separator } from './separator'
import {
  SparklesIcon,
  HeartIcon,
  ArrowPathRoundedSquareIcon,
  ChatBubbleLeftIcon,
  TrophyIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'tweet' | 'achievement' | 'milestone' | 'join'
  user: {
    name: string
    username: string
    avatar?: string
  }
  content: string
  points?: number
  timestamp: Date
  engagement?: {
    likes: number
    retweets: number
    replies: number
  }
  achievement?: {
    name: string
    icon: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
  }
}

interface LiveActivityFeedProps {
  className?: string
  maxItems?: number
}

// Mock data generator for demo
function generateMockActivity(): ActivityItem {
  const users = [
    { name: 'Alex Chen', username: 'alexc_btc', avatar: '/avatars/alex.jpg' },
    { name: 'Sarah Kim', username: 'sarahk_crypto', avatar: '/avatars/sarah.jpg' },
    { name: 'Mike Johnson', username: 'mikej_layer', avatar: '/avatars/mike.jpg' },
    { name: 'Emma Davis', username: 'emmad_edge', avatar: '/avatars/emma.jpg' },
    { name: 'David Wilson', username: 'davidw_btc', avatar: '/avatars/david.jpg' },
  ]

  const activities = [
    {
      type: 'tweet' as const,
      content: 'Just earned 45 points for tweeting about @layeredge! The future is here! 🚀',
      points: 45,
      engagement: { likes: 23, retweets: 8, replies: 5 }
    },
    {
      type: 'achievement' as const,
      content: 'unlocked the "Bitcoin Advocate" achievement!',
      points: 100,
      achievement: { name: 'Bitcoin Advocate', icon: '🏆', rarity: 'rare' as const }
    },
    {
      type: 'milestone' as const,
      content: 'reached 1,000 total points milestone!',
      points: 50,
    },
    {
      type: 'join' as const,
      content: 'joined the LayerEdge community!',
      points: 25,
    }
  ]

  const randomUser = users[Math.floor(Math.random() * users.length)]
  const randomActivity = activities[Math.floor(Math.random() * activities.length)]

  return {
    id: Math.random().toString(36).substr(2, 9),
    ...randomActivity,
    user: randomUser,
    timestamp: new Date(Date.now() - Math.random() * 300000), // Random time within last 5 minutes
  }
}

function ActivityIcon({ type, _achievement }: { type: ActivityItem['type'], _achievement?: ActivityItem['achievement'] }) {
  switch (type) {
    case 'tweet':
      return <ChatBubbleLeftIcon className="h-4 w-4 text-layeredge-blue" />
    case 'achievement':
      return <TrophyIcon className="h-4 w-4 text-bitcoin-orange" />
    case 'milestone':
      return <SparklesIcon className="h-4 w-4 text-layeredge-orange" />
    case 'join':
      return <UserIcon className="h-4 w-4 text-success" />
    default:
      return <SparklesIcon className="h-4 w-4 text-muted-foreground" />
  }
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'common': return 'text-gray-400'
    case 'rare': return 'text-blue-400'
    case 'epic': return 'text-purple-400'
    case 'legendary': return 'text-yellow-400'
    default: return 'text-gray-400'
  }
}

function formatTimeAgo(date: Date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

export function LiveActivityFeed({ className, maxItems = 10 }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [_isLive, _setIsLive] = useState(true)

  // Initialize with some mock data
  useEffect(() => {
    const initialActivities = Array.from({ length: 5 }, () => generateMockActivity())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    setActivities(initialActivities)
  }, [])

  // Simulate live updates
  useEffect(() => {
    if (!_isLive) return

    const interval = setInterval(() => {
      const newActivity = generateMockActivity()
      setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)])
    }, Math.random() * 10000 + 5000) // Random interval between 5-15 seconds

    return () => clearInterval(interval)
  }, [_isLive, maxItems])

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-success rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 w-2 h-2 bg-success rounded-full"
              />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Live Activity</h3>
          </div>
          <Badge variant="points" size="sm">
            <ClockIcon className="h-3 w-3 mr-1" />
            Real-time
          </Badge>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative"
              >
                <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="h-8 w-8 ring-2 ring-border">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback>
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <ActivityIcon type={activity.type} achievement={activity.achievement} />
                      <span className="text-sm font-medium text-foreground truncate">
                        {activity.user.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{activity.user.username}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {activity.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {activity.points && (
                          <Badge variant="points" size="sm">
                            <SparklesIcon className="h-3 w-3 mr-1" />
                            +{activity.points}
                          </Badge>
                        )}

                        {activity.achievement && (
                          <Badge
                            variant="outline"
                            size="sm"
                            className={cn("border-current", getRarityColor(activity.achievement.rarity))}
                          >
                            {activity.achievement.icon} {activity.achievement.name}
                          </Badge>
                        )}
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>

                    {activity.engagement && (
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <HeartIcon className="h-3 w-3 text-red-400" />
                          <span>{activity.engagement.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ArrowPathRoundedSquareIcon className="h-3 w-3 text-green-400" />
                          <span>{activity.engagement.retweets}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ChatBubbleLeftIcon className="h-3 w-3 text-blue-400" />
                          <span>{activity.engagement.replies}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {index < activities.length - 1 && (
                  <Separator className="mt-3" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8">
            <SparklesIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Waiting for community activity...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
