'use client'

import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HelpCircle, MessageSquare, Trophy, Users } from 'lucide-react'
import Link from 'next/link'

const faqData = [
  {
    id: 'points-system',
    category: 'Points',
    question: 'How do I earn points on LayerEdge?',
    answer: 'You earn points by tweeting content that mentions "@layeredge" or "$EDGEN". Base points are awarded for submissions, with bonus points based on engagement (likes, retweets, replies). The more engagement your tweet receives, the more points you earn!'
  },
  {
    id: 'tweet-requirements',
    category: 'Submissions',
    question: 'What tweets are eligible for points?',
    answer: 'Your tweets must contain either "@layeredge" or "$EDGEN" (case-insensitive) to be eligible for points. The tweet must be posted by your authenticated Twitter account, and you can only submit tweets that you authored yourself.'
  },
  {
    id: 'submission-process',
    category: 'Submissions',
    question: 'How do I submit my tweets?',
    answer: 'Simply copy the URL of your eligible tweet and paste it into the submission form on your dashboard or the Submit Tweet page. Our system will automatically verify the tweet content and award points based on engagement metrics.'
  },
  {
    id: 'leaderboard-ranking',
    category: 'Leaderboard',
    question: 'How does the leaderboard ranking work?',
    answer: 'The leaderboard ranks users by total points earned. In case of ties, users who joined earlier rank higher. Rankings are updated in real-time as new tweets are submitted and engagement metrics are refreshed.'
  },
  {
    id: 'account-management',
    category: 'Account',
    question: 'How do I manage my LayerEdge account?',
    answer: 'Your account is linked to your Twitter/X profile through OAuth authentication. You can view your stats, submission history, and points breakdown on your dashboard. Account data is automatically synced with your Twitter profile information.'
  },
  {
    id: 'engagement-tracking',
    category: 'Points',
    question: 'How often are engagement metrics updated?',
    answer: 'Engagement metrics (likes, retweets, replies) are updated periodically through our automated system. This ensures your points reflect the current performance of your tweets while respecting Twitter API rate limits.'
  },
  {
    id: 'community-guidelines',
    category: 'Community',
    question: 'What are the community guidelines?',
    answer: 'We encourage authentic engagement with LayerEdge content. Spam, fake accounts, or manipulated engagement will result in account suspension. Focus on creating genuine, valuable content about LayerEdge and the $EDGEN ecosystem.'
  },
  {
    id: 'technical-support',
    category: 'Support',
    question: 'What if I encounter technical issues?',
    answer: 'If you experience any technical problems, please contact our support team through the community Discord or email. Common issues include tweet submission errors, authentication problems, or missing points - we\'re here to help!'
  }
]

const categoryColors = {
  'Points': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  'Submissions': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'Leaderboard': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  'Account': 'bg-green-500/10 text-green-700 dark:text-green-400',
  'Community': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  'Support': 'bg-red-500/10 text-red-700 dark:text-red-400'
}

export function HomepageFAQ() {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-base sm:text-lg mb-4 sm:mb-6 px-2 leading-relaxed">
            Everything you need to know about earning points and engaging with the LayerEdge community
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-3 sm:p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <AccordionItem value={faq.id} className="border-b border-border/50">
                      <AccordionTrigger className="text-left hover:no-underline py-3 sm:py-4 touch-friendly">
                        <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 text-left">
                          <Badge
                            variant="secondary"
                            className={`text-xs font-medium self-start ${categoryColors[faq.category as keyof typeof categoryColors] || 'bg-gray-500/10 text-gray-700 dark:text-gray-400'}`}
                          >
                            {faq.category}
                          </Badge>
                          <span className="font-semibold text-foreground text-sm sm:text-base leading-tight">
                            {faq.question}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3 sm:pb-4">
                        <div className="pl-0 sm:pl-16 pr-2 sm:pr-4">
                          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                            {faq.answer}
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12"
        >
          <Card className="hover:shadow-lg transition-all duration-300 touch-friendly">
            <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
              <div className="mx-auto p-2.5 sm:p-3 rounded-full bg-blue-500/10 w-fit">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <CardTitle className="text-base sm:text-lg">Submit Your First Tweet</CardTitle>
            </CardHeader>
            <CardContent className="text-center px-4 sm:px-6 pb-4 sm:pb-6">
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                Ready to start earning points? Submit a tweet mentioning @layeredge or $EDGEN.
              </p>
              <Button asChild className="w-full min-h-[44px]">
                <Link href="/submit-tweet">Submit Tweet</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 touch-friendly">
            <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
              <div className="mx-auto p-2.5 sm:p-3 rounded-full bg-purple-500/10 w-fit">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
              </div>
              <CardTitle className="text-base sm:text-lg">View Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center px-4 sm:px-6 pb-4 sm:pb-6">
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                See how you rank against other community members and top contributors.
              </p>
              <Button variant="outline" asChild className="w-full min-h-[44px]">
                <Link href="/leaderboard">View Rankings</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 touch-friendly sm:col-span-2 lg:col-span-1">
            <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
              <div className="mx-auto p-2.5 sm:p-3 rounded-full bg-green-500/10 w-fit">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
              <CardTitle className="text-base sm:text-lg">Join Community</CardTitle>
            </CardHeader>
            <CardContent className="text-center px-4 sm:px-6 pb-4 sm:pb-6">
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                Connect with other LayerEdge enthusiasts and stay updated on the latest news.
              </p>
              <Button variant="outline" asChild className="w-full min-h-[44px]">
                <a href="https://x.com/i/communities/1890107751621357663" target="_blank" rel="noopener noreferrer">
                  Join X Community
                </a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* More Questions CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Still have questions? Check out our comprehensive FAQ page or reach out to our community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/faq">View All FAQs</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:community@layeredge.io">Contact Support</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
