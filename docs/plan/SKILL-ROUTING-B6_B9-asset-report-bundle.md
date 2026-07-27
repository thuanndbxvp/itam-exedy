# SKILL-ROUTING: B6-B9 - Asset & Report Upgrades Bundle

**Người lập:** Tier 2 (Coder, scaffolded)

## Routing Matrix

| Bước | Task | Recommended Agent/Skill | Reason |
|------|------|------------------------|--------|
| 1 | B6 Asset image upload | `react-reviewer` | Client-side file picker + Base64 encoding |
| 2 | B7 Assigned Asset | `react-reviewer` + `backend-engineer` | Add radio tab in CheckoutAssetModal + new checkoutAssetToAsset command |
| 3 | B8 License companyId | `react-reviewer` | Thêm dropdown Company |
| 4 | B9 Reports page | `react-reviewer` | Build /reports với Recharts hoặc plain SVG |

## Skill Activation Order

```
1. Audit assets/AssetForm, assets/CheckoutAssetModal, licenses/LicenseForm, lib/commands/asset.ts
2. Schema check: Asset.image, Asset.assignedAssetId, License.companyId (đều đã có)
3. Implement:
   - B6: Image picker trong AssetForm (Server Action) + thumbnail render đã có sẵn
   - B7: Thêm targetType='ASSET' trong CheckoutAssetModal + command lib
   - B8: Dropdown Company trong LicenseForm
   - B9: Tạo src/app/reports/page.tsx + components (chart SVG)
```

## Verification

- tsc --noEmit
- Curl test API endpoints /api/reports/*
- Manual UI test:
  - Upload 1 file < 1MB vào asset, lưu → image được encode base64 lưu DB
  - Checkout 1 asset gán cho asset khác → hiển thị target
  - Tạo license + chọn Company
  - Mở /reports → thấy biểu đồ