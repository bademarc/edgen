'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  WifiOff, 
  RefreshCw, 
  Home, 
  Clock,
  Signal,
  Smartphone,
  Globe
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Automatically redirect when back online
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    window.location.reload()
  }

  const offlineTips = [
    {
      icon: Signal,
      title: 'Check Your Connection',
      description: 'Make sure you\'re connected to WiFi or mobile data'
    },
    {
      icon: Smartphone,
      title: 'Try Mobile Data',
      description: 'Switch between WiFi and mobile data to see if one works better'
    },
    {
      icon: Globe,
      title: 'Check Network Settings',
      description: 'Ensure your device isn\'t in airplane mode'
    },
    {
      icon: Clock,
      title: 'Wait and Retry',
      description: 'Sometimes network issues resolve themselves after a few minutes'
    }
  ]

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
                <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Offline Icon and Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center justify-center mb-4">
              <div className={`p-4 rounded-full ${isOnline ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                {isOnline ? (
                  <Signal className="h-12 w-12 text-green-500" />
                ) : (
                  <WifiOff className="h-12 w-12 text-destructive" />
                )}
              </div>
            </div>
            
            {isOnline ? (
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-green-500">Back Online!</h1>
                <p className="text-muted-foreground text-lg">
                  Great! Your connection has been restored. Redirecting you back to LayerEdge...
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">You&apos;re Offline</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  It looks like you&apos;ve lost your internet connection. Don&apos;t worry - some features may still work,
                  and we&apos;ll help you get back online to continue earning LayerEdge points!
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Connection Status Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <Alert variant={isOnline ? "default" : "destructive"}>
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Connection Status</AlertTitle>
            <AlertDescription>
              {isOnline ? (
                "Your internet connection has been restored. You can now access all LayerEdge features."
              ) : (
                "You&apos;re currently offline. Some features may not be available until your connection is restored."
              )}
              {retryCount > 0 && (
                <span className="block mt-2 text-xs">
                  Retry attempts: {retryCount}
                </span>
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
          <Button onClick={handleRetry} size="lg" className="min-w-[160px]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
          <Button variant="outline" asChild size="lg" className="min-w-[160px]">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </motion.div>

        {/* Troubleshooting Tips */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Troubleshooting Tips</CardTitle>
                <p className="text-center text-muted-foreground">
                  Try these steps to restore your connection
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offlineTips.map((tip, index) => (
                    <motion.div
                      key={tip.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <tip.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{tip.title}</h4>
                        <p className="text-xs text-muted-foreground">{tip.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Offline Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card className="bg-muted/30">
            <CardHeader className="text-center">
              <CardTitle>What You Can Do Offline</CardTitle>
              <p className="text-muted-foreground">
                Some LayerEdge features are still available while offline
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="p-3 rounded-full bg-blue-500/10 w-fit mx-auto mb-3">
                    <Clock className="h-6 w-6 text-blue-500" />
                  </div>
                  <h4 className="font-semibold mb-2">View Cached Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Access previously loaded leaderboards and statistics
                  </p>
                </div>

                <div className="text-center p-4">
                  <div className="p-3 rounded-full bg-green-500/10 w-fit mx-auto mb-3">
                    <Smartphone className="h-6 w-6 text-green-500" />
                  </div>
                  <h4 className="font-semibold mb-2">Browse Offline Pages</h4>
                  <p className="text-sm text-muted-foreground">
                    Read FAQ, terms, and other static content
                  </p>
                </div>

                <div className="text-center p-4">
                  <div className="p-3 rounded-full bg-purple-500/10 w-fit mx-auto mb-3">
                    <RefreshCw className="h-6 w-6 text-purple-500" />
                  </div>
                  <h4 className="font-semibold mb-2">Auto-Sync</h4>
                  <p className="text-sm text-muted-foreground">
                    Your actions will sync when connection returns
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> LayerEdge works best with a stable internet connection for real-time point tracking and tweet submissions.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
