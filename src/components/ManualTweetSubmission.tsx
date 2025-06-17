'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertTriangle, ExternalLink, Heart, RotateCcw, MessageSquare, MessageCircle, Eye, Star, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatNumber } from '@/lib/utils'

interface TweetVerificationData {
  isValid: boolean
  isOwnTweet: boolean
  containsRequiredMentions: boolean
  tweetData?: {
    id: string
    content: string
    author: {
      username: string
      name: string
    }
    engagement: {
      likes: number
      retweets: number
      replies: number
    }
    createdAt: string
  }
  engagementMetrics?: {
    likes: number
    retweets: number
    replies: number
    quotes: number
    views: number
    bookmarks: number
  }
  enhancedPoints?: {
    basePoints: number
    engagementPoints: number
    totalPoints: number
    breakdown: {
      likes: number
      retweets: number
      replies: number
      quotes: number
      views: number
      bookmarks: number
    }
  }
  engagementError?: string
  tweetId?: string
  error?: string
}

interface SubmissionStatus {
  canSubmit: boolean
  cooldownRemaining?: number
}

export default function ManualTweetSubmission() {
  const [tweetUrl, setTweetUrl] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationData, setVerificationData] = useState<TweetVerificationData | null>(null)
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>({ canSubmit: true })
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null)

  // Check submission status on component mount
  useEffect(() => {
    checkSubmissionStatus()
  }, [])

  const checkSubmissionStatus = async () => {
    try {
      const response = await fetch('/api/tweets/submit')
      if (response.ok) {
        const status = await response.json()
        setSubmissionStatus(status)
      }
    } catch (error) {
      console.error('Error checking submission status:', error)
    }
  }

  const verifyTweet = async () => {
    if (!tweetUrl.trim()) {
      setMessage({ type: 'error', text: 'Please enter a tweet URL' })
      return
    }

    setIsVerifying(true)
    setVerificationData(null)
    setMessage(null)

    try {
      // Use enhanced verification endpoint that includes Apify engagement metrics
      const response = await fetch('/api/tweets/verify-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tweetUrl }),
      })

      const data = await response.json()

      if (response.ok) {
        setVerificationData(data)

        if (!data.isValid) {
          setMessage({ type: 'error', text: data.error || 'Tweet verification failed' })
        } else if (!data.isOwnTweet) {
          setMessage({ type: 'error', text: 'You can only submit tweets that you authored' })
        } else if (!data.containsRequiredMentions) {
          setMessage({ type: 'warning', text: 'Tweet must contain "@layeredge" or "$EDGEN" mentions' })
        } else {
          let successMessage = 'Tweet verified successfully! Ready to submit.'
          if (data.engagementMetrics) {
            successMessage += ` Potential points: ${data.enhancedPoints?.totalPoints || 'calculating...'}`
          }
          setMessage({ type: 'success', text: successMessage })
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Verification failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error during verification' })
    } finally {
      setIsVerifying(false)
    }
  }

  const submitTweet = async () => {
    if (!verificationData?.isValid || !verificationData?.isOwnTweet || !verificationData?.containsRequiredMentions) {
      setMessage({ type: 'error', text: 'Please verify the tweet first' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/tweets/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tweetUrl }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `${data.message} Tweet ID: ${data.tweetId}` 
        })
        setTweetUrl('')
        setVerificationData(null)
        checkSubmissionStatus() // Refresh submission status
      } else {
        setMessage({ type: 'error', text: data.error || 'Submission failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error during submission' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canVerify = tweetUrl.trim() && !isVerifying
  const canSubmit = verificationData?.isValid && verificationData?.isOwnTweet && 
                   verificationData?.containsRequiredMentions && submissionStatus.canSubmit && !isSubmitting

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Submit Tweet Manually</CardTitle>
          <CardDescription className="text-gray-400">
            Submit your tweets containing &ldquo;@layeredge&rdquo; or &ldquo;$EDGEN&rdquo; mentions to earn points
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Submission Status */}
          {!submissionStatus.canSubmit && (
            <Alert className="border-orange-500 bg-orange-500/10">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-200">
                Please wait {submissionStatus.cooldownRemaining} minutes before submitting another tweet.
              </AlertDescription>
            </Alert>
          )}

          {/* Tweet URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Tweet URL</label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://x.com/username/status/1234567890"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                disabled={isVerifying || isSubmitting}
              />
              <Button
                onClick={verifyTweet}
                disabled={!canVerify}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </div>

          {/* Verification Results */}
          <AnimatePresence>
            {verificationData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge variant={verificationData.isValid ? "default" : "destructive"}>
                    {verificationData.isValid ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {verificationData.isValid ? 'Valid URL' : 'Invalid URL'}
                  </Badge>
                  
                  <Badge variant={verificationData.isOwnTweet ? "default" : "destructive"}>
                    {verificationData.isOwnTweet ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {verificationData.isOwnTweet ? 'Your Tweet' : 'Not Your Tweet'}
                  </Badge>
                  
                  <Badge variant={verificationData.containsRequiredMentions ? "default" : "destructive"}>
                    {verificationData.containsRequiredMentions ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {verificationData.containsRequiredMentions ? 'Has Mentions' : 'Missing Mentions'}
                  </Badge>
                </div>

                {/* Tweet Preview */}
                {verificationData.tweetData && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-white">@{verificationData.tweetData.author.username}</p>
                          <p className="text-sm text-gray-400">{verificationData.tweetData.author.name}</p>
                        </div>
                        <a
                          href={tweetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-500 hover:text-orange-400"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <p className="text-gray-300 mb-3">{verificationData.tweetData.content}</p>

                      {/* Enhanced Engagement Metrics */}
                      {verificationData.engagementMetrics ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium text-orange-400">Live Engagement Metrics</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                              <Heart className="h-4 w-4 text-red-500" />
                              <span className="text-white">{formatNumber(verificationData.engagementMetrics.likes)}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                              <RotateCcw className="h-4 w-4 text-green-500" />
                              <span className="text-white">{formatNumber(verificationData.engagementMetrics.retweets)}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10 border border-blue-500/20">
                              <MessageSquare className="h-4 w-4 text-blue-500" />
                              <span className="text-white">{formatNumber(verificationData.engagementMetrics.replies)}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded bg-purple-500/10 border border-purple-500/20">
                              <MessageCircle className="h-4 w-4 text-purple-500" />
                              <span className="text-white">{formatNumber(verificationData.engagementMetrics.quotes)}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                              <Eye className="h-4 w-4 text-yellow-500" />
                              <span className="text-white">{formatNumber(verificationData.engagementMetrics.views)}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                              <Star className="h-4 w-4 text-cyan-500" />
                              <span className="text-white">{formatNumber(verificationData.engagementMetrics.bookmarks)}</span>
                            </div>
                          </div>

                          {/* Points Breakdown */}
                          {verificationData.enhancedPoints && (
                            <div className="mt-3 p-3 rounded bg-orange-500/10 border border-orange-500/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-orange-400">Potential Points</span>
                                <span className="text-lg font-bold text-orange-300">{verificationData.enhancedPoints.totalPoints}</span>
                              </div>
                              <div className="text-xs text-gray-400 space-y-1">
                                <div>Base: {verificationData.enhancedPoints.basePoints} pts</div>
                                <div>Engagement: {verificationData.enhancedPoints.engagementPoints} pts</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span>❤️ {verificationData.tweetData.engagement.likes}</span>
                          <span>🔄 {verificationData.tweetData.engagement.retweets}</span>
                          <span>💬 {verificationData.tweetData.engagement.replies}</span>
                          {verificationData.engagementError && (
                            <span className="text-yellow-400 text-xs">⚠️ {verificationData.engagementError}</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Alert className={`${
                  message.type === 'success' ? 'border-green-500 bg-green-500/10' :
                  message.type === 'warning' ? 'border-orange-500 bg-orange-500/10' :
                  'border-red-500 bg-red-500/10'
                }`}>
                  <AlertDescription className={`${
                    message.type === 'success' ? 'text-green-200' :
                    message.type === 'warning' ? 'text-orange-200' :
                    'text-red-200'
                  }`}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <Button
            onClick={submitTweet}
            disabled={!canSubmit}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Tweet for Points'
            )}
          </Button>

          {/* Instructions */}
          <div className="text-sm text-gray-400 space-y-2">
            <p><strong>Requirements:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Tweet must be authored by you (prevents point farming)</li>
              <li>Tweet must contain &ldquo;@layeredge&rdquo; or &ldquo;$EDGEN&rdquo; mentions</li>
              <li>5-minute cooldown between submissions</li>
            </ul>

            <p><strong>Enhanced Point System:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              <li>Base: 10 points</li>
              <li>Likes: 0.5 pts each (max 50)</li>
              <li>Retweets: 2 pts each (max 100)</li>
              <li>Replies: 1 pt each (max 30)</li>
              <li>Quotes: 3 pts each (max 90)</li>
              <li>Views: 0.01 pts each (max 25)</li>
              <li>Bookmarks: 5 pts each (max 75)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
