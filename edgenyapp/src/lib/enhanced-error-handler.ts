/**
 * Enhanced Error Handler for LayerEdge Twitter API Integration
 * Provides comprehensive error handling, rate limiting, and user-friendly messages
 */

export interface ErrorHandlerConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  rateLimitThreshold: number
  enableFallbacks: boolean
}

export interface ErrorContext {
  operation: string
  userId?: string
  tweetUrl?: string
  attempt: number
  timestamp: Date
}

export interface ErrorResult {
  success: boolean
  error?: {
    type: string
    message: string
    userMessage: string
    retryable: boolean
    retryAfter?: number
    suggestions: string[]
  }
  data?: any
}

export class EnhancedErrorHandler {
  private config: ErrorHandlerConfig
  private rateLimitState: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelayMs: 5000,
      maxDelayMs: 900000, // 15 minutes
      rateLimitThreshold: 10,
      enableFallbacks: true,
      ...config
    }
  }

  /**
   * Handle Twitter API errors with enhanced context and user-friendly messages
   */
  async handleTwitterApiError(error: any, context: ErrorContext): Promise<ErrorResult> {
    console.log(`🔧 Handling error for ${context.operation}:`, error)

    // Rate limiting errors
    if (this.isRateLimitError(error)) {
      return this.handleRateLimitError(error, context)
    }

    // Authentication errors
    if (this.isAuthError(error)) {
      return this.handleAuthError(error, context)
    }

    // Tweet not found errors
    if (this.isTweetNotFoundError(error)) {
      return this.handleTweetNotFoundError(error, context)
    }

    // Network/timeout errors
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, context)
    }

    // Content validation errors
    if (this.isContentValidationError(error)) {
      return this.handleContentValidationError(error, context)
    }

    // Generic error handling
    return this.handleGenericError(error, context)
  }

  private isRateLimitError(error: any): boolean {
    return error?.status === 429 || 
           error?.message?.includes('rate limit') ||
           error?.message?.includes('Too Many Requests')
  }

  private isAuthError(error: any): boolean {
    return error?.status === 401 || 
           error?.status === 403 ||
           error?.message?.includes('Unauthorized') ||
           error?.message?.includes('Forbidden')
  }

  private isTweetNotFoundError(error: any): boolean {
    return error?.status === 404 ||
           error?.message?.includes('Not Found') ||
           error?.message?.includes('Could not find tweet')
  }

  private isNetworkError(error: any): boolean {
    return error instanceof TypeError ||
           error?.name === 'AbortError' ||
           error?.message?.includes('fetch') ||
           error?.message?.includes('network') ||
           error?.message?.includes('timeout')
  }

  private isContentValidationError(error: any): boolean {
    return error?.message?.includes('content validation') ||
           error?.message?.includes('@layeredge') ||
           error?.message?.includes('$EDGEN')
  }

  private async handleRateLimitError(error: any, context: ErrorContext): Promise<ErrorResult> {
    const resetTime = this.extractRateLimitResetTime(error)
    const retryAfter = resetTime ? Math.max(resetTime - Date.now(), 60000) : 300000 // Default 5 minutes

    return {
      success: false,
      error: {
        type: 'RATE_LIMITED',
        message: 'Twitter API rate limit exceeded',
        userMessage: 'We\'re currently experiencing high traffic. Please try again in a few minutes.',
        retryable: true,
        retryAfter,
        suggestions: [
          'Wait a few minutes before trying again',
          'Try submitting during off-peak hours',
          'Check if your tweet contains @layeredge or $EDGEN mentions'
        ]
      }
    }
  }

  private async handleAuthError(error: any, context: ErrorContext): Promise<ErrorResult> {
    return {
      success: false,
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: 'Twitter API authentication failed',
        userMessage: 'There\'s an issue with our Twitter connection. Our team has been notified.',
        retryable: false,
        suggestions: [
          'Try refreshing the page and logging in again',
          'Contact support if the issue persists',
          'Check that your tweet is publicly visible'
        ]
      }
    }
  }

  private async handleTweetNotFoundError(error: any, context: ErrorContext): Promise<ErrorResult> {
    return {
      success: false,
      error: {
        type: 'TWEET_NOT_FOUND',
        message: 'Tweet not found or not accessible',
        userMessage: 'This tweet appears to be deleted, private, or the URL is incorrect.',
        retryable: false,
        suggestions: [
          'Check that the tweet URL is correct',
          'Ensure the tweet is publicly visible',
          'Try submitting a different tweet',
          'Make sure you\'re submitting your own tweet'
        ]
      }
    }
  }

  private async handleNetworkError(error: any, context: ErrorContext): Promise<ErrorResult> {
    const isRetryable = context.attempt < this.config.maxRetries
    const retryAfter = this.calculateBackoffDelay(context.attempt)

    return {
      success: false,
      error: {
        type: 'NETWORK_ERROR',
        message: 'Network connection issue',
        userMessage: isRetryable 
          ? 'Connection issue detected. We\'ll retry automatically.'
          : 'Unable to connect to Twitter. Please check your internet connection.',
        retryable: isRetryable,
        retryAfter: isRetryable ? retryAfter : undefined,
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the issue persists'
        ]
      }
    }
  }

  private async handleContentValidationError(error: any, context: ErrorContext): Promise<ErrorResult> {
    return {
      success: false,
      error: {
        type: 'CONTENT_VALIDATION_FAILED',
        message: 'Tweet content validation failed',
        userMessage: 'Your tweet must mention @layeredge or $EDGEN to earn points.',
        retryable: false,
        suggestions: [
          'Include @layeredge in your tweet',
          'Include $EDGEN in your tweet',
          'Make sure the mentions are spelled correctly',
          'Submit a different tweet that mentions LayerEdge'
        ]
      }
    }
  }

  private async handleGenericError(error: any, context: ErrorContext): Promise<ErrorResult> {
    const isRetryable = context.attempt < this.config.maxRetries
    const retryAfter = this.calculateBackoffDelay(context.attempt)

    return {
      success: false,
      error: {
        type: 'UNKNOWN_ERROR',
        message: error?.message || 'An unexpected error occurred',
        userMessage: isRetryable
          ? 'Something went wrong. We\'re trying again automatically.'
          : 'An unexpected error occurred. Please try again later.',
        retryable: isRetryable,
        retryAfter: isRetryable ? retryAfter : undefined,
        suggestions: [
          'Try again in a few moments',
          'Check that your tweet URL is correct',
          'Contact support if the issue persists',
          'Make sure your tweet is publicly visible'
        ]
      }
    }
  }

  private extractRateLimitResetTime(error: any): number | null {
    // Try to extract reset time from various error formats
    if (error?.headers?.['x-rate-limit-reset']) {
      return parseInt(error.headers['x-rate-limit-reset']) * 1000
    }
    if (error?.resetTime) {
      return error.resetTime
    }
    return null
  }

  private calculateBackoffDelay(attempt: number): number {
    const delay = this.config.baseDelayMs * Math.pow(2, attempt)
    return Math.min(delay, this.config.maxDelayMs)
  }

  /**
   * Check if an operation should be rate limited
   */
  shouldRateLimit(operation: string, userId?: string): { limited: boolean; retryAfter?: number } {
    const key = userId ? `${operation}:${userId}` : operation
    const state = this.rateLimitState.get(key)
    
    if (!state) {
      this.rateLimitState.set(key, { count: 1, resetTime: Date.now() + 60000 })
      return { limited: false }
    }

    if (Date.now() > state.resetTime) {
      // Reset the counter
      this.rateLimitState.set(key, { count: 1, resetTime: Date.now() + 60000 })
      return { limited: false }
    }

    if (state.count >= this.rateLimitThreshold) {
      return { 
        limited: true, 
        retryAfter: state.resetTime - Date.now() 
      }
    }

    state.count++
    return { limited: false }
  }

  /**
   * Create user-friendly error message for the UI
   */
  formatErrorForUI(errorResult: ErrorResult): {
    title: string
    message: string
    type: 'error' | 'warning' | 'info'
    actions?: Array<{ label: string; action: string }>
  } {
    if (!errorResult.error) {
      return {
        title: 'Success',
        message: 'Operation completed successfully',
        type: 'info'
      }
    }

    const { error } = errorResult

    let type: 'error' | 'warning' | 'info' = 'error'
    if (error.retryable) {
      type = 'warning'
    }

    const actions = []
    if (error.retryable && error.retryAfter) {
      actions.push({
        label: `Retry in ${Math.ceil(error.retryAfter / 1000)}s`,
        action: 'retry'
      })
    }

    return {
      title: this.getErrorTitle(error.type),
      message: error.userMessage,
      type,
      actions: actions.length > 0 ? actions : undefined
    }
  }

  private getErrorTitle(errorType: string): string {
    switch (errorType) {
      case 'RATE_LIMITED':
        return 'Rate Limited'
      case 'AUTHENTICATION_ERROR':
        return 'Authentication Issue'
      case 'TWEET_NOT_FOUND':
        return 'Tweet Not Found'
      case 'NETWORK_ERROR':
        return 'Connection Issue'
      case 'CONTENT_VALIDATION_FAILED':
        return 'Content Validation Failed'
      default:
        return 'Error'
    }
  }
}

// Export singleton instance
export const enhancedErrorHandler = new EnhancedErrorHandler()
