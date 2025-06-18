'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  MessageSquare, 
  Trophy, 
  TrendingUp,
  Activity,
  Clock,
  Target,
  Zap
} from 'lucide-react'

interface PlatformStats {
  totalUsers: number
  totalTweets: number
  totalPoints: number
  tweetsWithMentions: number
  activeUsers: number
  recentTweets: number
  averagePointsPerUser: number
  engagementRate: number
  lastUpdated: string
}

export function PlatformStatistics() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/platform/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError('Failed to load statistics')
      console.error('Error fetching platform stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
      let startTime: number
      let animationFrame: number
      let isMounted = true

      const animate = (timestamp: number) => {
        if (!isMounted) return

        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)

        setCount(Math.floor(progress * value))

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate)
        }
      }

      // PRODUCTION FIX: Only animate when component is visible
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
            animationFrame = requestAnimationFrame(animate)
          }
        },
        { threshold: 0.1 }
      )

      const element = document.getElementById(`counter-${value}`)
      if (element) observer.observe(element)

      return () => {
        isMounted = false
        if (animationFrame) cancelAnimationFrame(animationFrame)
        observer.disconnect()
      }
    }, [value, duration, isVisible])

    return <span id={`counter-${value}`}>{formatNumber(count)}</span>
  }

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Platform Statistics</h2>
            <p className="text-muted-foreground text-lg">Loading community metrics...</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || !stats) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Platform Statistics</h2>
          <p className="text-muted-foreground">Unable to load statistics at this time.</p>
        </div>
      </section>
    )
  }

  const statItems = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      description: 'Registered members'
    },
    {
      title: 'Tweets Tracked',
      value: stats.tweetsWithMentions,
      icon: MessageSquare,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      description: 'With @layeredge/$EDGEN'
    },
    {
      title: 'Total Points',
      value: stats.totalPoints,
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      description: 'Awarded to community'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      description: 'Contributing members'
    },
    {
      title: 'Recent Activity',
      value: stats.recentTweets,
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      description: 'Tweets (24h)'
    },
    {
      title: 'Engagement Rate',
      value: stats.engagementRate,
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      description: '% active users',
      suffix: '%'
    },
    {
      title: 'Avg Points/User',
      value: stats.averagePointsPerUser,
      icon: Target,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      description: 'Per member'
    },
    {
      title: 'All Submissions',
      value: stats.totalTweets,
      icon: Zap,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      description: 'Total tweets'
    }
  ]

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-muted/30 mobile-section-padding platform-stats-mobile">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4 sm:px-2 mobile-text-spacing">Platform Statistics</h2>
          <p className="text-muted-foreground text-base sm:text-lg mb-3 sm:mb-4 px-4 sm:px-2 mobile-text-spacing leading-relaxed">
            Real-time metrics from the LayerEdge community
          </p>
          <Badge variant="outline" className="text-xs">
            Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
          </Badge>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mobile-grid-spacing">
          {statItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="metrics-card-mobile"
            >
              <Card className="hover:shadow-lg transition-all duration-300 touch-friendly mobile-card-padding">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 sm:px-6 pt-5 sm:pt-6 card-header-mobile">
                  <CardTitle className="text-xs sm:text-sm font-medium leading-tight pr-2 metrics-text-safe">{item.title}</CardTitle>
                  <div className={`p-1.5 sm:p-2 rounded-lg ${item.bgColor} flex-shrink-0`}>
                    <item.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${item.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 card-content-mobile">
                  <div className={`text-lg sm:text-xl md:text-2xl font-bold ${item.color} mb-1 metrics-text-safe`}>
                    <AnimatedCounter value={item.value} />
                    {item.suffix || ''}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed metrics-text-safe">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
