import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        xUsername: true,
        xUserId: true,
        autoMonitoringEnabled: true,
        tweetMonitoring: {
          select: {
            status: true,
            errorMessage: true,
            lastCheckAt: true,
          }
        }
      }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate Twitter credentials
    const hasValidCredentials = !!(dbUser.xUsername && dbUser.xUserId)
    const credentialIssues: string[] = []

    if (!dbUser.xUsername) {
      credentialIssues.push('Missing Twitter username')
    }
    if (!dbUser.xUserId) {
      credentialIssues.push('Missing Twitter user ID')
    }

    // Check monitoring status
    const monitoringStatus = dbUser.tweetMonitoring[0]
    const hasMonitoringError = monitoringStatus?.status === 'error'

    return NextResponse.json({
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        xUsername: dbUser.xUsername,
        xUserId: dbUser.xUserId,
        autoMonitoringEnabled: dbUser.autoMonitoringEnabled,
      },
      validation: {
        hasValidCredentials,
        credentialIssues,
        hasMonitoringError,
        monitoringErrorMessage: monitoringStatus?.errorMessage,
        lastCheck: monitoringStatus?.lastCheckAt,
      },
      recommendations: hasValidCredentials ? [] : [
        'Sign out and sign in again with Twitter to refresh your credentials',
        'Ensure you grant all requested permissions during Twitter OAuth',
        'Check that your Twitter account is active and accessible'
      ]
    })

  } catch (error) {
    console.error('Error validating user credentials:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'repair') {
      // Attempt to repair user credentials by resetting monitoring status
      await prisma.tweetMonitoring.upsert({
        where: { userId: user.id },
        update: {
          status: 'error',
          errorMessage: 'Credentials need refresh - please re-authenticate with Twitter',
        },
        create: {
          userId: user.id,
          status: 'error',
          errorMessage: 'Credentials need refresh - please re-authenticate with Twitter',
          tweetsFound: 0,
        },
      })

      // Disable monitoring until re-authentication
      await prisma.user.update({
        where: { id: user.id },
        data: {
          autoMonitoringEnabled: false,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'User monitoring status updated. Please re-authenticate with Twitter.',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error repairing user credentials:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
