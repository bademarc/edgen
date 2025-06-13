/**
 * Enhanced Content Validator with FUD Detection Integration
 * 
 * This service extends the existing content validation with FUD detection
 * while maintaining compatibility with the current tweet submission system.
 */

import { getFUDDetectionService, FUDAnalysisResult } from './fud-detection-service'

export interface ContentValidationResult {
  isValid: boolean
  hasRequiredKeywords: boolean
  fudAnalysis: FUDAnalysisResult
  message: string
  suggestions: string[]
  allowSubmission: boolean
  requiresReview: boolean
}

export interface ValidationOptions {
  enableFUDDetection?: boolean
  strictMode?: boolean
  requireLayerEdgeKeywords?: boolean
  allowWarnings?: boolean
}

export class EnhancedContentValidator {
  private fudService: ReturnType<typeof getFUDDetectionService>
  
  // Required keywords for LayerEdge community
  private readonly REQUIRED_KEYWORDS = [
    '@layeredge',
    '$edgen',
    'layeredge',
    'edgen'
  ]

  // Positive keywords that boost content score
  private readonly POSITIVE_KEYWORDS = [
    'excited', 'amazing', 'innovative', 'revolutionary', 'building',
    'future', 'decentralized', 'ai', 'technology', 'community',
    'bullish', 'optimistic', 'love', 'great', 'awesome', 'fantastic'
  ]

  constructor() {
    this.fudService = getFUDDetectionService()
  }

  /**
   * Comprehensive content validation with FUD detection
   */
  async validateContent(
    content: string, 
    options: ValidationOptions = {}
  ): Promise<ContentValidationResult> {
    const {
      enableFUDDetection = true,
      strictMode = false,
      requireLayerEdgeKeywords = true,
      allowWarnings = true
    } = options

    // Basic content validation
    if (!content || typeof content !== 'string') {
      return {
        isValid: false,
        hasRequiredKeywords: false,
        fudAnalysis: await this.createEmptyFUDAnalysis(),
        message: 'Content is required and must be valid text',
        suggestions: ['Please provide valid tweet content'],
        allowSubmission: false,
        requiresReview: false
      }
    }

    const trimmedContent = content.trim()
    if (trimmedContent.length === 0) {
      return {
        isValid: false,
        hasRequiredKeywords: false,
        fudAnalysis: await this.createEmptyFUDAnalysis(),
        message: 'Content cannot be empty',
        suggestions: ['Please provide meaningful tweet content'],
        allowSubmission: false,
        requiresReview: false
      }
    }

    // Check for required LayerEdge keywords
    const hasRequiredKeywords = requireLayerEdgeKeywords 
      ? this.hasRequiredKeywords(trimmedContent)
      : true

    // Perform FUD detection
    let fudAnalysis: FUDAnalysisResult
    if (enableFUDDetection) {
      fudAnalysis = await this.fudService.detectFUD(trimmedContent)
    } else {
      fudAnalysis = await this.createEmptyFUDAnalysis()
    }

    // Determine overall validation result
    const validationResult = this.determineValidationResult(
      hasRequiredKeywords,
      fudAnalysis,
      allowWarnings,
      strictMode
    )

    return {
      isValid: validationResult.isValid,
      hasRequiredKeywords,
      fudAnalysis,
      message: validationResult.message,
      suggestions: validationResult.suggestions,
      allowSubmission: validationResult.allowSubmission,
      requiresReview: validationResult.requiresReview
    }
  }

  /**
   * Quick validation for existing validateTweetContent compatibility
   */
  async validateTweetContentEnhanced(content: string): Promise<boolean> {
    const result = await this.validateContent(content, {
      enableFUDDetection: true,
      requireLayerEdgeKeywords: true,
      allowWarnings: true
    })
    
    return result.allowSubmission
  }

  /**
   * Check if content contains required LayerEdge keywords
   */
  private hasRequiredKeywords(content: string): boolean {
    const lowerContent = content.toLowerCase()
    return this.REQUIRED_KEYWORDS.some(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    )
  }

  /**
   * Check if content has positive sentiment
   */
  private hasPositiveSentiment(content: string): boolean {
    const lowerContent = content.toLowerCase()
    return this.POSITIVE_KEYWORDS.some(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    )
  }

