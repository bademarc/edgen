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
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-layeredge-orange to-layeredge-orange-light flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-black">LE</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">
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
            <div className="ml-10 flex items-baseline space-x-4">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    'text-muted-foreground hover:text-foreground hover:bg-muted'
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
              <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
            ) : session ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <div className="text-sm">
                    <p className="text-foreground font-medium">
                      {session.user?.name || session.user?.xUsername}
                    </p>
                    {session.user?.totalPoints !== undefined && (
                      <p className="text-muted-foreground">
                        {session.user.totalPoints} points
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('twitter')}
                className="btn-layeredge-primary px-6 py-2 rounded-lg text-sm font-semibold"
              >
                Sign in with X
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
            className="md:hidden bg-card border-t border-border"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              {/* Mobile Auth */}
              <div className="pt-4 border-t border-border">
                {session ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 px-3 py-2">
                      {session.user?.image && (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <div className="text-sm">
                        <p className="text-foreground font-medium">
                          {session.user?.name || session.user?.xUsername}
                        </p>
                        {session.user?.totalPoints !== undefined && (
                          <p className="text-muted-foreground">
                            {session.user.totalPoints} points
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        signOut()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-md"
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
                    className="w-full btn-layeredge-primary px-3 py-2 rounded-lg text-base font-semibold"
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
