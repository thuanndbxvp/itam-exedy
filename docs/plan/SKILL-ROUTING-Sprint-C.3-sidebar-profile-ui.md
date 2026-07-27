# SKILL-ROUTING: Sprint C.3 - Sidebar & Profile Redesign

**Người lập:** Tier 1 (Planner)

## Routing Matrix

| Bước | Task | Recommended Agent/Skill | Reason |
|------|------|-------------------------|--------|
| 1 | Cấu trúc lại `Sidebar.tsx` | `react-reviewer` hoặc `frontend-engineer` | Thay đổi cấu trúc mảng và JSX render |
| 2 | Sửa Layout Profile (`layout.tsx`) | `react-reviewer` | Thay đổi flex-row thành flex-col |
| 3 | Chuyển `UserPanelNav` sang Tabs | `react-reviewer` | Tailwind CSS styling (flex-row, border-b) |

## Skill Activation Order
1. Truy cập `src/components/Sidebar.tsx`, xóa `SETTINGS_GROUPS`.
2. Tạo mảng cấu trúc 5 Nhóm như trong MSEW. Sửa logic render từ Dropdown sang Group Headers.
3. Truy cập `src/app/account/layout.tsx`, đổi layout div bọc ngoài sang flex-col.
4. Truy cập `src/components/account/UserPanelNav.tsx`, dùng Tailwind dàn các item theo hàng ngang (`flex`, `space-x-4`), bỏ cột dọc. Dùng biến `isActive` để thêm viền gạch chân màu xanh (`border-b-2 border-blue-600`).
