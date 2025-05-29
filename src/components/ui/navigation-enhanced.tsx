'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../AuthProvider'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  TrophyIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { Button } from './button'
import { Badge } from './badge'
import { Card } from './card'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon, requiresAuth: true },
  { name: 'Recent Submissions', href: '/recent', icon: ChatBubbleLeftRightIcon },
  { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
  { name: 'About', href: '/about', icon: InformationCircleIcon },
  { name: 'FAQ', href: '/faq', icon: QuestionMarkCircleIcon },
]

export function NavigationEnhanced() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isLoading, signInWithTwitter, signOut } = useAuth()

  const filteredNavigation = navigation.filter(item =>
    !item.requiresAuth || (item.requiresAuth && user)
  )

  return (
    <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/50 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 hover-lift group">
              <Image
                src="/icon/-AlLx9IW_400x400.png"
                alt="LayerEdge Logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl shadow-lg hover-glow group-hover:scale-105 transition-all duration-300"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground group-hover:text-layeredge-orange transition-colors">
                  LayerEdge
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  $Edgen Community
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-layeredge-orange px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2 hover:bg-muted/50"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || user.xUsername || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full ring-2 ring-border"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center ring-2 ring-border">
                        <span className="text-xs font-medium text-muted-foreground">
                          {(user.name || user.xUsername || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="text-foreground font-medium">
                      {user.name || user.xUsername}
                    </p>
                    {user.totalPoints !== undefined && (
                      <Badge variant="points" size="sm">
                        {user.totalPoints} points
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <Button
                variant="layeredge"
                size="default"
                onClick={() => signInWithTwitter()}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in with X'}
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50"
          >
            <Card variant="glass" className="m-4 p-4">
              <div className="space-y-1">
                {filteredNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-muted-foreground hover:text-layeredge-orange block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-3 hover:bg-muted/50"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>

              {/* Mobile Auth */}
              <div className="mt-4 pt-4 border-t border-border/50">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 px-3">
                      <div className="relative">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || user.xUsername || 'User'}
                            width={40}
                            height={40}
                            className="rounded-full ring-2 ring-border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center ring-2 ring-border">
                            <span className="text-sm font-medium text-muted-foreground">
                              {(user.name || user.xUsername || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="text-foreground font-medium">
                          {user.name || user.xUsername}
                        </p>
                        {user.totalPoints !== undefined && (
                          <Badge variant="points" size="sm" className="mt-1">
                            {user.totalPoints} points
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        signOut()
                        setMobileMenuOpen(false)
                      }}
                    >
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="layeredge"
                    className="w-full"
                    onClick={() => {
                      signInWithTwitter()
                      setMobileMenuOpen(false)
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in with X'}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
