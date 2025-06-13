'use client'

import { useState, useEffect } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Button } from './button'
import { Badge } from './badge'
import { SparklesIcon, TrophyIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface HeroEnhancedProps {
  className?: string
}

// Typewriter effect hook
function useTypewriter(text: string, speed: number = 50) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }

    // Return undefined for other cases
    return undefined
  }, [currentIndex, text, speed])

  return displayText
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)

  useEffect(() => {
    if (inView && !isVisible) {
      setIsVisible(true)
      let startTime: number
      let animationFrame: number

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)

        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentCount = Math.floor(easeOutQuart * (end - start) + start)

        setCount(currentCount)

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate)
        }
      }

      animationFrame = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationFrame)
    }

    // Return undefined for other cases
    return undefined
  }, [inView, isVisible, end, duration, start])

  return { count, ref }
}

// Floating Bitcoin symbols component
function FloatingBitcoin({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, rotate: 0 }}
      animate={{
        opacity: [0, 0.6, 0],
        y: [100, -100],
        rotate: [0, 360],
        scale: [0.8, 1.2, 0.8]
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute text-bitcoin-orange/20 pointer-events-none"
      style={{
        left: `${Math.random() * 100}%`,
        fontSize: `${Math.random() * 20 + 20}px`
      }}
    >
      ₿
    </motion.div>
  )
}

export function HeroEnhanced({ className }: HeroEnhancedProps) {
  const typewriterText = useTypewriter("Join the LayerEdge Community", 100)
  const controls = useAnimation()
  const ref = useRef(null)
  const inView = useInView(ref)

  // Animated stats
  const { count: membersCount, ref: membersRef } = useAnimatedCounter(2847, 2000)
  const { count: pointsCount, ref: pointsRef } = useAnimatedCounter(156420, 2500)
  const { count: tweetsCount, ref: tweetsRef } = useAnimatedCounter(8934, 2200)
  const { count: achievementsCount, ref: achievementsRef } = useAnimatedCounter(342, 1800)

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <section className={cn("relative min-h-screen flex items-center justify-center overflow-hidden", className)}>
      {/* Animated background gradient */}
      <motion.div
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(247, 147, 26, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, rgba(247, 147, 26, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(245, 158, 11, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 40% 80%, rgba(247, 147, 26, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 50%, rgba(245, 158, 11, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)"
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-0 z-0"
      />

      {/* Floating Bitcoin symbols */}
      {Array.from({ length: 8 }).map((_, i) => (
        <FloatingBitcoin key={i} delay={i * 1.5} />
      ))}

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern-subtle opacity-30" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <Badge variant="points" size="lg" className="mx-auto">
              <SparklesIcon className="h-4 w-4 mr-2" />
              $EDGEN COMMUNITY PLATFORM
            </Badge>
          </motion.div>

          {/* Main heading with typewriter effect */}
          <motion.div variants={itemVariants} className="mb-6">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-bitcoin-orange via-layeredge-orange to-layeredge-blue bg-clip-text text-transparent">
                {typewriterText}
              </span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-bitcoin-orange"
              >
                |
              </motion.span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div variants={itemVariants} className="mb-12">
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Join the Bitcoin-backed internet revolution. Tweet about{' '}
              <span className="text-layeredge-orange font-semibold">@layeredge</span> or{' '}
              <span className="text-bitcoin-orange font-semibold">$EDGEN</span> and automatically earn points based on engagement. No manual submissions required!
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="mb-16">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="layeredge" size="xl" className="group relative overflow-hidden">
                <span className="relative z-10">Join Community</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
              </Button>
              <Button variant="outline" size="xl" className="border-bitcoin-orange/30 hover:border-bitcoin-orange hover:bg-bitcoin-orange/10">
                Learn more
              </Button>
            </div>
          </motion.div>

          {/* Real-time stats */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div ref={membersRef} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <UsersIcon className="h-8 w-8 text-layeredge-blue mr-2" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-layeredge-blue to-layeredge-blue-light bg-clip-text text-transparent">
                  {membersCount.toLocaleString()}+
                </div>
                <div className="text-sm text-muted-foreground font-medium">Community Members</div>
              </div>

              <div ref={pointsRef} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <SparklesIcon className="h-8 w-8 text-bitcoin-orange mr-2" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-bitcoin-orange to-layeredge-orange bg-clip-text text-transparent">
                  {pointsCount.toLocaleString()}+
                </div>
                <div className="text-sm text-muted-foreground font-medium">Points Awarded</div>
              </div>

              <div ref={tweetsRef} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <ChartBarIcon className="h-8 w-8 text-layeredge-orange mr-2" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-layeredge-orange to-layeredge-orange-light bg-clip-text text-transparent">
                  {tweetsCount.toLocaleString()}+
                </div>
                <div className="text-sm text-muted-foreground font-medium">Tweets Tracked</div>
              </div>

              <div ref={achievementsRef} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrophyIcon className="h-8 w-8 text-success mr-2" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-success to-emerald-400 bg-clip-text text-transparent">
                  {achievementsCount.toLocaleString()}+
                </div>
                <div className="text-sm text-muted-foreground font-medium">Achievements Unlocked</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-bitcoin-orange/50 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-bitcoin-orange rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
