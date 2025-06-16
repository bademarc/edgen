'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  Cpu
} from 'lucide-react'

interface TrackingStatus {
  isRunning: boolean
  keywords: string[]
  currentMethod: string
  trackedUsers: number
  stats: {
    totalTweets: number
    claimedTweets: number
    unclaimedTweets: number
    methodStats: Array<{
      method: string
      success: number
      total: number
    }>
  }
  uptime: number
  timestamp: string
}

interface TrackingStatusResponse {
  success: boolean
  status: TrackingStatus
}

export default function TrackingDashboard() {
  const [status, setStatus] = useState<TrackingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      setError(null)
      if (!status) setLoading(true)
      else setRefreshing(true)

      const response = await fetch('/api/tracking/status')
      const data: TrackingStatusResponse = await response.json()

      if (data.success) {
        setStatus(data.status)
      } else {
        setError('Failed to fetch tracking status')
      }
    } catch (err) {
      setError('Error fetching tracking status')
      console.error('Error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [status])

  useEffect(() => {
    fetchStatus()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getMethodSuccessRate = (method: { success: number; total: number }) => {
    if (method.total === 0) return 0
    return Math.round((method.success / method.total) * 100)
  }

  if (loading) {
    return (
      <div className="card-layeredge p-8">
        <div className="flex items-center justify-center">
          <RotateCcw className="h-8 w-8 animate-spin text-layeredge-orange" />
          <span className="ml-2 text-foreground">Loading tracking status...</span>
        </div>
      </div>
    )
  }

  if (error || !status) {
    return (
      <div className="card-layeredge p-8">
        <div className="text-center">
          <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Status</h3>
          <p className="text-muted-foreground mb-4">{error || 'Unknown error occurred'}</p>
          <button onClick={fetchStatus} className="btn-layeredge-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <motion.div
        className="card-layeredge hover-glow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Cpu className="h-5 w-5 text-layeredge-orange" />
                Tweet Tracking System
              </h2>
              <p className="text-muted-foreground mt-1">
                Enhanced multi-method tweet discovery and monitoring
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                status.isRunning
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {status.isRunning ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {status.isRunning ? 'Running' : 'Stopped'}
              </span>
              <button
                onClick={fetchStatus}
                className="btn-layeredge-ghost px-3 py-1 text-sm"
                disabled={refreshing}
              >
                {refreshing ? (
                  <RotateCcw className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-background-secondary rounded-lg border border-border">
              <div className="text-2xl font-bold text-layeredge-blue">{status.keywords.length}</div>
              <div className="text-sm text-muted-foreground">Keywords</div>
            </div>
            <div className="text-center p-4 bg-background-secondary rounded-lg border border-border">
              <div className="text-2xl font-bold text-green-400">{status.currentMethod}</div>
              <div className="text-sm text-muted-foreground">Current Method</div>
            </div>
            <div className="text-center p-4 bg-background-secondary rounded-lg border border-border">
              <div className="text-2xl font-bold text-purple-400">{status.trackedUsers}</div>
              <div className="text-sm text-muted-foreground">Tracked Users</div>
            </div>
            <div className="text-center p-4 bg-background-secondary rounded-lg border border-border">
              <div className="text-2xl font-bold text-layeredge-orange">{formatUptime(status.uptime)}</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>

          <div className="p-4 bg-background-secondary rounded-lg border border-border">
            <h4 className="font-medium mb-3 text-foreground">Monitored Keywords:</h4>
            <div className="flex flex-wrap gap-2">
              {status.keywords.map((keyword, index) => (
                <span key={index} className="px-2 py-1 bg-muted text-muted-foreground rounded text-sm border border-border">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          className="card-layeredge hover-glow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-layeredge-blue" />
            Total Tweets
          </h3>
          <div className="text-3xl font-bold text-layeredge-blue">
            {status.stats.totalTweets}
          </div>
          <p className="text-sm text-muted-foreground">Last 24 hours</p>
        </motion.div>

        <motion.div
          className="card-layeredge hover-glow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
            <CheckCircle className="h-4 w-4 text-green-400" />
            Claimed Tweets
          </h3>
          <div className="text-3xl font-bold text-green-400">
            {status.stats.claimedTweets}
          </div>
          <p className="text-sm text-muted-foreground">Automatically processed</p>
        </motion.div>

        <motion.div
          className="card-layeredge hover-glow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-layeredge-orange" />
            Unclaimed Tweets
          </h3>
          <div className="text-3xl font-bold text-layeredge-orange">
            {status.stats.unclaimedTweets}
          </div>
          <p className="text-sm text-muted-foreground">Awaiting user claim</p>
        </motion.div>
      </div>

      {/* Method Performance */}
      <motion.div
        className="card-layeredge hover-glow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-layeredge-orange" />
            Method Performance
          </h2>
          <p className="text-muted-foreground mb-6">
            Success rates for different tweet discovery methods
          </p>

          {status.stats.methodStats.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No data yet</h3>
              <p className="text-muted-foreground">
                Method performance data will appear after the system runs for a while.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {status.stats.methodStats.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-background-secondary rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-sm border border-border">
                      {method.method}
                    </span>
                    <span className="text-sm text-foreground">
                      {method.success} tweets found in {method.total} attempts
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-foreground">
                      {getMethodSuccessRate(method)}% success
                    </div>
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-layeredge-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getMethodSuccessRate(method)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(status.timestamp).toLocaleString()}
      </div>
    </div>
  )
}
