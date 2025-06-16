/**
 * FUD (Fear, Uncertainty, and Doubt) Detection and Prevention System
 * 
 * This service provides real-time content analysis for tweet submissions
 * to prevent harmful content while maintaining positive user experience.
 */

export interface FUDDetectionConfig {
  enabled: boolean
  strictMode: boolean
  blockThreshold: number
  warnThreshold: number
  whitelistEnabled: boolean
  customKeywords: string[]
}

export interface FUDAnalysisResult {
  isBlocked: boolean
  isWarning: boolean
  score: number
  detectedCategories: string[]
  flaggedTerms: string[]
  suggestions: string[]
  message: string
  allowResubmit: boolean
}

export interface ContentAnalysis {
  content: string
  normalizedContent: string
  wordCount: number
  categories: {
    scam: number
    negative: number
    profanity: number
    misinformation: number
    spam: number
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class FUDDetectionService {
  private config: FUDDetectionConfig
  
  // FUD keyword categories with severity weights
  private readonly SCAM_KEYWORDS = [
    // High severity (block immediately)
    { terms: ['scam', 'fraud', 'fake', 'ponzi', 'rug pull', 'rugpull', 'exit scam'], weight: 10 },
    { terms: ['pyramid scheme', 'pump and dump', 'dumping', 'worthless', 'steal'], weight: 10 },
    
    // Medium severity
    { terms: ['suspicious', 'warning', 'avoid', 'dangerous', 'risky'], weight: 5 },
    { terms: ['bubble', 'crash', 'dump', 'falling', 'losing'], weight: 3 }
  ]

  private readonly NEGATIVE_SENTIMENT = [
    // High severity
    { terms: ['hate', 'terrible', 'awful', 'worst', 'garbage', 'trash'], weight: 8 },
    { terms: ['useless', 'pointless', 'waste', 'stupid', 'dumb'], weight: 6 },

    // Medium severity
    { terms: ['bad', 'poor', 'disappointing', 'failed', 'failing', 'risky', 'dangerous'], weight: 4 },
    { terms: ['doubt', 'uncertain', 'worried', 'concerned', 'skeptical'], weight: 3 }, // Increased from 2 to 3
    { terms: ['issues with', 'problems with', 'concerns about', 'not sure about'], weight: 2 } // New subtle patterns
  ]

  private readonly PROFANITY_KEYWORDS = [
    // Severe profanity (always block)
    { terms: ['bitch', 'bastard'], weight: 8 },
    // Moderate profanity (warn for positive content, block for negative)
    { terms: ['damn', 'hell', 'crap', 'shit', 'fuck'], weight: 4 }, // Reduced from 7 to 4
    { terms: ['ass', 'piss', 'idiot', 'moron'], weight: 3 } // Reduced from 5 to 3
  ]

  private readonly MISINFORMATION_INDICATORS = [
    { terms: ['fake news', 'conspiracy', 'hoax', 'lie', 'lying'], weight: 8 },
    { terms: ['misleading', 'false', 'untrue', 'deceptive'], weight: 6 },
    { terms: ['rumor', 'unconfirmed', 'allegedly', 'supposedly'], weight: 4 }, // Increased from 3 to 4
    { terms: ['heard that', 'word is', 'people say', 'they say'], weight: 3 } // New subtle FUD patterns
  ]

  private readonly SPAM_INDICATORS = [
    { terms: ['click here', 'buy now', 'limited time', 'act fast'], weight: 6 },
    { terms: ['guaranteed', 'easy money', 'get rich', 'no risk'], weight: 8 },
    { terms: ['free money', 'instant profit', 'sure thing'], weight: 9 }
  ]

  // Whitelist patterns for legitimate content
  private readonly WHITELIST_PATTERNS = [
    /layeredge/i,
    /\$edgen/i,
    /@layeredge/i,
    /decentralized ai/i,
    /blockchain/i,
    /cryptocurrency/i,
    /web3/i,
    /innovation/i,
    /technology/i,
    /community/i,
    /building/i,
    /developing/i,
    /excited/i,
    /bullish/i,
    /optimistic/i
  ]

  constructor(config?: Partial<FUDDetectionConfig>) {
    // Load environment variables with fallbacks
    const blockThreshold = process.env.FUD_BLOCK_THRESHOLD ? parseInt(process.env.FUD_BLOCK_THRESHOLD) : 10 // Optimal threshold for scam detection
    const warnThreshold = process.env.FUD_WARN_THRESHOLD ? parseInt(process.env.FUD_WARN_THRESHOLD) : 4 // Lowered from 5 to 4

    this.config = {
      enabled: process.env.FUD_DETECTION_ENABLED !== 'false',
      strictMode: process.env.FUD_STRICT_MODE === 'true',
      blockThreshold,
      warnThreshold,
      whitelistEnabled: process.env.FUD_WHITELIST_ENABLED !== 'false',
      customKeywords: process.env.FUD_CUSTOM_KEYWORDS?.split(',') || [],
      ...config
    }

    // Log configuration in development mode only
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 FUD Detection Service Configuration:', JSON.stringify(this.config, null, 2))
    }
  }

  /**
   * Main FUD detection method - analyzes content and returns result
   */
  async detectFUD(content: string): Promise<FUDAnalysisResult> {
    // If FUD detection is disabled, allow all content
    if (!this.config.enabled) {
      return {
        isBlocked: false,
        isWarning: false,
        score: 0,
        detectedCategories: [],
        flaggedTerms: [],
        suggestions: [],
        message: 'Content approved',
        allowResubmit: true
      }
    }

    const analysis = this.analyzeContent(content)
    const totalScore = this.calculateTotalScore(analysis)

    // Check whitelist - but don't completely bypass FUD detection for high-risk content
    const isWhitelisted = this.config.whitelistEnabled && this.isWhitelisted(content)
    let adjustedScore = totalScore

    if (isWhitelisted) {
      // Check if content has obvious scam indicators - whitelist should NOT help with these
      const hasObviousScamContent = this.hasObviousScamContent(content)

      if (hasObviousScamContent) {
        // No whitelist reduction for obvious scam content
        adjustedScore = totalScore
      } else if (totalScore < this.config.blockThreshold) {
        // Only apply whitelist reduction for non-scam content below block threshold
        adjustedScore = Math.max(0, totalScore - 3)
      } else {
        // Minimal reduction for severe FUD
        adjustedScore = Math.max(this.config.warnThreshold, totalScore - 2)
      }
    }

    const detectedCategories = this.getDetectedCategories(analysis)
    const flaggedTerms = this.getFlaggedTerms(content, analysis)

    // Determine action based on adjusted score and thresholds
    if (adjustedScore >= this.config.blockThreshold) {
      return {
        isBlocked: true,
        isWarning: false,
        score: adjustedScore,
        detectedCategories,
        flaggedTerms,
        suggestions: this.generateSuggestions(analysis, 'block'),
        message: isWhitelisted
          ? `Content blocked despite containing LayerEdge keywords due to harmful content: ${this.generateBlockMessage(detectedCategories)}`
          : this.generateBlockMessage(detectedCategories),
        allowResubmit: true
      }
    } else if (adjustedScore >= this.config.warnThreshold) {
      return {
        isBlocked: false,
        isWarning: true,
        score: adjustedScore,
        detectedCategories,
        flaggedTerms,
        suggestions: this.generateSuggestions(analysis, 'warn'),
        message: isWhitelisted
          ? `Warning: Content contains LayerEdge keywords but may need revision: ${this.generateWarningMessage(detectedCategories)}`
          : this.generateWarningMessage(detectedCategories),
        allowResubmit: true
      }
    }

    return {
      isBlocked: false,
      isWarning: false,
      score: adjustedScore,
      detectedCategories: [],
      flaggedTerms: [],
      suggestions: [],
      message: isWhitelisted
        ? 'Content approved (contains LayerEdge keywords)'
        : 'Content approved',
      allowResubmit: true
    }
  }

  /**
   * Analyze content and categorize potential issues
   */
  private analyzeContent(content: string): ContentAnalysis {
    const normalizedContent = content.toLowerCase().trim()
    const words = normalizedContent.split(/\s+/)

    // Check for positive context to adjust profanity scoring
    const hasPositiveContext = this.hasPositiveContext(normalizedContent)
    let profanityScore = this.calculateCategoryScore(normalizedContent, this.PROFANITY_KEYWORDS)

    // Reduce profanity score if content has positive context, but keep minimum for warning
    if (hasPositiveContext && profanityScore > 0) {
      profanityScore = Math.max(3, profanityScore * 0.6) // Reduce by 40% but keep minimum of 3 for warning
    }

    return {
      content,
      normalizedContent,
      wordCount: words.length,
      categories: {
        scam: this.calculateCategoryScore(normalizedContent, this.SCAM_KEYWORDS),
        negative: this.calculateCategoryScore(normalizedContent, this.NEGATIVE_SENTIMENT),
        profanity: profanityScore,
        misinformation: this.calculateCategoryScore(normalizedContent, this.MISINFORMATION_INDICATORS),
        spam: this.calculateCategoryScore(normalizedContent, this.SPAM_INDICATORS)
      },
      severity: 'low'
    }
  }

  /**
   * Calculate score for a specific category
   */
  private calculateCategoryScore(content: string, keywords: Array<{terms: string[], weight: number}>): number {
    let score = 0
    const foundTerms = []

    for (const keywordGroup of keywords) {
      for (const term of keywordGroup.terms) {
        if (content.includes(term)) {
          score += keywordGroup.weight
          foundTerms.push(`${term}(+${keywordGroup.weight})`)
        }
      }
    }

    // Log found terms in development mode only
    if (foundTerms.length > 0 && process.env.NODE_ENV === 'development') {
      console.log(`🔍 Found keywords in "${content}": ${foundTerms.join(', ')} = ${score} points`)
    }

    return score
  }

  /**
   * Check if content has positive context that might mitigate profanity concerns
   */
  private hasPositiveContext(content: string): boolean {
    const positiveIndicators = [
      'excited', 'amazing', 'awesome', 'love', 'great', 'fantastic', 'revolutionary',
      'bullish', 'optimistic', 'incredible', 'brilliant', 'outstanding', 'excellent',
      'wonderful', 'impressive', 'innovative', 'groundbreaking', 'to the moon'
    ]

    return positiveIndicators.some(indicator => content.includes(indicator))
  }

  /**
   * Calculate total FUD score
   */
  private calculateTotalScore(analysis: ContentAnalysis): number {
    const { categories } = analysis
    let total = categories.scam + categories.negative + categories.profanity + 
                categories.misinformation + categories.spam
    
    // Apply strict mode multiplier
    if (this.config.strictMode) {
      total *= 1.5
    }
    
    // Add custom keywords score
    total += this.calculateCustomKeywordsScore(analysis.normalizedContent)
    
    return Math.round(total)
  }

  /**
   * Calculate score for custom keywords
   */
  private calculateCustomKeywordsScore(content: string): number {
    let score = 0
    for (const keyword of this.config.customKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        score += 5 // Default weight for custom keywords
      }
    }
    return score
  }

