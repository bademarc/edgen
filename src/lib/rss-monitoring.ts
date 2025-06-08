import { prisma } from './db'
import { validateTweetContent } from './tweet-validation'

interface RSSFeed {
  url: string
  name: string
  active: boolean
  lastCheck?: Date
  priority: number
}

interface RSSItem {
  title: string
  link: string
  description: string
  pubDate: string
  guid?: string
}

interface MonitoringResult {
  totalTweets: number
  newTweets: number
  errors: string[]
  feedResults: Array<{
    feedName: string
    tweetsFound: number
    success: boolean
    error?: string
  }>
}

export class RSSMonitoringService {
  private feeds: RSSFeed[] = [
    {
      url: 'https://nitter.net/search/rss?q=%40layeredge',
      name: 'Nitter @layeredge',
      active: true,
      priority: 1
    },
    {
      url: 'https://nitter.net/search/rss?q=%24EDGEN',
      name: 'Nitter $EDGEN',
      active: true,
      priority: 1
    },
    {
      url: 'https://nitter.privacydev.net/search/rss?q=layeredge',
      name: 'PrivacyDev LayerEdge',
      active: true,
      priority: 2
    },
    {
      url: 'https://nitter.fdn.fr/search/rss?q=%40layeredge%20OR%20%24EDGEN',
      name: 'FDN Combined',
      active: true,
      priority: 2
    },
    {
      url: 'https://nitter.1d4.us/search/rss?q=layeredge',
      name: '1d4.us LayerEdge',
      active: true,
      priority: 3
    }
  ]

  /**
   * Monitor all active RSS feeds for LayerEdge mentions
   */
  async monitorAllFeeds(): Promise<MonitoringResult> {
    console.log('🔍 Starting RSS monitoring for LayerEdge mentions...')
    
    const results: MonitoringResult = {
      totalTweets: 0,
      newTweets: 0,
      errors: [],
      feedResults: []
    }

    // Sort feeds by priority
    const activeFeedsOrdered = this.feeds
      .filter(f => f.active)
      .sort((a, b) => a.priority - b.priority)

    for (const feed of activeFeedsOrdered) {
      try {
        console.log(`📡 Monitoring RSS feed: ${feed.name}`)
        const feedResult = await this.monitorSingleFeed(feed)
        
        results.feedResults.push({
          feedName: feed.name,
          tweetsFound: feedResult.tweetsFound,
          success: true
        })

        results.totalTweets += feedResult.totalProcessed
        results.newTweets += feedResult.newTweets

        feed.lastCheck = new Date()
        
        // Add delay between feeds to be respectful
        await this.delay(2000)

      } catch (error) {
        const errorMsg = `RSS feed ${feed.name} failed: ${error instanceof Error ? error.message : String(error)}`
        console.error('❌', errorMsg)
        
        results.errors.push(errorMsg)
        results.feedResults.push({
          feedName: feed.name,
          tweetsFound: 0,
          success: false,
          error: errorMsg
        })

        // Mark feed as temporarily inactive if it fails repeatedly
        await this.handleFeedError(feed)
      }
    }

    console.log(`✅ RSS monitoring completed: ${results.newTweets} new tweets from ${results.totalTweets} total`)
    return results
  }

  /**
   * Monitor a single RSS feed
   */
  private async monitorSingleFeed(feed: RSSFeed): Promise<{
    tweetsFound: number
    totalProcessed: number
    newTweets: number
  }> {
    const items = await this.fetchAndParseFeed(feed.url)
    
    let totalProcessed = 0
    let newTweets = 0
    let tweetsFound = 0

    for (const item of items) {
      try {
        // Extract and validate tweet content
        const tweetData = this.extractTweetData(item)
        
        if (!tweetData || !validateTweetContent(tweetData.content)) {
          continue
        }

        tweetsFound++
        totalProcessed++

        // Check if this is a new tweet
        const isNew = await this.processTweet(tweetData)
        if (isNew) {
          newTweets++
          console.log(`🆕 New tweet discovered: ${tweetData.url}`)
        }

      } catch (error) {
        console.warn(`⚠️ Error processing RSS item:`, error)
        continue
      }
    }

    return { tweetsFound, totalProcessed, newTweets }
  }

  /**
   * Fetch and parse RSS feed
   */
  private async fetchAndParseFeed(feedUrl: string): Promise<RSSItem[]> {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'LayerEdge Community Bot 1.0 (https://edgen.koyeb.app)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      },
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const xmlText = await response.text()
    return this.parseRSSXML(xmlText)
  }

