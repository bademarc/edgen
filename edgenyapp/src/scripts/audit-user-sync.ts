import { createClient } from '@supabase/supabase-js'
import { prisma } from '../lib/db'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create admin client for full access
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface SupabaseUser {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    avatar_url?: string
    user_name?: string
    provider_id?: string
  }
  app_metadata?: {
    provider?: string
    providers?: string[]
  }
  created_at: string
  last_sign_in_at?: string
}

interface PrismaUser {
  id: string
  name: string | null
  email: string | null
  xUsername: string | null
  xUserId: string | null
  image: string | null
  totalPoints: number
  autoMonitoringEnabled: boolean
  joinDate: Date
}

interface AuditResult {
  supabaseUsers: SupabaseUser[]
  prismaUsers: PrismaUser[]
  missingInPrisma: SupabaseUser[]
  missingInSupabase: PrismaUser[]
  inconsistentData: Array<{
    userId: string
    supabaseData: Partial<SupabaseUser>
    prismaData: Partial<PrismaUser>
    differences: string[]
  }>
  summary: {
    totalSupabaseUsers: number
    totalPrismaUsers: number
    missingInPrismaCount: number
    missingInSupabaseCount: number
    inconsistentCount: number
  }
}

async function getSupabaseUsers(): Promise<SupabaseUser[]> {
  try {
    // Check if we have a valid service role key
    console.log(`🔑 Service role key length: ${supabaseServiceKey?.length || 0}`)
    if (!supabaseServiceKey || supabaseServiceKey.length < 100) {
      console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is missing or invalid')
      console.warn('   Cannot fetch Supabase Auth users for comparison')
      console.warn('   This key is needed for admin operations')
      console.warn(`   Current key: ${supabaseServiceKey?.substring(0, 50)}...`)
      return []
    }

    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching Supabase users:', error)
      console.error('This might indicate an invalid service role key')
      return []
    }

    return data.users.map(user => ({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    }))
  } catch (error) {
    console.error('Failed to fetch Supabase users:', error)
    return []
  }
}

