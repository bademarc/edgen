/**
 * Dynamic Quest Templates for LayerEdge Platform
 * Provides rotating daily/weekly quests with varying difficulty tiers
 */

export interface QuestTemplate {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'special'
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  points: number
  requirements: QuestRequirement[]
  metadata: QuestMetadata
  duration: number // in hours
  cooldown: number // in hours
  maxCompletions?: number
}

export interface QuestRequirement {
  type: 'tweet' | 'follow' | 'retweet' | 'like' | 'comment' | 'engagement_threshold'
  target?: string
  count?: number
  threshold?: number
  description: string
}

export interface QuestMetadata {
  category: string
  tags: string[]
  twitterUrl?: string
  targetAccount?: string
  hashtags?: string[]
  customData?: Record<string, any>
}

// Daily Quest Templates
export const DAILY_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'daily_tweet_edgen',
    title: 'Tweet about $EDGEN Today',
    description: 'Share your thoughts about $EDGEN or LayerEdge in a tweet. Include @layeredge or $EDGEN to earn points!',
    type: 'daily',
    difficulty: 'easy',
    points: 50,
    duration: 24,
    cooldown: 24,
    requirements: [
      {
        type: 'tweet',
        count: 1,
        description: 'Post a tweet mentioning @layeredge or $EDGEN'
      }
    ],
    metadata: {
      category: 'Social Engagement',
      tags: ['twitter', 'daily', 'easy'],
      hashtags: ['#EDGEN', '#LayerEdge', '#AI', '#Blockchain']
    }
  },
  {
    id: 'daily_engagement_boost',
    title: 'Engagement Booster',
    description: 'Like and retweet 3 LayerEdge posts to boost community engagement.',
    type: 'daily',
    difficulty: 'easy',
    points: 30,
    duration: 24,
    cooldown: 24,
    requirements: [
      {
        type: 'like',
        count: 3,
        target: '@layeredge',
        description: 'Like 3 posts from @layeredge'
      },
      {
        type: 'retweet',
        count: 3,
        target: '@layeredge',
        description: 'Retweet 3 posts from @layeredge'
      }
    ],
    metadata: {
      category: 'Community Support',
      tags: ['engagement', 'daily', 'easy'],
      targetAccount: '@layeredge'
    }
  },
  {
    id: 'daily_quality_tweet',
    title: 'Quality Content Creator',
    description: 'Create a high-quality tweet about LayerEdge that gets at least 5 likes.',
    type: 'daily',
    difficulty: 'medium',
    points: 100,
    duration: 24,
    cooldown: 24,
    requirements: [
      {
        type: 'tweet',
        count: 1,
        description: 'Post a tweet mentioning @layeredge or $EDGEN'
      },
      {
        type: 'engagement_threshold',
        threshold: 5,
        description: 'Your tweet must receive at least 5 likes'
      }
    ],
    metadata: {
      category: 'Content Creation',
      tags: ['twitter', 'daily', 'medium', 'quality']
    }
  }
]

// Weekly Quest Templates
export const WEEKLY_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'weekly_thread_master',
    title: 'Thread Master',
    description: 'Create a Twitter thread (3+ tweets) explaining LayerEdge technology or benefits.',
    type: 'weekly',
    difficulty: 'hard',
    points: 500,
    duration: 168, // 7 days
    cooldown: 168,
    requirements: [
      {
        type: 'tweet',
        count: 3,
        description: 'Create a thread with at least 3 connected tweets about LayerEdge'
      }
    ],
    metadata: {
      category: 'Content Creation',
      tags: ['twitter', 'weekly', 'hard', 'thread', 'educational']
    }
  },
  {
    id: 'weekly_community_champion',
    title: 'Community Champion',
    description: 'Engage with 20 LayerEdge community posts this week through likes, retweets, and comments.',
    type: 'weekly',
    difficulty: 'medium',
    points: 200,
    duration: 168,
    cooldown: 168,
    requirements: [
      {
        type: 'engagement_threshold',
        threshold: 20,
        description: 'Engage with 20 community posts (likes + retweets + comments)'
      }
    ],
    metadata: {
      category: 'Community Engagement',
      tags: ['engagement', 'weekly', 'medium', 'community']
    }
  },
  {
    id: 'weekly_influencer',
    title: 'Micro-Influencer',
    description: 'Get your LayerEdge content shared by others. Achieve 10+ retweets on your LayerEdge posts this week.',
    type: 'weekly',
    difficulty: 'hard',
    points: 750,
    duration: 168,
    cooldown: 168,
    requirements: [
      {
        type: 'engagement_threshold',
        threshold: 10,
        description: 'Achieve 10+ total retweets on your LayerEdge posts'
      }
    ],
    metadata: {
      category: 'Influence Building',
      tags: ['twitter', 'weekly', 'hard', 'influence', 'viral']
    }
  }
]

