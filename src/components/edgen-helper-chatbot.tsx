'use client'

/**
 * Edgen Helper AI Chatbot Component
 * Intelligent assistant for LayerEdge community platform
 * Powered by Advanced AI Assistant
 */

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Minimize2,
  Maximize2,

  AlertCircle
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
}

// Enhanced content parsing utility to remove AI thinking tags
const parseAIContent = (content: string): string => {
  if (!content) return content

  console.log('🧹 [Chatbot] Parsing AI content, original length:', content.length)

  let cleanContent = content

  // Remove all <think> and </think> tags and their content (case insensitive, multiline)
  cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/gim, '')

  // Remove any standalone thinking tags that might appear
  cleanContent = cleanContent.replace(/<\/?think>/gim, '')

  // Also handle potential variations with attributes or spaces
  cleanContent = cleanContent.replace(/<think[^>]*>[\s\S]*?<\/think[^>]*>/gim, '')
  cleanContent = cleanContent.replace(/<\/?think[^>]*>/gim, '')

  // Clean up any extra whitespace or newlines left behind
  cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n')
  cleanContent = cleanContent.replace(/^\s+|\s+$/g, '') // More thorough trim

  console.log('✅ [Chatbot] Cleaned content length:', cleanContent.length)

  return cleanContent
}

