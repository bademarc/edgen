'use client'

import { Button } from "@/components/ui/button"
import { ArrowRight, Globe, Shield, Users, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { PlatformStatistics } from "@/components/ui/platform-statistics"
import { HomepageFAQ } from "@/components/ui/homepage-faq"

// Clickable Image Component with hover effects and modal
interface ClickableImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  style?: React.CSSProperties
}

function ClickableImage({ src, alt, width, height, className, style }: ClickableImageProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer transition-all duration-300 hover:scale-110 hover:brightness-125 hover:drop-shadow-[0_0_40px_rgba(247,147,26,1)] group">
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`${className} transition-all duration-300 group-hover:contrast-125 group-hover:saturate-150`}
            style={style}
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full p-0 bg-background/95 backdrop-blur-md border-primary/20">
        <div className="relative w-full h-[80vh] flex items-center justify-center p-4">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            style={{
              filter: 'brightness(1.2) contrast(1.2) saturate(1.1)'
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Announcement Banner */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="container mx-auto px-4 py-2">
          <p className="text-center text-sm text-muted-foreground">
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-medium mr-2">
              Announcement
            </span>
            Join the LayerEdge community and start earning points for your X/Twitter engagement!
            <Link href="/about" className="ml-2 text-primary hover:underline inline-flex items-center">
              Learn more <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Images with Enhanced Visibility and Animations */}
        <div className="absolute inset-0">
          {/* Main featured image on the right center */}
          <div className="absolute top-1/2 right-16 -translate-y-1/2 opacity-95 animate-float-slow animate-pulse-glow hidden lg:block z-20">
            <ClickableImage
              src="/home/1.png"
              alt="LayerEdge Featured"
              width={500}
              height={500}
              className="object-contain drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 35px rgba(247, 147, 26, 0.9)) brightness(1.4) contrast(1.4) saturate(1.3)'
              }}
            />
          </div>

          {/* All floating images positioned around the hero content - MASSIVE & HIGHLY VISIBLE */}
          <div className="absolute top-8 left-8 opacity-95 animate-float-slow animate-pulse-glow hidden lg:block z-20">
            <ClickableImage
              src="/home/2.png"
              alt="LayerEdge Element"
              width={400}
              height={400}
              className="object-contain drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 25px rgba(247, 147, 26, 0.7)) brightness(1.3) contrast(1.3) saturate(1.2)'
              }}
            />
          </div>

          <div className="absolute top-8 right-8 opacity-95 animate-float-delayed animate-pulse-glow hidden lg:block z-20">
            <ClickableImage
              src="/home/3.png"
              alt="LayerEdge Element"
              width={380}
              height={380}
              className="object-contain drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(247, 147, 26, 0.6)) brightness(1.3) contrast(1.3) saturate(1.2)'
              }}
            />
          </div>

          <div className="absolute bottom-8 left-8 opacity-95 animate-float-slow animate-pulse-glow hidden lg:block z-20">
            <ClickableImage
              src="/home/4.png"
              alt="LayerEdge Element"
              width={360}
              height={360}
              className="object-contain drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(247, 147, 26, 0.6)) brightness(1.3) contrast(1.3) saturate(1.2)'
              }}
            />
          </div>

          <div className="absolute bottom-8 right-8 opacity-95 animate-float-delayed animate-pulse-glow hidden lg:block z-20">
            <ClickableImage
              src="/home/5.png"
              alt="LayerEdge Element"
              width={340}
              height={340}
              className="object-contain drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 25px rgba(247, 147, 26, 0.7)) brightness(1.3) contrast(1.3) saturate(1.2)'
              }}
            />
          </div>

          {/* Additional elements for mobile/tablet - LARGE & VISIBLE */}
          <div className="absolute top-16 right-4 opacity-90 animate-float-slow animate-pulse-glow hidden md:block lg:hidden z-20">
            <ClickableImage
              src="/home/2.png"
              alt="LayerEdge Element"
              width={250}
              height={250}
              className="object-contain drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 15px rgba(247, 147, 26, 0.6)) brightness(1.3) contrast(1.3) saturate(1.2)'
              }}
            />
          </div>

          <div className="absolute bottom-16 left-4 opacity-90 animate-float-delayed animate-pulse-glow hidden md:block lg:hidden z-20">
            <ClickableImage
              src="/home/4.png"
              alt="LayerEdge Element"
              width={230}
              height={230}
              className="object-contain drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 15px rgba(247, 147, 26, 0.6)) brightness(1.3) contrast(1.3) saturate(1.2)'
              }}
            />
          </div>
        </div>

        {/* Minimal Gradient Overlays for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-background/30 to-background/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/20" />

        {/* Orange accent gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/10 to-primary/20" />

        {/* Content - Mobile Optimized */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tighter leading-tight">
                LAYEREDGE
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 mt-1 sm:mt-2">
                  COMMUNITY
                </span>
                <span className="block mt-1 sm:mt-2">PLATFORM</span>
              </h1>
            </div>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto backdrop-blur-sm bg-background/20 rounded-lg p-3 sm:p-4 leading-relaxed">
              Earn points for engaging with LayerEdge content on X/Twitter. Connect, compete, and climb the leaderboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4 max-w-md sm:max-w-none mx-auto">
              <Button size="lg" asChild className="backdrop-blur-sm w-full sm:w-auto min-h-[48px] text-base">
                <Link href="/login">Join Community</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="backdrop-blur-sm w-full sm:w-auto min-h-[48px] text-base">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </section>

      {/* Features Section - Mobile Optimized */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">How It Works</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-2">
              Engage with LayerEdge content on X/Twitter and earn points for your participation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-card border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover-lift touch-friendly">
              <Shield className="h-8 w-8 text-primary mb-3 sm:mb-4" />
              <h3 className="font-semibold mb-2 text-base sm:text-lg">Connect Account</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Link your X/Twitter account to start tracking your engagement
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover-lift touch-friendly">
              <Users className="h-8 w-8 text-primary mb-3 sm:mb-4" />
              <h3 className="font-semibold mb-2 text-base sm:text-lg">Engage Content</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Like, retweet, and comment on LayerEdge posts to earn points
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover-lift touch-friendly">
              <Zap className="h-8 w-8 text-primary mb-3 sm:mb-4" />
              <h3 className="font-semibold mb-2 text-base sm:text-lg">Earn Points</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get rewarded for authentic engagement with the community
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover-lift touch-friendly">
              <Globe className="h-8 w-8 text-primary mb-3 sm:mb-4" />
              <h3 className="font-semibold mb-2 text-base sm:text-lg">Climb Leaderboard</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Compete with other community members for the top spots
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Statistics */}
      <PlatformStatistics />

      {/* FAQ Section */}
      <HomepageFAQ />

      {/* CTA Section - Mobile Optimized */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">Ready to Join the LayerEdge Community?</h2>
          <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8 px-2">
            Start earning points for your X/Twitter engagement today
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Button size="lg" asChild className="w-full sm:w-auto min-h-[48px] text-base">
              <Link href="/login">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto min-h-[48px] text-base">
              <Link href="/leaderboard">View Leaderboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
