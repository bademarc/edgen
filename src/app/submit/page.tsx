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
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
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

  const onSubmit = async () => {
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock success/error for demonstration
      const isSuccess = Math.random() > 0.3 // 70% success rate

      if (isSuccess) {
        setSubmitStatus('success')
        reset()
      } else {
        setSubmitStatus('error')
        setErrorMessage('This tweet has already been submitted or is not accessible.')
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
          <h1 className="text-3xl font-bold text-foreground">Submit a Tweet</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Share a tweet from the LayerEdge community and earn points
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8"
        >
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                How to Submit
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
                <li>Visit the LayerEdge X community</li>
                <li>Find a tweet you want to submit</li>
                <li>Copy the tweet URL</li>
                <li>Paste it below and submit</li>
              </ol>
              <div className="mt-4">
                <a
                  href="https://x.com/i/communities/1890107751621363"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
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
          className="bg-card border border-border rounded-lg p-6"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="tweetUrl" className="block text-sm font-medium text-foreground mb-2">
                Tweet URL
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  {...register('tweetUrl')}
                  type="url"
                  id="tweetUrl"
                  placeholder="https://x.com/username/status/123456789"
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              {errors.tweetUrl && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.tweetUrl.message}
                </p>
              )}
            </div>

            {/* URL Preview */}
            {tweetUrl && !errors.tweetUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-muted/50 border border-border rounded-lg p-4"
              >
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Valid tweet URL detected</span>
                </div>
                <p className="text-sm text-foreground break-all">{tweetUrl}</p>
              </motion.div>
            )}

            {/* Points Info */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <SparklesIcon className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Points Breakdown</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Base submission: <span className="text-primary font-medium">5 points</span></li>
                <li>• Per like: <span className="text-primary font-medium">+1 point</span></li>
                <li>• Per retweet: <span className="text-primary font-medium">+3 points</span></li>
                <li>• Per reply: <span className="text-primary font-medium">+2 points</span></li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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
              className="mt-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
            >
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                    Tweet Submitted Successfully!
                  </h3>
                  <p className="text-green-800 dark:text-green-200">
                    Your tweet has been added to the system and you&apos;ve earned 5 base points.
                    Bonus points will be added as the tweet receives engagement.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {submitStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
            >
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                    Submission Failed
                  </h3>
                  <p className="text-red-800 dark:text-red-200">
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
