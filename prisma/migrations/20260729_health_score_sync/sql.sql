-- Sprint C.11 + C.12: Health Score & Handover
-- Migration: Add health score fields and AssetHandover table

-- =============================================================================
-- SPRINT C.11: Health Score
-- =============================================================================

-- 1. Add health score fields
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "repairCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "totalRepairCost" DECIMAL(15, 2);
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "healthScore" INTEGER;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "lastHealthCheck" TIMESTAMP(3);

-- 2. Add indexes for health score queries
CREATE INDEX IF NOT EXISTS "Asset_healthScore_idx" ON "Asset"("healthScore");
CREATE INDEX IF NOT EXISTS "Asset_repairCount_idx" ON "Asset"("repairCount");

-- 3. Ensure 'Maintenance' status label exists (for auto-sync)
INSERT INTO "StatusLabel" (id, name, deployable, pending, archived, color, "showInNav", "defaultLabel", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Maintenance',
  false,
  false,
  false,
  '#f97316',
  true,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StatusLabel" WHERE name = 'Maintenance');

-- 4. Update repairCount and totalRepairCost from existing maintenance logs
WITH repair_stats AS (
  SELECT
    "assetId",
    COUNT(*) as repair_count,
    COALESCE(SUM(COALESCE("cost", 0)), 0) as total_cost
  FROM "AssetMaintenance"
  WHERE "deletedAt" IS NULL AND "completionDate" IS NOT NULL
  GROUP BY "assetId"
)
UPDATE "Asset"
SET
  "repairCount" = COALESCE(rs.repair_count, 0),
  "totalRepairCost" = rs.total_cost
FROM repair_stats rs
WHERE "Asset".id = rs."assetId";

-- =============================================================================
-- SPRINT C.12: Asset Handover
-- =============================================================================

-- 5. Create AssetHandover table
CREATE TABLE IF NOT EXISTS "AssetHandover" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "assetId" TEXT NOT NULL,
  "action" TEXT NOT NULL DEFAULT 'HANDOVER',
  "handoverDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fromUserId" TEXT,
  "fromDeptId" TEXT,
  "fromLocationId" TEXT,
  "toUserId" TEXT NOT NULL,
  "toDeptId" TEXT,
  "toLocationId" TEXT,
  "docNo" TEXT,
  "pdfUrl" TEXT,
  "managerName" TEXT,
  "managerEmail" TEXT,
  "confirmToken" TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "confirmedBy" TEXT,
  "confirmedUserId" TEXT,
  "accessories" TEXT,
  "condition" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetHandover_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AssetHandover_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 6. Add indexes
CREATE INDEX IF NOT EXISTS "AssetHandover_assetId_idx" ON "AssetHandover"("assetId");
CREATE INDEX IF NOT EXISTS "AssetHandover_toUserId_idx" ON "AssetHandover"("toUserId");
CREATE INDEX IF NOT EXISTS "AssetHandover_fromUserId_idx" ON "AssetHandover"("fromUserId");
CREATE INDEX IF NOT EXISTS "AssetHandover_action_idx" ON "AssetHandover"("action");
CREATE INDEX IF NOT EXISTS "AssetHandover_handoverDate_idx" ON "AssetHandover"("handoverDate");
CREATE INDEX IF NOT EXISTS "AssetHandover_confirmToken_idx" ON "AssetHandover"("confirmToken");
CREATE INDEX IF NOT EXISTS "AssetHandover_docNo_idx" ON "AssetHandover"("docNo");
