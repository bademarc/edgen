import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function isValidTwitterUrl(url: string): boolean {
  const twitterUrlPattern = /^https:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/
  return twitterUrlPattern.test(url)
}

export function isLayerEdgeCommunityUrl(url: string): boolean {
  const communityId = '1890107751621357663'

  // Check for different community URL patterns:
  // 1. Direct community post: https://x.com/i/communities/COMMUNITY_ID/post/POST_ID
  // 2. Community base URL: https://x.com/i/communities/COMMUNITY_ID
  // 3. Regular tweet URL that might be from community (we'll validate this via API)

  // For now, accept any valid Twitter URL and let the API validation handle community verification
  // This is because community posts can have regular tweet URLs
  if (url.includes(`communities/${communityId}`)) {
    return true
  }

  // For regular tweet URLs, we'll rely on the Twitter API to verify community membership
  // This is a temporary approach - in production you'd want to use Twitter's API to verify
  return isValidTwitterUrl(url)
}

export function extractTweetId(url: string): string | null {
  const match = url.match(/\/status\/(\d+)/)
  return match ? match[1] : null
}

export function calculatePoints(likes: number, retweets: number, replies: number): number {
  const basePoints = 5
  const likePoints = likes * 1
  const retweetPoints = retweets * 3
  const replyPoints = replies * 2
  return basePoints + likePoints + retweetPoints + replyPoints
}
