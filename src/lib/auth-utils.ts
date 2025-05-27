import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

export interface AuthResult {
  userId: string | null
  isAuthenticated: boolean
  authMethod: 'supabase' | 'custom' | null
}

/**
 * Universal authentication function that checks both Supabase sessions and custom session cookies
 * This ensures compatibility with both traditional Supabase OAuth and our custom Twitter OAuth
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthResult> {
  let userId: string | null = null
  let authMethod: 'supabase' | 'custom' | null = null

  // Try Supabase authentication first
  try {
    const supabase = createRouteHandlerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!authError && user) {
      userId = user.id
      authMethod = 'supabase'
      console.log('Authentication via Supabase session:', userId)
    }
  } catch {
    console.log('Supabase auth not available, checking custom session')
  }

  // If no Supabase session, check for custom session cookie
  if (!userId) {
    try {
      const cookieStore = await cookies()
      const customUserId = cookieStore.get('user_id')?.value

      if (customUserId) {
        // Verify the user exists in our database
        const dbUser = await prisma.user.findUnique({
          where: { id: customUserId },
          select: { id: true }
        })

        if (dbUser) {
          userId = customUserId
          authMethod = 'custom'
          console.log('Authentication via custom session:', userId)
        } else {
          console.log('Custom session user not found in database:', customUserId)
        }
      }
    } catch (error) {
      console.error('Error checking custom session:', error)
    }
  }

  return {
    userId,
    isAuthenticated: !!userId,
    authMethod
  }
}

/**
 * Simplified authentication function that just returns the user ID or null
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const auth = await getAuthenticatedUser(request)
  return auth.userId
}

/**
 * Authentication function that throws an error if user is not authenticated
 */
export async function requireAuthentication(request: NextRequest): Promise<string> {
  const auth = await getAuthenticatedUser(request)

  if (!auth.isAuthenticated || !auth.userId) {
    throw new Error('Authentication required')
  }

  return auth.userId
}
