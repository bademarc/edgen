import { createRouteHandlerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface TwitterUserData {
  user_name?: string
  screen_name?: string
  username?: string
  provider_id?: string
  sub?: string
  id?: string
  name?: string
  full_name?: string
  display_name?: string
  avatar_url?: string
  profile_image_url?: string
  picture?: string
}

interface SupabaseUserWithMetadata {
  id: string
  email?: string | null
  user_metadata?: TwitterUserData
  app_metadata?: TwitterUserData
  identities?: Array<{
    identity_data?: TwitterUserData
  }>
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // Handle OAuth errors from the provider
  if (error) {
    console.error('OAuth provider error:', { error, errorDescription })

    let errorMessage = 'Authentication failed'
    if (error === 'access_denied') {
      errorMessage = 'Access denied. Please grant permission to continue.'
    } else if (error === 'server_error') {
      // Check if this is the specific "Error getting user email" issue
      if (errorDescription && errorDescription.includes('Error getting user email from external provider')) {
        errorMessage = 'Twitter authentication succeeded, but email access was not granted. This is normal - you can still use the platform without email.'
        console.log('⚠️ Email access not granted, but this is acceptable for Twitter OAuth')

        // If we have a code parameter, try to proceed with authentication anyway
        if (code) {
          console.log('🔄 Attempting authentication despite email error...')
          // Continue to the normal authentication flow below
        } else {
          return NextResponse.redirect(`${origin}/login?error=oauth_warning&message=${encodeURIComponent(errorMessage)}`)
        }
      } else {
        errorMessage = 'Server error during authentication. Please try again.'
        return NextResponse.redirect(`${origin}/login?error=oauth_error&message=${encodeURIComponent(errorMessage)}`)
      }
    } else if (errorDescription) {
      errorMessage = decodeURIComponent(errorDescription)
      return NextResponse.redirect(`${origin}/login?error=oauth_error&message=${encodeURIComponent(errorMessage)}`)
    } else {
      return NextResponse.redirect(`${origin}/login?error=oauth_error&message=${encodeURIComponent(errorMessage)}`)
    }
  }

  if (code) {
    const supabase = createRouteHandlerClient(request)

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth callback error:', error)

        // Provide more specific error messages
        let errorMessage = 'Authentication failed'
        if (error.message.includes('email')) {
          errorMessage = 'Unable to retrieve email from Twitter. Please ensure your Twitter account has a verified email address.'
        } else if (error.message.includes('provider')) {
          errorMessage = 'Twitter authentication provider is not properly configured.'
        } else if (error.message.includes('callback')) {
          errorMessage = 'Invalid callback URL configuration.'
        }

        return NextResponse.redirect(`${origin}/login?error=auth_failed&message=${encodeURIComponent(errorMessage)}`)
      }

      if (data.user) {
        console.log('User authenticated successfully:', data.user.id)

        try {
          // Sync user data with our database
          await syncUserWithDatabase(data.user as SupabaseUserWithMetadata)
          console.log('User data synced successfully')
        } catch (syncError) {
          console.error('User sync error:', syncError)
          // Don't fail the authentication, just log the error
        }

        // Redirect to dashboard on successful authentication
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_exception&message=${encodeURIComponent('An unexpected error occurred during authentication')}`)
    }
  }

  // If no code or authentication failed, redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code&message=${encodeURIComponent('No authentication code received')}`)
}

async function syncUserWithDatabase(user: SupabaseUserWithMetadata) {
  try {
    // Extract Twitter user data from multiple possible sources
    const twitterData = user.user_metadata || {}
    const providerData = user.identities?.[0]?.identity_data || {}
    const appMetadata = user.app_metadata || {}

    // Get Twitter username and user ID from various possible fields
    const xUsername =
      twitterData.user_name ||
      twitterData.screen_name ||
      twitterData.username ||
      providerData.user_name ||
      providerData.screen_name ||
      providerData.username ||
      appMetadata.user_name ||
      null

    const xUserId =
      twitterData.provider_id ||
      twitterData.sub ||
      twitterData.id ||
      providerData.provider_id ||
      providerData.sub ||
      providerData.id ||
      appMetadata.provider_id ||
      null

    // Get user name from various sources
    const userName =
      twitterData.name ||
      twitterData.full_name ||
      twitterData.display_name ||
      providerData.name ||
      providerData.full_name ||
      providerData.display_name ||
      (user.email ? user.email.split('@')[0] : null) ||
      (xUsername ? `@${xUsername}` : null) ||
      'Twitter User'

    // Get profile image
    const userImage =
      twitterData.avatar_url ||
      twitterData.profile_image_url ||
      twitterData.picture ||
      providerData.avatar_url ||
      providerData.profile_image_url ||
      providerData.picture ||
      null

    console.log('Syncing user data:', {
      userId: user.id,
      email: user.email || 'No email provided',
      name: userName,
      xUsername,
      xUserId,
      hasTwitterData: !!(xUsername && xUserId)
    })

    // Create or update user in our database
    // Note: Email might be null for Twitter OAuth, which is fine
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: (user.email as string) || null, // Email might not be available from Twitter
        name: userName,
        image: userImage,
        xUsername: xUsername || null,
        xUserId: xUserId || null,
        autoMonitoringEnabled: !!(xUsername && xUserId), // Enable monitoring if we have Twitter credentials
      },
      create: {
        id: user.id,
        email: (user.email as string) || null, // Email might not be available from Twitter
        name: userName,
        image: userImage,
        xUsername: xUsername || null,
        xUserId: xUserId || null,
        totalPoints: 0,
        autoMonitoringEnabled: !!(xUsername && xUserId), // Enable monitoring if we have Twitter credentials
      },
    })

    // Initialize tweet monitoring if we have Twitter credentials
    if (xUsername && xUserId) {
      await prisma.tweetMonitoring.upsert({
        where: { userId: user.id },
        update: {
          status: 'active',
          errorMessage: null,
        },
        create: {
          userId: user.id,
          status: 'active',
          tweetsFound: 0,
        },
      })
    } else {
      // Set error status if missing credentials
      await prisma.tweetMonitoring.upsert({
        where: { userId: user.id },
        update: {
          status: 'error',
          errorMessage: 'Missing Twitter credentials - please re-authenticate',
        },
        create: {
          userId: user.id,
          status: 'error',
          errorMessage: 'Missing Twitter credentials - please re-authenticate',
          tweetsFound: 0,
        },
      })
    }

  } catch (error) {
    console.error('Database sync error:', error)
    throw error
  }
}
