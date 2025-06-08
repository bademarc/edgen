/**
 * io.net Intelligence API Service for Edgen Helper AI Chatbot
 * Integrates with io.net Intelligence API using DeepSeek-R1-0528 model
 * Reference: https://docs.io.net/reference/get-started-with-io-intelligence-api
 * Model: deepseek-ai/DeepSeek-R1-0528
 */

export interface IoNetConfig {
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
}

export class IoNetApiService {
  private config: IoNetConfig
  private isInitialized: boolean = false

  constructor(config?: Partial<IoNetConfig>) {
    this.config = {
      apiKey: process.env.IO_NET_API_KEY || '',
      baseUrl: process.env.IO_NET_BASE_URL || 'https://api.io.net',
      model: process.env.IO_NET_MODEL || 'deepseek-ai/DeepSeek-R1-0528',
      maxTokens: parseInt(process.env.EDGEN_HELPER_MAX_TOKENS || '1000'),
      temperature: parseFloat(process.env.EDGEN_HELPER_TEMPERATURE || '0.7'),
      topP: parseFloat(process.env.EDGEN_HELPER_TOP_P || '0.9'),
      ...config
    }

    if (!this.config.apiKey) {
      console.warn('⚠️ io.net Intelligence API key not configured')
      this.isInitialized = false
    } else {
      this.isInitialized = true
      console.log('✅ io.net Intelligence API service initialized with DeepSeek-R1-0528')
      console.log(`📡 Base URL: ${this.config.baseUrl}`)
      console.log(`🤖 Model: ${this.config.model}`)
    }
  }

  /**
   * Get the system prompt for Edgen Helper (optimized for DeepSeek-R1)
   */
  private getSystemPrompt(): string {
    return `You are "Edgen Helper", an intelligent AI assistant powered by DeepSeek-R1 for the LayerEdge community platform.

CORE MISSION: Help LayerEdge community members maximize their engagement and earn points through strategic tweet submission.

PLATFORM OVERVIEW:
LayerEdge is a community-driven platform for $EDGEN token holders where users earn points by submitting high-engagement tweets containing specific mentions.

KEY FEATURES YOU SUPPORT:

1. POINTS SYSTEM GUIDANCE:
   - Submit tweets with @layeredge OR $EDGEN mentions
   - Points = base score + engagement multiplier (likes + retweets + replies)
   - Only verified community members earn points
   - Automatic point calculation after tweet verification

2. TWEET SUBMISSION PROCESS:
   - Navigate to /submit page
   - Paste direct tweet URL: https://x.com/username/status/[ID]
   - System validates @layeredge or $EDGEN presence
   - Real-time engagement tracking begins

3. HASHTAG STRATEGY:
   - @layeredge: Official account mention (high visibility)
   - $EDGEN: Token reference (community signal)
   - Case-insensitive detection
   - Either mention qualifies for points

4. COMMON ISSUES & SOLUTIONS:
   - "Invalid URL": Use direct tweet links, not search/profile URLs
   - "Tweet not found": Ensure tweet is public and accessible
   - "No points": Verify required mentions are present
   - "Login problems": Check X/Twitter account connection

5. COMMUNITY BEST PRACTICES:
   - Share authentic LayerEdge-related content
   - Engage genuinely with community posts
   - Maintain respectful discourse
   - Follow platform and X/Twitter guidelines

RESPONSE STYLE:
- Be concise but comprehensive
- Use friendly, professional tone
- Include specific action steps
- Reference Bitcoin orange (#f7931a) branding when relevant
- Direct to /submit, dashboard, or documentation when appropriate

If unsure about specific technical details, recommend contacting platform support or checking documentation.`
  }

