# SKILL-ROUTING: A6-A7-A10 Bundle

**Người lập:** Tier 1 (Planner)

## Routing Matrix

| Bước | Task | Recommended Agent/Skill | Reason |
|------|------|-------------------------|--------|
| 1 | Lọc Ticket bằng searchParams (A6) | `react-reviewer` + `backend-engineer` | Server component fetching và Prisma query |
| 2 | CRUD Helpdesk Team (A7) | `backend-engineer` + `ui-styling` | Tạo form liên kết N-N giữa Team và User |
| 3 | Xoá trang Audit thừa (A10) | `generalPurpose` | File deletion, cập nhật routes/Sidebar |
| 4 | Test & Commit | Tier 2 | |

## Skill Activation Order

```
1. (A6) Sửa src/app/helpdesk/page.tsx và tạo TicketFilterBar component.
2. (A7) Dựng CRUD API + UI cho /settings/helpdesk-teams.
3. (A10) Tìm và xoá trang Audit Log bị duplicate, sửa Sidebar cho chuẩn.
4. tsc + build
5. Commit
```
