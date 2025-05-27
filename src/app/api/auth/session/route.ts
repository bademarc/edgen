import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Get user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        xUsername: true,
        xUserId: true,
        image: true,
        totalPoints: true,
        autoMonitoringEnabled: true,
        joinDate: true
      }
    })

    if (!user) {
      // Clear invalid session cookie
      const response = NextResponse.json({ user: null }, { status: 200 })
      response.cookies.delete('user_id')
      return response
    }

    return NextResponse.json({
      user,
      sessionType: 'custom' // Indicate this is a custom session, not Supabase
    })

  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Logout endpoint
export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true })

    // Clear the custom session cookie
    response.cookies.delete('user_id')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
