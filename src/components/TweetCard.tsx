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
}

export function TweetCard({
  tweet,
  showUser = true,
  className = '',
  isUpdating = false,
  onUpdateEngagement,
  showUpdateButton = false
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

  // Track changes in metrics for visual feedback
  useEffect(() => {
    const changes = {
      likes: tweet.likes !== previousMetrics.likes,
      retweets: tweet.retweets !== previousMetrics.retweets,
      replies: tweet.replies !== previousMetrics.replies,
      totalPoints: tweet.totalPoints !== previousMetrics.totalPoints
    }

    setShowChanges(changes)

    // Hide change indicators after 3 seconds
    if (Object.values(changes).some(Boolean)) {
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

    setPreviousMetrics({
      likes: tweet.likes,
      retweets: tweet.retweets,
      replies: tweet.replies,
      totalPoints: tweet.totalPoints
    })
  }, [tweet.likes, tweet.retweets, tweet.replies, tweet.totalPoints, previousMetrics])

  const handleUpdateClick = async () => {
    if (onUpdateEngagement) {
      await onUpdateEngagement(tweet.id)
    }
  }

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
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Updating metrics...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        {showUser && (
          <div className="flex items-center space-x-3">
            {tweet.user.image ? (
              <div className="relative">
                <Image
                  src={tweet.user.image}
                  alt={tweet.user.name || tweet.user.xUsername || 'User'}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full ring-2 ring-border hover:ring-layeredge-orange transition-all duration-300"
                />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-layeredge-orange rounded-full border-2 border-card flex items-center justify-center">
                  <div className="h-2 w-2 bg-black rounded-full"></div>
                </div>
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-muted to-muted-hover flex items-center justify-center ring-2 ring-border">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground hover:text-layeredge-orange transition-colors">
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
            <SparklesIcon className="h-3 w-3 mr-1" />
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
            <button
              onClick={handleUpdateClick}
              disabled={isUpdating}
              className="btn-layeredge-ghost p-2 rounded-lg hover-lift disabled:opacity-50"
              title="Update engagement metrics"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            </button>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6 text-sm">
          <motion.div
            className={`flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors group relative ${showChanges.likes ? 'ring-1 ring-red-400/50 rounded px-2 py-1' : ''}`}
            animate={showChanges.likes ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <HeartIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
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
            <ArrowPathRoundedSquareIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
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
            <ChatBubbleLeftIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
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

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDate(tweet.createdAt)}</span>
          </div>
          <a
            href={tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-layeredge-ghost px-4 py-2 rounded-lg text-sm font-semibold hover-lift"
          >
            View Tweet →
          </a>
        </div>
      </div>
    </motion.div>
  )
}
