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
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
        <div className="absolute inset-0 bg-grid-pattern-subtle opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-layeredge-orange/5 via-transparent to-layeredge-blue/5" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            >
              Join the{' '}
              <span className="text-layeredge-gradient">
                LayerEdge
              </span>{' '}
              <br />
              <span className="text-gradient-layeredge">$Edgen</span> Community
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-foreground-muted"
            >
              Join the Bitcoin-backed internet revolution. Engage with LayerEdge community content,
              earn points for your participation, and help build the future of decentralized verification.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <Link
                href="/login"
                className="btn-layeredge-primary px-8 py-4 rounded-xl text-lg font-bold flex items-center gap-2 hover-lift"
              >
                Join Community
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link
                href="/about"
                className="btn-layeredge-ghost px-8 py-4 rounded-xl text-lg font-semibold hover-lift"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-card/30 to-card-hover/30 py-16 border-y border-border/50">
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
                className="text-center group"
              >
                <div className="card-layeredge p-6 hover-lift">
                  <dt className="text-3xl font-bold text-gradient-layeredge mb-2">{stat.value}</dt>
                  <dd className="text-sm text-muted-foreground font-medium">{stat.name}</dd>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-background to-background-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
              How It Works
            </h2>
            <div className="divider-layeredge w-24 mx-auto"></div>
            <p className="mt-6 text-lg text-foreground-muted max-w-2xl mx-auto">
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
                <div className="card-layeredge-elevated p-6 hover-lift-lg">
                  <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-layeredge-orange/20 to-layeredge-orange/10 text-layeredge-orange mb-6 mx-auto hover-glow">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 text-center">
                    {feature.name}
                  </h3>
                  <p className="text-muted-foreground text-center leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-r from-layeredge-orange/10 via-background-secondary to-layeredge-blue/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="card-layeredge-elevated p-12 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                Ready to Get Started?
              </h2>
              <div className="divider-layeredge w-32 mx-auto"></div>
              <p className="mt-6 text-lg text-foreground-muted max-w-2xl mx-auto">
                Join thousands of community members earning points and engaging with LayerEdge content.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  href="/login"
                  className="btn-layeredge-primary px-10 py-4 rounded-xl text-lg font-bold hover-lift"
                >
                  Sign in with X
                </Link>
                <Link
                  href="/leaderboard"
                  className="btn-layeredge-secondary px-10 py-4 rounded-xl text-lg font-semibold hover-lift"
                >
                  View Leaderboard
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
