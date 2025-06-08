-- LayerEdge Database Constraint Fixes
-- Resolves foreign key constraint violations and system user issues

-- 1. Create system user if it doesn't exist
INSERT INTO "User" (
  id, 
  name, 
  email, 
  "createdAt", 
  "updatedAt",
  "totalPoints",
  "autoMonitoringEnabled"
) 
VALUES (
  'system', 
  'System Monitor', 
  'system@layeredge.app', 
  NOW(), 
  NOW(),
  0,
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  "updatedAt" = NOW();

-- 2. Create admin user for monitoring operations
INSERT INTO "User" (
  id, 
  name, 
  email, 
  "createdAt", 
  "updatedAt",
  "totalPoints",
  "autoMonitoringEnabled"
) 
VALUES (
  'admin', 
  'Admin User', 
  'admin@layeredge.app', 
  NOW(), 
  NOW(),
  0,
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  "updatedAt" = NOW();

-- 3. Fix any orphaned TweetMonitoring records
-- Delete monitoring records for non-existent users
DELETE FROM "TweetMonitoring" 
WHERE "userId" NOT IN (SELECT id FROM "User");

-- 4. Fix any orphaned Tweet records
-- Update tweets with invalid user_id to system user
UPDATE "Tweet" 
SET "userId" = 'system' 
WHERE "userId" NOT IN (SELECT id FROM "User");

-- 5. Fix any orphaned PointsHistory records
-- Delete points history for non-existent users
DELETE FROM "PointsHistory" 
WHERE "userId" NOT IN (SELECT id FROM "User");

-- 6. Fix any orphaned UnclaimedTweet records that might have user references
-- (UnclaimedTweet table doesn't have user foreign keys, but check for consistency)

-- 7. Create monitoring status for system user
INSERT INTO "TweetMonitoring" (
  "userId",
  "status",
  "lastCheckAt",
  "tweetsFound",
  "errorMessage"
)
VALUES (
  'system',
  'active',
  NOW(),
  0,
  NULL
)
ON CONFLICT ("userId") DO UPDATE SET
  "status" = 'active',
  "lastCheckAt" = NOW(),
  "updatedAt" = NOW();

-- 8. Verify data integrity
-- Check for any remaining constraint violations
DO $$
DECLARE
    orphaned_tweets INTEGER;
    orphaned_monitoring INTEGER;
    orphaned_points INTEGER;
BEGIN
    -- Count orphaned records
    SELECT COUNT(*) INTO orphaned_tweets 
    FROM "Tweet" 
    WHERE "userId" NOT IN (SELECT id FROM "User");
    
    SELECT COUNT(*) INTO orphaned_monitoring 
    FROM "TweetMonitoring" 
    WHERE "userId" NOT IN (SELECT id FROM "User");
    
    SELECT COUNT(*) INTO orphaned_points 
    FROM "PointsHistory" 
    WHERE "userId" NOT IN (SELECT id FROM "User");
    
    -- Report results
    RAISE NOTICE 'Database integrity check completed:';
    RAISE NOTICE '  Orphaned tweets: %', orphaned_tweets;
    RAISE NOTICE '  Orphaned monitoring records: %', orphaned_monitoring;
    RAISE NOTICE '  Orphaned points history: %', orphaned_points;
    
    IF orphaned_tweets = 0 AND orphaned_monitoring = 0 AND orphaned_points = 0 THEN
        RAISE NOTICE '✅ All foreign key constraints are satisfied';
    ELSE
        RAISE WARNING '⚠️ Some orphaned records remain - manual cleanup may be required';
    END IF;
END $$;

-- 9. Update table statistics after cleanup
ANALYZE "User";
ANALYZE "Tweet";
ANALYZE "TweetMonitoring";
ANALYZE "PointsHistory";
ANALYZE "UnclaimedTweet";

-- 10. Create a function to validate user existence before operations
CREATE OR REPLACE FUNCTION validate_user_exists(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM "User" WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- 11. Create a function to safely create monitoring records
CREATE OR REPLACE FUNCTION safe_create_monitoring(
    p_user_id TEXT,
    p_status TEXT DEFAULT 'active',
    p_tweets_found INTEGER DEFAULT 0,
    p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user exists
    IF NOT validate_user_exists(p_user_id) THEN
        RAISE WARNING 'User % does not exist, cannot create monitoring record', p_user_id;
        RETURN FALSE;
    END IF;
    
    -- Create or update monitoring record
    INSERT INTO "TweetMonitoring" (
        "userId",
        "status",
        "lastCheckAt",
        "tweetsFound",
        "errorMessage"
    )
    VALUES (
        p_user_id,
        p_status,
        NOW(),
        p_tweets_found,
        p_error_message
    )
    ON CONFLICT ("userId") DO UPDATE SET
        "status" = EXCLUDED."status",
        "lastCheckAt" = NOW(),
        "tweetsFound" = EXCLUDED."tweetsFound",
        "errorMessage" = EXCLUDED."errorMessage",
        "updatedAt" = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 12. Test the new functions
SELECT validate_user_exists('system') as system_user_exists;
SELECT validate_user_exists('admin') as admin_user_exists;
SELECT safe_create_monitoring('system', 'active', 0, 'Database constraints fixed') as monitoring_created;

COMMIT;
