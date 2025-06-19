'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Badge } from './badge'
import { Card, CardContent } from './card'
import { Separator } from './separator'
import { UserProfileModal } from './user-profile-modal'
import {
  SparklesIcon,
  HeartIcon,
  ArrowPathRoundedSquareIcon,
  ChatBubbleLeftIcon,
  TrophyIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { cn, formatNumber } from '@/lib/utils'

interface ActivityUser {
  id: string
  name: string
  username: string
  avatar?: string
  // Enhanced user data for profile view
  totalPoints: number
  rank: number
  tweetsCount: number
  tweetsSubmitted?: number
  thisWeekPoints?: number
  joinDate?: string
  questsCompleted?: number
  dailyStreak?: number
}

interface ActivityItem {
  id: string
  type: 'tweet' | 'achievement' | 'milestone' | 'join'
  user: ActivityUser
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

interface ActivityFeedWithProfilesProps {
  className?: string
  maxItems?: number
  showProfilesOnClick?: boolean
  activities?: ActivityItem[]
  isLoading?: boolean
  useMockData?: boolean
  enableLiveUpdates?: boolean
}

// Mock data generator for demo (enhanced with profile data)
function generateMockActivity(): ActivityItem {
  const users = [
    { 
      id: '1',
      name: 'Alex Chen', 
      username: 'alexc_btc', 
      avatar: '/avatars/alex.jpg',
      totalPoints: 2450,
      rank: 15,
      tweetsCount: 23,
      thisWeekPoints: 180,
      joinDate: '2024-01-15',
      questsCompleted: 5,
      dailyStreak: 7
    },
    { 
      id: '2',
      name: 'Sarah Kim', 
      username: 'sarahk_crypto', 
      avatar: '/avatars/sarah.jpg',
      totalPoints: 3200,
      rank: 8,
      tweetsCount: 31,
      thisWeekPoints: 220,
      joinDate: '2024-01-10',
      questsCompleted: 8,
      dailyStreak: 12
    },
    { 
      id: '3',
      name: 'Mike Johnson', 
      username: 'mikej_layer', 
      avatar: '/avatars/mike.jpg',
      totalPoints: 1890,
      rank: 28,
      tweetsCount: 18,
      thisWeekPoints: 95,
      joinDate: '2024-02-01',
      questsCompleted: 3,
      dailyStreak: 4
    },
    { 
      id: '4',
      name: 'Emma Davis', 
      username: 'emmad_edge', 
      avatar: '/avatars/emma.jpg',
      totalPoints: 4100,
      rank: 5,
      tweetsCount: 42,
      thisWeekPoints: 310,
      joinDate: '2024-01-05',
      questsCompleted: 12,
      dailyStreak: 18
    },
    { 
      id: '5',
      name: 'David Wilson', 
      username: 'davidw_btc', 
      avatar: '/avatars/david.jpg',
      totalPoints: 2780,
      rank: 12,
      tweetsCount: 27,
      thisWeekPoints: 150,
      joinDate: '2024-01-20',
      questsCompleted: 6,
      dailyStreak: 9
    },
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
    case 'legendary': return 'text-purple-500'
    case 'epic': return 'text-purple-400'
    case 'rare': return 'text-blue-400'
    case 'common': return 'text-gray-400'
    default: return 'text-gray-400'
  }
}

function formatTimeAgo(date: Date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

export function ActivityFeedWithProfiles({
  className,
  maxItems = 10,
  showProfilesOnClick = true,
  activities: providedActivities,
  isLoading: initialLoading = false,
  useMockData = false,
  enableLiveUpdates = true
}: ActivityFeedWithProfilesProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null) // Use any to handle interface conversion
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [error, setError] = useState<string | null>(null)
  const [_isLive, _setIsLive] = useState(enableLiveUpdates)

  // Fetch real activity data from API
  const fetchActivityData = async () => {
    if (providedActivities || useMockData) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/activity-feed?limit=${maxItems}`)

      if (!response.ok) {
        throw new Error('Failed to fetch activity feed')
      }

      const data = await response.json()

      if (data.success) {
        // Convert API response to ActivityItem format
        const convertedActivities: ActivityItem[] = data.activities.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        setActivities(convertedActivities)
      } else {
        throw new Error(data.error || 'Failed to load activity feed')
      }

    } catch (err) {
      console.error('Error fetching activity feed:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activity feed')
      // Fallback to mock data on error
      const fallbackActivities = Array.from({ length: 3 }, () => generateMockActivity())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setActivities(fallbackActivities)
    } finally {
      setIsLoading(false)
    }
  }

  // Use provided activities, fetch real data, or generate mock data
  useEffect(() => {
    if (providedActivities) {
      setActivities(providedActivities)
    } else if (useMockData) {
      const initialActivities = Array.from({ length: 5 }, () => generateMockActivity())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setActivities(initialActivities)
    } else {
      fetchActivityData()
    }
  }, [providedActivities, useMockData, maxItems])

  // Live updates - refresh data periodically or simulate with mock data
  useEffect(() => {
    if (!_isLive || providedActivities) return

    const interval = setInterval(() => {
      if (useMockData) {
        // Simulate new activity with mock data
        const newActivity = generateMockActivity()
        setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)])
      } else {
        // Refresh real data periodically
        fetchActivityData()
      }
    }, useMockData ? Math.random() * 10000 + 5000 : 30000) // Mock: 5-15s, Real: 30s

    return () => clearInterval(interval)
  }, [_isLive, maxItems, providedActivities, useMockData])

  const handleUserClick = (user: ActivityUser) => {
    if (!showProfilesOnClick) return

    // Convert ActivityUser to UserProfileModal format
    const profileUser = {
      id: user.id,
      name: user.name,
      xUsername: user.username, // Convert username to xUsername for UserProfileModal
      image: user.avatar,
      totalPoints: user.totalPoints,
      rank: user.rank,
      tweetsCount: user.tweetsCount || user.tweetsSubmitted || 0,
      thisWeekPoints: user.thisWeekPoints,
      joinDate: user.joinDate,
      questsCompleted: user.questsCompleted,
      dailyStreak: user.dailyStreak
    }

    // Set the converted user for the modal
    setSelectedUser(profileUser)
    setIsProfileModalOpen(true)
  }

  if (isLoading) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-muted rounded-full animate-pulse" />
              <h3 className="text-lg font-semibold text-foreground">Live Activity</h3>
            </div>
            <Badge variant="outline" size="sm">Loading...</Badge>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 rounded-lg">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state with fallback
  if (error && activities.length === 0) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-destructive rounded-full" />
              <h3 className="text-lg font-semibold text-foreground">Live Activity</h3>
            </div>
            <Badge variant="destructive" size="sm">Error</Badge>
          </div>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              Failed to load activity feed
            </p>
            <button
              onClick={() => fetchActivityData()}
              className="text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
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
              {useMockData ? 'Demo' : 'Live Data'}
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
                    <div 
                      className={cn(
                        "cursor-pointer transition-transform hover:scale-105",
                        showProfilesOnClick && "hover:ring-2 hover:ring-primary/50 rounded-full"
                      )}
                      onClick={() => handleUserClick(activity.user)}
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-border">
                        <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                        <AvatarFallback>
                          {activity.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <ActivityIcon type={activity.type} _achievement={activity.achievement} />
                        <span 
                          className={cn(
                            "text-sm font-medium text-foreground truncate",
                            showProfilesOnClick && "cursor-pointer hover:text-primary transition-colors"
                          )}
                          onClick={() => handleUserClick(activity.user)}
                        >
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

      {/* User Profile Modal */}
      {showProfilesOnClick && (
        <UserProfileModal
          user={selectedUser}
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false)
            setSelectedUser(null)
          }}
          context="activity-feed"
        />
      )}
    </>
  )
}
