'use client'

import { motion } from 'framer-motion'
import { QuestSystem } from '@/components/ui/quest-system'
import { QuestErrorBoundary } from '@/components/ui/quest-error-boundary'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  Sparkles,
  Rocket
} from 'lucide-react'
import Link from 'next/link'

export default function QuestsPage() {
  const { user, isLoading, signInWithTwitter } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quest system...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hero Section */}
            <div className="mb-12">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                  <Trophy className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                LayerEdge Quests
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Complete quests to earn points, climb the leaderboard, and become part of the LayerEdge community.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card variant="layeredge">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Earn Points</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete quests to earn up to 1000+ points each and climb the leaderboard.
                  </p>
                </CardContent>
              </Card>

              <Card variant="layeredge">
                <CardContent className="p-6 text-center">
                  <Rocket className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Join Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with LayerEdge on X and join our growing community of AI enthusiasts.
                  </p>
                </CardContent>
              </Card>

              <Card variant="layeredge">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Unlock Rewards</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn achievements and unlock exclusive rewards as you progress through quests.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Section */}
            <Card variant="glass">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Start Your Quest Journey?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Sign in with your X account to access quests and start earning points today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="layeredge"
                    size="lg"
                    onClick={() => signInWithTwitter()}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in with X'}
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/about">Learn More</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <QuestErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Quests</h1>
                <p className="text-muted-foreground">
                  Complete quests to earn points and grow the LayerEdge community
                </p>
              </div>
            </div>
          </motion.div>

          <QuestSystem />
        </div>
      </div>
    </QuestErrorBoundary>
  )
}
