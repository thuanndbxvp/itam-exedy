# Acceptance Criteria - Sprint C.6: Asset-centric Tickets

**Date:** 28/07/2026  
**Status:** DONE

---

## Mục tiêu

Cho phép IT Staff tạo ticket (Work Order / Task bảo trì) cho **BẤT KỲ** thiết bị hoặc phần mềm nào trong công ty, không cần mượn danh nghĩa người khác.

---

## Features Implemented

### 1. API Unlock — IT Staff Bypass Permission Check

**File:** `src/app/api/tickets/route.ts`

**Before:**
```typescript
if (reportedAssetId) {
  const ok = await canReportForAsset(user.id, reportedAssetId);
  if (!ok) throw new ForbiddenError("Bạn không có quyền báo lỗi cho tài sản này.");
}
```

**After:**
```typescript
const isIT = ['ADMIN', 'IT_MANAGER', 'IT_STAFF'].includes(user.role);

if (reportedAssetId && !isIT) {
  const ok = await canReportForAsset(user.id, reportedAssetId);
  if (!ok) throw new ForbiddenError("Bạn không có quyền báo lỗi cho tài sản này.");
}
```

**Result:** IT Staff có thể tạo ticket cho bất kỳ asset nào.

---

### 2. Search Assets API

**File:** `src/app/api/helpdesk/search-assets/route.ts`

**Endpoint:** `GET /api/helpdesk/search-assets?q=<query>`

**Features:**
- Tìm kiếm theo asset name hoặc assetTag
- Case-insensitive (mode: 'insensitive')
- Giới hạn 20 kết quả
- Chỉ IT staff được phép truy cập

**Response:**
```json
{
  "data": {
    "assets": [
      { "id", "assetTag", "name", "modelName", "categoryName" }
    ],
    "licenseSeats": []
  }
}
```

---

### 3. IT Search Autocomplete UI

**File:** `src/app/helpdesk/new/page.tsx`

**Features:**
- Detect IT role từ session
- Employee: Giữ nguyên dropdown truyền thống
- IT Staff: Search input với autocomplete dropdown
- Debounce 300ms để tránh gọi API quá nhiều
- Click outside để đóng dropdown
- Hiển thị selected asset

---

## User Experience

| Role | Before | After |
|------|--------|-------|
| EMPLOYEE | Dropdown tài sản của mình | Không đổi |
| IT_STAFF | Dropdown tài sản của mình | Search input autocomplete |
| IT_MANAGER | Dropdown tài sản của mình | Search input autocomplete |
| ADMIN | Dropdown tài sản của mình | Search input autocomplete |

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/tickets/route.ts` | Added IT bypass logic |
| `src/app/api/helpdesk/search-assets/route.ts` | **NEW** - Search API |
| `src/app/helpdesk/new/page.tsx` | Added IT autocomplete UI |

---

## Verification Checklist

- [x] Employee chỉ thấy tài sản của mình (dropdown)
- [x] IT Staff thấy search input autocomplete
- [x] IT Staff search "Dell" → hiển thị gợi ý
- [x] IT Staff tạo ticket cho máy người khác → thành công
- [x] Ticket ghi nhận IT Staff là Reporter
- [x] Ticket liên kết đúng Asset đã chọn

---

## Sign-off

- [ ] Code Review: Approved
- [ ] Visual Testing: Passed
- [ ] API Testing: Passed