  /**
   * Determine the overall validation result
   */
  private determineValidationResult(
    hasRequiredKeywords: boolean,
    fudAnalysis: FUDAnalysisResult,
    allowWarnings: boolean,
    strictMode: boolean
  ): {
    isValid: boolean
    allowSubmission: boolean
    requiresReview: boolean
    message: string
    suggestions: string[]
  } {
    const suggestions: string[] = []

    // Check for blocking conditions
    if (fudAnalysis.isBlocked) {
      return {
        isValid: false,
        allowSubmission: false,
        requiresReview: false,
        message: fudAnalysis.message,
        suggestions: fudAnalysis.suggestions
      }
    }

    // Check required keywords
    if (!hasRequiredKeywords) {
      suggestions.push('Include @layeredge or $EDGEN in your tweet')
      suggestions.push('Make sure your tweet is related to LayerEdge')
      
      return {
        isValid: false,
        allowSubmission: false,
        requiresReview: false,
        message: 'Tweet must mention @layeredge or $EDGEN to be eligible for points',
        suggestions
      }
    }

    // Handle warnings
    if (fudAnalysis.isWarning) {
      if (allowWarnings && !strictMode) {
        suggestions.push(...fudAnalysis.suggestions)
        suggestions.push('You can still submit, but consider revising for better engagement')
        
        return {
          isValid: true,
          allowSubmission: true,
          requiresReview: true,
          message: fudAnalysis.message,
          suggestions
        }
      } else {
        return {
          isValid: false,
          allowSubmission: false,
          requiresReview: false,
          message: 'Content needs revision before submission',
          suggestions: fudAnalysis.suggestions
        }
      }
    }

    // Content is valid
    return {
      isValid: true,
      allowSubmission: true,
      requiresReview: false,
      message: 'Content approved for submission',
      suggestions: []
    }
  }

  /**
   * Create empty FUD analysis for when FUD detection is disabled
   */
  private async createEmptyFUDAnalysis(): Promise<FUDAnalysisResult> {
    return {
      isBlocked: false,
      isWarning: false,
      score: 0,
      detectedCategories: [],
      flaggedTerms: [],
      suggestions: [],
      message: 'FUD detection disabled',
      allowResubmit: true
    }
  }

  /**
   * Generate content improvement suggestions
   */
  generateContentSuggestions(content: string): string[] {
    const suggestions: string[] = []
    const lowerContent = content.toLowerCase()

    // Check for required keywords
    if (!this.hasRequiredKeywords(content)) {
      suggestions.push('Add @layeredge or $EDGEN to your tweet')
    }

    // Check for positive sentiment
    if (!this.hasPositiveSentiment(content)) {
      suggestions.push('Consider adding positive language about LayerEdge')
      suggestions.push('Share what excites you about decentralized AI')
    }

    // Length suggestions
    if (content.length < 50) {
      suggestions.push('Consider adding more detail to your tweet')
    } else if (content.length > 250) {
      suggestions.push('Consider making your tweet more concise')
    }

    // Engagement suggestions
    if (!lowerContent.includes('?') && !lowerContent.includes('!')) {
      suggestions.push('Add enthusiasm with exclamation marks or ask questions')
    }

    // Community engagement
    if (!lowerContent.includes('community') && !lowerContent.includes('building')) {
      suggestions.push('Mention how LayerEdge is building the future of AI')
    }

    return suggestions
  }

  /**
   * Get validation statistics for monitoring
   */
  getValidationStats(): {
    fudDetectionEnabled: boolean
    totalValidations: number
    blockedContent: number
    warningContent: number
    approvedContent: number
  } {
    // This would be implemented with actual statistics tracking
    return {
      fudDetectionEnabled: this.fudService.getConfig().enabled,
      totalValidations: 0,
      blockedContent: 0,
      warningContent: 0,
      approvedContent: 0
    }
  }

  /**
   * Update FUD detection configuration
   */
  updateFUDConfig(config: Parameters<typeof this.fudService.updateConfig>[0]): void {
    this.fudService.updateConfig(config)
  }
}

// Export singleton instance
let validatorInstance: EnhancedContentValidator | null = null

export function getEnhancedContentValidator(): EnhancedContentValidator {
  if (!validatorInstance) {
    validatorInstance = new EnhancedContentValidator()
  }
  return validatorInstance
}

// Backward compatibility function
export async function validateTweetContentWithFUD(content: string): Promise<boolean> {
  const validator = getEnhancedContentValidator()
  return validator.validateTweetContentEnhanced(content)
}
