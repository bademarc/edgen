/**
 * AI API Service for Edgen Helper AI Chatbot
 * Integrates with external AI API for intelligent responses
 * Provides intelligent assistance for LayerEdge community platform
 */

export interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  temperature: number
  topP: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export interface ChatResponse {
  success: boolean
  message?: string
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model?: string
  finishReason?: string
  isOffline?: boolean
}

export class AIService {
  private config: AIConfig
  private isInitialized: boolean = false

  constructor(config?: Partial<AIConfig>) {
    this.config = {
      apiKey: process.env.IO_NET_API_KEY || '',
      baseUrl: process.env.IO_NET_BASE_URL || 'https://api.intelligence.io.solutions/api',
      model: process.env.IO_NET_MODEL || 'meta-llama/Llama-3.3-70B-Instruct',
      maxTokens: parseInt(process.env.EDGEN_HELPER_MAX_TOKENS || '1000'),
      temperature: parseFloat(process.env.EDGEN_HELPER_TEMPERATURE || '0.7'),
      topP: parseFloat(process.env.EDGEN_HELPER_TOP_P || '0.9'),
      ...config
    }

    if (!this.config.apiKey) {
      console.warn('⚠️ External AI API key not configured')
      console.warn('Environment check:', {
        IO_NET_API_KEY: process.env.IO_NET_API_KEY ? 'Present' : 'Missing',
        IO_NET_BASE_URL: process.env.IO_NET_BASE_URL || 'Missing',
        IO_NET_MODEL: process.env.IO_NET_MODEL || 'Missing'
      })
      this.isInitialized = false
    } else {
      this.isInitialized = true
      console.log('✅ External AI API service initialized')
      console.log(`📡 Base URL: ${this.config.baseUrl}`)
      console.log(`🤖 Model: ${this.config.model}`)
      console.log(`🔑 API Key: ${this.config.apiKey.substring(0, 20)}...`)
    }
  }

  /**
   * Get the system prompt for Edgen Helper (External AI Assistant)
   */
  private getSystemPrompt(): string {
    return `You are "Edgen Helper", an intelligent AI assistant for the LayerEdge community platform.

CORE MISSION: Help LayerEdge community members maximize their engagement and earn points through strategic tweet submission.

PLATFORM OVERVIEW:
LayerEdge is a community-driven platform for $EDGEN token holders where users earn points by submitting high-engagement tweets containing specific mentions.

RESPONSE STYLE:
- Be direct, helpful, and engaging
- Use emojis and LayerEdge branding appropriately
- Provide actionable guidance
- Match the user's energy level
- No meta-commentary or planning - just helpful responses

KEY FEATURES YOU SUPPORT:

1. **Points System**: Users earn points by submitting tweets with @layeredge OR $EDGEN mentions. Points = base score + engagement multiplier (likes + retweets + replies).

2. **Tweet Submission**: Guide users to /submit page where they paste direct tweet URLs. System validates mentions and tracks engagement.

3. **Hashtag Strategy**: @layeredge (official mention) or $EDGEN (token reference) - either qualifies for points.

4. **Troubleshooting**: Help with common issues like invalid URLs, tweet not found, missing points, or login problems.

5. **Best Practices**: Encourage authentic content, genuine engagement, and respectful community participation.

GUIDELINES:
- Be helpful and actionable
- Use Bitcoin orange (#f7931a) branding when relevant
- Direct users to /submit page for tweet submission
- Keep responses clean and professional
- Match user energy (casual/formal as appropriate)

If unsure about technical details, recommend contacting platform support.`
  }

