# LayerEdge Deployment Guide - Prisma Migration Fix

## Problem Overview

The LayerEdge community platform was experiencing deployment failures on Koyeb due to Prisma migration error P3005: "The database schema is not empty". This occurs when:

1. The production Supabase database already contains tables
2. Those tables weren't created through Prisma migrations
3. Prisma can't establish a migration baseline

## Solution Implemented

### 1. Build Process Changes

**File: `scripts/build-windows.js`**
- ✅ Removed `deployMigrations()` from build phase
- ✅ Migrations now handled at runtime only
- ✅ Build process focuses on code compilation only

### 2. Runtime Migration Handling

**File: `scripts/startup.sh`**
- ✅ Added intelligent migration detection
- ✅ P3005 error detection and automatic baseline resolution
- ✅ Fallback to baseline script when standard migrations fail

### 3. Database Baseline Script

**File: `scripts/baseline-database.js`**
- ✅ Handles existing database schemas
- ✅ Resolves P3005 errors by marking migrations as applied
- ✅ Comprehensive error handling and logging

### 4. Docker Configuration

**File: `Dockerfile`**
- ✅ Includes baseline script in production image
- ✅ Proper file permissions for runtime execution

## Deployment Process

### For Fresh Deployments
1. Build process generates Prisma client only
2. Runtime startup checks database state
3. Applies migrations if database is empty
4. Starts application

### For Existing Database Deployments
1. Build process generates Prisma client only
2. Runtime startup detects existing schema
3. Runs baseline script to resolve P3005 error
4. Marks existing migrations as applied
5. Applies any new pending migrations
6. Starts application

## Manual Troubleshooting

### If deployment still fails:

1. **Check database connection:**
   ```bash
   npx prisma db execute --stdin <<< "SELECT 1 as test;"
   ```

2. **Run baseline manually:**
   ```bash
   npm run db:migrate:baseline
   ```

3. **Check migration status:**
   ```bash
   npx prisma migrate status
   ```

4. **Force reset (DANGER - will lose data):**
   ```bash
   npm run db:migrate:force
   ```

### Environment Variables Required

```bash
DATABASE_URL=postgres://postgres.bzqayhnlogpaxfcmmrlq:d234A879a1%23@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=3
DIRECT_URL=postgres://postgres.bzqayhnlogpaxfcmmrlq:d234A879a1%23@aws-0-eu-north-1.pooler.supabase.com:5432/postgres
```

## Testing the Fix

### Local Testing
1. Set up environment variables
2. Run: `npm run build`
3. Run: `npm run db:migrate:baseline`
4. Run: `npm start`

### Production Testing
1. Deploy to Koyeb
2. Check startup logs for migration success
3. Verify application starts without P3005 errors

## Key Benefits

1. **Separation of Concerns**: Build phase handles code, runtime handles database
2. **Robust Error Handling**: Automatic detection and resolution of P3005 errors
3. **Backward Compatibility**: Works with both fresh and existing databases
4. **Clear Logging**: Detailed logs for troubleshooting deployment issues
5. **Manual Override**: Scripts available for manual intervention if needed

## Migration Timeline

- **Initial Schema**: `20250526015806_initial_supabase_setup`
- **Engagement Tracking**: `20250526020000_add_engagement_tracking`
- **Auto Monitoring**: `20250526112137_add_automatic_monitoring`
- **Email Constraint**: `20250526180708_remove_email_unique_constraint`
- **Scalability Indexes**: `20250526200000_add_scalability_indexes`

All migrations are now properly handled with baseline support for existing databases.
