-- AlterTable
ALTER TABLE "Tweet" ADD COLUMN "lastEngagementUpdate" TIMESTAMP(3);
ALTER TABLE "Tweet" ADD COLUMN "engagementUpdateCount" INTEGER NOT NULL DEFAULT 0;
