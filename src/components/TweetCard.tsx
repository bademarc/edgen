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
      className={`card-layeredge-interactive p-6 hover-lift ${className}`}
    >
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
          <div className="badge-layeredge-primary">
            <SparklesIcon className="h-3 w-3 mr-1" />
            {formatNumber(tweet.totalPoints)} points
          </div>
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
          <div className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors group">
            <HeartIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{formatNumber(tweet.likes)}</span>
          </div>
          <div className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors group">
            <ArrowPathRoundedSquareIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{formatNumber(tweet.retweets)}</span>
          </div>
          <div className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors group">
            <ChatBubbleLeftIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{formatNumber(tweet.replies)}</span>
          </div>
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
