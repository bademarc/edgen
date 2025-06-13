import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkQuests() {
  try {
    console.log('🔍 Checking existing quests in database...');
    
    const quests = await prisma.quest.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    
    console.log(`📊 Found ${quests.length} quests in database:`);
    
    if (quests.length < 5) {
      console.log(`⚠️ Only ${quests.length} quests found, expected 5`);
      console.log('🚀 Attempting to create missing default quests...');

      await createDefaultQuests();
    } else {
      console.log('✅ All quests found:');
      quests.forEach((quest, index) => {
        console.log(`${index + 1}. ${quest.title} (${quest.points} points) - Active: ${quest.isActive}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking quests:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function createDefaultQuests() {
  const defaultQuests = [
    {
      title: 'Follow @LayerEdge on X',
      description: 'Follow our official X account to stay updated with the latest news and announcements.',
      type: 'follow',
      points: 1000,
      sortOrder: 1,
      metadata: {
        targetAccount: '@LayerEdge',
        accountUrl: 'https://x.com/LayerEdge'
      },
      requiresManualVerification: true,
      autoVerifiable: false
    },
    {
      title: 'Join LayerEdge Community',
      description: 'Join our X community to connect with other members and participate in discussions.',
      type: 'join_community',
      points: 1000,
      sortOrder: 2,
      metadata: {
        communityUrl: 'https://x.com/i/communities/1890107751621357663'
      },
      requiresManualVerification: true,
      autoVerifiable: false
    },
    {
      title: 'Engage and Tweet',
      description: 'Engage with LayerEdge content and share your first tweet about LayerEdge.',
      type: 'engage_tweet',
      points: 1000,
      sortOrder: 3,
      metadata: {
        requiredMentions: ['@LayerEdge', '#LayerEdge'],
        minEngagements: 1
      },
      requiresManualVerification: true,
      autoVerifiable: false
    },
    {
      title: 'Share Your Story',
      description: 'Share why you\'re excited about decentralized AI and LayerEdge\'s mission.',
      type: 'custom',
      points: 1500,
      sortOrder: 4,
      metadata: {
        submissionType: 'text',
        minLength: 100
      },
      requiresManualVerification: true,
      autoVerifiable: false
    },
    {
      title: 'Invite a Friend',
      description: 'Invite a friend to join LayerEdge and earn bonus points when they complete their first quest.',
      type: 'referral',
      points: 2000,
      sortOrder: 5,
      metadata: {
        referralBonus: 500
      },
      requiresManualVerification: true,
      autoVerifiable: false
    }
  ];

  for (const questData of defaultQuests) {
    try {
      // Check if quest already exists
      const existingQuest = await prisma.quest.findFirst({
        where: { title: questData.title }
      });

      if (existingQuest) {
        console.log(`⚠️ Quest already exists: ${questData.title}`);
        continue;
      }

      const quest = await prisma.quest.create({
        data: questData
      });
      console.log(`✅ Created quest: ${quest.title}`);
    } catch (error) {
      console.error(`❌ Error creating quest ${questData.title}:`, error.message);
    }
  }
  
  console.log('🎉 Default quests initialization completed!');
}

checkQuests();
