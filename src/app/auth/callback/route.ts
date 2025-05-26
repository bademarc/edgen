import { createRouteHandlerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createRouteHandlerClient(request)
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      if (data.user) {
        console.log('User authenticated successfully:', data.user.id)
        
        // Redirect to dashboard on successful authentication
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_exception`)
    }
  }

  // If no code or authentication failed, redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
