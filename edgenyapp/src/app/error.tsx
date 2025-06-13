'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  MessageCircle, 
  Bug,
  ArrowLeft,
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error)
  }, [error])

  const getErrorMessage = (error: Error) => {
    // Provide user-friendly error messages
    if (error.message.includes('fetch')) {
      return 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.'
    }
    if (error.message.includes('auth')) {
      return 'There was an authentication issue. Please try logging in again.'
    }
    if (error.message.includes('rate limit')) {
      return 'We\'re experiencing high traffic. Please wait a moment and try again.'
    }
    return 'Something unexpected happened. Our team has been notified and is working on a fix.'
  }

  const getErrorSuggestions = (error: Error) => {
    const suggestions = ['Try refreshing the page', 'Check your internet connection']
    
    if (error.message.includes('auth')) {
      suggestions.push('Sign out and sign back in')
    }
    if (error.message.includes('fetch')) {
      suggestions.push('Wait a few minutes and try again')
    }
    
    suggestions.push('Contact support if the problem persists')
    return suggestions
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* LayerEdge Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center justify-center mb-8"
          >
            <div className="relative">
              <Image
                src="/icon/-AlLx9IW_400x400.png"
                alt="LayerEdge Logo"
                width={80}
                height={80}
                className="rounded-xl"
              />
              <div className="absolute -top-2 -right-2">
                <Badge variant="destructive" className="text-xs">Error</Badge>
              </div>
            </div>
          </motion.div>

          {/* Error Icon and Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We encountered an unexpected error while processing your request. 
              Don't worry - our team has been notified and is working on a fix.
            </p>
          </motion.div>
        </motion.div>

        {/* Error Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">{getErrorMessage(error)}</p>
              {error.digest && (
                <p className="text-xs font-mono bg-destructive/10 p-2 rounded">
                  Error ID: {error.digest}
                </p>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <Button onClick={reset} size="lg" className="min-w-[160px]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.history.back()} className="min-w-[160px]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button variant="outline" asChild size="lg" className="min-w-[160px]">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </motion.div>

        {/* Troubleshooting Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <span>Troubleshooting Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {getErrorSuggestions(error).map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-muted-foreground">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Support Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="bg-muted/30">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span>Need Help?</span>
              </CardTitle>
              <p className="text-muted-foreground">
                If the problem persists, our community and support team are here to help
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" asChild className="h-auto py-4">
                  <a href="https://discord.gg/layeredge" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center space-y-2">
                    <MessageCircle className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">Discord</div>
                      <div className="text-xs text-muted-foreground">Join our community</div>
                    </div>
                  </a>
                </Button>

                <Button variant="outline" asChild className="h-auto py-4">
                  <a href="mailto:community@layeredge.io" className="flex flex-col items-center space-y-2">
                    <Bug className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">Report Bug</div>
                      <div className="text-xs text-muted-foreground">Email support</div>
                    </div>
                  </a>
                </Button>

                <Button variant="outline" asChild className="h-auto py-4">
                  <Link href="/faq" className="flex flex-col items-center space-y-2">
                    <HelpCircle className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">FAQ</div>
                      <div className="text-xs text-muted-foreground">Common questions</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error ID for Support */}
        {error.digest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-6"
          >
            <p className="text-xs text-muted-foreground">
              When contacting support, please include Error ID: <code className="bg-muted px-1 py-0.5 rounded">{error.digest}</code>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
