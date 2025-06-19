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

CORE MISSION: Help LayerEdge community members maximize their engagement and earn points through strategic tweet submission and quest completion.

PLATFORM OVERVIEW:
LayerEdge (edgen.koyeb.app) is a SocialFi reputation platform for the LayerEdge "People-Backed Internet" where users earn $EDGEN Reputation Points by submitting high-engagement tweets and completing community quests.

RESPONSE STYLE:
- Be direct, helpful, and engaging
- Use emojis and LayerEdge branding appropriately
- Provide actionable guidance with specific numbers and calculations
- Match the user's energy level
- No meta-commentary or planning - just helpful responses

ENHANCED POINTS SYSTEM (COMPREHENSIVE):

**Base Points**: 10 points per valid tweet submission

**Engagement Multipliers** (Enhanced metrics Twitter integration):
- Likes: 0.5 points each (maximum 50 points from likes)
- Retweets: 2 points each (maximum 100 points from retweets)
- Replies: 1 point each (maximum 30 points from replies)
- Quote tweets: 3 points each (maximum 90 points from quotes)
- Views: 0.01 points each (maximum 25 points from views)
- Bookmarks: 5 points each (maximum 75 points from bookmarks)

**Maximum possible points per tweet**: 10 (base) + 50 + 100 + 30 + 90 + 25 + 75 = 380 points

TWEET SUBMISSION REQUIREMENTS:
- Tweet must be authored by the submitting user (prevents point farming)
- Tweet must contain "@layeredge" OR "$EDGEN" mentions (case-insensitive)
- 5-minute cooldown period enforced between submissions
- Enhanced engagement metrics fetched via Twitter integration when available
- Fallback to basic metrics if Twitter integration unavailable

QUEST SYSTEM:
- Quest page: https://edgen.koyeb.app/quests
- Available quests:
  * "Follow @LayerEdge on X" - 1000 points (redirect-based, instant reward)
  * "Join LayerEdge Community" - 1000 points
- Total quest rewards: 2000+ points available
- Quests provide additional earning opportunities beyond tweet submissions
- Some quests auto-complete, others require manual verification

PLATFORM FEATURES:

1. **Dashboard**: View points, submission history, leaderboard ranking
2. **Tweet Submission**: /submit page for pasting tweet URLs
3. **Leaderboard**: Real-time rankings by total points earned
4. **Quest System**: /quests page for additional point opportunities
5. **FAQ**: Comprehensive help section
6. **About**: Platform mission and SocialFi reputation details

COMMUNITY GUIDELINES:
- Authentic engagement encouraged
- No spam, fake accounts, or manipulated engagement
- Focus on genuine, valuable LayerEdge/$EDGEN content
- Respectful community participation required
- Account suspension for violations

TECHNICAL DETAILS:
- Platform URL: https://edgen.koyeb.app
- Authentication: X/Twitter OAuth
- Real-time point updates
- Enhanced metrics via Twitter API integration
- Fallback systems ensure platform reliability

