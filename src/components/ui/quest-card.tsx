'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Progress } from './progress'
import { Input } from './input'
import { Textarea } from './textarea'
import { Label } from './label'
import {
  Check,
  Clock,
  Lock,
  Sparkles,
  Users,
  MessageCircle,
  Heart,
  Share,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserQuestData } from '@/lib/quest-service'

interface QuestCardProps {
  quest: UserQuestData
  onStart: (questId: string) => Promise<void>
  onSubmit: (questId: string, submissionData?: any) => Promise<void>
  onClaim: (questId: string) => Promise<void>
  onRedirect: (questId: string) => Promise<void>
  isLoading?: boolean
}

const questIcons = {
  follow: Users,
  follow_redirect: Users,
  join_community: Heart,
  community_redirect: Heart,
  engage_tweet: MessageCircle,
  custom: Sparkles,
  referral: Share
}

const statusColors = {
  not_started: 'text-muted-foreground',
  in_progress: 'text-warning',
  completed: 'text-success',
  claimed: 'text-primary'
}

const statusBadges = {
  not_started: { variant: 'outline' as const, text: 'Not Started' },
  in_progress: { variant: 'warning' as const, text: 'In Progress' },
  completed: { variant: 'success' as const, text: 'Completed' },
  claimed: { variant: 'layeredge' as const, text: 'Claimed' }
}

export function QuestCard({ quest, onStart, onSubmit, onClaim, onRedirect, isLoading = false }: QuestCardProps) {
  const [submissionData, setSubmissionData] = useState<any>({})
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)

  const Icon = questIcons[quest.quest.type as keyof typeof questIcons] || Sparkles
  const progress = quest.maxProgress > 0 ? (quest.progress / quest.maxProgress) * 100 : 0
  const statusBadge = statusBadges[quest.status]

  const handleStart = async () => {
    await onStart(quest.questId)
  }

  const handleSubmit = async () => {
    await onSubmit(quest.questId, submissionData)
    setShowSubmissionForm(false)
    setSubmissionData({})
  }

  const handleClaim = async () => {
    await onClaim(quest.questId)
  }

  const handleRedirect = async (url: string) => {
    // Open the URL in a new tab
    window.open(url, '_blank', 'noopener,noreferrer')

    // Award points immediately
    await onRedirect(quest.questId)
  }

  const renderSubmissionForm = () => {
    switch (quest.quest.type) {
      case 'follow':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Your X Username</Label>
              <Input
                id="username"
                placeholder="@yourusername"
                value={submissionData.username || ''}
                onChange={(e) => setSubmissionData({ ...submissionData, username: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Confirm you've followed @LayerEdge
              </p>
            </div>
          </div>
        )

      case 'follow_redirect':
      case 'community_redirect':
        // These quest types don't need submission forms - they're redirect-based
        return null

      case 'join_community':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="communityProof">Community Join Confirmation</Label>
              <Textarea
                id="communityProof"
                placeholder="Confirm you've joined the LayerEdge community..."
                value={submissionData.communityProof || ''}
                onChange={(e) => setSubmissionData({ ...submissionData, communityProof: e.target.value })}
              />
            </div>
          </div>
        )

      case 'engage_tweet':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="tweetUrl">Tweet URL</Label>
              <Input
                id="tweetUrl"
                placeholder="https://x.com/yourusername/status/..."
                value={submissionData.tweetUrl || ''}
                onChange={(e) => setSubmissionData({ ...submissionData, tweetUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Share the URL of your LayerEdge tweet
              </p>
            </div>
          </div>
        )

      case 'custom':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="story">Your Story</Label>
              <Textarea
                id="story"
                placeholder="Share why you're excited about LayerEdge..."
                value={submissionData.story || ''}
                onChange={(e) => setSubmissionData({ ...submissionData, story: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 100 characters
              </p>
            </div>
          </div>
        )

      case 'referral':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="referralCode">Referral Details</Label>
              <Input
                id="referralCode"
                placeholder="Friend's username or referral proof"
                value={submissionData.referralCode || ''}
                onChange={(e) => setSubmissionData({ ...submissionData, referralCode: e.target.value })}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderActionButton = () => {
    if (quest.status === 'claimed') {
      return (
        <Button variant="layeredge" disabled className="w-full">
          <Check className="h-4 w-4 mr-2" />
          Claimed
        </Button>
      )
    }

    if (quest.status === 'completed') {
      return (
        <Button
          variant="layeredge"
          onClick={handleClaim}
          disabled={isLoading}
          className="w-full"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Claim {quest.quest.points} Points
        </Button>
      )
    }

    // Handle redirect-based quests
    if (quest.quest.type === 'follow_redirect' || quest.quest.type === 'community_redirect') {
      if (quest.status === 'not_started') {
        const redirectUrl = quest.quest.type === 'follow_redirect'
          ? quest.quest.metadata?.accountUrl
          : quest.quest.metadata?.communityUrl

        return (
          <Button
            variant="layeredge"
            onClick={() => handleRedirect(redirectUrl)}
            disabled={isLoading || !redirectUrl}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit & Earn {quest.quest.points} Points
          </Button>
        )
      }
    }

    if (quest.status === 'in_progress') {
      if (showSubmissionForm) {
        return (
          <div className="space-y-3">
            {renderSubmissionForm()}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSubmissionForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="layeredge"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1"
              >
                Submit
              </Button>
            </div>
          </div>
        )
      }

      return (
        <Button
          variant="layeredge"
          onClick={() => setShowSubmissionForm(true)}
          disabled={isLoading}
          className="w-full"
        >
          Submit Completion
        </Button>
      )
    }

    return (
      <Button
        variant="outline"
        onClick={handleStart}
        disabled={isLoading}
        className="w-full"
      >
        Start Quest
      </Button>
    )
  }

  const renderQuestMetadata = () => {
    if ((quest.quest.type === 'follow' || quest.quest.type === 'follow_redirect') && quest.quest.metadata?.accountUrl) {
      return (
        <a
          href={quest.quest.metadata.accountUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          Visit @LayerEdge
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      )
    }

    if ((quest.quest.type === 'join_community' || quest.quest.type === 'community_redirect') && quest.quest.metadata?.communityUrl) {
      return (
        <a
          href={quest.quest.metadata.communityUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          Join Community
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      )
    }

    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="layeredge" className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-3 rounded-xl border",
                quest.status === 'claimed' 
                  ? "text-primary border-primary bg-primary/10" 
                  : "text-muted-foreground border-muted bg-muted/20"
              )}>
                {quest.status === 'claimed' ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{quest.quest.title}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge {...statusBadge} size="sm">
                    {statusBadge.text}
                  </Badge>
                  <Badge variant="points" size="sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {quest.quest.points}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-muted-foreground">
            {quest.quest.description}
          </p>

          {renderQuestMetadata()}

          {quest.status === 'in_progress' && quest.maxProgress > 1 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground font-medium">
                  {quest.progress} / {quest.maxProgress}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {renderActionButton()}
        </CardContent>
      </Card>
    </motion.div>
  )
}
