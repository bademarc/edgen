import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import TwitterProvider from 'next-auth/providers/twitter'
import { prisma } from './db'

interface TwitterProfile {
  id: string
  username: string
  name: string
  email?: string
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
        // Get additional user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            xUsername: true,
            xUserId: true,
            totalPoints: true,
            rank: true,
          },
        })
        if (dbUser) {
          session.user.xUsername = dbUser.xUsername
          session.user.xUserId = dbUser.xUserId
          session.user.totalPoints = dbUser.totalPoints
          session.user.rank = dbUser.rank
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
          console.log('Updating user with Twitter data:', {
            userId: user.id,
            username: twitterProfile.username,
            twitterId: twitterProfile.id,
          })

          // Use upsert to handle both new and existing users
          await prisma.user.upsert({
            where: { id: user.id },
            update: {
              xUsername: twitterProfile.username,
              xUserId: twitterProfile.id,
            },
            create: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              xUsername: twitterProfile.username,
              xUserId: twitterProfile.id,
              totalPoints: 0,
            },
          })
          console.log('Successfully updated user with Twitter data')
        } catch (error) {
          console.error('Error updating user with Twitter data:', error)
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
