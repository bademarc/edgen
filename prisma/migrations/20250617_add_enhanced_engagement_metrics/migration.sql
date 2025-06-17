-- Add enhanced engagement metrics from Apify API
-- Adding quotes, views, and bookmarks to support comprehensive engagement tracking

-- Add new engagement fields to Tweet table
ALTER TABLE "Tweet" ADD COLUMN "quotes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Tweet" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Tweet" ADD COLUMN "bookmarks" INTEGER NOT NULL DEFAULT 0;

-- Add metadata field to store additional Apify data
ALTER TABLE "Tweet" ADD COLUMN "apifyMetadata" JSONB;

-- Add index for better query performance on new engagement fields
CREATE INDEX "Tweet_quotes_idx" ON "Tweet"("quotes");
CREATE INDEX "Tweet_views_idx" ON "Tweet"("views");
CREATE INDEX "Tweet_bookmarks_idx" ON "Tweet"("bookmarks");

-- Add composite index for total engagement calculations
CREATE INDEX "Tweet_total_engagement_idx" ON "Tweet"("likes", "retweets", "replies", "quotes", "views", "bookmarks");

-- Update existing tweets to have default values for new fields (already handled by DEFAULT 0)
-- This migration is safe to run on existing data
