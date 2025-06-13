import { NextRequest, NextResponse } from 'next/server'
import { QuestService } from '@/lib/quest-service'

export async function POST(request: NextRequest) {
  try {
    // Check for admin secret
    const { secret } = await request.json()
    
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await QuestService.initializeDefaultQuests()

    return NextResponse.json({
      success: true,
      message: 'Default quests initialized successfully'
    })
  } catch (error) {
    console.error('Error initializing quests:', error)
    return NextResponse.json(
      { error: 'Failed to initialize quests' },
      { status: 500 }
    )
  }
}
