import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { QuestService } from '@/lib/quest-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Quest API: Fetching user quests')
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      console.log('❌ Quest API: No authenticated user')
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to view quests' },
        { status: 401 }
      )
    }

    console.log('✅ Quest API: Authenticated user:', userId)

    try {
      const userQuests = await QuestService.getUserQuests(userId)
      console.log('✅ Quest API: Successfully fetched quests:', userQuests.length)

      return NextResponse.json({
        success: true,
        quests: userQuests
      })
    } catch (questError) {
      console.error('❌ Quest API: Error fetching user quests:', questError)
      return NextResponse.json(
        {
          error: 'Failed to fetch quests',
          message: 'Unable to load quest data. Please try again.',
          details: questError instanceof Error ? questError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Quest API: Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Quest API POST: Processing quest action')
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      console.log('❌ Quest API POST: No authenticated user')
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to perform quest actions' },
        { status: 401 }
      )
    }

    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error('❌ Quest API POST: Invalid JSON:', parseError)
      return NextResponse.json(
        { error: 'Invalid request', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { action, questId, submissionData } = requestBody
    console.log('✅ Quest API POST: Action:', action, 'QuestId:', questId, 'UserId:', userId)

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action', message: 'Action parameter is required' },
        { status: 400 }
      )
    }

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
