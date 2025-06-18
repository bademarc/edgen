import { NextRequest, NextResponse } from 'next/server'
import { getSimplifiedTweetSubmissionService } from '@/lib/simplified-tweet-submission'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { getEnhancedContentValidator } from '@/lib/enhanced-content-validator'

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

    // Submit tweet with enhanced error handling and logging
    try {
      console.log('🔍 Tweet submission: Starting submission process')
      console.log('📝 Tweet URL:', tweetUrl)
      console.log('👤 User ID:', authResult.userId)
      console.log('🔧 Bypass circuit breaker:', bypassCircuitBreaker)

      const result = await submissionService.submitTweet(tweetUrl, authResult.userId, bypassCircuitBreaker)

      console.log('📊 Tweet submission result:', {
        success: result.success,
        message: result.message,
        tweetId: result.tweetId || 'N/A',
        points: result.points || 0
      })

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message,
          tweetId: result.tweetId,
          points: result.points,
          bypassUsed: bypassCircuitBreaker
        })
      } else {
        console.log('❌ Tweet submission failed:', result.message)
        return NextResponse.json(
          {
            success: false,
            error: result.message,
            userMessage: result.message || 'Tweet submission failed. Please try again.',
            suggestions: [
              'Ensure the tweet URL is valid and accessible',
              'Check that the tweet mentions @layeredge or contains EDGEN',
              'Verify you are the author of the tweet',
              'Try again in a few minutes if rate limited'
            ]
          },
          { status: 400 }
        )
      }
    } catch (submissionError) {
      console.error('❌ Tweet submission error:', submissionError)
      console.error('❌ Error details:', {
        name: submissionError instanceof Error ? submissionError.name : 'Unknown',
        message: submissionError instanceof Error ? submissionError.message : String(submissionError),
        stack: submissionError instanceof Error ? submissionError.stack : 'No stack trace'
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Submission failed',
          userMessage: 'An unexpected error occurred during tweet submission. Please try again later.',
          suggestions: [
            'Check your internet connection',
            'Verify the tweet URL is correct',
            'Try submitting again in a few minutes',
            'Contact support if the issue persists'
          ]
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
