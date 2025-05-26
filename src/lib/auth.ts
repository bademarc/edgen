// DEPRECATED: This file contains NextAuth.js configuration that is no longer used
// The application now uses Supabase Auth exclusively for Twitter OAuth
// This file is kept for reference but should not be imported or used

/*
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import TwitterProvider from 'next-auth/providers/twitter'
import { prisma } from './db'

interface TwitterProfile {
  id: string
  username?: string
  name: string
  email?: string
  // Twitter API v2 might use different field names
  data?: {
    id: string
    username: string
    name: string
  }
  // Legacy Twitter API v1.1 fields for fallback compatibility
  screen_name?: string
  id_str?: string
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
      authorization: {
        url: 'https://twitter.com/i/oauth2/authorize',
        params: {
          scope: 'users.read tweet.read offline.access',
        },
      },
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id

        try {
          // Get additional user data from database with comprehensive error handling
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              xUsername: true,
              xUserId: true,
              totalPoints: true,
              rank: true,
              autoMonitoringEnabled: true,
            },
          })

          if (dbUser) {
            session.user.xUsername = dbUser.xUsername
            session.user.xUserId = dbUser.xUserId
            session.user.totalPoints = dbUser.totalPoints
            session.user.rank = dbUser.rank

            // Log session data for debugging
            console.log('Session callback - User data:', {
              userId: user.id,
              hasXUsername: !!dbUser.xUsername,
              hasXUserId: !!dbUser.xUserId,
              monitoringEnabled: dbUser.autoMonitoringEnabled
            })
          } else {
            console.warn('Session callback - User not found in database:', user.id)
          }
        } catch (error) {
          console.error('Session callback - Database error:', error)
          // Continue with session creation even if database lookup fails
        }
      }
      return session
    },
    async signIn() {
      // Always allow sign in - the user creation is handled by the adapter
      return true
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      // This event runs after the user is created/updated by the adapter
      if (account?.provider === 'twitter' && profile && user.id) {
        try {
          const twitterProfile = profile as TwitterProfile

          // Enhanced Twitter profile data extraction with multiple fallbacks
          let twitterUsername: string | undefined
          let twitterId: string | undefined

          // Try different possible field structures from Twitter API
          if (twitterProfile.data) {
            // Twitter API v2 structure
            twitterUsername = twitterProfile.data.username
            twitterId = twitterProfile.data.id
          } else {
            // Direct profile structure
            twitterUsername = twitterProfile.username
            twitterId = twitterProfile.id
          }

          // Additional fallbacks for different Twitter API responses
          if (!twitterUsername && twitterProfile.screen_name) {
            twitterUsername = twitterProfile.screen_name
          }
          if (!twitterId && twitterProfile.id_str) {
            twitterId = twitterProfile.id_str
          }

          console.log('Twitter profile data received:', {
            rawProfile: JSON.stringify(profile, null, 2),
            extractedUsername: twitterUsername,
            extractedId: twitterId,
            userId: user.id
          })

          // Enhanced validation with detailed error reporting
          if (!twitterUsername || !twitterId) {
            console.error('❌ Missing Twitter credentials after extraction:', {
              username: twitterUsername,
              id: twitterId,
              userId: user.id,
              profileKeys: Object.keys(profile),
              hasData: !!twitterProfile.data
            })

            // Set monitoring status to error for incomplete data
            await prisma.tweetMonitoring.upsert({
              where: { userId: user.id },
              update: {
                status: 'error',
                errorMessage: 'Incomplete Twitter data received during authentication. Please try signing out and signing in again.',
              },
              create: {
                userId: user.id,
                status: 'error',
                errorMessage: 'Incomplete Twitter data received during authentication. Please try signing out and signing in again.',
                tweetsFound: 0,
              },
            })

            return // Don't update user if Twitter data is incomplete
          }

          console.log('✅ Updating user with Twitter data:', {
            userId: user.id,
            username: twitterUsername,
            twitterId: twitterId,
          })

          // Use upsert to handle both new and existing users
          await prisma.user.upsert({
            where: { id: user.id },
            update: {
              xUsername: twitterUsername,
              xUserId: twitterId,
              autoMonitoringEnabled: true, // Re-enable monitoring on successful auth
            },
            create: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              xUsername: twitterUsername,
              xUserId: twitterId,
              totalPoints: 0,
              autoMonitoringEnabled: true,
            },
          })

          // Initialize tweet monitoring for new or existing users
          await prisma.tweetMonitoring.upsert({
            where: { userId: user.id },
            update: {
              status: 'active',
              errorMessage: null,
              lastCheckAt: new Date(),
            },
            create: {
              userId: user.id,
              status: 'active',
              tweetsFound: 0,
              lastCheckAt: new Date(),
            },
          })

          console.log('✅ Successfully updated user with Twitter data and initialized monitoring')
        } catch (error) {
          console.error('❌ Error updating user with Twitter data:', error)

          // Set error status in monitoring
          try {
            await prisma.tweetMonitoring.upsert({
              where: { userId: user.id },
              update: {
                status: 'error',
                errorMessage: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
              create: {
                userId: user.id,
                status: 'error',
                errorMessage: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tweetsFound: 0,
              },
            })
          } catch (dbError) {
            console.error('❌ Failed to update monitoring status:', dbError)
          }

          // Don't throw error to avoid breaking the sign-in flow
        }
      }
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'database',
  },
}
*/
