import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import { getFallbackService, FallbackEngagementMetrics } from './fallback-service'

export interface WebSocketMessage {
  type: 'engagement_update' | 'batch_update' | 'error' | 'status'
  data: any
  timestamp: Date
}

export interface EngagementUpdateData {
  tweetId: string
  tweetUrl: string
  metrics: FallbackEngagementMetrics
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

export class WebSocketService {
  private wss: WebSocketServer | null = null
  private clients: Set<WebSocket> = new Set()
  private updateInterval: NodeJS.Timeout | null = null
  private isRunning = false
  private fallbackService = getFallbackService()

  constructor(private server?: Server) {}

  initialize(server?: Server): void {
    if (this.wss) {
      console.log('WebSocket server already initialized')
      return
    }

    try {
      this.wss = new WebSocketServer({ 
        server: server || this.server,
        path: '/api/ws/engagement'
      })

      this.wss.on('connection', (ws: WebSocket) => {
        console.log('New WebSocket client connected')
        this.clients.add(ws)

        // Send initial status
        this.sendToClient(ws, {
          type: 'status',
          data: {
            connected: true,
            fallbackStatus: this.fallbackService.getStatus()
          },
          timestamp: new Date()
        })

        ws.on('message', (message: string) => {
          try {
            const data = JSON.parse(message)
            this.handleClientMessage(ws, data)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        })

        ws.on('close', () => {
          console.log('WebSocket client disconnected')
          this.clients.delete(ws)
        })

        ws.on('error', (error) => {
          console.error('WebSocket client error:', error)
          this.clients.delete(ws)
        })
      })

      this.wss.on('error', (error) => {
        console.error('WebSocket server error:', error)
      })

      this.isRunning = true
      console.log('WebSocket server initialized successfully')
    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error)
    }
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'subscribe_tweet':
        this.handleTweetSubscription(ws, message.data)
        break
      case 'unsubscribe_tweet':
        this.handleTweetUnsubscription(ws, message.data)
        break
      case 'request_update':
        this.handleUpdateRequest(ws, message.data)
        break
      case 'get_status':
        this.sendFallbackStatus(ws)
        break
      default:
        console.log('Unknown WebSocket message type:', message.type)
    }
  }

  private handleTweetSubscription(ws: WebSocket, data: { tweetId: string, tweetUrl: string }): void {
    // Store subscription info (you might want to implement a more sophisticated subscription system)
    console.log(`Client subscribed to tweet: ${data.tweetId}`)
    
    // Send immediate update for this tweet
    this.updateSingleTweet(data.tweetUrl, data.tweetId)
  }

  private handleTweetUnsubscription(ws: WebSocket, data: { tweetId: string }): void {
    console.log(`Client unsubscribed from tweet: ${data.tweetId}`)
  }

  private async handleUpdateRequest(ws: WebSocket, data: { tweetUrls: string[] }): Promise<void> {
    if (!data.tweetUrls || !Array.isArray(data.tweetUrls)) {
      this.sendToClient(ws, {
        type: 'error',
        data: { message: 'Invalid tweet URLs provided' },
        timestamp: new Date()
      })
      return
    }

    try {
      console.log(`Processing update request for ${data.tweetUrls.length} tweets`)
      
      const results = await this.fallbackService.getBatchEngagementMetrics(data.tweetUrls)
      
      const updates: EngagementUpdateData[] = []
      let successCount = 0
      let failureCount = 0

      for (const result of results) {
        if (result.metrics) {
          const tweetId = this.extractTweetIdFromUrl(result.url)
          if (tweetId) {
            updates.push({
              tweetId,
              tweetUrl: result.url,
              metrics: result.metrics
            })
            successCount++
          }
        } else {
          failureCount++
        }
      }

      const batchUpdate: BatchUpdateData = {
        updates,
        totalProcessed: data.tweetUrls.length,
        successCount,
        failureCount
      }

      this.sendToClient(ws, {
        type: 'batch_update',
        data: batchUpdate,
        timestamp: new Date()
      })

      console.log(`Batch update completed: ${successCount} successful, ${failureCount} failed`)
    } catch (error) {
      console.error('Error processing update request:', error)
      this.sendToClient(ws, {
        type: 'error',
        data: { message: 'Failed to process update request' },
        timestamp: new Date()
      })
    }
  }

  private sendFallbackStatus(ws: WebSocket): void {
    this.sendToClient(ws, {
      type: 'status',
      data: {
        fallbackStatus: this.fallbackService.getStatus(),
        connectedClients: this.clients.size,
        isRunning: this.isRunning
      },
      timestamp: new Date()
    })
  }

  private async updateSingleTweet(tweetUrl: string, tweetId: string): Promise<void> {
    try {
      const metrics = await this.fallbackService.getEngagementMetrics(tweetUrl)
      
      if (metrics) {
        const updateData: EngagementUpdateData = {
          tweetId,
          tweetUrl,
          metrics
        }

        this.broadcast({
          type: 'engagement_update',
          data: updateData,
          timestamp: new Date()
        })
      }
    } catch (error) {
      console.error(`Error updating single tweet ${tweetId}:`, error)
    }
  }

  private extractTweetIdFromUrl(url: string): string | null {
    const match = url.match(/\/status\/(\d+)/)
    return match ? match[1] : null
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message))
      } catch (error) {
        console.error('Error sending message to client:', error)
      }
    }
  }

  private broadcast(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message)
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr)
        } catch (error) {
          console.error('Error broadcasting to client:', error)
          this.clients.delete(client)
        }
      } else {
        this.clients.delete(client)
      }
    })
  }

  startPeriodicUpdates(intervalMs: number = 60000): void {
    if (this.updateInterval) {
      console.log('Periodic updates already running')
      return
    }

    this.updateInterval = setInterval(() => {
      this.broadcastStatus()
    }, intervalMs)

    console.log(`Started periodic WebSocket updates every ${intervalMs}ms`)
  }

  stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
      console.log('Stopped periodic WebSocket updates')
    }
  }

  private broadcastStatus(): void {
    this.broadcast({
      type: 'status',
      data: {
        fallbackStatus: this.fallbackService.getStatus(),
        connectedClients: this.clients.size,
        timestamp: new Date()
      },
      timestamp: new Date()
    })
  }

  getConnectedClientsCount(): number {
    return this.clients.size
  }

  isInitialized(): boolean {
    return this.wss !== null && this.isRunning
  }

  close(): void {
    this.stopPeriodicUpdates()
    
    if (this.wss) {
      this.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.close()
        }
      })
      
      this.wss.close()
      this.wss = null
    }
    
    this.clients.clear()
    this.isRunning = false
    console.log('WebSocket service closed')
  }
}

// Singleton instance
let webSocketServiceInstance: WebSocketService | null = null

export function getWebSocketService(server?: Server): WebSocketService {
  if (!webSocketServiceInstance) {
    webSocketServiceInstance = new WebSocketService(server)
  }
  return webSocketServiceInstance
}

// Client-side WebSocket hook for React components
export interface UseWebSocketReturn {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  sendMessage: (message: any) => void
  subscribe: (tweetId: string, tweetUrl: string) => void
  unsubscribe: (tweetId: string) => void
  requestUpdate: (tweetUrls: string[]) => void
  getStatus: () => void
}

// This would be used in React components
export function useWebSocket(url: string = '/api/ws/engagement'): UseWebSocketReturn {
  // This is a placeholder - actual implementation would use React hooks
  // and would be implemented in a separate client-side file
  throw new Error('useWebSocket hook should be implemented in client-side code')
}
