'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface WebSocketMessage {
  type: 'engagement_update' | 'batch_update' | 'error' | 'status'
  data: any
  timestamp: Date
}

export interface EngagementUpdateData {
  tweetId: string
  tweetUrl: string
  metrics: {
    likes: number
    retweets: number
    replies: number
    source: 'api' | 'scraper'
    timestamp: Date
  }
  previousMetrics?: {
    likes: number
    retweets: number
    replies: number
  }
}

export interface BatchUpdateData {
  updates: EngagementUpdateData[]
  totalProcessed: number
  successCount: number
  failureCount: number
}

export interface FallbackStatus {
  apiFailureCount: number
  lastApiFailure: Date | null
  isApiRateLimited: boolean
  rateLimitResetTime: Date | null
  preferredSource: 'api' | 'scraper'
}

export interface UseWebSocketReturn {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  fallbackStatus: FallbackStatus | null
  sendMessage: (message: any) => void
  subscribe: (tweetId: string, tweetUrl: string) => void
  unsubscribe: (tweetId: string) => void
  requestUpdate: (tweetUrls: string[]) => void
  getStatus: () => void
  connectionError: string | null
}

export function useWebSocket(url: string = '/api/ws/engagement'): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [fallbackStatus, setFallbackStatus] = useState<FallbackStatus | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000 // 3 seconds

  const connect = useCallback(() => {
    try {
      // Create WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}${url}`
      
      console.log(`Connecting to WebSocket: ${wsUrl}`)
      
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttempts.current = 0
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          
          // Handle specific message types
          if (message.type === 'status' && message.data.fallbackStatus) {
            setFallbackStatus(message.data.fallbackStatus)
          }
          
          console.log('WebSocket message received:', message.type)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay * reconnectAttempts.current)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError('Failed to reconnect after multiple attempts')
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionError('WebSocket connection error')
      }

    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      setConnectionError('Failed to create WebSocket connection')
    }
  }, [url])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting')
      wsRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message))
      } catch (error) {
        console.error('Error sending WebSocket message:', error)
      }
    } else {
      console.warn('WebSocket is not connected, cannot send message')
    }
  }, [])

  const subscribe = useCallback((tweetId: string, tweetUrl: string) => {
    sendMessage({
      type: 'subscribe_tweet',
      data: { tweetId, tweetUrl }
    })
  }, [sendMessage])

  const unsubscribe = useCallback((tweetId: string) => {
    sendMessage({
      type: 'unsubscribe_tweet',
      data: { tweetId }
    })
  }, [sendMessage])

  const requestUpdate = useCallback((tweetUrls: string[]) => {
    sendMessage({
      type: 'request_update',
      data: { tweetUrls }
    })
  }, [sendMessage])

  const getStatus = useCallback(() => {
    sendMessage({
      type: 'get_status',
      data: {}
    })
  }, [sendMessage])

  // Connect on mount
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Request initial status when connected
  useEffect(() => {
    if (isConnected) {
      getStatus()
    }
  }, [isConnected, getStatus])

  return {
    isConnected,
    lastMessage,
    fallbackStatus,
    sendMessage,
    subscribe,
    unsubscribe,
    requestUpdate,
    getStatus,
    connectionError,
  }
}

// Hook for enhanced real-time engagement with WebSocket support
export function useEnhancedRealTimeEngagement(tweets: any[], enabled: boolean = true) {
  const webSocket = useWebSocket()
  const [enhancedTweets, setEnhancedTweets] = useState(tweets)
  const [lastUpdateSource, setLastUpdateSource] = useState<'api' | 'scraper' | null>(null)

  // Update tweets when WebSocket receives engagement updates
  useEffect(() => {
    if (webSocket.lastMessage?.type === 'engagement_update') {
      const updateData = webSocket.lastMessage.data as EngagementUpdateData
      
      setEnhancedTweets(prevTweets =>
        prevTweets.map(tweet => {
          if (tweet.id === updateData.tweetId) {
            setLastUpdateSource(updateData.metrics.source)
            return {
              ...tweet,
              likes: updateData.metrics.likes,
              retweets: updateData.metrics.retweets,
              replies: updateData.metrics.replies,
            }
          }
          return tweet
        })
      )
    } else if (webSocket.lastMessage?.type === 'batch_update') {
      const batchData = webSocket.lastMessage.data as BatchUpdateData
      
      setEnhancedTweets(prevTweets =>
        prevTweets.map(tweet => {
          const update = batchData.updates.find(u => u.tweetId === tweet.id)
          if (update) {
            setLastUpdateSource(update.metrics.source)
            return {
              ...tweet,
              likes: update.metrics.likes,
              retweets: update.metrics.retweets,
              replies: update.metrics.replies,
            }
          }
          return tweet
        })
      )
    }
  }, [webSocket.lastMessage])

  // Subscribe to tweets when they change
  useEffect(() => {
    if (enabled && webSocket.isConnected && tweets.length > 0) {
      tweets.forEach(tweet => {
        if (tweet.url) {
          webSocket.subscribe(tweet.id, tweet.url)
        }
      })
    }
  }, [tweets, enabled, webSocket.isConnected, webSocket.subscribe])

  // Update local tweets when props change
  useEffect(() => {
    setEnhancedTweets(tweets)
  }, [tweets])

  const requestBatchUpdate = useCallback(() => {
    if (webSocket.isConnected && enhancedTweets.length > 0) {
      const tweetUrls = enhancedTweets.map(tweet => tweet.url).filter(Boolean)
      webSocket.requestUpdate(tweetUrls)
    }
  }, [webSocket, enhancedTweets])

  return {
    tweets: enhancedTweets,
    isConnected: webSocket.isConnected,
    fallbackStatus: webSocket.fallbackStatus,
    lastUpdateSource,
    requestBatchUpdate,
    connectionError: webSocket.connectionError,
  }
}
