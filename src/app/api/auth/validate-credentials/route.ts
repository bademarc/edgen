import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate Twitter credentials
    const hasValidCredentials = !!(user.xUsername && user.xUserId)
    const credentialIssues: string[] = []

    if (!user.xUsername) {
      credentialIssues.push('Missing Twitter username')
    }
    if (!user.xUserId) {
      credentialIssues.push('Missing Twitter user ID')
    }

    // Check monitoring status
    const monitoringStatus = user.tweetMonitoring[0]
    const hasMonitoringError = monitoringStatus?.status === 'error'

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xUsername: user.xUsername,
        xUserId: user.xUserId,
        autoMonitoringEnabled: user.autoMonitoringEnabled,
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
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
        where: { userId: session.user.id },
        update: {
          status: 'error',
          errorMessage: 'Credentials need refresh - please re-authenticate with Twitter',
        },
        create: {
          userId: session.user.id,
          status: 'error',
          errorMessage: 'Credentials need refresh - please re-authenticate with Twitter',
          tweetsFound: 0,
        },
      })

      // Disable monitoring until re-authentication
      await prisma.user.update({
        where: { id: session.user.id },
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
