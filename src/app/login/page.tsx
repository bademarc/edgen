'use client'

import { useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ShieldCheckIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon
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

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect
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
              onClick={() => signIn('twitter', { callbackUrl: '/dashboard' })}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Continue with X
              <ArrowRightIcon className="h-4 w-4" />
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
