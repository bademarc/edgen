import { NextResponse } from 'next/server'
import { TwitterOAuthService } from '@/lib/twitter-oauth'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const twitterOAuth = new TwitterOAuthService()
    const { url, codeVerifier, state } = twitterOAuth.generateAuthUrl()

    // Store code verifier and state in secure cookies
    const cookieStore = cookies()

    // Set secure cookies for OAuth state management
    cookieStore.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    })

    cookieStore.set('twitter_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    })

    console.log('Generated Twitter OAuth URL:', url)
    console.log('Redirect URI:', `${process.env.NEXT_PUBLIC_SITE_URL}/auth/twitter/callback`)

    // Redirect to Twitter OAuth
    return NextResponse.redirect(url)

  } catch (error) {
    console.error('Twitter OAuth initiation failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'OAuth initialization failed'
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?error=oauth_init_failed&message=${encodeURIComponent(errorMessage)}`

    return NextResponse.redirect(redirectUrl)
  }
}
