'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  RotateCcw,
  Clock,
  Info,
  MessageCircle
} from 'lucide-react'

interface ErrorDisplayProps {
  error: {
    type: string
    message: string
    action: string
    retryable: boolean
    retryDelay?: number
    contactSupport?: boolean
    details?: any
  }
  onRetry?: () => void
  onContactSupport?: () => void
  className?: string
}

export function ErrorDisplay({ error, onRetry, onContactSupport, className }: ErrorDisplayProps) {
  const [countdown, setCountdown] = useState(0)
  const [canRetry, setCanRetry] = useState(!error.retryDelay)

  useEffect(() => {
    if (error.retryDelay && error.retryDelay > 0) {
      setCountdown(Math.ceil(error.retryDelay / 1000))
      setCanRetry(false)

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanRetry(true)
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }

    // Return undefined for other cases
    return undefined
  }, [error.retryDelay])

  const getErrorIcon = () => {
    switch (error.type) {
      case 'RATE_LIMITED':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'UNAUTHORIZED_SUBMISSION':
      case 'PRIVATE_TWEET':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'INVALID_URL':
      case 'CONTENT_VALIDATION_FAILED':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
    }
  }

  const getErrorColor = () => {
    switch (error.type) {
      case 'RATE_LIMITED':
        return 'border-yellow-500/20 bg-yellow-500/5'
      case 'UNAUTHORIZED_SUBMISSION':
      case 'PRIVATE_TWEET':
        return 'border-red-500/20 bg-red-500/5'
      case 'INVALID_URL':
      case 'CONTENT_VALIDATION_FAILED':
        return 'border-blue-500/20 bg-blue-500/5'
      default:
        return 'border-orange-500/20 bg-orange-500/5'
    }
  }

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Alert className={getErrorColor()}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getErrorIcon()}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <AlertTitle className="text-base font-semibold">
                {error.message}
              </AlertTitle>
              <AlertDescription className="mt-2 text-sm">
                {error.action}
              </AlertDescription>
            </div>

            {/* Countdown Timer for Rate Limits */}
            {error.type === 'RATE_LIMITED' && countdown > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Retry available in:</span>
                  <Badge variant="outline" className="font-mono">
                    {formatCountdown(countdown)}
                  </Badge>
                </div>
                <Progress 
                  value={((error.retryDelay! / 1000 - countdown) / (error.retryDelay! / 1000)) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {error.retryable && onRetry && (
                <Button
                  onClick={onRetry}
                  disabled={!canRetry}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>
                    {canRetry ? 'Try Again' : `Retry in ${formatCountdown(countdown)}`}
                  </span>
                </Button>
              )}

              {error.contactSupport && onContactSupport && (
                <Button
                  onClick={onContactSupport}
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Contact Support</span>
                </Button>
              )}
            </div>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === 'development' && error.details && (
              <details className="mt-3">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  Debug Information
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </Alert>
    </motion.div>
  )
}

// Specific error components for common scenarios
export function TweetNotFoundError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      error={{
        type: 'TWEET_NOT_FOUND',
        message: 'Tweet not found or deleted',
        action: 'Please try submitting a different tweet from your LayerEdge community posts',
        retryable: false,
        contactSupport: false
      }}
      onRetry={onRetry}
    />
  )
}

export function RateLimitError({ retryDelay, onRetry }: { retryDelay: number; onRetry?: () => void }) {
  return (
    <ErrorDisplay
      error={{
        type: 'RATE_LIMITED',
        message: 'Twitter API temporarily unavailable',
        action: 'Please wait for the countdown to complete before trying again',
        retryable: true,
        retryDelay,
        contactSupport: true
      }}
      onRetry={onRetry}
    />
  )
}

export function UnauthorizedError({ tweetAuthor, authenticatedUser }: { tweetAuthor: string; authenticatedUser: string }) {
  return (
    <ErrorDisplay
      error={{
        type: 'UNAUTHORIZED_SUBMISSION',
        message: 'You can only submit your own tweets',
        action: `This tweet was posted by @${tweetAuthor}, but you're authenticated as @${authenticatedUser}. Please submit a tweet from your own account.`,
        retryable: false,
        contactSupport: false,
        details: { tweetAuthor, authenticatedUser }
      }}
    />
  )
}

export function ContentValidationError({ content }: { content: string }) {
  return (
    <ErrorDisplay
      error={{
        type: 'CONTENT_VALIDATION_FAILED',
        message: 'Tweet content validation failed',
        action: 'Your tweet must contain either "@layeredge" or "$EDGEN" to earn points. Please submit a tweet that mentions LayerEdge or the $EDGEN token.',
        retryable: false,
        contactSupport: false,
        details: { content: content.substring(0, 200) }
      }}
    />
  )
}
