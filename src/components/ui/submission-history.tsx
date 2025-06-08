'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ClockIcon,
  HeartIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  TrophyIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { SocialSharingService } from '@/lib/social-sharing'
import { toast } from 'sonner'

interface Tweet {
  id: string
  url: string
  content: string
  likes: number
  retweets: number
  replies: number
  totalPoints: number
  createdAt: string
  user: {
    id: string
    name: string
    xUsername: string
    image: string
  }
}

interface SubmissionStats {
  totalTweets: number
  totalPoints: number
  totalLikes: number
  totalRetweets: number
  totalReplies: number
}

interface SubmissionHistoryData {
  tweets: Tweet[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  stats: SubmissionStats
}

interface SubmissionHistoryProps {
  className?: string
  limit?: number
}

export function SubmissionHistory({ className, limit = 5 }: SubmissionHistoryProps) {
  const [data, setData] = useState<SubmissionHistoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const fetchHistory = async (offset: number = 0) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tweets/user/history?limit=${limit}&offset=${offset}`)
      const result = await response.json()

      if (response.ok) {
        setData(result)
      } else {
        setError(result.error || 'Failed to load submission history')
      }
    } catch (error) {
      console.error('Error fetching submission history:', error)
      setError('Network error while loading history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [limit])

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (!data) return

    const newOffset = direction === 'next' 
      ? data.pagination.offset + data.pagination.limit
      : Math.max(0, data.pagination.offset - data.pagination.limit)

    setCurrentPage(direction === 'next' ? currentPage + 1 : currentPage - 1)
    fetchHistory(newOffset)
  }

  const handleShareStats = async () => {
    if (!data) return

    const shareText = SocialSharingService.generateSubmissionShareText(
      data.stats.totalTweets,
      data.stats.totalPoints
    )

    try {
      await SocialSharingService.shareWithFallback(
        {
          title: 'My LayerEdge Community Stats',
          text: shareText,
          url: window.location.href,
        },
        shareText
      )
      toast.success('Stats shared!')
    } catch (error) {
      toast.error('Failed to share stats')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5" />
            <span>Submission History</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.tweets.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5" />
            <span>Submission History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No submissions yet</p>
            <p className="text-sm">Submit your first LayerEdge tweet to get started!</p>
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
            <ClockIcon className="h-5 w-5" />
            <span>Submission History</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleShareStats}>
            <ShareIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="text-lg font-bold text-primary">{data.stats.totalTweets}</div>
            <div className="text-xs text-muted-foreground">Tweets</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="text-lg font-bold text-primary">{data.stats.totalPoints}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <div className="text-lg font-bold text-red-500">{data.stats.totalLikes}</div>
            <div className="text-xs text-muted-foreground">Likes</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="text-lg font-bold text-green-500">{data.stats.totalRetweets}</div>
            <div className="text-xs text-muted-foreground">Retweets</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tweet List */}
        <div className="space-y-3">
          {data.tweets.map((tweet, index) => (
            <motion.div
              key={tweet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm leading-relaxed line-clamp-2 mb-2">
                    {tweet.content}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <ClockIcon className="h-3 w-3" />
                    <span>{formatDate(tweet.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Badge variant="layeredge" className="text-xs">
                    {tweet.totalPoints} pts
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => window.open(tweet.url, '_blank')}
                  >
                    <ExternalLinkIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1 text-red-500">
                  <HeartIcon className="h-3 w-3" />
                  <span>{tweet.likes}</span>
                </div>
                <div className="flex items-center space-x-1 text-green-500">
                  <ArrowPathIcon className="h-3 w-3" />
                  <span>{tweet.retweets}</span>
                </div>
                <div className="flex items-center space-x-1 text-blue-500">
                  <ChatBubbleLeftIcon className="h-3 w-3" />
                  <span>{tweet.replies}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {data.pagination.total > data.pagination.limit && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange('prev')}
              disabled={data.pagination.offset === 0}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {data.pagination.offset + 1}-{Math.min(data.pagination.offset + data.pagination.limit, data.pagination.total)} of {data.pagination.total}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange('next')}
              disabled={!data.pagination.hasMore}
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
