-- Sprint C5 - Add SavedFilter table.

CREATE TABLE IF NOT EXISTS "SavedFilter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedFilter_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SavedFilter_userId_idx"
    ON "SavedFilter"("userId");

CREATE INDEX IF NOT EXISTS "SavedFilter_scope_idx"
    ON "SavedFilter"("scope");

CREATE INDEX IF NOT EXISTS "SavedFilter_scope_isPublic_idx"
    ON "SavedFilter"("scope", "isPublic");

-- FK to User with CASCADE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SavedFilter_userId_fkey') THEN
        ALTER TABLE "SavedFilter"
            ADD CONSTRAINT "SavedFilter_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
