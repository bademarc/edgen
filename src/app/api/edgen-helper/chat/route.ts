/**
 * Edgen Helper Chat API Endpoint
 * Handles chat requests for the AI chatbot using external AI API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getIoNetApiService } from '@/lib/ionet-api-service'

// Simple content parsing utility for Llama-3.3-70B-Instruct
const parseAIContent = (content: string): string => {
  if (!content) return content

  console.log('🧹 [API] Parsing AI content, original length:', content.length)

  let cleanContent = content

  // Remove any <think> tags if present (though Llama shouldn't use them)
  cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/gim, '')
  cleanContent = cleanContent.replace(/<\/?think[^>]*>/gim, '')

  // Basic cleanup
  cleanContent = cleanContent.trim()
  cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines

  console.log('✅ [API] Cleaned content length:', cleanContent.length)
  console.log('📝 [API] Content preview:', cleanContent.substring(0, 200) + '...')

  return cleanContent
}

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

    console.log('🤖 Edgen Helper chat request received:', message.substring(0, 50) + '...')

    const aiService = getIoNetApiService()

    console.log('🔍 Checking external AI service status...')
    const serviceStatus = aiService.getStatus()
    console.log('📊 Service status:', serviceStatus)

    if (!aiService.isReady()) {
      console.warn('⚠️ External AI API service not ready, using enhanced fallback')
      console.warn('Service status details:', serviceStatus)

      const fallbackResponse = aiService.getFallbackResponse(message)

      // Return success with fallback message to keep chatbot working
      return NextResponse.json({
        success: true,
        message: parseAIContent(fallbackResponse.message || ''),
        isOffline: true,
        mode: 'Enhanced Offline Mode',
        serviceStatus: serviceStatus,
        timestamp: new Date().toISOString()
      })
    }

    // Send message to external AI API
    console.log('🚀 Sending message to external AI API...')
    const response = await aiService.sendMessage(message, conversationHistory || [])

    if (response.success) {
      console.log('✅ Edgen Helper response generated successfully')
      console.log(`📊 Response stats: ${response.usage?.totalTokens || 0} tokens, model: ${response.model || 'unknown'}`)

      // Parse the AI response to remove thinking tags
      const cleanedMessage = parseAIContent(response.message || '')

      return NextResponse.json({
        success: true,
        message: cleanedMessage,
        usage: response.usage,
        model: response.model,
        timestamp: new Date().toISOString(),
        isOffline: false
      })
    } else {
      console.error('❌ External AI API error:', response.error)

      // Provide enhanced fallback response as success to keep chatbot working
      const fallbackResponse = aiService.getFallbackResponse(message)

      return NextResponse.json({
        success: true,
        message: parseAIContent(fallbackResponse.message || ''),
        isOffline: true,
        mode: 'Enhanced Offline Mode',
        originalError: response.error,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('❌ Edgen Helper chat error:', error)

    // Provide comprehensive fallback response as success
    const fallbackMessage = "🤖 **Edgen Helper - Emergency Mode**\n\nI'm experiencing technical difficulties but I'm still here to help!\n\n🎯 **Quick Assistance**:\n• **Submit Tweets**: Visit `/submit` page\n• **Earn Points**: Use @layeredge or $EDGEN in tweets\n• **Check Dashboard**: View your current points\n• **Get Help**: Contact support for technical issues\n\n💡 **LayerEdge Basics**:\n- Tweet with required mentions\n- Higher engagement = more points\n- Community verification required\n\n*Emergency assistance mode active - I'll be back to full power soon!*"

    return NextResponse.json({
      success: true,
      message: parseAIContent(fallbackMessage),
      isOffline: true,
      mode: 'Emergency Mode',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}

export async function GET() {
  try {
    const aiService = getIoNetApiService()
    const status = aiService.getStatus()

    return NextResponse.json({
      service: 'Edgen Helper Chat API',
      status: status.ready ? 'ready' : 'not ready',
      externalAIStatus: {
        initialized: status.initialized,
        apiKey: status.apiKey,
        baseUrl: status.baseUrl,
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
