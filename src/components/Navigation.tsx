'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Menu, Home, BarChart3, MessageSquare, Trophy, HelpCircle, FileText, User, LogOut, Target } from "lucide-react"
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function Navigation() {
  const { user, isLoading, signInWithTwitter, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/icon/-AlLx9IW_400x400.png"
            alt="LayerEdge Logo"
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg"
          />
          <span className="font-bold text-xl">LayerEdge</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/dashboard" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      !user && "opacity-50 pointer-events-none",
                      pathname === "/dashboard" && "bg-accent text-accent-foreground"
                    )}
                  >
                    Dashboard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {user && (
                <NavigationMenuItem>
                  <Link href="/quests" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                        pathname === "/quests" && "bg-accent text-accent-foreground"
                      )}
                    >
                      Quests
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )}
              <NavigationMenuItem>
                <Link href="/leaderboard" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      pathname === "/leaderboard" && "bg-accent text-accent-foreground"
                    )}
                  >
                    Leaderboard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Community</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="/dashboard"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium">Community Platform</div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Earn points for X/Twitter engagement with LayerEdge content
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="/recent" title="Activity Feed">
                      Latest community engagement and updates
                    </ListItem>
                    <ListItem href="/submit-tweet" title="Submit Tweet">
                      Submit your LayerEdge tweets manually
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/helper" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      pathname === "/helper" && "bg-accent text-accent-foreground"
                    )}
                  >
                    Helper
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/about" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      pathname === "/about" && "bg-accent text-accent-foreground"
                    )}
                  >
                    About
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/faq" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      pathname === "/faq" && "bg-accent text-accent-foreground"
                    )}
                  >
                    FAQ
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Theme Toggle and Auth Section */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />

            {/* Auth Button */}
            {isLoading ? (
              <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-card border rounded-lg px-4 py-2">
                  {user.image && (
                    <Image
                      src={user.image}
                      alt={user.name || 'User'}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <div className="text-sm">
                    <p className="font-medium">
                      {user.name || user.xUsername}
                    </p>
                    {user.totalPoints !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        {user.totalPoints} points
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" onClick={() => signOut()}>
                  Sign out
                </Button>
              </div>
            ) : (
              <Button onClick={() => signInWithTwitter()}>
                Sign in with X
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu Button - Enhanced with Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden p-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center space-x-2">
                <Image
                  src="/icon/-AlLx9IW_400x400.png"
                  alt="LayerEdge Logo"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded"
                />
                <span>LayerEdge</span>
              </SheetTitle>
              <SheetDescription>
                Navigate the LayerEdge community platform
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              {/* Navigation Links */}
              <div className="space-y-2">
                <MobileNavLink href="/" icon={Home} label="Home" onNavigate={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/dashboard" icon={BarChart3} label="Dashboard" requiresAuth onNavigate={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/quests" icon={Target} label="Quests" requiresAuth onNavigate={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/leaderboard" icon={Trophy} label="Leaderboard" onNavigate={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/submit-tweet" icon={MessageSquare} label="Submit Tweet" onNavigate={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/recent" icon={FileText} label="Activity Feed" onNavigate={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/helper" icon={HelpCircle} label="Helper" onNavigate={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/about" icon={FileText} label="About" onNavigate={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/faq" icon={HelpCircle} label="FAQ" onNavigate={() => setMobileMenuOpen(false)} />
              </div>

              {/* User Section */}
              <div className="pt-4 border-t">
                {isLoading ? (
                  <div className="h-16 bg-muted animate-pulse rounded-lg" />
                ) : user ? (
                  <div className="space-y-4">
                    <div className="bg-card border rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        {user.image && (
                          <Image
                            src={user.image}
                            alt={user.name || 'User'}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {user.name || user.xUsername}
                          </p>
                          {user.totalPoints !== undefined && (
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {user.totalPoints} points
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        signOut()
                        setMobileMenuOpen(false)
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => {
                      signInWithTwitter()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign in with X
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>


    </header>
  )
}

const ListItem = ({
  className,
  title,
  children,
  href,
  ...props
}: {
  className?: string
  title: string
  children: React.ReactNode
  href: string
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
        </a>
      </NavigationMenuLink>
    </li>
  )
}

const MobileNavLink = ({
  href,
  icon: Icon,
  label,
  requiresAuth = false,
  onNavigate,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  requiresAuth?: boolean
  onNavigate?: () => void
}) => {
  const { user } = useAuth()
  const pathname = usePathname()

  if (requiresAuth && !user) {
    return null
  }

  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  )
}
