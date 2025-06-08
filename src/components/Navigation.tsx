'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
import { Menu, X } from "lucide-react"
import { cn } from '@/lib/utils'

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isLoading, signInWithTwitter, signOut } = useAuth()

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
                    <ListItem href="/leaderboard" title="Leaderboard">
                      See top community contributors
                    </ListItem>
                    <ListItem href="/recent" title="Recent Activity">
                      Latest community engagement
                    </ListItem>
                    <ListItem href="/submit" title="Submit Tweet">
                      Submit your LayerEdge tweets
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/about" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
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
                    )}
                  >
                    FAQ
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

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

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link href="/dashboard" className="block py-2 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
            <Link href="/submit" className="block py-2 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              Submit Tweet
            </Link>
            <Link href="/leaderboard" className="block py-2 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              Leaderboard
            </Link>
            <Link href="/recent" className="block py-2 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              Recent Activity
            </Link>
            <Link href="/about" className="block py-2 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <Link href="/faq" className="block py-2 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </Link>

            {/* Mobile Auth */}
            <div className="pt-4 border-t">
              {user ? (
                <div className="space-y-3">
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
                  className="w-full"
                  onClick={() => {
                    signInWithTwitter()
                    setMobileMenuOpen(false)
                  }}
                >
                  Sign in with X
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
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
