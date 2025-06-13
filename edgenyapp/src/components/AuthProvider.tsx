'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthUser {
  id: string
  name: string | null
  email: string | null
  xUsername: string | null
  xUserId: string | null
  image: string | null
  totalPoints: number
  rank?: number | null
  autoMonitoringEnabled: boolean
}

interface AuthContextType {
  user: AuthUser | null
  supabaseUser: User | null
  isLoading: boolean
  signInWithTwitter: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    let subscription: any = null

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setSupabaseUser(session.user)
          await syncUserData(session.user)
        } else {
          // Check for custom session cookie (Twitter OAuth fallback)
          await checkCustomSession()
        }

        // Listen for auth changes
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.user) {
              setSupabaseUser(session.user)
              await syncUserData(session.user)
            } else {
              setSupabaseUser(null)
              setUser(null)
              // Check for custom session as fallback
              await checkCustomSession()
            }
          }
        )

        subscription = authSubscription
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, []) // CRITICAL FIX: Remove supabase.auth dependency to prevent multiple GoTrueClient instances

  const checkCustomSession = async () => {
    try {
      // Check if there's a custom session via API
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })

      if (response.ok) {
        const userData = await response.json()
        if (userData.user) {
          setUser(userData.user)
          console.log('Custom session found:', userData.user.id)
        }
      }
    } catch (error) {
      console.error('Error checking custom session:', error)
    }
  }

  const syncUserData = async (supabaseUser: User) => {
    try {
      // Extract Twitter data from user metadata
      const twitterData = supabaseUser.user_metadata
      const xUsername = twitterData?.user_name || twitterData?.screen_name
      const xUserId = twitterData?.provider_id || supabaseUser.id

      // Create or update user in our database via API
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: twitterData?.name || twitterData?.full_name,
          xUsername,
          xUserId,
          image: twitterData?.avatar_url || twitterData?.profile_image_url,
        }),
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        console.error('Failed to sync user data')
      }
    } catch (error) {
      console.error('Error syncing user data:', error)
    }
  }

  const signInWithTwitter = async () => {
    setIsLoading(true)
    try {
      console.log('Starting Twitter OAuth...')

      // Redirect to our Twitter OAuth endpoint
      window.location.href = '/auth/twitter'

    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      if (supabaseUser) {
        await syncUserData(supabaseUser)
      } else {
        await checkCustomSession()
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase sign out error:', error)
      }

      // Clear custom session cookie via API
      try {
        await fetch('/api/auth/session', {
          method: 'DELETE',
          credentials: 'include'
        })
      } catch (error) {
        console.error('Custom session clear error:', error)
      }

      // Clear local state
      setUser(null)
      setSupabaseUser(null)

      // Redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    supabaseUser,
    isLoading,
    signInWithTwitter,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
