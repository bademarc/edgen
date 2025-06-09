'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  SparklesIcon,
  ArrowRightIcon,
  TrophyIcon,
  HeartIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface SubmitTweetCTAProps {
  className?: string
  variant?: 'default' | 'prominent' | 'compact'
  showPointsBreakdown?: boolean
}

export function SubmitTweetCTA({
  className = '',
  variant = 'default',
  showPointsBreakdown = true
}: SubmitTweetCTAProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Validate props
  if (!variant || !['default', 'prominent', 'compact'].includes(variant)) {
    console.warn('SubmitTweetCTA: Invalid variant prop, falling back to "default"')
    variant = 'default'
  }

  const pointsData = [
    { icon: SparklesIcon, label: 'Base submission', points: 5, color: 'text-primary' },
    { icon: HeartIcon, label: 'Per like', points: 1, color: 'text-red-500' },
    { icon: ArrowPathIcon, label: 'Per retweet', points: 3, color: 'text-green-500' },
    { icon: ChatBubbleLeftIcon, label: 'Per reply', points: 2, color: 'text-blue-500' },
  ]

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={className}
      >
        <Button asChild variant="layeredge" size="lg" className="w-full">
          <Link href="/submit" className="flex items-center space-x-2">
            <PlusIcon className="h-5 w-5" />
            <span>Submit Tweet</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    )
  }

  if (variant === 'prominent') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={className}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Card variant="accent" className="overflow-hidden relative">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5">
            <motion.div
              className="absolute inset-0"
              animate={{
                background: isHovered
                  ? 'radial-gradient(circle at 50% 50%, rgba(247,147,26,0.15) 0%, transparent 70%)'
                  : 'radial-gradient(circle at 0% 0%, rgba(247,147,26,0.1) 0%, transparent 50%)'
              }}
              transition={{ duration: 0.6 }}
            />
          </div>

          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: isHovered ? 360 : 0 }}
                  transition={{ duration: 0.6 }}
                  className="p-3 rounded-xl bg-primary/10 border border-primary/20"
                >
                  <SparklesIcon className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <CardTitle className="text-xl font-bold">Submit Your LayerEdge Tweet</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Share your engagement and earn points instantly
                  </p>
                </div>
              </div>
              <Badge variant="layeredge" className="text-sm px-3 py-1">
                Earn Points
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6">
            {showPointsBreakdown && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {pointsData.map((item, index) => {
                  const IconComponent = item.icon
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                    >
                      <IconComponent className={`h-5 w-5 mx-auto mb-2 ${item.color}`} />
                      <div className="text-lg font-bold">{item.points > 1 ? '+' : ''}{item.points}</div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="layeredge" size="lg" className="flex-1">
                <Link href="/submit-tweet" className="flex items-center justify-center space-x-2">
                  <SparklesIcon className="h-5 w-5" />
                  <span>Submit Tweet Now</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/recent" className="flex items-center space-x-2">
                  <TrophyIcon className="h-4 w-4" />
                  <span>View Leaderboard</span>
                </Link>
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Pro tip:</strong> Tweets mentioning <span className="text-primary font-semibold">@layeredge</span> or <span className="text-primary font-semibold">$EDGEN</span> earn bonus points!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={className}
      whileHover={{ scale: 1.01 }}
    >
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <SparklesIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Submit New Tweet</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Share your LayerEdge engagement
                </p>
              </div>
            </div>
            <Badge variant="outline">Earn Points</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {showPointsBreakdown && (
            <div className="grid grid-cols-4 gap-2">
              {pointsData.map((item) => {
                const IconComponent = item.icon
                return (
                  <div key={item.label} className="text-center p-2 rounded border bg-card/50">
                    <IconComponent className={`h-4 w-4 mx-auto mb-1 ${item.color}`} />
                    <div className="text-sm font-bold">{item.points > 1 ? '+' : ''}{item.points}</div>
                    <div className="text-xs text-muted-foreground truncate">{item.label}</div>
                  </div>
                )
              })}
            </div>
          )}

          <Button asChild variant="layeredge" size="lg" className="w-full">
            <Link href="/submit-tweet" className="flex items-center justify-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Submit Tweet</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Mention <span className="text-primary">@layeredge</span> or <span className="text-primary">$EDGEN</span> to qualify
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
