import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.MENTION_TRACKER_SECRET || 'layeredge-mention-tracker-2024-secure-key'

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid secret' },
        { status: 401 }
      )
    }

    // Get the Supabase edge function URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Supabase URL not configured' },
        { status: 500 }
      )
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/track-mentions`

    console.log('🔄 Calling Supabase edge function:', edgeFunctionUrl)

    // Call the Supabase edge function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${expectedSecret}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Edge function error:', response.status, errorText)

      return NextResponse.json(
        {
          error: 'Edge function call failed',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      )
    }

    const result = await response.json()

    console.log('✅ Edge function result:', result)

    return NextResponse.json({
      success: true,
      message: 'Manual mention tracking completed',
      edgeFunctionResult: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 Error in manual mention tracking:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSecret = !!process.env.MENTION_TRACKER_SECRET
    const hasBearerToken = !!process.env.TWITTER_BEARER_TOKEN

    return NextResponse.json({
      status: 'ok',
      message: 'Mention tracking API is ready',
      configuration: {
        supabaseUrl: !!supabaseUrl,
        hasSecret,
        hasBearerToken,
        edgeFunctionUrl: supabaseUrl ? `${supabaseUrl}/functions/v1/track-mentions` : null
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
