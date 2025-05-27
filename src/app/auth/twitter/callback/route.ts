import { NextRequest, NextResponse } from 'next/server'
import { TwitterOAuthService } from '@/lib/twitter-oauth'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  const origin = requestUrl.origin
  const cookieStore = await cookies()

  // Use production URL for redirects, fallback to request origin for development
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

  console.log('OAuth callback - Request origin:', origin)
  console.log('OAuth callback - Base URL for redirects:', baseUrl)

  // Handle OAuth errors
  if (error) {
    console.error('Twitter OAuth error:', { error, errorDescription })

    let errorMessage = 'Authentication failed'
    if (error === 'access_denied') {
      errorMessage = 'Access denied. Please grant permission to continue.'
    } else if (errorDescription) {
      errorMessage = decodeURIComponent(errorDescription)
    }

    return NextResponse.redirect(`${baseUrl}/login?error=oauth_error&message=${encodeURIComponent(errorMessage)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/login?error=missing_params&message=${encodeURIComponent('Missing authorization code or state')}`)
  }

  try {
    // Verify state to prevent CSRF attacks
    const storedState = cookieStore.get('twitter_oauth_state')?.value
    if (!storedState || storedState !== state) {
      console.error('OAuth state mismatch:', { stored: storedState, received: state })
      return NextResponse.redirect(`${baseUrl}/login?error=state_mismatch&message=${encodeURIComponent('Invalid OAuth state')}`)
    }

    // Get code verifier from cookie
    const codeVerifier = cookieStore.get('twitter_code_verifier')?.value
    if (!codeVerifier) {
      console.error('Missing code verifier in cookies')
      return NextResponse.redirect(`${baseUrl}/login?error=missing_verifier&message=${encodeURIComponent('Missing OAuth code verifier')}`)
    }

    // Exchange code for token
    const twitterOAuth = new TwitterOAuthService()
    console.log('Exchanging code for token...')

    const tokenResponse = await twitterOAuth.exchangeCodeForToken(code, codeVerifier)
    console.log('Token exchange successful')

    // Get user information
    console.log('Fetching user information...')
    const userResponse = await twitterOAuth.getUserInfo(tokenResponse.access_token)
    const twitterUser = userResponse.data

    console.log('Twitter user data:', {
      id: twitterUser.id,
      username: twitterUser.username,
      name: twitterUser.name
    })

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { xUserId: twitterUser.id },
      update: {
        name: twitterUser.name,
        xUsername: twitterUser.username,
        image: twitterUser.profile_image_url || null,
        autoMonitoringEnabled: true,
        // Update token information
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        tokenExpiresAt: tokenResponse.expires_in
          ? new Date(Date.now() + tokenResponse.expires_in * 1000)
          : null
      },
      create: {
        id: crypto.randomUUID(),
        name: twitterUser.name,
        xUsername: twitterUser.username,
        xUserId: twitterUser.id,
        image: twitterUser.profile_image_url || null,
        totalPoints: 0,
        autoMonitoringEnabled: true,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        tokenExpiresAt: tokenResponse.expires_in
          ? new Date(Date.now() + tokenResponse.expires_in * 1000)
          : null
      }
    })

    // Initialize tweet monitoring
    await prisma.tweetMonitoring.upsert({
      where: { userId: user.id },
      update: {
        status: 'active',
        errorMessage: null
      },
      create: {
        userId: user.id,
        status: 'active',
        tweetsFound: 0
      }
    })

    // Clear OAuth cookies
    cookieStore.delete('twitter_code_verifier')
    cookieStore.delete('twitter_oauth_state')

    // Set user session cookie (custom session management)
    cookieStore.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    })

    console.log('User authentication successful:', user.id)

    // Redirect to dashboard using production URL
    console.log('Redirecting to dashboard:', `${baseUrl}/dashboard`)
    return NextResponse.redirect(`${baseUrl}/dashboard`)

  } catch (error) {
    console.error('Twitter OAuth callback error:', error)

    // Clear OAuth cookies on error
    cookieStore.delete('twitter_code_verifier')
    cookieStore.delete('twitter_oauth_state')

    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    return NextResponse.redirect(`${baseUrl}/login?error=auth_failed&message=${encodeURIComponent(errorMessage)}`)
  }
}
