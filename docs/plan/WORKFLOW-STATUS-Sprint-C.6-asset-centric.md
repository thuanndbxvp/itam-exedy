# WORKFLOW STATUS - Sprint C.6: Asset-centric Tickets

**Start Date:** 28/07/2026  
**End Date:** 28/07/2026  
**Status:** ✅ DONE

---

## Task List

| # | Task | Status | Notes |
|---|------|--------|-------|
| C.6.1 | Analyze sprint requirements | ✅ DONE | Asset-centric tickets for IT |
| C.6.2 | Review related code | ✅ DONE | tickets API, permissions |
| C.6.3 | Implement features | ✅ DONE | 3 files changed |
| C.6.4 | Create acceptance docs | ✅ DONE | - |

---

## Features Delivered

### 1. IT Bypass Permission
- IT Staff có thể tạo ticket cho BẤT KỲ asset nào
- Employee vẫn bị giới hạn tài sản của mình

### 2. Search Assets API
- `GET /api/helpdesk/search-assets?q=<query>`
- Tìm kiếm case-insensitive
- Giới hạn 20 kết quả
- Chỉ IT staff được phép

### 3. Autocomplete UI
- Employee: Dropdown truyền thống
- IT Staff: Search input với autocomplete
- Debounce 300ms

---

## Files Changed

```
Modified:
  src/app/api/tickets/route.ts                    # Added IT bypass
  src/app/helpdesk/new/page.tsx                   # Added autocomplete UI

Created:
  src/app/api/helpdesk/search-assets/route.ts      # NEW Search API
```

---

## Related Sprints

| Sprint | Features |
|--------|----------|
| C.5 | Reports Menu |
| **C.6** | Asset-centric Tickets (IT) |
| C.7-C9 | Integrations (API Tokens, Email Templates, Channels) |
