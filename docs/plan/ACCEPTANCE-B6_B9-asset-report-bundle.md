# ACCEPTANCE: B6-B9 - Asset & Report Upgrades Bundle

**Người lập:** Tier 2 (Coder, scaffolded)

## B6. Asset image field
- [x] B6_1. AssetForm (New + Edit) có `<input type="file">` upload ảnh
- [x] B6_2. Ảnh được encode Base64 Data URI (nhỏ < 1MB) lưu vào Asset.image
- [x] B6_3. Trang chi tiết AssetDetailClient hiển thị thumbnail `asset.image`

## B7. Asset "Assigned Asset"
- [x] B7_1. Backend: command `checkoutAssetToAsset(tx, { assetId, targetAssetId, actorId, notes })` thêm vào `lib/commands/asset.ts`
- [x] B7_2. Server action wrapper `checkoutAssetToAssetCmd` trong `app/actions/asset.ts`
- [x] B7_3. UI CheckoutAssetModal có 3 tabs: Nhân viên / Vị trí / Thiết bị
- [x] B7_4. Khi chọn "Thiết bị", fetch list asset khác để gán (loại trừ chính nó + đã được gán)

## B8. License companyId selector
- [x] B8_1. LicenseForm có dropdown Company (load từ API hoặc truyền props)
- [x] B8_2. `companyId` lưu vào DB khi create/update license
- [x] B8_3. License list/detail hiển thị tên Company (optional - ngoài scope nếu list đã OK)

## B9. Reports page
- [x] B9_1. `src/app/reports/page.tsx` tồn tại
- [x] B9_2. Page fetch từ `/api/reports/summary` (counters), `/api/reports/assets-by-status` (bar), `/api/reports/assets-by-category` (pie/department)
- [x] B9_3. Bảng Top 10 license sắp hết hạn (query mới)
- [x] B9_4. Charts render đúng (CSS bar/pie) — không cần thư viện nặng, dùng SVG/CSS