-- Add Twitter OAuth token fields to User table
ALTER TABLE "User" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "User" ADD COLUMN "refreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN "tokenExpiresAt" TIMESTAMP(3);
