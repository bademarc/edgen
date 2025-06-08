'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  HeartIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShareIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { SocialSharingService } from '@/lib/social-sharing'
import { toast } from 'sonner'

interface TweetPreviewData {
  content: string
  author: string
  createdAt?: string
  engagement: {
    likes: number
    retweets: number
    replies: number
  }
  points: {
    base: number
    engagement: number
    total: number
  }
  validation: {
    isValid: boolean
    containsKeywords: boolean
    message: string
  }
  source: string
}

interface TweetPreviewProps {
  tweetUrl: string
  onPreviewLoad?: (data: TweetPreviewData) => void
  className?: string
}

export function TweetPreview({ tweetUrl, onPreviewLoad, className }: TweetPreviewProps) {
  const [previewData, setPreviewData] = useState<TweetPreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tweetUrl) {
      setPreviewData(null)
      setError(null)
      return
    }

    const fetchPreview = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/tweets/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tweetUrl }),
        })

        const result = await response.json()

        if (response.ok) {
          setPreviewData(result.preview)
          onPreviewLoad?.(result.preview)
        } else {
          setError(result.error || 'Failed to load tweet preview')
        }
      } catch (error) {
        console.error('Error fetching tweet preview:', error)
        setError('Network error while loading preview')
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchPreview, 800)
    return () => clearTimeout(debounceTimer)
  }, [tweetUrl, onPreviewLoad])

  const handleShare = async () => {
    if (!previewData) return

    const shareText = SocialSharingService.generateTweetShareText({
      content: previewData.content,
      points: previewData.points.total,
      engagement: previewData.engagement,
      tweetUrl,
    })

    try {
      await SocialSharingService.shareWithFallback(
        {
          title: 'LayerEdge Tweet Submission',
          text: shareText,
          url: window.location.href,
        },
        shareText
      )
      toast.success('Share content prepared!')
    } catch (error) {
      toast.error('Failed to share')
    }
  }

  if (!tweetUrl) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tweetUrl}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center space-x-2">
                <SparklesIcon className="h-4 w-4 text-primary" />
                <span>Tweet Preview</span>
              </span>
              {previewData && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-8 w-8 p-0"
                >
                  <ShareIcon className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-full" />
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {previewData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="space-y-4"
              >
                {/* Content Validation */}
                <Alert className={previewData.validation.isValid ? 'border-green-500/20 bg-green-500/5' : 'border-yellow-500/20 bg-yellow-500/5'}>
                  {previewData.validation.isValid ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                  )}
                  <AlertDescription className={previewData.validation.isValid ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}>
                    {previewData.validation.message}
                  </AlertDescription>
                </Alert>

                {/* Tweet Content */}
                <div className="p-4 rounded-lg border bg-card/50">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {previewData.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{previewData.author}</p>
                      {previewData.createdAt && (
                        <p className="text-xs text-muted-foreground flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {new Date(previewData.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{previewData.content}</p>
                </div>

                {/* Engagement Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                    <HeartIcon className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">{previewData.engagement.likes}</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-lg bg-green-500/5 border border-green-500/20">
                    <ArrowPathIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{previewData.engagement.retweets}</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <ChatBubbleLeftIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{previewData.engagement.replies}</span>
                  </div>
                </div>

                {/* Points Breakdown */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold text-sm mb-2 text-primary">Points Breakdown</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Base submission:</span>
                      <Badge variant="outline">{previewData.points.base}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Engagement bonus:</span>
                      <Badge variant="outline">{previewData.points.engagement}</Badge>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total points:</span>
                      <Badge variant="layeredge">{previewData.points.total}</Badge>
                    </div>
                  </div>
                </div>

                {/* Data Source */}
                <div className="text-xs text-muted-foreground text-center">
                  Data source: {previewData.source}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
