import { chromium, Browser, Page } from 'playwright'
import { extractTweetId, validateTweetContent } from './utils'

export interface ScrapedTweetData {
  id: string
  content: string
  likes: number
  retweets: number
  replies: number
  author: {
    id: string
    username: string
    name: string
    profileImage?: string
  }
  createdAt: Date
  isFromLayerEdgeCommunity: boolean
}

export interface ScrapedEngagementMetrics {
  likes: number
  retweets: number
  replies: number
  timestamp: Date
}

export interface UserTweetScrapingOptions {
  maxTweets?: number
  sinceId?: string
  filterKeywords?: string[]
  includeReplies?: boolean
}

export interface ScrapedUserTweet {
  id: string
  content: string
  likes: number
  retweets: number
  replies: number
  author: {
    id: string
    username: string
    name: string
    profileImage?: string
  }
  createdAt: Date
  isFromLayerEdgeCommunity: boolean
  url: string
}

export class WebScraperService {
  private browser: Browser | null = null
  private isInitialized = false
  private maxRetries = 3
  private retryDelay = 2000 // 2 seconds

  constructor() {
    this.initializeBrowser()
  }

  private async initializeBrowser(): Promise<void> {
    try {
      if (!this.browser) {
        console.log('Initializing Playwright browser for web scraping...')
        this.browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        })
        this.isInitialized = true
        console.log('Browser initialized successfully')
      }
    } catch (error) {
      console.error('Failed to initialize browser:', error)
      this.isInitialized = false
    }
  }

  private async createPage(): Promise<Page> {
    if (!this.browser || !this.isInitialized) {
      await this.initializeBrowser()
    }

    if (!this.browser) {
      throw new Error('Failed to initialize browser')
    }

    const page = await this.browser.newPage()

    // Set user agent to avoid detection
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    // Set viewport
    await page.setViewportSize({ width: 1280, height: 720 })

    return page
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private parseEngagementCount(text: string): number {
    if (!text) return 0

    // Remove commas and convert to number
    const cleanText = text.replace(/,/g, '').trim()

    // Handle K/M suffixes
    if (cleanText.includes('K')) {
      return Math.floor(parseFloat(cleanText.replace('K', '')) * 1000)
    }
    if (cleanText.includes('M')) {
      return Math.floor(parseFloat(cleanText.replace('M', '')) * 1000000)
    }

    return parseInt(cleanText) || 0
  }

  async scrapeTweetData(tweetUrl: string): Promise<ScrapedTweetData | null> {
    let page: Page | null = null
    let retryCount = 0

    while (retryCount < this.maxRetries) {
      try {
        console.log(`Scraping tweet data (attempt ${retryCount + 1}): ${tweetUrl}`)

        page = await this.createPage()

        // Navigate to tweet URL
        await page.goto(tweetUrl, {
          waitUntil: 'networkidle',
          timeout: 30000
        })

        // Wait for tweet content to load
        await page.waitForSelector('[data-testid="tweet"]', { timeout: 15000 })

        // Extract tweet data using selectors
        const tweetData = await page.evaluate(() => {
          const tweetElement = document.querySelector('[data-testid="tweet"]')
          if (!tweetElement) return null

          // Extract tweet text
          const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]')
          const content = tweetTextElement?.textContent || ''

          // Extract author information
          const authorElement = tweetElement.querySelector('[data-testid="User-Name"]')
          const authorName = authorElement?.querySelector('span')?.textContent || ''
          const authorUsernameElement = authorElement?.querySelector('a[href*="/"]')
          const authorUsername = authorUsernameElement?.getAttribute('href')?.replace('/', '') || ''

          // Extract profile image
          const profileImageElement = tweetElement.querySelector('[data-testid="Tweet-User-Avatar"] img')
          const profileImage = profileImageElement?.getAttribute('src') || ''

          // Extract engagement metrics
          const likeButton = tweetElement.querySelector('[data-testid="like"]')
          const retweetButton = tweetElement.querySelector('[data-testid="retweet"]')
          const replyButton = tweetElement.querySelector('[data-testid="reply"]')

          const likes = likeButton?.getAttribute('aria-label')?.match(/\d+/)?.[0] || '0'
          const retweets = retweetButton?.getAttribute('aria-label')?.match(/\d+/)?.[0] || '0'
          const replies = replyButton?.getAttribute('aria-label')?.match(/\d+/)?.[0] || '0'

          // Extract timestamp
          const timeElement = tweetElement.querySelector('time')
          const timestamp = timeElement?.getAttribute('datetime') || new Date().toISOString()

          return {
            content,
            authorName,
            authorUsername,
            profileImage,
            likes,
            retweets,
            replies,
            timestamp
          }
        })

        if (!tweetData) {
          throw new Error('Could not extract tweet data from page')
        }

        const tweetId = extractTweetId(tweetUrl)
        if (!tweetId) {
          throw new Error('Could not extract tweet ID from URL')
        }

        // Check if tweet is from LayerEdge community
        const isFromLayerEdgeCommunity = await this.checkLayerEdgeCommunity(page, tweetUrl)

        // Validate tweet content
        const isValidContent = validateTweetContent(tweetData.content)

        const scrapedData: ScrapedTweetData = {
          id: tweetId,
          content: tweetData.content,
          likes: this.parseEngagementCount(tweetData.likes),
          retweets: this.parseEngagementCount(tweetData.retweets),
          replies: this.parseEngagementCount(tweetData.replies),
          author: {
            id: tweetData.authorUsername,
            username: tweetData.authorUsername,
            name: tweetData.authorName,
            profileImage: tweetData.profileImage
          },
          createdAt: new Date(tweetData.timestamp),
          isFromLayerEdgeCommunity
        }

        console.log('Successfully scraped tweet data:', {
          id: scrapedData.id,
          content: scrapedData.content.substring(0, 100) + '...',
          likes: scrapedData.likes,
          retweets: scrapedData.retweets,
          replies: scrapedData.replies,
          isValidContent,
          isFromLayerEdgeCommunity
        })

        return scrapedData

      } catch (error) {
        console.error(`Scraping attempt ${retryCount + 1} failed:`, error)
        retryCount++

        if (retryCount < this.maxRetries) {
          console.log(`Retrying in ${this.retryDelay}ms...`)
          await this.delay(this.retryDelay)
        }
      } finally {
        if (page) {
          await page.close()
        }
      }
    }

    console.error(`Failed to scrape tweet after ${this.maxRetries} attempts`)
    return null
  }

  async scrapeEngagementMetrics(tweetUrl: string): Promise<ScrapedEngagementMetrics | null> {
    let page: Page | null = null
    let retryCount = 0

    while (retryCount < this.maxRetries) {
      try {
        console.log(`Scraping engagement metrics (attempt ${retryCount + 1}): ${tweetUrl}`)

        page = await this.createPage()

        // Navigate to tweet URL
        await page.goto(tweetUrl, {
          waitUntil: 'networkidle',
          timeout: 30000
        })

        // Wait for engagement metrics to load
        await page.waitForSelector('[data-testid="tweet"]', { timeout: 15000 })

        // Extract only engagement metrics for faster scraping
        const metrics = await page.evaluate(() => {
          const tweetElement = document.querySelector('[data-testid="tweet"]')
          if (!tweetElement) return null

          const likeButton = tweetElement.querySelector('[data-testid="like"]')
          const retweetButton = tweetElement.querySelector('[data-testid="retweet"]')
          const replyButton = tweetElement.querySelector('[data-testid="reply"]')

          const likes = likeButton?.getAttribute('aria-label')?.match(/\d+/)?.[0] || '0'
          const retweets = retweetButton?.getAttribute('aria-label')?.match(/\d+/)?.[0] || '0'
          const replies = replyButton?.getAttribute('aria-label')?.match(/\d+/)?.[0] || '0'

          return { likes, retweets, replies }
        })

        if (!metrics) {
          throw new Error('Could not extract engagement metrics from page')
        }

        const engagementData: ScrapedEngagementMetrics = {
          likes: this.parseEngagementCount(metrics.likes),
          retweets: this.parseEngagementCount(metrics.retweets),
          replies: this.parseEngagementCount(metrics.replies),
          timestamp: new Date()
        }

        console.log('Successfully scraped engagement metrics:', engagementData)
        return engagementData

      } catch (error) {
        console.error(`Engagement scraping attempt ${retryCount + 1} failed:`, error)
        retryCount++

        if (retryCount < this.maxRetries) {
          console.log(`Retrying in ${this.retryDelay}ms...`)
          await this.delay(this.retryDelay)
        }
      } finally {
        if (page) {
          await page.close()
        }
      }
    }

    console.error(`Failed to scrape engagement metrics after ${this.maxRetries} attempts`)
    return null
  }

  async scrapeUserTweets(userProfileUrl: string, options: UserTweetScrapingOptions = {}): Promise<ScrapedUserTweet[]> {
    const {
      maxTweets = 20,
      sinceId,
      filterKeywords = [],
      includeReplies = false
    } = options

    let page: Page | null = null
    let retryCount = 0
    const results: ScrapedUserTweet[] = []

    while (retryCount < this.maxRetries) {
      try {
        console.log(`Scraping user tweets (attempt ${retryCount + 1}): ${userProfileUrl}`)

        page = await this.createPage()

        // Navigate to user profile
        await page.goto(userProfileUrl, {
          waitUntil: 'networkidle',
          timeout: 30000
        })

        // Wait for tweets to load
        await page.waitForSelector('[data-testid="tweet"]', { timeout: 15000 })

        // Scroll and collect tweets
        let collectedTweets = 0
        let scrollAttempts = 0
        const maxScrollAttempts = 10

        while (collectedTweets < maxTweets && scrollAttempts < maxScrollAttempts) {
          // Extract tweets from current view
          const tweets = await page.evaluate(
            ({ filterKeywords, includeReplies, sinceId }) => {
              const tweetElements = document.querySelectorAll('[data-testid="tweet"]')
              const extractedTweets: Array<{
                id: string
                content: string
                likes: string
                retweets: string
                replies: string
                author: {
                  id: string
                  username: string
                  name: string
                  profileImage?: string
                }
                timestamp: string
                url: string
              }> = []

              tweetElements.forEach((tweetElement) => {
                try {
                  // Skip replies if not included
                  if (!includeReplies && tweetElement.querySelector('[data-testid="reply"]')) {
                    return
                  }

                  // Extract tweet text
                  const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]')
                  const content = tweetTextElement?.textContent || ''

                  // Filter by keywords if provided
                  if (filterKeywords.length > 0) {
                    const hasKeyword = filterKeywords.some((keyword: string) =>
                      content.toLowerCase().includes(keyword.toLowerCase())
                    )
                    if (!hasKeyword) return
                  }

                  // Extract tweet ID from URL
                  const tweetLink = tweetElement.querySelector('a[href*="/status/"]')
                  const tweetUrl = tweetLink?.getAttribute('href')
                  if (!tweetUrl) return

                  const tweetId = tweetUrl.split('/status/')[1]?.split('?')[0]
                  if (!tweetId) return

                  // Skip if we've already processed this tweet (sinceId check)
                  if (sinceId && tweetId <= sinceId) return

                  // Extract author information
                  const authorElement = tweetElement.querySelector('[data-testid="User-Name"]')
                  const authorName = authorElement?.querySelector('span')?.textContent || ''
                  const authorUsernameElement = authorElement?.querySelector('a[href*="/"]')
                  const authorUsername = authorUsernameElement?.getAttribute('href')?.replace('/', '') || ''

                  // Extract engagement metrics
                  const likeElement = tweetElement.querySelector('[data-testid="like"]')
                  const retweetElement = tweetElement.querySelector('[data-testid="retweet"]')
                  const replyElement = tweetElement.querySelector('[data-testid="reply"]')

                  const likes = likeElement?.getAttribute('aria-label') || '0'
                  const retweets = retweetElement?.getAttribute('aria-label') || '0'
                  const replies = replyElement?.getAttribute('aria-label') || '0'

                  // Extract timestamp
                  const timeElement = tweetElement.querySelector('time')
                  const timestamp = timeElement?.getAttribute('datetime') || new Date().toISOString()

                  // Extract profile image
                  const profileImageElement = tweetElement.querySelector('img[alt*="profile"]')
                  const profileImage = profileImageElement?.getAttribute('src') || undefined

                  extractedTweets.push({
                    id: tweetId,
                    content,
                    likes,
                    retweets,
                    replies,
                    author: {
                      id: authorUsername,
                      username: authorUsername,
                      name: authorName,
                      profileImage
                    },
                    timestamp,
                    url: `https://x.com${tweetUrl}`
                  })
                } catch (error) {
                  console.error('Error extracting tweet:', error)
                }
              })

              return extractedTweets
            },
            { filterKeywords, includeReplies, sinceId }
          )

          // Process and add new tweets
          for (const tweet of tweets) {
            if (results.find(t => t.id === tweet.id)) continue // Skip duplicates

            const scrapedTweet: ScrapedUserTweet = {
              id: tweet.id,
              content: tweet.content,
              likes: this.parseEngagementCount(tweet.likes),
              retweets: this.parseEngagementCount(tweet.retweets),
              replies: this.parseEngagementCount(tweet.replies),
              author: tweet.author,
              createdAt: new Date(tweet.timestamp),
              isFromLayerEdgeCommunity: false, // Will be checked separately
              url: tweet.url
            }

            results.push(scrapedTweet)
            collectedTweets++

            if (collectedTweets >= maxTweets) break
          }

          // Scroll down to load more tweets
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight)
          })

          // Wait for new content to load
          await this.delay(2000)
          scrollAttempts++
        }

        console.log(`Successfully scraped ${results.length} user tweets`)
        return results

      } catch (error) {
        console.error(`User tweet scraping attempt ${retryCount + 1} failed:`, error)
        retryCount++

        if (retryCount < this.maxRetries) {
          console.log(`Retrying in ${this.retryDelay}ms...`)
          await this.delay(this.retryDelay)
        }
      } finally {
        if (page) {
          await page.close()
        }
      }
    }

    console.error(`Failed to scrape user tweets after ${this.maxRetries} attempts`)
    return results
  }

  private async checkLayerEdgeCommunity(page: Page, tweetUrl: string): Promise<boolean> {
    try {
      // Check if URL contains community ID
      const communityId = '1890107751621357663'
      if (tweetUrl.includes(`communities/${communityId}`)) {
        return true
      }

      // For regular tweet URLs, check if the tweet mentions LayerEdge community
      // This is a simplified check - in production you might want more sophisticated verification
      const pageContent = await page.content()

      // Look for community indicators in the page
      const hasLayerEdgeReference = pageContent.toLowerCase().includes('layeredge') ||
                                   pageContent.toLowerCase().includes('$edgen')

      return hasLayerEdgeReference
    } catch (error) {
      console.error('Error checking LayerEdge community:', error)
      return false
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.isInitialized = false
      console.log('Browser closed')
    }
  }

  // Batch scraping for multiple tweets
  async scrapeBatchEngagementMetrics(tweetUrls: string[]): Promise<Array<{
    url: string
    metrics: ScrapedEngagementMetrics | null
  }>> {
    const results = []

    // Process in smaller batches to avoid overwhelming the system
    const batchSize = 3
    for (let i = 0; i < tweetUrls.length; i += batchSize) {
      const batch = tweetUrls.slice(i, i + batchSize)

      const batchPromises = batch.map(async (url) => {
        const metrics = await this.scrapeEngagementMetrics(url)
        return { url, metrics }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add delay between batches to be respectful
      if (i + batchSize < tweetUrls.length) {
        await this.delay(3000) // 3 second delay between batches
      }
    }

    return results
  }
}

// Singleton instance
let scraperInstance: WebScraperService | null = null

export function getWebScraperInstance(): WebScraperService {
  if (!scraperInstance) {
    scraperInstance = new WebScraperService()
  }
  return scraperInstance
}

// Cleanup function for graceful shutdown
export async function closeWebScraper(): Promise<void> {
  if (scraperInstance) {
    await scraperInstance.close()
    scraperInstance = null
  }
}
