import { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      xUsername?: string | null
      xUserId?: string | null
      totalPoints?: number
      rank?: number | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    xUsername?: string | null
    xUserId?: string | null
    totalPoints?: number
    rank?: number | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    xUsername?: string | null
    xUserId?: string | null
    totalPoints?: number
    rank?: number | null
  }
}