  /**
   * Check if content matches whitelist patterns
   */
  private isWhitelisted(content: string): boolean {
    return this.WHITELIST_PATTERNS.some(pattern => pattern.test(content))
  }

  /**
   * Check if content has obvious scam indicators that should never be whitelisted
   */
  private hasObviousScamContent(content: string): boolean {
    const normalizedContent = content.toLowerCase()
    const obviousScamTerms = [
      'scam', 'fraud', 'fake', 'ponzi', 'rug pull', 'rugpull', 'exit scam',
      'pyramid scheme', 'pump and dump', 'worthless', 'steal'
    ]

    return obviousScamTerms.some(term => normalizedContent.includes(term))
  }

  /**
   * Get categories that were detected
   */
  private getDetectedCategories(analysis: ContentAnalysis): string[] {
    const categories = []
    if (analysis.categories.scam > 0) categories.push('scam-related')
    if (analysis.categories.negative > 0) categories.push('negative-sentiment')
    if (analysis.categories.profanity > 0) categories.push('profanity')
    if (analysis.categories.misinformation > 0) categories.push('misinformation')
    if (analysis.categories.spam > 0) categories.push('spam')
    return categories
  }

  /**
   * Get specific terms that were flagged
   */
  private getFlaggedTerms(content: string, analysis: ContentAnalysis): string[] {
    const flagged = []
    const normalizedContent = analysis.normalizedContent
    
    // Check all keyword categories
    const allKeywords = [
      ...this.SCAM_KEYWORDS,
      ...this.NEGATIVE_SENTIMENT,
      ...this.PROFANITY_KEYWORDS,
      ...this.MISINFORMATION_INDICATORS,
      ...this.SPAM_INDICATORS
    ]
    
    for (const keywordGroup of allKeywords) {
      for (const term of keywordGroup.terms) {
        if (normalizedContent.includes(term)) {
          flagged.push(term)
        }
      }
    }
    
    return [...new Set(flagged)] // Remove duplicates
  }

