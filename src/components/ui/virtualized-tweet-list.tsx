'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { TweetCard } from '@/components/TweetCard'

interface Tweet {
  id: string
  url: string
  content?: string | null
  likes: number
  retweets: number
  replies: number
  totalPoints: number
  createdAt: Date
  user: {
    id: string
    name?: string | null
    xUsername?: string | null
    image?: string | null
  }
}

interface VirtualizedTweetListProps {
  tweets: Tweet[]
  isUpdating?: boolean
  onUpdateEngagement?: (tweetId: string) => Promise<void>
  showUpdateButton?: boolean
  itemHeight?: number
  containerHeight?: number
  overscan?: number
}

export function VirtualizedTweetList({
  tweets,
  isUpdating = false,
  onUpdateEngagement,
  showUpdateButton = false,
  itemHeight = 200, // Estimated height per tweet card
  containerHeight = 600, // Height of the visible container
  overscan = 5 // Number of items to render outside visible area
}: VirtualizedTweetListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    tweets.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = tweets.slice(startIndex, endIndex + 1)

  // Handle scroll events with throttling
  const handleScroll = useCallback(() => {
    if (scrollElementRef.current) {
      setScrollTop(scrollElementRef.current.scrollTop)
    }
  }, [])

  useEffect(() => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) return

    // Throttle scroll events for better performance
    let ticking = false
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    scrollElement.addEventListener('scroll', throttledHandleScroll, { passive: true })
    return () => scrollElement.removeEventListener('scroll', throttledHandleScroll)
  }, [handleScroll])

  // Calculate total height and offset
  const totalHeight = tweets.length * itemHeight
  const offsetY = startIndex * itemHeight

  if (tweets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
          <svg className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.999-8c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
        </div>
        <p className="text-muted-foreground">No tweets available.</p>
      </div>
    )
  }

  return (
    <div
      ref={scrollElementRef}
      className="relative overflow-auto"
      style={{ height: containerHeight }}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((tweet, index) => {
            const actualIndex = startIndex + index
            return (
              <motion.div
                key={tweet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.02 }}
                style={{
                  height: itemHeight,
                  marginBottom: '1.5rem',
                  position: 'relative'
                }}
              >
                <TweetCard
                  tweet={{
                    ...tweet,
                    createdAt: new Date(tweet.createdAt)
                  }}
                  showUser={true}
                  isUpdating={isUpdating}
                  onUpdateEngagement={onUpdateEngagement}
                  showUpdateButton={showUpdateButton}
                  className="h-full"
                />
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Scroll indicators */}
      {tweets.length > 10 && (
        <div className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground border border-border">
          {startIndex + 1}-{Math.min(endIndex + 1, tweets.length)} of {tweets.length}
        </div>
      )}
    </div>
  )
}

// Non-virtualized fallback for smaller lists
export function SimpleTweetList({
  tweets,
  isUpdating = false,
  onUpdateEngagement,
  showUpdateButton = false
}: Omit<VirtualizedTweetListProps, 'itemHeight' | 'containerHeight' | 'overscan'>) {
  if (tweets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
          <svg className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.999-8c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
        </div>
        <p className="text-muted-foreground">No tweets available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {tweets.map((tweet, index) => (
        <motion.div
          key={tweet.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <TweetCard
            tweet={{
              ...tweet,
              createdAt: new Date(tweet.createdAt)
            }}
            showUser={true}
            isUpdating={isUpdating}
            onUpdateEngagement={onUpdateEngagement}
            showUpdateButton={showUpdateButton}
          />
        </motion.div>
      ))}
    </div>
  )
}

// Smart component that chooses between virtualized and simple list
export function SmartTweetList(props: VirtualizedTweetListProps) {
  // Use virtualization for lists with more than 20 items
  if (props.tweets.length > 20) {
    return <VirtualizedTweetList {...props} />
  }
  
  return <SimpleTweetList {...props} />
}
