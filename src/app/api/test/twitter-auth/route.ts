import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint to verify Twitter Bearer Token authentication
 * This endpoint tests the token format and basic API connectivity
 */
export async function GET(request: NextRequest) {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN

    if (!bearerToken) {
      return NextResponse.json({
        success: false,
        error: 'Twitter Bearer Token not configured',
        details: 'TWITTER_BEARER_TOKEN environment variable is missing'
      }, { status: 500 })
    }

    // Check token format
    const tokenValidation = {
      hasToken: !!bearerToken,
      tokenLength: bearerToken.length,
      startsCorrectly: bearerToken.startsWith('AAAAAAAAAAAAAAAAAAAAAA'),
      containsUrlEncoding: bearerToken.includes('%'),
      decodedLength: decodeURIComponent(bearerToken).length
    }

    console.log('🔍 Token validation:', tokenValidation)

    // Test basic API connectivity with a simple request
    try {
      console.log('🧪 Testing Twitter API connectivity...')
      
      const testResponse = await fetch('https://api.twitter.com/2/tweets/search/recent?query=test&max_results=10', {
        method: 'HEAD', // Use HEAD to avoid consuming quota
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      const rateLimitInfo = {
        limit: testResponse.headers.get('x-rate-limit-limit'),
        remaining: testResponse.headers.get('x-rate-limit-remaining'),
        reset: testResponse.headers.get('x-rate-limit-reset')
      }

      console.log('📊 Rate limit info:', rateLimitInfo)

      if (testResponse.status === 200) {
        return NextResponse.json({
          success: true,
          message: 'Twitter Bearer Token is valid and API is accessible',
          tokenValidation,
          apiTest: {
            status: testResponse.status,
            statusText: testResponse.statusText,
            rateLimitInfo
          },
          recommendations: [
            'Token format is correct',
            'API connectivity is working',
            'Rate limits are available'
          ]
        })
      } else if (testResponse.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Twitter Bearer Token authentication failed',
          tokenValidation,
          apiTest: {
            status: testResponse.status,
            statusText: testResponse.statusText,
            rateLimitInfo
          },
          recommendations: [
            'Check if the Bearer Token is correct',
            'Verify the token has not expired',
            'Ensure the token has proper permissions',
            'Check if the token format is URL-decoded properly'
          ]
        }, { status: 401 })
      } else if (testResponse.status === 403) {
        return NextResponse.json({
          success: false,
          error: 'Twitter API access forbidden',
          tokenValidation,
          apiTest: {
            status: testResponse.status,
            statusText: testResponse.statusText,
            rateLimitInfo
          },
          recommendations: [
            'Check if your Twitter API plan includes this endpoint',
            'Verify your app has the necessary permissions',
            'Check if your account is in good standing'
          ]
        }, { status: 403 })
      } else if (testResponse.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'Twitter API rate limit exceeded',
          tokenValidation,
          apiTest: {
            status: testResponse.status,
            statusText: testResponse.statusText,
            rateLimitInfo
          },
          recommendations: [
            'Wait for rate limit reset',
            'Implement proper rate limiting in your application',
            'Consider upgrading your Twitter API plan'
          ]
        }, { status: 429 })
      } else {
        const errorText = await testResponse.text().catch(() => 'Unable to read error response')
        
        return NextResponse.json({
          success: false,
          error: `Twitter API returned unexpected status: ${testResponse.status}`,
          tokenValidation,
          apiTest: {
            status: testResponse.status,
            statusText: testResponse.statusText,
            errorText,
            rateLimitInfo
          },
          recommendations: [
            'Check Twitter API status page',
            'Verify your API endpoint URL',
            'Review Twitter API documentation'
          ]
        }, { status: testResponse.status })
      }

    } catch (apiError) {
      console.error('❌ Twitter API test failed:', apiError)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to Twitter API',
        tokenValidation,
        apiTest: {
          error: apiError instanceof Error ? apiError.message : 'Unknown API error',
          errorType: apiError instanceof Error ? apiError.name : 'Unknown'
        },
        recommendations: [
          'Check your internet connection',
          'Verify Twitter API endpoints are accessible',
          'Check if there are any firewall restrictions',
          'Try again in a few minutes'
        ]
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Twitter auth test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Twitter authentication test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      recommendations: [
        'Check environment variable configuration',
        'Verify .env.local file is properly loaded',
        'Restart the development server'
      ]
    }, { status: 500 })
  }
}

// POST endpoint for testing with specific token
export async function POST(request: NextRequest) {
  try {
    const { testToken } = await request.json()

    if (!testToken) {
      return NextResponse.json({
        success: false,
        error: 'Test token is required in request body'
      }, { status: 400 })
    }

    // Test the provided token
    const testResponse = await fetch('https://api.twitter.com/2/tweets/search/recent?query=test&max_results=10', {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    })

    const rateLimitInfo = {
      limit: testResponse.headers.get('x-rate-limit-limit'),
      remaining: testResponse.headers.get('x-rate-limit-remaining'),
      reset: testResponse.headers.get('x-rate-limit-reset')
    }

    return NextResponse.json({
      success: testResponse.status === 200,
      message: testResponse.status === 200 ? 'Test token is valid' : 'Test token failed',
      testResult: {
        status: testResponse.status,
        statusText: testResponse.statusText,
        rateLimitInfo
      },
      tokenInfo: {
        length: testToken.length,
        startsCorrectly: testToken.startsWith('AAAAAAAAAAAAAAAAAAAAAA'),
        containsUrlEncoding: testToken.includes('%')
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to test provided token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
