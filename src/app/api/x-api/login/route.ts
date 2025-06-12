/**
 * X API Login Verification Endpoint
 * Verifies user login and authentication using new X API credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSimplifiedXApiService } from '@/lib/simplified-x-api'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Remove @ symbol if present
    const cleanUsername = username.replace('@', '')

    console.log(`🔐 Verifying login for user: @${cleanUsername}`)

    const xApiService = getSimplifiedXApiService()

    if (!xApiService.isReady()) {
      return NextResponse.json(
        {
          error: 'X API service not available',
          details: 'X API credentials may not be configured correctly'
        },
        { status: 503 }
      )
    }

    // Verify user login
    const loginResult = await xApiService.verifyUserLogin(cleanUsername)

    if (loginResult.success && loginResult.user) {
      console.log(`✅ Login verified for @${cleanUsername}`)

      return NextResponse.json({
        success: true,
        message: 'User login verified successfully',
        user: {
          id: loginResult.user.id,
          username: loginResult.user.username,
          name: loginResult.user.name,
          verified: loginResult.user.verified,
          description: loginResult.user.description,
          followersCount: loginResult.user.followersCount,
          followingCount: loginResult.user.followingCount,
          tweetCount: loginResult.user.tweetCount,
          profileImage: loginResult.user.profileImage,
          joinDate: loginResult.user.joinDate
        }
      })
    } else {
      console.log(`❌ Login verification failed for @${cleanUsername}: ${loginResult.error}`)

      return NextResponse.json(
        {
          success: false,
          error: loginResult.error || 'User verification failed',
          message: 'Unable to verify user login'
        },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('X API login verification error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to verify user login'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const xApiService = getSimplifiedXApiService()
    const isReady = xApiService.isReady()

    return NextResponse.json({
      service: 'X API Login Verification',
      status: isReady ? 'ready' : 'not ready',
      authenticated: isReady,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        service: 'X API Login Verification',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
