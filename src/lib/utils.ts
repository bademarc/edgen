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
  const communityUrl = process.env.LAYEREDGE_COMMUNITY_URL || 'https://x.com/i/communities/1890107751621363'
  return url.includes(communityUrl) || url.includes('communities/1890107751621363')
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
