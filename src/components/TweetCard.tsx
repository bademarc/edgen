import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  RotateCw,
  MessageCircle,
  Sparkles,
  User,
  RotateCw as ArrowPath
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { useState, useEffect, useCallback, memo, useRef } from 'react'
import { ButtonTooltip } from '@/components/ui/tooltip'

interface TweetCardProps {
  tweet: {
    id: string
    url: string
    content?: string | null
    likes: number
    retweets: number
    replies: number
    totalPoints: number
    createdAt: Date
    submittedAt?: Date // FIXED: Add submitted date for tooltip
    originalTweetDate?: Date // FIXED: Add original tweet date
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
  onUserClick?: (user: {
    id: string
    name?: string | null
    xUsername?: string | null
    image?: string | null
    totalPoints: number
    rank?: number
    tweetsCount?: number
  }) => void
}

export const TweetCard = memo(function TweetCard({
  tweet,
  showUser = true,
  className = '',
  isUpdating = false,
  onUpdateEngagement,
  showUpdateButton = false,
  onUserClick
}: TweetCardProps) {
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

  // CRITICAL FIX: Use ref to store previous metrics and avoid circular dependency
  const previousMetricsRef = useRef(previousMetrics)

  // Track changes in metrics for visual feedback
  useEffect(() => {
    const currentPreviousMetrics = previousMetricsRef.current

    const changes = {
      likes: tweet.likes !== currentPreviousMetrics.likes,
      retweets: tweet.retweets !== currentPreviousMetrics.retweets,
      replies: tweet.replies !== currentPreviousMetrics.replies,
      totalPoints: tweet.totalPoints !== currentPreviousMetrics.totalPoints
    }

    // Only update if there are actual changes
    if (Object.values(changes).some(Boolean)) {
      setShowChanges(changes)

      // Update previous metrics
      const newMetrics = {
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies,
        totalPoints: tweet.totalPoints
      }
      setPreviousMetrics(newMetrics)
      previousMetricsRef.current = newMetrics

      // Hide change indicators after 3 seconds
      const timer = setTimeout(() => {
        setShowChanges({
          likes: false,
          retweets: false,
          replies: false,
          totalPoints: false
        })
      }, 3000)

      return () => clearTimeout(timer)
    }

    // Return undefined for the else case
    return undefined
  }, [tweet.likes, tweet.retweets, tweet.replies, tweet.totalPoints]) // CRITICAL FIX: Removed previousMetrics dependency

  const handleUpdateClick = useCallback(async () => {
    if (onUpdateEngagement) {
      await onUpdateEngagement(tweet.id)
    }
  }, [onUpdateEngagement, tweet.id])

  const handleUserClick = useCallback(() => {
    if (onUserClick) {
      onUserClick({
        id: tweet.user.id,
        name: tweet.user.name,
        xUsername: tweet.user.xUsername,
        image: tweet.user.image,
        totalPoints: tweet.totalPoints,
        // Note: rank and tweetsCount would need to be provided by parent component
        // or fetched from API if needed for the profile modal
      })
    }
  }, [onUserClick, tweet.user, tweet.totalPoints])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-layeredge-interactive p-6 hover-lift relative ${className} ${isUpdating ? 'opacity-75' : ''}`}
    >
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
              <ArrowPath className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Updating metrics...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        {showUser && (
          <div
            className={`flex items-center space-x-3 ${onUserClick ? 'cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-all duration-200' : ''}`}
            onClick={onUserClick ? handleUserClick : undefined}
          >
            {tweet.user.image ? (
              <div className="relative">
                <Image
                  src={tweet.user.image}
                  alt={tweet.user.name || tweet.user.xUsername || 'User'}
                  width={40}
                  height={40}
                  className={`h-10 w-10 rounded-full ring-2 ring-border transition-all duration-300 ${onUserClick ? 'hover:ring-layeredge-orange hover:scale-105' : 'hover:ring-layeredge-orange'}`}
                />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-layeredge-orange rounded-full border-2 border-card flex items-center justify-center">
                  <div className="h-2 w-2 bg-black rounded-full"></div>
                </div>
              </div>
            ) : (
              <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-muted to-muted-hover flex items-center justify-center ring-2 ring-border transition-all duration-300 ${onUserClick ? 'hover:ring-layeredge-orange hover:scale-105' : ''}`}>
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className={`font-semibold text-foreground transition-colors ${onUserClick ? 'hover:text-layeredge-orange' : ''}`}>
                {tweet.user.name || tweet.user.xUsername || 'Anonymous'}
              </p>
              {tweet.user.xUsername && (
                <p className="text-sm text-muted-foreground">@{tweet.user.xUsername}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <motion.div
            className={`badge-layeredge-primary ${showChanges.totalPoints ? 'ring-2 ring-layeredge-orange' : ''}`}
            animate={showChanges.totalPoints ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {formatNumber(tweet.totalPoints)} points
            <AnimatePresence>
              {showChanges.totalPoints && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-1 -right-1 h-2 w-2 bg-layeredge-orange rounded-full"
                />
              )}
            </AnimatePresence>
          </motion.div>
          {showUpdateButton && (
            <ButtonTooltip
              tooltip={isUpdating ? 'Fetching latest engagement data...' : 'Refresh likes, retweets, and replies from X/Twitter'}
              side="top"
              className="btn-layeredge-ghost p-2 rounded-lg hover-lift disabled:opacity-50 btn-with-tooltip"
              onClick={handleUpdateClick}
              disabled={isUpdating}
            >
              <ArrowPath className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            </ButtonTooltip>
          )}
        </div>
      </div>

      {/* Content */}
      {tweet.content && (
        <div className="mb-6">
          <p className="text-foreground leading-relaxed text-base">
            {tweet.content}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="divider-layeredge my-4"></div>

      {/* Engagement Stats */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-6 text-sm">
          <motion.div
            className={`flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors group relative ${showChanges.likes ? 'ring-1 ring-red-400/50 rounded px-2 py-1' : ''}`}
            animate={showChanges.likes ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Heart className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{formatNumber(tweet.likes)}</span>
            <AnimatePresence>
              {showChanges.likes && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-1 -right-1 h-2 w-2 bg-red-400 rounded-full"
                />
              )}
            </AnimatePresence>
          </motion.div>
          <motion.div
            className={`flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors group relative ${showChanges.retweets ? 'ring-1 ring-green-400/50 rounded px-2 py-1' : ''}`}
            animate={showChanges.retweets ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <RotateCw className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{formatNumber(tweet.retweets)}</span>
            <AnimatePresence>
              {showChanges.retweets && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-1 -right-1 h-2 w-2 bg-green-400 rounded-full"
                />
              )}
            </AnimatePresence>
          </motion.div>
          <motion.div
            className={`flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors group relative ${showChanges.replies ? 'ring-1 ring-blue-400/50 rounded px-2 py-1' : ''}`}
            animate={showChanges.replies ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{formatNumber(tweet.replies)}</span>
            <AnimatePresence>
              {showChanges.replies && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-1 -right-1 h-2 w-2 bg-blue-400 rounded-full"
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
})