export function EdgenHelperChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [currentMode, setCurrentMode] = useState('AI Assistant')
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeContent = isMobile
        ? "👋 Hi! I'm Edgen Helper, your LayerEdge AI assistant.\n\nI can help with:\n• Enhanced points system (up to 380 points/tweet)\n• Quest completion (2000+ bonus points)\n• Apify Twitter integration benefits\n• Platform optimization strategies\n\nWhat can I help you with?"
        : "👋 Hi! I'm Edgen Helper, your LayerEdge community assistant with comprehensive platform knowledge!\n\n🎯 **I can help you with**:\n• **Enhanced Points System**: Up to 380 points per tweet with detailed engagement metrics\n• **Quest System**: Complete quests for 2000+ bonus points\n• **Apify Integration**: Real-time Twitter metrics for accurate calculations\n• **Platform Features**: Dashboard, leaderboard, submission optimization\n• **Strategic Guidance**: Maximize your earnings with proven strategies\n\n💡 **Key Platform Info**:\n- Base points: 10 per tweet\n- Enhanced engagement multipliers via Apify\n- 5-minute cooldown between submissions\n- Production site: edgen.koyeb.app\n\nWhat would you like to know about maximizing your LayerEdge earnings?"

      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, messages.length, isMobile])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing',
      role: 'assistant',
      content: 'Edgen Helper is thinking...',
      timestamp: new Date(),
      isTyping: true
    }
    setMessages(prev => [...prev, typingMessage])

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

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'))

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: parseAIContent(data.message), // Parse content to remove thinking tags
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])

        // Update online status and mode based on response
        if (data.isOffline) {
          setIsOnline(false)
          setCurrentMode(data.mode || 'Enhanced Offline Mode')
          console.log(`🤖 Edgen Helper running in: ${data.mode || 'Offline Mode'}`)
        } else {
          setIsOnline(true)
          setCurrentMode('AI Assistant Online')
          console.log('🤖 Edgen Helper online with AI Assistant')
        }
      } else {
        // This should rarely happen now since we always return success
        const fallbackMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: parseAIContent(data.fallbackMessage || "I'm having trouble connecting to the AI service right now. Please try again later or check our documentation for help."),
          timestamp: new Date()
        }
        setMessages(prev => [...prev, fallbackMessage])
        setIsOnline(false)
      }
    } catch (error) {
      console.error('Chat error:', error)
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'))
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: parseAIContent("I'm currently offline. For immediate help: visit /submit for tweet submission, check your dashboard for points, or refer to our platform documentation."),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsOnline(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const quickActions = [
    { label: "Maximum points strategy", message: "What's the best strategy to earn the maximum 380 points per tweet on LayerEdge?" },
    { label: "Quest system guide", message: "How do I complete quests to earn the 2000+ bonus points available?" },
    { label: "Enhanced vs basic metrics", message: "What's the difference between enhanced and basic point calculations?" },
    { label: "Point calculation examples", message: "Can you show me examples of how points are calculated for different engagement levels?" },
  ]

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[#f7931a] hover:bg-[#e8851a] text-white shadow-lg hover:shadow-xl transition-all duration-300 touch-friendly"
              size="icon"
            >
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <Badge
              variant="secondary"
              className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 bg-green-500 text-white border-0 animate-pulse text-xs"
            >
              AI
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="fixed bottom-2 right-2 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-96 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] chat-mobile-optimized"
          >
            <Card className="bg-gray-900 border-gray-700 shadow-2xl chat-landscape-compact">
              {/* Header */}
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6 chat-header-landscape">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-[#f7931a]" />
                      <div className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base sm:text-lg">Edgen Helper</CardTitle>
                      <p className="text-xs text-gray-400 hidden sm:block">
                        {currentMode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="h-8 w-8 text-gray-400 hover:text-white touch-friendly"
                    >
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 text-gray-400 hover:text-white touch-friendly"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Content */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="p-0">
                      {/* Messages */}
                      <ScrollArea className="h-60 sm:h-80 px-3 sm:px-4 mobile-scroll chat-scroll-mobile">
                        <div className="space-y-2 sm:space-y-4 py-2">
                          {messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`flex items-start space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                <div className={`flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center ${
                                  message.role === 'user'
                                    ? 'bg-[#f7931a]'
                                    : 'bg-gray-700'
                                }`}>
                                  {message.role === 'user' ? (
                                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                  ) : (
                                    <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-[#f7931a]" />
                                  )}
                                </div>
                                <div className={`rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 ${
                                  message.role === 'user'
                                    ? 'bg-[#f7931a] text-white'
                                    : 'bg-gray-800 text-gray-100'
                                }`}>
                                  {message.isTyping ? (
                                    <div className="flex items-center space-x-1">
                                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                      <span className="text-xs sm:text-sm">{message.content}</span>
                                    </div>
                                  ) : (
                                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Quick Actions */}
                      {messages.length <= 1 && (
                        <div className="px-3 sm:px-4 py-2 border-t border-gray-700">
                          <p className="text-xs text-gray-400 mb-2 hidden sm:block">Quick actions:</p>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {quickActions.map((action, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => setInputMessage(action.message)}
                                className="text-xs h-8 sm:h-7 px-2 sm:px-3 border-gray-600 text-gray-300 hover:bg-gray-700 touch-friendly"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Input */}
                      <div className="p-3 sm:p-4 border-t border-gray-700">
                        <div className="flex space-x-2">
                          <Input
                            ref={inputRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={isMobile ? "Ask Edgen..." : "Ask Edgen Helper..."}
                            className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-sm sm:text-base h-10 sm:h-auto chat-input-mobile"
                            disabled={isLoading}
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={!inputMessage.trim() || isLoading}
                            className="bg-[#f7931a] hover:bg-[#e8851a] text-white touch-friendly h-10 w-10 sm:h-auto sm:w-auto"
                            size="icon"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {/* AI Disclaimer - Compact on mobile */}
                        <div className="mt-2 sm:mt-3 p-1.5 sm:p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                          <p className="text-xs text-yellow-200 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">AI responses may contain errors and should be verified</span>
                            <span className="sm:hidden">AI responses may contain errors</span>
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500 hidden sm:block">
                            Powered by Advanced AI Assistant
                          </p>
                          <p className="text-xs text-gray-500 sm:hidden">
                            AI Assistant
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearChat}
                            className="text-xs text-gray-400 hover:text-white h-6 touch-friendly"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
