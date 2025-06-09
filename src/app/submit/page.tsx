'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import {
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  InformationCircleIcon,
  HeartIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  TrophyIcon,
  ClockIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { isValidTwitterUrl, isLayerEdgeCommunityUrl, extractUsernameFromTweetUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { TweetPreview } from '@/components/ui/tweet-preview'
import { SubmissionHistory } from '@/components/ui/submission-history'
import { RealTimeEngagement } from '@/components/ui/real-time-engagement'
import { AchievementNotification, useAchievementNotifications } from '@/components/ui/achievement-notification'
import { SocialSharingService } from '@/lib/social-sharing'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { ErrorDisplay } from '@/components/ui/error-display'

const submitSchema = z.object({
  tweetUrl: z.string()
    .min(1, 'Tweet URL is required')
    .refine(isValidTwitterUrl, 'Please enter a valid X (Twitter) URL')
    .refine(isLayerEdgeCommunityUrl, 'Tweet must be from the LayerEdge community'),
})

type SubmitFormData = z.infer<typeof submitSchema>

// Typewriter effect hook with error handling
const useTypewriter = (text: string, speed: number = 50) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Reset if text changes
    if (currentIndex === 0 && displayText !== '') {
      setDisplayText('')
    }
  }, [text])

  useEffect(() => {
    if (!text || currentIndex >= text.length) {
      return
    }

    const timeout = setTimeout(() => {
      try {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      } catch (error) {
        console.error('Typewriter effect error:', error)
        // Fallback to full text
        setDisplayText(text)
        setCurrentIndex(text.length)
      }
    }, speed)

    return () => clearTimeout(timeout)
  }, [currentIndex, text, speed])

  // Fallback to full text if something goes wrong
  return displayText || text
}

