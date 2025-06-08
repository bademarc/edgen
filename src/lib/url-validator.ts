/**
 * URL Validator and Handler for LayerEdge Community Platform
 * Addresses: Invalid Search Query URL Handling
 * Provides proper URL validation and error messages
 */

export interface URLValidationResult {
  isValid: boolean
  type: 'tweet' | 'search' | 'profile' | 'unknown'
  tweetId?: string
  username?: string
  searchQuery?: string
  error?: string
  suggestion?: string
}

export class URLValidator {
  private static readonly TWEET_URL_PATTERNS = [
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)(\?.*)?$/,
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)$/
  ]

  private static readonly SEARCH_URL_PATTERNS = [
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/search\?q=(.+)$/,
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/search\?(.*)q=([^&]+)/
  ]

  private static readonly PROFILE_URL_PATTERNS = [
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/([^\/\?]+)(\?.*)?$/,
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/([^\/\?]+)$/
  ]

  /**
   * Validate and analyze a URL
   */
  static validateURL(url: string): URLValidationResult {
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        type: 'unknown',
        error: 'URL is required and must be a string',
        suggestion: 'Please provide a valid X/Twitter URL'
      }
    }

    // Normalize URL
    const normalizedUrl = url.trim()

    // Check for tweet URLs
    const tweetMatch = this.matchTweetURL(normalizedUrl)
    if (tweetMatch) {
      return {
        isValid: true,
        type: 'tweet',
        tweetId: tweetMatch.tweetId,
        username: tweetMatch.username
      }
    }

    // Check for search URLs
    const searchMatch = this.matchSearchURL(normalizedUrl)
    if (searchMatch) {
      return {
        isValid: false,
        type: 'search',
        searchQuery: searchMatch.query,
        error: 'Search URLs are not supported for individual tweet processing',
        suggestion: 'Please provide a direct tweet URL in the format: https://x.com/username/status/1234567890'
      }
    }

    // Check for profile URLs
    const profileMatch = this.matchProfileURL(normalizedUrl)
    if (profileMatch) {
      return {
        isValid: false,
        type: 'profile',
        username: profileMatch.username,
        error: 'Profile URLs are not supported for tweet processing',
        suggestion: 'Please provide a direct tweet URL from this profile'
      }
    }

    // Unknown URL format
    return {
      isValid: false,
      type: 'unknown',
      error: 'Unrecognized URL format',
      suggestion: 'Please provide a valid X/Twitter tweet URL in the format: https://x.com/username/status/1234567890'
    }
  }

  /**
   * Extract tweet ID from a valid tweet URL
   */
  static extractTweetId(url: string): string | null {
    const validation = this.validateURL(url)
    return validation.type === 'tweet' ? validation.tweetId || null : null
  }

  /**
   * Check if URL is a LayerEdge community related search
   */
  static isLayerEdgeSearch(url: string): boolean {
    const validation = this.validateURL(url)
    if (validation.type === 'search' && validation.searchQuery) {
      const query = decodeURIComponent(validation.searchQuery).toLowerCase()
      return query.includes('layeredge') || query.includes('$edgen') || query.includes('%24edgen')
    }
    return false
  }

  /**
   * Generate helpful error message for invalid URLs
   */
  static getErrorMessage(url: string): string {
    const validation = this.validateURL(url)
    
    if (validation.isValid) {
      return ''
    }

    let message = validation.error || 'Invalid URL format'
    
    if (validation.suggestion) {
      message += `\n\n💡 ${validation.suggestion}`
    }

    // Add specific examples based on URL type
    switch (validation.type) {
      case 'search':
        message += '\n\n📋 Examples of valid tweet URLs:'
        message += '\n• https://x.com/layeredge/status/1234567890'
        message += '\n• https://x.com/nxrsultxn/status/1931733077400641998'
        break
      
      case 'profile':
        message += '\n\n📋 To submit a tweet from this profile:'
        message += '\n1. Go to the specific tweet you want to submit'
        message += '\n2. Copy the URL that includes "/status/[numbers]"'
        break
      
      default:
        message += '\n\n📋 Valid URL formats:'
        message += '\n• https://x.com/username/status/1234567890'
        message += '\n• https://twitter.com/username/status/1234567890'
    }

    return message
  }

  /**
   * Match tweet URL patterns
   */
  private static matchTweetURL(url: string): { tweetId: string; username: string } | null {
    for (const pattern of this.TWEET_URL_PATTERNS) {
      const match = url.match(pattern)
      if (match) {
        const tweetId = match[3]
        const username = this.extractUsernameFromURL(url)
        return { tweetId, username: username || 'unknown' }
      }
    }
    return null
  }

  /**
   * Match search URL patterns
   */
  private static matchSearchURL(url: string): { query: string } | null {
    for (const pattern of this.SEARCH_URL_PATTERNS) {
      const match = url.match(pattern)
      if (match) {
        const query = match[3] || match[4] || ''
        return { query }
      }
    }
    return null
  }

  /**
   * Match profile URL patterns
   */
  private static matchProfileURL(url: string): { username: string } | null {
    for (const pattern of this.PROFILE_URL_PATTERNS) {
      const match = url.match(pattern)
      if (match) {
        const username = match[3]
        // Exclude common non-username paths
        if (!['search', 'home', 'explore', 'notifications', 'messages', 'settings'].includes(username)) {
          return { username }
        }
      }
    }
    return null
  }

  /**
   * Extract username from URL
   */
  private static extractUsernameFromURL(url: string): string | null {
    const match = url.match(/https?:\/\/(www\.)?(twitter\.com|x\.com)\/([^\/\?]+)/)
    return match ? match[3] : null
  }

  /**
   * Normalize URL for consistent processing
   */
  static normalizeURL(url: string): string {
    return url
      .trim()
      .replace(/^http:/, 'https:')
      .replace(/twitter\.com/, 'x.com')
      .replace(/\/+$/, '') // Remove trailing slashes
  }

  /**
   * Check if URL is from the specific user (nxrsultxn)
   */
  static isFromTargetUser(url: string, targetUsername: string = 'nxrsultxn'): boolean {
    const validation = this.validateURL(url)
    return validation.type === 'tweet' && 
           validation.username?.toLowerCase() === targetUsername.toLowerCase()
  }

  /**
   * Generate test URLs for validation
   */
  static getTestURLs(): { valid: string[]; invalid: string[] } {
    return {
      valid: [
        'https://x.com/nxrsultxn/status/1931733077400641998',
        'https://twitter.com/layeredge/status/1234567890',
        'https://x.com/user/status/1111111111111111111'
      ],
      invalid: [
        'https://x.com/search?q=%24Edgen%20OR%20LayerEdge',
        'https://x.com/nxrsultxn',
        'https://x.com/layeredge',
        'invalid-url',
        'https://example.com/tweet',
        ''
      ]
    }
  }
}

