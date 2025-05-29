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
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Badge } from './badge'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './sheet'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from './navigation-menu'
import { Separator } from './separator'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon, requiresAuth: true },
  { name: 'Contributors', href: '/leaderboard', icon: TrophyIcon },
  { name: 'Contribute', href: '/submit', icon: ChatBubbleLeftRightIcon },
]

const moreNavigation = [
  { name: 'About', href: '/about', icon: InformationCircleIcon },
  { name: 'FAQ', href: '/faq', icon: QuestionMarkCircleIcon },
  { name: 'Recent Activity', href: '/recent', icon: ChatBubbleLeftRightIcon },
]

export function NavigationProfessional() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isLoading, signInWithTwitter, signOut } = useAuth()

  const filteredNavigation = navigation.filter(item =>
    !item.requiresAuth || (item.requiresAuth && user)
  )

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border bg-background shadow-sm"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex items-center space-x-3 group">
              <Image
                src="/icon/-AlLx9IW_400x400.png"
                alt="LayerEdge Logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl shadow-md group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-200"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-primary">
                  LayerEdge
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Community Platform
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavigationMenu>
              <NavigationMenuList>
                {filteredNavigation.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                        )}
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.name}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}

                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    <span className="flex items-center">
                      More
                      <ChevronDownIcon className="ml-1 h-3 w-3" />
                    </span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-[400px]">
                      <div className="row-span-3">
                        <NavigationMenuLink asChild>
                          <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                            <SparklesIcon className="h-6 w-6" />
                            <div className="mb-2 mt-4 text-lg font-medium">
                              LayerEdge
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Engage with LayerEdge content on X/Twitter and earn points for your participation.
                            </p>
                          </div>
                        </NavigationMenuLink>
                      </div>
                      {moreNavigation.map((item) => (
                        <NavigationMenuLink key={item.name} asChild>
                          <Link
                            href={item.href}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center space-x-2">
                              <item.icon className="h-4 w-4" />
                              <div className="text-sm font-medium leading-none">{item.name}</div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {item.name === 'About' ? 'Learn about LayerEdge and the $EDGEN community platform' :
                               item.name === 'FAQ' ? 'Frequently asked questions about earning points and engagement' :
                               'View recent community tweets and engagement activity'}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8 ring-2 ring-border">
                    <AvatarImage src={user.image || ''} alt={user.name || user.xUsername || 'User'} />
                    <AvatarFallback>
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="text-foreground font-medium">
                      {user.name || user.xUsername}
                    </p>
                    {user.totalPoints !== undefined && (
                      <Badge variant="points" size="sm">
                        <SparklesIcon className="h-3 w-3 mr-1" />
                        {user.totalPoints} points
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            ) : (
              <Button
                variant="layeredge"
                size="default"
                onClick={() => signInWithTwitter()}
                disabled={isLoading}
                className="relative overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Connecting...
                  </div>
                ) : (
                  'Sign in with X'
                )}
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Bars3Icon className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">LE</span>
                    </div>
                    <span>LayerEdge Menu</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Mobile Navigation */}
                  <div className="space-y-1">
                    {filteredNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    ))}

                    <Separator className="my-4" />

                    {moreNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Mobile Auth */}
                  <div className="pt-4 border-t border-border">
                    {user ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 px-3">
                          <Avatar className="h-10 w-10 ring-2 ring-border">
                            <AvatarImage src={user.image || ''} alt={user.name || user.xUsername || 'User'} />
                            <AvatarFallback>
                              <UserIcon className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            <p className="text-foreground font-medium">
                              {user.name || user.xUsername}
                            </p>
                            {user.totalPoints !== undefined && (
                              <Badge variant="points" size="sm" className="mt-1">
                                <SparklesIcon className="h-3 w-3 mr-1" />
                                {user.totalPoints} points
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            signOut()
                            setMobileMenuOpen(false)
                          }}
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
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
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                            Connecting...
                          </div>
                        ) : (
                          'Sign in with X'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
