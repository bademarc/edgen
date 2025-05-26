'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'
import {
  ShieldCheckIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

const permissions = [
  {
    name: 'Read your X profile',
    description: 'We need this to identify you and display your username.',
    icon: UserGroupIcon,
  },
  {
    name: 'Access your public tweets',
    description: 'To verify tweet submissions from the LayerEdge community.',
    icon: SparklesIcon,
  },
  {
    name: 'Secure authentication',
    description: 'Your data is protected with industry-standard security.',
    icon: ShieldCheckIcon,
  },
]

// Component that uses useSearchParams - needs to be wrapped in Suspense
function LoginContent() {
  const { user, isLoading, signInWithTwitter } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'error'>('info')
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    // Check for messages from URL parameters
    const urlMessage = searchParams.get('message')
    const error = searchParams.get('error')

    if (error) {
      setMessage('Authentication failed. Please try again.')
      setMessageType('error')
    } else if (urlMessage) {
      setMessage(urlMessage)
      setMessageType('warning')
    }
  }, [searchParams])

  useEffect(() => {
    // Redirect if already authenticated
    if (user && !isLoading) {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
      router.push(callbackUrl)
    }
  }, [user, isLoading, router, searchParams])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render login form if already authenticated
  if (user) {
    return null
  }

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signInWithTwitter()
    } catch (error) {
      console.error('Sign in failed:', error)
      setMessage('Sign in failed. Please try again.')
      setMessageType('error')
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
            <span className="text-2xl font-bold text-white">LE</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Join the LayerEdge Community
          </h2>
          <p className="mt-2 text-muted-foreground">
            Sign in with your X account to start earning points
          </p>
        </motion.div>

        {/* Message display */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`p-4 rounded-lg border ${
              messageType === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : messageType === 'warning'
                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {messageType === 'error' ? (
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
              ) : (
                <InformationCircleIcon className="h-5 w-5 flex-shrink-0" />
              )}
              <p className="text-sm">{message}</p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              What we&apos;ll access:
            </h3>
            {permissions.map((permission, index) => (
              <motion.div
                key={permission.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                className="flex items-start space-x-3"
              >
                <div className="flex-shrink-0">
                  <permission.icon className="h-5 w-5 text-primary mt-0.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {permission.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {permission.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6"
          >
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSigningIn ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              )}
              {isSigningIn ? 'Signing in...' : 'Continue with X'}
              {!isSigningIn && <ArrowRightIcon className="h-4 w-4" />}
            </button>
          </motion.div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground">
            New to LayerEdge?{' '}
            <a
              href="/about"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Learn more about our project
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
