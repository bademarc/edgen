import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side Supabase client for Server Components
export const createServerComponentClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Server-side Supabase client for Route Handlers
export const createRouteHandlerClient = (request: Request) => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get('cookie')
        if (!cookieHeader) return []

        return cookieHeader.split(';').map(cookie => {
          const [name, value] = cookie.trim().split('=')
          return { name, value }
        })
      },
      setAll(cookiesToSet) {
        // For route handlers, we don't need to set cookies in the response
        // The cookies will be handled by the auth callback redirect
        console.log('Setting cookies:', cookiesToSet.map(c => c.name))
      },
    },
  })
}
