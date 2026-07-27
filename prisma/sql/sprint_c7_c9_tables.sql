-- Sprint C7-C9 - ApiToken, EmailTemplate, NotificationChannel.

-- ----------------------------------------------------------------------------
-- ApiToken
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ApiToken" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopes" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "ApiToken_tokenPrefix_idx" ON "ApiToken"("tokenPrefix");
CREATE INDEX IF NOT EXISTS "ApiToken_revokedAt_idx" ON "ApiToken"("revokedAt");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ApiToken_createdById_fkey') THEN
        ALTER TABLE "ApiToken"
            ADD CONSTRAINT "ApiToken_createdById_fkey"
            FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ApiToken_revokedById_fkey') THEN
        ALTER TABLE "ApiToken"
            ADD CONSTRAINT "ApiToken_revokedById_fkey"
            FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- EmailTemplate
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "EmailTemplate_updatedAt_idx" ON "EmailTemplate"("updatedAt");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailTemplate_updatedById_fkey') THEN
        ALTER TABLE "EmailTemplate"
            ADD CONSTRAINT "EmailTemplate_updatedById_fkey"
            FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- NotificationChannel
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "NotificationChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "filterKinds" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "lastDeliveryAt" TIMESTAMP(3),
    "lastDeliveryError" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NotificationChannel_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NotificationChannel_kind_idx" ON "NotificationChannel"("kind");
CREATE INDEX IF NOT EXISTS "NotificationChannel_enabled_idx" ON "NotificationChannel"("enabled");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NotificationChannel_createdById_fkey') THEN
        ALTER TABLE "NotificationChannel"
            ADD CONSTRAINT "NotificationChannel_createdById_fkey"
            FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
