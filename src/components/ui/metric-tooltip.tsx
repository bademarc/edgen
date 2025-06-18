'use client'

import React from 'react'
import { HelpCircle, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MetricTooltipProps {
  title: string
  description: string
  calculation?: string
  children: React.ReactNode
  variant?: 'info' | 'help'
}

export function MetricTooltip({ 
  title, 
  description, 
  calculation, 
  children, 
  variant = 'info' 
}: MetricTooltipProps) {
  const Icon = variant === 'help' ? HelpCircle : Info

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            {children}
            <Icon className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-4 bg-card border border-border shadow-lg"
          sideOffset={5}
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
            {calculation && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground font-mono">
                  {calculation}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Predefined metric tooltips for common dashboard metrics
export const MetricTooltips = {
  TrustScore: ({ children }: { children: React.ReactNode }) => (
    <MetricTooltip
      title="Trust Score"
      description="Your Trust Score reflects your engagement level and contribution quality to the LayerEdge community. It's calculated from your total earned points through tweet submissions and community interactions."
      calculation="Total Points = Base Points (5 per tweet) + Engagement Bonus (likes + retweets × 3 + replies × 2)"
    >
      {children}
    </MetricTooltip>
  ),

  NetworkRank: ({ children }: { children: React.ReactNode }) => (
    <MetricTooltip
      title="Network Rank"
      description="Your position among all LayerEdge community members, ranked by total points earned. Higher engagement and quality contributions improve your rank."
      calculation="Rank = Position sorted by Total Points (descending) + Join Date (ascending for ties)"
    >
      {children}
    </MetricTooltip>
  ),

  Contributions: ({ children }: { children: React.ReactNode }) => (
    <MetricTooltip
      title="Contributions"
      description="Total number of tweets you've submitted to the LayerEdge platform. Each verified tweet containing @layeredge or $EDGEN mentions counts as a contribution."
    >
      {children}
    </MetricTooltip>
  ),

  WeeklyPoints: ({ children }: { children: React.ReactNode }) => (
    <MetricTooltip
      title="Weekly Points"
      description="Points earned in the current week (Monday to Sunday). This includes base submission points plus engagement bonuses from likes, retweets, and replies."
      calculation="Weekly Points = Points earned from Monday 00:00 UTC to current time"
    >
      {children}
    </MetricTooltip>
  )
}
