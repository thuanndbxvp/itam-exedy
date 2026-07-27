# SKILL-ROUTING: B1-B5 - Category & Settings CRUD Bundle

**Người lập:** Tier 1 (Planner)

## Routing Matrix

| Bước | Task | Recommended Agent/Skill | Reason |
|------|------|-------------------------|--------|
| 1 | `Settings` (B5) | `react-reviewer` + `backend-engineer` | Sửa lại form Settings hệ thống (chủ yếu là UI) |
| 2 | `Categories` (B1) | `react-reviewer` | Bổ sung các checkbox/text inputs còn thiếu vào form |
| 3 | `Status Labels` (B2) | `react-reviewer` | Thêm logic phân loại status type (deployable, pending...) |
| 4 | `Locations` (B3) | `react-reviewer` | Thêm các trường zip, city, state |
| 5 | `Departments` (B4) | `react-reviewer` | Thêm Dropdown chọn Manager, Location, Company |

## Skill Activation Order

```
1. Audit toàn bộ các thư mục trong `src/app/settings/` (categories, statuses, locations, departments).
2. Lần lượt mở file `page.tsx` (Bảng hiển thị) và file `Form.tsx` (Thêm/Sửa) của từng module.
3. So chiếu các form hiện tại với `schema.prisma` để biết những field nào trong Model có mà trong UI bị thiếu.
4. Bổ sung các input tương ứng. Update luồng Submit API (route.ts hoặc server actions) để nhận các trường mới.
```
