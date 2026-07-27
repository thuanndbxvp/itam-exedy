-- Invariant #2: Asset chỉ được assign cho 1 trong 3 target
ALTER TABLE "Asset" ADD CONSTRAINT "asset_assignment_only_one"
  CHECK (
    (CASE WHEN "assignedUserId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "assignedLocationId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "assignedAssetId" IS NOT NULL THEN 1 ELSE 0 END)
    <= 1
  );

-- Tương tự cho LicenseSeat: gán User HOẶC Asset
ALTER TABLE "LicenseSeat" ADD CONSTRAINT "license_seat_assignment_only_one"
  CHECK (
    (CASE WHEN "assignedUserId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "assignedAssetId" IS NOT NULL THEN 1 ELSE 0 END)
    <= 1
  );
