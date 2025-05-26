'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
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
  const { status } = useSession()
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
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
          className="card-layeredge p-6"
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
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="card-layeredge-elevated p-4 bg-gradient-to-r from-success/5 to-success/10"
              >
                <div className="flex items-center space-x-2 text-sm mb-3">
                  <CheckCircleIcon className="h-5 w-5 text-success" />
                  <span className="font-medium text-success">Valid tweet URL detected</span>
                </div>
                <p className="text-sm text-foreground-muted break-all bg-card/50 p-3 rounded-lg">{tweetUrl}</p>
              </motion.div>
            )}

            {/* Points Info */}
            <div className="card-layeredge-elevated p-6 bg-gradient-to-r from-layeredge-orange/5 to-layeredge-orange/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-lg bg-layeredge-orange/10">
                  <SparklesIcon className="h-5 w-5 text-layeredge-orange" />
                </div>
                <span className="font-semibold text-foreground text-lg">Points Breakdown</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-card/50 rounded-lg">
                  <div className="text-2xl font-bold text-layeredge-orange">5</div>
                  <div className="text-sm text-muted-foreground">Base submission</div>
                </div>
                <div className="text-center p-3 bg-card/50 rounded-lg">
                  <div className="text-2xl font-bold text-layeredge-orange">+1</div>
                  <div className="text-sm text-muted-foreground">Per like</div>
                </div>
                <div className="text-center p-3 bg-card/50 rounded-lg">
                  <div className="text-2xl font-bold text-layeredge-orange">+3</div>
                  <div className="text-sm text-muted-foreground">Per retweet</div>
                </div>
                <div className="text-center p-3 bg-card/50 rounded-lg">
                  <div className="text-2xl font-bold text-layeredge-orange">+2</div>
                  <div className="text-sm text-muted-foreground">Per reply</div>
                </div>
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 card-layeredge-elevated p-6 bg-gradient-to-r from-success/10 to-success/5 border-success/20"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-success/10 flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    🎉 Tweet Submitted Successfully!
                  </h3>
                  <p className="text-foreground-muted mb-3">
                    Your tweet has been added to the system and you&apos;ve earned points!
                    Bonus points will be added as the tweet receives engagement.
                  </p>
                  <div className="badge-layeredge-success">
                    Redirecting to your dashboard in 2 seconds...
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {submitStatus === 'content-validation-failed' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 card-layeredge-elevated p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-yellow-500/10 flex-shrink-0">
                  <InformationCircleIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    ⚠️ Content Requirements Not Met
                  </h3>
                  <p className="text-foreground-muted mb-4">
                    {errorMessage}
                  </p>
                  <div className="bg-card/50 p-4 rounded-lg border border-yellow-500/20">
                    <h4 className="font-semibold text-foreground mb-2">📝 To earn points, your tweet must include:</h4>
                    <ul className="space-y-2 text-sm text-foreground-muted">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-layeredge-orange rounded-full"></span>
                        <strong>@layeredge</strong> mention (e.g., &quot;Check out @layeredge!&quot;)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-layeredge-blue rounded-full"></span>
                        <strong>$EDGEN</strong> token reference (e.g., &quot;Bullish on $EDGEN&quot;)
                      </li>
                    </ul>
                    <p className="text-xs text-foreground-muted mt-3 italic">
                      * Case doesn&apos;t matter - both uppercase and lowercase work
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {submitStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 card-layeredge-elevated p-6 bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/20"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-destructive/10 flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Submission Failed
                  </h3>
                  <p className="text-foreground-muted">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
