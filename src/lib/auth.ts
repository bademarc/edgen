import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import TwitterProvider from 'next-auth/providers/twitter'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],
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
    async signIn({ user, account, profile }) {
      if (account?.provider === 'twitter' && profile) {
        // Update user with Twitter data
        await prisma.user.update({
          where: { id: user.id },
          data: {
            xUsername: (profile as any).username,
            xUserId: (profile as any).id,
          },
        })
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'database',
  },
}
