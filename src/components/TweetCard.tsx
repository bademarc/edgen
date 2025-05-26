import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  HeartIcon,
  ArrowPathRoundedSquareIcon,
  ChatBubbleLeftIcon,
  SparklesIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { formatDate, formatNumber } from '@/lib/utils'

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
}

export function TweetCard({ tweet, showUser = true, className = '' }: TweetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-layeredge p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        {showUser && (
          <div className="flex items-center space-x-3">
            {tweet.user.image ? (
              <Image
                src={tweet.user.image}
                alt={tweet.user.name || tweet.user.xUsername || 'User'}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">
                {tweet.user.name || tweet.user.xUsername || 'Anonymous'}
              </p>
              {tweet.user.xUsername && (
                <p className="text-sm text-muted-foreground">@{tweet.user.xUsername}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-layeredge-orange/10 px-3 py-1 rounded-full">
            <SparklesIcon className="h-4 w-4 text-layeredge-orange" />
            <span className="text-sm font-semibold text-layeredge-orange">
              {formatNumber(tweet.totalPoints)} points
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      {tweet.content && (
        <div className="mb-4">
          <p className="text-foreground leading-relaxed">
            {tweet.content}
          </p>
        </div>
      )}

      {/* Engagement Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <HeartIcon className="h-4 w-4" />
            <span>{formatNumber(tweet.likes)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ArrowPathRoundedSquareIcon className="h-4 w-4" />
            <span>{formatNumber(tweet.retweets)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ChatBubbleLeftIcon className="h-4 w-4" />
            <span>{formatNumber(tweet.replies)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDate(tweet.createdAt)}</span>
          </div>
          <a
            href={tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-layeredge-orange hover:text-layeredge-orange-light text-sm font-semibold transition-colors"
          >
            View Tweet →
          </a>
        </div>
      </div>
    </motion.div>
  )
}
