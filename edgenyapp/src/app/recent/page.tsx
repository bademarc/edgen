'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { TweetCard } from '@/components/TweetCard'
import { formatNumber } from '@/lib/utils'
import { ErrorBoundary } from '@/components/ui/error-boundary'

// Simplified Tweet interface for database-only approach
interface Tweet {
  id: string
  url: string
  content?: string | null
  likes: number
  retweets: number
  replies: number
  totalPoints: number
  totalEngagement: number
  createdAt: string
  submittedAt: string
  displayDate: string
  lastEngagementUpdate?: string | null
  user: {
    id: string
    name: string | null
    xUsername: string | null
    image: string | null
  }
}

interface ApiResponse {
  success: boolean
  tweets: Tweet[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
    page: number
    totalPages: number
  }
  meta: {
    sortBy: string
    search: string | null
    timestamp: string
    source: string
  }
}

export default function RecentSubmissionsPage() {
  // Core state
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'points' | 'engagement'>('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<ApiResponse['pagination'] | null>(null)
  
  // UI state
  const [isHydrated, setIsHydrated] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Hydration fix
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // CRITICAL FIX: Use refs to store current values and avoid circular dependencies
  const sortByRef = useRef(sortBy)
  const searchTermRef = useRef(searchTerm)
  const paginationRef = useRef(pagination)
  const currentPageRef = useRef(currentPage)
  const isLoadingRef = useRef(isLoading)

  // Update refs when values change
  useEffect(() => {
    sortByRef.current = sortBy
  }, [sortBy])

  useEffect(() => {
    searchTermRef.current = searchTerm
  }, [searchTerm])

  useEffect(() => {
    paginationRef.current = pagination
  }, [pagination])

  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  // CRITICAL FIX: Fetch tweets with stable dependencies using refs
  const fetchTweets = useCallback(async (page = 1, isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const limit = 20
      const offset = (page - 1) * limit

      // CRITICAL FIX: Use refs to get current values without dependencies
      const currentSortBy = sortByRef.current
      const currentSearchTerm = searchTermRef.current

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sortBy: currentSortBy,
        ...(currentSearchTerm && { search: currentSearchTerm })
      })

      console.log(`🔍 Fetching tweets: page=${page}, sortBy=${currentSortBy}, search="${currentSearchTerm}"`)

      const response = await fetch(`/api/recent-tweets?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch tweets')
      }

      console.log(`✅ Fetched ${data.tweets.length} tweets (${data.pagination.total} total)`)

      if (page === 1) {
        setTweets(data.tweets)
      } else {
        // Append for pagination
        setTweets(prev => [...prev, ...data.tweets])
      }

      setPagination(data.pagination)
      setCurrentPage(page)
      setLastRefresh(new Date())

    } catch (err) {
      console.error('❌ Error fetching tweets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tweets')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, []) // CRITICAL FIX: No dependencies to prevent circular loops

  // Initial load
  useEffect(() => {
    if (isHydrated) {
      fetchTweets(1)
    }
  }, [isHydrated]) // CRITICAL FIX: Remove fetchTweets dependency to prevent circular dependency

  // Search with debounce
  useEffect(() => {
    if (!isHydrated) return

    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchTweets(1)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, isHydrated]) // CRITICAL FIX: Removed fetchTweets dependency since it's now stable

  // Sort change
  useEffect(() => {
    if (!isHydrated) return

    setCurrentPage(1)
    fetchTweets(1)
  }, [sortBy, isHydrated]) // CRITICAL FIX: Removed fetchTweets dependency since it's now stable

  // Manual refresh
  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered')
    fetchTweets(1, true)
  }, []) // CRITICAL FIX: No dependencies since fetchTweets is stable

  // Load more (pagination)
  const handleLoadMore = useCallback(() => {
    const currentPagination = paginationRef.current
    const currentPageValue = currentPageRef.current
    const currentIsLoading = isLoadingRef.current

    if (currentPagination?.hasMore && !currentIsLoading) {
      fetchTweets(currentPageValue + 1)
    }
  }, []) // CRITICAL FIX: No dependencies to prevent circular loops

  // Filter tweets based on search (client-side backup)
  const filteredTweets = useMemo(() => {
    if (!searchTerm.trim()) return tweets
    
    const searchLower = searchTerm.toLowerCase()
    return tweets.filter(tweet => 
      tweet.content?.toLowerCase().includes(searchLower) ||
      tweet.user.name?.toLowerCase().includes(searchLower) ||
      tweet.user.xUsername?.toLowerCase().includes(searchLower)
    )
  }, [tweets, searchTerm])

  // Loading state
  if (!isHydrated || (isLoading && tweets.length === 0)) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded w-1/3 mb-8 animate-pulse"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                <div className="h-16 bg-muted rounded mb-4"></div>
                <div className="flex space-x-4">
                  <div className="h-4 bg-muted rounded w-16"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && tweets.length === 0) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Failed to Load Tweets</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              className="btn-layeredge-primary px-6 py-3 rounded-lg font-semibold hover-lift"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">Recent Submissions</h1>
            <p className="text-muted-foreground">
              Latest community tweets and engagement highlights
            </p>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="card-layeredge p-6 mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search tweets or users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-layeredge w-full pl-10 pr-4 py-2 text-sm"
                  />
                </div>

                {/* Sort */}
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'points' | 'engagement')}
                    className="input-layeredge pl-10 pr-8 py-2 text-sm appearance-none bg-card"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="points">Highest Points</option>
                    <option value="engagement">Most Engagement</option>
                  </select>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="flex items-center space-x-3">
                {lastRefresh && (
                  <div className="text-xs text-muted-foreground">
                    Updated: {lastRefresh.toLocaleTimeString()}
                  </div>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="btn-layeredge-ghost p-2 rounded-lg hover-lift disabled:opacity-50"
                  title="Refresh tweets"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {filteredTweets.length} of {formatNumber(pagination?.total || 0)} tweets
                </span>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Live community feed</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tweets List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {filteredTweets.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {searchTerm ? 'No tweets found matching your search.' : 'No tweets available.'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 text-layeredge-blue hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {filteredTweets.map((tweet, index) => (
                    <motion.div
                      key={tweet.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      layout
                    >
                      <TweetCard
                        tweet={{
                          ...tweet,
                          createdAt: new Date(tweet.displayDate)
                        }}
                        showUser={true}
                        isUpdating={false}
                        showUpdateButton={false}
                        className="hover:shadow-lg transition-shadow duration-200"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Load More / Pagination */}
          {pagination?.hasMore && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-8"
            >
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="btn-layeredge-secondary px-8 py-3 rounded-lg font-semibold hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Load More Tweets</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </div>
                )}
              </button>

              {pagination && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} • {formatNumber(pagination.total)} total tweets
                </div>
              )}
            </motion.div>
          )}

          {/* Success Message */}
          {tweets.length > 0 && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  ✅ Community feed is active and up-to-date!
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}
