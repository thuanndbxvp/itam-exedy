-- Sprint C3 - Add EulaAcceptance table.

CREATE TABLE IF NOT EXISTS "EulaAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "EulaAcceptance_pkey" PRIMARY KEY ("id")
);

-- One acceptance per (user, category) pair
CREATE UNIQUE INDEX IF NOT EXISTS "EulaAcceptance_userId_categoryId_key"
    ON "EulaAcceptance"("userId", "categoryId");

CREATE INDEX IF NOT EXISTS "EulaAcceptance_categoryId_idx"
    ON "EulaAcceptance"("categoryId");

-- FK to User + Category with CASCADE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EulaAcceptance_userId_fkey') THEN
        ALTER TABLE "EulaAcceptance"
            ADD CONSTRAINT "EulaAcceptance_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EulaAcceptance_categoryId_fkey') THEN
        ALTER TABLE "EulaAcceptance"
            ADD CONSTRAINT "EulaAcceptance_categoryId_fkey"
            FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
