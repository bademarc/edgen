-- LayerEdge Mention Tracking Database Setup
--
-- Purpose: Sets up database tables and functions for automated mention tracking
-- Usage: Run this directly in your Supabase SQL editor
--
-- This script creates:
-- - TweetTracking table for processed tweets
-- - SystemConfig table for configuration
-- - Database functions for atomic operations
-- - Indexes for performance optimization
--
-- Essential for production mention tracking system.

-- Create TweetTracking table
CREATE TABLE IF NOT EXISTS "TweetTracking" (
    "id" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "userId" TEXT,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 1,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tweetContent" TEXT,
    "engagementMetrics" JSONB,

    CONSTRAINT "TweetTracking_pkey" PRIMARY KEY ("id")
);

-- Create SystemConfig table
CREATE TABLE IF NOT EXISTS "SystemConfig" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("key")
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "TweetTracking_tweetId_key" ON "TweetTracking"("tweetId");
CREATE INDEX IF NOT EXISTS "TweetTracking_authorId_idx" ON "TweetTracking"("authorId");
CREATE INDEX IF NOT EXISTS "TweetTracking_processedAt_idx" ON "TweetTracking"("processedAt");

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'TweetTracking_userId_fkey'
    ) THEN
        ALTER TABLE "TweetTracking" ADD CONSTRAINT "TweetTracking_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create function for atomic point awarding
CREATE OR REPLACE FUNCTION award_points_for_tweet(
  p_user_id TEXT,
  p_tweet_id TEXT,
  p_author_id TEXT,
  p_tweet_content TEXT,
  p_engagement_metrics JSONB
) RETURNS VOID AS $$
BEGIN
  -- Insert tweet tracking record (will fail if duplicate due to unique constraint)
  INSERT INTO "TweetTracking" ("id", "tweetId", "authorId", "userId", "tweetContent", "engagementMetrics")
  VALUES (gen_random_uuid()::text, p_tweet_id, p_author_id, p_user_id, p_tweet_content, p_engagement_metrics);
  
  -- Award points to user
  UPDATE "User" SET "totalPoints" = "totalPoints" + 1 WHERE "id" = p_user_id;
  
  -- Create points history record
  INSERT INTO "PointsHistory" ("id", "userId", "pointsAwarded", "reason", "createdAt")
  VALUES (gen_random_uuid()::text, p_user_id, 1, 'Automated mention tracking: ' || p_tweet_id, CURRENT_TIMESTAMP);
  
EXCEPTION WHEN unique_violation THEN
  -- Tweet already processed, do nothing
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create function to get system config with default
CREATE OR REPLACE FUNCTION get_system_config(config_key TEXT, default_value TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  config_value TEXT;
BEGIN
  SELECT value INTO config_value FROM "SystemConfig" WHERE key = config_key;
  
  IF config_value IS NULL THEN
    RETURN default_value;
  END IF;
  
  RETURN config_value;
END;
$$ LANGUAGE plpgsql;

-- Create function to set system config
CREATE OR REPLACE FUNCTION set_system_config(config_key TEXT, config_value TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO "SystemConfig" (key, value, "updatedAt")
  VALUES (config_key, config_value, CURRENT_TIMESTAMP)
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    "updatedAt" = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Test the functions
SELECT set_system_config('setup_test', 'success');
SELECT get_system_config('setup_test') as test_result;

-- Clean up test
DELETE FROM "SystemConfig" WHERE key = 'setup_test';

-- Show table status
SELECT 
  'TweetTracking' as table_name,
  COUNT(*) as record_count
FROM "TweetTracking"
UNION ALL
SELECT 
  'SystemConfig' as table_name,
  COUNT(*) as record_count
FROM "SystemConfig";

-- Show users ready for monitoring
SELECT 
  COUNT(*) as users_ready_for_monitoring
FROM "User" 
WHERE "xUserId" IS NOT NULL 
  AND "xUsername" IS NOT NULL 
  AND "autoMonitoringEnabled" = true;
