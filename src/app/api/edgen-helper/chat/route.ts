/**
 * Edgen Helper Chat API Endpoint
 * Handles chat requests for the AI chatbot using io.net API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getIoNetApiService } from '@/lib/ionet-api-service'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Message is required and must be a string' 
        },
        { status: 400 }
      )
    }

    console.log('🤖 Edgen Helper chat request received')

    const ionetService = getIoNetApiService()

    if (!ionetService.isReady()) {
      console.warn('⚠️ io.net API service not ready, using fallback')
      
      const fallbackResponse = ionetService.getFallbackResponse(message)
      
      return NextResponse.json({
        success: false,
        error: 'AI service temporarily unavailable',
        fallbackMessage: fallbackResponse.message,
        isOffline: true
      })
    }

    // Send message to io.net API
    const response = await ionetService.sendMessage(message, conversationHistory || [])

    if (response.success) {
      console.log('✅ Edgen Helper response generated successfully')
      
      return NextResponse.json({
        success: true,
        message: response.message,
        usage: response.usage,
        timestamp: new Date().toISOString()
      })
    } else {
      console.error('❌ io.net API error:', response.error)
      
      // Provide fallback response
      const fallbackResponse = ionetService.getFallbackResponse(message)
      
      return NextResponse.json({
        success: false,
        error: response.error,
        fallbackMessage: fallbackResponse.message,
        isOffline: true
      })
    }
  } catch (error) {
    console.error('❌ Edgen Helper chat error:', error)

    // Provide generic fallback response
    const fallbackMessage = "I'm currently experiencing technical difficulties. For immediate help:\n\n• Visit /submit to submit tweets\n• Check your dashboard for points\n• Use @layeredge and $EDGEN in your tweets\n• Contact support if issues persist"

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        fallbackMessage,
        isOffline: true
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const ionetService = getIoNetApiService()
    const status = ionetService.getStatus()

    return NextResponse.json({
      service: 'Edgen Helper Chat API',
      status: status.ready ? 'ready' : 'not ready',
      ionetApiStatus: {
        initialized: status.initialized,
        apiKey: status.apiKey,
        apiUrl: status.apiUrl,
        model: status.model,
        ready: status.ready
      },
      features: [
        'Platform navigation assistance',
        'Tweet submission guidance',
        'Points system explanation',
        'Hashtag usage help',
        'Troubleshooting support'
      ],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        service: 'Edgen Helper Chat API',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
