import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollText, Shield, Users, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service - LayerEdge Community Platform',
  description: 'Terms of Service for the LayerEdge community platform. Learn about our community guidelines, points system rules, and user responsibilities.',
  keywords: ['LayerEdge', 'terms of service', 'community guidelines', 'EDGEN', 'platform rules'],
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <ScrollText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground text-lg mb-4">
            LayerEdge Community Platform Terms and Conditions
          </p>
          <Badge variant="outline" className="text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </Badge>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>1. Introduction and Acceptance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Welcome to the LayerEdge Community Platform ("Platform"). These Terms of Service ("Terms") govern your use of our community engagement platform that rewards users for Twitter/X interactions related to LayerEdge and the $EDGEN token.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using our Platform, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access the Platform.
              </p>
            </CardContent>
          </Card>

          {/* Platform Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span>2. Platform Description</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                The LayerEdge Community Platform is a gamified engagement system that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Rewards users with points for Twitter/X posts mentioning "@layeredge" or "$EDGEN"</li>
                <li>Tracks engagement metrics (likes, retweets, replies) to calculate bonus points</li>
                <li>Maintains leaderboards and user rankings based on community participation</li>
                <li>Provides analytics and insights into community engagement</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span>3. User Responsibilities and Conduct</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold text-foreground">3.1 Eligible Content</h4>
              <p className="text-muted-foreground leading-relaxed">
                To earn points, your tweets must:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Contain "@layeredge" or "$EDGEN" mentions (case-insensitive)</li>
                <li>Be posted by your authenticated Twitter/X account</li>
                <li>Be original content created by you</li>
                <li>Comply with Twitter/X Terms of Service</li>
              </ul>

              <Separator className="my-4" />

              <h4 className="font-semibold text-foreground">3.2 Prohibited Activities</h4>
              <p className="text-muted-foreground leading-relaxed">
                Users are prohibited from:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Creating fake or duplicate accounts</li>
                <li>Using automated tools or bots for engagement manipulation</li>
                <li>Submitting tweets authored by other users</li>
                <li>Engaging in spam or repetitive content posting</li>
                <li>Attempting to manipulate the points system or leaderboard rankings</li>
                <li>Sharing inappropriate, offensive, or harmful content</li>
              </ul>
            </CardContent>
          </Card>

          {/* Points System */}
          <Card>
            <CardHeader>
              <CardTitle>4. Points System and Rewards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold text-foreground">4.1 Point Calculation</h4>
              <p className="text-muted-foreground leading-relaxed">
                Points are awarded based on:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Base points for eligible tweet submissions</li>
                <li>Bonus points calculated from engagement metrics (likes, retweets, replies)</li>
                <li>Additional multipliers for high-quality content as determined by community engagement</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">4.2 Point Modifications</h4>
              <p className="text-muted-foreground leading-relaxed">
                LayerEdge reserves the right to adjust, modify, or revoke points for violations of these Terms or suspicious activity. Point calculations may be updated to improve fairness and prevent gaming of the system.
              </p>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card>
            <CardHeader>
              <CardTitle>5. Privacy and Data Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                By using our Platform, you consent to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Collection of your Twitter/X profile information through OAuth authentication</li>
                <li>Tracking of your submitted tweets and their engagement metrics</li>
                <li>Display of your username, profile picture, and statistics on leaderboards</li>
                <li>Use of aggregated, anonymized data for platform analytics and improvements</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                For detailed information about data collection and usage, please review our Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* Platform Availability */}
          <Card>
            <CardHeader>
              <CardTitle>6. Platform Availability and Modifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                LayerEdge reserves the right to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Modify, suspend, or discontinue the Platform at any time</li>
                <li>Update these Terms of Service with reasonable notice</li>
                <li>Implement new features or change existing functionality</li>
                <li>Perform maintenance that may temporarily affect Platform availability</li>
              </ul>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle>7. Disclaimers and Limitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                The Platform is provided "as is" without warranties of any kind. LayerEdge does not guarantee:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Continuous or uninterrupted access to the Platform</li>
                <li>Accuracy of point calculations or engagement metrics</li>
                <li>Availability of Twitter/X API services that the Platform depends on</li>
                <li>Future value or utility of accumulated points</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>8. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-foreground font-medium">LayerEdge Community Team</p>
                <p className="text-muted-foreground">Email: community@layeredge.io</p>
                <p className="text-muted-foreground">Discord: https://discord.gg/layeredge</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            These Terms of Service are effective as of {new Date().toLocaleDateString()} and apply to all users of the LayerEdge Community Platform.
          </p>
        </div>
      </div>
    </div>
  )
}
