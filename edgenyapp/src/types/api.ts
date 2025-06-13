// API Response type definitions

export interface BaseApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface ApiResponse<T = any> extends BaseApiResponse {
  data?: T;
}

export interface PaginatedApiResponse<T = any> extends BaseApiResponse {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication API responses
export interface AuthResponse extends BaseApiResponse {
  user?: {
    id: string;
    email?: string;
    name?: string;
    image?: string;
    twitterUsername?: string;
  };
  token?: string;
}

export interface TwitterAuthResponse extends BaseApiResponse {
  authUrl?: string;
  state?: string;
  codeVerifier?: string;
}

// Tweet submission API responses
export interface TweetSubmissionResponse extends BaseApiResponse {
  submission?: {
    id: string;
    tweetUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    points: number;
    submittedAt: string;
  };
}

export interface TweetVerificationResponse extends BaseApiResponse {
  verification?: {
    isValid: boolean;
    tweetExists: boolean;
    userMatches: boolean;
    contentValid: boolean;
    errors: string[];
  };
}

// Leaderboard API responses
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  points: number;
  tweetsSubmitted: number;
  questsCompleted: number;
}

export interface LeaderboardResponse extends BaseApiResponse {
  leaderboard: LeaderboardEntry[];
  userRank?: number;
  totalUsers: number;
}

// User profile API responses
export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  twitterUsername?: string;
  points: number;
  rank: number;
  tweetsSubmitted: number;
  questsCompleted: number;
  joinedAt: string;
  lastActive?: string;
}

export interface UserProfileResponse extends BaseApiResponse {
  profile: UserProfile;
}

export interface UserStatsResponse extends BaseApiResponse {
  stats: {
    totalPoints: number;
    rank: number;
    tweetsSubmitted: number;
    questsCompleted: number;
    dailyStreak: number;
    weeklyPoints: number;
    monthlyPoints: number;
  };
}

// Monitoring and health API responses
export interface HealthCheckResponse extends BaseApiResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    twitterApi: ServiceHealth;
    aiService: ServiceHealth;
    manualSubmission: ServiceHealth;
  };
  uptime: number;
  version: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  available: boolean;
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

export interface RedisHealthResponse extends BaseApiResponse {
  redis: ServiceHealth;
  operations: {
    get: boolean;
    set: boolean;
    delete: boolean;
  };
}

// AI Chat API responses
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatResponse extends BaseApiResponse {
  chatMessage: ChatMessage;
  conversationId?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatHistoryResponse extends BaseApiResponse {
  messages: ChatMessage[];
  conversationId: string;
  totalMessages: number;
}

// Analytics API responses
export interface AnalyticsData {
  period: string;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalTweets: number;
    approvedTweets: number;
    totalPoints: number;
    averagePointsPerUser: number;
  };
}

export interface AnalyticsResponse extends BaseApiResponse {
  data: AnalyticsData[];
  summary: {
    totalPeriods: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

// Error response types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

export interface ValidationErrorResponse extends BaseApiResponse {
  success: false;
  errors: ApiError[];
}

export interface RateLimitResponse extends BaseApiResponse {
  success: false;
  error: 'Rate limit exceeded';
  retryAfter: number;
  limit: number;
  remaining: number;
  resetTime: string;
}

// Utility types for API requests
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
  userId?: string;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}

// Type guards for API responses
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return typeof obj === 'object' && obj !== null && typeof obj.success === 'boolean';
}

export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true } {
  return response.success === true;
}

export function isErrorResponse(response: ApiResponse<any>): response is ApiResponse<any> & { success: false } {
  return response.success === false;
}

export function isPaginatedResponse<T>(obj: any): obj is PaginatedApiResponse<T> {
  return isApiResponse(obj) &&
         Array.isArray(obj.data) &&
         'pagination' in obj &&
         typeof (obj as any).pagination === 'object' &&
         (obj as any).pagination !== null;
}
