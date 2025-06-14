import { Metadata } from 'next'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  KeyIcon,
  CubeIcon,
  EyeIcon,
  UsersIcon,
  ShieldCheckIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'About EDGEN - SocialFi Reputation Platform | LayerEdge',
  description: 'EDGEN is the SocialFi reputation platform built for the LayerEdge "People‑Backed Internet." Turn real engagement into portable, on‑chain reputation scores.',
  keywords: ['EDGEN', 'SocialFi', 'reputation platform', 'LayerEdge', 'on-chain reputation', 'Web3 identity', 'social proof', 'decentralized'],
}

const solutionFeatures = [
  {
    name: 'Capture Real Engagement',
    description: 'We scan your X (Twitter) replies, comments, and original threads tagged @LayerEdge or $EDGEN.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Score Your Impact',
    description: 'Earn $EDGEN Reputation Points based on the quality and reach of your contributions (likes, retweets, replies).',
    icon: ChartBarIcon,
  },
  {
    name: 'Own & Port Your Reputation',
    description: 'Your score lives in a decentralized ledger—no centralized platform can revoke or take it away.',
    icon: KeyIcon,
  },
  {
    name: 'Integrate & Unlock',
    description: 'Future airdrops, beta‑access, exclusive roles: your reputation opens doors across the LayerEdge ecosystem.',
    icon: CubeIcon,
  },
]

const coreValues = [
  {
    name: 'Transparency',
    description: 'Clear rules, open leaderboard, full auditability.',
    icon: EyeIcon,
  },
  {
    name: 'Inclusion',
    description: 'Everyone—from seasoned builders to new voices—earns equally for equal effort.',
    icon: UsersIcon,
  },
  {
    name: 'Ownership',
    description: 'Your data, your reputation, your rules.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Trust',
    description: 'Building human confidence into a trustless network.',
    icon: HeartIcon,
  },
]

export default function AboutPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            About{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              EDGEN
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto">
            EDGEN is the SocialFi reputation platform built for the LayerEdge "People‑Backed Internet."
            We help contributors, developers, and enthusiasts turn real engagement into a portable,
            on‑chain reputation score—your $EDGEN Reputation Points—that lives wherever Web3 goes next.
          </p>
        </motion.div>

        {/* Mission and Problem/Solution */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                To empower every LayerEdge community member with self‑sovereign digital credibility.
                In a world of smart contracts and zero‑knowledge proofs, human trust still matters.
                EDGEN makes it measurable, verifiable, and fully owned by you.
              </p>
            </div>

            {/* The Problem */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-3xl font-bold text-foreground mb-6">The Problem</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Web3's promise of self‑sovereign identity often stops at "wallet = identity."
                But wallets don't show your code commits, your DAO votes, or your thoughtful tweets.
                That missing social proof keeps great contributors hidden—and great projects hampered by lack of trust.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Our Solution */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Our Solution</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              EDGEN bridges the gap between social engagement and on-chain reputation
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {solutionFeatures.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.name}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Core Values */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Core Values</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The principles that guide our mission to build trustworthy reputation systems
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-4">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {value.name}
                </h3>
                <p className="text-muted-foreground">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Join Us */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">Join Us</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ready to build a reputation that travels the decentralized web?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/">
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold transition-colors text-lg">
                  Connect Your X Account →
                </button>
              </Link>
              <Link href="/leaderboard">
                <button className="border border-border hover:border-primary text-foreground hover:text-primary px-8 py-4 rounded-lg font-semibold transition-colors text-lg">
                  View Leaderboard →
                </button>
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
