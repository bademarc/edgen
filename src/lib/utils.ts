import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  } else {
    return formatDate(d)
  }
}

// Number formatting utilities
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatPoints(points: number): string {
  return points.toLocaleString()
}

// URL utilities
export function extractTweetId(url: string): string | null {
  const match = url.match(/twitter\.com\/\w+\/status\/(\d+)|x\.com\/\w+\/status\/(\d+)/)
  return match ? (match[1] || match[2]) : null
}

export function isValidTweetUrl(url: string): boolean {
  const tweetUrlPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/
  return tweetUrlPattern.test(url)
}

// Legacy alias for backward compatibility
export const isValidTwitterUrl = isValidTweetUrl

// LayerEdge community URL validation
export function isLayerEdgeCommunityUrl(url: string): boolean {
  return url.includes('x.com/i/communities/1890107751621357663') ||
         url.includes('twitter.com/i/communities/1890107751621357663')
}

// Points calculation
export function calculatePoints(engagement: { likes: number; retweets: number; comments: number }): number {
  const { likes, retweets, comments } = engagement
  return (likes * 1) + (retweets * 3) + (comments * 2)
}

// Validation utilities
export function validateTweetContent(content: string): boolean {
  const lowerContent = content.toLowerCase()
  return lowerContent.includes('@layeredge') || lowerContent.includes('$edgen')
}

// Animation utilities
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
}
