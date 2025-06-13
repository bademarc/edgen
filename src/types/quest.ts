// Quest system type definitions

export type QuestStatus = "not_started" | "in_progress" | "completed" | "claimed";

export interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  status: QuestStatus;
  type: QuestType;
  requirements?: QuestRequirement[];
  metadata?: QuestMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type QuestType = 
  | "twitter_follow"
  | "twitter_retweet" 
  | "twitter_like"
  | "twitter_comment"
  | "twitter_post"
  | "discord_join"
  | "telegram_join"
  | "website_visit"
  | "referral"
  | "daily_login"
  | "custom";

export interface QuestRequirement {
  type: string;
  value: string | number | boolean;
  description?: string;
}

export interface QuestMetadata {
  twitterUrl?: string;
  discordInvite?: string;
  telegramLink?: string;
  websiteUrl?: string;
  referralCode?: string;
  customData?: Record<string, any>;
}

export interface QuestProgress {
  questId: string;
  userId: string;
  status: QuestStatus;
  progress: number;
  maxProgress: number;
  completedAt?: Date;
  claimedAt?: Date;
  metadata?: Record<string, any>;
}

export interface QuestCompletion {
  questId: string;
  userId: string;
  pointsAwarded: number;
  completedAt: Date;
  verificationData?: Record<string, any>;
}

export interface QuestService {
  getQuests(): Promise<Quest[]>;
  getQuestById(id: string): Promise<Quest | null>;
  getUserQuestProgress(userId: string, questId: string): Promise<QuestProgress | null>;
  completeQuest(userId: string, questId: string, verificationData?: Record<string, any>): Promise<QuestCompletion>;
  claimQuest(userId: string, questId: string): Promise<boolean>;
  updateQuestStatus(userId: string, questId: string, status: QuestStatus): Promise<boolean>;
}

// API Response types
export interface QuestApiResponse {
  success: boolean;
  data?: Quest | Quest[] | QuestProgress | QuestCompletion;
  error?: string;
  message?: string;
}

export interface QuestListResponse extends QuestApiResponse {
  data: Quest[];
  total: number;
  page?: number;
  limit?: number;
}

export interface QuestProgressResponse extends QuestApiResponse {
  data: QuestProgress;
}

export interface QuestCompletionResponse extends QuestApiResponse {
  data: QuestCompletion;
  pointsAwarded: number;
}

// Twitter-specific quest types
export interface TwitterQuestData {
  tweetId?: string;
  tweetUrl?: string;
  username?: string;
  hashtags?: string[];
  mentions?: string[];
  requiredText?: string;
}

export interface TwitterQuestVerification {
  tweetExists: boolean;
  userFollowed?: boolean;
  tweetRetweeted?: boolean;
  tweetLiked?: boolean;
  tweetCommented?: boolean;
  verifiedAt: Date;
}

// Database models (Prisma-compatible)
export interface QuestModel {
  id: string;
  title: string;
  description: string;
  points: number;
  type: string;
  requirements: any; // JSON field
  metadata: any; // JSON field
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserQuestProgressModel {
  id: string;
  userId: string;
  questId: string;
  status: string;
  progress: number;
  maxProgress: number;
  completedAt?: Date;
  claimedAt?: Date;
  metadata: any; // JSON field
  createdAt: Date;
  updatedAt: Date;
}

// Utility types
export type QuestStatusUpdate = {
  questId: string;
  status: QuestStatus;
  progress?: number;
  metadata?: Record<string, any>;
};

export type QuestFilter = {
  type?: QuestType;
  status?: QuestStatus;
  isActive?: boolean;
  userId?: string;
};

export type QuestSort = {
  field: 'createdAt' | 'updatedAt' | 'points' | 'title';
  direction: 'asc' | 'desc';
};

// Error types
export class QuestError extends Error {
  constructor(
    message: string,
    public code: string,
    public questId?: string,
    public userId?: string
  ) {
    super(message);
    this.name = 'QuestError';
  }
}

export class QuestNotFoundError extends QuestError {
  constructor(questId: string) {
    super(`Quest not found: ${questId}`, 'QUEST_NOT_FOUND', questId);
  }
}

export class QuestAlreadyCompletedError extends QuestError {
  constructor(questId: string, userId: string) {
    super(`Quest already completed: ${questId}`, 'QUEST_ALREADY_COMPLETED', questId, userId);
  }
}

export class QuestVerificationError extends QuestError {
  constructor(questId: string, reason: string) {
    super(`Quest verification failed: ${reason}`, 'QUEST_VERIFICATION_FAILED', questId);
  }
}
