'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { TrophyIcon, SparklesIcon, UserIcon } from '@heroicons/react/24/outline'
import { formatNumber } from '@/lib/utils'

interface LeaderboardUser {
  id: string
  name?: string | null
  xUsername?: string | null
  image?: string | null
  totalPoints: number
  rank: number
  tweetsCount: number
}

// Mock data for demonstration
const mockLeaderboard: LeaderboardUser[] = [
  {
    id: '1',
    name: 'CryptoEnthusiast',
    xUsername: 'crypto_enthusiast',
    image: null,
    totalPoints: 2450,
    rank: 1,
    tweetsCount: 45,
  },
  {
    id: '2',
    name: 'LayerEdgeFan',
    xUsername: 'layeredge_fan',
    image: null,
    totalPoints: 2180,
    rank: 2,
    tweetsCount: 38,
  },
  {
    id: '3',
    name: 'TokenTrader',
    xUsername: 'token_trader',
    image: null,
    totalPoints: 1950,
    rank: 3,
    tweetsCount: 32,
  },
  {
    id: '4',
    name: 'DeFiExplorer',
    xUsername: 'defi_explorer',
    image: null,
    totalPoints: 1720,
    rank: 4,
    tweetsCount: 28,
  },
  {
    id: '5',
    name: 'BlockchainBull',
    xUsername: 'blockchain_bull',
    image: null,
    totalPoints: 1580,
    rank: 5,
    tweetsCount: 25,
  },
]

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchLeaderboard = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLeaderboard(mockLeaderboard)
      setIsLoading(false)
    }

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

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground">Community Leaderboard</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Top community members ranked by total points earned
          </p>
        </motion.div>

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {leaderboard.slice(0, 3).map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className={`relative bg-card border-2 rounded-lg p-6 text-center ${
                user.rank === 1 ? 'border-yellow-500 md:order-2' :
                user.rank === 2 ? 'border-gray-400 md:order-1' :
                'border-amber-600 md:order-3'
              }`}
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

                <h3 className="text-lg font-semibold text-foreground">
                  {user.name || user.xUsername || 'Anonymous'}
                </h3>
                {user.xUsername && (
                  <p className="text-sm text-muted-foreground">@{user.xUsername}</p>
                )}

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center space-x-1">
                    <SparklesIcon className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold text-primary">
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
          ))}
        </motion.div>

        {/* Rest of Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-4"
        >
          {leaderboard.slice(3).map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
              className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12">
                  {getRankIcon(user.rank)}
                </div>

                <div className="flex-1 flex items-center space-x-4">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || user.xUsername || 'User'}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {user.name || user.xUsername || 'Anonymous'}
                    </h3>
                    {user.xUsername && (
                      <p className="text-sm text-muted-foreground">@{user.xUsername}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <SparklesIcon className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold text-primary">
                      {formatNumber(user.totalPoints)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user.tweetsCount} tweets
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
