import { motion } from 'framer-motion'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { formatNumber } from '@/lib/utils'

interface PointsProgressProps {
  currentPoints: number
  nextMilestone?: number
  rank?: number
  className?: string
}

export function PointsProgress({ 
  currentPoints, 
  nextMilestone, 
  rank, 
  className = '' 
}: PointsProgressProps) {
  // Calculate next milestone if not provided
  const milestone = nextMilestone || Math.ceil(currentPoints / 1000) * 1000 + 1000
  const progress = (currentPoints / milestone) * 100
  const pointsToNext = milestone - currentPoints

  return (
    <div className={`bg-card border border-border rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Your Progress</h3>
        </div>
        {rank && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Rank</p>
            <p className="text-xl font-bold text-accent">#{rank}</p>
          </div>
        )}
      </div>

      {/* Current Points */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-primary">
          {formatNumber(currentPoints)}
        </p>
        <p className="text-sm text-muted-foreground">Total Points</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>{formatNumber(currentPoints)}</span>
          <span>{formatNumber(milestone)}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {pointsToNext > 0 ? (
            <>
              <span className="font-medium text-primary">{formatNumber(pointsToNext)}</span> points to next milestone
            </>
          ) : (
            'Milestone reached! 🎉'
          )}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">5</p>
          <p className="text-xs text-muted-foreground">Base Points</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">+1</p>
          <p className="text-xs text-muted-foreground">Per Like</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">+3</p>
          <p className="text-xs text-muted-foreground">Per Retweet</p>
        </div>
      </div>
    </div>
  )
}
