import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { getEnhancedContentValidator } from '@/lib/enhanced-content-validator'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(request)

    if (!authResult.isAuthenticated || !authResult.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          userMessage: 'Please check your request format and try again.'
        },
        { status: 400 }
      )
    }

    const { content, options = {} } = requestBody

    if (!content) {
      return NextResponse.json(
        {
          error: 'Content is required',
          userMessage: 'Please provide content to validate.'
        },
        { status: 400 }
      )
    }

    if (typeof content !== 'string') {
      return NextResponse.json(
        {
          error: 'Content must be a string',
          userMessage: 'Please provide valid text content.'
        },
        { status: 400 }
      )
    }

    // Validate content length
    if (content.length > 2000) {
      return NextResponse.json(
        {
          error: 'Content too long',
          userMessage: 'Content must be less than 2000 characters.',
          suggestions: ['Please shorten your content', 'Focus on the key message']
        },
        { status: 400 }
      )
    }

    // Get content validator
    const validator = getEnhancedContentValidator()

    // Perform validation
    const startTime = Date.now()
    const validationResult = await validator.validateContent(content, {
      enableFUDDetection: options.enableFUDDetection !== false,
      strictMode: options.strictMode === true,
      requireLayerEdgeKeywords: options.requireLayerEdgeKeywords !== false,
      allowWarnings: options.allowWarnings !== false
    })
    const validationTime = Date.now() - startTime

    // Log validation for monitoring
    console.log(`Content validation completed in ${validationTime}ms`, {
      userId: authResult.userId,
      contentLength: content.length,
      isValid: validationResult.isValid,
      allowSubmission: validationResult.allowSubmission,
      fudScore: validationResult.fudAnalysis.score,
      detectedCategories: validationResult.fudAnalysis.detectedCategories
    })

    // Return validation result
    return NextResponse.json({
      success: true,
      validation: {
        isValid: validationResult.isValid,
        allowSubmission: validationResult.allowSubmission,
        requiresReview: validationResult.requiresReview,
        hasRequiredKeywords: validationResult.hasRequiredKeywords,
        message: validationResult.message,
        suggestions: validationResult.suggestions
      },
      fudAnalysis: {
        isBlocked: validationResult.fudAnalysis.isBlocked,
        isWarning: validationResult.fudAnalysis.isWarning,
        score: validationResult.fudAnalysis.score,
        detectedCategories: validationResult.fudAnalysis.detectedCategories,
        flaggedTerms: validationResult.fudAnalysis.flaggedTerms,
        message: validationResult.fudAnalysis.message,
        allowResubmit: validationResult.fudAnalysis.allowResubmit
      },
      performance: {
        validationTime,
        contentLength: content.length
      }
    })

  } catch (error) {
    console.error('Content validation API error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        userMessage: 'An unexpected error occurred during content validation. Please try again.',
        suggestions: ['Check your content and try again', 'Contact support if the issue persists']
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(request)

    if (!authResult.isAuthenticated || !authResult.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get content validator
    const validator = getEnhancedContentValidator()
    
    // Return validation configuration and statistics
    return NextResponse.json({
      success: true,
      config: {
        fudDetectionEnabled: process.env.FUD_DETECTION_ENABLED !== 'false',
        strictMode: process.env.FUD_STRICT_MODE === 'true',
        blockThreshold: parseInt(process.env.FUD_BLOCK_THRESHOLD || '15'),
        warnThreshold: parseInt(process.env.FUD_WARN_THRESHOLD || '8'),
        whitelistEnabled: process.env.FUD_WHITELIST_ENABLED !== 'false'
      },
      stats: validator.getValidationStats(),
      guidelines: {
        requiredKeywords: ['@layeredge', '$EDGEN'],
        maxLength: 2000,
        minLength: 10,
        encouragedTopics: [
          'Decentralized AI',
          'LayerEdge technology',
          'Community building',
          'Innovation',
          'Future of AI'
        ],
        discouragedContent: [
          'Scam-related terms',
          'Negative sentiment',
          'Profanity',
          'Misinformation',
          'Spam content'
        ]
      }
    })

  } catch (error) {
    console.error('Content validation config API error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        userMessage: 'Unable to fetch validation configuration.'
      },
      { status: 500 }
    )
  }
}
