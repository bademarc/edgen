'use client'

import { motion } from 'framer-motion'
import {
  CubeTransparentIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UserGroupIcon,
  SparklesIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Decentralized Infrastructure',
    description: 'LayerEdge provides cutting-edge blockchain infrastructure solutions for the next generation of decentralized applications.',
    icon: CubeTransparentIcon,
  },
  {
    name: 'Security First',
    description: 'Built with security at its core, LayerEdge ensures your assets and data remain protected at all times.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Global Network',
    description: 'Our distributed network spans across multiple continents, providing low-latency access worldwide.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Community Driven',
    description: 'The LayerEdge ecosystem is powered by its vibrant community of developers, validators, and token holders.',
    icon: UserGroupIcon,
  },
]

const pointsSystem = [
  {
    action: 'Submit Tweet',
    points: '5 base points',
    description: 'Earn points for every verified tweet submission from the LayerEdge community.',
    icon: SparklesIcon,
  },
  {
    action: 'Engagement Bonus',
    points: '+1 per like, +3 per retweet',
    description: 'Get bonus points based on the engagement your submitted tweets receive.',
    icon: TrophyIcon,
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
              LayerEdge
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto">
            LayerEdge is revolutionizing the blockchain infrastructure landscape with our innovative
            $Edgen token ecosystem. Join our community and be part of the future of decentralized technology.
          </p>
        </motion.div>

        {/* What is LayerEdge */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-3xl font-bold text-foreground mb-6">What is LayerEdge?</h2>
            <div className="prose prose-lg text-muted-foreground max-w-none">
              <p className="mb-4">
                LayerEdge is a next-generation blockchain infrastructure platform designed to provide
                scalable, secure, and efficient solutions for decentralized applications. Our mission
                is to bridge the gap between traditional infrastructure and blockchain technology.
              </p>
              <p className="mb-4">
                The $Edgen token serves as the native utility token of the LayerEdge ecosystem,
                enabling governance, staking, and access to premium features within our platform.
                Token holders play a crucial role in shaping the future direction of the project.
              </p>
              <p>
                Our community-driven approach ensures that every voice is heard and every contribution
                is valued. Through this engagement platform, we reward active community members who
                help spread awareness and drive adoption of LayerEdge technology.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Key Features</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover what makes LayerEdge unique in the blockchain space
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
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

        {/* Points System */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">How the Points System Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Earn points by engaging with our X community and climb the leaderboard
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {pointsSystem.map((item, index) => (
              <motion.div
                key={item.action}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-lg p-6"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/10 text-accent">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{item.action}</h3>
                    <p className="text-accent font-medium">{item.points}</p>
                  </div>
                </div>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Community Guidelines */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-foreground mb-6">Community Guidelines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">✅ Do:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Submit genuine tweets from the LayerEdge community</li>
                  <li>• Engage authentically with community content</li>
                  <li>• Respect other community members</li>
                  <li>• Share valuable insights and discussions</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">❌ Don't:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Submit fake or spam content</li>
                  <li>• Use automated tools for engagement</li>
                  <li>• Harass or abuse other members</li>
                  <li>• Share misleading information</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Contact */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground mb-6">Get Involved</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ready to join the LayerEdge community? Connect with us on X and start earning points today!
          </p>
          <div className="flex items-center justify-center gap-6">
            <a
              href="https://x.com/i/communities/1890107751621363"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Join X Community
            </a>
            <a
              href="/login"
              className="border border-border hover:border-primary text-foreground hover:text-primary px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Earning Points
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
