'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signIn, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  TrophyIcon,
  PlusIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon, requiresAuth: true },
  { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
  { name: 'Submit Tweet', href: '/submit', icon: PlusIcon, requiresAuth: true },
  { name: 'About', href: '/about', icon: InformationCircleIcon },
  { name: 'FAQ', href: '/faq', icon: QuestionMarkCircleIcon },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()

  const filteredNavigation = navigation.filter(item =>
    !item.requiresAuth || (item.requiresAuth && session)
  )

  return (
    <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/50 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 hover-lift group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-layeredge-orange to-layeredge-orange-light flex items-center justify-center shadow-lg hover-glow group-hover:scale-105 transition-all duration-300">
                <span className="text-sm font-bold text-black">LE</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground group-hover:text-layeredge-orange transition-colors">
                  LayerEdge
                </span>
                <span className="text-sm text-layeredge-gradient font-semibold -mt-1">
                  $Edgen Community
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover-lift',
                    'text-muted-foreground hover:text-layeredge-orange hover:bg-layeredge-orange/10 border border-transparent hover:border-layeredge-orange/20'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Button */}
          <div className="hidden md:block">
            {status === 'loading' ? (
              <div className="h-10 w-24 skeleton-layeredge rounded-lg" />
            ) : session ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 card-layeredge px-4 py-2">
                  {session.user?.image && (
                    <div className="relative">
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full ring-2 ring-border hover:ring-layeredge-orange transition-all duration-300"
                      />
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-success rounded-full border-2 border-card"></div>
                    </div>
                  )}
                  <div className="text-sm">
                    <p className="text-foreground font-medium">
                      {session.user?.name || session.user?.xUsername}
                    </p>
                    {session.user?.totalPoints !== undefined && (
                      <div className="badge-layeredge-primary text-xs">
                        {session.user.totalPoints} points
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="btn-layeredge-ghost px-4 py-2 rounded-lg text-sm font-medium hover-lift"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('twitter')}
                className="btn-layeredge-primary px-6 py-2 rounded-lg text-sm font-semibold hover-lift"
              >
                Sign in with X
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-layeredge-orange hover:bg-layeredge-orange/10 transition-all duration-300 border border-transparent hover:border-layeredge-orange/20"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
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
            className="md:hidden bg-card/95 backdrop-blur-xl border-t border-border/50"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-layeredge-orange hover:bg-layeredge-orange/10 transition-all duration-300 border border-transparent hover:border-layeredge-orange/20"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              {/* Mobile Auth */}
              <div className="pt-4 mt-4 border-t border-border/50">
                {session ? (
                  <div className="space-y-3">
                    <div className="card-layeredge p-4">
                      <div className="flex items-center space-x-3">
                        {session.user?.image && (
                          <div className="relative">
                            <Image
                              src={session.user.image}
                              alt={session.user.name || 'User'}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full ring-2 ring-border"
                            />
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-success rounded-full border-2 border-card"></div>
                          </div>
                        )}
                        <div className="text-sm">
                          <p className="text-foreground font-medium">
                            {session.user?.name || session.user?.xUsername}
                          </p>
                          {session.user?.totalPoints !== undefined && (
                            <div className="badge-layeredge-primary text-xs mt-1">
                              {session.user.totalPoints} points
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        signOut()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full btn-layeredge-ghost px-4 py-3 rounded-lg text-base font-medium"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      signIn('twitter')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full btn-layeredge-primary px-4 py-3 rounded-lg text-base font-semibold"
                  >
                    Sign in with X
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
