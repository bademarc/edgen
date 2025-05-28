-- CreateTable
CREATE TABLE "UnclaimedTweet" (
    "id" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "retweets" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedBy" TEXT,
    "claimedAt" TIMESTAMP(3),
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'unknown',

    CONSTRAINT "UnclaimedTweet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingLog" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "tweetsFound" INTEGER NOT NULL,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "TrackingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnclaimedTweet_tweetId_key" ON "UnclaimedTweet"("tweetId");

-- CreateIndex
CREATE INDEX "UnclaimedTweet_authorUsername_idx" ON "UnclaimedTweet"("authorUsername");

-- CreateIndex
CREATE INDEX "UnclaimedTweet_authorId_idx" ON "UnclaimedTweet"("authorId");

-- CreateIndex
CREATE INDEX "UnclaimedTweet_claimed_idx" ON "UnclaimedTweet"("claimed");

-- CreateIndex
CREATE INDEX "UnclaimedTweet_discoveredAt_idx" ON "UnclaimedTweet"("discoveredAt");

-- CreateIndex
CREATE INDEX "TrackingLog_method_idx" ON "TrackingLog"("method");

-- CreateIndex
CREATE INDEX "TrackingLog_timestamp_idx" ON "TrackingLog"("timestamp");

-- CreateIndex
CREATE INDEX "TrackingLog_success_idx" ON "TrackingLog"("success");
