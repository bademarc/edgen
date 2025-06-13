import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN

    if (!bearerToken) {
      return NextResponse.json({
        success: false,
        error: 'Twitter Bearer Token not configured',
        details: 'TWITTER_BEARER_TOKEN environment variable is missing'
      }, { status: 500 })
    }

    // Test a simple Twitter API call
    const testQuery = 'from:layeredge (@layeredge OR $EDGEN)'
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(testQuery)}&max_results=10&tweet.fields=public_metrics,created_at&user.fields=username,name&expansions=author_id`

    console.log('Testing Twitter API with query:', testQuery)
    console.log('API URL:', url)

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000)
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse Twitter API response',
        details: {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 500)
        }
      }, { status: 500 })
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Twitter API error: ${response.status} ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          errors: responseData.errors || [],
          title: responseData.title || '',
          detail: responseData.detail || ''
        }
      }, { status: response.status })
    }

    // Check for API errors in successful response
    if (responseData.errors && responseData.errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Twitter API returned errors',
        details: {
          errors: responseData.errors,
          data: responseData.data || []
        }
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Twitter API test successful',
      data: {
        tweetsFound: responseData.data?.length || 0,
        tweets: responseData.data || [],
        includes: responseData.includes || {},
        meta: responseData.meta || {}
      },
      apiInfo: {
        bearerTokenConfigured: true,
        bearerTokenFormat: bearerToken.substring(0, 20) + '...',
        responseStatus: response.status,
        responseHeaders: {
          'x-rate-limit-limit': response.headers.get('x-rate-limit-limit'),
          'x-rate-limit-remaining': response.headers.get('x-rate-limit-remaining'),
          'x-rate-limit-reset': response.headers.get('x-rate-limit-reset')
        }
      }
    })

  } catch (error) {
    console.error('Twitter API test failed:', error)

    return NextResponse.json({
      success: false,
      error: 'Twitter API test failed',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'Unknown',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined
      }
    }, { status: 500 })
  }
}
