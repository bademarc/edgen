/**
 * Advanced FUD Detection with Machine Learning-like Pattern Recognition
 * 
 * This service provides more sophisticated FUD detection using pattern analysis,
 * sentiment scoring, and contextual understanding to catch subtle manipulation attempts.
 */

import { getFUDDetectionService, FUDAnalysisResult } from './fud-detection-service'

export interface AdvancedFUDAnalysis extends FUDAnalysisResult {
  sentimentScore: number
  manipulationPatterns: string[]
  contextualRisk: 'low' | 'medium' | 'high'
  confidenceLevel: number
}

export interface PatternMatch {
  pattern: RegExp
  weight: number
  description: string
  category: 'manipulation' | 'fear' | 'uncertainty' | 'doubt'
}

export class AdvancedFUDDetectionService {
  private baseFudService = getFUDDetectionService()

  // Advanced manipulation patterns that are harder to detect
  private readonly MANIPULATION_PATTERNS: PatternMatch[] = [
    // Concern trolling patterns (reduced weight for legitimate concerns)
    {
      pattern: /i'm (just|really) (worried|concerned) about/i,
      weight: 2, // Reduced from 3 to 2
      description: 'Concern trolling pattern',
      category: 'manipulation'
    },
    {
      pattern: /as a (supporter|holder|investor).*(but|however)/i,
      weight: 4,
      description: 'False credibility with contradiction',
      category: 'manipulation'
    },
    
    // Rumor spreading patterns (adjusted for context)
    {
      pattern: /(heard|word is|people say|they say).*(issues?|problems?|concerns?)/i,
      weight: 4, // Reduced from 5 to 4
      description: 'Rumor spreading pattern',
      category: 'uncertainty'
    },
    {
      pattern: /(allegedly|supposedly|rumor has it|unconfirmed)/i,
      weight: 2, // Reduced from 3 to 2
      description: 'Unverified claims pattern',
      category: 'uncertainty'
    },
    
    // Fear amplification patterns
    {
      pattern: /(be careful|watch out|warning|red flag).*(about|with)/i,
      weight: 6,
      description: 'Fear amplification pattern',
      category: 'fear'
    },
    {
      pattern: /might (lose|crash|fail|dump)/i,
      weight: 4,
      description: 'Predictive fear pattern',
      category: 'fear'
    },
    
    // Doubt seeding patterns (reduced weights for balanced criticism)
    {
      pattern: /(not sure|skeptical|doubtful).*(about|if|whether)/i,
      weight: 2, // Reduced from 3 to 2
      description: 'Doubt seeding pattern',
      category: 'doubt'
    },
    {
      pattern: /(seems|looks|appears).*(suspicious|fishy|questionable)/i,
      weight: 3, // Reduced from 4 to 3
      description: 'Suspicion casting pattern',
      category: 'doubt'
    },
    
    // Market manipulation patterns
    {
      pattern: /(dump|sell|exit).*(before|when)/i,
      weight: 7,
      description: 'Market manipulation pattern',
      category: 'manipulation'
    },
    {
      pattern: /better (sell|exit|avoid).*(now|soon)/i,
      weight: 6,
      description: 'Urgency manipulation pattern',
      category: 'manipulation'
    }
  ]

  // Positive sentiment indicators to balance analysis
  private readonly POSITIVE_INDICATORS = [
    'excited', 'bullish', 'optimistic', 'love', 'amazing', 'awesome', 'great',
    'fantastic', 'revolutionary', 'innovative', 'brilliant', 'outstanding',
    'excellent', 'wonderful', 'impressive', 'groundbreaking', 'building',
    'developing', 'future', 'potential', 'opportunity', 'growth'
  ]

  // Negative sentiment indicators
  private readonly NEGATIVE_INDICATORS = [
    'hate', 'terrible', 'awful', 'worst', 'garbage', 'trash', 'useless',
    'pointless', 'waste', 'stupid', 'dumb', 'bad', 'poor', 'disappointing',
    'failed', 'failing', 'risky', 'dangerous', 'worried', 'concerned'
  ]

  /**
   * Perform advanced FUD analysis with pattern recognition
   */
  async analyzeAdvanced(content: string): Promise<AdvancedFUDAnalysis> {
    // Get base FUD analysis
    const baseFudResult = await this.baseFudService.detectFUD(content)
    
    // Perform advanced pattern analysis
    const manipulationPatterns = this.detectManipulationPatterns(content)
    const sentimentScore = this.calculateSentimentScore(content)
    const contextualRisk = this.assessContextualRisk(content, manipulationPatterns, sentimentScore)
    const confidenceLevel = this.calculateConfidenceLevel(baseFudResult, manipulationPatterns, sentimentScore)
    
    // Adjust base result based on advanced analysis
    const adjustedResult = this.adjustResultWithAdvancedAnalysis(
      baseFudResult,
      manipulationPatterns,
      sentimentScore,
      contextualRisk
    )

    return {
      ...adjustedResult,
      sentimentScore,
      manipulationPatterns: manipulationPatterns.map(p => p.description),
      contextualRisk,
      confidenceLevel
    }
  }

  /**
   * Detect manipulation patterns in content
   */
  private detectManipulationPatterns(content: string): PatternMatch[] {
    const detectedPatterns: PatternMatch[] = []
    
    for (const pattern of this.MANIPULATION_PATTERNS) {
      if (pattern.pattern.test(content)) {
        detectedPatterns.push(pattern)
      }
    }
    
    return detectedPatterns
  }