  /**
   * Parse RSS XML to extract items
   */
  private parseRSSXML(xmlText: string): RSSItem[] {
    try {
      // Simple XML parsing for RSS items
      const items: RSSItem[] = []
      
      // Extract items using regex (simple approach for RSS)
      const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi)
      
      if (!itemMatches) return items

      for (const itemXml of itemMatches) {
        const item: RSSItem = {
          title: this.extractXMLValue(itemXml, 'title') || '',
          link: this.extractXMLValue(itemXml, 'link') || '',
          description: this.extractXMLValue(itemXml, 'description') || '',
          pubDate: this.extractXMLValue(itemXml, 'pubDate') || '',
          guid: this.extractXMLValue(itemXml, 'guid')
        }

        if (item.link && item.description) {
          items.push(item)
        }
      }

      return items.slice(0, 50) // Limit to 50 most recent items

    } catch (error) {
      console.error('Error parsing RSS XML:', error)
      return []
    }
  }

  /**
   * Extract value from XML tag
   */
  private extractXMLValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i')
    const match = xml.match(regex)
    return match ? match[1].trim() : null
  }

  /**
   * Extract tweet data from RSS item
   */
  private extractTweetData(item: RSSItem): {
    url: string
    content: string
    username: string
    pubDate: Date
  } | null {
    try {
      // Extract username from Nitter URL
      const username = this.extractUsernameFromUrl(item.link)
      if (!username) return null

      // Clean up description (remove HTML tags)
      const content = item.description
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim()

      return {
        url: item.link,
        content,
        username,
        pubDate: new Date(item.pubDate)
      }
    } catch (error) {
      console.warn('Error extracting tweet data:', error)
      return null
    }
  }

  /**
   * Extract username from Nitter URL
   */
  private extractUsernameFromUrl(url: string): string | null {
    try {
      // Nitter URL format: https://nitter.net/username/status/123456
      const match = url.match(/\/([^\/]+)\/status\/\d+/)
      return match ? match[1] : null
    } catch (error) {
      return null
    }
  }

  /**
   * Process discovered tweet
   */
  private async processTweet(tweetData: {
    url: string
    content: string
    username: string
    pubDate: Date
  }): Promise<boolean> {
    try {
      // Check if tweet already exists
      const existingTweet = await prisma.tweet.findFirst({
        where: { url: tweetData.url }
      })

      if (existingTweet) {
        return false // Not new
      }

      // Check if we have an unclaimed tweet for this URL
      const existingUnclaimed = await prisma.unclaimedTweet.findFirst({
        where: { url: tweetData.url }
      })

      if (existingUnclaimed) {
        return false // Already discovered
      }

      // Find user in our database
      const user = await prisma.user.findFirst({
        where: { 
          xUsername: {
            equals: tweetData.username,
            mode: 'insensitive'
          }
        }
      })

      if (user) {
        // User is registered - award points immediately
        await this.awardPointsForRegisteredUser(user.id, tweetData)
        console.log(`✅ Points awarded to registered user @${tweetData.username}`)
        return true
      } else {
        // User not registered - store as unclaimed tweet
        await this.storeUnclaimedTweet(tweetData)
        console.log(`📝 Stored unclaimed tweet for @${tweetData.username}`)
        return true
      }

    } catch (error) {
      console.error('Error processing tweet:', error)
      return false
    }
  }

  /**
   * Award points for registered user
   */
  private async awardPointsForRegisteredUser(userId: string, tweetData: any): Promise<void> {
    // Calculate points based on content
    const points = this.calculatePoints(tweetData.content)

    // Create tweet record
    await prisma.tweet.create({
      data: {
        userId,
        content: tweetData.content,
        url: tweetData.url,
        totalPoints: points,
        isAutoDiscovered: true,
        discoveredAt: new Date(),
        createdAt: tweetData.pubDate
      }
    })

    // Update user points
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: {
          increment: points
        }
      }
    })

    // Create points history
    await prisma.pointsHistory.create({
      data: {
        userId,
        points,
        reason: 'Auto-discovered tweet via RSS',
        createdAt: new Date()
      }
    })
  }

  /**
   * Store unclaimed tweet
   */
  private async storeUnclaimedTweet(tweetData: any): Promise<void> {
    const points = this.calculatePoints(tweetData.content)

    await prisma.unclaimedTweet.create({
      data: {
        username: tweetData.username,
        content: tweetData.content,
        url: tweetData.url,
        points,
        discoveredAt: new Date(),
        claimed: false
      }
    })
  }

  /**
   * Calculate points for tweet content
   */
  private calculatePoints(content: string): number {
    let points = 10 // Base points

    // Bonus for multiple mentions
    const layeredgeCount = (content.toLowerCase().match(/@layeredge/g) || []).length
    const edgenCount = (content.toLowerCase().match(/\$edgen/g) || []).length
    
    points += (layeredgeCount + edgenCount - 1) * 5 // Bonus for multiple mentions

    // Bonus for longer content
    if (content.length > 100) points += 5
    if (content.length > 200) points += 5

    return Math.min(points, 50) // Cap at 50 points
  }

  /**
   * Handle feed errors
   */
  private async handleFeedError(feed: RSSFeed): Promise<void> {
    // Could implement logic to temporarily disable feeds that fail repeatedly
    console.warn(`Feed ${feed.name} encountered an error`)
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get feed status
   */
  getFeedStatus(): Array<{
    name: string
    url: string
    active: boolean
    lastCheck?: Date
    priority: number
  }> {
    return this.feeds.map(feed => ({
      name: feed.name,
      url: feed.url,
      active: feed.active,
      lastCheck: feed.lastCheck,
      priority: feed.priority
    }))
  }
}