  /**
   * Send a chat message to io.net Intelligence API
   * Uses DeepSeek-R1-0528 model through io.net's infrastructure
   */
  async sendMessage(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<ChatResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'io.net Intelligence API service not initialized. Please check your API key configuration.'
      }
    }

    try {
      console.log('🤖 Sending message to io.net Intelligence API with DeepSeek-R1-0528...')

      // Prepare messages array with system prompt
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        ...conversationHistory.slice(-8), // Keep last 8 messages for context (DeepSeek-R1 optimization)
        {
          role: 'user',
          content: userMessage
        }
      ]

      // Prepare request payload according to io.net Intelligence API documentation
      const requestPayload = {
        model: this.config.model, // deepseek-ai/DeepSeek-R1-0528
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: this.config.topP,
        stream: false,
        // DeepSeek-R1 specific parameters
        stop: null,
        presence_penalty: 0,
        frequency_penalty: 0
      }

      console.log('📤 Request payload prepared for io.net Intelligence API')
      console.log(`🎯 Using model: ${this.config.model}`)

      // Make API request to io.net Intelligence API
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

        console.error('❌ io.net Intelligence API error:', response.status, errorText)

        // Handle specific error cases
        if (response.status === 401) {
          return {
            success: false,
            error: 'Authentication failed. Please check your io.net API key.'
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
          error: `io.net Intelligence API error: ${response.status} - ${errorText}`
        }
      }

      const data = await response.json()
      console.log('✅ Received response from io.net Intelligence API')

      // Extract the assistant's message according to OpenAI-compatible format
      const choice = data.choices?.[0]
      const assistantMessage = choice?.message?.content

      if (!assistantMessage) {
        console.error('❌ No content in API response:', data)
        return {
          success: false,
          error: 'No response content received from io.net Intelligence API'
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
      console.error('❌ io.net Intelligence API service error:', error)

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error: Unable to connect to io.net Intelligence API'
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get a fallback response when API is unavailable
   */
  getFallbackResponse(userMessage: string): ChatResponse {
    const message = userMessage.toLowerCase()
    
    // Provide basic responses for common questions
    if (message.includes('points') || message.includes('earn')) {
      return {
        success: true,
        message: "To earn points on LayerEdge: 1) Submit tweets containing @layeredge or $EDGEN, 2) Go to /submit page, 3) Paste your tweet URL, 4) Points are awarded based on engagement. The io.net AI service is currently unavailable, but you can find more help in our documentation."
      }
    }
    
    if (message.includes('submit') || message.includes('tweet')) {
      return {
        success: true,
        message: "To submit tweets: 1) Go to /submit page, 2) Use direct tweet URLs like https://x.com/username/status/1234567890, 3) Ensure your tweet contains @layeredge or $EDGEN mentions. The AI assistant is temporarily unavailable."
      }
    }
    
    if (message.includes('help') || message.includes('how')) {
      return {
        success: true,
        message: "LayerEdge is a community platform for $EDGEN token holders. Submit tweets with @layeredge or $EDGEN mentions to earn points based on engagement. Visit /submit to get started. The AI assistant is currently offline."
      }
    }
    
    return {
      success: true,
      message: "Hello! I'm Edgen Helper, your LayerEdge community assistant. I'm currently running in offline mode. For help with tweet submission, visit /submit. For points information, check your dashboard. The full AI service will be back online soon!"
    }
  }

  /**
   * Test the io.net Intelligence API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isInitialized) {
      console.log('❌ io.net Intelligence API not initialized')
      return false
    }

    try {
      console.log('🔍 Testing io.net Intelligence API connection...')
      const testResponse = await this.sendMessage('Hello, this is a connection test for DeepSeek-R1.')

      if (testResponse.success) {
        console.log('✅ io.net Intelligence API connection successful')
        console.log(`🤖 Model confirmed: ${testResponse.model || this.config.model}`)
        return true
      } else {
        console.log('❌ io.net Intelligence API connection failed:', testResponse.error)
        return false
      }
    } catch (error) {
      console.error('❌ io.net Intelligence API connection test failed:', error)
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
}

// Singleton instance
let ionetApiServiceInstance: IoNetApiService | null = null

/**
 * Get io.net API service instance
 */
export function getIoNetApiService(): IoNetApiService {
  if (!ionetApiServiceInstance) {
    ionetApiServiceInstance = new IoNetApiService()
  }
  return ionetApiServiceInstance
}

/**
 * Initialize io.net API service with custom config
 */
export function initializeIoNetApiService(config: Partial<IoNetConfig>): IoNetApiService {
  ionetApiServiceInstance = new IoNetApiService(config)
  return ionetApiServiceInstance
}
