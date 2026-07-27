-- Sprint B16 - Add PasswordResetToken table.
-- Manual SQL because the DB lacks Prisma migration history (running with `prisma db execute`).

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- Unique constraint for tokenHash (allows index, prevents dupes)
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key"
    ON "PasswordResetToken"("tokenHash");

-- Lookup indexes
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx"
    ON "PasswordResetToken"("userId");

CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx"
    ON "PasswordResetToken"("expiresAt");

-- FK to User with cascade delete
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'PasswordResetToken_userId_fkey'
    ) THEN
        ALTER TABLE "PasswordResetToken"
            ADD CONSTRAINT "PasswordResetToken_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
