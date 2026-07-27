# SKILL-ROUTING: Sprint A.5 - License-Asset Transitive UI

**Người lập:** Tier 1 (Planner)

## Routing Matrix

| Bước | Task | Recommended Agent/Skill | Reason |
|------|------|-------------------------|--------|
| 1 | `api/licenses/[id]/seats` endpoint | `backend-engineer` | Query database lấy seat rảnh |
| 2 | `api/licenses/checkout-seat` endpoint | `backend-engineer` | Giao diện API bọc quanh hàm có sẵn |
| 3 | Asset Detail Page (Thêm Tab License) | `react-reviewer` + `ui-styling` | Xử lý giao diện Tab và Table hiển thị |
| 4 | Asset Detail Page (Modal Gán) | `react-reviewer` | Modal 2 step (Chọn loại phần mềm -> Chọn seat) |
| 5 | User Detail Page (Thêm Tab License) | `react-reviewer` + `backend-engineer` | Query Prisma lồng cấp 2 (Transitive) và xử lý phân quyền xem |

## Skill Activation Order

```
1. (API) Viết 2 endpoint get list seat rỗng và endpoint submit checkout seat.
2. (UI Asset) Cập nhật src/app/assets/[id]/page.tsx và AssetDetailClient.tsx thêm tab.
3. (UI Asset) Code component AssignLicenseModal.
4. (UI User) Tạo folder src/app/settings/users/[id]/licenses/ và file page.tsx.
5. (UI User) Code logic chặn quyền (chỉ cho xem chính mình hoặc Admin) và render 2 bảng (Direct + Transitive).
```
