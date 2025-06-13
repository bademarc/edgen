import { create } from 'zustand'

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  xUsername?: string | null
  xUserId?: string | null
  totalPoints: number
  rank?: number | null
}

interface Tweet {
  id: string
  url: string
  content?: string | null
  userId: string
  likes: number
  retweets: number
  replies: number
  basePoints: number
  bonusPoints: number
  totalPoints: number
  isVerified: boolean
  createdAt: string
  user: User
}

interface DashboardStats {
  totalPoints: number
  rank: number | null
  tweetsSubmitted: number
  thisWeekPoints: number
}

interface LeaderboardUser {
  id: string
  name: string | null
  xUsername: string | null
  image: string | null
  totalPoints: number
  rank: number
  tweetsCount: number
}

interface AppState {
  user: User | null
  tweets: Tweet[]
  leaderboard: LeaderboardUser[]
  dashboardStats: DashboardStats | null
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setTweets: (tweets: Tweet[]) => void
  setLeaderboard: (leaderboard: LeaderboardUser[]) => void
  setDashboardStats: (stats: DashboardStats | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addTweet: (tweet: Tweet) => void
  updateTweet: (id: string, updates: Partial<Tweet>) => void
  refreshDashboard: () => Promise<void>
  refreshLeaderboard: () => Promise<void>
}

export const useStore = create<AppState>((set) => ({
  user: null,
  tweets: [],
  leaderboard: [],
  dashboardStats: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setTweets: (tweets) => set({ tweets }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addTweet: (tweet) => set((state) => ({ tweets: [tweet, ...state.tweets] })),
  updateTweet: (id, updates) => set((state) => ({
    tweets: state.tweets.map((tweet) =>
      tweet.id === id ? { ...tweet, ...updates } : tweet
    ),
  })),

  refreshDashboard: async () => {
    try {
      set({ isLoading: true, error: null })

      const [statsResponse, tweetsResponse] = await Promise.all([
        fetch('/api/user/stats'),
        fetch('/api/tweets?limit=5')
      ])

      if (!statsResponse.ok || !tweetsResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const [stats, tweets] = await Promise.all([
        statsResponse.json(),
        tweetsResponse.json()
      ])

      set({
        dashboardStats: stats,
        tweets: tweets,
        isLoading: false
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to refresh dashboard',
        isLoading: false
      })
    }
  },

  refreshLeaderboard: async () => {
    try {
      set({ isLoading: true, error: null })

      const response = await fetch('/api/leaderboard')
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }

      const leaderboard = await response.json()
      set({
        leaderboard,
        isLoading: false
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to refresh leaderboard',
        isLoading: false
      })
    }
  },
}))
