export interface TweetError {
  type: string
  message: string
  action: string
  retryable: boolean
  retryDelay?: number
  contactSupport?: boolean
  details?: any
}

export interface ErrorHandlerResponse {
  error: TweetError
  httpStatus: number
}

export class TweetErrorHandler {
  static handleTweetNotFound(fallbackStatus?: any): ErrorHandlerResponse {
    return {
      error: {
        type: 'TWEET_NOT_FOUND',
        message: 'This tweet appears to have been deleted or is no longer available',
        action: 'Please try submitting a different tweet from your LayerEdge community posts',
        retryable: false,
        contactSupport: false,
        details: { fallbackStatus }
      },
      httpStatus: 404
    }
  }

  static handlePrivateTweet(): ErrorHandlerResponse {
    return {
      error: {
        type: 'PRIVATE_TWEET',
        message: 'This tweet is from a private account and cannot be processed',
        action: 'Please ensure your tweet is publicly visible or submit a different public tweet',
        retryable: false,
        contactSupport: false
      },
      httpStatus: 403
    }
  }

  static handleInvalidUrl(): ErrorHandlerResponse {
    return {
      error: {
        type: 'INVALID_URL',
        message: 'Invalid tweet URL format detected',
        action: 'Please copy the complete URL from X/Twitter (format: https://x.com/username/status/123456789)',
        retryable: false,
        contactSupport: false
      },
      httpStatus: 400
    }
  }

  static handleRateLimit(resetTime?: Date): ErrorHandlerResponse {
    const retryDelay = resetTime ? Math.max(0, resetTime.getTime() - Date.now()) : 15 * 60 * 1000 // 15 minutes default
    
    return {
      error: {
        type: 'RATE_LIMITED',
        message: 'Twitter API temporarily unavailable due to rate limits',
        action: `Please wait ${Math.ceil(retryDelay / 60000)} minutes and try again, or contact support if this persists`,
        retryable: true,
        retryDelay,
        contactSupport: true,
        details: { resetTime, retryDelay }
      },
      httpStatus: 429
    }
  }

  static handleScrapingFailed(): ErrorHandlerResponse {
    return {
      error: {
        type: 'SCRAPING_FAILED',
        message: 'Unable to retrieve tweet content at this time',
        action: 'Our backup systems are working to resolve this. Please try again in a few minutes',
        retryable: true,
        retryDelay: 2 * 60 * 1000, // 2 minutes
        contactSupport: true
      },
      httpStatus: 503
    }
  }

  static handleUnauthorizedSubmission(tweetAuthor: string, authenticatedUser: string): ErrorHandlerResponse {
    return {
      error: {
        type: 'UNAUTHORIZED_SUBMISSION',
        message: 'You can only submit your own tweets for security reasons',
        action: `Please ensure this tweet was posted by your authenticated X/Twitter account (@${authenticatedUser}). This tweet was posted by @${tweetAuthor}`,
        retryable: false,
        contactSupport: false,
        details: { tweetAuthor, authenticatedUser }
      },
      httpStatus: 403
    }
  }

  static handleContentValidation(content: string): ErrorHandlerResponse {
    return {
      error: {
        type: 'CONTENT_VALIDATION_FAILED',
        message: 'Tweet must contain either "@layeredge" or "$EDGEN" to earn points',
        action: 'Please make sure your tweet mentions LayerEdge (@layeredge) or the $EDGEN token to qualify for points',
        retryable: false,
        contactSupport: false,
        details: { content: content.substring(0, 200) }
      },
      httpStatus: 400
    }
  }

  static handleDuplicateSubmission(isOwnTweet: boolean, originalSubmitter: string): ErrorHandlerResponse {
    return {
      error: {
        type: 'DUPLICATE_SUBMISSION',
        message: isOwnTweet 
          ? 'You have already submitted this tweet and earned points for it'
          : `This tweet has already been submitted by ${originalSubmitter}`,
        action: isOwnTweet
          ? 'Each tweet can only be submitted once. Try submitting a different tweet to earn more points'
          : 'Each tweet can only be submitted once across all users. Please submit a different tweet',
        retryable: false,
        contactSupport: false,
        details: { isOwnTweet, originalSubmitter }
      },
      httpStatus: 409
    }
  }

  static handleNetworkError(): ErrorHandlerResponse {
    return {
      error: {
        type: 'NETWORK_ERROR',
        message: 'Network connection error occurred',
        action: 'Please check your internet connection and try again',
        retryable: true,
        retryDelay: 5000, // 5 seconds
        contactSupport: true
      },
      httpStatus: 500
    }
  }

  static handleTwikitFailed(): ErrorHandlerResponse {
    return {
      error: {
        type: 'TWIKIT_FAILED',
        message: 'Twikit service temporarily unavailable',
        action: 'Our enhanced fallback system is working to resolve this. Please try again in a few minutes',
        retryable: true,
        retryDelay: 3 * 60 * 1000, // 3 minutes
        contactSupport: true
      },
      httpStatus: 503
    }
  }

  static handleTwikitAuthFailed(): ErrorHandlerResponse {
    return {
      error: {
        type: 'TWIKIT_AUTH_FAILED',
        message: 'Twikit authentication failed',
        action: 'Our system is working to re-authenticate. Please try again shortly',
        retryable: true,
        retryDelay: 5 * 60 * 1000, // 5 minutes
        contactSupport: true
      },
      httpStatus: 401
    }
  }

  static handleUnknownError(originalError?: any): ErrorHandlerResponse {
    return {
      error: {
        type: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred while processing your request',
        action: 'Please try again in a few moments. If the problem persists, contact our support team',
        retryable: true,
        retryDelay: 10000, // 10 seconds
        contactSupport: true,
        details: { originalError: originalError?.message || 'Unknown error' }
      },
      httpStatus: 500
    }
  }

  static determineErrorType(fallbackStatus: any, tweetData: any, error: any): ErrorHandlerResponse {
    // Rate limiting
    if (fallbackStatus?.isApiRateLimited) {
      return this.handleRateLimit(fallbackStatus.rateLimitResetTime)
    }

    // Twikit-specific errors
    if (error?.message?.includes('twikit') || error?.message?.includes('Twikit')) {
      if (error?.message?.includes('auth') || error?.message?.includes('login')) {
        return this.handleTwikitAuthFailed()
      }
      return this.handleTwikitFailed()
    }

    // Tweet not found or deleted
    if (!tweetData && fallbackStatus?.apiFailureCount > 0) {
      return this.handleTweetNotFound(fallbackStatus)
    }

    // Scraping failed
    if (!tweetData && fallbackStatus?.scrapingFailureCount > 0) {
      return this.handleScrapingFailed()
    }

    // Network/connection errors
    if (error?.message?.includes('network') || error?.message?.includes('timeout')) {
      return this.handleNetworkError()
    }

    // Default to unknown error
    return this.handleUnknownError(error)
  }
}

export function createErrorResponse(errorHandler: ErrorHandlerResponse) {
  return {
    error: errorHandler.error.message,
    errorType: errorHandler.error.type,
    action: errorHandler.error.action,
    retryable: errorHandler.error.retryable,
    retryDelay: errorHandler.error.retryDelay,
    contactSupport: errorHandler.error.contactSupport,
    details: errorHandler.error.details
  }
}
