'use client'

/**
 * Edgen Helper AI Chatbot Component
 * Intelligent assistant for LayerEdge community platform
 * Powered by io.net API
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
  HelpCircle
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
}

interface EdgenHelperChatbotProps {
  className?: string
}

export function EdgenHelperChatbot({ className }: EdgenHelperChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "👋 Hi! I'm Edgen Helper, your LayerEdge community assistant powered by DeepSeek-R1 AI. I can help you with:\n\n• Tweet submission and points system\n• Platform navigation and features\n• @layeredge and $EDGEN hashtag strategy\n• Troubleshooting and optimization tips\n• Advanced engagement analysis\n\nWhat would you like to know about LayerEdge?",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, messages.length])

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
          content: data.message,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
        setIsOnline(true)
      } else {
        // Fallback response
        const fallbackMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.fallbackMessage || "I'm having trouble connecting to the AI service right now. Please try again later or check our documentation for help.",
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
        content: "I'm currently offline. For immediate help: visit /submit for tweet submission, check your dashboard for points, or refer to our platform documentation.",
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
    { label: "Earn points strategy", message: "What's the best strategy to earn maximum points on LayerEdge?" },
    { label: "Tweet submission", message: "Walk me through the tweet submission process step by step" },
    { label: "Hashtag optimization", message: "How should I use @layeredge and $EDGEN for maximum engagement?" },
    { label: "Troubleshoot issues", message: "I'm having issues with tweet submission - can you diagnose the problem?" },
    { label: "Engagement analysis", message: "How are points calculated based on likes, retweets, and replies?" }
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
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-[#f7931a] hover:bg-[#e8851a] text-white shadow-lg hover:shadow-xl transition-all duration-300"
              size="icon"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -left-2 bg-green-500 text-white border-0 animate-pulse"
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
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]"
          >
            <Card className="bg-gray-900 border-gray-700 shadow-2xl">
              {/* Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Bot className="h-6 w-6 text-[#f7931a]" />
                      <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">Edgen Helper</CardTitle>
                      <p className="text-xs text-gray-400">
                        {isOnline ? 'AI Assistant Online' : 'Offline Mode'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="h-8 w-8 text-gray-400 hover:text-white"
                    >
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 text-gray-400 hover:text-white"
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
                      <ScrollArea className="h-80 px-4">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`flex items-start space-x-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                                  message.role === 'user' 
                                    ? 'bg-[#f7931a]' 
                                    : 'bg-gray-700'
                                }`}>
                                  {message.role === 'user' ? (
                                    <User className="h-4 w-4 text-white" />
                                  ) : (
                                    <Bot className="h-4 w-4 text-[#f7931a]" />
                                  )}
                                </div>
                                <div className={`rounded-lg px-3 py-2 ${
                                  message.role === 'user'
                                    ? 'bg-[#f7931a] text-white'
                                    : 'bg-gray-800 text-gray-100'
                                }`}>
                                  {message.isTyping ? (
                                    <div className="flex items-center space-x-1">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span className="text-sm">{message.content}</span>
                                    </div>
                                  ) : (
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                        <div className="px-4 py-2 border-t border-gray-700">
                          <p className="text-xs text-gray-400 mb-2">Quick actions:</p>
                          <div className="flex flex-wrap gap-1">
                            {quickActions.map((action, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => setInputMessage(action.message)}
                                className="text-xs h-7 border-gray-600 text-gray-300 hover:bg-gray-700"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Input */}
                      <div className="p-4 border-t border-gray-700">
                        <div className="flex space-x-2">
                          <Input
                            ref={inputRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask Edgen Helper anything..."
                            className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                            disabled={isLoading}
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={!inputMessage.trim() || isLoading}
                            className="bg-[#f7931a] hover:bg-[#e8851a] text-white"
                            size="icon"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500">
                            Powered by DeepSeek-R1 via io.net
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearChat}
                            className="text-xs text-gray-400 hover:text-white h-6"
                          >
                            Clear chat
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
