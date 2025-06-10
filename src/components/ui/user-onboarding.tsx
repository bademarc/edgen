'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Twitter,
  MessageSquare,
  Trophy,
  Users,
  Sparkles,
  Target,
  BookOpen,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  content: React.ReactNode
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

interface UserOnboardingProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  userInfo?: {
    name?: string
    xUsername?: string
  }
}

export function UserOnboarding({ isOpen, onClose, onComplete, userInfo }: UserOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: `Welcome to LayerEdge${userInfo?.name ? `, ${userInfo.name}` : ''}!`,
      description: 'Your gateway to earning points through X/Twitter engagement',
      icon: Sparkles,
      content: (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/icon/-AlLx9IW_400x400.png"
              alt="LayerEdge Logo"
              width={80}
              height={80}
              className="rounded-xl"
            />
          </div>
          <p className="text-muted-foreground leading-relaxed">
            You've successfully connected your X/Twitter account! Now you're ready to start earning points 
            for engaging with LayerEdge content and building the future of decentralized AI.
          </p>
          {userInfo?.xUsername && (
            <Badge variant="outline" className="mt-4">
              Connected as @{userInfo.xUsername}
            </Badge>
          )}
        </div>
      )
    },
    {
      id: 'how-it-works',
      title: 'How Points Work',
      description: 'Learn the basics of earning and using points',
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Tweet & Mention</h4>
                <p className="text-xs text-muted-foreground">
                  Post tweets containing "@layeredge" or "$EDGEN" to earn base points
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Zap className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Engagement Bonus</h4>
                <p className="text-xs text-muted-foreground">
                  Earn bonus points based on likes, retweets, and replies your tweets receive
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Trophy className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Climb the Leaderboard</h4>
                <p className="text-xs text-muted-foreground">
                  Compete with other community members for top rankings
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'first-tweet',
      title: 'Submit Your First Tweet',
      description: 'Ready to earn your first points?',
      icon: Twitter,
      content: (
        <div className="text-center space-y-4">
          <div className="p-6 rounded-lg bg-primary/10 border border-primary/20">
            <h4 className="font-semibold mb-2">Quick Start Guide</h4>
            <ol className="text-sm text-muted-foreground space-y-2 text-left">
              <li>1. Create a tweet mentioning "@layeredge" or "$EDGEN"</li>
              <li>2. Post it on your X/Twitter account</li>
              <li>3. Copy the tweet URL and submit it here</li>
              <li>4. Watch your points grow as people engage!</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Authentic, engaging content performs better and earns more bonus points!
          </p>
        </div>
      ),
      action: {
        label: 'Submit First Tweet',
        href: '/submit-tweet'
      }
    },
    {
      id: 'explore',
      title: 'Explore the Platform',
      description: 'Discover all the features available to you',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Link href="/dashboard" className="block">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Target className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Dashboard</h4>
                  <p className="text-xs text-muted-foreground">View your stats and submission history</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            
            <Link href="/leaderboard" className="block">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Leaderboard</h4>
                  <p className="text-xs text-muted-foreground">See how you rank against others</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            
            <Link href="/faq" className="block">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <BookOpen className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">FAQ & Help</h4>
                  <p className="text-xs text-muted-foreground">Get answers to common questions</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 'community',
      title: 'Join the Community',
      description: 'Connect with other LayerEdge enthusiasts',
      icon: Users,
      content: (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Join thousands of community members who are building the future of decentralized AI together.
          </p>
          <div className="grid grid-cols-1 gap-3">
            <a 
              href="https://x.com/i/communities/1890107751621357663" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            >
              <Twitter className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Join X Community</span>
            </a>
            
            <a 
              href="https://discord.gg/layeredge" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Join Discord</span>
            </a>
          </div>
        </div>
      )
    }
  ]

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => [...prev, currentStepData.id])
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    setCompletedSteps(prev => [...prev, currentStepData.id])
    onComplete()
    onClose()
  }

  const handleSkip = () => {
    onComplete()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-0 top-0 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="pr-8">
            <DialogTitle className="flex items-center space-x-2">
              <currentStepData.icon className="h-5 w-5 text-primary" />
              <span>{currentStepData.title}</span>
            </DialogTitle>
            <DialogDescription>{currentStepData.description}</DialogDescription>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="py-6"
          >
            {currentStepData.content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
              Skip Tour
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {currentStepData.action && (
              <Button variant="outline" asChild>
                <Link href={currentStepData.action.href || '#'}>
                  {currentStepData.action.label}
                </Link>
              </Button>
            )}
            
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
