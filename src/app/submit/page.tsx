'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { isValidTwitterUrl, isLayerEdgeCommunityUrl } from '@/lib/utils'

const submitSchema = z.object({
  tweetUrl: z.string()
    .min(1, 'Tweet URL is required')
    .refine(isValidTwitterUrl, 'Please enter a valid X (Twitter) URL')
    .refine(isLayerEdgeCommunityUrl, 'Tweet must be from the LayerEdge community'),
})

type SubmitFormData = z.infer<typeof submitSchema>

export default function SubmitPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'content-validation-failed'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SubmitFormData>({
    resolver: zodResolver(submitSchema),
  })

  const tweetUrl = watch('tweetUrl')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        reset()

        // Trigger a page refresh after a short delay to show updated dashboard data
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        // Check if this is a content validation error
        if (result.contentValidationFailed) {
          setSubmitStatus('content-validation-failed')
        } else {
          setSubmitStatus('error')
        }
        setErrorMessage(result.error || 'Failed to submit tweet')
      }
    } catch {
      setSubmitStatus('error')
      setErrorMessage('An error occurred while submitting your tweet. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-layeredge-gradient mb-4">Submit a Tweet</h1>
          <div className="divider-layeredge w-24 mx-auto"></div>
          <p className="mt-6 text-lg text-foreground-muted max-w-xl mx-auto">
            Share a tweet from the LayerEdge community and earn points
          </p>
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="card-layeredge-elevated p-4 bg-gradient-to-r from-layeredge-orange/5 to-layeredge-blue/5 border-layeredge-orange/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-layeredge-orange/10 flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-layeredge-orange" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">💡 Earn Points Requirements</h3>
                  <p className="text-sm text-foreground-muted mb-3">
                    To earn points, your tweet must mention either <strong>@layeredge</strong> or <strong>$EDGEN</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge-layeredge-primary text-xs">@layeredge</span>
                    <span className="badge-layeredge-secondary text-xs">$EDGEN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card-layeredge-elevated p-6 mb-8 bg-gradient-to-r from-layeredge-blue/5 to-layeredge-blue/10"
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-xl bg-layeredge-blue/10 flex-shrink-0">
              <InformationCircleIcon className="h-6 w-6 text-layeredge-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                How to Submit
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-foreground-muted">
                <li>Visit the LayerEdge X community</li>
                <li>Find a tweet you want to submit</li>
                <li>Copy the tweet URL</li>
                <li>Paste it below and submit</li>
              </ol>
              <div className="mt-4">
                <a
                  href="https://x.com/i/communities/1890107751621357663"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-layeredge-secondary px-4 py-2 rounded-lg font-medium inline-flex items-center space-x-2 hover-lift"
                >
                  <span>Visit LayerEdge Community</span>
                  <LinkIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-layeredge p-8 rounded-2xl border border-border/50 bg-gradient-layeredge-radial"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="tweetUrl" className="block text-sm font-medium text-foreground mb-3">
                Tweet URL
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  {...register('tweetUrl')}
                  type="url"
                  id="tweetUrl"
                  placeholder="https://x.com/username/status/123456789"
                  className="input-layeredge w-full pl-12 pr-4 py-4 text-base focus-layeredge"
                />
              </div>
              {errors.tweetUrl && (
                <p className="mt-3 text-sm text-destructive flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  {errors.tweetUrl.message}
                </p>
              )}
            </div>

            {/* URL Preview */}
            {tweetUrl && !errors.tweetUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="neuro-layeredge p-5 rounded-xl bg-gradient-to-br from-success/5 to-green-600/5 border border-success/20"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-full bg-gradient-to-br from-success/20 to-green-600/20 animate-scale-in">
                    <CheckCircleIcon className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <span className="font-bold text-success">Valid Tweet URL Detected</span>
                    <div className="status-indicator success">
                      <span className="text-xs font-medium text-success">VERIFIED</span>
                    </div>
                  </div>
                </div>
                <div className="glass-layeredge-light p-4 rounded-lg border border-success/10">
                  <p className="text-sm text-foreground break-all font-mono">{tweetUrl}</p>
                </div>
              </motion.div>
            )}

            {/* Points Info */}
            <div className="neuro-layeredge p-6 rounded-xl bg-gradient-layeredge border border-layeredge-orange/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 rounded-full bg-gradient-to-br from-layeredge-orange/20 to-layeredge-orange-light/20 animate-scale-in">
                  <SparklesIcon className="h-6 w-6 text-layeredge-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="text-gradient-layeredge">Points Breakdown</span>
                  </h3>
                  <p className="text-sm text-foreground-muted">How you earn points for your tweets</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl glass-layeredge-light border border-layeredge-orange/20 hover-lift">
                  <div className="text-3xl font-bold text-gradient-layeredge mb-2">5</div>
                  <div className="text-xs text-foreground-muted font-medium">Base submission</div>
                </div>
                <div className="text-center p-4 rounded-xl glass-layeredge-light border border-layeredge-blue/20 hover-lift">
                  <div className="text-3xl font-bold text-gradient-blue mb-2">+1</div>
                  <div className="text-xs text-foreground-muted font-medium">Per like</div>
                </div>
                <div className="text-center p-4 rounded-xl glass-layeredge-light border border-success/20 hover-lift">
                  <div className="text-3xl font-bold text-success mb-2">+3</div>
                  <div className="text-xs text-foreground-muted font-medium">Per retweet</div>
                </div>
                <div className="text-center p-4 rounded-xl glass-layeredge-light border border-warning/20 hover-lift">
                  <div className="text-3xl font-bold text-warning mb-2">+2</div>
                  <div className="text-xs text-foreground-muted font-medium">Per reply</div>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-layeredge-orange/5 border border-layeredge-orange/20">
                <p className="text-xs text-layeredge-orange font-medium flex items-center gap-2">
                  <span>⚡</span>
                  Points are updated automatically as your tweet gains engagement!
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-layeredge-primary disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover-lift text-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  Submit Tweet
                </>
              )}
            </button>
          </form>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mt-6 glass-layeredge p-6 rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-green-600/5"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-success/20 to-green-600/20 flex-shrink-0 animate-bounce-in">
                  <CheckCircleIcon className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-foreground">
                      🎉 Tweet Submitted Successfully!
                    </h3>
                    <div className="status-indicator success">
                      <span className="text-xs font-medium text-success">SUCCESS</span>
                    </div>
                  </div>
                  <p className="text-foreground-muted mb-4 leading-relaxed">
                    Your tweet has been added to the system and you&apos;ve earned points!
                    Bonus points will be added as the tweet receives engagement.
                  </p>
                  <div className="neuro-layeredge p-4 rounded-lg bg-gradient-layeredge-radial">
                    <div className="flex items-center justify-between">
                      <div className="badge-layeredge-success animate-pulse">
                        Redirecting to your dashboard in 2 seconds...
                      </div>
                      <div className="progress-layeredge w-24">
                        <div className="progress-layeredge-bar" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {submitStatus === 'content-validation-failed' && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mt-6 glass-layeredge p-6 rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex-shrink-0 animate-bounce-in">
                  <InformationCircleIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-foreground">
                      Content Requirements Not Met
                    </h3>
                    <div className="status-indicator warning">
                      <span className="text-xs font-medium text-yellow-400">VALIDATION FAILED</span>
                    </div>
                  </div>
                  <p className="text-foreground-muted mb-4 leading-relaxed">
                    {errorMessage}
                  </p>
                  <div className="neuro-layeredge p-5 rounded-xl border border-yellow-500/20 bg-gradient-layeredge">
                    <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      <span className="text-gradient-layeredge">Required Keywords</span>
                    </h4>
                    <div className="grid gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/30 border border-layeredge-orange/20">
                        <div className="w-3 h-3 bg-gradient-to-r from-layeredge-orange to-layeredge-orange-light rounded-full animate-pulse"></div>
                        <div>
                          <div className="font-semibold text-layeredge-orange">@layeredge</div>
                          <div className="text-xs text-foreground-muted">e.g., &quot;Check out @layeredge!&quot;</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center text-foreground-muted font-medium">
                        OR
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/30 border border-layeredge-blue/20">
                        <div className="w-3 h-3 bg-gradient-to-r from-layeredge-blue to-layeredge-blue-light rounded-full animate-pulse"></div>
                        <div>
                          <div className="font-semibold text-layeredge-blue">$EDGEN</div>
                          <div className="text-xs text-foreground-muted">e.g., &quot;Bullish on $EDGEN&quot;</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-success/5 border border-success/20">
                      <p className="text-xs text-success font-medium flex items-center gap-2">
                        <span>💡</span>
                        Case doesn&apos;t matter - both uppercase and lowercase work
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {submitStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mt-6 glass-layeredge p-6 rounded-xl border border-destructive/30 bg-gradient-to-br from-destructive/5 to-red-600/5"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-destructive/20 to-red-600/20 flex-shrink-0 animate-bounce-in">
                  <ExclamationTriangleIcon className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-foreground">
                      Submission Failed
                    </h3>
                    <div className="status-indicator error">
                      <span className="text-xs font-medium text-destructive">ERROR</span>
                    </div>
                  </div>
                  <p className="text-foreground-muted leading-relaxed">
                    {errorMessage}
                  </p>
                  <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-muted/30">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>💡</span>
                      Try refreshing the page and submitting again. If the issue persists, please check your internet connection.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
