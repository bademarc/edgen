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
  createdAt: Date
  user: User
}

interface AppState {
  user: User | null
  tweets: Tweet[]
  leaderboard: User[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setTweets: (tweets: Tweet[]) => void
  setLeaderboard: (leaderboard: User[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addTweet: (tweet: Tweet) => void
  updateTweet: (id: string, updates: Partial<Tweet>) => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  tweets: [],
  leaderboard: [],
  isLoading: false,
  error: null,
  
  setUser: (user) => set({ user }),
  setTweets: (tweets) => set({ tweets }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addTweet: (tweet) => set((state) => ({ tweets: [tweet, ...state.tweets] })),
  updateTweet: (id, updates) => set((state) => ({
    tweets: state.tweets.map((tweet) =>
      tweet.id === id ? { ...tweet, ...updates } : tweet
    ),
  })),
}))