export default function SubmitPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'content-validation-failed'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [tweetData, setTweetData] = useState<any>(null)
  const [showEngagementMetrics, setShowEngagementMetrics] = useState(false)
  const [submittedTweetId, setSubmittedTweetId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)

  // Achievement notifications
  const { currentAchievement, showAchievement, dismissCurrent } = useAchievementNotifications()

  const form = useForm<SubmitFormData>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      tweetUrl: '',
    },
  })

  const tweetUrl = form.watch('tweetUrl')

  // Typewriter effects
  const heroText = useTypewriter('Submit Your LayerEdge Tweet', 80)
  const subtitleText = useTypewriter('Earn points for engaging with the LayerEdge community', 40)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const onSubmit = async (data: SubmitFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')
    setTweetData(null)

    try {
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweetUrl: data.tweetUrl,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setTweetData(result)
        setSubmittedTweetId(result.id)
        setShowEngagementMetrics(true)

        // Show success toast
        toast.success('Tweet submitted successfully!', {
          description: `You earned ${result.totalPoints} points!`,
          duration: 5000,
        })

        // Check for achievements (mock logic - replace with real achievement checking)
        if (result.totalPoints >= 100) {
          showAchievement({
            id: 'high-scorer',
            name: 'High Scorer',
            description: 'Earned 100+ points from a single tweet!',
            icon: '🏆',
            rarity: 'rare',
            points: 50,
            category: 'engagement',
          })
        }

        // Reset form
        form.reset()

        // Redirect to dashboard after delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 5000) // Increased delay to show engagement tracking
      } else {
        // Enhanced error handling with detailed error information
        setSubmitStatus('error')
        setErrorDetails(result)
        setErrorMessage(result.error || 'Failed to submit tweet')

        // Show appropriate toast based on error type
        if (result.errorType === 'UNAUTHORIZED_SUBMISSION') {
          toast.error('Unauthorized Submission', {
            description: `You can only submit your own tweets. This tweet was authored by @${result.details?.tweetAuthor}.`,
          })
        } else if (result.errorType === 'CONTENT_VALIDATION_FAILED') {
          toast.error('Content validation failed', {
            description: 'Tweet must contain @layeredge or $EDGEN',
          })
        } else if (result.errorType === 'RATE_LIMITED') {
          toast.error('Rate Limited', {
            description: result.action,
          })
        } else if (result.errorType === 'DUPLICATE_SUBMISSION') {
          toast.error('Duplicate Tweet', {
            description: result.action,
          })
        } else {
          toast.error('Submission failed', {
            description: result.error || 'Failed to submit tweet',
          })
        }
      }
    } catch (error) {
      console.error('Error submitting tweet:', error)
      setSubmitStatus('error')
      setErrorDetails({
        errorType: 'NETWORK_ERROR',
        error: 'Network error. Please try again.',
        action: 'Please check your internet connection and try again',
        retryable: true,
        retryDelay: 5000
      })
      setErrorMessage('Network error. Please try again.')
      toast.error('Network error', {
        description: 'Please check your connection and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle tweet preview data
  const handlePreviewLoad = (data: any) => {
    setPreviewData(data)
  }

  // Retry submission handler
  const handleRetrySubmission = () => {
    setSubmitStatus('idle')
    setErrorMessage('')
    setErrorDetails(null)
    // Re-trigger form submission
    const currentValues = form.getValues()
    if (currentValues.tweetUrl) {
      onSubmit(currentValues)
    }
  }

  // Contact support handler
  const handleContactSupport = () => {
    // Open support email or chat
    window.open('mailto:support@layeredge.io?subject=Tweet Submission Issue', '_blank')
  }

  // Social sharing handler
  const handleShareSubmission = async () => {
    if (!previewData) return

    const shareText = SocialSharingService.generateTweetShareText({
      content: previewData.content,
      points: previewData.points.total,
      engagement: previewData.engagement,
      tweetUrl: form.getValues('tweetUrl'),
    })

    try {
      await SocialSharingService.shareWithFallback(
        {
          title: 'My LayerEdge Tweet Submission',
          text: shareText,
          url: window.location.href,
        },
        shareText
      )
      toast.success('Submission shared!')
    } catch (error) {
      toast.error('Failed to share')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/icon/-AlLx9IW_400x400.png"
              alt="LayerEdge Logo"
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg mr-4"
            />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {heroText}
                <span className="animate-pulse">|</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                {subtitleText}
                <span className="animate-pulse">|</span>
              </p>
            </div>
          </div>

          <Alert className="max-w-2xl mx-auto mb-8">
            <InformationCircleIcon className="h-4 w-4" />
            <AlertDescription>
              To earn points, your tweet must mention either <strong className="text-primary">@layeredge</strong> or <strong className="text-primary">$EDGEN</strong>
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Instructions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card variant="layeredge" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <InformationCircleIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">How to Submit</CardTitle>
                  <CardDescription>Follow these simple steps to earn points</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <ol className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <Badge variant="outline" className="mt-0.5">1</Badge>
                      <span className="text-sm text-muted-foreground">Visit the LayerEdge X community</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Badge variant="outline" className="mt-0.5">2</Badge>
                      <span className="text-sm text-muted-foreground">Find a tweet you want to submit</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Badge variant="outline" className="mt-0.5">3</Badge>
                      <span className="text-sm text-muted-foreground">Copy the tweet URL</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Badge variant="outline" className="mt-0.5">4</Badge>
                      <span className="text-sm text-muted-foreground">Paste it below and submit</span>
                    </li>
                  </ol>
                </div>
                <div className="flex items-center justify-center">
                  <Button asChild variant="outline" className="w-full">
                    <a
                      href="https://x.com/i/communities/1890107751621357663"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>Visit LayerEdge Community</span>
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Form and Preview */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card variant="elevated" className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SparklesIcon className="h-5 w-5 text-primary" />
                    <span>Submit Tweet</span>
                  </CardTitle>
                  <CardDescription>
                    Enter your LayerEdge tweet URL to earn points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="tweetUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tweet URL</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  variant="layeredge"
                                  inputSize="lg"
                                  type="url"
                                  placeholder="https://x.com/username/status/123456789"
                                  className="pl-10"
                                  disabled={isSubmitting}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Paste the URL of your LayerEdge community tweet
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* URL Preview */}
                      {tweetUrl && isValidTwitterUrl(tweetUrl) && isLayerEdgeCommunityUrl(tweetUrl) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert className="border-green-500/20 bg-green-500/5">
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            <AlertDescription className="text-green-700 dark:text-green-300">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Valid Tweet URL Detected</span>
                                <Badge variant="outline" className="text-green-600 border-green-500/30">
                                  VERIFIED
                                </Badge>
                              </div>
                              <div className="mt-2 p-2 bg-background/50 rounded border text-xs font-mono break-all">
                                {tweetUrl}
                              </div>
                              {(() => {
                                const urlUsername = extractUsernameFromTweetUrl(tweetUrl)
                                if (urlUsername) {
                                  return (
                                    <div className="mt-2 text-xs">
                                      <span className="text-muted-foreground">Tweet author: </span>
                                      <span className="font-medium">@{urlUsername}</span>
                                    </div>
                                  )
                                }
                                return null
                              })()}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}

                      <Separator />

                      {/* Error Display */}
                      {submitStatus === 'error' && errorDetails && (
                        <ErrorDisplay
                          error={errorDetails}
                          onRetry={errorDetails.retryable ? handleRetrySubmission : undefined}
                          onContactSupport={errorDetails.contactSupport ? handleContactSupport : undefined}
                        />
                      )}

                      <Button
                        type="submit"
                        variant="layeredge"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="h-4 w-4 mr-2" />
                            Submit Tweet
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tweet Preview */}
            {tweetUrl && isValidTwitterUrl(tweetUrl) && isLayerEdgeCommunityUrl(tweetUrl) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ErrorBoundary>
                  <TweetPreview
                    tweetUrl={tweetUrl}
                    onPreviewLoad={handlePreviewLoad}
                  />
                </ErrorBoundary>
              </motion.div>
            )}

            {/* Submission History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <ErrorBoundary>
                <SubmissionHistory limit={5} />
              </ErrorBoundary>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Points Info */}
            <Card variant="accent" className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-primary">
                  <TrophyIcon className="h-5 w-5" />
                  <span>Points Breakdown</span>
                </CardTitle>
                <CardDescription>
                  How you earn points for your tweets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 rounded-lg border bg-card/50 hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <div className="text-2xl font-bold text-primary mb-1">5</div>
                    <div className="text-xs text-muted-foreground">Base submission</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 rounded-lg border bg-card/50 hover:bg-blue-500/5 transition-colors cursor-pointer"
                  >
                    <div className="text-2xl font-bold text-blue-500 mb-1">+1</div>
                    <div className="text-xs text-muted-foreground">Per like</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 rounded-lg border bg-card/50 hover:bg-green-500/5 transition-colors cursor-pointer"
                  >
                    <div className="text-2xl font-bold text-green-500 mb-1">+3</div>
                    <div className="text-xs text-muted-foreground">Per retweet</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 rounded-lg border bg-card/50 hover:bg-yellow-500/5 transition-colors cursor-pointer"
                  >
                    <div className="text-2xl font-bold text-yellow-500 mb-1">+2</div>
                    <div className="text-xs text-muted-foreground">Per reply</div>
                  </motion.div>
                </div>

                <Alert>
                  <ClockIcon className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Points are updated automatically as your tweet gains engagement!
                  </AlertDescription>
                </Alert>

                {/* Real-time Engagement Metrics */}
                {showEngagementMetrics && tweetData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <Separator />
                    <h4 className="font-semibold text-sm">Live Engagement</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <HeartIcon className="h-4 w-4 text-red-500" />
                          <span>Likes</span>
                        </div>
                        <Badge variant="outline">{tweetData.likes || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <ArrowPathIcon className="h-4 w-4 text-green-500" />
                          <span>Retweets</span>
                        </div>
                        <Badge variant="outline">{tweetData.retweets || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <ChatBubbleLeftIcon className="h-4 w-4 text-blue-500" />
                          <span>Replies</span>
                        </div>
                        <Badge variant="outline">{tweetData.replies || 0}</Badge>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Real-time Engagement Tracking */}
            {(submittedTweetId || showEngagementMetrics) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ErrorBoundary>
                  <RealTimeEngagement
                    tweetId={submittedTweetId || undefined}
                    initialData={tweetData ? {
                      likes: tweetData.likes || 0,
                      retweets: tweetData.retweets || 0,
                      replies: tweetData.replies || 0,
                      points: tweetData.totalPoints || 0,
                      lastUpdate: new Date().toISOString(),
                    } : undefined}
                    updateInterval={30000}
                  />
                </ErrorBoundary>
              </motion.div>
            )}

            {/* Social Sharing */}
            {previewData && (
              <Card variant="subtle">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <ShareIcon className="h-4 w-4" />
                    <span>Share Your Submission</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => SocialSharingService.shareToTwitter(
                        SocialSharingService.generateTweetShareText({
                          content: previewData.content,
                          points: previewData.points.total,
                          engagement: previewData.engagement,
                          tweetUrl: form.getValues('tweetUrl'),
                        })
                      )}
                    >
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareSubmission}
                    >
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8"
          >
            <Alert className="border-green-500/20 bg-green-500/5">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">🎉 Tweet Submitted Successfully!</span>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                    SUCCESS
                  </Badge>
                </div>
                <p className="text-sm mb-3">
                  Your tweet has been added to the system and you've earned points!
                  Bonus points will be added as the tweet receives engagement.
                </p>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="animate-pulse">Redirecting to dashboard in 3 seconds...</div>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {submitStatus === 'content-validation-failed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8"
          >
            <Alert className="border-yellow-500/20 bg-yellow-500/5">
              <InformationCircleIcon className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Content Requirements Not Met</span>
                  <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                    VALIDATION FAILED
                  </Badge>
                </div>
                <p className="text-sm mb-4">{errorMessage}</p>

                <Card className="bg-background/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <span>📝</span>
                      <span>Required Keywords</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border bg-primary/5">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div>
                        <div className="font-semibold text-primary">@layeredge</div>
                        <div className="text-xs text-muted-foreground">e.g., "Check out @layeredge!"</div>
                      </div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground font-medium">OR</div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border bg-blue-500/5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div>
                        <div className="font-semibold text-blue-500">$EDGEN</div>
                        <div className="text-xs text-muted-foreground">e.g., "Bullish on $EDGEN"</div>
                      </div>
                    </div>
                    <Alert className="border-green-500/20 bg-green-500/5">
                      <AlertDescription className="text-xs text-green-600 dark:text-green-400">
                        💡 Case doesn't matter - both uppercase and lowercase work
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {submitStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8"
          >
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Submission Failed</span>
                  <Badge variant="destructive">ERROR</Badge>
                </div>
                <p className="text-sm mb-3">{errorMessage}</p>
                <div className="text-xs text-muted-foreground">
                  💡 Try refreshing the page and submitting again. If the issue persists, please check your internet connection.
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Achievement Notification */}
        <AchievementNotification
          achievement={currentAchievement}
          onDismiss={dismissCurrent}
        />
      </div>
    </div>
  )
}