  /**
   * Generate helpful suggestions for users
   */
  private generateSuggestions(analysis: ContentAnalysis, type: 'block' | 'warn'): string[] {
    const suggestions = []
    
    if (analysis.categories.scam > 0) {
      suggestions.push('Remove any language that could be interpreted as scam-related')
      suggestions.push('Focus on positive aspects of LayerEdge technology')
    }
    
    if (analysis.categories.negative > 0) {
      suggestions.push('Try using more positive or neutral language')
      suggestions.push('Share what you like about LayerEdge instead')
    }
    
    if (analysis.categories.profanity > 0) {
      suggestions.push('Please remove any profanity or inappropriate language')
      suggestions.push('Keep the content family-friendly')
    }
    
    if (analysis.categories.misinformation > 0) {
      suggestions.push('Ensure all claims are factual and verifiable')
      suggestions.push('Avoid spreading unconfirmed information')
    }
    
    if (analysis.categories.spam > 0) {
      suggestions.push('Remove promotional or spam-like content')
      suggestions.push('Focus on genuine engagement with LayerEdge')
    }
    
    // General suggestions
    suggestions.push('Include @layeredge or $EDGEN mentions')
    suggestions.push('Share your genuine thoughts about decentralized AI')
    
    return suggestions
  }

  /**
   * Generate user-friendly block message
   */
  private generateBlockMessage(categories: string[]): string {
    if (categories.length === 0) {
      return 'Content was blocked due to policy violations.'
    }
    
    const categoryText = categories.join(', ')
    return `Content blocked due to detected ${categoryText}. Please review our community guidelines and try again with more positive content.`
  }

  /**
   * Generate user-friendly warning message
   */
  private generateWarningMessage(categories: string[]): string {
    if (categories.length === 0) {
      return 'Content may need review. Consider revising for better community engagement.'
    }
    
    const categoryText = categories.join(', ')
    return `Warning: Detected potential ${categoryText}. You can still submit, but consider revising for better community engagement.`
  }

  /**
   * Get current configuration
   */
  getConfig(): FUDDetectionConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FUDDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Export singleton instance
let fudDetectionInstance: FUDDetectionService | null = null

export function getFUDDetectionService(config?: Partial<FUDDetectionConfig>): FUDDetectionService {
  if (!fudDetectionInstance) {
    fudDetectionInstance = new FUDDetectionService(config)
  }
  return fudDetectionInstance
}
