'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { TrophyIcon, SparklesIcon, UserIcon } from '@heroicons/react/24/outline'
import { formatNumber } from '@/lib/utils'
import { UserProfileModal } from '@/components/ui/user-profile-modal'

interface LeaderboardUser {
  id: string
  name?: string | null
  xUsername?: string | null
  image?: string | null
  totalPoints: number
  rank: number
  tweetsCount: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/leaderboard')
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      const data = await response.json()

      // Handle different API response formats
      let leaderboardData: LeaderboardUser[]

      if (Array.isArray(data)) {
        // Direct array response (fallback mode)
        leaderboardData = data
      } else if (data && Array.isArray(data.users)) {
        // Object response with users array (free tier mode)
        leaderboardData = data.users
      } else {
        // Unexpected response format
        console.error('Unexpected API response format:', data)
        throw new Error('Invalid leaderboard data format received')
      }

      // Ensure we have valid data
      if (!Array.isArray(leaderboardData)) {
        throw new Error('Leaderboard data is not an array')
      }

      setLeaderboard(leaderboardData)
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophyIcon className="h-6 w-6 text-yellow-500" />
      case 2:
        return <TrophyIcon className="h-6 w-6 text-gray-400" />
      case 3:
        return <TrophyIcon className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const handleUserClick = (user: LeaderboardUser) => {
    setSelectedUser(user)
    setIsProfileModalOpen(true)
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground">Community Leaderboard</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Top community members ranked by total points earned
            </p>
          </div>

          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/6"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Error Loading Leaderboard</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">Community Leaderboard</h1>
            <p className="text-muted-foreground mb-6">No community members found yet. Be the first to submit a tweet!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 sm:py-8 md:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Community Leaderboard</h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground px-2">
            Top community members ranked by total points earned
          </p>
        </motion.div>

        {/* Top 3 Podium - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12"
        >
          {Array.isArray(leaderboard) ? leaderboard.slice(0, 3).map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className={`relative bg-card border-2 rounded-lg p-4 sm:p-6 text-center touch-friendly cursor-pointer hover:shadow-lg transition-all duration-200 ${
                user.rank === 1 ? 'border-yellow-500 md:order-2 sm:col-span-2 md:col-span-1' :
                user.rank === 2 ? 'border-gray-400 md:order-1' :
                'border-amber-600 md:order-3'
              }`}
              onClick={() => handleUserClick(user)}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRankBadge(user.rank)}`}>
                  #{user.rank}
                </div>
              </div>

              <div className="mt-4">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || user.xUsername || 'User'}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full mx-auto mb-4"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  {user.name || user.xUsername || 'Anonymous'}
                </h3>
                {user.xUsername && (
                  <p className="text-sm text-muted-foreground">@{user.xUsername}</p>
                )}

                <div className="mt-3 sm:mt-4 space-y-2">
                  <div className="flex items-center justify-center space-x-1">
                    <SparklesIcon className="h-4 w-4 text-primary" />
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      {formatNumber(user.totalPoints)}
                    </span>
                    <span className="text-sm text-muted-foreground">points</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user.tweetsCount} tweets submitted
                  </p>
                </div>
              </div>
            </motion.div>
          )) : null}
        </motion.div>

        {/* Rest of Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-4"
        >
          {Array.isArray(leaderboard) ? leaderboard.slice(3).map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
              className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:border-primary/50 transition-colors touch-friendly cursor-pointer hover:shadow-md"
              onClick={() => handleUserClick(user)}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                  {getRankIcon(user.rank)}
                </div>

                <div className="flex-1 flex items-center space-x-3 sm:space-x-4 min-w-0">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || user.xUsername || 'User'}
                      width={40}
                      height={40}
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate">
                      {user.name || user.xUsername || 'Anonymous'}
                    </h3>
                    {user.xUsername && (
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">@{user.xUsername}</p>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="flex items-center space-x-1">
                    <SparklesIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    <span className="text-base sm:text-lg md:text-xl font-bold text-primary">
                      {formatNumber(user.totalPoints)}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {user.tweetsCount} tweets
                  </p>
                </div>
              </div>
            </motion.div>
          )) : null}
        </motion.div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUser}
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false)
          setSelectedUser(null)
        }}
      />
    </div>
  )
}
