'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  SparklesIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  ChevronRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline'

interface HelperOnboardingProps {
  onExampleClick: (query: string) => void
  onStartChat: () => void
}

const EXAMPLE_QUERIES = [
  {
    category: 'Getting Started',
    icon: RocketLaunchIcon,
    color: 'bg-blue-500/10 text-blue-600',
    queries: [
      'How do I earn more points?',
      'What is my current ranking?',
      'How do I submit a tweet?',
      'What are the platform rules?'
    ]
  },
  {
    category: 'Points & Rewards',
    icon: SparklesIcon,
    color: 'bg-yellow-500/10 text-yellow-600',
    queries: [
      'How are points calculated?',
      'What is the Trust Score?',
      'How do I increase my rank?',
      'What are the tier benefits?'
    ]
  },
  {
    category: 'Community',
    icon: QuestionMarkCircleIcon,
    color: 'bg-green-500/10 text-green-600',
    queries: [
      'How do I join the LayerEdge community?',
      'What are quests and how do I complete them?',
      'How do I connect with other members?',
      'What content should I share?'
    ]
  },
  {
    category: 'Tips & Strategies',
    icon: LightBulbIcon,
    color: 'bg-purple-500/10 text-purple-600',
    queries: [
      'Best practices for high engagement tweets',
      'How to maximize my weekly points',
      'What hashtags should I use?',
      'How often should I post?'
    ]
  }
]

export function HelperOnboarding({ onExampleClick, onStartChat }: HelperOnboardingProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
            <SparklesIcon className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome to Edgen Helper! 🤖
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            I'm your AI assistant for the LayerEdge platform. I can help you understand how to earn points, 
            climb the leaderboard, and make the most of your community experience.
          </p>
        </div>
      </motion.div>

      {/* Quick Start Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onStartChat}>
          <CardContent className="p-6 text-center">
            <PlayIcon className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Start Free Chat</h3>
            <p className="text-sm text-muted-foreground">
              Ask me anything about LayerEdge
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <QuestionMarkCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Browse Examples</h3>
            <p className="text-sm text-muted-foreground">
              Explore common questions below
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Example Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold text-foreground">
          Popular Questions by Category
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXAMPLE_QUERIES.map((category, index) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.category
            
            return (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedCategory(
                    isSelected ? null : category.category
                  )}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-base">{category.category}</span>
                      </div>
                      <ChevronRightIcon 
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          isSelected ? 'rotate-90' : ''
                        }`} 
                      />
                    </CardTitle>
                  </CardHeader>
                  
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0 space-y-2">
                          {category.queries.map((query, queryIndex) => (
                            <motion.button
                              key={query}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: queryIndex * 0.05 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                onExampleClick(query)
                              }}
                              className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span>{query}</span>
                                <Badge variant="secondary" className="text-xs">
                                  Try it
                                </Badge>
                              </div>
                            </motion.button>
                          ))}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center space-y-4 pt-6 border-t border-border"
      >
        <p className="text-muted-foreground">
          Ready to get started? Click any example above or start a conversation!
        </p>
        <Button 
          variant="layeredge" 
          size="lg" 
          onClick={onStartChat}
          className="px-8"
        >
          <SparklesIcon className="h-5 w-5 mr-2" />
          Start Chatting with Edgen Helper
        </Button>
      </motion.div>
    </div>
  )
}
