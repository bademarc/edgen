/**
 * Tweet Utilities - Helper functions for tweet processing and validation
 */

export interface TweetMetrics {
  likes: number
  retweets: number
  replies: number
  totalEngagement: number
}

export interface TweetValidationResult {
  isValid: boolean
  reason?: string
  score: number
}

/**
 * Validate tweet content for LayerEdge requirements
 */
export function validateTweetContent(content: string): TweetValidationResult {
  if (!content || content.trim().length === 0) {
    return { isValid: false, reason: 'Empty content', score: 0 }
  }

  const lowerContent = content.toLowerCase()
  let score = 0
  
  // Check for required mentions/hashtags
  if (lowerContent.includes('@layeredge')) score += 30
  if (lowerContent.includes('$edgen')) score += 30
  if (lowerContent.includes('#layeredge')) score += 20
  if (lowerContent.includes('#edgen')) score += 20
  
  // Check for quality indicators
  if (content.length >= 50) score += 10 // Substantial content
  if (content.includes('http')) score += 5 // Contains links
  
  // Minimum score threshold
  const isValid = score >= 30
  
  return {
    isValid,
    reason: isValid ? undefined : 'Content does not meet LayerEdge requirements',
    score
  }
}

/**
 * Validate tweet URL format
 */
export function validateTweetURL(url: string): { isValid: boolean; reason?: string } {
  if (!url || url.trim().length === 0) {
    return { isValid: false, reason: 'Empty URL' }
  }

  const tweetUrlPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/
  const isValid = tweetUrlPattern.test(url)
  
  return {
    isValid,
    reason: isValid ? undefined : 'Invalid tweet URL format'
  }
}

/**
 * Extract tweet ID from URL
 */
export function extractTweetId(url: string): string | null {
  const match = url.match(/twitter\.com\/\w+\/status\/(\d+)|x\.com\/\w+\/status\/(\d+)/)
  return match ? (match[1] || match[2]) : null
}

/**
 * Extract username from tweet URL
 */
export function extractUsernameFromTweetUrl(url: string): string | null {
  const match = url.match(/(?:x\.com|twitter\.com)\/([^\/]+)\/status\/\d+/)
  return match ? match[1] : null
}

/**
 * Calculate points based on engagement metrics
 */
export function calculateEngagementPoints(metrics: TweetMetrics): number {
  const { likes, retweets, replies } = metrics
  return (likes * 1) + (retweets * 3) + (replies * 2)
}

/**
 * Calculate total engagement
 */
export function calculateTotalEngagement(likes: number, retweets: number, replies: number): number {
  return likes + retweets + replies
}

/**
 * Format engagement numbers for display
 */
export function formatEngagementNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * Check if tweet URL is valid format
 */
export function isValidTweetUrl(url: string): boolean {
  const tweetUrlPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/
  return tweetUrlPattern.test(url)
}

/**
 * Normalize tweet URL (convert twitter.com to x.com)
 */
export function normalizeTweetUrl(url: string): string {
  return url.replace('twitter.com', 'x.com')
}

/**
 * Parse tweet URL components
 */
export function parseTweetUrl(url: string): {
  platform: 'twitter' | 'x' | null
  username: string | null
  tweetId: string | null
  isValid: boolean
} {
  const match = url.match(/^https?:\/\/(twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/)
  
  if (!match) {
    return { platform: null, username: null, tweetId: null, isValid: false }
  }

  return {
    platform: match[1] === 'twitter.com' ? 'twitter' : 'x',
    username: match[2],
    tweetId: match[3],
    isValid: true
  }
}

/**
 * Check if content contains FUD (Fear, Uncertainty, Doubt) indicators
 */
export function detectFUD(content: string): { isFUD: boolean; confidence: number; reasons: string[] } {
  const lowerContent = content.toLowerCase()
  const reasons: string[] = []
  let confidence = 0

  // Negative keywords
  const negativeKeywords = ['scam', 'fraud', 'fake', 'ponzi', 'rug', 'dump', 'crash', 'dead', 'worthless']
  const fearKeywords = ['warning', 'danger', 'avoid', 'beware', 'risky', 'unsafe']
  
  negativeKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      confidence += 20
      reasons.push(`Contains negative keyword: ${keyword}`)
    }
  })

  fearKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      confidence += 10
      reasons.push(`Contains fear keyword: ${keyword}`)
    }
  })

  // Excessive caps (shouting)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
  if (capsRatio > 0.3) {
    confidence += 15
    reasons.push('Excessive use of capital letters')
  }

  // Multiple exclamation marks
  if ((content.match(/!/g) || []).length > 3) {
    confidence += 10
    reasons.push('Excessive exclamation marks')
  }

  return {
    isFUD: confidence >= 30,
    confidence: Math.min(confidence, 100),
    reasons
  }
}

/**
 * Sanitize tweet content for storage
 */
export function sanitizeTweetContent(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 2000) // Limit length
}

/**
 * Extract hashtags from tweet content
 */
export function extractHashtags(content: string): string[] {
  const hashtags = content.match(/#\w+/g) || []
  return hashtags.map(tag => tag.toLowerCase())
}

/**
 * Extract mentions from tweet content
 */
export function extractMentions(content: string): string[] {
  const mentions = content.match(/@\w+/g) || []
  return mentions.map(mention => mention.toLowerCase())
}

/**
 * Check if tweet is eligible for points
 */
export function isTweetEligibleForPoints(content: string, metrics: TweetMetrics): boolean {
  const validation = validateTweetContent(content)
  const hasMinimumEngagement = metrics.totalEngagement >= 1
  
  return validation.isValid && hasMinimumEngagement
}

export default {
  validateTweetContent,
  validateTweetURL,
  extractTweetId,
  extractUsernameFromTweetUrl,
  calculateEngagementPoints,
  calculateTotalEngagement,
  formatEngagementNumber,
  isValidTweetUrl,
  normalizeTweetUrl,
  parseTweetUrl,
  detectFUD,
  sanitizeTweetContent,
  extractHashtags,
  extractMentions,
  isTweetEligibleForPoints
}
