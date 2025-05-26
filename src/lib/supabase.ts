import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const createClientComponentClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Legacy client for backward compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (you can generate these with `supabase gen types typescript --local`)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          x_username: string | null
          x_user_id: string | null
          image: string | null
          total_points: number
          rank: number | null
          auto_monitoring_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          name?: string | null
          x_username?: string | null
          x_user_id?: string | null
          image?: string | null
          total_points?: number
          rank?: number | null
          auto_monitoring_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          x_username?: string | null
          x_user_id?: string | null
          image?: string | null
          total_points?: number
          rank?: number | null
          auto_monitoring_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