async function getPrismaUsers(): Promise<PrismaUser[]> {
  try {
    return await prisma.user.findMany({
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
  } catch (error) {
    console.error('Failed to fetch Prisma users:', error)
    return []
  }
}

function findMissingUsers(supabaseUsers: SupabaseUser[], prismaUsers: PrismaUser[]) {
  const prismaUserIds = new Set(prismaUsers.map(u => u.id))
  const supabaseUserIds = new Set(supabaseUsers.map(u => u.id))

  const missingInPrisma = supabaseUsers.filter(u => !prismaUserIds.has(u.id))
  const missingInSupabase = prismaUsers.filter(u => !supabaseUserIds.has(u.id))

  return { missingInPrisma, missingInSupabase }
}

function findInconsistentData(supabaseUsers: SupabaseUser[], prismaUsers: PrismaUser[]) {
  const inconsistentData: AuditResult['inconsistentData'] = []
  
  const supabaseUserMap = new Map(supabaseUsers.map(u => [u.id, u]))
  
  for (const prismaUser of prismaUsers) {
    const supabaseUser = supabaseUserMap.get(prismaUser.id)
    if (!supabaseUser) continue

    const differences: string[] = []
    
    // Check email consistency
    if (supabaseUser.email !== prismaUser.email) {
      differences.push(`Email mismatch: Supabase="${supabaseUser.email}" vs Prisma="${prismaUser.email}"`)
    }
    
    // Check name consistency
    const supabaseName = supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.user_name
    if (supabaseName !== prismaUser.name) {
      differences.push(`Name mismatch: Supabase="${supabaseName}" vs Prisma="${prismaUser.name}"`)
    }
    
    // Check image consistency
    const supabaseImage = supabaseUser.user_metadata?.avatar_url
    if (supabaseImage !== prismaUser.image) {
      differences.push(`Image mismatch: Supabase="${supabaseImage}" vs Prisma="${prismaUser.image}"`)
    }

    if (differences.length > 0) {
      inconsistentData.push({
        userId: prismaUser.id,
        supabaseData: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          user_metadata: supabaseUser.user_metadata
        },
        prismaData: {
          id: prismaUser.id,
          name: prismaUser.name,
          email: prismaUser.email,
          image: prismaUser.image
        },
        differences
      })
    }
  }
  
  return inconsistentData
}

async function syncMissingUsers(missingUsers: SupabaseUser[]): Promise<number> {
  let syncedCount = 0
  
  for (const supabaseUser of missingUsers) {
    try {
      const userData = {
        id: supabaseUser.id,
        email: supabaseUser.email || null,
        name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.user_name || null,
        image: supabaseUser.user_metadata?.avatar_url || null,
        xUsername: supabaseUser.user_metadata?.user_name || null,
        xUserId: supabaseUser.user_metadata?.provider_id || null,
        totalPoints: 0,
        autoMonitoringEnabled: !!(supabaseUser.user_metadata?.user_name && supabaseUser.user_metadata?.provider_id)
      }

      await prisma.user.create({
        data: userData
      })
      
      console.log(`✅ Synced user: ${userData.name || userData.email || userData.id}`)
      syncedCount++
    } catch (error) {
      console.error(`❌ Failed to sync user ${supabaseUser.id}:`, error)
    }
  }
  
  return syncedCount
}

export async function auditUserSync(autoFix: boolean = false): Promise<AuditResult> {
  console.log('🔍 Starting user authentication and database synchronization audit...\n')
  console.log(`🔧 Environment check:`)
  console.log(`   Supabase URL: ${supabaseUrl}`)
  console.log(`   Service key length: ${supabaseServiceKey?.length || 0}`)
  console.log(`   Service key preview: ${supabaseServiceKey?.substring(0, 50)}...`)

  // Fetch users from both sources
  console.log('📊 Fetching users from Supabase Auth...')
  const supabaseUsers = await getSupabaseUsers()
  
  console.log('📊 Fetching users from Prisma database...')
  const prismaUsers = await getPrismaUsers()

  // Find discrepancies
  console.log('🔍 Analyzing user data consistency...')
  const { missingInPrisma, missingInSupabase } = findMissingUsers(supabaseUsers, prismaUsers)
  const inconsistentData = findInconsistentData(supabaseUsers, prismaUsers)

  const result: AuditResult = {
    supabaseUsers,
    prismaUsers,
    missingInPrisma,
    missingInSupabase,
    inconsistentData,
    summary: {
      totalSupabaseUsers: supabaseUsers.length,
      totalPrismaUsers: prismaUsers.length,
      missingInPrismaCount: missingInPrisma.length,
      missingInSupabaseCount: missingInSupabase.length,
      inconsistentCount: inconsistentData.length
    }
  }

  // Print detailed results
  console.log('\n📋 AUDIT RESULTS')
  console.log('================')
  console.log(`Total Supabase Auth users: ${result.summary.totalSupabaseUsers}`)
  console.log(`Total Prisma database users: ${result.summary.totalPrismaUsers}`)
  console.log(`Users missing in Prisma: ${result.summary.missingInPrismaCount}`)
  console.log(`Users missing in Supabase: ${result.summary.missingInSupabaseCount}`)
  console.log(`Users with inconsistent data: ${result.summary.inconsistentCount}`)

  if (missingInPrisma.length > 0) {
    console.log('\n❌ USERS MISSING IN PRISMA DATABASE:')
    missingInPrisma.forEach(user => {
      console.log(`  - ID: ${user.id}`)
      console.log(`    Email: ${user.email || 'N/A'}`)
      console.log(`    Name: ${user.user_metadata?.name || user.user_metadata?.user_name || 'N/A'}`)
      console.log(`    Created: ${user.created_at}`)
      console.log(`    Last Sign In: ${user.last_sign_in_at || 'Never'}`)
      console.log('')
    })

    if (autoFix) {
      console.log('🔧 Auto-fixing missing users in Prisma...')
      const syncedCount = await syncMissingUsers(missingInPrisma)
      console.log(`✅ Successfully synced ${syncedCount} users to Prisma database`)
    }
  }

  if (missingInSupabase.length > 0) {
    console.log('\n⚠️  USERS MISSING IN SUPABASE AUTH:')
    missingInSupabase.forEach(user => {
      console.log(`  - ID: ${user.id}`)
      console.log(`    Email: ${user.email || 'N/A'}`)
      console.log(`    Name: ${user.name || 'N/A'}`)
      console.log(`    X Username: ${user.xUsername || 'N/A'}`)
      console.log('')
    })
    console.log('⚠️  These users exist in the database but not in Supabase Auth.')
    console.log('    This could indicate orphaned records or authentication issues.')
  }

  if (inconsistentData.length > 0) {
    console.log('\n⚠️  USERS WITH INCONSISTENT DATA:')
    inconsistentData.forEach(({ userId, differences }) => {
      console.log(`  - User ID: ${userId}`)
      differences.forEach(diff => console.log(`    ${diff}`))
      console.log('')
    })
  }

  if (result.summary.missingInPrismaCount === 0 &&
      result.summary.missingInSupabaseCount === 0 &&
      result.summary.inconsistentCount === 0) {
    console.log('\n✅ All users are properly synchronized!')
  }

  console.log('\n📊 RECOMMENDATIONS:')
  console.log('===================')

  if (result.summary.missingInPrismaCount > 0) {
    console.log('• Run this script with --fix flag to automatically sync missing users to Prisma')
    console.log('• Ensure the auth callback route properly calls syncUserWithDatabase()')
    console.log('• Consider adding a middleware to catch users who bypass the sync process')
  }

  if (result.summary.missingInSupabaseCount > 0) {
    console.log('• Review orphaned database records - these users cannot authenticate')
    console.log('• Consider cleaning up old records or investigating authentication issues')
  }

  if (result.summary.inconsistentCount > 0) {
    console.log('• Update user sync logic to maintain data consistency')
    console.log('• Consider implementing periodic sync jobs for user metadata')
  }

  if (result.summary.totalSupabaseUsers > 0) {
    console.log('• Monitor authentication flow to ensure all new users are properly synced')
    console.log('• Consider implementing health checks for user synchronization')
  }

  return result
}

// Additional utility functions for session analysis
export async function getActiveSessionsAnalysis() {
  console.log('🔍 Analyzing active user sessions...\n')

  try {
    // Get all Supabase sessions
    const { data: sessions, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching sessions:', error)
      return
    }

    const activeSessions = sessions.users.filter(user => {
      const lastSignIn = user.last_sign_in_at
      if (!lastSignIn) return false

      // Consider a session active if last sign in was within 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      return new Date(lastSignIn) > thirtyDaysAgo
    })

    console.log(`📊 Session Analysis:`)
    console.log(`Total registered users: ${sessions.users.length}`)
    console.log(`Active sessions (last 30 days): ${activeSessions.length}`)
    console.log(`Inactive users: ${sessions.users.length - activeSessions.length}`)

    if (activeSessions.length > 0) {
      console.log('\n🟢 Recently Active Users:')
      activeSessions.forEach(user => {
        console.log(`  - ${user.user_metadata?.name || user.email || user.id}`)
        console.log(`    Last sign in: ${user.last_sign_in_at}`)
        console.log(`    Provider: ${user.app_metadata?.provider || 'Unknown'}`)
        console.log('')
      })
    }

  } catch (error) {
    console.error('Failed to analyze sessions:', error)
  }
}

// CLI execution - always run when this file is executed directly
const autoFix = process.argv.includes('--fix')
const sessionAnalysis = process.argv.includes('--sessions')

async function runAudit() {
  try {
    if (sessionAnalysis) {
      await getActiveSessionsAnalysis()
      console.log('\n' + '='.repeat(50) + '\n')
    }

    await auditUserSync(autoFix)

    console.log('\n🎉 Audit completed successfully!')
    console.log('\nUsage:')
    console.log('  npm run audit:users           # Run audit only')
    console.log('  npm run audit:users -- --fix     # Run audit and fix missing users')
    console.log('  npm run audit:users -- --sessions # Include session analysis')
  } catch (error) {
    console.error('\n💥 Audit failed:', error)
    throw error
  }
}

// Run the audit
runAudit()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Audit failed:', error)
    process.exit(1)
  })
