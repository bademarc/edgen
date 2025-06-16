/**
 * Test component to verify quest system icons are properly imported
 * This helps ensure no runtime errors occur with icon references
 */

import React from 'react'
import { QuestSystem } from '@/components/ui/quest-system'
import { QuestCard } from '@/components/ui/quest-card'

// Mock quest data for testing
const mockQuest = {
  questId: 'test-quest',
  quest: {
    id: 'test',
    title: 'Test Quest',
    description: 'Test quest description',
    type: 'follow' as const,
    points: 100,
    metadata: {}
  },
  status: 'not_started' as const,
  progress: 0,
  maxProgress: 1,
  startedAt: null,
  completedAt: null,
  claimedAt: null,
  submissionData: null
}

export function QuestSystemTest() {
  const handleStart = async (questId: string) => {
    console.log('Start quest:', questId)
  }

  const handleSubmit = async (questId: string, submissionData?: any) => {
    console.log('Submit quest:', questId, submissionData)
  }

  const handleClaim = async (questId: string) => {
    console.log('Claim quest:', questId)
  }

  const handleRedirect = async (questId: string) => {
    console.log('Redirect quest:', questId)
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Quest System Icon Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quest System Component</h2>
        <QuestSystem />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quest Card Component</h2>
        <div className="max-w-md">
          <QuestCard
            quest={mockQuest}
            onStart={handleStart}
            onSubmit={handleSubmit}
            onClaim={handleClaim}
            onRedirect={handleRedirect}
          />
        </div>
      </div>
    </div>
  )
}

export default QuestSystemTest
