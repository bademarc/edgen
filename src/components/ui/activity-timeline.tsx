'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CalendarIcon, 
  SparklesIcon, 
  MessageSquareIcon, 
  TrophyIcon,
  UserPlusIcon,
  ClockIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'tweet_submitted' | 'points_earned' | 'rank_changed' | 'joined'
  title: string
  description: string
  timestamp: string
  points?: number
  metadata?: any
}

interface ActivityTimelineProps {
  userId: string
  limit?: number
}

export function ActivityTimeline({ userId, limit = 10 }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActivity()
  }, [userId])

  const fetchActivity = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/user/activity?userId=${userId}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity')
      }

      const data = await response.json()
      
      if (data.success) {
        setActivities(data.activities || [])
      } else {
        throw new Error(data.error || 'Failed to load activity')
      }

    } catch (err) {
      console.error('Error fetching activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'joined':
        return <UserPlusIcon className="h-4 w-4 text-blue-500" />
      case 'tweet_submitted':
        return <MessageSquareIcon className="h-4 w-4 text-green-500" />
      case 'points_earned':
        return <SparklesIcon className="h-4 w-4 text-yellow-500" />
      case 'rank_changed':
        return <TrophyIcon className="h-4 w-4 text-purple-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'joined':
        return 'bg-blue-500'
      case 'tweet_submitted':
        return 'bg-green-500'
      case 'points_earned':
        return 'bg-yellow-500'
      case 'rank_changed':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5" />
          <span>Activity Timeline</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full mt-2 flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getActivityIcon(activity.type)}
                        <span className="text-sm font-medium">{activity.title}</span>
                        {activity.points && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            +{formatNumber(activity.points)} pts
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
