import { NextRequest, NextResponse } from 'next/server'
import { getSimplifiedTweetSubmissionService } from '@/lib/simplified-tweet-submission'
import { getAuthenticatedUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    // Enhanced request validation
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          userMessage: 'Please check your request format and try again.',
          suggestions: ['Ensure the request contains valid JSON data']
        },
        { status: 400 }
      )
    }

    const { tweetUrl } = requestBody

    if (!tweetUrl) {
      return NextResponse.json(
        {
          error: 'Tweet URL is required',
          userMessage: 'Please provide a valid tweet URL to submit.',
          suggestions: [
            'Copy the URL from a tweet on X/Twitter',
            'Ensure the URL includes "/status/" followed by numbers',
            'Example: https://x.com/username/status/1234567890'
          ]
        },
        { status: 400 }
      )
    }

    if (typeof tweetUrl !== 'string') {
      return NextResponse.json(
        {
          error: 'Tweet URL must be a string',
          userMessage: 'The tweet URL format is invalid.',
          suggestions: ['Provide the URL as text, not as a number or other format']
        },
        { status: 400 }
      )
    }

    // Get authenticated user using universal auth function
    const authResult = await getAuthenticatedUser(request)

    if (!authResult.isAuthenticated || !authResult.userId) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          userMessage: 'Please log in to submit tweets.',
          suggestions: [
            'Sign in with your X/Twitter account',
            'Refresh the page if you were recently logged in',
            'Check if your session has expired'
          ]
        },
        { status: 401 }
      )
    }

    // Basic URL validation
    if (!tweetUrl.includes('twitter.com/') && !tweetUrl.includes('x.com/')) {
      return NextResponse.json(
        {
          error: 'Invalid tweet URL',
          userMessage: 'Please provide a valid X/Twitter URL.',
          suggestions: [
            'Make sure the URL is from X.com or Twitter.com',
            'Copy the URL directly from the tweet you want to submit',
            'Example: https://x.com/username/status/1234567890'
          ]
        },
        { status: 400 }
      )
    }

    if (!tweetUrl.includes('/status/')) {
      return NextResponse.json(
        {
          error: 'Invalid tweet URL format',
          userMessage: 'The URL must link to a specific tweet.',
          suggestions: [
            'Make sure the URL contains "/status/" followed by the tweet ID',
            'Copy the URL from the tweet itself, not the user profile',
            'Example: https://x.com/username/status/1234567890'
          ]
        },
        { status: 400 }
      )
    }

    // Get simplified submission service
    const submissionService = getSimplifiedTweetSubmissionService()

    // Check for bypass mode (admin or emergency situations)
    const bypassHeader = request.headers.get('x-bypass-circuit-breaker')
    const bypassCircuitBreaker = bypassHeader === process.env.ADMIN_SECRET

    if (bypassCircuitBreaker) {
      console.log('🔓 Circuit breaker bypass enabled for manual submission')
    }

    // Submit tweet with simplified error handling
    try {
      const result = await submissionService.submitTweet(tweetUrl, authResult.userId, bypassCircuitBreaker)

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message,
          tweetId: result.tweetId,
          points: result.points,
          bypassUsed: bypassCircuitBreaker
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.message,
            userMessage: result.message
          },
          { status: 400 }
        )
      }
    } catch (submissionError) {
      console.error('Tweet submission error:', submissionError)
      return NextResponse.json(
        {
          success: false,
          error: 'Submission failed',
          userMessage: 'An unexpected error occurred. Please try again later.'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Tweet submission API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user using universal auth function
    const authResult = await getAuthenticatedUser(request)

    if (!authResult.isAuthenticated || !authResult.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      canSubmit: true,
      message: 'Tweet submission is available'
    })

  } catch (error) {
    console.error('Tweet submission status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
