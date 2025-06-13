import { NextResponse } from 'next/server'
import { TwitterOAuthService } from '@/lib/twitter-oauth'

export async function GET() {
  try {
    console.log('Testing OAuth configuration...')
    
    // Test environment variables
    const envCheck = {
      TWITTER_CLIENT_ID: !!process.env.TWITTER_CLIENT_ID,
      TWITTER_CLIENT_SECRET: !!process.env.TWITTER_CLIENT_SECRET,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NODE_ENV: process.env.NODE_ENV
    }

    console.log('Environment check:', envCheck)

    // Test TwitterOAuthService initialization
    const twitterOAuth = new TwitterOAuthService()
    const { url, codeVerifier, state } = twitterOAuth.generateAuthUrl()

    console.log('OAuth URL generated successfully')

    return NextResponse.json({
      success: true,
      environment: envCheck,
      oauth: {
        url: url.substring(0, 100) + '...',
        fullUrl: url,
        redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/twitter/callback`,
        clientId: process.env.TWITTER_CLIENT_ID,
        codeVerifierLength: codeVerifier.length,
        stateLength: state.length
      },
      message: 'OAuth configuration is working'
    })

  } catch (error) {
    console.error('OAuth configuration test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        TWITTER_CLIENT_ID: !!process.env.TWITTER_CLIENT_ID,
        TWITTER_CLIENT_SECRET: !!process.env.TWITTER_CLIENT_SECRET,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    }, { status: 500 })
  }
}
