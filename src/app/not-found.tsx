'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Search, 
  ArrowLeft, 
  MessageSquare, 
  Trophy,
  HelpCircle,
  Compass
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function NotFoundPage() {
  const quickLinks = [
    {
      title: 'Dashboard',
      description: 'View your points and submissions',
      href: '/dashboard',
      icon: Home,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Submit Tweet',
      description: 'Earn points for your engagement',
      href: '/submit-tweet',
      icon: MessageSquare,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Leaderboard',
      description: 'See top community members',
      href: '/leaderboard',
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'FAQ',
      description: 'Get answers to common questions',
      href: '/faq',
      icon: HelpCircle,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* LayerEdge Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center justify-center mb-8"
          >
            <div className="relative">
              <Image
                src="/icon/-AlLx9IW_400x400.png"
                alt="LayerEdge Logo"
                width={80}
                height={80}
                className="rounded-xl"
              />
              <div className="absolute -top-2 -right-2">
                <Badge variant="destructive" className="text-xs">404</Badge>
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Page Not Found</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Oops! The page you&apos;re looking for seems to have wandered off into the decentralized void.
              Don&apos;t worry, we&apos;ll help you get back on track to earning those LayerEdge points!
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button asChild size="lg" className="min-w-[160px]">
              <Link href="/" className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Go Home</span>
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.history.back()} className="min-w-[160px]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </motion.div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                <Compass className="h-5 w-5 text-primary" />
                <span>Popular Destinations</span>
              </CardTitle>
              <p className="text-muted-foreground">
                Here are some popular pages you might be looking for
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickLinks.map((link, index) => (
                  <motion.div
                    key={link.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  >
                    <Link href={link.href}>
                      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${link.bgColor}`}>
                              <link.icon className={`h-5 w-5 ${link.color}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{link.title}</h3>
                              <p className="text-sm text-muted-foreground">{link.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Search className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Still Can&apos;t Find What You&apos;re Looking For?</h3>
              <p className="text-muted-foreground mb-4">
                Try checking our FAQ section or reach out to our community for help.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/faq">Browse FAQ</Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://discord.gg/layeredge" target="_blank" rel="noopener noreferrer">
                    Join Discord
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="mailto:community@layeredge.io">Contact Support</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Fun Fact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-muted-foreground">
            💡 <strong>Did you know?</strong> While you&apos;re here, you could be earning points by tweeting about @layeredge or $EDGEN!
          </p>
        </motion.div>
      </div>
    </div>
  )
}