// Special Event Quest Templates
export const SPECIAL_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'special_first_tweet',
    title: 'Welcome to LayerEdge!',
    description: 'Post your first tweet about LayerEdge and introduce yourself to the community.',
    type: 'special',
    difficulty: 'easy',
    points: 100,
    duration: 720, // 30 days
    cooldown: 0,
    maxCompletions: 1,
    requirements: [
      {
        type: 'tweet',
        count: 1,
        description: 'Post your first tweet mentioning @layeredge or $EDGEN'
      }
    ],
    metadata: {
      category: 'Onboarding',
      tags: ['special', 'onboarding', 'first-time', 'welcome']
    }
  },
  {
    id: 'special_milestone_100',
    title: 'Century Club',
    description: 'Reach 100 total points on the LayerEdge platform.',
    type: 'special',
    difficulty: 'medium',
    points: 50,
    duration: 8760, // 1 year
    cooldown: 0,
    maxCompletions: 1,
    requirements: [
      {
        type: 'engagement_threshold',
        threshold: 100,
        description: 'Accumulate 100 total points'
      }
    ],
    metadata: {
      category: 'Milestones',
      tags: ['special', 'milestone', 'achievement']
    }
  }
]

// Quest difficulty configuration
export const QUEST_DIFFICULTY_CONFIG = {
  easy: {
    pointsMultiplier: 1,
    color: '#22c55e',
    icon: '🟢',
    description: 'Quick and simple tasks'
  },
  medium: {
    pointsMultiplier: 1.5,
    color: '#f59e0b',
    icon: '🟡',
    description: 'Moderate effort required'
  },
  hard: {
    pointsMultiplier: 2,
    color: '#ef4444',
    icon: '🔴',
    description: 'Challenging tasks with high rewards'
  },
  legendary: {
    pointsMultiplier: 3,
    color: '#8b5cf6',
    icon: '🟣',
    description: 'Epic challenges for dedicated members'
  }
}

// Quest rotation logic
export class QuestRotationService {
  static getDailyQuests(date: Date = new Date()): QuestTemplate[] {
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
    const rotation = dayOfYear % DAILY_QUEST_TEMPLATES.length
    
    // Return 2-3 daily quests based on rotation
    const selectedQuests = []
    for (let i = 0; i < 3; i++) {
      const index = (rotation + i) % DAILY_QUEST_TEMPLATES.length
      selectedQuests.push(DAILY_QUEST_TEMPLATES[index])
    }
    
    return selectedQuests
  }

  static getWeeklyQuests(date: Date = new Date()): QuestTemplate[] {
    const weekOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (86400000 * 7))
    const rotation = weekOfYear % WEEKLY_QUEST_TEMPLATES.length
    
    // Return 1-2 weekly quests based on rotation
    const selectedQuests = []
    for (let i = 0; i < 2; i++) {
      const index = (rotation + i) % WEEKLY_QUEST_TEMPLATES.length
      selectedQuests.push(WEEKLY_QUEST_TEMPLATES[index])
    }
    
    return selectedQuests
  }

  static getSpecialQuests(userJoinDate: Date, userPoints: number): QuestTemplate[] {
    const specialQuests = []
    
    // Add onboarding quest for new users
    const daysSinceJoin = Math.floor((Date.now() - userJoinDate.getTime()) / (86400000))
    if (daysSinceJoin <= 30) {
      specialQuests.push(SPECIAL_QUEST_TEMPLATES.find(q => q.id === 'special_first_tweet')!)
    }
    
    // Add milestone quests based on points
    if (userPoints >= 100 && userPoints < 150) {
      specialQuests.push(SPECIAL_QUEST_TEMPLATES.find(q => q.id === 'special_milestone_100')!)
    }
    
    return specialQuests.filter(Boolean)
  }
}
