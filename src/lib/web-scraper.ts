/**
 * Web Scraper Service - Simplified implementation for tweet data extraction
 * This service provides fallback web scraping capabilities when API access is limited
 */

export interface ScrapedTweetData {
  id: string
  url: string
  content: string
  author: string
  likes: number
  retweets: number
  replies: number
  timestamp: string
  source: 'scraper'
}

export interface ScrapingResult {
  success: boolean
  data?: ScrapedTweetData
  error?: string
}

export class WebScraperService {
  private isInitialized = false
  private browserAvailable = false

  constructor() {
    // Initialize without browser for now - use lightweight methods
    this.isInitialized = true
    this.browserAvailable = false
  }

  /**
   * Check if browser is available for scraping
   */
  isBrowserAvailable(): boolean {
    return this.browserAvailable
  }

  /**
   * Check if the service is ready
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Scrape tweet data using lightweight methods (no browser required)
   */
  async scrapeTweet(tweetUrl: string): Promise<ScrapingResult> {
    try {
      // Extract tweet ID from URL
      const tweetId = this.extractTweetId(tweetUrl)
      if (!tweetId) {
        return { success: false, error: 'Invalid tweet URL' }
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
        return { success: false, error: `HTTP ${response.status}` }
      }

      const oembedData = await response.json()

      // Parse engagement metrics from HTML (basic parsing)
      const metrics = this.parseMetricsFromHtml(oembedData.html || '')

      // Extract username from author_url
      const authorUsername = this.extractUsernameFromAuthorUrl(oembedData.author_url) ||
                            this.extractUsernameFromUrl(tweetUrl) ||
                            oembedData.author_name ||
                            'Unknown'

      return {
        success: true,
        data: {
          id: tweetId,
          url: tweetUrl,
          content: this.extractTextFromHtml(oembedData.html || ''),
          author: authorUsername,
          likes: metrics.likes || 0,
          retweets: metrics.retweets || 0,
          replies: metrics.replies || 0,
          timestamp: new Date().toISOString(),
          source: 'scraper'
        }
      }
    } catch (error) {
      console.error('Web scraping failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Extract tweet ID from URL
   */
  private extractTweetId(url: string): string | null {
    const match = url.match(/twitter\.com\/\w+\/status\/(\d+)|x\.com\/\w+\/status\/(\d+)/)
    return match ? (match[1] || match[2]) : null
  }

  /**
   * Extract username from author URL
   */
  private extractUsernameFromAuthorUrl(authorUrl?: string): string | null {
    if (!authorUrl) return null
    const match = authorUrl.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/)
    return match ? match[1] : null
  }

  /**
   * Extract username from tweet URL
   */
  private extractUsernameFromUrl(url: string): string | null {
    const match = url.match(/(?:twitter\.com|x\.com)\/([^\/]+)\/status\//)
    return match ? match[1] : null
  }

  /**
   * Parse basic metrics from HTML (simplified)
   */
  private parseMetricsFromHtml(html: string): { likes: number; retweets: number; replies: number } {
    // This is a simplified parser - in production you'd want more robust parsing
    const metrics = { likes: 0, retweets: 0, replies: 0 }
    
    // Try to extract numbers from common patterns
    const likeMatch = html.match(/(\d+)\s*(?:like|heart)/i)
    const retweetMatch = html.match(/(\d+)\s*(?:retweet|share)/i)
    const replyMatch = html.match(/(\d+)\s*(?:repl|comment)/i)
    
    if (likeMatch) metrics.likes = parseInt(likeMatch[1], 10)
    if (retweetMatch) metrics.retweets = parseInt(retweetMatch[1], 10)
    if (replyMatch) metrics.replies = parseInt(replyMatch[1], 10)
    
    return metrics
  }

  /**
   * Extract text content from HTML
   */
  private extractTextFromHtml(html: string): string {
    // Remove HTML tags and decode entities
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
  }

  /**
   * Initialize browser (placeholder for future implementation)
   */
  async initializeBrowser(): Promise<void> {
    // Placeholder - browser initialization would go here
    console.log('Browser initialization not implemented - using lightweight methods')
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cleanup any resources if needed
    this.isInitialized = false
  }
}

// Singleton instance
let webScraperInstance: WebScraperService | null = null

/**
 * Get the web scraper singleton instance
 */
export function getWebScraperInstance(): WebScraperService {
  if (!webScraperInstance) {
    webScraperInstance = new WebScraperService()
  }
  return webScraperInstance
}

export default WebScraperService
