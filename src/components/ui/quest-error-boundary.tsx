'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

export class QuestErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Quest system error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto">
              <Card variant="glass">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20">
                      <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-foreground mb-4">
                    Quest System Error
                  </h1>
                  
                  <p className="text-muted-foreground mb-6">
                    We encountered an unexpected error while loading the quest system. 
                    Our team has been notified and is working on a fix.
                  </p>

                  <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold text-foreground mb-2">Troubleshooting Tips:</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Try refreshing the page</li>
                      <li>• Check your internet connection</li>
                      <li>• Clear your browser cache</li>
                      <li>• Try signing out and signing back in</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      variant="layeredge"
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Try Again
                    </Button>
                    
                    <Button variant="outline" asChild>
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Go to Dashboard
                      </Link>
                    </Button>
                  </div>

                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="mt-6 text-left">
                      <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                        Error Details (Development)
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto">
                        {this.state.error.toString()}
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useQuestErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`Quest system error${context ? ` in ${context}` : ''}:`, error)
    
    // You could send this to an error reporting service
    // Example: Sentry.captureException(error, { tags: { context: 'quest-system' } })
  }

  return { handleError }
}
