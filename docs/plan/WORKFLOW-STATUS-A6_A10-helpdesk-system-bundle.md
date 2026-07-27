# WORKFLOW-STATUS: A6-A7-A10 Bundle

**Người lập:** Tier 1 (Planner)
**Coder:** Tier 2

## Trạng thái hiện tại
`[x] DONE`

## Lịch sử cập nhật
- **[2026-07-28]**: Tier 1 khởi tạo bản vẽ Bundle thứ 2, chốt sổ Sprint A. Chờ Tier 2 nhận việc.
- **[2026-07-28]**: Tier 2 hoàn thành trọn bundle trong 1 session. Pushed 5 commits (HEAD = `5620a37`).

## Commits
| Feature | Commit | Note |
|---------|--------|------|
| A10 | `057c0b3` | chore(audit): Consolidate duplicate audit-log pages |
| A7 Part 1 | `dfefe96` | feat(helpdesk): Helpdesk Team CRUD API + helpdesk.manage_teams perm |
| A7 Part 2 | `3a9af7a` | feat(helpdesk): Helpdesk Teams CRUD UI |
| A6 | `62f18b0` | feat(helpdesk): Ticket filter bar (priority + team + assignee) |
| (lint) | `5620a37` | chore(lint): cleanup unused vars |

## Acceptance Status

### A6 - Ticket Filter
- [x] **A6_1.** Trang Helpdesk có thanh bộ lọc priority/team/assignee (mỗi cái qua URL searchParams)
- [x] **A6_2.** Chọn Priority = HIGH → URL `?priority=HIGH` → API filter theo đúng priority
- [x] **A6_3.** Filter team + assignee hoạt động cùng với status filter (multi-filter)
- [x] **A6_4.** Có nút "Xóa bộ lọc" clear hết params (giữ tab)

### A7 - Helpdesk Team CRUD
- [x] **A7_1.** Tạo mới Helpdesk Team ở `/settings/helpdesk-teams`
- [x] **A7_2.** Gán một hoặc nhiều User vào Team (multi-select với role badge)
- [x] **A7_3.** Xóa Team (soft-delete → set isActive=false). BLOCK nếu còn ticket OPEN
- [x] **A7_4.** Có thể chọn Lead (ADMIN/IT_MANAGER dropdown)

### A10 - Audit Log Consolidate
- [x] **A10_1.** Sidebar chỉ có 1 link "Nhật ký" → `/settings/audit-log`
- [x] **A10_2.** Trang `/audit-log` (root) đã bị xóa
- [x] **A10_3.** 3 internal links (dashboard widget + AuditLogTable pagination) đã cập nhật về `/settings/audit-log`

### Security & Auth
- [x] **S1.** CRUD Helpdesk Team chỉ dành cho `helpdesk.manage_teams` (IT_MANAGER only)
- [x] **S2.** DELETE Team block nếu còn ticket OPEN (status in NEW/ASSIGNED/IN_PROGRESS/PENDING) → trả 409 INVALID_STATE

## Features Deferred (documented, not lost)
- **Audit log cho Team CRUD**: ItemType enum chưa có `TEAM` value → skip ActionLog. TODO: migrate enum `ItemType` trong `prisma/schema.prisma`.
- **Direct sidebar link tới `/settings/helpdesk-teams`**: Admin phải vào qua `/settings` index page (đã có sẵn). Có thể thêm sau nếu được yêu cầu.

## Quality Gates
- [x] `npx tsc --noEmit` → clean
- [x] `npx next build` → ✓ Compiled successfully (16.6s)
- [x] `npx eslint` → 0 errors / 0 warnings mới (1 pre-existing `Date.now()` error tại `helpdesk/page.tsx:295` không thuộc scope task này - từ commit `3d76b9e7`)
