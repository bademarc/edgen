'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  HeartIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  PauseIcon,
  PlayIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface EngagementData {
  likes: number
  retweets: number
  replies: number
  points: number
  lastUpdate: string
}

interface EngagementChange {
  type: 'likes' | 'retweets' | 'replies'
  change: number
  timestamp: Date
}

interface RealTimeEngagementProps {
  tweetId?: string
  initialData?: EngagementData
  updateInterval?: number
  className?: string
}

export function RealTimeEngagement({ 
  tweetId, 
  initialData, 
  updateInterval = 30000, // 30 seconds
  className 
}: RealTimeEngagementProps) {
  const [engagementData, setEngagementData] = useState<EngagementData | null>(initialData || null)
  const [isTracking, setIsTracking] = useState(false)
  const [recentChanges, setRecentChanges] = useState<EngagementChange[]>([])
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [nextUpdateIn, setNextUpdateIn] = useState(updateInterval / 1000)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const startTracking = () => {
    if (!tweetId) return
    
    setIsTracking(true)
    fetchEngagementData()
    
    intervalRef.current = setInterval(() => {
      fetchEngagementData()
    }, updateInterval)

    // Start countdown timer
    startCountdown()
  }

  const stopTracking = () => {
    setIsTracking(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }

  const startCountdown = () => {
    setNextUpdateIn(updateInterval / 1000)
    
    countdownRef.current = setInterval(() => {
      setNextUpdateIn(prev => {
        if (prev <= 1) {
          return updateInterval / 1000
        }
        return prev - 1
      })
    }, 1000)
  }

  const fetchEngagementData = async () => {
    if (!tweetId) return

    try {
      const response = await fetch(`/api/tweets/${tweetId}/engagement`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        const newData: EngagementData = {
          likes: result.likes,
          retweets: result.retweets,
          replies: result.replies,
          points: result.totalPoints,
          lastUpdate: new Date().toISOString(),
        }

        // Track changes
        if (engagementData) {
          const changes: EngagementChange[] = []
          
          if (newData.likes !== engagementData.likes) {
            changes.push({
              type: 'likes',
              change: newData.likes - engagementData.likes,
              timestamp: new Date(),
            })
          }
          
          if (newData.retweets !== engagementData.retweets) {
            changes.push({
              type: 'retweets',
              change: newData.retweets - engagementData.retweets,
              timestamp: new Date(),
            })
          }
          
          if (newData.replies !== engagementData.replies) {
            changes.push({
              type: 'replies',
              change: newData.replies - engagementData.replies,
              timestamp: new Date(),
            })
          }

          if (changes.length > 0) {
            setRecentChanges(prev => [...changes, ...prev].slice(0, 10))
          }
        }

        setEngagementData(newData)
        setLastUpdateTime(new Date())
      }
    } catch (error) {
      console.error('Error fetching engagement data:', error)
    }
  }

  useEffect(() => {
    return () => {
      stopTracking()
    }
  }, [])

  const getChangeIcon = (type: EngagementChange['type']) => {
    switch (type) {
      case 'likes': return <HeartIcon className="h-3 w-3 text-red-500" />
      case 'retweets': return <ArrowPathIcon className="h-3 w-3 text-green-500" />
      case 'replies': return <ChatBubbleLeftIcon className="h-3 w-3 text-blue-500" />
    }
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  if (!tweetId && !initialData) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Submit a tweet to start tracking engagement</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <ArrowTrendingUpIcon className="h-5 w-5" />
            <span>Live Engagement</span>
          </CardTitle>
          {tweetId && (
            <Button
              variant="outline"
              size="sm"
              onClick={isTracking ? stopTracking : startTracking}
            >
              {isTracking ? (
                <>
                  <PauseIcon className="h-4 w-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-1" />
                  Start
                </>
              )}
            </Button>
          )}
        </div>
        
        {isTracking && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <ClockIcon className="h-3 w-3" />
            <span>Next update in {nextUpdateIn}s</span>
            <Progress value={(1 - nextUpdateIn / (updateInterval / 1000)) * 100} className="w-16 h-1" />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {engagementData && (
          <>
            {/* Current Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div 
                className="p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HeartIcon className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Likes</span>
                  </div>
                  <Badge variant="outline">{engagementData.likes}</Badge>
                </div>
              </motion.div>
              
              <motion.div 
                className="p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowPathIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Retweets</span>
                  </div>
                  <Badge variant="outline">{engagementData.retweets}</Badge>
                </div>
              </motion.div>
              
              <motion.div 
                className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ChatBubbleLeftIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Replies</span>
                  </div>
                  <Badge variant="outline">{engagementData.replies}</Badge>
                </div>
              </motion.div>
              
              <motion.div 
                className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrophyIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Points</span>
                  </div>
                  <Badge variant="layeredge">{engagementData.points}</Badge>
                </div>
              </motion.div>
            </div>

            {/* Recent Changes */}
            {recentChanges.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Recent Changes</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  <AnimatePresence>
                    {recentChanges.slice(0, 5).map((change, index) => (
                      <motion.div
                        key={`${change.type}-${change.timestamp.getTime()}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between p-2 rounded bg-card/50 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          {getChangeIcon(change.type)}
                          <span className="capitalize">{change.type}</span>
                          <span className={change.change > 0 ? 'text-green-500' : 'text-red-500'}>
                            {change.change > 0 ? '+' : ''}{change.change}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {formatTimeAgo(change.timestamp)}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Last Update */}
            {lastUpdateTime && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Last updated: {formatTimeAgo(lastUpdateTime)}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
