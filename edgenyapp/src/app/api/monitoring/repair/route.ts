import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET || 'layeredge-admin-secret-2024-dashboard-access'
    
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    console.log('🔧 Starting user data repair process...')

    // Find users with incomplete Twitter data
    const problematicUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            // Users with xUserId but no xUsername
            xUserId: { not: null },
            xUsername: null
          },
          {
            // Users with empty xUsername
            xUsername: ''
          },
          {
            // Users with xUsername but no xUserId
            xUsername: { not: null },
            xUserId: null
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        xUsername: true,
        xUserId: true,
        autoMonitoringEnabled: true,
      }
    })

    console.log(`Found ${problematicUsers.length} users with incomplete Twitter data`)

    const repairResults = {
      totalProblematicUsers: problematicUsers.length,
      usersRepaired: 0,
      usersDisabled: 0,
      errors: [] as string[]
    }

    // Process each problematic user
    for (const user of problematicUsers) {
      try {
        console.log(`Processing user ${user.id} (${user.name || 'no name'})`)

        // Disable monitoring for users with incomplete data
        await prisma.user.update({
          where: { id: user.id },
          data: {
            autoMonitoringEnabled: false
          }
        })

        // Update their monitoring status
        await prisma.tweetMonitoring.upsert({
          where: { userId: user.id },
          update: {
            status: 'error',
            errorMessage: 'Incomplete Twitter data - please re-authenticate to enable monitoring'
          },
          create: {
            userId: user.id,
            status: 'error',
            errorMessage: 'Incomplete Twitter data - please re-authenticate to enable monitoring',
            tweetsFound: 0
          }
        })

        repairResults.usersDisabled++
        console.log(`✅ Disabled monitoring for user ${user.name || user.id}`)

      } catch (error) {
        const errorMsg = `Failed to repair user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        repairResults.errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }

    // Get final statistics
    const finalStats = await prisma.user.findMany({
      where: {
        autoMonitoringEnabled: true
      },
      select: {
        id: true,
        name: true,
        xUsername: true,
        xUserId: true,
      }
    })

    const validUsers = finalStats.filter(u => u.xUsername && u.xUserId && u.xUsername.length > 0)
    const stillInvalidUsers = finalStats.filter(u => !u.xUsername || !u.xUserId || u.xUsername.length === 0)

    console.log(`🎉 Repair completed: ${repairResults.usersDisabled} users disabled, ${validUsers.length} valid users remaining`)

    return NextResponse.json({
      success: true,
      message: 'User data repair completed',
      results: {
        ...repairResults,
        validUsersRemaining: validUsers.length,
        invalidUsersRemaining: stillInvalidUsers.length,
        validUsers: validUsers.map(u => ({
          name: u.name,
          username: u.xUsername
        }))
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in user repair endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET || 'layeredge-admin-secret-2024-dashboard-access'
    
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Analyze current user data state
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        xUsername: true,
        xUserId: true,
        autoMonitoringEnabled: true,
      }
    })

    const analysis = {
      totalUsers: allUsers.length,
      usersWithCompleteTwitterData: allUsers.filter(u => u.xUsername && u.xUserId && u.xUsername.length > 0).length,
      usersWithIncompleteTwitterData: allUsers.filter(u => !u.xUsername || !u.xUserId || u.xUsername.length === 0).length,
      usersWithMonitoringEnabled: allUsers.filter(u => u.autoMonitoringEnabled).length,
      usersWithMonitoringDisabled: allUsers.filter(u => !u.autoMonitoringEnabled).length,
      problematicUsers: allUsers.filter(u => 
        (!u.xUsername || !u.xUserId || u.xUsername.length === 0) && u.autoMonitoringEnabled
      ).map(u => ({
        id: u.id,
        name: u.name,
        xUsername: u.xUsername || 'MISSING',
        xUserId: u.xUserId || 'MISSING',
        issue: !u.xUsername ? 'Missing username' : !u.xUserId ? 'Missing user ID' : 'Empty username'
      }))
    }

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in user analysis endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
