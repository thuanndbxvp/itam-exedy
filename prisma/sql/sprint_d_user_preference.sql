-- Sprint D - UserPreference
-- Tạo bảng UserPreference (1:1 với User), 2 enums mới, default migration script.

-- 1. Tạo enums trước (nếu chưa có)
DO $$ BEGIN
  CREATE TYPE "EmailDigestFrequency" AS ENUM ('DAILY', 'WEEKLY', 'NONE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "UiTheme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Tạo bảng UserPreference
CREATE TABLE IF NOT EXISTS "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailDigestFrequency" "EmailDigestFrequency" NOT NULL DEFAULT 'DAILY',
    "muteUntil" TIMESTAMP(3),
    "theme" "UiTheme" NOT NULL DEFAULT 'SYSTEM',
    "locale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- 3. Unique userId (1:1)
CREATE UNIQUE INDEX IF NOT EXISTS "UserPreference_userId_key" ON "UserPreference"("userId");

-- 4. Composite index (userId, muteUntil) - for digest job queries
CREATE INDEX IF NOT EXISTS "UserPreference_userId_muteUntil_idx" ON "UserPreference"("userId", "muteUntil");

-- 5. FK + Cascade delete: drop User → drop Preference
DO $$ BEGIN
  ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
