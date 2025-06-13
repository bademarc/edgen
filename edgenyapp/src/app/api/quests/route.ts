import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { QuestService } from '@/lib/quest-service'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userQuests = await QuestService.getUserQuests(userId)

    return NextResponse.json({
      success: true,
      quests: userQuests
    })
  } catch (error) {
    console.error('Error fetching quests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action, questId, submissionData } = await request.json()

    switch (action) {
      case 'start':
        if (!questId) {
          return NextResponse.json(
            { error: 'Quest ID is required' },
            { status: 400 }
          )
        }

        const startedQuest = await QuestService.startQuest(userId, questId)
        return NextResponse.json({
          success: true,
          quest: startedQuest
        })

      case 'redirect':
        if (!questId) {
          return NextResponse.json(
            { error: 'Quest ID is required' },
            { status: 400 }
          )
        }

        const redirectQuest = await QuestService.handleRedirectQuest(userId, questId)
        return NextResponse.json({
          success: true,
          quest: redirectQuest,
          message: `Congratulations! You earned ${redirectQuest.quest.points} points!`,
          refreshUser: true // Signal frontend to refresh user data
        })

      case 'submit':
        if (!questId) {
          return NextResponse.json(
            { error: 'Quest ID is required' },
            { status: 400 }
          )
        }

        const submittedQuest = await QuestService.submitQuestCompletion(
          userId,
          questId,
          submissionData
        )
        return NextResponse.json({
          success: true,
          quest: submittedQuest
        })

      case 'claim':
        if (!questId) {
          return NextResponse.json(
            { error: 'Quest ID is required' },
            { status: 400 }
          )
        }

        const claimedQuest = await QuestService.claimQuestReward(userId, questId)
        return NextResponse.json({
          success: true,
          quest: claimedQuest,
          message: `Congratulations! You earned ${claimedQuest.quest.points} points!`,
          refreshUser: true // Signal frontend to refresh user data
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing quest action:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process quest action' },
      { status: 500 }
    )
  }
}
