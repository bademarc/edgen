import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Cookie, Settings, BarChart3, Shield, Info } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cookie Policy - LayerEdge Community Platform',
  description: 'Cookie Policy for the LayerEdge community platform. Learn about the cookies we use, their purposes, and how to manage your cookie preferences.',
  keywords: ['LayerEdge', 'cookie policy', 'cookies', 'tracking', 'privacy', 'data collection'],
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-orange-500/10">
              <Cookie className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground text-lg mb-4">
            How we use cookies and similar technologies on our platform
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
                <Info className="h-5 w-5 text-blue-500" />
                <span>1. What Are Cookies?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are stored on your device when you visit our LayerEdge Community Platform. They help us provide you with a better experience by remembering your preferences and enabling essential platform functionality.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We also use similar technologies such as local storage, session storage, and web beacons to enhance your experience and analyze platform usage.
              </p>
            </CardContent>
          </Card>

          {/* Types of Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-green-500" />
                <span>2. Types of Cookies We Use</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Essential Cookies */}
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <span>2.1 Essential Cookies (Required)</span>
                </h4>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  These cookies are necessary for the platform to function properly and cannot be disabled.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <ul className="space-y-2 text-sm">
                    <li><strong>Authentication:</strong> Maintain your login session and verify your identity</li>
                    <li><strong>Security:</strong> Protect against cross-site request forgery (CSRF) attacks</li>
                    <li><strong>Session Management:</strong> Remember your preferences during your visit</li>
                    <li><strong>Load Balancing:</strong> Ensure optimal platform performance</li>
                  </ul>
                </div>
              </div>

              <Separator />

              {/* Functional Cookies */}
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-blue-500" />
                  <span>2.2 Functional Cookies</span>
                </h4>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  These cookies enhance your experience by remembering your choices and preferences.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <ul className="space-y-2 text-sm">
                    <li><strong>Theme Preferences:</strong> Remember your dark/light mode selection</li>
                    <li><strong>Language Settings:</strong> Store your preferred language</li>
                    <li><strong>Dashboard Layout:</strong> Remember your customized dashboard preferences</li>
                    <li><strong>Notification Settings:</strong> Store your notification preferences</li>
                  </ul>
                </div>
              </div>

              <Separator />

              {/* Analytics Cookies */}
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <span>2.3 Analytics Cookies</span>
                </h4>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  These cookies help us understand how users interact with our platform to improve our services.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <ul className="space-y-2 text-sm">
                    <li><strong>Usage Analytics:</strong> Track page views, feature usage, and user journeys</li>
                    <li><strong>Performance Monitoring:</strong> Measure page load times and error rates</li>
                    <li><strong>A/B Testing:</strong> Test different features and improvements</li>
                    <li><strong>Engagement Metrics:</strong> Understand which features are most valuable</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>3. Third-Party Cookies and Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We use several third-party services that may set their own cookies:
              </p>
              
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4">
                  <h5 className="font-semibold text-foreground mb-2">Twitter/X Integration</h5>
                  <p className="text-sm text-muted-foreground">
                    Used for OAuth authentication and tweet verification. Twitter may set cookies according to their own privacy policy.
                  </p>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h5 className="font-semibold text-foreground mb-2">Supabase Authentication</h5>
                  <p className="text-sm text-muted-foreground">
                    Our authentication provider may set cookies to manage secure login sessions.
                  </p>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h5 className="font-semibold text-foreground mb-2">Content Delivery Network (CDN)</h5>
                  <p className="text-sm text-muted-foreground">
                    Used to deliver static assets efficiently and may set performance-related cookies.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookie Duration */}
          <Card>
            <CardHeader>
              <CardTitle>4. Cookie Duration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-4">
                  <h5 className="font-semibold text-foreground mb-2">Session Cookies</h5>
                  <p className="text-sm text-muted-foreground">
                    Temporary cookies that are deleted when you close your browser. Used for essential platform functionality.
                  </p>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h5 className="font-semibold text-foreground mb-2">Persistent Cookies</h5>
                  <p className="text-sm text-muted-foreground">
                    Remain on your device for a specified period (typically 30 days to 1 year) to remember your preferences.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Managing Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>5. Managing Your Cookie Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold text-foreground">5.1 Browser Settings</h4>
              <p className="text-muted-foreground leading-relaxed">
                You can control cookies through your browser settings:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Block all cookies (may affect platform functionality)</li>
                <li>Delete existing cookies</li>
                <li>Set preferences for specific websites</li>
                <li>Receive notifications when cookies are set</li>
              </ul>

              <Separator className="my-4" />

              <h4 className="font-semibold text-foreground">5.2 Platform Cookie Settings</h4>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You can manage your cookie preferences for non-essential cookies through our platform settings.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-foreground">Cookie Preferences</h5>
                    <p className="text-sm text-muted-foreground">Manage your cookie settings for this platform</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage Preferences
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>Note:</strong> Disabling certain cookies may affect platform functionality, including login capabilities and personalized features.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Updates to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>6. Updates to This Cookie Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify users of any material changes by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Posting the updated policy on our platform</li>
                <li>Updating the "Last updated" date at the top of this page</li>
                <li>Sending notifications for significant changes</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>7. Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-foreground font-medium">LayerEdge Privacy Team</p>
                <p className="text-muted-foreground">Email: privacy@layeredge.io</p>
                <p className="text-muted-foreground">General Contact: community@layeredge.io</p>
                <p className="text-muted-foreground">Discord: https://discord.gg/layeredge</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            This Cookie Policy is effective as of {new Date().toLocaleDateString()} and applies to all users of the LayerEdge Community Platform.
          </p>
        </div>
      </div>
    </div>
  )
}
