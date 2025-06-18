'use client'

/**
 * Helper Page - Full-screen AI Chat Interface
 * Dedicated page for extended conversations with Edgen Helper AI
 * Powered by Advanced AI Assistant
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

import { HelperOnboarding } from '@/components/ui/helper-onboarding'
import { Separator } from '@/components/ui/separator'
import {
  Send,
  Bot,
  User,
  Loader2,

  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Brain,
  Zap
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
  isThinking?: boolean
}

// Simple content parsing utility for Llama-3.3-70B-Instruct
const parseAIContent = (content: string): string => {
  if (!content) return content

  console.log('🧹 Parsing AI content, original length:', content.length)

  let cleanContent = content

  // Remove any <think> tags if present (though Llama shouldn't use them)
  cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/gim, '')
  cleanContent = cleanContent.replace(/<\/?think[^>]*>/gim, '')

  // Basic cleanup
  cleanContent = cleanContent.trim()
  cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines

  console.log('✅ Cleaned content length:', cleanContent.length)
  console.log('📝 Content preview:', cleanContent.substring(0, 200) + '...')

  return cleanContent
}

// Enhanced AI Thinking Indicator Component
const AIThinkingIndicator = ({ stage = 'processing' }: { stage?: 'processing' | 'analyzing' | 'generating' }) => {
  const [dots, setDots] = React.useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const stageMessages = {
    processing: 'Processing your question',
    analyzing: 'Analyzing context',
    generating: 'Generating response'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center space-x-3 p-4 bg-gradient-to-r from-[#f7931a]/10 to-[#e8851a]/10 rounded-2xl border border-[#f7931a]/20"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-full bg-gradient-to-r from-[#f7931a] to-[#e8851a] flex items-center justify-center"
        >
          <Brain className="h-4 w-4 text-white" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-[#f7931a]/20 -z-10"
        />
      </div>

      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-foreground">
            Edgen Helper is thinking
          </span>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex space-x-1"
          >
            <div className="w-1 h-1 bg-[#f7931a] rounded-full" />
            <div className="w-1 h-1 bg-[#f7931a] rounded-full" />
            <div className="w-1 h-1 bg-[#f7931a] rounded-full" />
          </motion.div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {stageMessages[stage]}{dots}
        </p>
      </div>

      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              height: [4, 12, 4],
              backgroundColor: ['#f7931a40', '#f7931a', '#f7931a40']
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2
            }}
            className="w-1 bg-[#f7931a] rounded-full"
          />
        ))}
      </div>
    </motion.div>
  )
}

export default function HelperPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingStage, setThinkingStage] = useState<'processing' | 'analyzing' | 'generating'>('processing')
  const [isOnline, setIsOnline] = useState(true)
  const [currentMode, setCurrentMode] = useState('AI Assistant')
  const [sessionStats, setSessionStats] = useState({ messagesCount: 0, tokensUsed: 0 })
  const [showOnboarding, setShowOnboarding] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Enhanced auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      })
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, [messages, scrollToBottom])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: parseAIContent("# 👋 Welcome to Edgen Helper!\n\nI'm your dedicated LayerEdge community assistant, powered by **Advanced AI Assistant**.\n\n## 🎯 How I can help you:\n\n• **Tweet Submission & Optimization** - Learn the best strategies for earning maximum points\n• **Points System Mastery** - Understand how engagement translates to rewards\n• **Hashtag Strategy** - Master the use of @layeredge and $EDGEN mentions\n• **Platform Navigation** - Get help with any LayerEdge feature\n• **Troubleshooting** - Solve issues with submissions, login, or account problems\n• **Community Insights** - Learn about LayerEdge ecosystem and opportunities\n\n## 💬 **Try asking me:**\n- \"How do I maximize my points on LayerEdge?\"\n- \"What's the best way to submit tweets?\"\n- \"I'm having trouble with my account\"\n- \"Explain the LayerEdge community platform\"\n\n**Ready to help you succeed in the LayerEdge community!** 🚀\n\n⚠️ **Note**: AI responses may contain errors and should be verified."),
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [messages.length])

  const handleExampleClick = (query: string) => {
    setInputMessage(query)
    setShowOnboarding(false)
    // Trigger send after setting the message
    setTimeout(() => sendMessage(), 100)
  }

  const handleStartChat = () => {
    setShowOnboarding(false)
    inputRef.current?.focus()
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    setShowOnboarding(false) // Hide onboarding when user starts chatting

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setIsThinking(true)
    setThinkingStage('processing')

    // Add enhanced thinking indicator
    const thinkingMessage: ChatMessage = {
      id: 'thinking',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isThinking: true
    }
    setMessages(prev => [...prev, thinkingMessage])

    // Simulate thinking stages
    setTimeout(() => setThinkingStage('analyzing'), 1000)
    setTimeout(() => setThinkingStage('generating'), 2000)

    try {
      const response = await fetch('/api/edgen-helper/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        }),
      })

      const data = await response.json()

      // Remove thinking indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'thinking'))
      setIsThinking(false)

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: parseAIContent(data.message), // Parse content to remove thinking tags
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])

        // Update session stats
        setSessionStats(prev => ({
          messagesCount: prev.messagesCount + 1,
          tokensUsed: prev.tokensUsed + (data.usage?.totalTokens || 0)
        }))

        // Update online status and mode based on response
        if (data.isOffline) {
          setIsOnline(false)
          setCurrentMode(data.mode || 'Enhanced Offline Mode')
        } else {
          setIsOnline(true)
          setCurrentMode('AI Assistant Online')
        }
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)

      // Remove thinking indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'thinking'))
      setIsThinking(false)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: parseAIContent("I'm experiencing technical difficulties. For immediate help:\n\n• **Submit Tweets**: Visit `/submit` page\n• **Check Dashboard**: View your current points at `/dashboard`\n• **Browse FAQ**: Get answers at `/faq`\n• **Contact Support**: Reach out through our community channels\n\nI'll be back online shortly! 🔧"),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsOnline(false)
      setCurrentMode('Offline Mode')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setSessionStats({ messagesCount: 0, tokensUsed: 0 })
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 h-screen flex flex-col max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 sm:mb-6"
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#f7931a] to-[#e8851a] flex items-center justify-center shadow-lg">
                      <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-background ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">Edgen Helper</CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center space-x-2">
                      <span className="hidden sm:inline">{currentMode}</span>
                      <span className="sm:hidden">{isOnline ? 'Online' : 'Offline'}</span>
                      {isOnline ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Session Stats</p>
                    <div className="flex space-x-3 text-xs">
                      <span>{sessionStats.messagesCount} messages</span>
                      <span>{sessionStats.tokensUsed} tokens</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearChat}
                    className="hover:bg-destructive/10 hover:text-destructive text-xs sm:text-sm"
                  >
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col min-h-0"
        >
          <Card className="flex-1 flex flex-col bg-card/30 backdrop-blur-sm border-border/50 min-h-0">
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Messages */}
              <ScrollArea
                ref={scrollAreaRef}
                className="flex-1 px-3 sm:px-6 py-4 min-h-0"
              >
                <div className="space-y-4 sm:space-y-6">
                  {/* Show onboarding when no messages and onboarding is enabled */}
                  {showOnboarding && messages.length === 0 && (
                    <HelperOnboarding
                      onExampleClick={handleExampleClick}
                      onStartChat={handleStartChat}
                    />
                  )}

                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.isThinking ? (
                        <div className="w-full max-w-[90%] sm:max-w-[80%]">
                          <AIThinkingIndicator stage={thinkingStage} />
                        </div>
                      ) : (
                        <div className={`flex items-start space-x-3 sm:space-x-4 max-w-[90%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <div className={`flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center ${
                            message.role === 'user'
                              ? 'bg-[#f7931a] text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {message.role === 'user' ? (
                              <User className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </div>
                          <div className={`flex flex-col space-y-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 max-w-none ${
                              message.role === 'user'
                                ? 'bg-[#f7931a] text-white'
                                : message.isTyping
                                ? 'bg-muted/50 text-muted-foreground'
                                : 'bg-muted text-foreground'
                            }`}>
                              {message.isTyping ? (
                                <div className="flex items-center space-x-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="text-sm">{message.content}</span>
                                </div>
                              ) : (
                                <div className="prose prose-sm dark:prose-invert max-w-none text-sm sm:text-base">
                                  {message.content.split('\n').map((line, index) => {
                                    if (line.startsWith('# ')) {
                                      return <h1 key={index} className="text-base sm:text-lg font-bold mb-2 mt-0">{line.substring(2)}</h1>
                                    } else if (line.startsWith('## ')) {
                                      return <h2 key={index} className="text-sm sm:text-base font-semibold mb-2 mt-3">{line.substring(3)}</h2>
                                    } else if (line.startsWith('• ')) {
                                      return <p key={index} className="mb-1 text-sm sm:text-base">• {line.substring(2)}</p>
                                    } else if (line.startsWith('- ')) {
                                      return <p key={index} className="mb-1 text-sm sm:text-base">- {line.substring(2)}</p>
                                    } else if (line.includes('**') && line.includes('**')) {
                                      const parts = line.split('**')
                                      return (
                                        <p key={index} className="mb-1 text-sm sm:text-base">
                                          {parts.map((part, i) =>
                                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                          )}
                                        </p>
                                      )
                                    } else if (line.trim()) {
                                      return <p key={index} className="mb-1 text-sm sm:text-base">{line}</p>
                                    } else {
                                      return <br key={index} />
                                    }
                                  })}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground px-2">
                              {formatTimestamp(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <Separator />

              {/* Input Area */}
              <div className="p-3 sm:p-6 border-t border-border/50">
                <div className="flex space-x-2 sm:space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Edgen Helper anything about LayerEdge..."
                      className="pr-10 sm:pr-12 h-10 sm:h-12 text-sm sm:text-base bg-background/50 border-border/50 focus:border-[#f7931a]/50 focus:ring-[#f7931a]/20 transition-all duration-200"
                      disabled={isLoading || isThinking}
                    />
                    <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                      <motion.div
                        animate={{
                          rotate: isThinking ? 360 : 0,
                          scale: isThinking ? 1.1 : 1
                        }}
                        transition={{
                          rotate: { duration: 2, repeat: isThinking ? Infinity : 0, ease: "linear" },
                          scale: { duration: 0.2 }
                        }}
                      >
                        {isThinking ? (
                          <Brain className="h-4 w-4 text-[#f7931a]" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                        )}
                      </motion.div>
                    </div>
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading || isThinking}
                    className="h-10 sm:h-12 px-3 sm:px-6 bg-[#f7931a] hover:bg-[#e8851a] text-white font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading || isThinking ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                      </motion.div>
                    ) : (
                      <>
                        <Send className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* AI Disclaimer */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md"
                >
                  <p className="text-xs text-yellow-600 dark:text-yellow-200 flex items-center justify-center">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    AI responses may contain errors and should be verified
                  </p>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground mt-2 text-center"
                >
                  {isThinking ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span>Edgen Helper is thinking</span>
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        ⚡
                      </motion.span>
                    </span>
                  ) : (
                    "Powered by Advanced AI Assistant • Press Enter to send"
                  )}
                </motion.p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
