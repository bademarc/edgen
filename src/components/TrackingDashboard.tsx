'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Activity, Search, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react'

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

  useEffect(() => {
    fetchStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
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
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getMethodSuccessRate = (method: any) => {
    if (method.total === 0) return 0
    return Math.round((method.success / method.total) * 100)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading tracking status...</span>
        </CardContent>
      </Card>
    )
  }

  if (error || !status) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Status</h3>
            <p className="text-gray-500 mb-4">{error || 'Unknown error occurred'}</p>
            <Button onClick={fetchStatus}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tweet Tracking System
              </CardTitle>
              <CardDescription>
                Enhanced multi-method tweet discovery and monitoring
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={status.isRunning ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {status.isRunning ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {status.isRunning ? 'Running' : 'Stopped'}
              </Badge>
              <Button 
                onClick={fetchStatus} 
                variant="outline" 
                size="sm"
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{status.keywords.length}</div>
              <div className="text-sm text-gray-500">Keywords</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{status.currentMethod}</div>
              <div className="text-sm text-gray-500">Current Method</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{status.trackedUsers}</div>
              <div className="text-sm text-gray-500">Tracked Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatUptime(status.uptime)}</div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Monitored Keywords:</h4>
            <div className="flex flex-wrap gap-2">
              {status.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Tweets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {status.stats.totalTweets}
            </div>
            <p className="text-sm text-gray-500">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Claimed Tweets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {status.stats.claimedTweets}
            </div>
            <p className="text-sm text-gray-500">Automatically processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-4 w-4" />
              Unclaimed Tweets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {status.stats.unclaimedTweets}
            </div>
            <p className="text-sm text-gray-500">Awaiting user claim</p>
          </CardContent>
        </Card>
      </div>

      {/* Method Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Method Performance
          </CardTitle>
          <CardDescription>
            Success rates for different tweet discovery methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status.stats.methodStats.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data yet</h3>
              <p className="text-gray-500">
                Method performance data will appear after the system runs for a while.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {status.stats.methodStats.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{method.method}</Badge>
                    <span className="text-sm text-gray-600">
                      {method.success} tweets found in {method.total} attempts
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">
                      {getMethodSuccessRate(method)}% success
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${getMethodSuccessRate(method)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(status.timestamp).toLocaleString()}
      </div>
    </div>
  )
}