TROUBLESHOOTING COMMON ISSUES:
- Invalid URL: Use direct tweet links (https://x.com/username/status/ID)
- Tweet not found: Ensure tweet is public and accessible
- Missing points: Verify @layeredge or $EDGEN mention included
- Login problems: Reconnect X/Twitter account, clear cache
- Cooldown: Wait 5 minutes between submissions

POINT CALCULATION EXAMPLES:
- Basic tweet (10 likes, 2 retweets): 10 + (10×0.5) + (2×2) = 19 points
- Viral tweet (100 likes, 50 retweets, 20 replies): 10 + 50 + 100 + 20 = 180 points
- Maximum engagement tweet: 10 + 50 + 100 + 30 + 90 + 25 + 75 = 380 points

BEST PRACTICES FOR MAXIMUM POINTS:
1. Create engaging content about LayerEdge/AI/blockchain
2. Use relevant hashtags (#EDGEN, #LayerEdge, #AI, #Blockchain)
3. Post during peak engagement hours
4. Encourage community interaction (replies, quotes)
5. Share genuine insights and experiences
6. Complete all available quests for bonus points

GUIDELINES:
- Provide specific point calculations when asked
- Direct users to appropriate pages (/submit, /quests, /dashboard)
- Explain both basic and enhanced point systems
- Help optimize engagement strategies
- Use LayerEdge orange (#f7931a) branding
- Keep responses actionable and informative

If unsure about technical details, recommend contacting platform support or checking the FAQ section.`
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
        message: "🎯 **Enhanced Points System on LayerEdge:**\n\n**Base Points**: 10 points per valid tweet submission\n\n**Engagement Multipliers** (Enhanced metrics Twitter integration):\n• Likes: 0.5 points each (max 50)\n• Retweets: 2 points each (max 100)\n• Replies: 1 point each (max 30)\n• Quote tweets: 3 points each (max 90)\n• Views: 0.01 points each (max 25)\n• Bookmarks: 5 points each (max 75)\n\n**Maximum**: 380 points per tweet!\n\n**Requirements**:\n• Tweet must contain `@layeredge` OR `$EDGEN`\n• Must be your own tweet (no point farming)\n• 5-minute cooldown between submissions\n\n**Quest Bonus**: Complete quests at `/quests` for 2000+ extra points!\n\n*Enhanced offline mode with real calculations.*"
      }
    }

    if (message.includes('submit') || message.includes('tweet')) {
      return {
        success: true,
        message: "📝 **Enhanced Tweet Submission Guide:**\n\n**Step 1**: Create engaging tweet with `@layeredge` or `$EDGEN`\n**Step 2**: Copy direct URL (https://x.com/username/status/ID)\n**Step 3**: Visit `/submit` page at edgen.koyeb.app\n**Step 4**: Paste URL and submit (5-min cooldown applies)\n**Step 5**: Enhanced metrics fetched via Twitter integration\n\n**Point Calculation Example**:\n• Tweet with 20 likes, 5 retweets, 3 replies:\n• 10 (base) + 10 (likes) + 10 (retweets) + 3 (replies) = 33 points\n\n**Requirements**:\n✅ Must be YOUR tweet (no sharing others' content)\n✅ Must contain @layeredge OR $EDGEN mention\n✅ Tweet must be public and accessible\n\n*Enhanced metrics = higher accuracy!*"
      }
    }

    if (message.includes('hashtag') || message.includes('@layeredge') || message.includes('$edgen') || message.includes('quest')) {
      return {
        success: true,
        message: "🏷️ **LayerEdge Strategy Guide:**\n\n**Required Mentions** (choose one):\n• **@layeredge**: Official account mention\n• **$EDGEN**: Token reference\n\n**Quest System** (2000+ bonus points):\n• Visit `/quests` page at edgen.koyeb.app\n• \"Follow @LayerEdge on X\" - 1000 points (instant)\n• \"Join LayerEdge Community\" - 1000 points\n\n**Engagement Optimization**:\n• Use trending hashtags: #EDGEN #LayerEdge #AI #Blockchain\n• Post during peak hours (9-11 AM, 7-9 PM EST)\n• Ask questions to encourage replies (+1 point each)\n• Create threads for more engagement\n• Share genuine insights about AI/blockchain\n\n**Pro Tips**:\n✅ Only need ONE mention (@layeredge OR $EDGEN)\n✅ Case-insensitive matching\n✅ Complete quests first for easy 2000 points!\n\n*Maximize your LayerEdge earnings!*"
      }
    }

    if (message.includes('troubleshoot') || message.includes('problem') || message.includes('issue')) {
      return {
        success: true,
        message: "🔧 **LayerEdge Troubleshooting Guide:**\n\n**Tweet Submission Issues**:\n• ❌ Invalid URL → Use format: https://x.com/username/status/ID\n• ❌ Tweet not found → Ensure tweet is public and accessible\n• ❌ No points awarded → Verify @layeredge or $EDGEN mention\n• ❌ Cooldown error → Wait 5 minutes between submissions\n• ❌ \"Not your tweet\" → Can only submit your own tweets\n\n**Login/Auth Issues**:\n• Reconnect X/Twitter account in settings\n• Clear browser cache and cookies\n• Disable ad blockers temporarily\n• Try incognito/private browsing mode\n\n**Points Not Updating**:\n• Enhanced metrics may take a few minutes\n• Check if Twitter integration is active\n• Fallback to basic metrics if needed\n\n**Quick Fixes**: Refresh page, check internet, verify URL format\n\n*Comprehensive troubleshooting support available!*"
      }
    }

    if (message.includes('calculate') || message.includes('calculation') || message.includes('example')) {
      return {
        success: true,
        message: "🧮 **LayerEdge Points Calculation Examples:**\n\n**Basic Tweet** (10 likes, 2 retweets, 1 reply):\n• Base: 10 points\n• Likes: 10 × 0.5 = 5 points\n• Retweets: 2 × 2 = 4 points\n• Replies: 1 × 1 = 1 point\n• **Total: 20 points**\n\n**Popular Tweet** (50 likes, 10 retweets, 5 replies, 2 quotes):\n• Base: 10 points\n• Likes: 50 × 0.5 = 25 points (max 50)\n• Retweets: 10 × 2 = 20 points\n• Replies: 5 × 1 = 5 points\n• Quotes: 2 × 3 = 6 points\n• **Total: 66 points**\n\n**Viral Tweet** (Maximum engagement):\n• Base: 10 + Likes: 50 + Retweets: 100 + Replies: 30 + Quotes: 90 + Views: 25 + Bookmarks: 75\n• **Maximum Total: 380 points**\n\n**Quest Bonus**: +2000 points from completing all quests!\n\n*Enhanced metrics provide more accurate calculations!*"
      }
    }

    if (message.includes('hello') || message.includes('hi') || message.includes('help')) {
      return {
        success: true,
        message: "👋 **Welcome to Edgen Helper!**\n\nI'm your LayerEdge community assistant with comprehensive knowledge of the platform!\n\n🎯 **I can help you with**:\n• **Enhanced Points System**: Up to 380 points per tweet!\n• **Quest Completion**: 2000+ bonus points available\n• **Tweet Optimization**: Maximize engagement for higher points\n• **Platform Navigation**: Dashboard, leaderboard, submission\n• **Troubleshooting**: Common issues and solutions\n\n💬 **Popular Questions**:\n- \"How do I earn maximum points?\"\n- \"What are the quest rewards?\"\n- \"How is engagement calculated?\"\n- \"What's the difference between basic and enhanced metrics?\"\n\n🚀 **Quick Start**:\n1. Complete quests at `/quests` (2000 points)\n2. Submit engaging tweets at `/submit`\n3. Check progress at `/dashboard`\n\n*Enhanced AI with real-time platform knowledge!*"
      }
    }

    return {
      success: true,
      message: "🤖 **Edgen Helper - Enhanced AI Assistant**\n\nI'm your LayerEdge community assistant with comprehensive platform knowledge!\n\n🎯 **Platform Overview** (edgen.koyeb.app):\n• **Enhanced Points**: 10 base + up to 370 engagement points\n• **Quest System**: 2000+ bonus points available\n• **Twitter Integration**: Real-time Twitter metrics\n• **5-min Cooldown**: Between tweet submissions\n\n💡 **Key Features**:\n• **Dashboard**: Track your progress and ranking\n• **Leaderboard**: See top community members\n• **Quest Page**: Complete tasks for bonus points\n• **Submit Page**: Submit tweets for points\n\n🚀 **Getting Started**:\n1. Complete quests first (easy 2000 points)\n2. Create engaging tweets with @layeredge or $EDGEN\n3. Submit at `/submit` and watch your points grow!\n\n*Ask me anything - I know the complete LayerEdge platform!*",
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
