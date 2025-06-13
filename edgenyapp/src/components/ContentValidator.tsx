'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface ValidationResult {
  isValid: boolean
  allowSubmission: boolean
  requiresReview: boolean
  hasRequiredKeywords: boolean
  message: string
  suggestions: string[]
}

interface FUDAnalysis {
  isBlocked: boolean
  isWarning: boolean
  score: number
  detectedCategories: string[]
  flaggedTerms: string[]
  message: string
  allowResubmit: boolean
}

interface ContentValidatorProps {
  content: string
  onContentChange: (content: string) => void
  onValidationChange: (isValid: boolean, canSubmit: boolean) => void
  className?: string
  placeholder?: string
  maxLength?: number
  showRealTimeValidation?: boolean
}

export function ContentValidator({
  content,
  onContentChange,
  onValidationChange,
  className = '',
  placeholder = 'Write your tweet about LayerEdge...',
  maxLength = 280,
  showRealTimeValidation = true
}: ContentValidatorProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [fudAnalysis, setFudAnalysis] = useState<FUDAnalysis | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationTimer, setValidationTimer] = useState<NodeJS.Timeout | null>(null)

  // Real-time validation with debouncing
  useEffect(() => {
    if (!showRealTimeValidation || !content.trim()) {
      setValidation(null)
      setFudAnalysis(null)
      onValidationChange(false, false)
      return
    }

    // Clear existing timer
    if (validationTimer) {
      clearTimeout(validationTimer)
    }

    // Set new timer for debounced validation
    const timer = setTimeout(() => {
      validateContent(content)
    }, 1000) // 1 second debounce

    setValidationTimer(timer)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [content, showRealTimeValidation])

  const validateContent = async (textContent: string) => {
    if (!textContent.trim()) return

    setIsValidating(true)

    try {
      const response = await fetch('/api/content/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: textContent,
          options: {
            enableFUDDetection: true,
            strictMode: false,
            requireLayerEdgeKeywords: true,
            allowWarnings: true
          }
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setValidation(data.validation)
        setFudAnalysis(data.fudAnalysis)
        onValidationChange(data.validation.isValid, data.validation.allowSubmission)
      } else {
        const errorData = await response.json()
        setValidation({
          isValid: false,
          allowSubmission: false,
          requiresReview: false,
          hasRequiredKeywords: false,
          message: errorData.userMessage || 'Validation failed',
          suggestions: errorData.suggestions || []
        })
        setFudAnalysis(null)
        onValidationChange(false, false)
      }
    } catch (error) {
      console.error('Content validation error:', error)
      setValidation({
        isValid: false,
        allowSubmission: false,
        requiresReview: false,
        hasRequiredKeywords: false,
        message: 'Unable to validate content. Please try again.',
        suggestions: ['Check your internet connection', 'Try again in a moment']
      })
      setFudAnalysis(null)
      onValidationChange(false, false)
    } finally {
      setIsValidating(false)
    }
  }

  const getValidationIcon = () => {
    if (isValidating) {
      return <ClockIcon className="h-5 w-5 animate-pulse text-blue-500" />
    }

    if (!validation) {
      return <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
    }

    if (fudAnalysis?.isBlocked) {
      return <XCircleIcon className="h-5 w-5 text-red-500" />
    }

    if (fudAnalysis?.isWarning || validation.requiresReview) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    }

    if (validation.allowSubmission) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    }

    return <ShieldExclamationIcon className="h-5 w-5 text-red-500" />
  }

  const getValidationStatus = () => {
    if (isValidating) return 'Validating...'
    if (!validation) return 'Ready to validate'
    if (fudAnalysis?.isBlocked) return 'Content blocked'
    if (fudAnalysis?.isWarning) return 'Content warning'
    if (validation.allowSubmission) return 'Content approved'
    return 'Content needs revision'
  }

  const getStatusColor = () => {
    if (isValidating) return 'text-blue-500'
    if (!validation) return 'text-gray-500'
    if (fudAnalysis?.isBlocked) return 'text-red-500'
    if (fudAnalysis?.isWarning || validation.requiresReview) return 'text-yellow-500'
    if (validation.allowSubmission) return 'text-green-500'
    return 'text-red-500'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Content Input */}
      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="min-h-[120px] pr-12"
        />
        <div className="absolute top-3 right-3">
          {getValidationIcon()}
        </div>
        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
          <span className={getStatusColor()}>
            {getValidationStatus()}
          </span>
          <span>
            {content.length}/{maxLength}
          </span>
        </div>
      </div>

      {/* Validation Results */}
      <AnimatePresence>
        {validation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className={`border-l-4 ${
              fudAnalysis?.isBlocked 
                ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' 
                : fudAnalysis?.isWarning || validation.requiresReview
                ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                : validation.allowSubmission
                ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
                : 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
            }`}>
              <CardContent className="pt-4">
                {/* Main Message */}
                <div className="flex items-start space-x-3 mb-3">
                  {getValidationIcon()}
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {validation.message}
                    </p>
                    {fudAnalysis && fudAnalysis.score > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Content risk score: {fudAnalysis.score}
                      </p>
                    )}
                  </div>
                </div>

                {/* Detected Issues */}
                {fudAnalysis && fudAnalysis.detectedCategories.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Detected issues:</p>
                    <div className="flex flex-wrap gap-1">
                      {fudAnalysis.detectedCategories.map((category) => (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="text-xs bg-red-100 text-red-800"
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flagged Terms */}
                {fudAnalysis && fudAnalysis.flaggedTerms.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Flagged terms:</p>
                    <div className="flex flex-wrap gap-1">
                      {fudAnalysis.flaggedTerms.map((term) => (
                        <Badge
                          key={term}
                          variant="outline"
                          className="text-xs border-red-300 text-red-700"
                        >
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {validation.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <LightBulbIcon className="h-4 w-4 text-blue-500" />
                      <p className="text-xs font-medium text-gray-700">Suggestions:</p>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1 ml-6">
                      {validation.suggestions.map((suggestion, index) => (
                        <li key={index} className="list-disc">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick Actions */}
                {!validation.allowSubmission && validation.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => validateContent(content)}
                      disabled={isValidating}
                      className="text-xs"
                    >
                      Re-validate Content
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Required Keywords Indicator */}
      {content.length > 0 && (
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-500">Required keywords:</span>
          <Badge
            variant={validation?.hasRequiredKeywords ? "default" : "secondary"}
            className={`text-xs ${
              validation?.hasRequiredKeywords 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            @layeredge or $EDGEN
          </Badge>
        </div>
      )}
    </div>
  )
}
