import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Authentication Debug Endpoint Called')
    
    // Check universal authentication
    const authResult = await getAuthenticatedUser(request)
    console.log('Universal auth result:', authResult)
    
    // Check Supabase authentication directly
    let supabaseAuth = null
    try {
      const supabase = createRouteHandlerClient(request)
      const { data: { user }, error } = await supabase.auth.getUser()
      supabaseAuth = {
        user: user ? { id: user.id, email: user.email } : null,
        error: error?.message || null
      }
      console.log('Supabase auth result:', supabaseAuth)
    } catch (error) {
      console.error('Supabase auth error:', error)
      supabaseAuth = { error: 'Supabase auth failed' }
    }
    
    // Check custom session cookies
    let customSession = null
    try {
      const cookieStore = await cookies()
      const userId = cookieStore.get('user_id')?.value
      const allCookies = cookieStore.getAll()
      
      customSession = {
        userId: userId || null,
        cookieCount: allCookies.length,
        cookieNames: allCookies.map(c => c.name)
      }
      console.log('Custom session result:', customSession)
    } catch (error) {
      console.error('Custom session error:', error)
      customSession = { error: 'Custom session check failed' }
    }
    
    // Check request headers
    const authHeaders = {
      cookie: request.headers.get('cookie') ? 'present' : 'missing',
      authorization: request.headers.get('authorization') ? 'present' : 'missing',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      universalAuth: authResult,
      supabaseAuth,
      customSession,
      headers: authHeaders,
      url: request.url,
      method: request.method
    })
    
  } catch (error) {
    console.error('Auth debug error:', error)
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