  /**
   * Send a chat message to external AI API
   * Uses advanced AI model through external infrastructure
   */
  async sendMessage(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<ChatResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'External AI API service not initialized. Please check your API key configuration.'
      }
    }

    try {
      console.log('🤖 Sending message to external AI API...')

      // Prepare messages array with system prompt
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        ...conversationHistory.slice(-8), // Keep last 8 messages for context
        {
          role: 'user',
          content: userMessage
        }
      ]

      // Prepare request payload according to API documentation
      const requestPayload = {
        model: this.config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: this.config.topP,
        stream: false,
        stop: null,
        presence_penalty: 0,
        frequency_penalty: 0
      }

      console.log('📤 Request payload prepared for external AI API')
      console.log(`🎯 Using model: ${this.config.model}`)

      // Make API request to external AI API
      console.log(`🌐 Making request to: ${this.config.baseUrl}/v1/chat/completions`)

      const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'LayerEdge-EdgenHelper/2.0'
        },
        body: JSON.stringify(requestPayload)
      })

      if (!response.ok) {
        let errorText = ''
        try {
          const errorData = await response.json()
          errorText = errorData.error?.message || errorData.message || JSON.stringify(errorData)
        } catch {
          errorText = await response.text()
        }

        console.error('❌ External AI API error:', response.status, errorText)

        // Handle specific error cases
        if (response.status === 401) {
          return {
            success: false,
            error: 'Authentication failed. Please check your API key.'
          }
        } else if (response.status === 429) {
          return {
            success: false,
            error: 'Rate limit exceeded. Please try again in a moment.'
          }
        } else if (response.status === 400) {
          return {
            success: false,
            error: 'Invalid request format. Please check the message content.'
          }
        }

        return {
          success: false,
          error: `External AI API error: ${response.status} - ${errorText}`
        }
      }

      const data = await response.json()
      console.log('✅ Received response from external AI API')

      // Extract the assistant's message according to OpenAI-compatible format
      const choice = data.choices?.[0]
      const assistantMessage = choice?.message?.content

      if (!assistantMessage) {
        console.error('❌ No content in API response:', data)
        return {
          success: false,
          error: 'No response content received from external AI API'
        }
      }

      return {
        success: true,
        message: assistantMessage,
        model: data.model || this.config.model,
        finishReason: choice?.finish_reason,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0
        } : undefined
      }

    } catch (error) {
      console.error('❌ External AI API service error:', error)

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error: Unable to connect to external AI API'
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }



  /**
   * Get a comprehensive fallback response
   */
  getFallbackResponse(userMessage: string): ChatResponse {
    const message = userMessage.toLowerCase()

    // Provide comprehensive responses for common questions
    if (message.includes('points') || message.includes('earn')) {
      return {
        success: true,
        message: "🎯 **How to Earn Points on LayerEdge:**\n\n1. **Submit Tweets**: Go to `/submit` page and paste your tweet URL\n2. **Required Mentions**: Your tweet must contain `@layeredge` OR `\\$EDGEN`\n3. **Engagement Matters**: Points = base score + (likes + retweets + replies)\n4. **Community Verification**: Only verified community members earn points\n\n💡 **Pro Tip**: Higher engagement = more points! Focus on creating quality content that resonates with the LayerEdge community.\n\n*Note: I'm currently in enhanced offline mode with comprehensive responses.*"
      }
    }

    if (message.includes('submit') || message.includes('tweet')) {
      return {
        success: true,
        message: "📝 **Tweet Submission Guide:**\n\n**Step 1**: Create a tweet containing `@layeredge` or `\\$EDGEN`\n**Step 2**: Copy the direct tweet URL (format: https://x.com/username/status/1234567890)\n**Step 3**: Visit `/submit` page on LayerEdge platform\n**Step 4**: Paste your tweet URL and click submit\n**Step 5**: Wait for verification and point calculation\n\n⚠️ **Common Issues**:\n- Use direct tweet URLs, not profile or search URLs\n- Ensure tweet is public and accessible\n- Verify you included required mentions\n\n*Enhanced offline assistance active.*"
      }
    }

    if (message.includes('hashtag') || message.includes('@layeredge') || message.includes('$edgen')) {
      return {
        success: true,
        message: "🏷️ **LayerEdge Hashtag Strategy:**\n\n**@layeredge**: Official account mention\n- Use when referencing the platform\n- Great for community engagement\n- Increases visibility\n\n**\\$EDGEN**: Token reference\n- Use when discussing the token\n- Shows community involvement\n- Attracts token holders\n\n**Best Practices**:\n- You only need ONE of these mentions (not both)\n- Case-insensitive matching\n- Natural integration works best\n- Combine with relevant content\n\n*Comprehensive offline guidance available.*"
      }
    }

    if (message.includes('troubleshoot') || message.includes('problem') || message.includes('issue')) {
      return {
        success: true,
        message: "🔧 **LayerEdge Troubleshooting:**\n\n**Tweet Submission Issues**:\n- ❌ Invalid URL → Use direct tweet links\n- ❌ Tweet not found → Check if tweet is public\n- ❌ No points awarded → Verify @layeredge or \\$EDGEN mention\n- ❌ Login problems → Reconnect your X/Twitter account\n\n**Common Solutions**:\n1. Refresh the page and try again\n2. Check your internet connection\n3. Verify tweet URL format\n4. Ensure tweet contains required mentions\n5. Contact support if issues persist\n\n*Advanced troubleshooting in offline mode.*"
      }
    }

    if (message.includes('hello') || message.includes('hi') || message.includes('help')) {
      return {
        success: true,
        message: "👋 **Welcome to Edgen Helper!**\n\nI'm your LayerEdge community assistant, currently running in **Enhanced Offline Mode** with comprehensive responses.\n\n🎯 **I can help you with**:\n• Tweet submission and optimization\n• Points system and earning strategies\n• @layeredge and \\$EDGEN hashtag usage\n• Platform navigation and features\n• Troubleshooting common issues\n\n💬 **Try asking me**:\n- \"How do I earn points?\"\n- \"How to submit a tweet?\"\n- \"What hashtags should I use?\"\n- \"I'm having issues with...\"\n\n*Enhanced AI responses available even offline!*"
      }
    }

    return {
      success: true,
      message: "🤖 **Edgen Helper - Local AI Assistant**\n\nI'm your LayerEdge community assistant with comprehensive local AI capabilities!\n\n🎯 **Quick Help**:\n• **Earn Points**: Submit tweets with @layeredge or $EDGEN\n• **Submit Tweets**: Visit `/submit` page\n• **Check Points**: View your dashboard\n• **Get Help**: Ask me specific questions\n\n💡 **Popular Topics**: Points system, tweet submission, hashtag strategy, troubleshooting\n\n*Ask me anything about LayerEdge - I have intelligent responses ready!*",
      isOffline: true
    }
  }



  /**
   * Test the external AI API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isInitialized) {
      console.log('❌ External AI API not initialized')
      return false
    }

    try {
      console.log('🔍 Testing external AI API connection...')
      const testResponse = await this.sendMessage('Hello, this is a connection test.')

      if (testResponse.success) {
        console.log('✅ External AI API connection successful')
        console.log(`🤖 Model confirmed: ${testResponse.model || this.config.model}`)
        return true
      } else {
        console.log('❌ External AI API connection failed:', testResponse.error)
        return false
      }
    } catch (error) {
      console.error('❌ External AI API connection test failed:', error)
      return false
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean
    apiKey: string
    baseUrl: string
    model: string
    ready: boolean
    maxTokens: number
    temperature: number
    topP: number
  } {
    return {
      initialized: this.isInitialized,
      apiKey: this.config.apiKey ? `${this.config.apiKey.substring(0, 15)}...` : 'Not set',
      baseUrl: this.config.baseUrl,
      model: this.config.model,
      ready: this.isInitialized,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      topP: this.config.topP
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null

/**
 * Get AI service instance
 */
export function getIoNetApiService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService()
  }
  return aiServiceInstance
}

/**
 * Initialize AI service with custom config
 */
export function initializeIoNetApiService(config: Partial<AIConfig>): AIService {
  aiServiceInstance = new AIService(config)
  return aiServiceInstance
}
