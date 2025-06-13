'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartIcon,
  ArrowPathRoundedSquareIcon,
  ChatBubbleLeftIcon,
  SparklesIcon,
  CalendarIcon,
  UserIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { formatDate, formatNumber } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Skeleton } from './skeleton'

interface TweetCardEnhancedProps {
  tweet: {
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
  }
  showUser?: boolean
  className?: string
  isUpdating?: boolean
  onUpdateEngagement?: (tweetId: string) => Promise<void>
  showUpdateButton?: boolean
  variant?: 'default' | 'layeredge' | 'elevated' | 'glass' | 'interactive'
}

export function TweetCardEnhanced({
  tweet,
  showUser = true,
  className = '',
  isUpdating = false,
  onUpdateEngagement,
  showUpdateButton = false,
  variant = 'layeredge'
}: TweetCardEnhancedProps) {
  const [previousMetrics, setPreviousMetrics] = useState({
    likes: tweet.likes,
    retweets: tweet.retweets,
    replies: tweet.replies,
    totalPoints: tweet.totalPoints
  })
  const [showChanges, setShowChanges] = useState({
    likes: false,
    retweets: false,
    replies: false,
    totalPoints: false
  })

  useEffect(() => {
    const changes = {
      likes: tweet.likes !== previousMetrics.likes,
      retweets: tweet.retweets !== previousMetrics.retweets,
      replies: tweet.replies !== previousMetrics.replies,
      totalPoints: tweet.totalPoints !== previousMetrics.totalPoints
    }

    setShowChanges(changes)

    if (Object.values(changes).some(Boolean)) {
      const timer = setTimeout(() => {
        setShowChanges({
          likes: false,
          retweets: false,
          replies: false,
          totalPoints: false
        })
        setPreviousMetrics({
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies,
          totalPoints: tweet.totalPoints
        })
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [tweet.likes, tweet.retweets, tweet.replies, tweet.totalPoints, previousMetrics])

  const handleUpdateEngagement = async () => {
    if (onUpdateEngagement) {
      await onUpdateEngagement(tweet.id)
    }
  }

  if (isUpdating) {
    return (
      <Card variant={variant} className={className}>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex space-x-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card variant={variant} className="relative overflow-hidden">
        {/* Loading overlay */}
        <AnimatePresence>
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-card/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
            >
              <div className="flex items-center space-x-2 text-layeredge-blue">
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Updating metrics...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CardHeader className="pb-3">
          {showUser && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                {tweet.user.image ? (
                  <Image
                    src={tweet.user.image}
                    alt={tweet.user.name || tweet.user.xUsername || 'User'}
                    width={48}
                    height={48}
                    className="rounded-full ring-2 ring-border"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center ring-2 ring-border">
                    <UserIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {tweet.user.name || tweet.user.xUsername}
                  </p>
                  {tweet.user.xUsername && (
                    <p className="text-sm text-muted-foreground">
                      @{tweet.user.xUsername}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tweet.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {tweet.content && (
            <p className="text-sm text-foreground leading-relaxed">
              {tweet.content}
            </p>
          )}

          {/* Engagement metrics */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <motion.div
                className="flex items-center space-x-1"
                animate={showChanges.likes ? { scale: [1, 1.1, 1] } : {}}
              >
                <HeartIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{formatNumber(tweet.likes)}</span>
              </motion.div>

              <motion.div
                className="flex items-center space-x-1"
                animate={showChanges.retweets ? { scale: [1, 1.1, 1] } : {}}
              >
                <ArrowPathRoundedSquareIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{formatNumber(tweet.retweets)}</span>
              </motion.div>

              <motion.div
                className="flex items-center space-x-1"
                animate={showChanges.replies ? { scale: [1, 1.1, 1] } : {}}
              >
                <ChatBubbleLeftIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{formatNumber(tweet.replies)}</span>
              </motion.div>
            </div>

            <motion.div
              animate={showChanges.totalPoints ? { scale: [1, 1.1, 1] } : {}}
            >
              <Badge variant="points" size="lg">
                <SparklesIcon className="h-3 w-3 mr-1" />
                {formatNumber(tweet.totalPoints)} pts
              </Badge>
            </motion.div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href={tweet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs"
              >
                View Tweet
              </a>
            </Button>

            {showUpdateButton && onUpdateEngagement && (
              <Button
                variant="layeredgeSecondary"
                size="sm"
                onClick={handleUpdateEngagement}
                disabled={isUpdating}
              >
                <ArrowPathIcon className="h-3 w-3 mr-1" />
                Update
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
