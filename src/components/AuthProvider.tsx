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
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setSupabaseUser(session.user)
          await syncUserData(session.user)
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.user) {
              setSupabaseUser(session.user)
              await syncUserData(session.user)
            } else {
              setSupabaseUser(null)
              setUser(null)
            }
          }
        )

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [supabase.auth])

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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'users.read tweet.read offline.access',
        },
      })

      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        throw error
      }
      setUser(null)
      setSupabaseUser(null)
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
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
