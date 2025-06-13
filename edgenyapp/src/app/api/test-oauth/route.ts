import { NextResponse } from 'next/server'
import { TwitterOAuthService } from '@/lib/twitter-oauth'

export async function GET() {
  try {
    const twitterOAuth = new TwitterOAuthService()
    const { url, codeVerifier, state } = twitterOAuth.generateAuthUrl()

    return NextResponse.json({
      success: true,
      oauthUrl: url,
      redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/twitter/callback`,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      clientId: process.env.TWITTER_CLIENT_ID,
      hasClientSecret: !!process.env.TWITTER_CLIENT_SECRET,
      codeVerifierLength: codeVerifier.length,
      stateLength: state.length
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      hasClientId: !!process.env.TWITTER_CLIENT_ID,
      hasClientSecret: !!process.env.TWITTER_CLIENT_SECRET
    }, { status: 500 })
  }
}
