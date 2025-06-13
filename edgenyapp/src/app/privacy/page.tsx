import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Shield, Database, Eye, Lock, UserCheck, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy - LayerEdge Community Platform',
  description: 'Privacy Policy for the LayerEdge community platform. Learn how we collect, use, and protect your personal information and Twitter data.',
  keywords: ['LayerEdge', 'privacy policy', 'data protection', 'GDPR', 'Twitter API', 'user data'],
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg mb-4">
            How we collect, use, and protect your information
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
                <UserCheck className="h-5 w-5 text-green-500" />
                <span>1. Introduction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                LayerEdge ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our LayerEdge Community Platform.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This policy applies to all users of our platform and covers both the information you provide directly and the data we collect through your Twitter/X interactions.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-500" />
                <span>2. Information We Collect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold text-foreground">2.1 Twitter/X Account Information</h4>
              <p className="text-muted-foreground leading-relaxed">
                When you authenticate with Twitter/X, we collect:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Your Twitter username and display name</li>
                <li>Profile picture and bio information</li>
                <li>Twitter user ID and account creation date</li>
                <li>Email address (if provided by Twitter and consented to)</li>
                <li>OAuth access tokens for API interactions</li>
              </ul>

              <Separator className="my-4" />

              <h4 className="font-semibold text-foreground">2.2 Tweet and Engagement Data</h4>
              <p className="text-muted-foreground leading-relaxed">
                For submitted tweets, we collect:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Tweet URLs and content text</li>
                <li>Engagement metrics (likes, retweets, replies)</li>
                <li>Timestamp of tweet creation and submission</li>
                <li>Verification status and point calculations</li>
              </ul>

              <Separator className="my-4" />

              <h4 className="font-semibold text-foreground">2.3 Platform Usage Data</h4>
              <p className="text-muted-foreground leading-relaxed">
                We automatically collect:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Login timestamps and session duration</li>
                <li>Pages visited and features used</li>
                <li>Device information and browser type</li>
                <li>IP address and general location data</li>
                <li>Error logs and performance metrics</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-purple-500" />
                <span>3. How We Use Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We use the collected information to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Provide Platform Services:</strong> Authenticate users, track submissions, calculate points, and maintain leaderboards</li>
                <li><strong>Verify Tweet Ownership:</strong> Ensure users can only submit tweets they authored</li>
                <li><strong>Calculate Engagement:</strong> Monitor tweet performance and award appropriate points</li>
                <li><strong>Display Public Information:</strong> Show usernames, profile pictures, and statistics on leaderboards</li>
                <li><strong>Improve Platform:</strong> Analyze usage patterns to enhance features and user experience</li>
                <li><strong>Communicate Updates:</strong> Send important platform notifications and community updates</li>
                <li><strong>Prevent Abuse:</strong> Detect and prevent fraudulent activity, spam, and terms violations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-orange-500" />
                <span>4. Information Sharing and Disclosure</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold text-foreground">4.1 Public Information</h4>
              <p className="text-muted-foreground leading-relaxed">
                The following information is displayed publicly on our platform:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Twitter username and profile picture</li>
                <li>Total points earned and leaderboard ranking</li>
                <li>Number of tweets submitted</li>
                <li>General activity statistics</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">4.2 Third-Party Services</h4>
              <p className="text-muted-foreground leading-relaxed">
                We share limited data with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>Twitter/X API:</strong> For authentication and tweet verification</li>
                <li><strong>Supabase:</strong> Our database provider for secure data storage</li>
                <li><strong>Koyeb:</strong> Our hosting provider for platform infrastructure</li>
                <li><strong>Analytics Services:</strong> Aggregated, anonymized usage data for platform improvement</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">4.3 Legal Requirements</h4>
              <p className="text-muted-foreground leading-relaxed">
                We may disclose information when required by law, to protect our rights, or to ensure platform security and integrity.
              </p>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-red-500" />
                <span>5. Data Security and Retention</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold text-foreground">5.1 Security Measures</h4>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Encrypted data transmission (HTTPS/TLS)</li>
                <li>Secure database storage with access controls</li>
                <li>OAuth 2.0 authentication for Twitter integration</li>
                <li>Regular security audits and monitoring</li>
                <li>Limited access to personal data on a need-to-know basis</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">5.2 Data Retention</h4>
              <p className="text-muted-foreground leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide services. You may request account deletion at any time, after which we will remove your personal information within 30 days, except where retention is required by law.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>6. Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Objection:</strong> Object to certain processing of your information</li>
                <li><strong>Withdrawal:</strong> Withdraw consent for data processing where applicable</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise these rights, please contact us at privacy@layeredge.io.
              </p>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>7. Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized content and features</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                For detailed information about our cookie usage, please see our Cookie Policy.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>8. Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us:
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
            This Privacy Policy is effective as of {new Date().toLocaleDateString()} and applies to all users of the LayerEdge Community Platform.
          </p>
        </div>
      </div>
    </div>
  )
}