/**
 * Enhanced error handler for URL validation
 */
export class URLValidationError extends Error {
  public readonly urlType: string
  public readonly suggestion: string

  constructor(validation: URLValidationResult) {
    super(validation.error || 'Invalid URL')
    this.name = 'URLValidationError'
    this.urlType = validation.type
    this.suggestion = validation.suggestion || ''
  }
}

/**
 * Utility function for quick URL validation
 */
export function validateTweetURL(url: string): { isValid: boolean; tweetId?: string; error?: string } {
  const validation = URLValidator.validateURL(url)
  
  return {
    isValid: validation.isValid && validation.type === 'tweet',
    tweetId: validation.tweetId,
    error: validation.isValid ? undefined : URLValidator.getErrorMessage(url)
  }
}

/**
 * Utility function to check if URL needs special handling
 */
export function getURLHandlingStrategy(url: string): {
  strategy: 'tweet' | 'search' | 'profile' | 'error'
  message: string
  canProcess: boolean
} {
  const validation = URLValidator.validateURL(url)
  
  switch (validation.type) {
    case 'tweet':
      return {
        strategy: 'tweet',
        message: 'Valid tweet URL - processing with enhanced fallback chain',
        canProcess: true
      }
    
    case 'search':
      if (URLValidator.isLayerEdgeSearch(url)) {
        return {
          strategy: 'search',
          message: 'LayerEdge community search detected - use community monitoring instead',
          canProcess: false
        }
      }
      return {
        strategy: 'search',
        message: 'Search URL detected - cannot process individual tweet data',
        canProcess: false
      }
    
    case 'profile':
      return {
        strategy: 'profile',
        message: 'Profile URL detected - please select a specific tweet',
        canProcess: false
      }
    
    default:
      return {
        strategy: 'error',
        message: URLValidator.getErrorMessage(url),
        canProcess: false
      }
  }
}
