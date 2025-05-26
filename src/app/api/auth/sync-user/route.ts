import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, email, name, xUsername, xUserId, image } = body

    // Verify the user ID matches the authenticated user
    if (id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Create or update user in our database
    const userData = await prisma.user.upsert({
      where: { id },
      update: {
        email,
        name,
        xUsername,
        xUserId,
        image,
      },
      create: {
        id,
        email,
        name,
        xUsername,
        xUserId,
        image,
        totalPoints: 0,
        autoMonitoringEnabled: true,
      },
    })

    // Calculate rank
    const rank = await prisma.user.count({
      where: {
        totalPoints: {
          gt: userData.totalPoints,
        },
      },
    }) + 1

    // Return user data in the format expected by the frontend
    const responseData = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      xUsername: userData.xUsername,
      xUserId: userData.xUserId,
      image: userData.image,
      totalPoints: userData.totalPoints,
      rank,
      autoMonitoringEnabled: userData.autoMonitoringEnabled,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error syncing user data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
