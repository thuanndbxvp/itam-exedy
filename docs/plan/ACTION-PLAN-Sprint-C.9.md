# ACTION PLAN: Sprint C.9 - Asset & License Assignment Validation

**Date:** 28/07/2026  
**Status:** 📋 READY FOR REVIEW

---

## 1. MỤC TIÊU Sprint C.9

Siết chặt quy trình cấp phát (Checkout) thiết bị và bản quyền dựa trên trạng thái (status).

---

## 2. QUY TẮC NGHIỆP VỤ

| Entity | Rule |
|--------|------|
| **Asset** | Chỉ checkout được nếu `status.deployable == true`, KHÔNG `pending`, KHÔNG `archived` |
| **License Seat** | Chỉ checkout được nếu `expirationDate > now` HOẶC `reassignable == true` |
| **Target Asset** | Khi gán linh kiện/bản quyền vào thiết bị đích → thiết bị đích KHÔNG được `archived` |

---

## 3. DANH SÁCH THAY ĐỔI

### Phase 1: Frontend Changes

#### 3.1 Assets List Page
**File:** `src/app/assets/AssetsPageClient.tsx`

**Thay đổi:**
- Disable `CheckoutAssetButton` nếu `!asset.status.deployable`
- Thêm tooltip: "Thiết bị không ở trạng thái sẵn sàng"

#### 3.2 Asset Detail Page
**File:** `src/app/assets/[id]/AssetDetailClient.tsx`

**Thay đổi:**
- Disable nút Checkout trong action bar nếu `!asset.status.deployable`

#### 3.3 License Seats Page
**File:** `src/app/licenses/[id]/LicenseSeatsClient.tsx`

**Thay đổi:**
- Disable `CheckoutSeatButton` nếu License hết hạn VÀ không `reassignable`

---

### Phase 2: Backend Changes

#### 3.4 Asset Commands
**File:** `src/lib/commands/asset.ts`

**Hàm:** `checkoutAssetToAsset(assetId, targetAssetId, targetLocationId)`

**Thêm validation:**
```typescript
// Kiểm tra Target Asset không bị archived
const targetAsset = await prisma.asset.findUnique({ where: { id: targetAssetId } })
if (targetAsset?.status.archived) {
  throw new InvalidStateError('Không thể gán vào thiết bị đã thanh lý.')
}
```

#### 3.5 License Commands
**File:** `src/lib/commands/license.ts`

**Hàm:** `checkoutLicenseSeat(seatId, userId, assetId, locationId)`

**Thêm validation:**
```typescript
// Kiểm tra Target Asset không bị archived (nếu có assetId)
if (assetId) {
  const targetAsset = await prisma.asset.findUnique({ where: { id: assetId } })
  if (targetAsset?.status.archived) {
    throw new InvalidStateError('Không thể gán vào thiết bị đã thanh lý.')
  }
}
```

---

## 4. ACCEPTANCE CRITERIA

### UI Tests

| # | Scenario | Expected Result |
|---|---------|----------------|
| 1 | IT Staff xem `/assets` với Asset `deployable: false` | Nút Checkout bị disabled + tooltip |
| 2 | IT Staff xem `/assets/[id]` với Asset `deployable: false` | Nút Checkout trong action bar bị disabled |
| 3 | IT Staff xem `/licenses/[id]` với License hết hạn & không reassignable | Nút Checkout cho vacant seats bị disabled |

### Backend Tests

| # | Scenario | Expected Result |
|---|---------|----------------|
| 4 | Gán RAM vào Server có `archived: true` | API trả `InvalidStateError` |
| 5 | Gán License Seat vào Asset có `archived: true` | API trả `InvalidStateError` |

---

## 5. FILES TO BE MODIFIED

| File | Change Type | Risk |
|------|-------------|------|
| `src/app/assets/AssetsPageClient.tsx` | Modify | Low |
| `src/app/assets/[id]/AssetDetailClient.tsx` | Modify | Low |
| `src/app/licenses/[id]/LicenseSeatsClient.tsx` | Modify | Low |
| `src/lib/commands/asset.ts` | Modify | Medium |
| `src/lib/commands/license.ts` | Modify | Medium |

---

## 6. ESTIMATED TIME

| Task | Time |
|------|------|
| Frontend Assets List | 30 phút |
| Frontend Asset Detail | 20 phút |
| Frontend License Seats | 20 phút |
| Backend Asset Commands | 30 phút |
| Backend License Commands | 30 phút |
| Testing & Verification | 30 phút |
| **Total** | **~2.5 hours** |

---

## 7. DEPENDENCIES

- Asset Status schema đã có `deployable`, `archived`, `pending` fields
- License schema đã có `expirationDate`, `reassignable` fields
- `InvalidStateError` class đã tồn tại

---

## 8. OUT OF SCOPE

- Thay đổi trạng thái Asset/License
- Tạo mới Asset/License
- Xóa Asset/License

---

## 9. VERIFICATION CHECKLIST

- [ ] Build thành công (`npm run build`)
- [ ] TypeScript không có lỗi (`tsc --noEmit`)
- [ ] Manual test: Checkout disabled cho Asset không deployable
- [ ] Manual test: Checkout disabled cho License hết hạn
- [ ] Manual test: Checkout vào Asset archived → thất bại với message rõ ràng

---

## APPROVAL

| Role | Name | Date | Sign |
|------|------|------|------|
| Tech Lead | ??? | 28/07/2026 | ⬜ |
| QA | ??? | 28/07/2026 | ⬜ |

---

**Ready for review. Please approve to proceed with implementation.**
