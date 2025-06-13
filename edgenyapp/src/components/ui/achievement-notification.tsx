'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrophyIcon,
  XMarkIcon,
  ShareIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { SocialSharingService } from '@/lib/social-sharing'
import { toast } from 'sonner'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
  category: 'engagement' | 'community' | 'milestone' | 'special'
}

interface AchievementNotificationProps {
  achievement: Achievement | null
  onDismiss: () => void
  autoHide?: boolean
  autoHideDelay?: number
}

const rarityColors = {
  common: 'bg-gray-500/10 border-gray-500/30 text-gray-600',
  rare: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
  epic: 'bg-purple-500/10 border-purple-500/30 text-purple-600',
  legendary: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600',
}

const rarityGradients = {
  common: 'from-gray-500/20 to-gray-600/20',
  rare: 'from-blue-500/20 to-blue-600/20',
  epic: 'from-purple-500/20 to-purple-600/20',
  legendary: 'from-yellow-500/20 to-yellow-600/20',
}

export function AchievementNotification({ 
  achievement, 
  onDismiss, 
  autoHide = true, 
  autoHideDelay = 8000 
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)

      if (autoHide) {
        const timer = setTimeout(() => {
          handleDismiss()
        }, autoHideDelay)

        return () => clearTimeout(timer)
      }
    }

    // Return undefined for other cases
    return undefined
  }, [achievement, autoHide, autoHideDelay])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      onDismiss()
    }, 300) // Wait for exit animation
  }

  const handleShare = async () => {
    if (!achievement) return

    const shareText = SocialSharingService.generateAchievementShareText({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      points: achievement.points,
      rarity: achievement.rarity,
    })

    try {
      await SocialSharingService.shareWithFallback(
        {
          title: `Achievement Unlocked: ${achievement.name}`,
          text: shareText,
          url: window.location.href,
        },
        shareText
      )
      toast.success('Achievement shared!')
    } catch (error) {
      toast.error('Failed to share achievement')
    }
  }

  if (!achievement) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.5 
          }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <Card className="overflow-hidden border-2 shadow-2xl">
            {/* Animated Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${rarityGradients[achievement.rarity]} opacity-50`}>
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'radial-gradient(circle at 0% 0%, rgba(247,147,26,0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 100% 100%, rgba(247,147,26,0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 0% 100%, rgba(247,147,26,0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 100% 0%, rgba(247,147,26,0.1) 0%, transparent 50%)',
                  ]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>

            <CardContent className="relative p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: 2,
                      delay: 0.5 
                    }}
                    className="text-3xl"
                  >
                    {achievement.icon}
                  </motion.div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <TrophyIcon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        Achievement Unlocked
                      </span>
                    </div>
                    <Badge 
                      className={`${rarityColors[achievement.rarity]} text-xs uppercase tracking-wide`}
                    >
                      {achievement.rarity}
                    </Badge>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-8 w-8 p-0 hover:bg-background/80"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Achievement Details */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">
                    {achievement.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {achievement.description}
                  </p>
                </div>

                {/* Points */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <SparklesIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">
                      +{achievement.points} points earned!
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="h-8"
                  >
                    <ShareIcon className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                </div>

                {/* Category */}
                <div className="text-xs text-muted-foreground capitalize">
                  {achievement.category} achievement
                </div>
              </div>

              {/* Celebration Particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-primary rounded-full"
                    initial={{ 
                      x: '50%', 
                      y: '50%', 
                      scale: 0,
                      opacity: 1 
                    }}
                    animate={{ 
                      x: `${50 + (Math.random() - 0.5) * 200}%`,
                      y: `${50 + (Math.random() - 0.5) * 200}%`,
                      scale: [0, 1, 0],
                      opacity: [1, 1, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      delay: i * 0.2,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for managing achievement notifications
export function useAchievementNotifications() {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([])

  const showAchievement = (achievement: Achievement) => {
    if (currentAchievement) {
      // Add to queue if one is already showing
      setAchievementQueue(prev => [...prev, achievement])
    } else {
      setCurrentAchievement(achievement)
    }
  }

  const dismissCurrent = () => {
    setCurrentAchievement(null)
    
    // Show next in queue
    setTimeout(() => {
      if (achievementQueue.length > 0) {
        const [next, ...rest] = achievementQueue
        setCurrentAchievement(next)
        setAchievementQueue(rest)
      }
    }, 500)
  }

  const clearAll = () => {
    setCurrentAchievement(null)
    setAchievementQueue([])
  }

  return {
    currentAchievement,
    showAchievement,
    dismissCurrent,
    clearAll,
    queueLength: achievementQueue.length,
  }
}
