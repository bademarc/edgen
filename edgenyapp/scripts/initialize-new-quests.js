import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initializeNewQuests() {
  try {
    console.log('🚀 Initializing new quest system...')

    // First, deactivate old quests that we're removing
    console.log('📝 Deactivating old quests...')
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

    console.log('✨ Creating/updating new quests...')
    for (const questData of defaultQuests) {
      const quest = await prisma.quest.upsert({
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
      console.log(`✅ Quest "${quest.title}" initialized`)
    }

    // Show current active quests
    console.log('\n📋 Current active quests:')
    const activeQuests = await prisma.quest.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    activeQuests.forEach(quest => {
      console.log(`  - ${quest.title} (${quest.type}) - ${quest.points} points`)
    })

    console.log('\n🎉 Quest system initialization completed successfully!')

  } catch (error) {
    console.error('❌ Error initializing quests:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

initializeNewQuests()
  .catch((error) => {
    console.error('Failed to initialize quests:', error)
    process.exit(1)
  })
