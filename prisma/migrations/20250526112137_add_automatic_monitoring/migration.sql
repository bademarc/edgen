-- AlterTable
ALTER TABLE "Tweet" ADD COLUMN     "discoveredAt" TIMESTAMP(3),
ADD COLUMN     "isAutoDiscovered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tweetId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "autoMonitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastTweetCheck" TIMESTAMP(3),
ADD COLUMN     "tweetCheckCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TweetMonitoring" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastCheckAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tweetsFound" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TweetMonitoring_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TweetMonitoring_userId_key" ON "TweetMonitoring"("userId");

-- AddForeignKey
ALTER TABLE "TweetMonitoring" ADD CONSTRAINT "TweetMonitoring_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
