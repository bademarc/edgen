'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

const faqs = [
  {
    id: 1,
    category: 'Getting Started',
    question: 'How do I join the LayerEdge community?',
    answer: 'Simply click "Sign in with X" on our platform to authenticate with your X (Twitter) account. Once authenticated, you can start submitting tweets and earning points immediately.',
  },
  {
    id: 2,
    category: 'Points System',
    question: 'How are points calculated?',
    answer: 'You earn 5 base points for every verified tweet submission from the LayerEdge community. Additionally, you get bonus points: +1 point per like, +3 points per retweet, and +2 points per reply on your submitted tweets.',
  },
  {
    id: 3,
    category: 'Points System',
    question: 'How often are points updated?',
    answer: 'Points are updated in real-time as engagement metrics change on your submitted tweets. The system checks for updates every few minutes to ensure accuracy.',
  },
  {
    id: 4,
    category: 'Tweet Submission',
    question: 'What tweets can I submit?',
    answer: 'You can only submit tweets that are posted within the official LayerEdge X community (https://x.com/i/communities/1890107751621357663). Tweets from outside this community will not be accepted.',
  },
  {
    id: 5,
    category: 'Tweet Submission',
    question: 'Can I submit the same tweet multiple times?',
    answer: 'No, each tweet URL can only be submitted once. The system will reject duplicate submissions to ensure fairness.',
  },
  {
    id: 6,
    category: 'Leaderboard',
    question: 'How is the leaderboard ranking determined?',
    answer: 'The leaderboard is ranked by total points earned. In case of ties, the user who reached that point total first will rank higher.',
  },
  {
    id: 7,
    category: 'Account & Privacy',
    question: 'What information do you access from my X account?',
    answer: 'We only access your public profile information (username, display name, profile picture) and the ability to verify tweets from the LayerEdge community. We do not access private messages or post on your behalf.',
  },
  {
    id: 8,
    category: 'Account & Privacy',
    question: 'Can I delete my account?',
    answer: 'Yes, you can delete your account at any time. Contact our support team or use the account deletion option in your dashboard. All your data will be permanently removed.',
  },
  {
    id: 9,
    category: 'Technical',
    question: 'Why was my tweet submission rejected?',
    answer: 'Tweet submissions can be rejected for several reasons: the tweet is not from the LayerEdge community, the URL is invalid, the tweet has been deleted, or it has already been submitted by another user.',
  },
  {
    id: 10,
    category: 'Technical',
    question: 'I\'m having trouble signing in. What should I do?',
    answer: 'Make sure you\'re using a valid X account and that you\'ve granted the necessary permissions. Clear your browser cache and cookies, then try again. If issues persist, contact our support team.',
  },
]

const categories = ['All', ...Array.from(new Set(faqs.map(faq => faq.category)))]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [openItems, setOpenItems] = useState<number[]>([])

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleItem = (id: number) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground">Frequently Asked Questions</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Find answers to common questions about the LayerEdge community platform
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQ Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No FAQs found matching your search criteria.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-card border border-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded mb-2">
                      {faq.category}
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">
                      {faq.question}
                    </h3>
                  </div>
                  <ChevronDownIcon
                    className={cn(
                      'h-5 w-5 text-muted-foreground transition-transform',
                      openItems.includes(faq.id) && 'transform rotate-180'
                    )}
                  />
                </button>

                <AnimatePresence>
                  {openItems.includes(faq.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4">
                        <p className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8"
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Still have questions?
          </h2>
          <p className="text-muted-foreground mb-6">
            Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://x.com/i/communities/1890107751621363"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Join Community
            </a>
            <a
              href="mailto:support@layeredge.com"
              className="border border-border hover:border-primary text-foreground hover:text-primary px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Contact Support
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
