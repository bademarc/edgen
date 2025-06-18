'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  SparklesIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UsersIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { useAuth } from '../AuthProvider'
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Suspense } from "react"
import { ModernBackground, GridLines } from "./modern-background"

const howItWorksSteps = [
  {
    step: 1,
    icon: UsersIcon,
    title: 'Connect Your X Account',
    description: 'Securely sign in with X (OAuth). We only read engagement data—never post on your behalf.',
    color: 'text-layeredge-orange'
  },
  {
    step: 2,
    icon: ChatBubbleLeftRightIcon,
    title: 'Engage on X',
    description: 'Reply or comment on LayerEdge tweets with @LayerEdge or $EDGEN. Create original tweets/threads about LayerEdge milestones, tech, or vision.',
    color: 'text-layeredge-blue'
  },
  {
    step: 3,
    icon: SparklesIcon,
    title: 'Earn Reputation Points',
    description: 'Points are based on quality and engagement (likes, RTs, replies). Track your $EDGEN score in real time.',
    color: 'text-success'
  },
  {
    step: 4,
    icon: TrophyIcon,
    title: 'Climb the Leaderboard',
    description: 'Compete globally for top ranks. Top performers unlock special privileges (see below).',
    color: 'text-warning'
  }
]

const stats = [
  {
    label: 'Active Members',
    value: 2500,
    displayValue: '2,500+',
    icon: UsersIcon,
    color: 'text-layeredge-orange',
    bgColor: 'bg-layeredge-orange/10',
    borderColor: 'border-layeredge-orange/20'
  },
  {
    label: 'Points Awarded',
    value: 1200000,
    displayValue: '1.2M+',
    icon: TrophyIcon,
    color: 'text-layeredge-blue',
    bgColor: 'bg-layeredge-blue/10',
    borderColor: 'border-layeredge-blue/20'
  },
  {
    label: 'Tweets Tracked',
    value: 15000,
    displayValue: '15K+',
    icon: ChatBubbleLeftRightIcon,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20'
  },
  {
    label: 'Community Growth',
    value: 45,
    displayValue: '+45%',
    icon: ArrowTrendingUpIcon,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/20'
  }
]

// Animated Stat Card Component
function AnimatedStatCard({ stat, index }: { stat: typeof stats[0], index: number }) {
  const IconComponent = stat.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.3 + index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
    >
      <Card className="text-center transition-all duration-300 border-2 hover:shadow-lg">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold sm:text-3xl text-primary">
              {stat.displayValue}
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              {stat.label}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function HeroSection() {
  const { user, signInWithTwitter, isLoading } = useAuth()

  return (
    <div className="relative overflow-hidden bg-background min-h-screen">
      {/* 3D Canvas Background - Re-enabled */}
      <div className="absolute inset-0 opacity-30">
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Suspense fallback={null}>
            <ModernBackground count={3000} />
            <GridLines />
          </Suspense>
        </Canvas>
      </div>

      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern-subtle opacity-10" />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-layeredge-orange/5 via-transparent to-layeredge-blue/5" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          {/* Hero content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl"
          >
            <Badge variant="layeredge" size="lg" className="mb-6">
              <SparklesIcon className="h-4 w-4 mr-2" />
              $EDGEN Community Platform
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              <span className="block">BUILD YOUR</span>
              <span className="block bg-gradient-to-r from-layeredge-orange via-layeredge-orange-light to-layeredge-blue bg-clip-text text-transparent">
                LAYEREDGE
              </span>
              <span className="block">REPUTATION</span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Earn $EDGEN Reputation Points for real engagement on X/Twitter. Showcase your on‑chain impact, climb the leaderboard, and unlock future rewards.
            </p>

            <div className="mt-10 flex items-center justify-center gap-x-6">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="layeredge" size="xl">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="layeredge"
                  size="xl"
                  onClick={() => signInWithTwitter()}
                  disabled={isLoading}
                  className="btn-layeredge"
                >
                  {isLoading ? 'Connecting...' : 'Connect with X'}
                </Button>
              )}

              <Link href="/leaderboard">
                <Button variant="outline" size="xl">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20"
          >
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Community Stats
              </h2>
              <p className="mt-2 text-muted-foreground">
                Real-time metrics from our growing LayerEdge community
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-8">
              {stats.map((stat, index) => (
                <AnimatedStatCard key={stat.label} stat={stat} index={index} />
              ))}
            </div>
          </motion.div>

          {/* How It Works section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-24"
          >
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Simple steps to start earning $EDGEN Reputation Points
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorksSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <Card variant="layeredge" className="h-full hover-lift card-layeredge relative">
                    <CardHeader className="text-center">
                      {/* Step number badge */}
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-layeredge-orange to-layeredge-blue rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {step.step}
                      </div>
                      <div className={`mx-auto h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4 ${step.color}`}>
                        <step.icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center">
                        {step.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-24"
          >
            <Card variant="elevated" className="mx-auto max-w-4xl">
              <CardContent className="text-center py-12">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Build Your Reputation?
                </h3>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Connect your X account now and start earning $EDGEN Reputation Points!
                </p>
                {!user && (
                  <Button
                    variant="layeredge"
                    size="xl"
                    onClick={() => signInWithTwitter()}
                    disabled={isLoading}
                    className="btn-layeredge"
                  >
                    {isLoading ? 'Connecting...' : 'Get Started Now'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
