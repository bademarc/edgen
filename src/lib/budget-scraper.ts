import { getCacheService } from './cache'

interface ScrapingResult {
  success: boolean
  data?: any
  error?: string
  cached?: boolean
}

class BudgetScrapingService {
  private cache = getCacheService()
  private requestQueue: Array<{ url: string; priority: number; timestamp: number }> = []
  private processing = false
  private readonly DELAY_BETWEEN_REQUESTS = 2000 // 2 seconds to avoid rate limiting

  constructor() {
    this.startQueueProcessor()
  }

  /**
   * Smart scraping with aggressive caching
   */
  async scrapeTweetData(tweetUrl: string): Promise<ScrapingResult> {
    const cacheKey = `tweet_scrape:${this.hashUrl(tweetUrl)}`
    
    // Check cache first (30 minute TTL)
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      console.log('📋 Returning cached tweet data')
      return { success: true, data: cached, cached: true }
    }

    // Add to queue for processing
    await this.addToQueue(tweetUrl, 1)
    
    // For immediate response, try lightweight scraping
    try {
      const result = await this.lightweightScrape(tweetUrl)
      
      if (result.success) {
        // Cache for 30 minutes
        await this.cache.set(cacheKey, result.data, 1800)
      }
      
      return result
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Scraping failed' }
    }
  }

  /**
   * Lightweight scraping using fetch (no browser)
   */
  private async lightweightScrape(tweetUrl: string): Promise<ScrapingResult> {
    try {
      // Extract tweet ID from URL
      const tweetId = this.extractTweetId(tweetUrl)
      if (!tweetId) {
        throw new Error('Invalid tweet URL')
      }

      // Use Twitter's oEmbed API (free and no auth required)
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`
      
      const response = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LayerEdge/1.0)',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const oembedData = await response.json()
      
      // Parse engagement metrics from HTML (basic parsing)
      const metrics = this.parseMetricsFromHtml(oembedData.html || '')
      
      return {
        success: true,
        data: {
          id: tweetId,
          url: tweetUrl,
          content: this.extractTextFromHtml(oembedData.html || ''),
          author: oembedData.author_name || 'Unknown',
          likes: metrics.likes || 0,
          retweets: metrics.retweets || 0,
          replies: metrics.replies || 0,
          timestamp: new Date().toISOString(),
          source: 'oembed'
        }
      }
    } catch (error) {
      console.error('Lightweight scraping failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Fallback: Use public Twitter API endpoints (no auth required)
   */
  private async publicApiScrape(tweetId: string): Promise<ScrapingResult> {
    try {
      // Some public endpoints that don't require auth (use carefully)
      const publicUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`
      
      const response = await fetch(publicUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LayerEdge/1.0)',
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        throw new Error(`Public API failed: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data: {
          id: tweetId,
          content: data.text || '',
          author: data.user?.screen_name || 'Unknown',
          likes: data.favorite_count || 0,
          retweets: data.retweet_count || 0,
          replies: data.reply_count || 0,
          timestamp: data.created_at || new Date().toISOString(),
          source: 'public_api'
        }
      }
    } catch (error) {
      console.error('Public API scraping failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Public API failed' }
    }
  }

  /**
   * Queue management for rate limiting
   */
  private async addToQueue(url: string, priority: number): Promise<void> {
    this.requestQueue.push({
      url,
      priority,
      timestamp: Date.now()
    })
    
    // Sort by priority
    this.requestQueue.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Process queue with delays
   */
  private async startQueueProcessor(): Promise<void> {
    if (this.processing) return
    this.processing = true

    setInterval(async () => {
      if (this.requestQueue.length === 0) return

      const request = this.requestQueue.shift()
      if (!request) return

      try {
        console.log(`🔄 Processing queued scrape: ${request.url}`)
        await this.lightweightScrape(request.url)
        
        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, this.DELAY_BETWEEN_REQUESTS))
      } catch (error) {
        console.error('Queue processing error:', error)
      }
    }, this.DELAY_BETWEEN_REQUESTS)
  }

  /**
   * Batch processing for multiple tweets
   */
  async batchScrape(tweetUrls: string[]): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = []
    
    // Process in chunks to avoid overwhelming
    const chunks = this.chunkArray(tweetUrls, 5)
    
    for (const chunk of chunks) {
      const promises = chunk.map(url => this.scrapeTweetData(url))
      const chunkResults = await Promise.allSettled(promises)
      
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({ success: false, error: result.reason })
        }
      })
      
      // Delay between chunks
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    
    return results
  }

  /**
   * Utility functions
   */
  private extractTweetId(url: string): string | null {
    const match = url.match(/status\/(\d+)/)
    return match ? match[1] : null
  }

  private hashUrl(url: string): string {
    // Simple hash function for caching
    let hash = 0
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString()
  }

  private parseMetricsFromHtml(html: string): { likes?: number; retweets?: number; replies?: number } {
    // Basic regex parsing for engagement metrics
    const metrics: any = {}
    
    // This is a simplified parser - in production you'd want more robust parsing
    const likeMatch = html.match(/(\d+)\s*likes?/i)
    const retweetMatch = html.match(/(\d+)\s*retweets?/i)
    const replyMatch = html.match(/(\d+)\s*replies?/i)
    
    if (likeMatch) metrics.likes = parseInt(likeMatch[1])
    if (retweetMatch) metrics.retweets = parseInt(retweetMatch[1])
    if (replyMatch) metrics.replies = parseInt(replyMatch[1])
    
    return metrics
  }

  private extractTextFromHtml(html: string): string {
    // Remove HTML tags and extract text content
    return html.replace(/<[^>]*>/g, '').trim()
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Get scraping statistics
   */
  getStats(): { queueSize: number; processing: boolean } {
    return {
      queueSize: this.requestQueue.length,
      processing: this.processing
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple oEmbed request
      const testUrl = 'https://publish.twitter.com/oembed?url=https://twitter.com/twitter/status/1'
      const response = await fetch(testUrl, { signal: AbortSignal.timeout(5000) })
      return response.ok
    } catch {
      return false
    }
  }
}

// Singleton instance
let budgetScrapingService: BudgetScrapingService | null = null

export function getBudgetScrapingService(): BudgetScrapingService {
  if (!budgetScrapingService) {
    budgetScrapingService = new BudgetScrapingService()
  }
  return budgetScrapingService
}

export { BudgetScrapingService }
