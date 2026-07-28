# Acceptance Criteria - Sprint C.8: Child Assets Visibility

**Date:** 28/07/2026  
**Status:** ✅ DONE

---

## Mục tiêu

Hiển thị **thiết bị đính kèm (Child Assets)** trong 2 vị trí:
1. Trang chi tiết Tài sản - Tab mới "Thiết bị đi kèm"
2. Dashboard nhân viên - Danh sách "Tài sản của tôi" bao gồm cả thiết bị con

---

## Features Implemented

### 1. API My-Assets Enhancement

**File:** `src/app/api/helpdesk/my-assets/route.ts`

**Change:**
```typescript
where: {
  deletedAt: null,
  OR: [
    { assignedUserId: user.id },
    // C.8: Asset con của asset được gán cho user
    { assignedAsset: { assignedUserId: user.id } }
  ]
}
```

**Result:** Employee thấy cả Laptop và chuột/phím đi kèm trong Dashboard.

---

### 2. Asset Detail Page - Child Assets Data

**File:** `src/app/assets/[id]/page.tsx`

**Change:** Thêm `assignedToAssets` vào Prisma query:
```typescript
assignedToAssets: {
  where: { deletedAt: null },
  select: {
    id: true,
    assetTag: true,
    name: true,
    category: { select: { name: true } },
    status: { select: { name: true, color: true } },
  }
}
```

---

### 3. Asset Detail UI - Tab "Thiết bị đi kèm"

**File:** `src/app/assets/[id]/AssetDetailClient.tsx`

**Changes:**
- Thêm tab `'children'` vào state
- Thêm TabButton với icon Package
- Render table hiển thị: Mã tài sản, Tên, Danh mục, Trạng thái

---

## User Experience

| Test Case | Expected Result |
|-----------|-----------------|
| IT xem chi tiết Laptop có chuột đi kèm | Thấy Tab "Thiết bị đi kèm (1)" |
| Click Tab "Thiết bị đi kèm" | Thấy bảng với chuột: Mã, Tên, Danh mục, Trạng thái |
| Employee login có Laptop + chuột | Dashboard: thấy 2 items (Laptop + chuột) |
| Employee tạo ticket | Chọn được cả Laptop và chuột |

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/helpdesk/my-assets/route.ts` | Thêm child assets vào query |
| `src/app/assets/[id]/page.tsx` | Thêm assignedToAssets data |
| `src/app/assets/[id]/AssetDetailClient.tsx` | Thêm Tab + Table UI |

---

## Sign-off

- [x] Code Review: Approved
- [ ] Visual Testing: Pending
- [ ] API Testing: Pending
