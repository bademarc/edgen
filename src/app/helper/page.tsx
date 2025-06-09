'use client'

/**
 * Helper Page - Full-screen AI Chat Interface
 * Dedicated page for extended conversations with Edgen Helper AI
 * Powered by io.net Intelligence API with DeepSeek-R1-0528 model
 */

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageCircle,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
}

export default function HelperPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [currentMode, setCurrentMode] = useState('AI Assistant')
  const [sessionStats, setSessionStats] = useState({ messagesCount: 0, tokensUsed: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        content: "# 👋 Welcome to Edgen Helper!\n\nI'm your dedicated LayerEdge community assistant, powered by **DeepSeek-R1 AI**.\n\n## 🎯 How I can help you:\n\n• **Tweet Submission & Optimization** - Learn the best strategies for earning maximum points\n• **Points System Mastery** - Understand how engagement translates to rewards\n• **Hashtag Strategy** - Master the use of @layeredge and $EDGEN mentions\n• **Platform Navigation** - Get help with any LayerEdge feature\n• **Troubleshooting** - Solve issues with submissions, login, or account problems\n• **Community Insights** - Learn about LayerEdge ecosystem and opportunities\n\n## 💬 **Try asking me:**\n- \"How do I maximize my points on LayerEdge?\"\n- \"What's the best way to submit tweets?\"\n- \"I'm having trouble with my account\"\n- \"Explain the LayerEdge community platform\"\n\n**Ready to help you succeed in the LayerEdge community!** 🚀",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [messages.length])

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
      content: 'Edgen Helper is analyzing your question...',
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

        // Update session stats
        setSessionStats(prev => ({
          messagesCount: prev.messagesCount + 1,
          tokensUsed: prev.tokensUsed + (data.usage?.totalTokens || 0)
        }))

        // Update online status and mode based on response
        if (data.isOffline) {
          setIsOnline(false)
          setCurrentMode(data.mode || 'Enhanced Offline')
        } else {
          setIsOnline(true)
          setCurrentMode('DeepSeek-R1 Online')
        }
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'))
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm experiencing technical difficulties. For immediate help:\n\n• **Submit Tweets**: Visit `/submit` page\n• **Check Dashboard**: View your current points at `/dashboard`\n• **Browse FAQ**: Get answers at `/faq`\n• **Contact Support**: Reach out through our community channels\n\nI'll be back online shortly! 🔧",
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
      <div className="container mx-auto px-4 py-6 h-screen flex flex-col max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#f7931a] to-[#e8851a] flex items-center justify-center shadow-lg">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground">Edgen Helper</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center space-x-2">
                      <span>{currentMode}</span>
                      {isOnline ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
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
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear
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
          className="flex-1 flex flex-col"
        >
          <Card className="flex-1 flex flex-col bg-card/30 backdrop-blur-sm border-border/50">
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-6">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-[#f7931a] text-white' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="h-5 w-5" />
                          ) : (
                            <Bot className="h-5 w-5" />
                          )}
                        </div>
                        <div className={`flex flex-col space-y-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-2xl px-4 py-3 max-w-none ${
                            message.role === 'user'
                              ? 'bg-[#f7931a] text-white'
                              : message.isTyping
                              ? 'bg-muted/50 text-muted-foreground'
                              : 'bg-muted text-foreground'
                          }`}>
                            {message.isTyping ? (
                              <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{message.content}</span>
                              </div>
                            ) : (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                {message.content.split('\n').map((line, index) => {
                                  if (line.startsWith('# ')) {
                                    return <h1 key={index} className="text-lg font-bold mb-2 mt-0">{line.substring(2)}</h1>
                                  } else if (line.startsWith('## ')) {
                                    return <h2 key={index} className="text-base font-semibold mb-2 mt-3">{line.substring(3)}</h2>
                                  } else if (line.startsWith('• ')) {
                                    return <p key={index} className="mb-1">• {line.substring(2)}</p>
                                  } else if (line.startsWith('- ')) {
                                    return <p key={index} className="mb-1">- {line.substring(2)}</p>
                                  } else if (line.includes('**') && line.includes('**')) {
                                    const parts = line.split('**')
                                    return (
                                      <p key={index} className="mb-1">
                                        {parts.map((part, i) => 
                                          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                        )}
                                      </p>
                                    )
                                  } else if (line.trim()) {
                                    return <p key={index} className="mb-1">{line}</p>
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
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <Separator />

              {/* Input Area */}
              <div className="p-6">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Edgen Helper anything about LayerEdge..."
                      className="pr-12 h-12 text-base bg-background/50 border-border/50 focus:border-[#f7931a]/50 focus:ring-[#f7931a]/20"
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="h-12 px-6 bg-[#f7931a] hover:bg-[#e8851a] text-white font-medium"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Powered by DeepSeek-R1 via io.net Intelligence API • Press Enter to send
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
