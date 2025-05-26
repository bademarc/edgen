'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { formatDate } from '@/lib/utils'

interface MonitoringData {
  monitoring?: {
    lastCheckAt: string
    tweetsFound: number
    status: string
    errorMessage?: string
    createdAt: string
  }
  user?: {
    autoMonitoringEnabled: boolean
    lastTweetCheck?: string
    tweetCheckCount: number
  }
  isEnabled: boolean
}

export function MonitoringStatus() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMonitoringStatus = async () => {
    try {
      const response = await fetch('/api/monitoring/user')
      if (response.ok) {
        const data = await response.json()
        setMonitoringData(data)
        setError(null)
      } else {
        setError('Failed to fetch monitoring status')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error fetching monitoring status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const triggerManualCheck = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/monitoring/user', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        // Refresh the monitoring status
        await fetchMonitoringStatus()
        
        // Show success message (you could add a toast notification here)
        console.log('Manual check completed:', result)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to trigger manual check')
      }
    } catch (err) {
      setError('Network error during manual check')
      console.error('Error triggering manual check:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleMonitoring = async () => {
    if (!monitoringData) return
    
    setIsUpdating(true)
    try {
      const response = await fetch('/api/monitoring/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          autoMonitoringEnabled: !monitoringData.isEnabled
        })
      })
      
      if (response.ok) {
        await fetchMonitoringStatus()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update monitoring settings')
      }
    } catch (err) {
      setError('Network error during settings update')
      console.error('Error updating monitoring settings:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    fetchMonitoringStatus()
  }, [])

  if (isLoading) {
    return (
      <div className="card-layeredge p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted/50 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-muted/30 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-layeredge p-4 border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-2 text-red-400">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    )
  }

  if (!monitoringData) {
    return null
  }

  const getStatusIcon = () => {
    if (!monitoringData.isEnabled) {
      return <ClockIcon className="h-4 w-4 text-yellow-400" />
    }
    
    switch (monitoringData.monitoring?.status) {
      case 'active':
        return <CheckCircleIcon className="h-4 w-4 text-green-400" />
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
      default:
        return <ClockIcon className="h-4 w-4 text-yellow-400" />
    }
  }

  const getStatusText = () => {
    if (!monitoringData.isEnabled) {
      return 'Monitoring Disabled'
    }
    
    switch (monitoringData.monitoring?.status) {
      case 'active':
        return 'Monitoring Active'
      case 'error':
        return 'Monitoring Error'
      default:
        return 'Monitoring Paused'
    }
  }

  const getStatusColor = () => {
    if (!monitoringData.isEnabled) {
      return 'text-yellow-400'
    }
    
    switch (monitoringData.monitoring?.status) {
      case 'active':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-yellow-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-layeredge p-4 bg-gradient-to-r from-layeredge-blue/5 to-layeredge-orange/5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={triggerManualCheck}
            disabled={isUpdating || !monitoringData.isEnabled}
            className="p-1.5 rounded-lg bg-layeredge-blue/10 hover:bg-layeredge-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Check for new tweets now"
          >
            <ArrowPathIcon className={`h-4 w-4 text-layeredge-blue ${isUpdating ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={toggleMonitoring}
            disabled={isUpdating}
            className="p-1.5 rounded-lg bg-layeredge-orange/10 hover:bg-layeredge-orange/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Toggle monitoring"
          >
            <Cog6ToothIcon className="h-4 w-4 text-layeredge-orange" />
          </button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        {monitoringData.monitoring && (
          <>
            <div>
              Last check: {formatDate(monitoringData.monitoring.lastCheckAt)}
            </div>
            <div>
              Total tweets found: {monitoringData.monitoring.tweetsFound}
            </div>
            {monitoringData.monitoring.errorMessage && (
              <div className="text-red-400">
                Error: {monitoringData.monitoring.errorMessage}
              </div>
            )}
          </>
        )}
        
        {monitoringData.user && (
          <div>
            Checks performed: {monitoringData.user.tweetCheckCount}
          </div>
        )}
      </div>
    </motion.div>
  )
}
