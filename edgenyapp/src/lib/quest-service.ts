import { prisma } from '@/lib/db'

export interface QuestData {
  id: string
  title: string
  description: string
  type: string
  points: number
  isActive: boolean
  sortOrder: number
  metadata?: any
  requiresManualVerification: boolean
  autoVerifiable: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserQuestData {
  id: string
  userId: string
  questId: string
  status: 'not_started' | 'in_progress' | 'completed' | 'claimed'
  progress: number
  maxProgress: number
  completedAt?: Date
  claimedAt?: Date
  submissionData?: any
  verifiedBy?: string
  verifiedAt?: Date
  createdAt: Date
  updatedAt: Date
  quest: QuestData
}

export class QuestService {
  /**
   * Get all active quests with user progress
   */
  static async getUserQuests(userId: string): Promise<UserQuestData[]> {
    const quests = await prisma.quest.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        userQuests: {
          where: { userId },
          take: 1
        }
      }
    })

    return quests.map(quest => {
      const userQuest = quest.userQuests[0]
      
      if (userQuest) {
        return {
          ...userQuest,
          quest: {
            id: quest.id,
            title: quest.title,
            description: quest.description,
            type: quest.type,
            points: quest.points,
            isActive: quest.isActive,
            sortOrder: quest.sortOrder,
            metadata: quest.metadata,
            requiresManualVerification: quest.requiresManualVerification,
            autoVerifiable: quest.autoVerifiable,
            createdAt: quest.createdAt,
            updatedAt: quest.updatedAt
          }
        }
      }

      // Create default user quest if none exists
      return {
        id: '',
        userId,
        questId: quest.id,
        status: 'not_started' as const,
        progress: 0,
        maxProgress: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        quest: {
          id: quest.id,
          title: quest.title,
          description: quest.description,
          type: quest.type,
          points: quest.points,
          isActive: quest.isActive,
          sortOrder: quest.sortOrder,
          metadata: quest.metadata,
          requiresManualVerification: quest.requiresManualVerification,
          autoVerifiable: quest.autoVerifiable,
          createdAt: quest.createdAt,
          updatedAt: quest.updatedAt
        }
      }
    })
  }

  /**
   * Start a quest for a user
   */
  static async startQuest(userId: string, questId: string): Promise<UserQuestData> {
    const quest = await prisma.quest.findUnique({
      where: { id: questId, isActive: true }
    })

    if (!quest) {
      throw new Error('Quest not found or inactive')
    }

    const userQuest = await prisma.userQuest.upsert({
      where: {
        userId_questId: { userId, questId }
      },
      update: {
        status: 'in_progress',
        updatedAt: new Date()
      },
      create: {
        userId,
        questId,
        status: 'in_progress',
        progress: 0,
        maxProgress: 1
      },
      include: {
        quest: true
      }
    })

    return {
      ...userQuest,
      quest: userQuest.quest
    }
  }

  /**
   * Submit quest completion data
   */
  static async submitQuestCompletion(
    userId: string, 
    questId: string, 
    submissionData?: any
  ): Promise<UserQuestData> {
    const quest = await prisma.quest.findUnique({
      where: { id: questId, isActive: true }
    })

    if (!quest) {
      throw new Error('Quest not found or inactive')
    }

    const userQuest = await prisma.userQuest.findUnique({
      where: {
        userId_questId: { userId, questId }
      }
    })

    if (!userQuest) {
      throw new Error('Quest not started')
    }

    if (userQuest.status === 'completed' || userQuest.status === 'claimed') {
      throw new Error('Quest already completed')
    }

    // Auto-verify certain quest types
    let newStatus = 'completed'
    let completedAt = new Date()

    if (quest.requiresManualVerification) {
      newStatus = 'in_progress' // Keep in progress until manually verified
      completedAt = userQuest.completedAt || new Date()
    }

    const updatedUserQuest = await prisma.userQuest.update({
      where: {
        userId_questId: { userId, questId }
      },
      data: {
        status: newStatus,
        progress: 1,
        submissionData,
        completedAt: newStatus === 'completed' ? completedAt : userQuest.completedAt,
        updatedAt: new Date()
      },
      include: {
        quest: true
      }
    })

    return {
      ...updatedUserQuest,
      quest: updatedUserQuest.quest
    }
  }

  /**
   * Claim quest rewards
   */
  static async claimQuestReward(userId: string, questId: string): Promise<UserQuestData> {
    const userQuest = await prisma.userQuest.findUnique({
      where: {
        userId_questId: { userId, questId }
      },
      include: {
        quest: true
      }
    })

    if (!userQuest) {
      throw new Error('Quest not found')
    }

    if (userQuest.status !== 'completed') {
      throw new Error('Quest not completed')
    }

    if (userQuest.status === 'claimed') {
      throw new Error('Reward already claimed')
    }

    // Award points and update quest status
    await prisma.$transaction(async (tx) => {
      // Update user quest status
      await tx.userQuest.update({
        where: {
          userId_questId: { userId, questId }
        },
        data: {
          status: 'claimed',
          claimedAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Award points to user
      await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            increment: userQuest.quest.points
          }
        }
      })

      // Create points history record
      await tx.pointsHistory.create({
        data: {
          userId,
          pointsAwarded: userQuest.quest.points,
          reason: `Quest completed: ${userQuest.quest.title}`
        }
      })
    })

    const updatedUserQuest = await prisma.userQuest.findUnique({
      where: {
        userId_questId: { userId, questId }
      },
      include: {
        quest: true
      }
    })

    return {
      ...updatedUserQuest!,
      quest: updatedUserQuest!.quest
    }
  }

  /**
   * Check if user follows LayerEdge on X (database-only approach)
   */
  static async checkFollowLayerEdge(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xUsername: true }
    })

    // For now, we'll use a database-only approach
    // In a real implementation, you might store follow relationships
    // or use a manual verification process
    return !!user?.xUsername
  }

  /**
   * Handle redirect-based quest completion
   */
  static async handleRedirectQuest(userId: string, questId: string): Promise<UserQuestData> {
    const quest = await prisma.quest.findUnique({
      where: { id: questId, isActive: true }
    })

    if (!quest) {
      throw new Error('Quest not found or inactive')
    }

    // Start the quest if not already started
    const userQuest = await prisma.userQuest.upsert({
      where: {
        userId_questId: { userId, questId }
      },
      update: {
        status: 'in_progress',
        updatedAt: new Date()
      },
      create: {
        userId,
        questId,
        status: 'in_progress',
        progress: 0,
        maxProgress: 1
      }
    })

    // Award points immediately upon redirect
    await prisma.$transaction(async (tx) => {
      // Award points to user
      await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            increment: quest.points
          }
        }
      })

      // Create points history record
      await tx.pointsHistory.create({
        data: {
          userId,
          pointsAwarded: quest.points,
          reason: `Quest redirect completed: ${quest.title}`
        }
      })
    })

    // Set up 1-minute verification timer (in a real app, you'd use a job queue)
    // For now, we'll mark it as completed immediately and let the verification happen later
    const updatedUserQuest = await prisma.userQuest.update({
      where: {
        userId_questId: { userId, questId }
      },
      data: {
        status: 'completed',
        progress: 1,
        completedAt: new Date(),
        submissionData: {
          redirectedAt: new Date(),
          autoCompleted: true
        },
        updatedAt: new Date()
      },
      include: {
        quest: true
      }
    })

    return {
      ...updatedUserQuest,
      quest: updatedUserQuest.quest
    }
  }

  /**
   * Initialize default quests (run once during setup)
   */
  static async initializeDefaultQuests(): Promise<void> {
    // First, deactivate old quests that we're removing
    await prisma.quest.updateMany({
      where: {
        title: {
          in: ['Share Your Story', 'Invite a Friend', 'Engage and Tweet']
        }
      },
      data: {
        isActive: false
      }
    })

    const defaultQuests = [
      {
        title: 'Follow @LayerEdge on X',
        description: 'Follow our official X account to stay updated with the latest news and announcements. Points are awarded immediately when you visit the profile!',
        type: 'follow_redirect',
        points: 1000,
        sortOrder: 1,
        metadata: {
          targetAccount: '@LayerEdge',
          accountUrl: 'https://x.com/LayerEdge',
          redirectBased: true
        },
        requiresManualVerification: false,
        autoVerifiable: true
      },
      {
        title: 'Join LayerEdge Community',
        description: 'Join our X community to connect with other members and participate in discussions. Points are awarded immediately when you visit the community!',
        type: 'community_redirect',
        points: 1000,
        sortOrder: 2,
        metadata: {
          communityUrl: process.env.LAYEREDGE_COMMUNITY_URL || 'https://x.com/i/communities/1890107751621357663',
          redirectBased: true
        },
        requiresManualVerification: false,
        autoVerifiable: true
      }
    ]

    for (const questData of defaultQuests) {
      await prisma.quest.upsert({
        where: {
          title: questData.title
        },
        update: {
          description: questData.description,
          type: questData.type,
          points: questData.points,
          sortOrder: questData.sortOrder,
          metadata: questData.metadata,
          requiresManualVerification: questData.requiresManualVerification,
          autoVerifiable: questData.autoVerifiable,
          isActive: true
        },
        create: questData
      })
    }
  }
}
