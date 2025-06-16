'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { QuestCard } from './quest-card'
import {
  Trophy,
  Sparkles,
  Clock,
  Check,
  RotateCcw
} from 'lucide-react'
import { ArrowPathIcon, ClockIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { UserQuestData } from '@/lib/quest-service'
import { toast } from 'sonner'


interface QuestSystemProps {
  className?: string
}

export function QuestSystem({ className }: QuestSystemProps) {
  const [quests, setQuests] = useState<UserQuestData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)


  useEffect(() => {
    fetchQuests()
  }, [])

  const fetchQuests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/quests')
      const data = await response.json()

      if (data.success) {
        setQuests(data.quests)
      } else if (response.status === 401) {
        // Authentication required - this is expected for unauthenticated users
        console.log('Authentication required for quests')
        setQuests([])
      } else {
        console.error('Quest fetch error:', data)
        toast.error(data.message || 'Failed to load quests')
      }
    } catch (error) {
      console.error('Error fetching quests:', error)
      toast.error('Failed to load quests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestAction = async (action: string, questId: string, submissionData?: any) => {
    try {
      setActionLoading(true)
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          questId,
          submissionData
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update the quest in the local state
        setQuests(prevQuests => 
          prevQuests.map(quest => 
            quest.questId === questId ? data.quest : quest
          )
        )

        if (action === 'claim') {
          toast.success(data.message || 'Quest completed!')
        } else if (action === 'redirect') {
          toast.success(data.message || 'Quest completed! Points awarded!')
        } else if (action === 'submit') {
          toast.success('Quest submitted for verification!')
        } else if (action === 'start') {
          toast.success('Quest started!')
        }
      } else {
        toast.error(data.error || 'Failed to process quest action')
      }
    } catch (error) {
      console.error('Error processing quest action:', error)
      toast.error('Failed to process quest action')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartQuest = async (questId: string) => {
    await handleQuestAction('start', questId)
  }

  const handleSubmitQuest = async (questId: string, submissionData?: any) => {
    await handleQuestAction('submit', questId, submissionData)
  }

  const handleClaimQuest = async (questId: string) => {
    await handleQuestAction('claim', questId)
  }

  const handleRedirectQuest = async (questId: string) => {
    await handleQuestAction('redirect', questId)
  }

  const questStats = {
    total: quests.length,
    completed: quests.filter(q => q.status === 'completed' || q.status === 'claimed').length,
    claimed: quests.filter(q => q.status === 'claimed').length,
    inProgress: quests.filter(q => q.status === 'in_progress').length,
    totalPoints: quests.filter(q => q.status === 'claimed').reduce((sum, q) => sum + q.quest.points, 0),
    availablePoints: quests.filter(q => q.status !== 'claimed').reduce((sum, q) => sum + q.quest.points, 0)
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center py-12">
          <RotateCcw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Quest Stats Overview */}
      <Card variant="layeredge">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span>Quest Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{questStats.claimed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{questStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Quests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{questStats.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Points Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{questStats.availablePoints}</div>
              <div className="text-sm text-muted-foreground">Points Available</div>
            </div>
          </div>

          {questStats.total > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Overall Progress</span>
                <span>{questStats.claimed} / {questStats.total}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(questStats.claimed / questStats.total) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quest Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Available Quests</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQuests}
            disabled={isLoading}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="cursor-pointer">
            All ({questStats.total})
          </Badge>
          <Badge variant="warning" className="cursor-pointer">
            <ClockIcon className="h-3 w-3 mr-1" />
            In Progress ({questStats.inProgress})
          </Badge>
          <Badge variant="success" className="cursor-pointer">
            <CheckIcon className="h-3 w-3 mr-1" />
            Completed ({questStats.completed})
          </Badge>
          <Badge variant="layeredge" className="cursor-pointer">
            <SparklesIcon className="h-3 w-3 mr-1" />
            Claimed ({questStats.claimed})
          </Badge>
        </div>
      </div>



      {/* Quest Grid */}
      {quests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((quest) => (
            <QuestCard
              key={quest.questId}
              quest={quest}
              onStart={handleStartQuest}
              onSubmit={handleSubmitQuest}
              onClaim={handleClaimQuest}
              onRedirect={handleRedirectQuest}
              isLoading={actionLoading}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Quests Available</h3>
            <p className="text-muted-foreground">
              Check back later for new quests and opportunities to earn points!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card variant="glass">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">How Quests Work</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Start a quest</strong> to begin tracking your progress</p>
            <p>• <strong>Complete the requirements</strong> and submit proof when needed</p>
            <p>• <strong>Claim your rewards</strong> once the quest is verified</p>
            <p>• <strong>Earn points</strong> to climb the leaderboard and unlock achievements</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
