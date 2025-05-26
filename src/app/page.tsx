'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  TrophyIcon,
  SparklesIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Earn Points',
    description: 'Get 5 base points for every verified tweet submission, plus bonus points for engagement.',
    icon: SparklesIcon,
  },
  {
    name: 'Compete & Rank',
    description: 'Climb the leaderboard and compete with other community members for the top spots.',
    icon: TrophyIcon,
  },
  {
    name: 'Community Driven',
    description: 'Join a vibrant community of LayerEdge $Edgen token enthusiasts and supporters.',
    icon: UserGroupIcon,
  },
  {
    name: 'Track Progress',
    description: 'Monitor your engagement metrics and points history with detailed analytics.',
    icon: ChartBarIcon,
  },
]

const stats = [
  { name: 'Community Members', value: '1,200+' },
  { name: 'Total Points Awarded', value: '50,000+' },
  { name: 'Tweets Submitted', value: '3,500+' },
  { name: 'Active This Week', value: '450+' },
]

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="absolute inset-0 bg-grid-pattern-subtle opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Join the{' '}
              <span className="text-layeredge-gradient">
                LayerEdge
              </span>{' '}
              <br />
              <span className="text-layeredge-gradient">$Edgen</span> Community
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Join the Bitcoin-backed internet revolution. Engage with LayerEdge community content,
              earn points for your participation, and help build the future of decentralized verification.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/login"
                className="btn-layeredge-primary px-8 py-4 rounded-xl text-lg font-bold flex items-center gap-2"
              >
                Join Community
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link
                href="/about"
                className="text-foreground hover:text-layeredge-orange font-semibold text-lg transition-colors"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-card/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <dt className="text-3xl font-bold text-layeredge-gradient">{stat.value}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{stat.name}</dd>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Simple steps to start earning points and engaging with our community
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="card-layeredge p-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-layeredge-orange/10 text-layeredge-orange mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of community members earning points and engaging with LayerEdge content.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Link
                href="/login"
                className="btn-layeredge-primary px-8 py-3 rounded-xl text-lg font-bold"
              >
                Sign in with X
              </Link>
              <Link
                href="/leaderboard"
                className="border border-border hover:border-layeredge-orange text-foreground hover:text-layeredge-orange px-8 py-3 rounded-xl text-lg font-semibold transition-colors"
              >
                View Leaderboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