  /**
   * Calculate sentiment score (-1 to 1, where -1 is very negative, 1 is very positive)
   */
  private calculateSentimentScore(content: string): number {
    const normalizedContent = content.toLowerCase()
    let positiveScore = 0
    let negativeScore = 0
    
    // Count positive indicators
    for (const indicator of this.POSITIVE_INDICATORS) {
      if (normalizedContent.includes(indicator)) {
        positiveScore += 1
      }
    }
    
    // Count negative indicators
    for (const indicator of this.NEGATIVE_INDICATORS) {
      if (normalizedContent.includes(indicator)) {
        negativeScore += 1
      }
    }
    
    // Calculate normalized sentiment score
    const totalIndicators = positiveScore + negativeScore
    if (totalIndicators === 0) return 0
    
    return (positiveScore - negativeScore) / totalIndicators
  }

  /**
   * Assess contextual risk based on multiple factors
   */
  private assessContextualRisk(
    content: string,
    patterns: PatternMatch[],
    sentimentScore: number
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0
    
    // Add risk from manipulation patterns
    riskScore += patterns.reduce((sum, pattern) => sum + pattern.weight, 0)
    
    // Add risk from negative sentiment
    if (sentimentScore < -0.3) riskScore += 5
    else if (sentimentScore < 0) riskScore += 2
    
    // Check for LayerEdge mentions (reduces risk if positive context)
    const hasLayerEdgeMention = /(@layeredge|layeredge|\$edgen|edgen)/i.test(content)
    if (hasLayerEdgeMention) {
      if (sentimentScore > 0.3) {
        riskScore = Math.max(0, riskScore - 5) // Strong positive sentiment
      } else if (sentimentScore > 0) {
        riskScore = Math.max(0, riskScore - 3) // Mild positive sentiment
      } else if (sentimentScore === 0) {
        riskScore = Math.max(0, riskScore - 1) // Neutral sentiment
      }
    }
    
    // Determine risk level
    if (riskScore >= 10) return 'high'
    if (riskScore >= 5) return 'medium'
    return 'low'
  }

  /**
   * Calculate confidence level in the analysis (0-1)
   */
  private calculateConfidenceLevel(
    baseFudResult: FUDAnalysisResult,
    patterns: PatternMatch[],
    sentimentScore: number
  ): number {
    let confidence = 0.5 // Base confidence
    
    // Increase confidence with more detected patterns
    confidence += Math.min(0.3, patterns.length * 0.1)
    
    // Increase confidence with stronger sentiment signals
    confidence += Math.min(0.2, Math.abs(sentimentScore) * 0.2)
    
    // Increase confidence if base FUD detection agrees
    if (baseFudResult.isBlocked || baseFudResult.isWarning) {
      confidence += 0.2
    }
    
    return Math.min(1, confidence)
  }

  /**
   * Adjust base FUD result with advanced analysis
   */
  private adjustResultWithAdvancedAnalysis(
    baseResult: FUDAnalysisResult,
    patterns: PatternMatch[],
    sentimentScore: number,
    contextualRisk: 'low' | 'medium' | 'high'
  ): FUDAnalysisResult {
    let adjustedScore = baseResult.score
    let isBlocked = baseResult.isBlocked
    let isWarning = baseResult.isWarning
    
    // Add score from manipulation patterns
    const patternScore = patterns.reduce((sum, pattern) => sum + pattern.weight, 0)
    adjustedScore += patternScore
    
    // Adjust based on contextual risk
    if (contextualRisk === 'high') {
      adjustedScore += 3
    } else if (contextualRisk === 'medium') {
      adjustedScore += 1
    }
    
    // Re-evaluate blocking/warning based on adjusted score
    const blockThreshold = this.baseFudService.getConfig().blockThreshold
    const warnThreshold = this.baseFudService.getConfig().warnThreshold
    
    if (adjustedScore >= blockThreshold) {
      isBlocked = true
      isWarning = false
    } else if (adjustedScore >= warnThreshold) {
      isBlocked = false
      isWarning = true
    } else {
      isBlocked = false
      isWarning = false
    }
    
    // Update message with pattern information
    let message = baseResult.message
    if (patterns.length > 0) {
      const patternDescriptions = patterns.map(p => p.description).join(', ')
      message += ` Detected manipulation patterns: ${patternDescriptions}.`
    }
    
    return {
      ...baseResult,
      score: adjustedScore,
      isBlocked,
      isWarning,
      message,
      detectedCategories: [
        ...baseResult.detectedCategories,
        ...patterns.map(p => p.category)
      ].filter((value, index, self) => self.indexOf(value) === index), // Remove duplicates
      suggestions: [
        ...baseResult.suggestions,
        ...(patterns.length > 0 ? ['Avoid using language that could be interpreted as manipulation'] : [])
      ]
    }
  }
}

// Export singleton instance
let advancedFudInstance: AdvancedFUDDetectionService | null = null

export function getAdvancedFUDDetectionService(): AdvancedFUDDetectionService {
  if (!advancedFudInstance) {
    advancedFudInstance = new AdvancedFUDDetectionService()
  }
  return advancedFudInstance
}
